# Ports

## Recipe: define an outbound dependency

Create a port in `internal/modules/<module>/ports/` when application policy
needs a replaceable collaborator that performs I/O or represents another
boundary. The consumer owns the interface. Name the file after its role, such as
`order_repository.go`, `token_issuer_service.go`, or `session_cache.go`.

The `ports` package contains interface declarations only. Declare DTOs in the
module's `dto` package, models and persistence views in `model`, and every
implementation beside its technical mechanism. A port may reference those
module-owned types without declaring them locally.

Apply the project's comment policy to interfaces as well as implementations.
Document absence behavior and consistency rules only when names and signatures
cannot express them. Leave boilerplate comments off both.

```go
package ports

import (
	"context"

	"example.com/project/internal/modules/order/model"
)

type OrderRepository interface {
	FindByID(ctx context.Context, id uint64) (model.OrderModel, error)
	Create(ctx context.Context, order model.OrderModel) (model.OrderModel, error)
}
```

A non-repository port may reference module-owned application DTOs. A repository
port uses model values, primitive query values, or persistence criteria and
never an HTTP or application DTO. No port exposes an HTTP request, provider SDK
type, Redis client, adapter configuration, or another module's internal
package. Put `context.Context` first whenever the method does I/O.
`TransactionProvider` and repository `*TX` methods are the only GORM exception:
they receive or return `*gorm.DB` to run one explicit transaction.

## Match the port to its implementation category

| Need | Port location and naming | Implementation location |
| --- | --- | --- |
| Persistence | `ports/<entity>_repository.go`, `XxxRepository` | `repository/<entity>_repository.go` |
| I/O service not owned by a more specific category | `ports/<name>_service.go`, `XxxService` | `service/<name>_service.go` |
| Internal remote service | `ports/<name>_client.go`, `XxxClient` | `client/<name>_client.go` |
| Third-party capability | `ports/<name>_provider.go`, `XxxProvider` | `provider/<name>_provider.go` |
| Reusable validation | `ports/<name>_validator.go`, `XxxValidator` | `validator/<name>_validator.go` |
| Redis storage | `ports/<name>_cache.go`, `XxxCache` | `cache/<name>_cache.go` |
| Persistence transaction | `ports/transaction_provider.go`, `TransactionProvider` | `repository/transaction_provider.go` |

Choose a narrow method named for the application need. A repository may expose
`FindByEmail` when the query policy requires it, rather than exposing a generic
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

Inject `ports.OrderRepository` into the use case, not
`*repository.OrderRepository`. Mapping functions and pure services need no port
unless a project boundary explicitly requires one. Named validators are a
separate contract: they always have a consumer-owned port, including stateless
validators. Purity does not change that classification.

## Check before finishing

- The port is in the consuming module and describes only what that policy needs.
- The `ports` package contains interfaces only; contract types and implementations live elsewhere.
- A repository port contains model values and persistence criteria, never DTOs or model pointers.
- Other port signatures contain module-owned values and context for I/O, except the explicit `*gorm.DB` transaction contract.
- The interface comment explains non-obvious behavior.
- The adapter has a compile-time assertion and pointer-returning constructor.
- Fx binds the concrete type with `fx.As(new(ports.Xxx))`.
