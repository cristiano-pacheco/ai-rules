# Application router

Use for non-transport responsibilities, including HTTP/CLI mapping and shared
composition. Match the requested behavior and inspected evidence, not every
component on the call graph. Read only matching specialists in full. All paths
below are relative to this file.

## Policy, representations, and ownership

| Responsibility in scope | Contract | Conditional companions / exclusions |
| --- | --- | --- |
| Use-case policy, orchestration, input/output, or operation-local input validation | `../use-cases.md` | Classify helpers by their bodies: conversions select mappers; reusable checks select validators. |
| Application DTO definition, operation input/output shape, shared values, aliases, embedding, or type ownership | `../application-dtos.md` | Calling an unchanged operation with existing types is not a trigger. |
| Representation conversion, inline or extracted, including HTTP/CLI mapping | `../mappers.md` | Add each representation's specialist only if its shape/ownership/guarantee is affected; pure conversion does not select runtime wiring. |
| Consumer-owned interface, outbound dependency contract, adapter conformance, or new I/O collaborator | `../ports.md` | Includes repository ports; using an unchanged verified port alone is not a trigger. |
| Reusable pure or I/O-backed capability not owned by validation, mapping, persistence, or protocol adaptation | `../services.md` | Apply `../../SKILL.md` classification first. I/O services also select ports; pure services do not need an I/O port. |
| Reusable acceptance/rejection rule, named validator, or validation disguised as a service/helper | `../validators.md` | Named validators also select ports, including stateless ones. External-data checks remain validation. |
| Constrained domain value: accepted literals, parsing, validation, representation | `../enums.md` | New invalid-value errors select errors; add locales only under a project locale profile. |
| Expected-error declaration, identity, status, cause preservation, or infrastructure-to-business translation | `../errors.md` | Select the project error profile first; add locales only for a new/changed translation code or message under the locale profile. |
| Locale text, coverage, embedded files, or translation lookup | `../locales.md` | Text-only edits do not select errors or Fx; add them if catalog semantics or filesystem registration changes. |
| Module creation, split, removal, connection, or business/data ownership | `../modules.md`, `../modular-architecture.md` | Select component contracts only for actual responsibilities, not every directory a module could own. |
| Dependency direction, layer placement, cross-module access, or architectural boundaries | `../modular-architecture.md` | Add use cases for a changed cross-module application call; add modules for changed ownership. |
| Cross-module technical capability with no business owner, or moving code into/out of shared | `../shared.md` | Add the technical mechanism's contract when it is affected. |

## Persistence and outbound I/O

| Responsibility in scope | Contract | Conditional companions / exclusions |
| --- | --- | --- |
| Repository query/write, absence semantics, persistence mapping, or repository port | `../repositories.md`, `../ports.md` | Existing model values do not by themselves select models; a use case calling a verified repository does not select this row. |
| GORM model/table mapping, persistence view, or persistence criterion | `../models.md` | Inspect the relevant project migration as schema evidence; load migrations only if schema/migration behavior is in scope. |
| Schema, backfill, migration order/reversibility, runner semantics, or migration filesystem contribution | `../migrations.md` | No database setup or Cobra contracts unless those responsibilities are affected. |
| Shared database connection, driver, read/write topology, configuration, or lifecycle | `../database.md` | A query or schema change alone does not select database infrastructure. |
| Atomicity, transaction ownership/propagation, repository-local transaction, or multi-repository unit of work | `../transactions.md` | Add use cases, ports, repositories, or Fx for the transaction participants/contracts actually affected. |
| Remote-service protocol or transport adapter, such as internal HTTP/gRPC service calls | `../clients.md`, `../ports.md` | Classify by boundary responsibility, not merely use of HTTP. |
| Third-party capability or vendor SDK adapter, such as payment, email, or identity | `../providers.md`, `../ports.md` | A vendor's HTTP API is still a provider when adapting that capability; select clients too only for a distinct remote-service client responsibility. |
| Cache keys, values, TTL, invalidation, or cache adapter | `../cache.md`, `../ports.md` | Add application DTOs if cached value types change; cache presence elsewhere is not a trigger. |

## Composition, configuration, resources, and telemetry

| Responsibility in scope | Contract | Conditional companions / exclusions |
| --- | --- | --- |
| Constructor dependency set, injection type, Fx binding/group, module registration, runtime contribution, or Fx lifecycle | `../fx-wiring.md` | Follow its profile selector; inspecting unchanged registration is not a trigger. |
| Global YAML, environment/secret resolution, or shared configuration bootstrap | `../global-configuration.md` | Add database for connection behavior changes, not merely a configuration value. |
| Module-owned typed settings or `app.<module>` configuration binding | `../module-configuration.md` | Add global configuration if the YAML/load contract also changes; Fx if injection/registration changes. |
| Module-owned static resource content, embedding, lookup, or asset filesystem | `../assets.md` | An embedded SQL migration or locale belongs to its own specialist, not assets. |
| Template content, data contract, parsing, rendering, partials, or template lifecycle | `../templates.md` | Add assets only for a separate static-resource responsibility. |
| Adapter/I/O-service spans, domain tracing, or new/changed I/O methods requiring spans under the selected project contract | `../otel.md` | Respect the project profile; pure policy or existing decorator use does not imply tracing work. |
| Use-case duration/outcome metrics, observer, registry, or metrics decorator | `../prometheus.md` | Selecting decorated injection alone does not select metrics implementation. |

### Runtime examples

Runtime examples are mutually exclusive: `../fx-wiring.md` selects
`../direct-use-cases.md` for direct use-case shape/registration work, or
`../decorated-use-cases.md` for decorated provider work. Neither example is a
prerequisite for unrelated adapter binding or a policy-only edit.

## Select proof by seam

For implementation and test changes, select the seam that proves the affected
behavior under the project's testing rules. Those rules override the defaults
below. Integration-only projects select integration tests even for pure mappers
and validators. A no-doubles rule excludes external-provider mocks. For reviews,
select the same contract when judging test evidence.
Prose/resource-text-only work does not automatically select a Go test guide.

| Proof needed | Read in full |
| --- | --- |
| Deterministic mapper, enum, validator, pure service, or focused collaborator test | `../unit-tests.md` |
| Use case, repository, transaction, migration-backed persistence, controlled cache/infrastructure, or composed module/Fx flow | `../integration-tests.md` |
| Integration flow must replace an external provider outside test control | `../external-provider-mocks.md` plus `../integration-tests.md` |
| Cobra boundary | `../command-tests.md`; use `cli.md` if command behavior is also in scope |
| HTTP boundary | Follow the proof section in `rest.md` |

Client/provider protocol checks use their specialist's controlled-server or SDK
seam; add the relevant test guide when that proof uses its seam. External doubles
are not a default for every integration test. For test-only work, also select the
specialist of the asserted behavior; changing one fixture does not select every
real component built by the suite.
