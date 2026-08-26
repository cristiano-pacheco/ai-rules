---
name: go-modular-bricks
description: Reference router for developing REST endpoints and Cobra CLI commands in Go services built with Bricks modular architecture. Use when a requested Go or Bricks change adds or alters an HTTP endpoint, business command, server command, or migration command.
---

# Go modular bricks

Route the requested change to the smallest complete set of Bricks contracts.
The original request remains the task. After loading the contracts, continue
that task without asking the user to choose specialist references.

## Route the entry point

1. Confirm from `go.mod`, imports, or existing composition that the project uses
   Bricks modular architecture.
2. Read `references/data-flow.md` in full. Its dependency and representation
   rules apply to every route.
3. Inspect the owning module and the closest comparable flow.
4. Select one route:
   - For an HTTP endpoint, read `references/flows/rest.md` in full.
   - For a Cobra business, server, or migration command, read
     `references/flows/cli.md` in full.
5. Follow that route's pointers. Read every selected reference in full before
   editing. Select conditional references from the requested behavior and the
   comparable flow, not from directory names alone.

Routing is complete when every changed or reused boundary has a selected
contract and no unrelated reference was loaded.

When a local precedent or requested change conflicts with an invariant, read
`references/adr-exceptions.md` in full, then search `docs/adrs`. An ADR applies
only when its content explicitly justifies that violation for the current
context. Without an applicable ADR, keep the new flow compliant and report the
existing violation. If compliance is impossible without expanding the task,
stop and ask. Ask before creating a new ADR.

Do not pause merely to announce the selected references. In the final report,
name the route and references used.

## Verify through the project

After the original task is implemented, read `docs/agents/verification.md` when
it exists and run its applicable gates. Otherwise inspect the `Makefile` and
run these targets only when defined:

1. `make lint`
2. `make test`
3. `make test-integration`

Record each command and result. Report missing targets and unavailable
prerequisites without inventing replacement commands or claiming success.
