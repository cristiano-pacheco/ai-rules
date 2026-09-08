---
name: go-modular-bricks
description: Develop, maintain, or review Go services using Bricks modular architecture.
---

# Go modular bricks

## Establish project rules first

Read the project's agent instructions and documented coding standards before
selecting examples. Follow their pointers to affected interface contracts and
accepted ADRs. Use the project's document paths, not assumed filenames. Record the local
rules for ownership, errors, private functions, comments, wiring, and tests.
These rules override generic recipes throughout the skill. Nearby code does not
authorize a violation. Consult [architecture exceptions](references/adr-exceptions.md)
for unresolved conflicts or undocumented departures.

## Classify before choosing a package

For each new or extracted responsibility, state its behavior, owner, intended
file, and selected contract before editing. For review, classify each affected
responsibility before judging it. A requested name, existing package, receiver,
number of callers, or use of I/O does not determine ownership.

| Behavior | Owner / contract |
| --- | --- |
| Public business operation and orchestration | Use case; application router |
| Simple operation-local input shape constraint | Use-case input validation; application router |
| Reusable acceptance/rejection rule, including checks requiring external data | `validator/` plus consumer-owned `ports/<name>_validator.go`; [validators](references/validators.md) |
| Convert one representation into another, including parsing and collection assembly | Boundary-owned `mapper/`; [mappers](references/mappers.md) |
| Persist data, adapt a remote protocol, or integrate a vendor | Repository, client, or provider respectively; application router |
| Reusable capability not owned by a more specific category above | `service/`; [services](references/services.md) |

A loader owns I/O and delegates reusable checks to a validator and extracted
conversions to a mapper. Private methods must implement the receiver's own
responsibility. Adding a receiver or moving methods to another file in `service/`
does not make validation or mapping service-owned.

## Route by responsibility

Identify the boundary being changed, diagnosed, or reviewed from the task and
owning code. A SQL fix behind an endpoint is a persistence task, not automatically
a REST task. If the owner is unknown, trace the failing path before selecting
specialists.

| Responsibility in scope | Router |
| --- | --- |
| HTTP DTOs, handlers, routes, middleware, collection queries, API documentation | [REST](references/flows/rest.md) |
| Cobra business commands, server or migration-command behavior | [CLI](references/flows/cli.md) |
| Use cases, types, mapping, ports, adapters, schema, Fx, configuration, ownership, resources, telemetry, tests | [Application](references/flows/application.md) |

Read [data flow](references/data-flow.md) when changing or judging dependency
direction, representation boundaries, or application/entry-point orchestration.
Local implementation or content fixes need only their specialists.

## Loading boundaries

- Select matching rows and triggered companions, taking the union for mixed
  tasks. Paths resolve relative to the document containing them. Read selected
  contracts in full before editing or judging their boundary.
- Inspect callers and dependencies without automatically loading their
  specialists. Expand only for an affected responsibility or a specific
  unverified guarantee, such as absence semantics or transaction participation.
  Stop at unchanged boundaries whose relevant guarantees are verified.
- Links are conditional pointers, not a recursive reading list. Load only the
  selected runtime profile's example; reuse contracts already in context.
- Test-only work selects the proof seam and asserted behavior's specialist.
  Documentation-only work selects its subject. Reviews select every boundary
  being judged, including unchanged ones explicitly in scope.

## Verify ownership before finishing

Reclassify every added or changed function and method by its body, including
private methods and helper-only files. Match each to the owner and file selected
above; extract misplaced validation and mapping before declaring completion.
Then verify public representations, affected runtime registration, project error
patterns, and the project-selected test seam. Re-select contracts if the diff
expands.

Run the required lint, architecture checks, tests, and independent review that
the project configures. Report each as passed, failed, or not run, with evidence
or a blocker. Missing tools cannot produce a pass. Self-review cannot substitute
for independent review. Keep the task incomplete until all required checks pass
and every affected boundary satisfies its contract. Fix the implementation;
changing approval rules or weakening tests requires explicit authorization.
