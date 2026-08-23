# Fx composition

Treat each module's `fx.go` as its composition root. It connects the module's
application policy to adapters and contributes the module's runtime behavior to
the application.

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

Keep bindings close to the constructor that supplies them. When a dependency
cannot be built from the selected modules and shared infrastructure, update the
impact map instead of adding a hidden global.
