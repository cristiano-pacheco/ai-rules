---
name: ai-to-tickets-workplan
description: Publish one stored Workplan spec as a context-sized ticket graph through wp.
disable-model-invocation: true
---

# ai-to-tickets-workplan

Read one stored spec, split it into tracer-bullet tickets, and publish the directed acyclic prerequisite graph without another approval round. The invocation authorizes publication.

Before using `wp`, load the `ai-workplan` skill. If it is unavailable, stop and tell the user to install it. Follow its pointers to the machine-output, workplan, project, label, ticket, and dependency references. Those references define the command flags, envelopes, pagination, selectors, and typed errors.

## Process

1. **Resolve one spec.** Prefer an explicit spec slug, then the canonical resource returned by an immediately preceding `ai-to-spec-workplan` invocation, then an exact slug named in the conversation. Otherwise list every `spec` workplan through `wp --json workplan list --type spec`, following all cursors. Use the sole result when exactly one exists. Similar titles, recency, and workplan content do not make a choice unique.

   Ask for an exact spec slug only when these rules produce no unique target. Make no tracker mutation before resolution. For a selected slug, run `wp --json workplan show <slug>`, check `schema_version`, and require the returned type to be `spec`. Return any typed lookup failure instead of substituting another workplan. The stored `content_markdown` is the source spec; do not use a conversation copy in its place.

   This step is complete when one exact stored spec resource has been read through `wp --json`.

2. **Resolve project context and the publication label.** List projects through `wp --json project list`, following every cursor. If the invocation gives a project, resolve it to its listed canonical path. Otherwise resolve the current directory to its canonical path and select the longest registered ancestor. Ask for a registered project only when no project can be derived. Use the selected canonical path explicitly on every ticket create.

   List labels through `wp --json label list`, following cursors until `ready-for-agent` is found or the list ends. Stop before publication when the canonical label is absent. Setup, not this skill, owns project registration and label creation.

   This step is complete when one canonical project path and the `ready-for-agent` label both exist.

3. **Draft tracer bullets.** Explore the repository only as needed to split the stored spec against the current implementation, glossary, ADRs, and closest test precedent. Build narrow vertical slices. Each ticket must fit in one fresh context window and deliver an independently verifiable path through every affected layer. Use a prefactor ticket only when it leaves the repository green and directly enables later slices.

   Give every ticket one literal type:

   - `research` closes a named unknown with evidence;
   - `prototype` tests a risky path with a disposable artifact;
   - `grilling` settles a decision through structured questioning;
   - `task` ships production behavior.

   Write each body as complete Markdown for an agent that has only the stored ticket, repository, and source spec available:

```markdown
## What to build

Describe the end-to-end result and its boundary.

## Acceptance criteria

- [ ] Add one or more observable, checkable outcomes.

## Context

Record ticket-specific decisions, constraints, and prerequisite rationale without copying the whole spec.

## Verification

Name the behavior to prove and the highest useful existing test seam.
```

   Replace every instruction in the template with concrete content. Each body has at least one acceptance criterion. Keep implementation trivia out unless the spec settled it.

   Derive each slug from its title: lowercase ASCII, replace every run outside `a-z` and `0-9` with one hyphen, trim edge hyphens, and limit it to 63 bytes without an edge hyphen. If two drafted tickets normalize to the same slug, append the lowest numeric suffix from `-2`, reserving suffix bytes before truncating the base. Slugs depend only on the settled graph and its draft order, so rerunning the decomposition produces the same values.

   This step is complete when every spec behavior and failure boundary belongs to a context-sized ticket with a stable slug, literal type, complete body, verification seam, and direct prerequisite set.

4. **Validate and order the graph.** Treat each prerequisite as an edge from a blocked ticket to an earlier ticket. Reject self-edges, duplicate edges, missing nodes, and cycles before calling `ticket create`. Topologically sort the graph with prerequisites first. Preserve draft order whenever several nodes are available, which makes ticket numbers deterministic.

   This step is complete when every ticket appears after all of its prerequisites and the ordered graph contains every direct edge exactly once.

5. **Publish in topological order.** For each ticket, write its exact Markdown to one private temporary `.md` file. Create it with one call:

```text
wp --json ticket create \
  --workplan <spec-slug> \
  --slug <ticket-slug> \
  --title <ticket-title> \
  --type <research|prototype|grilling|task> \
  --status ready \
  --content <temporary-file> \
  --project <canonical-project-path> \
  --label ready-for-agent \
  [--prerequisite <complete-prerequisite-identifier>]...
```

   Pass the ticket's full direct prerequisite set as repeatable `--prerequisite` flags in that create operation. Build identifiers from successful create responses, not predicted ticket numbers. Never create a ready dependent and add edges afterward.

   After each call, remove its temporary file before another tracker operation. On success, check `schema_version` and verify the canonical resource's workplan, slug, title, type, exact Markdown, `ready` status, project, label, and prerequisite set. Record its complete identifier for dependents.

   On any failure or response mismatch, stop. Return the typed code, failed slug, command purpose, and identifiers already created. Do not retry `database_busy`, delete created tickets, repair edges, or continue with dependents.

   This step is complete when every create succeeds in topological order and every returned resource matches the draft and full prerequisite set.

6. **Return the graph.** Return the source spec slug and the canonical ticket resources in creation order. Summarize each ticket's complete identifier and prerequisite identifiers. Do not run a second approval or status pass.
