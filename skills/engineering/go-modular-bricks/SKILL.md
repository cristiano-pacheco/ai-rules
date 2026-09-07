---
name: go-modular-bricks
description: Develop, maintain, or review Go services using Bricks modular architecture.
---

# Go modular bricks

Apply the project's documented source precedence: explicit standards and accepted
ADRs override generic examples here; nearby code is evidence, not authority.
Consult [architecture exceptions](references/adr-exceptions.md) for unresolved
contract conflicts or undocumented departures.

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

Complete when every in-scope boundary satisfies its selected contracts and project
verification, or report a concrete blocker. Re-select if the diff expands; check
ownership, public representations, and runtime registration where affected.
