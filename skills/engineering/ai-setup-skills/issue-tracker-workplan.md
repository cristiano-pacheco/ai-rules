# Issue tracker: Workplan

Specs are Workplans of type `spec`; implementation issues are Tickets owned by a spec. Ticket prerequisites, project assignment, lifecycle, labels, and reviews are native Workplan data.

## CLI contract

Use only `wp --json` for tracker reads and writes. The SQLite database and read-only web UI are not agent interfaces. Before using a command family, load `ai-workplan`, read that family's reference, and check the command's `--help`; those sources, rather than this adapter, define current flags and response fields.

Require `schema_version: 1` on every response. Read success from `data`; branch on `error.code`, not message text; ignore additive fields. Follow every `page.next_cursor` with unchanged filters when a complete result set is required. Pass Markdown through an explicit private file so Workplan stores its exact bytes, then remove the file. Stop all tracker calls on `database_busy`.

The canonical project path is `<canonical-repository-path>`. Setup registers this exact physical path. Project discovery chooses the longest registered ancestor of the command's working directory; publication commands pass the intended canonical path explicitly.

Complete Ticket identifiers have the form `<workplan-slug>/<NN>-<ticket-slug>`. Commands that take a Ticket use this complete identifier. Slugs match `[a-z0-9]+(-[a-z0-9]+)*` and are at most 63 bytes.

## Skill routing

Use the tracker-neutral workflow skills; this document supplies their Workplan operations:

- `ai-to-spec` → publish one `spec` Workplan;
- `ai-to-tickets` → publish Tickets and their prerequisite graph under that spec;
- `ai-implement` → claim, implement, review, commit, and resolve one Ticket.

`ai-workplan` is the CLI reference, not a replacement workflow.

## Publish a spec

When `ai-to-spec` says to publish to the issue tracker:

1. Preserve its final Markdown exactly in one private temporary file.
2. Derive a valid slug from the title. List all Workplans through full pagination because slugs are global across types. If the base is occupied, use the lowest available numeric suffix (`-2`, `-3`, …), truncating the base as needed to remain within 63 bytes.
3. Include `--source <slug>` only when the conversation explicitly identifies that source and it resolves uniquely. Similar titles and recency do not establish lineage.
4. Create, then verify the returned type, slug, title, source, and exact `content_markdown`:

```text
wp --json workplan create --type spec --slug <slug> --title <title> [--source <source-slug>] --content <file>
```

On `already_exists`, advance to the next suffix and retry only the create with the same title, source, and content. Preserve every existing Workplan; another error ends publication.

Workplans cannot carry labels. Apply `ready-for-agent` when creating the spec's Tickets, not to the spec itself.

## Fetch tracker context

Resolve an explicit spec slug first, then a canonical resource returned by an immediately preceding publication. If neither identifies one spec, ask for the exact slug; title similarity or recency is not a selector. Fetch the stored source with `wp --json workplan show <slug>` and use its `content_markdown`, not a conversation copy.

When a skill says to fetch a Ticket, run `wp --json ticket show <complete-identifier>`. If its review history is relevant, read `wp --json review list <complete-identifier>` through full pagination; reviews are immutable and returned oldest first.

## Publish a ticket graph

Workplan publication requires one exact stored spec. For the approved graph from `ai-to-tickets`:

1. Assign each Ticket a literal type: `research`, `prototype`, `grilling`, or `task`. Use `task` for production behavior. Give it a stable valid slug and complete Markdown with observable acceptance criteria.
2. Resolve each Ticket independently to an explicit canonical project path. Use `--no-project` only for intentionally unassigned work. Confirm the global `ready-for-agent` label exists; setup owns missing labels and project registrations.
3. Validate an acyclic graph and topologically order it with every prerequisite before its dependents.
4. Before writing, list all Tickets under the spec across all projects. Reuse an existing drafted slug only when its title, type, exact body, project, labels, and complete prerequisite set match. Compatible existing Tickets must form a prefix of the ordered graph; otherwise stop with a publication conflict and preserve tracker state.
5. Create the missing suffix in order. Build prerequisite identifiers only from successful Workplan responses and pass every direct edge atomically:

```text
wp --json ticket create \
  --workplan <spec-slug> \
  --slug <ticket-slug> \
  --title <title> \
  --type <research|prototype|grilling|task> \
  --content <file> \
  --project <canonical-project-path> \
  --label ready-for-agent \
  [--prerequisite <complete-identifier>]...
```

Use `--no-project` in place of `--project` when appropriate. Creation sets the stored status to `ready-for-agent`; there is no create-time status flag. Verify every returned field and prerequisite set before creating a dependent. On failure, remove the temporary file, report the typed error and already-created identifiers, and stop without rollback or parent-spec mutation.

## Implementation ticket lifecycle

For Workplan, the stored Ticket resource replaces the “ticket file” named by `ai-implement`.

1. Claim an explicitly named Ticket with `wp --json ticket claim <complete-identifier>`. If no Ticket was named, use `wp --json ticket claim-next` from this repository, adding only filters the user supplied. A Ticket is claimable when its status is `ready-for-agent` and every prerequisite is `resolved`. `no_ready_ticket` is a clean no-work result.
2. Keep the complete claim response as the execution snapshot. Implement only that Ticket and account for every acceptance criterion in its `content_markdown`.
3. Claimed Tickets cannot be updated. Record criterion evidence during the run and require every checkbox to be satisfied before resolution; leave the stored Markdown unchanged rather than trying to tick it.
4. When `ai-review-changes` returns a report, store those exact bytes as an immutable review with `wp --json review add <complete-identifier> --content <file>`. Resolve only after all criteria and required checks pass, the review has no Standards or Spec findings, and the reviewed change is committed.
5. Finish with `wp --json ticket resolve <complete-identifier>` and verify the returned Ticket is `resolved`. `ticket status` only assigns a stored status; it does not replace the atomic `claim` or `resolve` lifecycle operations.

A claim has no owner, expiry, or release operation. On an unsuccessful or interrupted implementation, preserve the worktree and claim, then report the Ticket identifier, current state, and blocker.

## Labels

The global label slugs are `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`, as mapped in `docs/agents/triage-labels.md`. Setup creates missing slugs and leaves existing labels unchanged. On Ticket update, supplied `--label` values replace the whole label set; preserve intended existing labels explicitly.
