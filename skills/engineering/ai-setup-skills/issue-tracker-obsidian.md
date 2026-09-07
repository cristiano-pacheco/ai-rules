# Issue tracker: Obsidian

## Output to Obsidian

Write specs, tickets, wayfinding maps, and tracker comments directly to the user's Obsidian vault on the local filesystem, without MCP. Group them by project.

**Vault root:** resolve `<vault>` from `$OBSIDIAN_AI_VAULT`. If unset, use `$HOME/Documents/obsidian/obsidian`. Use absolute filesystem paths with the read/write/edit tools. Keep wikilinks vault-root-relative, as in `[[engineering/...]]`.

### Resolve the project base path

1. Use the configured project name `<project-name>` for `<project>`. If not configured, derive it from the basename of `git rev-parse --show-toplevel`.
2. If no project is configured and the command fails, propose a kebab-case name from `basename "$PWD"` and confirm it with the user before writing.
3. Paths below are relative to the feature directory, `<vault>/engineering/<project>/workplans/<feature>/`.

## Conventions

- One directory per feature
- The spec is `spec.md`
- Write one file per implementation ticket at `issues/<NN>-<slug>.md`. Number tickets from `01` in dependency order, blockers first. Never combine tickets into one file
- Record triage state in a `Status:` line near the top of each issue file. Use the role strings from `triage-labels.md`. Preserve existing Markdown formatting, including `**Status:**`, when updating the field
- Implementation tickets declare `Blocked by` using numbers/titles within the same feature, or `None (can start immediately)`. Every blocker must identify an existing ticket. Missing or ambiguous references block execution
- Claim a ticket by updating its existing status field to `claimed` and saving before work starts. Only one agent works a claimed ticket at a time. Filesystem edits do not provide atomic claims, so concurrent agents require external coordination
- Comments and conversation history append to the bottom of the file under a `## Comments` heading

## When a skill says "publish to the issue tracker"

Create the artifact at the path defined in Conventions or Wayfinding operations. Create directories as needed. Use the per-ticket template from `ai-to-tickets` for implementation issues. Preserve existing files and reuse an identical published ticket. Report conflicting content or numbering before writing. Leave the parent spec unchanged.

## When a skill says "fetch the relevant ticket"

Read the complete referenced file, including comments. Resolve an issue number within the identified feature's `issues/` directory; if the feature or ticket is ambiguous, ask for the exact path rather than selecting by similarity or recency.

## Implementation ticket lifecycle

Implementation issues (the `issues/NN-slug.md` tickets produced from a spec) move through `ready-for-agent → claimed → resolved` on their `Status:` line. A ticket is claimable when its status is `ready-for-agent` and every ticket listed in its `Blocked by` field is `resolved`; claim per [Conventions](#conventions), then:

- The `- [ ]` checklist items are the **acceptance criteria** — they define when the ticket may resolve. Tick each to `- [x]` the moment it is verifiably done (code, config, and tests all observable), as you go rather than in bulk at the end.
- Resolve only after every criterion is ticked, `ai-implement`'s required checks pass, the review has no unresolved Standards or Spec findings, and the reviewed change is committed. Append a completion comment under `## Comments` with the commit hash, gates run, review findings, and deferred follow-ups. Set the existing status field to `resolved` and read back the file to verify the saved state.
- If work fails or is interrupted, preserve the worktree and claim. Leave unverified criteria unchecked. Report the ticket path, current state, and blocker. Record the blocker under `## Comments` when the file is writable.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a file with one **child** file per ticket.

- **Map**: `map.md` (the Notes / Decisions-so-far / Fog body).
- **Child ticket**: `issues/NN-<slug>.md`, numbered from `01`, with the question in the body. A `Type:` line records the ticket type (`research`/`prototype`/`grilling`/`task`); a `Status:` line records `claimed`/`resolved`.
- **Blocking**: a `Blocked by: NN, NN` line near the top. A ticket is unblocked when every file it lists is `resolved`.
- **Frontier**: scan `issues/` for files that are open, unblocked, and unclaimed; first by number wins.
- **Resolve**: append the answer under an `## Answer` heading, set `Status: resolved`, then append a context pointer (gist + link) to the map's Decisions-so-far in `map.md`.
