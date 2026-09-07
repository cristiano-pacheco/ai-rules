---
name: go-modular-bricks
description: Implement, refactor, or review Go Bricks modules, including use cases, ports, adapters, Fx wiring, REST endpoints, and Cobra commands.
---

# Go modular bricks

Use the project's contracts to complete the requested change or review. Bricks
may be established by repository guidance, module layout, imports, or `go.mod`.

## Select the contracts

Read the project's `CODING_STANDARDS.md` when present, then
[the dependency and representation rules](references/data-flow.md). Follow the
project's documented source precedence. Explicit project standards and accepted
ADRs select local variants over generic examples here; nearby code is evidence,
not authority. Resolve an actual conflict through
[architecture exceptions](references/adr-exceptions.md).

Select references by the affected behavior:

| Task | Reference |
| --- | --- |
| REST endpoint or HTTP boundary | [REST flow](references/flows/rest.md) |
| Cobra business command or process lifecycle | [CLI flow](references/flows/cli.md) |
| Internal application, persistence, mapping, configuration, or composition change | [Application contracts](references/flows/application.md) |
| Architecture review | Use the same routes for the boundaries in the diff |

Read each selected contract before changing or judging its boundary. For a
narrow change, inspect its owner and callers; for a behavior change, trace input,
use case, ports, adapters, Fx registration, and output. Include affected tests,
public contracts, locales, migrations, and generated artifacts. Load further
references when that trace reveals another affected boundary, including one
that is reused unchanged. Documentation-only edits need only their subject's
contracts.

## Complete the change

Check the final diff, including added, moved, deleted, and untracked artifacts,
against the selected contracts and project standards. Check ownership, public
representations, and runtime wiring explicitly; passing tests alone cannot
establish those properties. If the diff expands, select the newly affected
contracts and finish the corresponding work.

Use the project's verification instructions and existing test seams for the
changed behavior. Inspect `docs/agents/verification.md` when present, otherwise
use the repository's build and test configuration. Fix failures caused by the
change and rerun affected checks. Report unavailable prerequisites accurately.

Finish when the requested behavior is complete, its affected contracts have
been checked, and applicable verification has passed or a concrete blocker is
reported. For a review, report evidenced violations without implementing fixes
unless requested. Summarize validation and any unresolved conflict or debt.
