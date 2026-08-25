# HTTP handlers

## Responsibility

A handler is a narrow inbound adapter. Each method decodes one request, performs
transport validation and mapping, executes one public use case, maps the
result, and writes it through the established Bricks response handling.

## Structure

Create `internal/modules/<module>/http/chi/handler/<resource>_handler.go` in
`package handler`. Keep this order: imports, handler type, pointer constructor,
public `Handle...` methods, then stateful private methods. The type holds only
the decorated public use-case contracts it invokes, `response.ErrorHandler`,
and `logger.Logger`. Name endpoint methods with the `Handle` prefix. Keep a
stateful helper, such as path parsing, on the handler. Keep pure reusable
mapping outside the handler.

```go
type ProductHandler struct {
	productCreate ucdecorator.UseCase[usecase.ProductCreateInput, usecase.ProductCreateOutput]
	errorHandler  response.ErrorHandler
	logger        logger.Logger
}

func NewProductHandler(
	productCreate ucdecorator.UseCase[usecase.ProductCreateInput, usecase.ProductCreateOutput],
	errorHandler response.ErrorHandler,
	logger logger.Logger,
) *ProductHandler {
	return &ProductHandler{
		productCreate: productCreate,
		errorHandler:  errorHandler,
		logger:        logger,
	}
}
```

Register this constructor once in `internal/modules/<module>/fx.go` with
`fx.Provide(handler.NewProductHandler)`. The router receives the concrete
handler pointer. A handler does not implement a port.

Handlers contain no business decision, transaction, persistence query, or
direct provider call. They do not expose an application output as JSON.

## Context

Set `ctx := r.Context()` at the start of every handler and pass `ctx` to the
use case. Decode JSON through the request helper already established by Bricks
or by the service. Let that helper preserve the
project's malformed-body and content-type behavior.

## Decode

Use the established request helper to decode the body into the request DTO.
Keep the DTO variable explicit before mapping it to the operation input.

## Path parameters

Read a path parameter with Chi, trim it, and parse it at the HTTP boundary. A
missing or malformed value becomes the module's typed bad-request error. The
use case receives the parsed application value, never a raw path string.

```go
func (h *ProductHandler) parseProductID(r *http.Request) (uint64, error) {
	value := strings.TrimSpace(chi.URLParam(r, "id"))
	if value == "" {
		return 0, errs.ErrInvalidProductID
	}

	productID, err := strconv.ParseUint(value, 10, 64)
	if err != nil {
		return 0, errs.ErrInvalidProductID
	}
	return productID, nil
}
```

Define `ErrInvalidProductID` in `internal/modules/<module>/errs/errs.go` with
the next module code, a lowercase message, `http.StatusBadRequest`, and an
entry in every existing module locale. Do not allocate an error code inside the
handler.

## Operation patterns

List and get operations return a mapped response with the project's normal
successful JSON status. Create returns the established creation status. Update
and delete use the established no-content helper when they have no body. An
action endpoint follows the same one-use-case path as CRUD operations.

## Error boundary

When decoding, mapping, use-case execution, or response writing fails, log the
error with operation context, pass the original error to the established Bricks
error renderer, then return. Expected module errors keep their stable code and
status. Unexpected technical errors keep their identity until that renderer
produces the safe HTTP response.

Do not write status codes or error envelopes directly with `http.ResponseWriter`.
Do not create ad hoc error codes inside a handler.

## Responses

Use the project's Bricks JSON response helper for bodies and its no-content
helper for empty successful responses. Keep headers, envelopes, and error
shapes consistent with the server-wide response contract.

## Keep handlers narrow

Inject decorated public use-case contracts into handlers. Log errors before
rendering them, and write responses through the shared response helper. Keep
policy and persistence work in the use case or adapter. Reserve comments for
non-obvious transport choices; method-body narration adds no value.

## Examples

### Create operation

```go
import (
	"net/http"

	"github.com/cristiano-pacheco/bricks/pkg/http/request"
	"github.com/cristiano-pacheco/bricks/pkg/http/response"
	"github.com/cristiano-pacheco/bricks/pkg/logger"
	"github.com/cristiano-pacheco/bricks/pkg/ucdecorator"
	"example.com/project/internal/modules/catalog/http/dto"
	"example.com/project/internal/modules/catalog/usecase"
)

func (h *ProductHandler) HandleCreateProduct(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var createRequest dto.CreateProductRequest
	if err := request.ReadJSON(w, r, &createRequest); err != nil {
		h.logger.Error("decode create product", logger.Error(err))
		h.errorHandler.Error(w, err)
		return
	}

	output, err := h.productCreate.Execute(ctx, usecase.ProductCreateInput{
		Name: createRequest.Name,
	})
	if err != nil {
		h.logger.Error("create product", logger.Error(err))
		h.errorHandler.Error(w, err)
		return
	}

	productResponse := dto.ProductResponse{ID: output.ID, Name: output.Name}
	if err := response.JSON(w, http.StatusCreated, productResponse, http.Header{}); err != nil {
		h.logger.Error("write create product response", logger.Error(err))
		h.errorHandler.Error(w, err)
		return
	}
}
```

Use `response.JSON(w, http.StatusOK, value, http.Header{})` for a list or get,
the established creation status for a create, and `response.NoContent(w)` for
an update or delete with no body. Each handler method follows this order:
request context, path and body parsing, explicit input mapping, one use-case
call, explicit output mapping, then the response helper. Keep operation names
in log messages specific enough to identify the failed boundary.

### Invalid pattern

```go
func (h *ProductHandler) HandleCreateProduct(w http.ResponseWriter, r *http.Request) {
	if r.URL.Query().Get("featured") == "true" {
		h.db.Exec("UPDATE products SET featured = true")
	}
	w.WriteHeader(http.StatusCreated)
}
```
