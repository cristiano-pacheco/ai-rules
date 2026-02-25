# Go Modular Architecture

## Description
Generate and refactor Go code using this project's modular architecture (`internal/modules/<module>`) with Fx DI, ports/usecase/repository boundaries, Chi HTTP adapters, typed domain errors, OTEL tracing, and use case metrics via decorators.

## Specialized Skills Map

Each skill owns the full implementation details for its layer. Use the skill when generating that artifact.

| Skill | Generates | Location |
|---|---|---|
| `go-cache` | Redis cache adapters | `internal/modules/<module>/cache/` |
| `go-chi-handler` | Chi HTTP handlers | `internal/modules/<module>/http/chi/handler/` |
| `go-chi-router` | Chi route registration | `internal/modules/<module>/http/chi/router/` |
| `go-enum` | String-based enum types | `internal/modules/<module>/enum/` |
| `go-error` | Typed module errors | `internal/modules/<module>/errs/errs.go` |
| `go-gorm-model` | GORM persistence models | `internal/modules/<module>/model/` |
| `go-repository` | Repository ports + implementations | `internal/modules/<module>/repository/` |
| `go-service` | Reusable domain services | `internal/modules/<module>/service/` |
| `go-usecase` | Business operations | `internal/modules/<module>/usecase/` |
| `go-validator` | Validation ports + implementations | `internal/modules/<module>/validator/` |
| `go-integration-tests` | Integration tests with real infra | `test/integration/...` |
| `go-unit-tests` | Unit tests with testify suites/mocks | `*_test.go` files |

## Module Layout

Use this folder shape for each module:

```text
internal/modules/<module>/
├── cache/
├── dto/
├── enum/
├── errs/
├── fx.go
├── http/
│   ├── chi/
│   │   ├── handler/
│   │   └── router/
│   └── dto/
├── model/
├── ports/
├── repository/
├── service/
├── usecase/
└── validator/
```

## Architecture Rules

### 1. Layer Boundaries
- Business logic lives only in `usecase` and `validator`.
- Handlers are thin: decode request → call use case → map response → delegate errors.
- Repositories handle persistence only; no business logic.
- Transport DTOs live in `http/dto`; never expose DB models directly from handlers.

### 2. Dependency Direction
- `usecase` depends on `ports` interfaces, never concrete implementations.
- `repository`, `service`, and `cache` each expose a `ports` interface that consumers import.
- `ports` contains only interfaces; shared contract structs belong in `dto`.
- Shared infrastructure (config, database, metrics) comes from `internal/shared`.

### 3. Fx Wiring (`fx.go`)
- One `fx.Module("<module>", fx.Provide(...))` per module.
- Register repositories/validators via `fx.Annotate(..., fx.As(new(ports.X)))`.
- Register services/caches via `fx.Annotate(..., fx.As(new(ports.XService|ports.XCache)))`.
- Wrap raw use cases with `ucdecorator.Wrap(factory, raw)` — this applies metrics and tracing automatically.
- Register routers as `chi.Route` with `fx.ResultTags(`group:"routes"`)`.

### 4. UseCase Pattern → skill: `go-usecase`
- One file, one operation: `<operation>_usecase.go`, struct `<Operation>UseCase`, method `Execute`.
- Always define both `<Operation>Input` and `<Operation>Output` structs (empty when unused).
- Inject only `ports.*` interfaces (no concrete types, no logger, no metrics, no tracing).
- Observability (metrics + tracing) is applied externally by `ucdecorator` during Fx wiring — never inside the use case body.

### 5. Repository Pattern → skill: `go-repository`
- Two files: port interface in `ports/`, implementation in `repository/`.
- Compile-time assertion: `var _ ports.XRepository = (*XRepository)(nil)`.
- Add `trace.Span` in each method; map GORM not-found to `errs.ErrRecordNotFound`.

### 6. HTTP Adapter (Chi) → skills: `go-chi-handler`, `go-chi-router`
- Handlers in `http/chi/handler/`, routers in `http/chi/router/`.
- Handler flow: get context → decode DTO → map to use case input → execute → map output → write response.
- Router registers versioned routes (e.g., `/api/v1/...`) and knows nothing about business logic.

### 7. Error Pattern → skill: `go-error`
- All module errors in `internal/modules/<module>/errs/errs.go`.
- Use `bricks/pkg/errs.New("<MODULE>_<NN>", message, httpStatus, nil)`.
- Use typed errors from use cases, validators, and handlers — never raw `errors.New(...)`.

### 8. Enum Pattern → skill: `go-enum`
- File: `enum/<name>_enum.go`; validate in constructor via a `valid*` map for O(1) lookup.
- Return a typed module error from `errs` on invalid input.

### 9. Model Pattern → skill: `go-gorm-model`
- Structs are named `<Entity>Model`; always define `TableName()`.
- Use pointer types for nullable columns; no business logic or transport concerns in models.

### 10. Service Pattern → skill: `go-service`
- Three files: DTOs in `dto/`, port interface in `ports/`, implementation in `service/`.
- Both interface and struct are named `XxxService` (package differentiates them).
- Compile-time assertion; `context.Context` first on all I/O methods; use `trace.Span`.

### 11. Cache Pattern → skill: `go-cache`
- Two files: port interface in `ports/`, Redis implementation in `cache/`.
- `redis.Nil` is a cache miss, not an error. Use randomized TTL for bulk-written entries.

### 12. Validator Pattern → skill: `go-validator`
- Two files: port interface in `ports/`, implementation in `validator/`.
- Stateless when possible; compile-time assertion; return typed module errors.

### 13. Testing Patterns → skills: `go-unit-tests`, `go-integration-tests`
- Unit: `testify/suite` for structs with dependencies; table-driven subtests for pure functions; Arrange/Act/Assert.
- Integration: `//go:build integration`; files under `test/integration/...`; real DB/Redis; mock only external services.

## Do Not

- Do not put business logic in handlers or repositories.
- Do not inject concrete repositories, services, or caches into use cases — depend on `ports` interfaces.
- Do not add logger, metrics, or tracing code inside use cases — observability is handled externally by `ucdecorator`.
- Do not skip `trace.Span` in repository and service methods.
- Do not return raw DB models directly from HTTP handlers.
- Do not bypass enum constructors when a value comes from external input.
- Do not use raw `errors.New(...)` — always use typed module errors from `errs`.
