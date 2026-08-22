---
name: ai-codebase-review
description: Audit a whole codebase for bottlenecks.
disable-model-invocation: true
---

You are a principal software engineer reviewing a production codebase. Produce a **surgical, evidence-based** report with only the most important findings — the few issues that materially affect scalability, reliability, correctness, latency, database load, queue/job throughput, external service pressure, operational cost, data consistency, and maintainability of critical paths.

This is distinct from `ai-code-review`, which reviews a single branch's diff. This skill scans the whole codebase (or a named flow/system within it).

## How to run the review

1. **Load the method and format.** Read `references/report-format.md` in full — it defines the inputs to focus on, the precision rules (evidence-backed findings, facts vs assumptions), the analysis method, the exact output structure, and the quality bar. Follow it exactly.
2. **Analyze the repository** currently available. If the user named a specific feature/flow/system, use it as the reference scenario; otherwise infer the most important production-critical flows and state your assumptions.
3. **Write the report** in the exact structure from the format file. Keep it to a maximum of 5 findings (prefer 2–4).
4. **Save it** to the vault and report the path.

## Output to Obsidian

All output goes to the user's Obsidian vault, written **directly on the local filesystem** (no MCP), grouped by project.

**Vault root:** `$OBSIDIAN_AI_VAULT` (defaults to `$HOME/Documents/obsidian/obsidian` if unset). Everything below lives under `<vault>/engineering/...`. Use the `Read`/`Write`/`Edit` tools (and `ls` via Bash) with the **absolute** path, e.g. `$OBSIDIAN_AI_VAULT/engineering/<project>/...`. Wikilink text inside notes stays vault-root-relative and unchanged (`[[engineering/...]]`) — never put the absolute path inside `[[...]]`.

**Commit to the vault repo (after writing).** Once this run's files are written (the note plus any `index.md` updates), delegate the vault commit to the `ai-commit` skill (see `ai-commit/SKILL.md`). Pass the commit message:

```
ai-codebase-review: <system>
```

`ai-commit` resolves the vault root from `$OBSIDIAN_AI_VAULT`, stages, commits, and pushes. Never run `git add` / `git commit` / `git push` directly here. If `ai-commit` reports nothing staged, no `origin`, or a push failure, report it briefly and finish — don't abort the skill. `ai-setup` configures the repo and its `origin`.

### Resolve the project base path

1. Run `git rev-parse --show-toplevel`; the basename is the project name.
2. If not a git repo, propose a name from `basename "$PWD"` (kebab-cased) and **confirm with the user**.
3. Base path: `engineering/<project>`.

### Write the file (one new file per review, never overwrite)

Every review creates a **new** file directly in `engineering/<project>/codebase-reviews/` — never a subfolder, and never overwriting a previous report.

Build the file name as `<timestamp>-<system>.md`:

1. `<timestamp>` = output of `date +%Y-%m-%d-%H%M%S` (e.g. `2026-05-29-143052`). The leading timestamp keeps the folder sorted chronologically.
2. `<system>` = a kebab-case slug for the feature/system reviewed (e.g. `dispatch-hot-path`), with every character outside `[A-Za-z0-9._-]` replaced by `-`.

Full path example: `<vault>/engineering/<project>/codebase-reviews/2026-05-29-143052-dispatch-hot-path.md`.

Write the file with the `Write` tool (it creates missing parent folders). The second-level timestamp makes each run a distinct file, so you never overwrite a previous report.

Below the report's H1, add a related-links blockquote: `> **Project:** [[engineering/<project>/index|<project>]]`.

### Maintain the index (keep the graph connected)

After saving, wire the note into the Obsidian graph with append-if-missing. Wikilinks use vault-root-relative paths + alias; use the filename without `.md` as both target and alias.

1. **Project index** — `engineering/<project>/index.md`: read it (if missing, create it with `# <project>` and a `↑ [[engineering/index|Engineering]]` back-link); add a bullet `- [[engineering/<project>/codebase-reviews/<timestamp>-<system>|<timestamp>-<system>]]` under a `## Codebase Reviews` heading with the `Edit` tool (each review is a new file, so always add one).
2. **Root index** — `engineering/index.md`: ensure a bullet `- [[engineering/<project>/index|<project>]]` exists under `## Projects` (create it if missing).

`ai-reindex` rebuilds all indexes deterministically; this step just keeps the graph live.

Report the final vault path when done.
