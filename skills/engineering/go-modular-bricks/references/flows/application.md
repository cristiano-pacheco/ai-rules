# Application flow router

Use this router for an application operation or an internal component change,
including refactors and reviews without a changed HTTP or CLI entry point.
Select contracts for the affected behavior and its dependencies.

For an application operation, read `../use-cases.md`. Read `../fx-wiring.md`
when adding or changing injection, constructors, bindings, or composition.
For a component-only edit, use the matching rows below and inspect its callers;
a pure mapper change does not require unrelated runtime contracts.

## Select affected boundaries

| Changed or reused boundary | Read in full |
| --- | --- |
| A use-case contract, policy, or helper changes | `../use-cases.md` |
| Dependency injection or runtime composition changes | `../fx-wiring.md` |
| A business module is created, split, removed, or connected | `../modules.md` |
| A cross-module technical capability changes | `../shared.md` |
| A use case needs an outbound dependency | `../ports.md` |
| Persistence is read or changed | `../repositories.md` |
| A GORM model, persistence view, or persistence criterion is added or changed | `../models.md` |
| Database schema is added, changed, backfilled, or removed | `../migrations.md` |
| Shared database setup, configuration, or lifecycle changes | `../database.md` |
| Work across repositories must be atomic, or one repository owns a local transaction | `../transactions.md` |
| Application values are shared, extracted, aliased, embedded, or moved between operations | `../application-dtos.md` |
| An expected business error or its translation changes | `../errors.md` and `../locales.md` |
| Reusable validation is added or changed | `../validators.md` |
| A constrained domain value changes | `../enums.md` |
| Representation mapping is added, moved, or changed | `../mappers.md` |
| A reusable pure or I/O-backed service changes | `../services.md` |
| A remote service call changes | `../clients.md` |
| A third-party SDK or provider call changes | `../providers.md` |
| Cached state changes | `../cache.md` |
| Global configuration changes | `../global-configuration.md` |
| Module-owned configuration changes | `../module-configuration.md` |
| A deterministic boundary needs focused proof | `../unit-tests.md` |
| A use case, repository, schema-backed flow, or composition path needs controlled infrastructure | `../integration-tests.md` |
| An integration flow calls an uncontrolled provider | `../external-provider-mocks.md` |
| Adapter, service, or domain-specific tracing changes | `../otel.md` |
| Use-case duration or outcome metrics change | `../prometheus.md` |

A repository flow selects both `../ports.md` and `../repositories.md`. Select
`../models.md` only when a model, persistence view, or persistence criterion
changes, not merely because a repository returns an existing model.
