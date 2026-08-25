# Fx composition

Each module's `fx.go` is its composition root. It connects application policy
to adapters and contributes the module's runtime behavior to the application.

Constructors return pointers to concrete implementations. Fx binds a concrete
adapter to the consumer-owned interface it implements. Keep a compile-time
interface assertion with an exported adapter when that assertion documents the
binding.

Register every contribution in the owner module: typed module configuration,
adapters, raw use cases, decorated use cases, handlers, middleware, routes,
and owned migration, locale, or asset file systems. Use Fx groups and result
tags for multi-provider contributions so the application can collect them.

Expose raw use cases to composition and integration code. Publish the decorated
use-case contract to entry points when the application applies common behavior
such as metrics, tracing, or error translation there.

## HTTP bindings

Provide each handler from its module composition root. Its constructor receives
the decorated public use-case contracts, the established error renderer, and
the logger. The handler is an inbound adapter, not a port published to another
module.

## Persistence and integration bindings

Build the shared database once in the application composition root. Its
constructor owns driver setup and shutdown. A module binds each repository,
client, provider, or cache implementation where it owns the matching port.
Do not provide a cache implementation for a module that does not use one.

```go
var Module = fx.Module(
	"orders",
	fx.Provide(
		fx.Annotate(repository.NewOrderRepository, fx.As(new(ports.OrderRepository))),
		fx.Annotate(repository.NewTransactionProvider, fx.As(new(ports.TransactionProvider))),
		fx.Annotate(client.NewInventoryClient, fx.As(new(ports.InventoryClient))),
		fx.Annotate(provider.NewReceiptProvider, fx.As(new(ports.ReceiptProvider))),
		fx.Annotate(cache.NewOrderCache, fx.As(new(ports.OrderCache))),
	),
)
```

The last binding belongs in this module only when an order flow uses the cache.
Bind `TransactionProvider` only when the module has a use-case transaction.
Register each module `migration.FileSystem` with
`group:"migration_filesystems"`. The Bricks migration runner collects that
group from the same Fx graph used by the server and migration command.

## Route group

Publish each router as the Bricks Chi route contribution expected by the
server. Bind the concrete router as `chi.Route` and tag the result with
`group:"routes"` so the server discovers it. Register module-owned middleware
through the same composition root and inject it into the router with an
explicit name or group.

Keep bindings close to their constructors. If the selected modules and shared
infrastructure cannot build a dependency, update the impact map rather than
adding a hidden global.

## Examples

### Good

```go
import (
	"github.com/cristiano-pacheco/bricks/pkg/http/server/chi"
	"go.uber.org/fx"
)

var Module = fx.Module(
	"catalog",
	fx.Provide(
		fx.Annotate(repository.NewProductRepository, fx.As(new(ports.ProductRepository))),
		handler.NewProductHandler,
		fx.Annotate(
			router.NewProductRouter,
			fx.As(new(chi.Route)),
			fx.ResultTags(`group:"routes"`),
		),
	),
)
```

### Bad

```go
func NewServer() *http.Server {
	repository := repository.NewProductRepository(globalDB)
	handler := handler.NewProductHandler(repository)
	return httpServer(handler)
}
```
