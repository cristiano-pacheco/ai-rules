# Go Modular Architecture Rule

## Description
Generate and refactor Go code using this project modular architecture (`internal/modules/<module>`) with Fx DI, ports/usecase/repository boundaries, Chi HTTP adapters, typed domain errors, tracing, and use case metrics.

## Specialized Skills Map (`go-*`)

- `go-create-cache`: Redis cache adapters in `internal/modules/<module>/cache` with `ports` contracts.
- `go-create-chi-handler`: Chi handlers in `internal/modules/<module>/http/chi/handler`.
- `go-create-chi-router`: Chi routers in `internal/modules/<module>/http/chi/router`.
- `go-create-enum`: String-based enums in `internal/modules/<module>/enum`.
- `go-create-error`: Typed module errors in `internal/modules/<module>/errs/errs.go`.
- `go-create-gorm-model`: GORM persistence models in `internal/modules/<module>/model`.
- `go-create-repository`: Repository ports + implementations in `internal/modules/<module>/repository`.
- `go-create-service`: Reusable domain services in `internal/modules/<module>/service`.
- `go-create-usecase`: Business operations in `internal/modules/<module>/usecase`.
- `go-create-validator`: Validation ports + implementations in `internal/modules/<module>/validator`.
- `go-integration-tests`: Integration tests in `test/integration/...` with real infrastructure.
- `go-unit-tests`: Unit tests with testify suites/subtests and mocks.

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
- Keep business rules in `usecase` or in `validators` only.
- Keep handlers thin (decode request, call use case, map response).
- Keep repositories focused on persistence only (no business logic).
- Keep transport DTOs in `http/dto`; do not expose DB models directly in handlers.
- Use SQL migrations for any schema changes.

### 2. Dependency Direction
- `usecase` depends on `ports` interfaces, not concrete repositories.
- `repository` implements `ports` interfaces.
- `service` exposes interfaces in `ports` and implementations in `service`.
- `cache` exposes interfaces in `ports` and implementations in `cache`.
- `handler` depends on use case structs.
- `router` depends on handlers and only registers routes.
- Shared infrastructure comes from `internal/shared` (config, database, metrics).
- Contracts in `ports` can use module DTO structs from `internal/modules/<module>/dto` for method input/output.
- `ports` must contain only interfaces; shared contract structs belong in `dto`.

### 3. Fx Wiring Pattern (`fx.go`)
- Define one `Module = fx.Module("<module>", fx.Provide(...))` per module.
- Register repositories/validators with `fx.Annotate(..., fx.As(new(ports.X)))`.
- Register services/caches with `fx.Annotate(..., fx.As(new(ports.XService|ports.XCache)))`.
- Register routers as `chi.Route` and group routes with `fx.ResultTags(`group:"routes"`)`.
- Wire module in `cmd/server.go` alongside `shared.Module`.

### 4. UseCase Pattern
- Specialized skill: know more in `go-create-usecase`.
- Name files `*_usecase.go` and structs like `<Entity><Action>UseCase`.
- Expose a single public `Execute` method.
- Accept `context.Context` first.
- Use dedicated `Input`/`Output` structs with validation tags in input.
- Wrap execution with use case metrics:
  - `ObserveDuration("<usecase_name>", ...)`
  - `IncError("<usecase_name>")`
  - `IncSuccess("<usecase_name>")`
- Start tracing span inside business execution (`trace.Span`).

### 5. Repository Pattern
- Specialized skill: know more in `go-create-repository`.
- Name files `*_repository.go`.
- Implement compile-time interface checks:
  - `var _ ports.XRepository = (*XRepository)(nil)`
- Embed `*database.PingoDB` in repository structs.
- Use `gorm.G[model.X](r.DB)` generic API.
- Add tracing spans in each repository method.
- Map GORM not-found to domain/shared not-found error (`errs.ErrRecordNotFound`).

### 6. HTTP Adapter Pattern (Chi)
- Specialized skills:
  - Handlers: know more in `go-create-chi-handler`.
  - Routers: know more in `go-create-chi-router`.
- Handlers live in `http/chi/handler` and routers in `http/chi/router`.
- Handler flow:
  1. `ctx := r.Context()`
  2. Decode request DTO
  3. Map DTO -> use case input
  4. Execute use case
  5. Map output -> response DTO / status
  6. Delegate errors to shared error handler
- Router implements `Setup(server *chi.Server)` and registers versioned routes (e.g., `/api/v1/...`).

### 7. Error Pattern
- Specialized skill: know more in `go-create-error`.
- Place module errors in `internal/modules/<module>/errs/errs.go`.
- Define typed errors using `bricks/pkg/errs.New(code, message, status, details)`.
- Keep codes unique per module (`<MODULE>_<NN>` pattern).
- Use typed module errors from use cases, validators, and adapters instead of raw `errors.New(...)`.

Example custom error (from current codebase pattern):

```go
// internal/modules/export/errs/errs.go
var ErrSecretRequired = errs.New(
	"EXPORT_03",
	"secret is required",
	http.StatusBadRequest,
	nil,
)
```

### 8. Enum Pattern
- Specialized skill: know more in `go-create-enum`.
- Place enums in `enum/<name>_enum.go`.
- Include:
  1. String constants
  2. `valid...` map for O(1) validation
  3. Enum struct (`<Name>Enum`)
  4. Constructor (`New<Name>Enum`) that validates
  5. `String()` method
  6. Private validator (`validate<Name>`)
- Return typed module error from `errs` package on invalid enum values.

### 9. Model Pattern
- Specialized skill: know more in `go-create-gorm-model`.
- Keep persistence structs in `internal/modules/<module>/model`.
- Name structs `<Entity>Model` and keep file names as `*_model.go`.
- Add `TableName()` mapping for exact SQL table names.
- Use `database/sql` nullable types when DB columns are nullable.
- Keep models persistence-only; do not add business logic or transport DTO concerns.

### 10. Service Pattern
- Specialized skill: know more in `go-create-service`.
- Place contracts in `ports/<name>_service.go` and implementation in `service/<name>_service.go`.
- Place shared service input/output structs in `dto/<name>_dto.go`, and use them in both the `ports` interface and `service` implementation.
- Example: define `TemplateRendererInput` and `TemplateRendererOutput` in `internal/modules/export/dto`, then reference them in `ports.TemplateRendererService` and `service.TemplateRendererService`.
- Name both interface and implementation `XxxService` (package differentiates them).
- Add compile-time assertion in implementation:
  - `var _ ports.XxxService = (*XxxService)(nil)`
- Constructor must be `NewXxxService(...) *XxxService`.
- Single-action services should expose `Execute(ctx, input)`.
- Services with grouped responsibilities may expose descriptive methods.
- Methods performing I/O must accept `context.Context` first and use `trace.Span`.
- Services depend on ports (repositories/services/caches), never concrete adapters.

### 11. Cache Pattern
- Specialized skill: know more in `go-create-cache`.
- Place contracts in `ports/<name>_cache.go` and implementation in `cache/<name>_cache.go`.
- Cache structs are Redis-backed adapters and must satisfy `ports.XxxCache`.
- Define package-level key/TTL constants (for example `cacheKeyPrefix`, `cacheTTL` or min/max TTL range).
- Keep key generation in a private helper like `buildKey(...)`.
- Distinguish missing key from operational failure (`redis.Nil` means cache miss, not error).
- Use `Set/Get/Delete`-style API unless domain requires another shape.
- Apply randomized TTL ranges when high write bursts could cause synchronized expiration.

### 12. Validator Pattern
- Specialized skill: know more in `go-create-validator`.
- Split validator by contract and implementation:
  - `ports/<name>_validator.go`
  - `validator/<name>_validator.go`
- Keep validators stateless when possible.
- Use compile-time assertions:
  - `var _ ports.XxxValidator = (*XxxValidator)(nil)`
- Return typed module errors from `internal/modules/<module>/errs`.
- If validation performs I/O (e.g., DB lookup), accept `context.Context` first.

### 13. Testing Patterns
- Specialized skills:
  - Unit tests: know more in `go-unit-tests`.
  - Integration tests: know more in `go-integration-tests`.
- Unit tests:
  - Use `testify/suite` for structs with dependencies.
  - Use table/subtests for standalone functions.
  - Follow Arrange / Act / Assert sections.
- Integration tests:
  - Use `//go:build integration`.
  - Place files under `test/integration/...` mirroring `internal/...`.
  - Use real infrastructure dependencies (DB/Redis) and mock only external services.
  - Truncate/reset state between tests.

## Reference Pattern From This Codebase

- App entrypoint wires modules in `cmd/server.go` with `fx.New(...)`.
- Shared infra module is `internal/shared/fx.go`.
- Canonical module implementation is `internal/modules/monitor`:
  - Fx module: `internal/modules/monitor/fx.go`
  - Ports: `internal/modules/monitor/ports`
  - Use cases: `internal/modules/monitor/usecase`
  - Repositories: `internal/modules/monitor/repository`
  - Chi handlers/routers: `internal/modules/monitor/http/chi`

## Do Not

- Do not put business logic in handlers or repositories.
- Do not inject concrete repositories into use cases.
- Do not inject concrete services/caches into use cases; depend on `ports`.
- Do not return raw DB entities directly from HTTP handlers.
- Do not skip tracing and metrics in use case/repository methods.
- Do not bypass enum constructors when value comes from external input.
