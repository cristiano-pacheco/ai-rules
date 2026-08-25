# API documentation

Load this contract only when the requested change includes API documentation or
the repository explicitly requires it for the affected endpoint. A route change
alone does not require a documentation update.

## Recipe: document an opted-in operation

Follow the project's existing OpenAPI or Swagger generator and conventions.
When local convention requires annotations above the handler, put them there.
For each documented operation, state its summary, description, plural tag,
accepted and produced media types, exact versioned path and method, every path
or query parameter, request DTO, success status and response DTO, each expected
error status, and required security scheme.

Use `brickserrs.Error` for every documented error response. Add
`@Security BearerAuth` only when the route requires that named scheme. A
no-content success has only its status and description, not a response schema.

Document transport DTOs and the shared error shape. Keep application outputs,
persistence models, provider types, internal errors, and implementation details
out of the published contract.

Regenerate checked-in documentation only when the project uses generated
artifacts and the change affects them. Run the project's configured generator,
then compare its route, schemas, parameter requiredness, security scheme, and
status codes with the handler. Report the exact generator command and result.

## Examples

### Create operation

```go
import (
	"net/http"

	brickserrs "github.com/cristiano-pacheco/bricks/pkg/errs"
	"github.com/cristiano-pacheco/bricks/pkg/http/response"
)

// @Summary Create a product
// @Description Creates one product from the supplied request body.
// @Tags Products
// @Accept json
// @Produce json
// @Param request body dto.CreateProductRequest true "Product data"
// @Success 201 {object} response.Envelope[dto.ProductResponse] "Created"
// @Failure 400 {object} brickserrs.Error "Malformed request"
// @Failure 422 {object} brickserrs.Error "Business validation failed"
// @Failure 500 {object} brickserrs.Error "Internal server error"
// @Router /api/v1/products [post]
func (h *ProductHandler) HandleCreateProduct(w http.ResponseWriter, r *http.Request) {}
```

### Path parameter and authenticated operation

```go
// @Summary Get a product
// @Description Returns the product identified by its numeric ID.
// @Tags Products
// @Produce json
// @Security BearerAuth
// @Param id path int true "Product ID"
// @Success 200 {object} response.Envelope[dto.ProductResponse] "OK"
// @Failure 400 {object} brickserrs.Error "Invalid product ID"
// @Failure 401 {object} brickserrs.Error "Unauthenticated"
// @Failure 404 {object} brickserrs.Error "Product not found"
// @Failure 500 {object} brickserrs.Error "Internal server error"
// @Router /api/v1/products/{id} [get]
func (h *ProductHandler) HandleGetProduct(w http.ResponseWriter, r *http.Request) {}
```

## Check before finishing

- Annotations describe the DTOs rendered by the handler, never application,
  persistence, provider, or internal error types.
- The documented path, method, parameters, status codes, error shape, and
  security scheme exactly match the route and handler.
- Run the configured generator only for this opted-in contract. Review and
  commit changed generated artifacts when the project tracks them.
