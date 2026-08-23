# HTTP middleware

## Recipe: add a scoped transport concern

Create module-owned middleware only when the module owns a real HTTP concern.
Place it in `internal/modules/<module>/http/chi/middleware/<name>_middleware.go`
beside the router. Keep cross-module technical middleware in shared
infrastructure. Keep the file order as imports, concrete type when dependencies
exist, pointer constructor, middleware method, then private methods.

Middleware may establish transport context, enforce a transport concern, or
adapt request and response behavior for its scoped routes. It does not contain
business policy, call a repository, or replace a use case. Keep authorization
policy in its owning application boundary unless an explicit module transport
contract says otherwise.

Inject stateful middleware through the module composition root. Apply it in the
router to the smallest route group that needs it. The registration order is
part of the HTTP contract, so keep it explicit and test a group when order
changes. A stateless transport enrichment stays a package function.

```go
type previewKey struct{}

func SetPreviewContext(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		preview := strings.EqualFold(strings.TrimSpace(r.Header.Get("X-Catalog-Preview")), "true")
		ctx := context.WithValue(r.Context(), previewKey{}, preview)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
```

Use the project error renderer as a constructor dependency when stateful
middleware can reject a request. Define an expected transport error in the
owner module's `errs/errs.go` only when it has a stable module meaning, and add
every locale entry before returning it. Middleware that only enriches context
has no typed error, locale, logger, port, or Fx binding.

```go
func (r *ProductRouter) Setup(server *chi.Server) {
	router := server.Router()
	router.Group(func(group chi.Router) {
		group.Use(middleware.SetPreviewContext)
		group.Post("/api/v1/products", r.handler.HandleCreateProduct)
	})
}
```

Reuse the server's established request context, response, and error handling.
Do not build a second response envelope or bypass the shared error renderer.

## Check before finishing

- The middleware owns only a transport concern and never calls a repository,
  provider, or use case.
- Stateful middleware has a pointer constructor and is provided from the owner
  module's `fx.go`; a stateless package function needs neither.
- The router applies it only to its intended group and preserves order.
- A changed middleware has a focused HTTP test for context propagation,
  rejection rendering, and group scope where applicable.
