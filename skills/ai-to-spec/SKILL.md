---
name: ai-to-spec
description: Turn an agreed conversation into a workplan spec in Obsidian.
disable-model-invocation: true
---

Turn the current conversation into the feature's implementation spec. Do NOT interview the user; synthesize the agreement already present in the conversation.

## Resolve the workplan

The user supplies the feature's kebab-case `<feature>` slug. If it is absent, derive a
candidate from the agreed feature and ask for confirmation before proceeding.

1. Resolve the current code repository with `git rev-parse --show-toplevel`; its basename
   is `<project>`. Stop if this fails.
2. Resolve the vault as `V="${OBSIDIAN_AI_VAULT:-$HOME/Documents/obsidian/obsidian}"`.
   Require `V` to exist.
3. Resolve the workplan path as
   `W="$V/engineering/<project>/workplans/<feature>"`. Report this resolved workplan
   before proposing the testing seam. A missing `W` is created only when publishing.

Use absolute filesystem paths for vault I/O. Keep Obsidian wikilinks vault-root-relative:
`[[engineering/...]]`.

## Synthesize and confirm

1. Explore the repository before drafting. Use its domain glossary and applicable ADRs
   where they exist.
2. Sketch the testing seams for the feature. Prefer an existing seam, choose the highest
   useful seam, and propose a new one only when necessary. Aim for one seam.
3. Check with the user that the proposed testing seams match their expectations. Wait for
   confirmation before writing vault artifacts.
4. After confirmation, synthesize the conversation and repository findings into the exact
   structure below. Make the user stories extensive enough to cover the agreed behavior:
   number them and use `As an <actor>, I want <feature>, so that <benefit>` for each one.

```md
# <Feature title>
> **Feature:** [[engineering/<project>/workplans/<feature>/index|<feature>]]

## Problem Statement

## Solution

## User Stories

## Implementation Decisions

## Testing Decisions

## Out of Scope

## Further Notes
```

In **Implementation Decisions**, capture modules, interfaces, technical clarifications,
architecture, schema/API contracts, and specific interactions without file paths or code
snippets. A compact prototype-derived type, reducer, state machine, or schema is allowed
only when it states a decision more precisely than prose; label it as prototype-derived.

In **Testing Decisions**, describe externally observable behavior, the chosen seam, the
modules covered, and relevant in-repository test prior art. Do not prescribe
implementation-detail tests.

## Publish to the vault

1. Create `W` if needed and write the spec to
   `engineering/<project>/workplans/<feature>/spec.md`.
2. Maintain Obsidian links append-if-missing:
   - Feature index: create `W/index.md` when absent with `# <feature>`, an
     `↑ [[engineering/<project>/index|<project>]]` back-link, and `## Documents`.
     Add `- [[engineering/<project>/workplans/<feature>/spec|Spec]]`.
   - Project index: ensure `engineering/<project>/index.md` has `## Workplans` and
     `- [[engineering/<project>/workplans/<feature>/index|<feature>]]`.
   - Root index: ensure `engineering/index.md` has `## Projects` and
     `- [[engineering/<project>/index|<project>]]`.
3. Delegate the vault commit and push to `ai-commit`; never run vault Git commands in
   this skill. Supply:

   ```
   target: vault
   commit message: ai-to-spec: <feature>
   ```

   If `ai-commit` reports nothing staged, no `origin`, or a push failure, report it
   briefly and finish; do not abort the completed spec workflow.

4. Report the saved spec path, feature identifier, selected testing seam, and the
   `ai-commit` result. The next workflow step is `ai-to-tickets <feature>`.
