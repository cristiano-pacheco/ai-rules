# HTTP middleware

Create module-owned middleware only when the module owns a real HTTP concern.
Place it beside the module router in `http/chi/middleware/`. Keep cross-module
technical middleware in shared infrastructure.

Middleware may establish transport context, enforce a transport concern, or
adapt request and response behavior for its scoped routes. It does not contain
business policy, call a repository, or replace a use case. Keep authorization
policy in its owning application boundary unless an explicit module transport
contract says otherwise.

Inject middleware through the module composition root. Apply it in the router
to the smallest route group that needs it. The registration order is part of
the HTTP contract, so keep it explicit and test a group when order changes.

Reuse the server's established request context, response, and error handling.
Do not build a second response envelope or bypass the shared error renderer.

## Examples

### Good

```go
type requestIDKey struct{}

func RequestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := context.WithValue(r.Context(), requestIDKey{}, r.Header.Get("X-Request-ID"))
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
```

### Bad

```go
func RequireActiveAccount(repo ports.AccountRepository) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			account, _ := repo.FindByID(r.Context(), r.Header.Get("Account-ID"))
			if !account.Active {
				http.Error(w, "inactive", http.StatusForbidden)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
```
