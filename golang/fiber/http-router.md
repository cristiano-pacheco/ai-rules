# Go HTTP Router Pattern Rule

## Description
Generate Go HTTP routers for the Fiber framework following the established patterns in the codebase.

## Location & Naming

- **Directory**: `internal/modules/<module_name>/http/<router_name>/router` (e.g., `internal/modules/identity/http/fiber/router`)
- **Filename**: Must end with `_router.go` (e.g., `auth_router.go`)
- **Package**: `package router`

## Pattern

### 1. **Function Definition**
- Define a function named `SetupXRoutes` (e.g., `SetupAuthRoutes`).
- **Arguments**:
    - `r *router.FiberRouter`: The shared router wrapper.
    - `h *handler.XHandler`: The specific handler(s) for the routes.

### 2. **Route Registration**
- Get the underlying Fiber router instance: `router := r.Router()`.
- Register routes using HTTP methods (Post, Get, Put, Delete, etc.).
- **Path**: Use explicit paths starting with `/api/v1/` (or appropriate version).
- **Handler**: Pass the handler method (e.g., `h.Login`).

### 3. **Dependencies**
- Import the specific handler package.
- Import `github.com/cristiano-pacheco/go-bidding-service/internal/shared/modules/http/router`.

## Example

```go
package router

import (
	"github.com/cristiano-pacheco/go-bidding-service/internal/modules/identity/http/fiber/handler"
	"github.com/cristiano-pacheco/go-bidding-service/internal/shared/modules/http/router"
)

func SetupAuthRoutes(r *router.FiberRouter, h *handler.AuthHandler) {
	router := r.Router()
	router.Post("/api/v1/auth/login", h.Login)
	router.Post("/api/v1/auth/token", h.GenerateJWT)
}
```
