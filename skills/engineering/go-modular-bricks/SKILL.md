---
name: go-modular-bricks
description: Impact map for Go services built with Bricks. Use when a Go or Bricks change adds or alters an entry point, application policy, module boundary, adapter, shared capability, or Fx composition. Don't use for Go changes that do not use Bricks modular architecture.
---

# Go modular bricks

Make the change through the smallest complete modular flow. Load only the
contracts selected by the impact map.

## 1. Build the impact map

1. Inspect the requested behavior, the owning module, the closest comparable
   flow, and the module's composition code before editing.
2. Name every affected entry point, application operation, port, adapter,
   representation boundary, module, shared capability, Fx registration, and
   proof of behavior.
3. Mark each item as changed, reused, or unaffected. Select a reference only
   when its trigger below is marked changed or reused by the flow.

*Done when:* every changed behavior has an owning module and a complete list of
the flow components it reaches.

## 2. Load the selected contracts

Read each selected reference in full before editing. Each pointer below is the
only route to that contract.

| Trigger in the impact map | Required reference |
| --- | --- |
| The change creates or alters an entry point, application operation, port, adapter, error path, or representation mapping. | Read `references/data-flow.md` in full. |
| The change assigns ownership, changes a dependency direction, or introduces a layer boundary. | Read `references/modular-architecture.md` in full. |
| The change creates, splits, removes, or connects a business module. | Read `references/modules.md` in full. |
| The change adds or places a cross-module technical capability. | Read `references/shared.md` in full. |
| The change adds a constructor, implementation binding, grouped contribution, configuration, asset, locale, migration, raw use case, decorated use case, handler, or route. | Read `references/fx-wiring.md` in full. |
| The change accepts or returns JSON, or maps HTTP values to application contracts. | Read `references/http-dtos.md` in full. |
| The change adds or alters an HTTP handler or its success or error boundary. | Read `references/http-handlers.md` in full. |
| The change adds or alters an HTTP route or route group. | Read `references/http-routers.md` in full. |
| The change adds or alters module-owned HTTP middleware. | Read `references/http-middleware.md` in full. |
| The change lists a collection with pagination, ordering, or filters. | Read `references/pagination-filtering.md` in full. |
| The requested HTTP change includes API documentation. | Read `references/api-documentation.md` in full. |
| The change adds or alters a Cobra command, server startup, migration execution, or an administrative entry point. | Read `references/commands.md` in full. |
| The change adds or changes application policy, a business operation, or a call into another module. | Read `references/use-cases.md` in full. |
| The change adds or changes an outbound dependency contract used by application policy. | Read `references/ports.md` in full. |
| The operation must make work across multiple repositories atomic, or a repository owns one local transaction. | Read `references/transactions.md` in full. |
| The change defines or changes application input, output, or internal data shared by application collaborators. | Read `references/application-dtos.md` in full. |
| The change adds or changes an expected business error, its translation, or its locale entry. | Read `references/errors.md` in full. |
| The change adds reusable business validation beyond operation input tags. | Read `references/validators.md` in full. |
| The change adds or changes a constrained domain value. | Read `references/enums.md` in full. |
| The change maps values between representations outside a small, single-use boundary mapping. | Read `references/mappers.md` in full. |
| The change adds a reusable pure or I/O-backed capability consumed by application policy. | Read `references/services.md` in full. |
| The change persists, loads, updates, deletes, filters, or joins module-owned records. | Read `references/repositories.md` in full. |
| The change adds or alters a GORM model. | Read `references/models.md` in full. |
| The change creates, alters, backfills, or removes database schema. | Read `references/migrations.md` in full. |
| The change creates or alters shared database setup, connection lifecycle, or database configuration. | Read `references/database.md` in full. |
| The change changes global YAML files, configuration loading, environment overlays, or an `env://` variable. | Read `references/global-configuration.md` in full. |
| The change adds or changes configuration owned by one module. | Read `references/module-configuration.md` in full. |
| The change adds or changes translated module messages or a module locale file system. | Read `references/locales.md` in full. |
| The change adds or changes module-owned static files. | Read `references/assets.md` in full. |
| The change adds or changes module-owned UI templates. | Read `references/templates.md` in full. |
| The change calls another service through HTTP, gRPC, or another transport client. | Read `references/clients.md` in full. |
| The change calls a third-party SDK or provider API. | Read `references/providers.md` in full. |
| The changed flow reads or writes cached state. | Read `references/cache.md` in full. |
| The change adds or alters a validator, enum, mapper, pure service, or another deterministic boundary. | Read `references/unit-tests.md` in full. |
| The change adds or alters a use case, repository, migration-backed persistence flow, or another flow that needs controlled real infrastructure. | Read `references/integration-tests.md` in full. |
| An integration flow calls an uncontrolled external provider. | Read `references/external-provider-mocks.md` in full. |
| The change adds or alters adapter I/O tracing or a domain-specific use-case span. | Read `references/otel.md` in full. |
| The change adds or alters use-case duration or outcome metrics. | Read `references/prometheus.md` in full. |
| The selected flow cannot follow one of these contracts. | Read `references/adr-exceptions.md` in full before choosing the exception. |

*Done when:* every selected contract has been read in full and no unselected
contract has been loaded.

## 3. Implement and prove the flow

1. Edit only the artifacts selected by the impact map. Keep every boundary
   explicit and register every new runtime contribution in its composition
   root.
2. Correct a selected-path violation of a loaded contract. Record a deliberate
   departure through the ADR process before it becomes part of the change.
3. Run `make lint`, `make test`, and `make test-integration`. Record the exact
   command and result for every gate. A nonzero result or an unavailable
   prerequisite blocks completion; report the prerequisite and failure rather
   than claiming the flow is complete.
4. Report the impact map, references read, changed flow and layers, changed
   tests, commands, and results.

*Done when:* the delivered change and report account for every item marked
changed in the impact map.
