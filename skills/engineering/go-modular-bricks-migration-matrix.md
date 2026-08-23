# Go Modular Bricks migration matrix

This ledger is the audit input for the `go-modular-bricks` migration. It maps
the versioned `skills/engineering/go-*/SKILL.md` files, and only those files,
to one planned authoritative destination each. Installed `go-*` copies are
comparison material only: they cannot add, replace, or approve a rule.

The destination paths are the planned files of
`skills/engineering/go-modular-bricks/`. Tickets 02-07 create them; ticket 08
must turn every planned path in this document into a real path or record a
deliberate replacement before publishing the skill.

## Audit protocol

Each row is a source unit. A source unit is either a named instruction block,
one numbered critical rule, or a named example whose behavior is normative.
Rows that cover a named block include every rule and code example under that
heading, unless another row names a numbered critical rule in the same block.
The IDs are stable review handles, not instructions for the resulting skill.

`Carry` keeps the behavior and rewrites it as public, project-neutral guidance.
`Replace` preserves the intent through the explicit new-spec decision named in
the note. `Remove` is allowed only when its note gives a reason; this inventory
uses none because every source behavior has a destination or a replacement.

| Planned destination | Owning ticket | Scope |
| --- | --- | --- |
| `SKILL.md#impact-map-and-completion` | 02, 07 | Impact discovery, direct loading, validation gates, and final report. |
| `references/http-dtos.md` | 03 | JSON transport DTOs and transport/application mapping boundary. |
| `references/http-handlers.md` | 03 | Chi handler responsibilities, response and error boundary. |
| `references/http-routers.md` | 03 | Route registration and groups. |
| `references/http-middleware.md` | 03 | Middleware groups and injection. |
| `references/api-documentation.md` | 03 | Opt-in API documentation. |
| `references/pagination-filtering.md` | 03 | Collection query pagination, ordering, and filters. |
| `references/use-cases.md` | 04 | Application policy and public use cases. |
| `references/ports.md` | 04 | Consumer-owned adapter contracts. |
| `references/transactions.md` | 04 | Transaction-manager port and local transaction exception. |
| `references/application-dtos.md` | 04 | Application inputs and outputs. |
| `references/errors.md` | 04 | Stable module errors and safe rendering. |
| `references/validators.md` | 04 | Validation ownership and contracts. |
| `references/enums.md` | 04 | Constrained values. |
| `references/mappers.md` | 04 | Pure explicit mappings. |
| `references/services.md` | 04 | Pure and reusable application services. |
| `references/repositories.md` | 05 | Persistence ports and adapters. |
| `references/models.md` | 05 | GORM persistence models. |
| `references/migrations.md` | 05 | Schema-change ownership. |
| `references/database.md` | 05 | Shared database infrastructure. |
| `references/clients.md` | 05 | Internal remote-service clients. |
| `references/providers.md` | 05 | Third-party provider adapters. |
| `references/cache.md` | 05 | Cache capability only when used. |
| `references/fx-wiring.md` | 02 | Fx bindings and registrations. |
| `references/unit-tests.md` | 07 | Unit-test seams and evidence. |
| `references/integration-tests.md` | 07 | Real controlled-infrastructure tests. |
| `references/external-provider-mocks.md` | 07 | Fakes only for uncontrolled providers. |
| `references/otel.md` | 07 | I/O and use-case tracing. |

## Canonical-source manifest

The line counts and SHA-256 values freeze the source examined by this ticket.
A changed value requires a new or amended matrix before ticket 08 can pass.

| Source | Lines | SHA-256 | Rows |
| --- | ---: | --- | --- |
| `go-cache/SKILL.md` | 353 | `fcf011453fa5860bc438d77dd6b8b5639a50700947f6db6175e6c80c8176ab02` | GC |
| `go-chi-handler/SKILL.md` | 568 | `9587996f5e73e01e564b2627215ef832d084bb63103150ff9c340017dcc298bf` | GH |
| `go-chi-router/SKILL.md` | 190 | `42033e7b673d083a14911b788543ee1ed530554783b2e39f82c49c2211e67fb9` | GR |
| `go-enum/SKILL.md` | 150 | `c3a1b9b8641ab19b3a3ea213f82ec31ba2765fba4bd23d969410d763680f7f4e` | GE |
| `go-error/SKILL.md` | 149 | `2853778e2f7bafbcf811bf3a83a9b53faa4f998cd13df3de2d6d3799602cc965` | GX |
| `go-gorm-model/SKILL.md` | 286 | `7019f7c44ba66ddbfaa7430f7b9a9cb3cd05a2fe3089e3ee39607e612282a33b` | GM |
| `go-integration-tests/SKILL.md` | 471 | `2be728d87d1bbb95c41dd3696ed37cb2dbe6e07fc762f59b2978d7d3996a1bdf` | GI |
| `go-mapper/SKILL.md` | 189 | `082b9bbf7207186298e34a8e99a7962fc018db83763a21770e311b5f4b64bcd8` | GP |
| `go-repository/SKILL.md` | 518 | `f34e83b9de77054802f12f85cdbd3fdb5b138053946059bc96e0c7f3adbf2f3a` | GQ |
| `go-service/SKILL.md` | 299 | `eb4fd0eaa6c056b3ac1bf430075eb8c89ab3cc0ce279a49859e7022da3ce617d` | GS |
| `go-unit-tests/SKILL.md` | 333 | `119efbcbc458345bb426599efff2d212ace7358566d7bcdf4c5fef93dcc991b6` | GU |
| `go-usecase/SKILL.md` | 290 | `0e558089e5c0b3d0256bbddeaa7567a08c6338771f8055cee9b1221ef0c2ed9f` | GW |
| `go-validator/SKILL.md` | 386 | `b9f1fb8cb6bb1e350c360d6e0dc718374d25e2f1612d179fd02c7aed07186d71` | GV |

`100-go-rules` is not a `go-*` specialist and is deliberately outside this
migration. It remains an independent global Go-quality skill.

## Matrix

| ID | Canonical source unit | Decision | Single destination | Migration note |
| --- | --- | --- | --- | --- |
| GC-01 | `go-cache`: When to Use and variant selection | Carry | `references/cache.md#selection` | Cache is loaded only for a flow that uses it; select an existing provider and behavior. |
| GC-02 | `go-cache`: Fixed and randomized TTL rules | Carry | `references/cache.md#ttl` | Retain expiry and stampede intent; make provider-specific APIs conditional on local evidence. |
| GC-03 | `go-cache`: Two-File Pattern and file-layout order | Carry | `references/cache.md#adapter-shape` | Express as a consumer-owned cache port plus adapter; do not require an empty optional package. |
| GC-04 | `go-cache`: Boolean Flag Cache example | Replace | `references/cache.md#boolean-state` | Keep miss/value semantics; replace private module names and Redis client details with public placeholders. |
| GC-05 | `go-cache`: JSON Data Cache example | Replace | `references/cache.md#serialized-state` | Keep explicit serialization and miss behavior; replace project identifiers. |
| GC-06 | `go-cache`: Key Building examples | Carry | `references/cache.md#keys` | Retain deterministic namespaced keys and type-appropriate formatting. |
| GC-07 | `go-cache`: TTL Configuration examples | Carry | `references/cache.md#ttl` | Retain jitter for bulk, long-lived data. |
| GC-08 | `go-cache`: Naming, Fx Wiring, and Dependencies | Carry | `references/fx-wiring.md#cache-bindings` | Bind an implementation only when the feature needs cache. |
| GC-09 | Critical rule 1: helpers are methods on a stateful cache type | Replace | `references/cache.md#adapter-shape` | Preserve cohesive adapter behavior; permit a package function when it is the smallest pure mapping boundary. |
| GC-10 | Critical rule 2: port in `ports/`, implementation in `cache/` | Carry | `references/cache.md#adapter-shape` | Preserve module ownership and port/adapter split. |
| GC-11 | Critical rule 3: compile-time interface assertion | Carry | `references/cache.md#adapter-shape` | Retain when the concrete adapter implements an exported port. |
| GC-12 | Critical rule 4: pointer constructor | Carry | `references/cache.md#adapter-shape` | Retain concrete pointer construction and Fx interface binding. |
| GC-13 | Critical rule 5: caller context, never internal background context | Carry | `references/cache.md#context` | Preserve cancellation and tracing propagation. |
| GC-14 | Critical rule 6: Redis nil detection | Replace | `references/cache.md#misses` | Preserve explicit cache-miss detection; make Redis sentinel use conditional on Redis. |
| GC-15 | Critical rule 7: TTL is an implementation detail | Carry | `references/cache.md#ttl` | Do not expose expiry policy through the business port. |
| GC-16 | Critical rule 8: `buildKey` and ID formatting | Carry | `references/cache.md#keys` | Keep stable private key construction. |
| GC-17 | Critical rule 9: boolean and JSON missing-key results | Carry | `references/cache.md#misses` | Make absence distinguishable without inventing an error unless the use case requires one. |
| GC-18 | Critical rule 10: DTO location | Carry | `references/application-dtos.md#ownership` | Keep data contracts outside ports and infrastructure implementations. |
| GC-19 | Critical rule 11: error wrapping and comment guidance | Carry | `references/cache.md#errors` | Keep contextual wrapping and concise, meaningful comments. |
| GC-20 | `go-cache`: Workflow | Replace | `SKILL.md#impact-map-and-completion` | Replace cache-only `lint`/`nilaway` completion with universal lint, unit, and integration gates. |
| GH-01 | `go-chi-handler`: When to Use and Handler Structure | Carry | `references/http-handlers.md#responsibility` | The handler is a thin entry point: decode, transport validation, map, execute one use case, map output, render. |
| GH-02 | `go-chi-handler`: DTO example | Replace | `references/http-dtos.md#transport-contracts` | Keep request/response separation; use project-neutral types and explicit application mappings. |
| GH-03 | `go-chi-handler`: List, Create, Update, Delete, and Get-by-ID examples | Replace | `references/http-handlers.md#operation-patterns` | Preserve one-use-case flow, path parsing, and response behavior; remove private code and identifiers. |
| GH-04 | `go-chi-handler`: URL Param Helper example | Carry | `references/http-handlers.md#path-parameters` | Keep transport parsing and typed bad-request conversion at the HTTP boundary. |
| GH-05 | `go-chi-handler`: Request-to-input and output-to-response mapping examples | Carry | `references/http-dtos.md#mapping` | Retain explicit transport/application mappings. |
| GH-06 | `go-chi-handler`: Swagger Annotation Rules | Replace | `references/api-documentation.md#annotations` | Preserve complete documentation when requested; new spec makes API documentation opt-in rather than mandatory for every route. |
| GH-07 | `go-chi-handler`: Error Handling Pattern | Carry | `references/http-handlers.md#error-boundary` | Log and render through the established Bricks error path; retain typed input errors. |
| GH-08 | `go-chi-handler`: Fx Wiring | Carry | `references/fx-wiring.md#http-bindings` | Register handler dependencies in the module composition root. |
| GH-09 | Critical rule 1: no standalone helpers in a stateful handler | Replace | `references/http-handlers.md#structure` | Preserve cohesive handler helpers; allow standalone pure mapping functions in their dedicated mapping boundary. |
| GH-10 | Critical rule 2: handler dependencies | Carry | `references/http-handlers.md#structure` | Depend on public use-case contracts, response handling, and logging. |
| GH-11 | Critical rule 3: pointer constructor | Carry | `references/http-handlers.md#structure` | Preserve concrete pointer construction. |
| GH-12 | Critical rule 4: use request context | Carry | `references/http-handlers.md#context` | Preserve cancellation and request-scoped telemetry. |
| GH-13 | Critical rule 5: decode through the established request helper | Carry | `references/http-handlers.md#decode` | Keep framework-safe decoding; exact helper follows Bricks/local evidence. |
| GH-14 | Critical rule 6: private Chi path parsing | Carry | `references/http-handlers.md#path-parameters` | Keep URL parsing in transport, not use cases. |
| GH-15 | Critical rule 7: logger then error renderer for every error | Carry | `references/http-handlers.md#error-boundary` | Preserve observability and centralized safe rendering. |
| GH-16 | Critical rule 8: map outputs before return | Carry | `references/http-dtos.md#mapping` | Never expose application outputs as JSON directly. |
| GH-17 | Critical rule 9: success response helpers | Carry | `references/http-handlers.md#responses` | Use established Bricks response behavior, including no-content semantics. |
| GH-18 | Critical rule 10: mandatory Swagger per method | Replace | `references/api-documentation.md#annotations` | Documentation is loaded and updated only when requested. |
| GH-19 | Critical rule 11: avoid redundant method-body comments | Carry | `references/http-handlers.md#structure` | Keep comments for non-obvious policy only. |
| GH-20 | Critical rule 12: lint and Swagger generation | Replace | `SKILL.md#impact-map-and-completion` | Universal gates are lint, unit, and integration; documentation generation runs only for the opt-in branch. |
| GH-21 | `go-chi-handler`: six named anti-pattern examples | Carry | `references/http-handlers.md#anti-patterns` | Retain no raw response writes, logger-before-rendering, typed errors, use-case interfaces, `Handle` names, and correct API error docs. |
| GH-22 | `go-chi-handler`: Workflow | Replace | `SKILL.md#impact-map-and-completion` | Retain affected-artifact discovery; replace specialist command list with the universal completion gate. |
| GR-01 | `go-chi-router`: When to Use and Router Implementation | Carry | `references/http-routers.md#responsibility` | The router registers HTTP routes; it owns neither policy nor adapter calls. |
| GR-02 | `go-chi-router`: Custom Endpoints, Route Groups, Multiple Handlers examples | Carry | `references/http-routers.md#registration-patterns` | Retain RESTful registrations and explicit middleware grouping. |
| GR-03 | `go-chi-router`: Fx Wiring examples | Carry | `references/fx-wiring.md#route-group` | Retain route-group registration through Fx. |
| GR-04 | `go-chi-router`: URL Path Conventions and HTTP Methods | Carry | `references/http-routers.md#http-contract` | Preserve versioned plural-resource paths and conventional verbs. |
| GR-05 | `go-chi-router`: Naming Conventions | Carry | `references/http-routers.md#naming` | Keep routing artifacts predictable and local to their module. |
| GR-06 | Critical rule 1: no standalone functions in stateful router | Replace | `references/http-routers.md#structure` | Preserve cohesive router setup; pure helpers stay in a dedicated pure boundary. |
| GR-07 | Critical rules 2-5: handler-only state, pointer constructor, exact `Setup`, server router | Carry | `references/http-routers.md#structure` | Preserve the Chi route adapter contract. |
| GR-08 | Critical rules 6-8: API prefix, plural paths, Fx route tags | Carry | `references/http-routers.md#http-contract` | Preserve external path and Fx grouping conventions. |
| GR-09 | Critical rules 9-10: focused imports, no redundant comments, lint | Replace | `SKILL.md#impact-map-and-completion` | Preserve minimal router surface; replace the lint-only completion rule with universal gates. |
| GR-10 | `go-chi-router`: Workflow | Replace | `SKILL.md#impact-map-and-completion` | Retain router and Fx impact discovery; use universal completion evidence. |
| GE-01 | `go-enum`: When to Use and six-part Pattern | Carry | `references/enums.md#value-object` | Retain constrained value construction, validation, and string representation. |
| GE-02 | `go-enum`: Enum File example | Replace | `references/enums.md#example` | Keep public, neutral example; remove private module identifiers. |
| GE-03 | `go-enum`: Error Entry example and code/status rules | Carry | `references/errors.md#validation-errors` | Retain stable module error code, safe message, status, and metadata conventions. |
| GE-04 | `go-enum`: Generation Steps | Carry | `references/enums.md#creation` | Retain discovery of values and error ownership before creation. |
| GE-05 | `go-enum`: Naming Conventions | Carry | `references/enums.md#naming` | Retain file, constant, map, type, constructor, and error names. |
| GE-06 | `go-enum`: Implementation Checklist | Carry | `references/enums.md#checklist` | Retain all listed construction and validation checks. |
| GE-07 | `go-enum`: Usage Pattern example | Carry | `references/enums.md#use` | Retain explicit construction before application use. |
| GX-01 | `go-error`: When to Use and Pattern | Carry | `references/errors.md#module-errors` | Retain module-owned stable errors and optional field-error constructors. |
| GX-02 | `go-error`: Example Structure | Replace | `references/errors.md#example` | Keep the structure but use public neutral module names. |
| GX-03 | `go-error`: Generation Steps | Carry | `references/errors.md#creation` | Retain allocation, use-path, translation, and locale discovery. |
| GX-04 | `go-error`: Naming Conventions | Carry | `references/errors.md#naming` | Retain exported names, stable codes, safe messages, and status mapping. |
| GX-05 | `go-error`: Implementation Checklist and Usage Pattern | Carry | `references/errors.md#checklist` | Retain declaration, translation, localization, and consumer evidence. |
| GX-06 | Critical rule 1: stateful-type helper placement | Replace | `references/errors.md#helpers` | Retain cohesion without banning pure package constructors, which are the expected error API. |
| GX-07 | Critical rules 2-6: module-local package, unique codes, typed boundary errors, stable messages, and complete locale entries | Carry | `references/errors.md#module-errors` | Retain every listed ownership, stability, translation, and safe-rendering constraint. |
| GM-01 | `go-gorm-model`: When to Use, Pattern, and File Structure | Carry | `references/models.md#ownership-and-shape` | Keep owner-module model placement, `TableName`, comments where exported API needs them, and narrow imports. |
| GM-02 | `go-gorm-model`: IDs, time, nullable, column, index, PostgreSQL, and FK conventions | Carry | `references/models.md#column-mapping` | Retain schema-faithful type/tag/nullability mapping. |
| GM-03 | `go-gorm-model`: Base, simple, nullable/JSONB, join-table, and default-value examples | Replace | `references/models.md#examples` | Preserve the representative model variants with public neutral names. |
| GM-04 | `go-gorm-model`: Generation Steps | Carry | `references/models.md#creation` | Migration is examined before model creation; column order and ownership are verified. |
| GM-05 | `go-gorm-model`: Type Mapping Guide | Carry | `references/models.md#type-mapping` | Keep SQL-to-Go mapping guidance with migration as source of truth. |
| GM-06 | Critical Rules and Checklist | Carry | `references/models.md#verification` | Retain model/migration alignment, deliberate tags, and no mutation of deployed schema without a migration. |
| GI-01 | `go-integration-tests`: When to Use and Planning Phase | Carry | `references/integration-tests.md#selection` | Choose integration seams for use cases and repositories; enumerate real versus uncontrolled dependencies. |
| GI-02 | `go-integration-tests`: Integration Test Suite example | Replace | `references/integration-tests.md#suite` | Preserve controlled container lifecycle, migrations, Fx composition, and isolation while neutralizing project code. |
| GI-03 | `go-integration-tests`: Mock Rules and mock example | Carry | `references/external-provider-mocks.md#integration-boundary` | Repositories and local infrastructure are real; only uncontrolled external providers are faked. |
| GI-04 | `go-integration-tests`: Table-Driven Subtests example | Carry | `references/integration-tests.md#cases` | Retain subtests for independent behavior variants. |
| GI-05 | `go-integration-tests`: Arrange-Act-Assert examples and assertion depth | Carry | `references/integration-tests.md#assertions` | Assert outputs, persisted state, side effects, and negative state. |
| GI-06 | `go-integration-tests`: Code Style and Test File Location | Replace | `references/integration-tests.md#location` | Preserve clear suite organization; permit pure helpers where they sharpen fixtures. |
| GI-07 | `go-integration-tests`: Running and Completion | Replace | `SKILL.md#impact-map-and-completion` | The router reports lint, unit, and integration commands; an unavailable prerequisite blocks completion. |
| GP-01 | `go-mapper`: When to Use, Location, Signature, and File Structure | Carry | `references/mappers.md#pure-boundary` | Retain explicit pure transformations between representations. |
| GP-02 | `go-mapper`: Basic, multiple-input, error-return, and slice examples | Replace | `references/mappers.md#examples` | Preserve the variants with public neutral contracts. |
| GP-03 | `go-mapper`: Naming | Carry | `references/mappers.md#naming` | Retain clear `To…` directionality. |
| GP-04 | Critical rule 1: functions only | Carry | `references/mappers.md#pure-boundary` | Mappers remain function-based and infrastructure-free. |
| GP-05 | Critical rules 2-5: `To` name, one output, no context, no side effects | Carry | `references/mappers.md#pure-boundary` | Preserve deterministic mapping contracts. |
| GP-06 | Critical rules 6-9: private helper, slice helper, conditional error, no redundant comments | Carry | `references/mappers.md#composition` | Retain minimal reusable mapping composition. |
| GP-07 | `go-mapper`: Workflow | Replace | `SKILL.md#impact-map-and-completion` | Retain changed-mapping discovery; use universal test gates. |
| GQ-01 | `go-repository`: When to Use, Two-File Pattern, port, and implementation structures | Carry | `references/repositories.md#port-and-adapter` | Preserve consumer-owned repository ports, concrete adapters, and interface assertions. |
| GQ-02 | `go-repository`: FindAll simple, paginated/filter, and join examples | Replace | `references/repositories.md#queries` | Preserve query-shape distinctions with neutral names; pagination details live in the focused pagination reference. |
| GQ-03 | `go-repository`: FindByID, Create, Update, zero-value, targeted-update, Delete, bulk-cleanup, and custom-query examples | Replace | `references/repositories.md#mutations-and-lookups` | Preserve correctness rules with public neutral code. |
| GQ-04 | `go-repository`: relationship transaction example | Replace | `references/transactions.md#repository-local-transaction` | Retain only the single-repository local transaction exception; multi-repository atomic work moves to the use-case transaction manager. |
| GQ-05 | `go-repository`: Fx Wiring | Carry | `references/fx-wiring.md#repository-bindings` | Bind concrete repository adapters to ports. |
| GQ-06 | `go-repository`: four named anti-pattern examples | Carry | `references/repositories.md#anti-patterns` | Retain `Limit(1)`, trace-span, nonredundant comment, and named-constructor-init safeguards. |
| GQ-07 | Critical rule 1: helper placement | Replace | `references/repositories.md#structure` | Preserve adapter cohesion while allowing dedicated pure mappers. |
| GQ-08 | Critical rules 2-4: database embedding, pointer/named constructor, assertion | Replace | `references/repositories.md#structure` | Preserve adapter construction and conformance; replace private database wrapper name with the shared database contract. |
| GQ-09 | Critical rule 5: trace every method | Carry | `references/otel.md#adapter-spans` | Retain adapter I/O spans and deferred end. |
| GQ-10 | Critical rules 6-10: `Limit(1)`, not-found, delete counts, zero values, GORM query choice | Carry | `references/repositories.md#query-correctness` | Preserve persistence correctness and use the smallest fitting GORM API. |
| GQ-11 | Critical rule 11: module errors and duplicate key translation | Carry | `references/errors.md#adapter-translation` | Translate known persistence outcomes to the owning module's stable errors. |
| GQ-12 | Critical rules 12-13: meaningful method and interface comments | Carry | `references/repositories.md#documentation` | Retain explanatory port docs and nonredundant implementation comments. |
| GQ-13 | Critical rule 14 and Workflow | Replace | `SKILL.md#impact-map-and-completion` | Replace lint/`nilaway`-only completion with universal evidence. |
| GS-01 | `go-service`: When to Use, Three-File Pattern, and file-layout order | Carry | `references/services.md#shape` | Retain a focused reusable capability with DTO, port, and adapter only when responsibility needs each. |
| GS-02 | `go-service`: DTO, Port, and Service Implementation examples | Replace | `references/services.md#examples` | Preserve interface and implementation patterns using public neutral names. |
| GS-03 | `go-service`: single-action, multi-method, and stateless variants | Carry | `references/services.md#variants` | Select the smallest shape for the responsibility. |
| GS-04 | `go-service`: Tracing and logger-parameter examples | Carry | `references/otel.md#adapter-spans` | Retain I/O tracing and structured error context. |
| GS-05 | `go-service`: Naming, Fx Wiring, and Dependencies | Carry | `references/services.md#ownership-and-wiring` | Retain port dependencies and Fx binding. |
| GS-06 | `go-service`: Error Logging Rule | Carry | `references/services.md#error-handling` | Log returned I/O errors through the established logger API before propagating them. |
| GS-07 | Critical rules 1-2: helper placement and duplicate helpers | Replace | `references/services.md#structure` | Preserve cohesive behavior; replace blanket helper bans with explicit pure-service/mapper ownership. |
| GS-08 | Critical rules 3-7: file ownership, port, DTO, assertion, constructor | Carry | `references/services.md#shape` | Retain only real artifacts and standard concrete construction. |
| GS-09 | Critical rules 8-9: I/O trace and context | Carry | `references/services.md#io` | Retain caller context and adapter observability. |
| GS-10 | Critical rules 10-12: comments, port documentation, port dependencies | Carry | `references/services.md#documentation` | Keep contracts documented and infrastructure hidden from policy. |
| GS-11 | Critical rules 13-14: error logging and logger field | Carry | `references/services.md#error-handling` | Retain error observation for fallible adapter services. |
| GS-12 | `go-service`: anti-pattern and Workflow | Replace | `SKILL.md#impact-map-and-completion` | Retain relevant artifact discovery; use universal evidence. |
| GU-01 | `go-unit-tests`: When to Use and Before Writing Tests | Carry | `references/unit-tests.md#selection` | Select the smallest deterministic seam and its meaningful cases. |
| GU-02 | `go-unit-tests`: dependency-suite examples | Replace | `references/unit-tests.md#dependent-code` | Preserve behavior-oriented suite setup with local test tools; neutralize project code. |
| GU-03 | `go-unit-tests`: standalone-function examples | Carry | `references/unit-tests.md#pure-code` | Retain simple table-driven tests for pure values and functions. |
| GU-04 | `go-unit-tests`: Mock Rules | Carry | `references/unit-tests.md#doubles` | Use doubles at external seams and prefer observable behavior. |
| GU-05 | `go-unit-tests`: Arrange-Act-Assert and Code Style | Replace | `references/unit-tests.md#structure` | Retain AAA clarity; permit pure helpers for fixtures and assertions. |
| GU-06 | `go-unit-tests`: Completion | Replace | `SKILL.md#impact-map-and-completion` | Unit tests are necessary evidence for deterministic boundaries, plus universal lint and integration gates. |
| GW-01 | `go-usecase`: Required naming and canonical implementation | Carry | `references/use-cases.md#public-operation` | Retain concrete use-case policy behind an injected public contract. |
| GW-02 | `go-usecase`: Inspect the operation contract | Carry | `references/use-cases.md#discovery` | Inspect input, owner, policy, ports, and existing behavior before editing. |
| GW-03 | `go-usecase`: operation-shape selection | Carry | `references/use-cases.md#shape` | Keep one explicit application boundary per business operation. |
| GW-04 | `go-usecase`: application contract | Carry | `references/application-dtos.md#use-case-contracts` | Keep HTTP and persistence representations outside application input/output. |
| GW-05 | `go-usecase`: `Execute` policy ordering and example | Carry | `references/use-cases.md#policy` | Validate, authorize, transition state, orchestrate ports, translate known outcomes, and map output. |
| GW-06 | `go-usecase`: Fx registration and decorator example | Carry | `references/fx-wiring.md#use-case-bindings` | Register raw/decorated public use cases in Fx. |
| GW-07 | `go-usecase`: Prove policy at boundary and Completion check | Replace | `references/integration-tests.md#use-case-evidence` | Preserve real validation, repositories, migrations, and flow; universal completion remains in the router. |
| GV-01 | `go-validator`: When to Use, Two-File Pattern, and layout | Carry | `references/validators.md#shape` | Retain a module-owned validator port and adapter when validation needs its own responsibility. |
| GV-02 | `go-validator`: port and validator examples | Replace | `references/validators.md#examples` | Preserve stateless/stateful patterns with public neutral types. |
| GV-03 | `go-validator`: stateless, stateful, and multi-field variants | Carry | `references/validators.md#variants` | Default to pure validation; add dependencies and context only for actual I/O. |
| GV-04 | `go-validator`: validation constants, error handling, and context examples | Carry | `references/validators.md#rules-and-errors` | Retain named rules, typed module errors, and context propagation for I/O validation. |
| GV-05 | `go-validator`: Naming, Fx Wiring, Dependencies, and Testing | Carry | `references/validators.md#ownership-and-evidence` | Retain module location, interface binding, and exhaustive valid/invalid tests. |
| GV-06 | Critical rule 1: no standalone functions in stateful validator | Replace | `references/validators.md#structure` | Preserve cohesion while allowing pure helpers that improve a deterministic validator. |
| GV-07 | Critical rules 2-5: port location, assertion, pointer constructor | Carry | `references/validators.md#shape` | Preserve port/adapter conformance and construction. |
| GV-08 | Critical rules 6-7: stateless default and conditional context | Carry | `references/validators.md#variants` | Retain the smallest dependency surface. |
| GV-09 | Critical rules 8-9: typed errors and all locale translations | Carry | `references/errors.md#validation-errors` | Preserve stable owned errors and localized user-safe messages. |
| GV-10 | Critical rules 10-12: constants, documentation, comprehensive tests | Carry | `references/validators.md#rules-and-evidence` | Retain named constraints, contract docs, and all invalid-condition cases. |
| GV-11 | `go-validator`: Workflow | Replace | `SKILL.md#impact-map-and-completion` | Retain validator test impact; universal gates replace the specialist command list. |

## Replacement decisions

The following changes are intentional and must not be silently weakened during
implementation:

1. API documentation stays available, but an HTTP change loads it only when
   documentation is requested; it is no longer a mandatory handler artifact.
2. A use case, not a repository, owns a multi-repository transaction through a
   transaction-manager port. A repository may still own a local transaction
   that cannot escape a single adapter operation.
3. Completion is blocked unless lint, unit tests, and integration tests run and
   are reported. Legacy per-skill `nilaway` and Swagger-generation commands
   become conditional project/documentation commands, not the universal gate.
4. Public examples use hypothetical types and module names. Project-specific
   identifiers, paths, and code in the source are replaced rather than copied.
5. The blanket ban on standalone functions is narrowed to stateful adapter
   cohesion. Pure mappers, error constructors, and focused test helpers remain
   valid in their explicit boundaries.

## Ticket-08 audit checklist

- Recompute the manifest and reconcile every changed canonical source block.
- Confirm each matrix row names one existing final destination and one decision.
- Confirm destination references preserve or explicitly replace the row's
  behavior; no source block is copied into two authoritative references.
- Confirm all public examples are hypothetical and contain no private project
  names, source, paths, or identifiers.
- Confirm the router has one direct pointer to every bundled reference and
  references do not point to one another.
