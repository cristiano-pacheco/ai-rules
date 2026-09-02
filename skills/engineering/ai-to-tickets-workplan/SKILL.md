---
name: ai-to-tickets-workplan
description: Publish one stored Workplan spec as a context-sized ticket graph through wp.
disable-model-invocation: true
---

# ai-to-tickets-workplan

Read one stored Workplan spec, split it into tracer-bullet tickets, and publish its prerequisite graph. The invocation authorizes publication without another approval round.

Before using `wp`, load the `ai-workplan` skill. If it is unavailable, stop and tell the user to install it. Follow its pointers to the machine-output, workplan, project, label, ticket, and dependency references. Those references define the command flags, envelopes, pagination, selectors, and typed errors.

## Process

1. **Resolve one spec.** Prefer an explicit spec slug, then the canonical resource returned by an immediately preceding `ai-to-spec-workplan` invocation, then an exact slug named in the conversation. Otherwise list every `spec` workplan through `wp --json workplan list --type spec`, following all cursors. Use the sole result when exactly one exists. Similar titles, recency, and workplan content do not make a choice unique.

   Ask for an exact spec slug only when these rules produce no unique target. Make no tracker mutation before resolution. For a selected slug, run `wp --json workplan show <slug>`, check `schema_version`, and require the returned type to be `spec`. Return any typed lookup failure instead of substituting another workplan. The stored `content_markdown` is the source spec; do not use a conversation copy in its place.

   This step is complete when one exact stored spec resource has been read through `wp --json`.

2. **Resolve projects and the publication label.** List projects through `wp --json project list`, following every cursor. Resolve each explicit project to its listed canonical path. For a ticket without an explicit project, resolve the directory that owns the ticket's work and select the longest registered ancestor. Record that canonical path in the draft. Resolve project context independently for every ticket, so one graph may span several projects. An intentionally unassigned ticket uses `--no-project`.

   List labels through `wp --json label list`, following cursors until `ready-for-agent` is found or the list ends. Stop before publication when the canonical label is absent. Setup, not this skill, owns project registration and label creation. Pass the recorded project selection explicitly on every create; never rely on the caller's current directory during publication.

   This step is complete when every draft has an explicit canonical project path or an explicit unassigned selection, and `ready-for-agent` exists.

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

   This step is complete when every spec behavior and failure boundary belongs to a context-sized ticket with a stable slug, literal type, complete body, project selection, and direct prerequisite set.

4. **Validate and order the graph.** Treat each prerequisite as an edge from a blocked ticket to an earlier ticket. Reject self-edges, duplicate edges, missing nodes, and cycles before calling `ticket create`. Topologically sort the graph with prerequisites first. Preserve draft order whenever several nodes are available, which makes ticket numbers deterministic.

   This step is complete when every ticket appears after all of its prerequisites and the ordered graph contains every direct edge exactly once.

5. **Inspect existing publication before creating anything.** List all visible tickets for the spec through `wp --json ticket list --workplan <spec-slug> --all-projects`, following every cursor. Index the results by slug. For every drafted slug already present, call `wp --json ticket show <complete-identifier>` and compare the canonical resource with the draft:

   - owning workplan and slug;
   - title, literal type, and exact `content_markdown`, including line endings and the trailing newline;
   - explicit project path or `null` for an unassigned ticket;
   - the exact `ready-for-agent` label set; and
   - the complete prerequisite identifier set, using the identifiers returned for the already published prerequisite tickets.

   Treat a mismatch as a publication conflict. Report the workplan, slug, existing identifier, mismatched field, expected value, and actual value, along with the safe recovery choice. Preserve the existing ticket. Do not update, delete, restore, or repair it. Preserve its current status, claim, reviews, version, and timestamps when the compared fields match.

   Existing drafted tickets must form a prefix of the ordered graph. If a later drafted ticket exists while an earlier one is missing, return a publication conflict with both identifiers. This protects the graph from a deleted or independently-created prerequisite. Compatible existing tickets are results, not work to recreate: keep their complete identifiers and begin creation at the first missing draft.

   A `wp` failure stops this step. Return its `schema_version`, typed error code, safe details, and the operation that failed. Follow `ai-workplan`'s rule for `database_busy` and run no further tracker call.

   This step is complete when every existing drafted ticket is either a compatible prefix member or has produced a deliberate conflict, and the first missing draft is known.

6. **Publish the missing suffix in topological order.** For each draft from the first missing one onward, write its exact Markdown to one private temporary `.md` file. Create it with one call:

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

   Use `--no-project` instead of `--project` for an intentionally unassigned draft. Pass the full direct prerequisite set as repeatable `--prerequisite` flags in that create operation. Build every identifier from a successful existing or newly-created response, never from a predicted number. Never create a ready dependent and add edges afterward.

   Remove the temporary file after every create attempt, including failures, before another tracker operation. On success, check `schema_version` and verify the canonical resource's workplan, slug, title, type, exact Markdown, project, label set, status, and prerequisite set. Add it to the result map. If the process is interrupted between creates, the next invocation repeats step 5 and resumes from the first missing draft. It neither duplicates compatible tickets nor rewrites them.

   On any create failure or response mismatch, stop. Return the typed code, failed slug, command purpose, and identifiers already published. Do not retry `database_busy`, delete created tickets, repair edges, or continue with dependents.

   This step is complete when every missing create succeeds in topological order and every returned resource matches its draft and full prerequisite set.

7. **Return the graph.** Return the source spec slug and the canonical ticket resources in creation order, including compatible resources found during the rerun. Summarize each complete identifier, project, and prerequisite identifiers. Do not run a second approval, status, update, or cleanup pass.
