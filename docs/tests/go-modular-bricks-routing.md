# Go modular bricks routing regression cases

These cases evaluate reference selection, not Go implementation correctness.
They live outside the skill so normal tasks do not load the evaluation corpus.

## Procedure

Start each case with a fresh agent context containing only the skill description,
the case request, and the stated project evidence. Let the agent read `SKILL.md`
and inspect that evidence, then request its `boundary/evidence → contracts` plan
before implementation. Record actual file reads, not just the reported plan.

Unless a row says otherwise, assume existing signatures, representations,
registration, and downstream guarantees have been inspected and verified. The
project has no extra documentation requirement; changed I/O methods require
spans. Its existing HTTP suite is the selected HTTP proof seam. Change requests
include appropriate regression proof; review requests judge existing evidence.

Names below are specialist stems under
`skills/engineering/go-modular-bricks/references/`. Router reads are not specialist
reads. Add `data-flow` when the case changes or judges dependency direction,
representation boundaries, or application/entry-point orchestration, not for
every Go edit. Project standards, applicable ADRs, and actual source inspection
are not counted as specialist reads.

Pass criteria:

- Every required specialist is read before editing or judging its boundary.
- No excluded specialist is read under the stated evidence.
- Any additional specialist has a concrete, newly discovered trigger; neither an
  import, a link, nor presence in the composed graph suffices.
- A specialist is not read twice while still available in context.
- Unknown ownership causes source inspection or a focused question before broad
  specialist loading; scope expansion causes re-selection.

The matrix supports manual walkthroughs and live-agent evaluation. A walkthrough
or link check alone does not establish model adherence; report those separately.

## Narrow changes and exclusions

| Case / request and evidence | Required specialists | Must remain unloaded |
| --- | --- | --- |
| Fix a Chi route path; handler, dependencies, and Fx registration unchanged | http-routers | data-flow, http-handlers, http-dtos, fx-wiring, use-cases, repositories, api-documentation |
| Correct an HTTP response JSON tag; no mapping/shape change beyond the wire name | http-dtos | http-routers, fx-wiring, use-cases, repositories |
| Fix malformed path-ID decoding in an existing handler; reuse the established transport error | http-handlers | http-routers, http-dtos, errors, locales, repositories, fx-wiring |
| Change middleware context propagation; attachment/scope unchanged | http-middleware | http-routers, use-cases, repositories, fx-wiring |
| Correct a pure HTTP mapper's value conversion; DTO/use-case shapes unchanged | mappers, unit-tests | http-handlers, http-routers, http-dtos, application-dtos, repositories, fx-wiring |
| Document an existing endpoint's OpenAPI response; implementation is verified and unchanged | api-documentation | data-flow, http-handlers, http-dtos, use-cases, repositories |
| Change a business Cobra flag default; same input type, use case, and composition | commands, command-tests | use-cases, application-dtos, fx-wiring, global-configuration, repositories |
| Fix migration-command output text; runner invocation and schema unchanged | commands, command-tests | migrations, database, use-cases, fx-wiring |
| Fix server shutdown's Fx lifecycle; enabled modules and settings unchanged | commands, command-tests, fx-wiring, integration-tests | modules, use-cases, repositories, global-configuration, direct-use-cases, decorated-use-cases |
| Fix policy inside an existing direct-profile `Execute`; signatures, calls, and error meanings unchanged | use-cases, integration-tests | direct-use-cases, fx-wiring, ports, repositories, application-dtos, validators, prometheus, otel |
| Fix a repository SQL predicate behind an HTTP endpoint; model, schema, error semantics, and registration unchanged | repositories, ports, otel, integration-tests | data-flow, http-handlers, use-cases, models, migrations, database, fx-wiring |
| Correct a GORM column tag to match an existing migration; query behavior needs integration proof | models, integration-tests | migrations, database, repositories, ports, fx-wiring |
| Add a SQL index migration; model and runner registration unchanged | migrations, integration-tests | models, repositories, database, commands, fx-wiring |
| Correct a locale translation string without changing its code | locales | data-flow, errors, fx-wiring, unit-tests, integration-tests |
| Correct text in an existing embedded HTML asset; embedding and lookup unchanged | assets | data-flow, templates, fx-wiring, modules, unit-tests, integration-tests |
| Change a template data binding and rendering behavior; asset filesystem unchanged | templates | assets, http-handlers, use-cases, fx-wiring |
| Correct an existing global YAML value with load-path verification | global-configuration | module-configuration, database, fx-wiring, commands |
| Add a regression assertion to a pure mapper's existing test | mappers, unit-tests | integration-tests, fx-wiring, use-cases, repositories |
| Review an existing repository integration test; no uncontrolled external dependency | repositories, ports, integration-tests | external-provider-mocks, models, migrations, database, http-handlers |

## Companion contracts and scope expansion

| Case / request and evidence | Required specialists | Must remain unloaded |
| --- | --- | --- |
| Add a new direct-profile use case with dedicated input/output, reusing verified ports and no new I/O implementation | use-cases, application-dtos, fx-wiring, direct-use-cases, integration-tests | decorated-use-cases, repositories, otel, prometheus |
| Add a new decorated-profile use case and its provider, reusing the existing decorator factory and verified collaborators | use-cases, application-dtos, fx-wiring, decorated-use-cases, integration-tests | direct-use-cases, prometheus, otel, repositories |
| Bind an existing adapter to an existing port in a direct-profile module; inspect adapter conformance | fx-wiring, ports, integration-tests | direct-use-cases, decorated-use-cases, use-cases, prometheus |
| Introduce a stateless named validator, its port, Fx binding, and deterministic proof; no new error or caller policy | validators, ports, fx-wiring, unit-tests | services, repositories, use-cases, otel, integration-tests |
| Add a constrained enum and its new invalid-value error and translations | enums, errors, locales, unit-tests | validators, use-cases, repositories, fx-wiring |
| Change infrastructure-to-business error translation inside a repository; reuse existing catalog code and translations | repositories, ports, errors, otel, integration-tests | locales, models, migrations, http-handlers |
| Add a module cache adapter with a new typed cached value, port, and Fx binding | cache, ports, application-dtos, fx-wiring, otel, integration-tests | database, repositories, use-cases, external-provider-mocks |
| Add an internal inventory HTTP client and port, bind it, and prove protocol with a controlled server | clients, ports, fx-wiring, otel | providers, external-provider-mocks, http-handlers, repositories |
| Adapt a third-party payment HTTP API, bind its port, and replace the uncontrolled provider in an application integration scenario | providers, ports, fx-wiring, otel, external-provider-mocks, integration-tests | clients, repositories, database, http-handlers |
| Add a pure reusable calculation service and focused proof; no injected collaborators | services, unit-tests | ports, otel, fx-wiring, integration-tests |
| Add module-owned typed configuration, its YAML values, Fx binding, and composed load proof | module-configuration, global-configuration, fx-wiring, integration-tests | database, commands, use-cases |
| Change shared database read/write connection lifecycle, leaving the configuration shape unchanged | database, integration-tests | migrations, models, repositories, global-configuration, commands |
| Change an existing metrics decorator's outcome labels and test its registry/observer | prometheus, unit-tests | otel, direct-use-cases, decorated-use-cases, use-cases, repositories |
| Review module data ownership and shared-package placement without reviewing implementation internals | modules, modular-architecture, shared | http-handlers, repositories, models, migrations, fx-wiring |
| Diagnose an undocumented cross-module repository access; project precedence does not resolve it | modular-architecture, adr-exceptions | http-handlers, prometheus, database |
| Add a collection filter across HTTP DTO/decoding, inline input mapping, use-case input/policy, repository port/query, and a new persistence criterion; no schema or constructor change | pagination-filtering, http-dtos, http-handlers, mappers, unit-tests, application-dtos, use-cases, ports, repositories, models, otel, integration-tests | http-routers, migrations, database, fx-wiring, api-documentation |
| Add a handler method and route reusing a verified use-case API; add wire DTOs and mapping but keep handler dependencies and registration unchanged | http-handlers, http-routers, http-dtos, mappers, unit-tests | use-cases, application-dtos, repositories, fx-wiring, api-documentation |
| Policy work discovers an unverified transaction-propagation guarantee in an unchanged repository; judge participation before deciding whether to edit it | use-cases, transactions, repositories, ports, integration-tests | http-handlers, database, migrations |

## Routing behavior beyond file selection

- **Architectural core:** moving a GORM model into a public use-case output must
  select `data-flow`, application DTOs, and use cases before judging that design.
  A JSON-tag rename with otherwise stable types does not select the architectural
  core simply because it edits Go.
- **Unknown owner:** “Fix the 500 on order confirmation” with no diagnosis must
  first inspect the failing path. The presence of HTTP does not authorize loading
  every REST and persistence reference.
- **Scope expansion:** a policy-only fix that discovers a required new error must
  add errors/locales before creating the code and translations; its original
  minimum selection is not a permanent cap.
- **Multiple entry points:** a policy fix used by both HTTP and CLI does not load
  either entry-point router while their relevant contracts remain verified.
- **Full review:** an explicit end-to-end architecture review does select all
  boundaries being judged, even unchanged ones. Stable-boundary stopping is not
  permission to omit the requested review scope.
- **Project override:** direct injection must never load the decorated example
  merely because a specialist's generic example uses `ucdecorator`. A project
  requiring OpenAPI or different HTTP proof activates those local requirements.
- **Reachability:** every specialist must have an explicit conditional pointer
  reachable from `SKILL.md`; every relative pointer must resolve from its owning
  file, including pointers in `references/flows/`.
