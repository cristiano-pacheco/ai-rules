# Data flow

This contract defines the dependency and representation invariants for every
REST and CLI flow. A local convention may change naming or mechanics. It may
change an invariant only when an applicable ADR in `docs/adrs` explicitly
justifies the violation for that context.

## REST flow

```text
HTTP request -> HTTP DTO -> Handler -> decorated use case -> Port -> Adapter -> Infrastructure
                              |
HTTP response <- response DTO <-+--- use-case output or typed error
```

The handler parses transport values, maps them to an explicit use-case input,
executes exactly one decorated use case, maps its output, and writes the HTTP
response through the project's established Bricks response path.

## Business CLI flow

```text
Cobra command -> flag and argument mapping -> decorated use case -> Port -> Adapter -> Infrastructure
       |
       +--- command output or error <- use-case output or typed error
```

A business command maps its boundary values to one use-case input and executes
exactly one decorated use case. It does not reproduce application policy.

## Persistence flow

```text
Use case
    |
    v
Repository port
    |
    v
Repository adapter
    |
    +-> create/update/delete input:  model.X value
    +-> create/update/delete output: model.X value
    +-> read output: model.X, []model.X, or model.XView values
    |
    v
GORM -> Database
```

A repository read receives identifiers, primitives, or persistence criteria.
It returns module-owned GORM models by value. Scalar metadata such as a total
may accompany a collection. A projection over multiple tables may return a
value view declared in `model`, such as `model.OrderItemView`. Creates, updates,
and deletes receive and return module-owned GORM models by value. Repository
port signatures contain no pointers to models and no HTTP or application DTOs.
An implementation may pass pointers internally when the GORM API requires them.

## Infrastructure CLI flow

```text
server command    -> Fx application lifecycle
migration command -> Fx migration runner

No use case participates in either flow.
```

Server and migration commands are infrastructure entry points. They compose
and run infrastructure instead of invoking application policy.

## Dependency invariants

| Source | May call or depend on | Boundary rule |
| --- | --- | --- |
| HTTP handler | Exactly one decorated use case | No repository, cache, client, provider, concrete adapter, or database |
| Business CLI | Exactly one decorated use case | No repository, cache, client, provider, concrete adapter, or database |
| Use case | Consumer-owned ports and another module's public use-case API | No HTTP DTO, command type, concrete adapter, or another module's internals |
| `ports` package | Interface declarations using module-owned contract types | No structs, DTO declarations, implementations, mappers, or concrete adapter state |
| Repository port | Repository interface using model values, primitives, and persistence criteria | No HTTP DTO, application DTO, provider type, or model pointer; `*gorm.DB` is allowed only by the explicit transaction contract |
| Repository adapter | Its port, module models, errors, and database mechanism | No HTTP or application DTO and no other module's internals |
| Other outbound adapter | Its consumer-owned port and technical mechanism | No inbound transport type or application policy |
| HTTP mapper | HTTP DTO and use-case contracts | No repository, provider representation, or GORM model crossing the HTTP boundary |
| Module `fx.go` | Concrete constructors and their contracts | It is the only module location that binds implementations to ports and publishes runtime contributions |

These calls always violate the flow unless an applicable ADR authorizes the
specific context:

```text
Handler      -X-> Repository, cache, client, provider, or database
Business CLI -X-> Repository, cache, client, provider, or database
Use case     -X-> Concrete adapter
Repository   -X-> HTTP DTO or application DTO
HTTP or CLI  -X-> GORM model
```

A use case may use models owned by its module as internal persistence values.
Its public input and output remain application contracts and contain no GORM
models. Calls into another module use only that module's public use-case API.

## Representation boundaries

Map each representation where ownership changes:

```text
transport DTO <-> use-case input/output <-> port values <-> adapter values
```

Transport DTOs belong to HTTP. Use-case inputs and outputs belong to one
operation. Shared application DTOs may appear in non-repository port signatures
but are declared in the module's `dto` package. GORM models and persistence
views belong to `model`. Provider and client payloads stay inside their
adapters.

Expected business outcomes cross boundaries as stable module errors. Technical
failures retain their identity until the established entry-point error path
renders or reports them.

## Project conventions

Inspect the closest comparable flow for package names, constructors, logging,
mapping helpers, response helpers, Fx decoration, and test setup. Follow that
precedent when it does not conflict with an invariant. Logger injection in a
use case is allowed but not required; preserve the project's local convention.
