# Ports

## Recipe: define an outbound dependency

Create a port in `internal/modules/<module>/ports/` when application policy
needs a replaceable collaborator that performs I/O or represents another
boundary. The consumer owns the interface. Name the file after its role, such as
`order_repository.go`, `token_issuer_service.go`, or `session_cache.go`.

Write a complete comment on the exported interface. State its business purpose,
its absence behavior, and any consistency rule that the method names do not
show. The implementation gets no boilerplate comments.

```go
package ports

import (
	"context"

	"example.com/project/internal/modules/order/model"
)

// OrderRepository persists orders for application operations. FindByID returns
// the module's not-found error when no order exists.
type OrderRepository interface {
	FindByID(ctx context.Context, id uint64) (model.OrderModel, error)
	Create(ctx context.Context, order model.OrderModel) (model.OrderModel, error)
}
```

Use module-owned models and DTOs in signatures. Do not expose `*gorm.DB`, an
HTTP request, a provider SDK type, a Redis client, adapter configuration, or
another module's internal package. Put `context.Context` first whenever the
method does I/O.

## Match the port to its implementation category

| Need | Port location and naming | Implementation location |
| --- | --- | --- |
| Persistence | `ports/<entity>_repository.go`, `XxxRepository` | `repository/<entity>_repository.go` |
| External or reusable service | `ports/<name>_service.go`, `XxxService` | `service/<name>_service.go` |
| Internal remote service | `ports/<name>_client.go`, `XxxClient` | `client/<name>_client.go` |
| Third-party capability | `ports/<name>_provider.go`, `XxxProvider` | `provider/<name>_provider.go` |
| Reusable validation | `ports/<name>_validator.go`, `XxxValidator` | `validator/<name>_validator.go` |
| Redis storage | `ports/<name>_cache.go`, `XxxCache` | `cache/<name>_cache.go` |

Choose a narrow method named for the application need. A repository may expose
`FindByEmail` when that is the query policy requires, rather than a generic
query builder. A cache port exposes `Get`, `Set`, and `Delete`, not its TTL.

## Recipe: implement and bind the port

The concrete adapter asserts the interface immediately below its type and its
normal constructor returns a pointer.

```go
type OrderRepository struct {
	*database.ProjectDB
}

var _ ports.OrderRepository = (*OrderRepository)(nil)

func NewOrderRepository(db *database.ProjectDB) *OrderRepository {
	return &OrderRepository{ProjectDB: db}
}
```

Bind the implementation in the owning module's `fx.go`:

```go
fx.Provide(
	fx.Annotate(
		repository.NewOrderRepository,
		fx.As(new(ports.OrderRepository)),
	),
)
```

Inject `ports.OrderRepository` into the use case. Do not inject
`*repository.OrderRepository`. A pure helper does not need a port. Put it in a
mapper or a pure service until a real collaborator boundary appears.

## Check before finishing

- The port is in the consuming module and describes only what that policy needs.
- Its signature contains application-owned values and context for I/O.
- The interface comment explains non-obvious behavior.
- The adapter has a compile-time assertion and pointer-returning constructor.
- Fx binds the concrete type with `fx.As(new(ports.Xxx))`.
