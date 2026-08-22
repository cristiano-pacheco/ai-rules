# Go Skill Scenario Matrix

This matrix is the acceptance contract for the Go skill catalogue. It checks
observable execution behavior, not a required chain of thought, wording, file
layout, or framework. A scenario passes when the resulting work supplies the
evidence in the common contract and the row-specific outcome.

## Common execution contract

Every specialist scenario uses this sequence:

1. **Inspect.** Establish the target module's Go version (when Go code is in
   scope), nearby analogous artifacts, package ownership and naming, relevant
   dependencies, composition mechanisms, and documented validation commands.
2. **Choose.** Select a locally supported variant. A framework, helper, or
   package is allowed only when present in local evidence or explicitly
   requested. If inspection leaves more than one material design choice open,
   request direction rather than inventing one.
3. **Implement.** Produce only the requested artifact and directly necessary
   companion changes, following the chosen local convention.
4. **Validate.** Run the narrowest applicable documented command or explain
   concretely why none can run. Whole-repository validation is not required
   when a package, test, build, or formatter command is sufficient.
5. **Report.** Name changed artifacts, the material conventions detected, the
   selected variant, and the validation command and result. State an ambiguity
   or blocked validation plainly when applicable.

`100-go-rules` is global guidance, not a required child step of a specialist.
When it is selected, it must discover `go.mod` first, use its declared version
when present, otherwise use Go 1.26, and load only the relevant reference
domain(s). The version notes are evidence only for version-sensitive work or a
target other than Go 1.26.

## Scenario matrix

| Skill | Scenario | Repository evidence supplied | Required observable outcome |
| --- | --- | --- | --- |
| `go-chi-handler` | Normal endpoint | A module has Chi handlers, HTTP DTOs, error translation, and package tests. | Inspects an analogous handler and the router; creates the requested handler/DTO using those conventions; runs the focused handler package test; reports transport, mapping, error, and test evidence. |
| `go-chi-handler` | Changed transport | The module uses `net/http` or another router and has no Chi dependency. | Does not add Chi or Chi-only APIs; follows the existing transport if the request remains applicable, otherwise explains that the requested Chi artifact conflicts with local evidence and asks for direction. |
| `go-chi-handler` | Completion evidence | A target handler package has a documented focused test command. | Chooses that command over a broad suite and reports its exact result with the changed files and selected error/response convention. |
| `go-chi-router` | Normal routes | Existing Chi route groups and dependency composition are present. | Inspects a neighboring router and composition root; adds the requested registration with matching grouping and injection style; validates the narrowest router/package test; reports the route and wiring evidence. |
| `go-chi-router` | Changed composition | Chi is present but wiring is manual or uses a DI container other than Fx. | Retains the observed composition mechanism and does not add Fx merely because it is a familiar variant. |
| `go-chi-router` | Completion evidence | A route package exposes a targeted test or build command. | Runs that command and reports route artifact, local routing/composition convention, and result. |
| `go-usecase` | Normal operation | A module has operation types, ports, validation, and use-case tests. | Inspects a comparable operation and its collaborators; adds the requested operation with matching ownership, input/output shape, and error handling; runs its focused test; reports the selected pattern. |
| `go-usecase` | Changed application shape | The module uses functions, command handlers, or a different validation approach. | Uses the local application boundary instead of imposing an `Execute` struct or a particular validator package. |
| `go-usecase` | Completion evidence | A package-level test command is documented. | Runs the package command and reports changed operation artifacts, observed boundary/validation conventions, and outcome. |
| `go-service` | Normal reusable service | Nearby services expose an interface and implementation with local constructor conventions. | Inspects adjacent services and creates the requested service in their ownership/naming pattern; runs a focused package test; reports the dependency and lifecycle convention used. |
| `go-service` | Changed service model | The codebase has direct concrete services or pure functions, not ports. | Reuses that established model and does not introduce a port or logging dependency without evidence. |
| `go-service` | Completion evidence | The service package has a narrow test or build command. | Runs it and reports artifact, selected local pattern, and result. |
| `go-validator` | Normal validation rule | Validators and typed/domain errors already exist. | Inspects a comparable rule and creates the requested validator using the local interface, error, and dependency conventions; runs its focused test; reports those findings. |
| `go-validator` | Changed validation stack | Validation is tag-based, library-provided, or inline at the application boundary. | Extends the local validation mechanism instead of creating a validator port by default. |
| `go-validator` | Completion evidence | A validator or owning package test is available. | Runs the narrowest relevant test and reports the changed rule, selected validation path, and result. |
| `go-mapper` | Normal transformation | Neighboring pure mapping functions translate between two established layers. | Inspects source/target ownership and analogous mappings; creates the requested mapping in the local package and naming style; runs focused mapping/package tests; reports the boundary selected. |
| `go-mapper` | Changed boundary | Mapping is colocated with an adapter or generated by an established local tool. | Uses the observed boundary or generation workflow; does not create a standalone mapper package without evidence. |
| `go-mapper` | Completion evidence | A target mapper test or package test exists. | Runs it and reports source/target convention, artifacts changed, and result. |
| `go-enum` | Normal constrained type | The module has a local enum representation and parsing/validation pattern. | Inspects a comparable type and creates the requested enum with matching representation and validation behavior; runs its focused test; reports the pattern used. |
| `go-enum` | Changed representation | Existing types use constants, integers, or a dependency rather than string methods. | Follows the local representation and does not impose string enums or methods absent from the project. |
| `go-enum` | Completion evidence | The owning package has targeted tests. | Runs the targeted test and reports the type convention, files changed, and outcome. |
| `go-error` | Normal typed error | The module defines sentinel or typed errors and maps them at a boundary. | Inspects error declarations and propagation/mapping; adds the requested error in the same model; runs the focused package test; reports the error convention selected. |
| `go-error` | Changed error model | The project wraps errors, uses error codes, or relies on a shared error package. | Uses that mechanism and does not add a new typed-error package or sentinel pattern without evidence. |
| `go-error` | Completion evidence | An error-owning package test is available. | Runs it and reports changed errors, observed propagation convention, and result. |
| `go-gorm-model` | Normal persistence model | `gorm.io/gorm`, model conventions, and migration or model tests are present. | Inspects an analogous model, key/association conventions, and validation seam; creates the requested model compatibly; runs the narrowest relevant validation; reports GORM evidence and result. |
| `go-gorm-model` | Different persistence stack | The module uses SQL, another ORM, or no persistence dependency. | Does not add GORM; follows the local persistence representation if requested or asks for direction when a storage choice is unresolved. |
| `go-gorm-model` | Completion evidence | A model/package test, build, or formatter is documented. | Runs the narrowest applicable command and reports artifact, datastore convention, and outcome. |
| `go-repository` | Normal repository | Existing repository ports and implementations use a confirmed database/ORM. | Inspects the interface, implementation, query/error, and transaction patterns; creates the requested repository with the compatible variant; validates the focused package/test; reports datastore and transaction evidence. |
| `go-repository` | Ambiguous persistence | No repository, datastore dependency, or architecture decision resolves SQL versus another store. | Surfaces the material persistence choice after inspection and requests direction; does not invent GORM, schema, or transaction behavior. |
| `go-repository` | Completion evidence | A repository package has a narrow unit or integration command. | Runs the strongest available narrow seam and reports changed artifacts, chosen query/transaction convention, and result. |
| `go-cache` | Normal cache | Redis dependency and analogous cache/key/TTL behavior exist. | Inspects the cache client, serialization, key, miss, and TTL conventions; creates the requested cache using them; runs focused cache/package tests; reports Redis evidence and outcome. |
| `go-cache` | Cache absent or different | No Redis dependency exists, or caching uses memory/a different provider. | Does not add Redis; follows the observed provider when the request permits, otherwise raises the unresolved cache/provider decision. |
| `go-cache` | Completion evidence | A cache package test or targeted command is present. | Runs it and reports cache artifact, selected storage/expiry convention, and result. |
| `go-unit-tests` | Normal unit seam | The repository has package tests, its chosen assertion library, and local mocks or fakes. | Inspects test style and dependency seams; adds focused behavioral tests using the existing library and doubles; runs the selected package/test command; reports the seam and result. |
| `go-unit-tests` | Changed test stack | The module uses the standard library and hand-written fakes, with no Testify or mock generator. | Uses `testing` and local fakes; does not add Testify, mocks, or suite scaffolding without evidence. |
| `go-unit-tests` | Completion evidence | A single-package or single-test runner is supported. | Chooses the narrowest runner and reports tests added, local test convention, command, and result. |
| `go-integration-tests` | Normal infrastructure seam | Existing integration tests use a confirmed database/container/helper workflow. | Inspects tags, fixtures, cleanup, and runner; adds a test at the strongest existing integration seam; runs the targeted integration command; reports infrastructure evidence and result. |
| `go-integration-tests` | Infrastructure absent | No containers, test database, or integration runner is configured. | Does not introduce Testcontainers or external infrastructure; selects an existing seam if one exists, otherwise explains the missing prerequisite and asks for direction. |
| `go-integration-tests` | Completion evidence | The project documents a focused integration command or tag. | Runs that command when prerequisites are available, or reports the concrete unavailable prerequisite and no fabricated pass result. |
| `100-go-rules` | Normal language decision | A `go.mod` declares a Go version and a task concerns error handling. | Discovers the declared version, loads `06-errors.md` only (plus version notes only if version-sensitive), applies relevant guidance, and reports any material version constraint. |
| `100-go-rules` | No module/version | Go source is supplied without a target `go.mod`. | States or applies the Go 1.26 fallback without claiming a discovered project version; loads only the domain relevant to the request. |
| `100-go-rules` | Selective completion evidence | A concurrency task does not touch testing, optimization, or standard-library compatibility. | Loads the applicable concurrency reference(s), not unrelated domains; reports the selected domain(s), effective version, and any validation evidence without requiring a specialist skill. |

## Matrix review rules

- Rows are reviewed against the rewritten skill, not executed by a mandatory
  evaluation framework. A maintainer may use repositories, fixtures, or a
  reasoned walkthrough to establish the listed evidence.
- A row may use different concrete commands, packages, names, and framework
  variants when local evidence supports them. The invariant is inspection,
  compatible choice, artifact, narrow validation, and report.
- A specialist may be paired with `100-go-rules` for a material Go-wide
  decision; it must not claim that pairing is required for ordinary execution.
