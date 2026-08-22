# Go Modular Architecture

## Purpose and scope

This document is the architectural and project-template baseline for new services. Its purpose is to reproduce a **modular Go platform DNA**: a modular monolith, organized as independently understandable business capabilities, with replaceable technical adapters and explicit operational behavior.

It is intentionally prescriptive. A new project may add a convention only when it does not contradict the invariants below; a change to an invariant requires an explicit architecture decision. Implementation skills contain the detailed templates for each artifact. This document defines *why*, *where*, *which dependencies are allowed*, and the repository shape required to bootstrap a project consistently.

## Reproducibility contract

With this guide, a request such as “create a Go modular shortener project” must be sufficient to create the **technical baseline** without asking for stack, layout, configuration, commands, migration, observability or test conventions. The creator must use the project shape and defaults in this document.

It cannot, and must not, invent irreversible product policy. A shortener still needs a decision about authentication, custom aliases, expiration, redirect status, analytics, abuse protection and tenancy. When a request omits those, create the smallest useful vertical slice, record its assumptions in the project README, and keep policy behind use cases/ports so it can change safely. Do not ask for technical choices already specified here.

### Default vertical slice for an underspecified project

For a project named `shortener`, the initial slice is a module named `shortener` with: create a short URL, resolve and redirect it, retrieve its metadata, and delete it. Use PostgreSQL persistence, an embedded migration, Chi routes below `/api/v1`, typed errors, a unit-tested use case, repository integration tests and handler tests. Authentication, custom aliases, expiration, analytics and rate limiting are absent unless the request includes them. The README must list these as assumptions—not silently treat them as product requirements.

## Repository blueprint

Every new project starts with this root structure. Names change with the project; responsibilities do not.

```text
.
├── main.go                         # only starts cmd.Execute; may embed tzdata for distroless images
├── cmd/                            # one Cobra command per executable operation
│   ├── root.go                     # root command and shared flags only
│   ├── server.go                   # HTTP process composition
│   ├── migrate.go                  # database migration command
│   └── <operation>.go              # explicit administrative/worker command, when required
├── config/
│   ├── base.yaml                   # complete, non-secret defaults; required
│   ├── local.yaml                  # optional local overlay
│   ├── test.yaml                   # optional test overlay
│   └── production.yaml              # optional production overlay
├── internal/
│   ├── modules/                    # business modules only
│   └── shared/                     # cross-cutting technical infrastructure only
├── test/
│   ├── integration/modules/        # mirrors module and tested-boundary structure
│   ├── e2e/                        # black-box tests against a running server, when needed
│   └── mocks/                      # generated mocks, when the project uses them
├── scripts/                        # reproducible local/CI helpers (e.g. Testcontainers setup)
├── docs/                           # project decisions and operational documentation
├── .env.example                    # names of required local secrets, never values
├── docker-compose.yaml             # local dependencies only
├── Dockerfile                      # production image
├── Makefile                        # stable developer and CI entry points
├── go.mod
└── go.sum
```

Do not place application code in `cmd`, tests that require infrastructure under `internal`, generated output in source directories, or business code in `internal/shared`.

### Required platform baseline

New projects use the Go version declared by the platform template (`go 1.26.3` at this document's revision) and initialize `go.mod` with the project's real module path. The baseline direct dependencies are the current compatible versions of:

| Concern | Required baseline |
|---|---|
| Application infrastructure | `github.com/cristiano-pacheco/bricks` |
| HTTP | `github.com/go-chi/chi/v5` |
| Composition | `go.uber.org/fx` |
| Persistence | `gorm.io/gorm` with PostgreSQL driver |
| CLI | `github.com/spf13/cobra` |
| Migrations | `golang-migrate/migrate` through `bricks` embedded migration support |
| Tests | `github.com/stretchr/testify`; `bricks/pkg/itestkit` / Testcontainers for integration |

Redis, authentication providers, email, PDF, Swagger and other provider SDKs are capability dependencies—not project defaults. Add them only when a module needs the capability, behind a port. Include `.golangci.yml`, `Dockerfile`, `docker-compose.yaml` and the Makefile in the initial commit; they are part of the template, not later operational polish.

### Executable and command conventions

`main.go` is deliberately boring: it imports `cmd` and calls `cmd.Execute()`. All executable behavior lives in `cmd/<command>.go` as a Cobra subcommand registered from `init` in that file. The root command defines only application identity and genuinely global flags.

`cmd/server.go` is the process composition root: it creates one Fx application with the platform modules, `internal/shared.Module`, and every enabled business module. Adding a module is incomplete until it is registered here. `server` owns process lifecycle through Fx; modules do not start goroutines or HTTP servers during package initialization.

The server composition contains the platform modules required by the enabled capabilities: trace, Chi server, logger, validator, HTTP response mapping, metrics, i18n, use-case decorator and `internal/shared`, followed by business modules. A minimal project with only `shortener` still registers all of those platform modules plus `shortener.Module`; it does not hand-wire an HTTP server or database connection in `cmd`.

`cmd/migrate.go` is a separate `db:migrate` command. It loads `app.database`, collects every module migration file system in deterministic order and runs pending migrations. Adding a module that owns tables is incomplete until its migration file system is registered here as well. Administrative commands are also composition roots: they may instantiate only the dependencies they need, but must invoke application use cases rather than repeat their business rules.

Use `go run ./main.go <command>` locally. The Makefile supplies stable aliases such as `make run` (`server`) and `make migrate` (`db:migrate`); automation and documentation use those aliases rather than embedding environment-specific shell commands.

## Configuration contract

Configuration is loaded by `bricks/pkg/config`; do not add another configuration loader.

1. The loader resolves `APP_CONFIG_DIR`, defaulting to `config` relative to the current working directory.
2. It requires and loads `config/base.yaml` first.
3. It resolves `APP_ENV`, defaulting to `local`, normalizes it to lowercase, then optionally overlays `config/<APP_ENV>.yaml`. Thus `APP_ENV=test` means `base.yaml` followed by `test.yaml`; a missing overlay is valid.
4. Any YAML scalar written as `env://VARIABLE_NAME` is replaced by exactly `VARIABLE_NAME` from the process environment while that file is loaded. This is the only environment substitution convention. The loader does **not** infer overrides from a key such as `APP_FOO__BAR`.
5. A typed consumer reads only its section through `config.New[T](config.WithPath("app.<module>"))`; Fx provides it with `bricksconfig.Provide[T]("app.<module>")`.

`base.yaml` contains the complete shape and safe defaults. It references secrets with `env://...`; secrets never appear in overlays, Git, fixtures or logs. `test.yaml` contains deterministic test-safe values and may override database endpoints, logging and optional providers. `production.yaml` contains only production differences, never an independent partial configuration hierarchy. `.env` is a local developer convenience loaded by the Makefile when present; the application itself relies on its actual process environment. Keep `.env.example` synchronized with every `env://` variable required for local execution.

The top-level YAML contract is:

```yaml
app:
  name: "shortener"
  env: "local"
  base_url: "http://localhost:8080"
  http:                           # port, timeouts, metrics, swagger/CORS when enabled
  database:                       # PostgreSQL connection and pool settings
  logger:                         # level, encoding and output settings
  open-telemetry:                 # tracing/exporter settings
  ucdecorator:                    # use-case metrics/tracing/translation toggles
  shortener:                      # configuration owned by the shortener module
```

Add a typed `internal/modules/<module>/config.Config` only when a module owns configuration. It has `config:"..."` tags and receives only `app.<module>`; it must not reach into global YAML itself. Add a configuration unit test that sets `APP_CONFIG_DIR` and `APP_ENV` and proves the base and environment overlay values deserialize correctly.

### Local bootstrap contract

The initial README and Makefile must make a clean checkout runnable in this order:

```bash
cp .env.example .env             # fill only the variables referenced by env:// in base.yaml
docker compose up -d             # start only the local infrastructure declared by the project
make migrate                     # apply every embedded module migration
make test                        # run fast, infrastructure-free tests
make test-integration            # run tagged tests through Testcontainers
make run                         # start the Cobra server command
```

The Docker Compose file supplies local development dependencies (PostgreSQL first; Redis, mail catcher or other services only if a module uses them). It does not replace Testcontainers as the source of isolation for integration tests, and it contains no application business logic.

## The model

The application is one deployable process, but it is partitioned by business capability. A module is a vertical slice—not a horizontal technical layer—and can be composed through one `fx.Module`.

```text
HTTP request
  → HTTP DTO → handler → use case → consumer-owned port → adapter → infrastructure
                                      ↑
                              application policy
  ← HTTP response ← mapper ← use-case output / typed error
```

The governing rule is:

> **Application policy depends on contracts. Technical mechanisms implement those contracts.**

`usecase` is application policy. HTTP, GORM, Redis, external providers, logging, metrics, tracing and configuration loading are mechanisms. `fx.go` is the composition boundary that is allowed to know both.

## Non-negotiable invariants

1. **Business ownership.** Put code that changes together for one capability in `internal/modules/<module>/`. Give the module a business name (`shortener`, `subscription`), never a technical name (`database`, `http`).
2. **Dependencies point inward.** A use case imports only its module's policy types and `ports`; it never imports HTTP, a concrete adapter, a GORM model, logger, metric or tracing package. An adapter may import its own `ports` package and its technical dependencies.
3. **The consumer owns an outbound port.** Define an interface in the consuming module's `ports/` package at the granularity required by the use case. The adapter implements it and Fx binds it. Do not create repository interfaces merely to mirror a concrete implementation.
4. **One operation, one use case.** Every business operation has `<Operation>Input`, `<Operation>Output`, `<Operation>UseCase`, and `Execute(context.Context, Input) (Output, error)`. Its input and output form the module's application API.
5. **Inbound adapters stay thin.** A handler decodes a transport DTO, maps it to an input, executes one use case, maps the result and encodes it. Routes contain paths, middleware and wiring only. Neither contains business decisions or persistence work.
6. **Representations do not leak.** HTTP DTOs, application DTOs, models and enums represent different boundaries and are converted explicitly. GORM models never cross the HTTP boundary or become use-case input/output.
7. **Expected failures are typed.** Each module declares its stable, module-scoped errors in `errs/errs.go`, using `bricks/pkg/errs`. Return those errors for expected conditions; never construct raw application errors with `errors.New`.
8. **Observability lives at seams.** Every I/O adapter method (repository, service, cache or client) starts and ends a `trace.Span`. Use cases contain no logging, metrics or tracing; `ucdecorator.Wrap` applies use-case metrics and tracing during composition.
9. **Adapters are substitutable.** Each adapter has a compile-time assertion such as `var _ ports.UserRepository = (*UserRepository)(nil)`. Constructors return a concrete implementation; Fx publishes it as the port.
10. **Modules own their operational assets.** A module contributes routes, configuration, migrations, locales and UI/template assets through Fx when it owns them. Shared technical building blocks belong in `internal/shared`, never as copied infrastructure in each module.

## Canonical module shape

Create only the directories whose responsibility exists. An empty layer is worse than an absent layer.

```text
internal/modules/<module>/
├── fx.go                         # module composition root
├── config/                       # module-owned configuration, if needed
├── usecase/                      # application policy; one operation per file
├── ports/                        # outbound contracts consumed by use cases
├── dto/                          # application data shared by policy/adapters
├── mapper/                       # pure conversions; add only when it clarifies a boundary
├── enum/                         # validated typed values from external input
├── errs/errs.go                  # expected-error catalogue
├── repository/                   # persistence adapters
├── service/                      # domain/external capability adapters
├── cache/                        # cache adapters and no-op implementations
├── client/                       # provider-specific adapters, if distinct from service
├── validator/                    # reusable validation adapter, if policy needs one
├── model/                        # GORM persistence representations only
├── http/
│   ├── dto/                      # request and response transport contracts
│   └── chi/
│       ├── handler/              # inbound adapter
│       ├── middleware/           # module-owned HTTP concerns
│       └── router/               # versioned route registration
├── migrations/                   # embedded up/down schema changes
├── locales/                      # embedded translations
└── ui/                           # module-owned templates/assets, when applicable
```


`internal/shared` is reserved for cross-cutting, technical infrastructure with no business owner: database setup, configuration bootstrap, generic clients, shared transport primitives and truly generic mappings. It must not become a second business module or a place to avoid making an ownership decision.

### Embedded migrations and module assets

A module that owns persistent data has `migrations/` with a `migrations.go` file that embeds its SQL files and exposes a migration file system. Every migration has an ordered timestamp prefix and both directions:

```text
migrations/
├── migrations.go
├── YYYYMMDDHHMMSS_create_short_urls.up.sql
└── YYYYMMDDHHMMSS_create_short_urls.down.sql
```

Use immutable migration files. Never edit a migration that can already have run outside a disposable local database; add a new pair instead. The module registers its embedded migration FS in `fx.go` with `group:"migration_filesystems"`, and `cmd/migrate.go` registers the same FS for the standalone migration command. Locales and module templates follow the same ownership model: embed them in their module and register locale file systems with `group:"locale_filesystems"`.

## Dependency and collaboration rules

| Source | May depend on | Must not depend on |
|---|---|---|
| `usecase` | own `ports`, `dto`, `enum`, `errs`, standard library | adapters, `model`, HTTP, Fx, observability libraries |
| `ports` | `context`, minimal own DTO/enum types | adapter, HTTP, GORM, provider packages |
| `repository` / `service` / `cache` / `client` | own `ports`, `dto`, `model`, `errs`, shared technical infrastructure | HTTP handler/router, another module's internals |
| `http/chi` | own HTTP DTOs, use-case API, error/response infrastructure | repository/model/business rules |
| `fx.go` | all module packages and shared infrastructure | none; it is the authorized composition root |

### Collaboration between modules

Modules may collaborate only through an intentional public application contract: an exported use-case API or a narrowly defined contract package. The consuming module still defines its own port; its adapter translates to the other module's public API. It must never reach into another module's repository, model, handler, or Fx wiring.

Do not create bidirectional dependencies. If two modules share rules or become cyclic, extract a small, explicitly owned capability or contract. If work can occur asynchronously, prefer an explicit domain event/command contract over hidden calls. A shared database does not grant shared table ownership: only the owning module changes a table or emits its migrations.

## Layer contracts

### Use cases

- One file per operation, named `<operation>_usecase.go`.
- Inject only consumer-owned `ports.*` dependencies.
- Orchestrate business rules, authorization decisions, state transitions and transaction boundaries.
- Keep input/output free of transport and ORM types. Use an empty struct, not `nil`, when no input or output data is needed.
- Make retry and idempotency behavior explicit for externally repeatable commands.

### Ports and adapters

- A port describes what policy needs, not an adapter's CRUD API.
- Put shared application contract structs in `dto/`; keep an interface itself in `ports/`.
- All I/O methods accept `context.Context` as their first argument and create a span.
- Map infrastructure errors to typed module errors at the adapter boundary. Map GORM not-found consistently to the module's not-found error.
- Use a no-op adapter behind the same port when an optional capability is disabled; do not spread feature flags through use cases.

### Persistence and transactions

- Persistence models are named `<Entity>Model`, implement `TableName()`, and hold no business or transport logic.
- Represent nullable database columns with pointer types.
- Repositories encapsulate queries and persistence mapping. They do not make business decisions.
- A use case may require atomic coordination. Expose the needed transaction capability through a port, pass the transaction-scoped dependency explicitly, and keep GORM details inside the persistence adapter. Do not open a transaction in a handler or leak `*gorm.DB` into policy.
- Keep cross-module reads/writes behind published contracts. Avoid cross-module joins; build an explicit read model when a combined view is necessary.

### HTTP

- Put request and response contracts in `http/dto/`; validate syntax at the transport boundary and business validity in the use case or a port-backed validator.
- Map external enum strings through their constructors before policy uses them.
- Map typed module errors once through the shared HTTP error response mechanism. Do not select HTTP status codes ad hoc in every handler.
- Routers register versioned paths, middleware and dependency wiring; module middleware belongs next to its router.

### Validation, errors and enums

- `validator/` is an adapter for reusable validation capability, not a second home for business flows. A use case remains responsible for deciding when a rule applies.
- Keep every expected error in `errs/errs.go` with a stable `<MODULE>_<NN>` code, message and HTTP status. Preserve codes as API compatibility promises.
- Use typed enum constructors for all external strings. Invalid values return a typed module error; do not defer validation to persistence.

## Composition with Fx

`fx.go` is the module's only composition root. It registers its configuration, operational assets, adapters, raw use cases, decorated use cases, middleware and routes.

```go
var Module = fx.Module(
    "shortener",
    bricksconfig.Provide[shortenerconfig.Config]("app.shortener"),
    fx.Provide(
        fx.Annotate(repository.NewShortURLRepository, fx.As(new(ports.ShortURLRepository))),
        fx.Annotate(service.NewAliasGenerator, fx.As(new(ports.AliasGenerator))),
        usecase.NewShortURLCreateUseCase,
        provideDecoratedUseCases,
        fx.Annotate(router.NewShortenerRouter,
            fx.As(new(chi.Route)),
            fx.ResultTags(`group:"routes"`),
        ),
    ),
)
```

Register embedded migration and locale file systems using `group:"migration_filesystems"` and `group:"locale_filesystems"`. Bind named middleware through Fx parameter tags. Configuration is loaded through `bricks`; a module reads only its own configuration section.

## Testing and verification

Test behavior at the cheapest boundary that proves it.

- **Unit tests live beside the code they exercise.** For example, `internal/modules/shortener/usecase/short_url_create_usecase_test.go`. Test use cases with generated port mocks; use table-driven tests for pure mappers, enum constructors and deterministic validators. Use `testify/suite` for a system under test with dependencies and Arrange/Act/Assert sections.
- **Integration tests live outside `internal`, under the mirrored module boundary.** The required pattern is `test/integration/modules/<module>/<boundary>/<artifact>_test.go`: for example, `test/integration/modules/shortener/usecase/short_url_create_usecase_test.go` and `test/integration/modules/shortener/repository/short_url_repository_test.go`. Add only the tested boundary directories; do not force empty copies of every module directory.
- **Every integration-test file starts with `//go:build integration`.** The default `go test ./...` therefore never starts Docker or contacts real infrastructure. The integration suite runs only with `go test -tags=integration ./test/integration/...`.
- **Integration tests use real owned infrastructure.** Use `bricks/pkg/itestkit` and Testcontainers for PostgreSQL/Redis, run the module migration path, build real repositories/adapters and assert persisted behavior. Mock only a provider outside the application's control. A test requiring another module's schema must apply that module's migration or create the smallest explicit dependency fixture—never depend on a developer's local database.
- **Isolation is mandatory.** Each suite starts its container and migrations in `SetupSuite`, stops it in `TearDownSuite`, and truncates owned tables in `SetupTest`. The integration command runs packages sequentially (`-p=1`) so container lifecycle is reliable.
- **HTTP tests:** cover request mapping, authentication/middleware and typed-error-to-response mapping for each externally meaningful endpoint. Place unit-level handler tests beside handlers; place real-server black-box coverage under `test/e2e/` with `//go:build e2e`.
- **Migration tests:** verify a clean database applies all migrations and that changed schemas preserve the module's persistence assumptions.

The Makefile must expose, at minimum:

```text
make run                    # go run ./main.go server
make migrate                # go run ./main.go db:migrate
make test                   # unit suite: go test ./...
make test-integration       # tagged Testcontainers suite via scripts/integration-test.sh
make test-e2e               # tagged black-box suite against a running server
make lint                   # golangci-lint
make static                 # lint + vulnerability check + nilaway
make cover                  # unit coverage report under reports/
make update-mocks           # regenerate mocks when mock generation is enabled
```

`scripts/integration-test.sh` is the single integration-test runner. It detects or accepts `DOCKER_HOST`, configures Testcontainers' Docker socket, disables Ryuk only when the environment requires it, and invokes tests with the `integration` tag, timeout and `-p=1`. CI calls the same Make target, not a duplicate command.

Before merging a capability, verify:

- `go test ./...` passes and relevant integration coverage exists for changed infrastructure.
- `make lint` passes; format imports with `goimports` and keep lines within 120 characters.
- The module is constructible by Fx with its required and optional dependencies.
- Replacing its database, provider, cache or transport changes only an adapter and `fx.go`; its use cases remain unchanged.
- A new command, module, migration, `env://` secret or test boundary is registered in every required composition point described above.

## Delivery checklist for a new capability

1. Name the business capability and confirm its data ownership.
2. Define the operation input/output and its expected typed errors.
3. Define the smallest consumer-owned ports needed by the operation.
4. Implement and unit-test the use case before choosing adapter details where possible.
5. Add persistence/provider/cache adapters, their spans, mappings and integration tests.
6. Add HTTP DTOs, handler, router and endpoint tests.
7. Register configuration, optional no-op implementations, migrations, locales, decorators and routes in `fx.go`.
8. Register the module in `cmd/server.go`; register its migration FS in `cmd/migrate.go` when it owns tables.
9. Add mirrored integration tests, any required `.env.example` variables and Make/script support.
10. Run the verification checklist and review for forbidden dependencies.

## Implementation skills

Use the specialized skill for the artifact being created; this guide remains the source of truth when a template and an architectural invariant disagree.

| Responsibility | Skill |
|---|---|
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

## Forbidden shortcuts

- Business logic in handlers, routers, repositories or models.
- Concrete adapters, `*gorm.DB`, logger, metrics or tracing injected into a use case.
- HTTP DTOs or persistence models returned from a use case without an explicit boundary decision.
- Direct access to another module's persistence or HTTP package.
- Untyped expected errors, ad-hoc HTTP error mapping or bypassed enum validation.
- I/O adapter methods without spans.
- Shared tables or cross-module schema changes without a clearly documented owner.