# API documentation

Load this contract only when the requested change includes API documentation or
the repository explicitly requires it for the affected endpoint. A route change
alone does not require a documentation update.

## Annotations

Use the project's existing OpenAPI or Swagger generator and conventions. For
each documented operation, describe its method and versioned path, summary,
request body, path and query parameters, successful response DTO and status,
expected error statuses, and required security scheme.

Document transport DTOs and the shared error shape. Do not publish application
outputs, persistence models, provider types, internal errors, or implementation
details. Keep annotations next to the handler only when that is the local
generator's convention.

Regenerate checked-in documentation only when the project uses generated
artifacts and the change affects them. Run the generator configured by that
project, then review the generated route, schemas, and status codes against the
handler.

## Examples

### Good

```go
import (
	"net/http"

	brickserrs "github.com/cristiano-pacheco/bricks/pkg/errs"
	"github.com/cristiano-pacheco/bricks/pkg/http/response"
)

// @Summary Create a product
// @Tags Products
// @Accept json
// @Produce json
// @Param request body dto.CreateProductRequest true "Product data"
// @Success 201 {object} response.Envelope[dto.ProductResponse]
// @Failure 422 {object} brickserrs.Error
// @Router /api/v1/products [post]
func (h *ProductHandler) HandleCreateProduct(w http.ResponseWriter, r *http.Request) {}
```

### Bad

```go
// @Summary Create product
// @Router /products [post]
func (h *ProductHandler) HandleCreateProduct(w http.ResponseWriter, r *http.Request) {}
```
