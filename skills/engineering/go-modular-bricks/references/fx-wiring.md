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

## Runtime profile

Select the profile from the task, explicit project standards, or an accepted ADR. When
neither specifies one, preserve the established composition; a new composition
uses the decorated profile. Apply the selected profile consistently to CLI,
HTTP, cross-module callers, and composition tests.

- Direct profile: provide `usecase.NewOrderConfirmUseCase` directly and inject
  `*usecase.OrderConfirmUseCase`. Keep outbound dependencies behind ports.
  A generic executor interface, wrapper, decorator factory, or telemetry module
  is unnecessary for this profile. Read [direct use cases](direct-use-cases.md)
  when creating or changing a use-case type or its direct registration, not
  for unrelated adapter bindings.
- Decorated profile: provide the raw constructor and publish
  `ucdecorator.UseCase[usecase.OrderConfirmInput, usecase.OrderConfirmOutput]`
  through one module-owned decorator provider. This boundary owns generic
  execution tracing and metrics. Read [decorated wiring](decorated-use-cases.md)
  when adding or changing that provider.

Examples using `ucdecorator` in other references illustrate the decorated
profile only. For direct projects, use the concrete pointer in those signatures
and omit decorator wiring. Load observability references only for affected
telemetry behavior or I/O instrumentation required by the selected project
contract, and only when permitted by project standards. Choosing a profile alone
does not select them.
Preserve structured logging and caller context in either profile.

## HTTP bindings

Provide each handler from its module composition root. Its constructor receives
the selected public use-case types, the established error renderer, and
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
infrastructure cannot build a dependency, revisit the selected flow contracts
rather than adding a hidden global.

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
