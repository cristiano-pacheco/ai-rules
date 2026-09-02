# Issue tracker: Workplan

Specs, tickets, dependencies, claims, statuses, and reviews for this repository live in Workplan. The SQLite database and read-only web UI are not agent interfaces. Use `wp --json` for every tracker read and write.

## Repository project

The canonical project path is `<canonical-repository-path>`. Setup registers this exact physical path. Current-project discovery selects it when a Workplan command runs from this repository or one of its descendants.

## Skill routing

- Load `ai-workplan` before any direct `wp` command. Its references define command flags, JSON envelopes, pagination, selectors, and typed errors.
- Use `ai-to-spec-workplan` to publish a spec.
- Use `ai-to-tickets-workplan` to turn a stored spec into a ticket graph.
- Use `ai-implement-workplan` to claim and execute one ticket.

Use the Workplan-specific skill instead of its tracker-neutral counterpart for these flows.

## Labels

This project uses the canonical global label slugs in `docs/agents/triage-labels.md`: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. Setup creates a slug only when it is missing and leaves existing labels unchanged.

## Operating rules

Check `schema_version` on every response and branch on `error.code`, not message text. Ignore additive unknown JSON fields. Follow pagination cursors until the operation has enough data. Pass Markdown through an explicit file or stdin. Do not retry `database_busy`.
