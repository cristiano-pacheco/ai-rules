# HTTP routers

## Responsibility

A module router belongs in `http/chi/router/`. It owns paths, HTTP methods,
route groups, and middleware scope. Application policy, validation, persistence,
provider calls, and response mapping belong elsewhere.

## Structure

Create `internal/modules/<module>/http/chi/router/<resource>_router.go` in
`package router`. Keep imports, router type, pointer constructor, then the
exact `Setup(server *chi.Server)` method. A router holds handler pointers only.
It gets the Chi router from `server.Router()` before registering routes.

```go
package router

import (
	"github.com/cristiano-pacheco/bricks/pkg/http/server/chi"
	"example.com/project/internal/modules/catalog/http/chi/handler"
)

type ProductRouter struct {
	handler *handler.ProductHandler
}

func NewProductRouter(handler *handler.ProductHandler) *ProductRouter {
	return &ProductRouter{handler: handler}
}

func (r *ProductRouter) Setup(server *chi.Server) {
	router := server.Router()
	router.Get("/api/v1/products", r.handler.HandleListProducts)
	router.Get("/api/v1/products/{id}", r.handler.HandleGetProduct)
	router.Post("/api/v1/products", r.handler.HandleCreateProduct)
	router.Put("/api/v1/products/{id}", r.handler.HandleUpdateProduct)
	router.Delete("/api/v1/products/{id}", r.handler.HandleDeleteProduct)
}
```

## HTTP contract

Use versioned paths below `/api/v1/`. Name resource path segments with plural
nouns. Use `{id}` for a resource identifier, nested resource paths for owned
sub-resources, and a verb suffix only for a non-CRUD state transition.

Use `GET` to retrieve a resource or collection, `POST` to create or trigger an
action, `PUT` for full replacement, `PATCH` for partial update, and `DELETE`
to remove a resource. Keep a bulk operation explicit in its path and method.

## Registration patterns

Register each handler method directly. A router may receive more than one
handler for closely related resources. Group routes when middleware applies to
only that group, keeping its scope visible and away from unrelated endpoints.

Register the concrete router from the owning module's Fx composition root as a
Bricks route contribution. The server discovers the route through its route
group rather than a manual registration outside the module.

```go
fx.Provide(
	fx.Annotate(
		router.NewProductRouter,
		fx.As(new(chi.Route)),
		fx.ResultTags(`group:"routes"`),
	),
)
```

## Naming

Name the type `<Resource>Router`, its constructor `New<Resource>Router`, and
its file `<resource>_router.go`. Use the matching `Handle...` method from the
handler when registering a route.

## Check before finishing

- The router file has the exact `Setup(server *chi.Server)` signature and only
  handler-pointer state.
- Every registration uses a direct `Handle...` method, a versioned plural path,
  and the conventional HTTP method.
- A route group names and scopes its middleware beside the registrations it
  affects.
- `fx.go` exposes the router once as `chi.Route` with `group:"routes"`.
- A changed route has handler coverage for its success and error boundary; add
  an integration test when the route changes the composed HTTP flow.
