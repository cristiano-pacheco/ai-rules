---
name: ai-code-review
description: Review a branch diff for production risk.
disable-model-invocation: true
---

Act as a **Principal Backend Engineer** reviewing this code to prevent production incidents.

Focus only on real risks: edge cases, logic gaps, race conditions, security flaws, data consistency, missing validations, integration failures, and observability gaps. Skip cosmetic, stylistic, or low-impact comments.

## What to review

Inspect the current branch against `main`:
- `git rev-parse --abbrev-ref HEAD`
- `git diff main...HEAD --stat`
- `git diff main...HEAD`

If on `main`, stop and report.

## For each finding, provide

1. 🚨 **Issue** — the concrete problem
2. ⚠️ **Why it matters** — production impact
3. 🧪 **Failure scenario** — a realistic example
4. ✅ **Fix** — a clear mitigation, preferring proven patterns when applicable (idempotency, retries with backoff, sagas, outbox/inbox, optimistic locking, deduplication, rate limiting)

If no relevant risks are found, say so explicitly.

Use `references/code-review-template.md` as the output format.

## Output to Obsidian

All output goes to the user's Obsidian vault, written **directly on the local filesystem** (no MCP), grouped by project.

**Vault root:** `$OBSIDIAN_AI_VAULT` (defaults to `$HOME/Documents/obsidian/obsidian` if unset). Everything below lives under `<vault>/engineering/...`. Use the `Read`/`Write`/`Edit` tools (and `ls` via Bash) with the **absolute** path, e.g. `$OBSIDIAN_AI_VAULT/engineering/<project>/...`. Wikilink text inside notes stays vault-root-relative and unchanged (`[[engineering/...]]`) — never put the absolute path inside `[[...]]`.

**Commit to the vault repo (after writing).** Once this run's files are written (the note plus any `index.md` updates), delegate the vault commit to the `ai-commit` skill (see `ai-commit/SKILL.md`). Pass the commit message:

```
ai-code-review: <branch>
```

`ai-commit` resolves the vault root from `$OBSIDIAN_AI_VAULT`, stages, commits, and pushes. Never run `git add` / `git commit` / `git push` directly here. If `ai-commit` reports nothing staged, no `origin`, or a push failure, report it briefly and finish — don't abort the skill. `ai-setup` configures the repo and its `origin`.

### Resolve the project base path

1. Run `git rev-parse --show-toplevel`; the basename is the project name.
2. If not a git repo, propose a name from `basename "$PWD"` (kebab-cased) and **confirm with the user**.
3. Base path: `engineering/<project>`.

### Write the file (one new file per review, never overwrite)

Every review creates a **new** file directly in `engineering/<project>/code-reviews/` — never a subfolder, and never overwriting a previous review.

Build the file name as `<timestamp>-<branch>.md`:

1. `<timestamp>` = output of `date +%Y-%m-%d-%H%M%S` (e.g. `2026-05-29-143052`). The leading timestamp keeps the folder sorted chronologically.
2. `<branch>` = the current branch with every character outside `[A-Za-z0-9._-]` replaced by `-` (so `/` becomes `-`). Example: `cristiano-pacheco/add-communication-flows` → `cristiano-pacheco-add-communication-flows`.

Full path example: `<vault>/engineering/<project>/code-reviews/2026-05-29-143052-cristiano-pacheco-add-communication-flows.md`.

Write the file with the `Write` tool (it creates missing parent folders). The second-level timestamp makes each run a distinct file, so you never overwrite a previous review.

Below the review's H1, add a related-links blockquote: `> **Project:** [[engineering/<project>/index|<project>]]`.

### Maintain the index (keep the graph connected)

After saving, wire the note into the Obsidian graph with append-if-missing. Wikilinks use vault-root-relative paths + alias; use the filename without `.md` as both target and alias.

1. **Project index** — `engineering/<project>/index.md`: read it (if missing, create it with `# <project>` and a `↑ [[engineering/index|Engineering]]` back-link); add a bullet `- [[engineering/<project>/code-reviews/<timestamp>-<branch>|<timestamp>-<branch>]]` under a `## Code Reviews` heading with the `Edit` tool (each review is a new file, so always add one).
2. **Root index** — `engineering/index.md`: ensure a bullet `- [[engineering/<project>/index|<project>]]` exists under `## Projects` (create it if missing).

`ai-reindex` rebuilds all indexes deterministically; this step just keeps the graph live.

Report the final vault path when done.
