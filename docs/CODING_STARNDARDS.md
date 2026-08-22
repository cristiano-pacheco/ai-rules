# Go Coding Standards — Bricks Modular Architecture

## Purpose and use

This document is the mandatory review contract for Go services built with Bricks,
Chi, Fx, GORM, and PostgreSQL. Apply it to every code change. A pull request is
ready to merge only when every applicable **Required** rule is satisfied, its
verification evidence is present, and the quality gates pass.

Rules in this document are deterministic: each has an observable code location
or command that a reviewer can check. A rule that does not apply must be marked
`N/A` in the pull request with a short reason. Existing code in a touched file
or module must conform as part of the change; do not add new debt beside a
feature.

When a requirement cannot be followed, add an ADR before merging:

```text
docs/adr/NNNN-short-title.md
```

The ADR must state the context, the exact rule excepted, the chosen alternative,
the technical owner, and a removal condition or due date. An undocumented
exception blocks the review.

## Review protocol

Review in this order. Complete each step before moving to the next one.

1. Identify the changed module, operation, boundaries, owned data, and externally
   visible behavior.
2. Trace the complete success and error data flows described below.
3. Apply the layer contracts and the deterministic review matrix.
4. Confirm test coverage at the required boundary.
5. Confirm the pull request reports command results and that CI runs the same
   gates.

### Required quality gates

For every code change, the author and CI must run and report:

```bash
make lint
make test
make test-integration
```

`make lint` verifies the repository's configured static analysis and formatting
rules. This document does not duplicate its configuration. A nonzero exit status
from any required command blocks merging. Documentation-only changes may mark the
commands `N/A` with an explanation in the pull request.

## Architecture at a glance

The application is a modular monolith: one deployable process divided into
business capabilities. A module is a vertical slice under
`internal/modules/<module>/`; name it after its capability, such as `billing` or
`customer`, never after a technology.

```text
cmd/server.go (composition root)
  └─ Fx application
       ├─ Bricks platform modules
       ├─ internal/shared.Module
       └─ internal/modules/<module>.Module

internal/modules/<module>/
  ├─ fx.go                         module composition root
  ├─ config/                       module-owned configuration, when applicable
  ├─ usecase/                      application policy; one operation per file
  ├─ ports/                        outbound contracts consumed by use cases
  ├─ dto/                          application data shared by policy and adapters
  ├─ mapper/                       pure conversions, when a boundary needs one
  ├─ enum/                         validated typed values from external input
  ├─ errs/
  │   └─ errs.go                   expected-error catalogue
  ├─ repository/                   persistence adapters
  ├─ service/                      domain or external-capability adapters
  ├─ cache/                        cache adapters and no-op implementations
  ├─ client/                       provider-specific adapters distinct from service
  ├─ validator/                    reusable validation adapter, when applicable
  ├─ model/                        GORM persistence representations only
  ├─ http/
  │   ├─ dto/                      request and response transport contracts
  │   └─ chi/
  │       ├─ handler/              inbound HTTP adapters
  │       ├─ middleware/           module-owned HTTP concerns
  │       └─ router/               versioned route registration
  ├─ migrations/                   embedded up/down schema changes
  ├─ locales/                      embedded translations
  └─ ui/                           module-owned templates/assets, when applicable
```

Create only directories with a real responsibility: `config/`, `mapper/`,
`cache/`, `client/`, `validator/`, `migrations/`, `locales/`, `ui/`, and
`http/chi/middleware/` are optional. `internal/shared` is for cross-cutting
technical infrastructure with no business owner; business rules, entities, and
flows belong to their owning module.

## Canonical data flow

### HTTP success flow

Every endpoint must follow this flow, in this direction:

```text
HTTP request
  → Chi router and middleware
  → handler
  → HTTP request DTO
  → transport validation and explicit mapping
  → <Entity><Operation>Input
  → <Entity><Operation>UseCase.Execute(ctx, input)
  → input validation, business rules, and orchestration
  → consumer-owned port
  → repository / service / cache / client adapter
  → PostgreSQL, Redis, or external provider
  ← adapter result
  ← <Operation>Output
  ← explicit mapping to HTTP response DTO
  ← response.JSON from Bricks
HTTP response
```

The arrows are architectural boundaries, not optional abstractions. At each
boundary, convert representations explicitly. HTTP DTOs never reach a use case;
GORM models never reach a handler or become use-case input/output.

### HTTP error flow

```text
Request parse/transport failure
  → typed module error or Bricks transport error
  → shared Bricks error handler
  → standard HTTP error response

Expected business failure
  → errs.Err<Condition> (stable code, message, HTTP status)
  → handler passes error unchanged to the Bricks error handler
  → standard HTTP error response

Unexpected technical failure
  → adapter returns original error
  → use case preserves it unless context is necessary
  → handler passes it to the Bricks error handler
  → safe standard HTTP error response; no internal detail leaks to the client
```

Handlers do not choose status codes ad hoc. Use Bricks' response and error
mechanisms consistently: write successful output with `response.JSON(...)` and
delegate errors to the injected/shared Bricks error handler.

### Cross-module flow

A module may invoke another module only through its exported use-case API:

```text
consumer use case
  → injected *othermoduleusecase.<Operation>UseCase
  → Execute(ctx, othermoduleusecase.<Operation>Input)
  ← othermoduleusecase.<Operation>Output
```

Fx supplies that dependency. The consumer never constructs the foreign use case,
accesses its repository, model, HTTP package, router, Fx wiring, mapper,
validator, or internal errors. Keep dependencies one-way. A cycle requires an
explicitly owned contract/capability or ADR; it is not solved by mutual imports.

## Layer contracts

### Router and handler — Required

- Routers register versioned paths, middleware, and dependencies only.
- A handler performs exactly: decode → transport validate/map → execute one use
  case → map output → encode through Bricks response handling.
- Handler code contains no business decision, persistence query, transaction, or
  direct external-provider call.
- Request and response contracts live in `http/dto/`.
- Convert external enum strings through their typed constructors before policy
  consumes them.

### Use case — Required

- One operation per file, named `<entity>_<operation>_usecase.go`; for example,
  `customer_create_usecase.go`.
- Define `<Entity><Operation>Input`, `<Entity><Operation>Output`, and
  `<Entity><Operation>UseCase`. Its required method signature is:

  ```go
  func (uc *CustomerCreateUseCase) Execute(
      ctx context.Context,
      input CustomerCreateInput,
  ) (CustomerCreateOutput, error)
  ```
- Use cases own orchestration, authorization decisions, state transitions, and
  when business validation applies.
- Validate simple input constraints with Go validator tags (required, length,
  range, format). Put reusable business validation behind a port and implement it
  in `validator/` when it has a real adapter responsibility.
- Inject abstractions required by the operation. Do not inject `*gorm.DB`, an
  HTTP request/response, handler, router, or concrete repository.
- Inputs and outputs use application types only: no HTTP DTO, GORM model, or
  provider SDK type crosses this boundary.
- Use cases may emit logs, metrics, and traces for meaningful domain decisions,
  business events, and domain failures. The `ucdecorator` remains responsible for
  generic execution outcome and duration telemetry. Do not duplicate that generic
  telemetry or use policy code for adapter-level I/O spans.

### Ports and I/O adapters — Required

- The consumer owns each port in its `ports/` package. Design it around what the
  operation needs, not around a generic CRUD implementation.
- Repository, service, cache, and client constructors return their concrete type;
  Fx publishes it as the relevant port.
- Every I/O adapter method receives `context.Context` first and creates a trace
  span covering the I/O work.
- Every adapter declares a compile-time assertion, for example:

  ```go
  var _ ports.CustomerRepository = (*CustomerRepository)(nil)
  ```

- Adapters map infrastructure-specific expected conditions at their boundary;
  for example, a GORM not-found becomes the owning module's typed not-found
  error. Unexpected technical errors remain original errors.
- Optional capabilities use a no-op implementation behind the same port instead
  of feature flags spread through use cases.

### Persistence, representations, and migrations — Required

- GORM models are named `<Entity>Model`, implement `TableName()`, and contain no
  business or transport behavior.
- Repositories own queries and persistence mapping; they do not decide business
  policy.
- Persisted nullable fields use pointer types where the distinction is relevant.
- One module owns each table and its migrations. Other modules use its public
  use-case API, never its tables or migrations.
- Embed migrations in the owning module. Use immutable, ordered timestamp names
  and an up/down pair. Add a new migration rather than modifying one that may
  already have been applied.
- Register module migrations and other owned assets in `fx.go`; register modules
  in `cmd/server.go` and their migration file systems in `cmd/migrate.go`.

### Errors, enums, and responses — Required

- Declare every expected module failure in `errs/errs.go` using Bricks errors.
- Each expected error has a stable `<MODULE>_<NN>` code, a safe message, and its
  HTTP status. Treat the code as API compatibility.
- Return typed errors for expected validation, state, and not-found/conflict
  conditions. Preserve unexpected original errors.
- Typed enum constructors validate all external string values and return a typed
  module error when invalid.
- Success responses and errors use Bricks' established response conventions; no
  endpoint introduces a competing envelope or error body.

### Fx composition and configuration — Required

- `fx.go` is the module's only composition root. It wires ports to adapters, raw
  and decorated use cases, handlers, routes, configuration, and owned assets.
- `cmd/server.go` composes Bricks platform modules, `internal/shared.Module`, and
  every enabled business module. Modules do not start servers or goroutines at
  package initialization.
- Load configuration through Bricks. A module reads only `app.<module>` through a
  typed configuration object; it does not parse global YAML itself.
- Secrets are referenced as `env://VARIABLE_NAME`; do not commit, log, or place
  secret values in fixtures.

## Test contract

Test behavior at the smallest boundary that proves it, while preferring real
application boundaries over mocks.

| Changed behavior | Required evidence |
| --- | --- |
| Pure mapper, enum, deterministic validator, or isolated algorithm | Unit test beside the code; no mock unless unavoidable. |
| Use case | Integration test under `test/integration/modules/<module>/usecase/`, exercising real validation, repositories, migrations, and business flow. |
| Repository, persistence mapping, migration, cache, or infrastructure adapter | Integration test with owned real infrastructure and migration path. |
| HTTP handler, route, authentication/middleware, or error mapping | Handler/HTTP test proving request mapping and Bricks typed-error response behavior. |
| Bug fix | Regression test at the boundary that reproduced the bug. |

Integration tests:

- live under `test/integration/modules/<module>/<boundary>/` and begin with
  `//go:build integration`;
- use `bricks/pkg/itestkit` and Testcontainers for owned PostgreSQL, Redis, and
  other controlled infrastructure;
- apply migrations, isolate test data, and never rely on a developer's local
  database;
- may mock/fake only an uncontrolled external provider, such as an email,
  payment, or third-party API provider, through its port;
- do not mock repositories, the database, or other use cases in the normal
  integration flow.

## Deterministic review matrix

| Check | Required reviewer evidence |
| --- | --- |
| Ownership | Changed code belongs to one named business module or to truly generic shared infrastructure. |
| Flow | Reviewer can trace request/input to output/response and each boundary conversion. |
| Handler | Decode/map/execute/map/encode only; Bricks response/error handling is used. |
| Use case | One `<entity>_<operation>_usecase.go` file per operation; matching `<Entity><Operation>Input`, `<Entity><Operation>Output`, and `Execute` signature; application types only; policy is here. |
| Dependency direction | No concrete adapters, GORM, HTTP types, or foreign-module internals in a use case. |
| External module call | Only exported foreign `usecase` API (`UseCase`, `Input`, `Output`) is imported and injected by Fx. |
| Port/adapter | Consumer-owned port; compile-time assertion; context and span in every I/O method. |
| Data ownership | Model/table/migration accessed or changed only by its owning module. |
| Errors | Expected failures are stable Bricks typed errors; unexpected errors are preserved; no ad hoc status mapping. |
| Validation | Simple constraints use validator tags; reusable business validation has a clear port/validator boundary. |
| Observability | Decorator has generic telemetry; use-case telemetry is domain-specific; I/O spans are in adapters. |
| Composition | Fx registrations cover every new dependency, route, configuration, module, and owned asset. |
| Tests | Required boundary evidence exists and uses mocks only for uncontrolled external providers. |
| Gates | PR reports `make lint`, `make test`, and `make test-integration`; CI runs the same commands. |
| Exception | Any nonconformance has a complete ADR in `docs/adr/`. |

## Specialist skills

Use the applicable skill when it is available. Its output must satisfy every
rule in this document; if the skill is unavailable, implement the same contract
manually.

| Responsibility | Required skill |
| --- | --- |
| Use case | `go-usecase` |
| Port and GORM repository | `go-repository` |
| Domain or external service/client | `go-service` |
| Redis cache | `go-cache` |
| Validation adapter | `go-validator` |
| Typed errors | `go-error` |
| Validated enum | `go-enum` |
| GORM model | `go-gorm-model` |
| Pure mapper | `go-mapper` |
| Chi handler and router | `go-chi-handler`, `go-chi-router` |
| Unit and integration tests | `go-unit-tests`, `go-integration-tests` |

## Pull request checklist

Copy this checklist into every code pull request and mark each applicable item.

```markdown
### Coding standards
- [ ] I traced the success and error data flow end to end.
- [ ] The changed operation has one `<entity>_<operation>_usecase.go` file with matching Input, Output, and Execute types.
- [ ] HTTP DTOs, application types, and persistence models are explicitly mapped.
- [ ] Expected failures use module-scoped Bricks typed errors; unexpected errors are preserved.
- [ ] Handlers use Bricks response and error handling.
- [ ] I/O adapters have context-aware spans and compile-time port assertions.
- [ ] No foreign-module repository, model, HTTP, router, Fx, mapper, validator, or errors package is accessed.
- [ ] Cross-module calls use only injected exported use-case APIs.
- [ ] Required integration/HTTP/unit evidence was added; mocks cover only uncontrolled external providers.
- [ ] Fx, server, migrations, configuration, routes, and assets are registered where applicable.
- [ ] I used the applicable specialist skills, or documented that they were unavailable.

### Verification
- [ ] `make lint`
- [ ] `make test`
- [ ] `make test-integration`
- [ ] CI runs the same gates.

### Exception
- [ ] No exception is needed.
- [ ] Or: ADR `docs/adr/NNNN-short-title.md` is linked and includes owner and removal condition/date.
```
