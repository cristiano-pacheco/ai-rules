# HTTP handlers

## Responsibility

A handler is a thin inbound adapter. Each method decodes one request, performs
transport validation and mapping, executes one public use case, maps the
result, and writes it through the established Bricks response handling.

## Structure

Keep the stateful handler cohesive. It holds only the public decorated
use-case contracts it invokes, the error renderer, and the logger. Its
constructor returns a pointer. Name endpoint methods with the `Handle` prefix.
Put a stateful helper, such as path parsing, on the handler. Keep pure reusable
mapping outside the handler.

Handlers contain no business decision, transaction, persistence query, or
direct provider call. They do not expose an application output as JSON.

## Context

Pass `r.Context()` to the use case. Decode JSON through the request helper
already established by Bricks or by the service. Let that helper preserve the
project's malformed-body and content-type behavior.

## Decode

Use the established request helper to decode the body into the request DTO.
Keep the DTO variable explicit before mapping it to the operation input.

## Path parameters

Read a path parameter with Chi, trim it, and parse it at the HTTP boundary. A
missing or malformed value becomes the module's typed bad-request error. The
use case receives the parsed application value, never a raw path string.

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

## Anti-patterns

Do not inject concrete use-case implementations into a handler. Do not skip
logging before error rendering. Do not write a raw response in place of the
shared response helper. Do not hide policy or persistence work in a handler
helper. Keep comments for non-obvious transport choices; method-body narration
adds no value.

## Examples

### Good

```go
import (
	"net/http"

	"github.com/cristiano-pacheco/bricks/pkg/http/request"
	"github.com/cristiano-pacheco/bricks/pkg/http/response"
	"github.com/cristiano-pacheco/bricks/pkg/logger"
	"github.com/cristiano-pacheco/bricks/pkg/ucdecorator"
)

type ProductHandler struct {
	createProduct ucdecorator.UseCase[usecase.CreateProductInput, usecase.CreateProductOutput]
	errorHandler  response.ErrorHandler
	logger        logger.Logger
}

func (h *ProductHandler) HandleCreateProduct(w http.ResponseWriter, r *http.Request) {
	var createRequest dto.CreateProductRequest
	if err := request.ReadJSON(w, r, &createRequest); err != nil {
		h.logger.Error("decode create product", logger.Error(err))
		h.errorHandler.Error(w, err)
		return
	}

	output, err := h.createProduct.Execute(r.Context(), usecase.CreateProductInput{Name: createRequest.Name})
	if err != nil {
		h.logger.Error("create product", logger.Error(err))
		h.errorHandler.Error(w, err)
		return
	}

	if err = response.JSON(w, http.StatusCreated, dto.ProductResponse{ID: output.ID, Name: output.Name}, http.Header{}); err != nil {
		h.logger.Error("write create product response", logger.Error(err))
		h.errorHandler.Error(w, err)
		return
	}
}
```

### Bad

```go
func (h *ProductHandler) HandleCreateProduct(w http.ResponseWriter, r *http.Request) {
	if r.URL.Query().Get("featured") == "true" {
		h.db.Exec("UPDATE products SET featured = true")
	}
	w.WriteHeader(http.StatusCreated)
}
```
