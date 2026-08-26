# Application flow router

Use this router only after an entry-point route selects an application
operation. Read the baseline contracts, then add each conditional contract
whose trigger appears in the requested behavior or comparable local flow.

## Baseline

Read these references in full:

- `../use-cases.md`
- `../fx-wiring.md`

## Select affected boundaries

| Changed or reused boundary | Read in full |
| --- | --- |
| A business module is created, split, removed, or connected | `../modules.md` |
| A cross-module technical capability changes | `../shared.md` |
| A use case needs an outbound dependency | `../ports.md` |
| Persistence is read or changed | `../repositories.md` |
| A GORM model, persistence view, or persistence criterion is added or changed | `../models.md` |
| Database schema is added, changed, backfilled, or removed | `../migrations.md` |
| Shared database setup, configuration, or lifecycle changes | `../database.md` |
| Work across repositories must be atomic, or one repository owns a local transaction | `../transactions.md` |
| The operation defines shared application data used beyond one use case | `../application-dtos.md` |
| An expected business error or its translation changes | `../errors.md` and `../locales.md` |
| Reusable validation is added or changed | `../validators.md` |
| A constrained domain value changes | `../enums.md` |
| Reusable representation mapping changes | `../mappers.md` |
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
