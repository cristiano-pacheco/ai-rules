# Issue tracker: Workplan

This repo resolves to project name **`<project-name>`** (basename of `git rev-parse --show-toplevel`). Its Workplan project is **`<canonical-repository-path>`**, the canonical physical repository path registered by setup.

Specs are `spec` Workplans, wayfinding maps are `wayfinder` Workplans, and their child issues are Tickets. Workplan natively stores Ticket prerequisites, project assignment, lifecycle, labels, and reviews.

## CLI contract

Use only `wp --json` for tracker reads and writes. Before using a command family, load `ai-workplan`, read that family's reference, and check the command's `--help`; those sources define current flags and response fields.

Require `schema_version: 1`; read success from `data`, branch on `error.code`, ignore additive fields, and follow `page.next_cursor` with unchanged filters whenever completeness is required. Stop all tracker calls on `database_busy`. Pass Markdown through a user-private temporary file and remove it after the call.

Project discovery chooses the longest registered ancestor of the working directory; publication commands pass the intended canonical project explicitly. Ticket identifiers are `<workplan-slug>/<NN>-<ticket-slug>`. Slugs match `[a-z0-9]+(-[a-z0-9]+)*` and are at most 63 bytes.

## Skill routing

Use the tracker-neutral workflows; this document supplies their Workplan operations: `ai-to-spec` publishes a `spec` Workplan, `ai-to-tickets` publishes its Ticket graph, `ai-implement` executes one Ticket, and `wayfinder` charts or works through a `wayfinder` Workplan. `ai-workplan` is only the CLI reference.

## Publish a spec

When `ai-to-spec` says to publish:

1. Preserve its final Markdown exactly. Derive a valid slug from the title, list every Workplan because slugs are global, and use the base slug or its lowest free numeric suffix (`-2`, `-3`, …), truncating the base to fit.
2. Set `--source` only for an explicitly identified source that resolves to one slug; similarity and recency establish no lineage.
3. Run `wp --json workplan create --type spec --slug <slug> --title <title> [--source <source-slug>] --content <file>` and verify that the returned type, slug, title, source, and `content_markdown` exactly match the draft.

On `already_exists`, retry only the create with the next suffix and unchanged title, source, and content. Preserve every existing Workplan; any other error ends publication. Workplans have no labels; apply `ready-for-agent` when creating their Tickets.

## Fetch tracker context

Resolve an explicit spec slug first, then the canonical result of an immediately preceding publication. Otherwise ask for the exact slug; similarity and recency are not selectors. Run `wp --json workplan show <slug>` and use stored `content_markdown`, never a conversation copy.

Fetch a Ticket with `wp --json ticket show <complete-identifier>`. When review history matters, read every page of `wp --json review list <complete-identifier>`; reviews are immutable and oldest first.

## Publish a ticket graph

For the graph approved in `ai-to-tickets`:

1. Give each Ticket a literal type: `research`, `prototype`, `grilling`, or `task`; use `task` for production behavior. Resolve each Ticket independently to an explicit registered project path, or intentionally choose `--no-project`. Require the global `ready-for-agent` label; only setup creates missing labels or projects. Validate and topologically order the graph with every prerequisite before its dependents.
2. Before writing, list every Ticket under the spec across all projects. An existing drafted slug is compatible only when its title, type, exact body, project, labels, and complete prerequisite set match. Compatible Tickets must form a prefix of the ordered graph; otherwise report a publication conflict and preserve tracker state.
3. Create the missing suffix in order with `wp --json ticket create`, the Workplan and draft fields, `--label ready-for-agent`, the explicit project selection, and every direct `--prerequisite`. Build prerequisite identifiers only from successful Workplan responses. Creation sets status `ready-for-agent`; it has no status flag. Verify the complete returned Ticket and prerequisite set before creating a dependent.

On failure, remove the temporary file, report the typed error and identifiers already created, and stop without rollback or parent-Workplan mutation.

## Implementation ticket lifecycle

For Workplan, the stored Ticket replaces the “ticket file” named by `ai-implement`:

1. Claim a named complete identifier with `wp --json ticket claim <complete-identifier>`; otherwise run `wp --json ticket claim-next` from this repository with only user-supplied filters. A Ticket is claimable when it is `ready-for-agent` and every prerequisite is `resolved`; `no_ready_ticket` is clean no-work.
2. Keep the complete claim response as the execution snapshot. Implement only that Ticket and account for every acceptance criterion in its `content_markdown`. Claimed Tickets cannot be updated, so leave that Markdown unchanged and record criterion evidence during the run.
3. Store the exact `ai-review-changes` report as an immutable review with `wp --json review add <complete-identifier> --content <file>`. Resolve only after every criterion and required check passes, the review has no Standards or Spec findings, and the reviewed change is committed.
4. Run `wp --json ticket resolve <complete-identifier>` and verify status `resolved`; `ticket status` does not replace `claim` or `resolve`.

Claims have no owner, expiry, or release operation. After unsuccessful or interrupted work, preserve the worktree and claim; report the identifier, current state, and blocker.

## Labels

Use the labels mapped in `docs/agents/triage-labels.md`. On Ticket update, `--label` replaces the complete label set; pass every label that must remain.

## Wayfinding operations

Used by `/wayfinder`. The **map** is one `wayfinder` Workplan; its **child tickets** belong to that Workplan.

- **Map:** create it with `wp --json workplan create --type wayfinder --slug <slug> --title <title> --content <file>`. The Workplan type replaces the tracker-neutral `wayfinder:map` label.
- **Child ticket:** create it under the map with `wp --json ticket create --workplan <map-slug> ... --type <research|prototype|grilling|task> --content <file> --project <canonical-repository-path>`. The Ticket type replaces its tracker-neutral `wayfinder:<type>` label.
- **Blocking:** pass every known direct prerequisite atomically during Ticket creation. Add a later edge with `wp --json dependency add <blocked-ticket> <prerequisite>`. Keep every edge within the map and the graph acyclic.
- **Frontier:** run `wp --json ticket ready --workplan <map-slug> --project <canonical-repository-path>` and take its first Ticket. A user-named Ticket must appear in that frontier.
- **Claim:** run `wp --json ticket claim <complete-identifier>` before work.
- **Map update:** immediately before replacing map content, fetch the latest Workplan, change only the intended section, then run `wp --json workplan content <map-slug> --content <file>`; this command replaces the whole body.
- **Resolve:** store the exact answer with `wp --json review add <complete-identifier> --content <file>`, resolve the Ticket, then append `- **<title>** (<complete-identifier>): <one-line gist>` under **Decisions so far**. Workplan has no stable resource URL.
- **New fog and scope changes:** create and wire newly specifiable Tickets, then remove their questions from **Not yet specified** in the same map update. For a Ticket ruled out of scope, store the rationale as its review, resolve it, and append its pointer and reason under **Out of scope**, not **Decisions so far**.
