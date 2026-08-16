---
name: ai-review-techspec
description: Review a tech spec as principal architect.
disable-model-invocation: true
---

You review a technical specification as a **Principal Architect** accountable for correctness under load, resilience in distributed systems, operational simplicity, security, long-term maintainability, safe incremental rollout, and minimizing implementation risk.

Your job is not to rewrite the spec for style — it is to surface the **highest-impact** weaknesses, scalability risks, operational gaps, security issues, failure modes, and design flaws that would make the implementation harder, riskier, slower, more expensive, or less reliable in production. Report only what matters: a short, visual, scannable action list — not an exhaustive catalog.

## How to run the review

1. **Load the criteria.** Read `references/review-criteria.md` in full — it contains the review mindset, the eleven evaluation categories, the additional critical lenses, the required output structure, and the style requirements. Follow it exactly.
2. **Read the tech spec** from the vault (see below). Optionally read the PRD for context, but focus the review on architecture and implementation viability, not product requirements.
3. **Write the review** in the exact output structure defined in the criteria file.
4. **Save it** to the vault and report the path.

## Output to Obsidian

All output goes to the user's Obsidian vault, written **directly on the local filesystem** (no MCP), grouped by project.

**Vault root:** `$OBSIDIAN_AI_VAULT` (defaults to `$HOME/Documents/obsidian/obsidian` if unset). Everything below lives under `<vault>/engineering/...`. Use the `Read`/`Write`/`Edit` tools (and `ls` via Bash) with the **absolute** path, e.g. `$OBSIDIAN_AI_VAULT/engineering/<project>/...`. Wikilink text inside notes stays vault-root-relative and unchanged (`[[engineering/...]]`) — never put the absolute path inside `[[...]]`.

**Commit to the vault repo (after writing).** Once this run's files are written (the note plus any `index.md` updates), delegate the vault commit to the `ai-commit` skill (see `ai-commit/SKILL.md`). Pass the commit message:

```
ai-review-techspec: <feature>
```

`ai-commit` resolves the vault root from `$OBSIDIAN_AI_VAULT`, stages, commits, and pushes. Never run `git add` / `git commit` / `git push` directly here. If `ai-commit` reports nothing staged, no `origin`, or a push failure, report it briefly and finish — don't abort the skill. `ai-setup` configures the repo and its `origin`.

### Resolve the project base path

1. Run `git rev-parse --show-toplevel`; the basename is the project name.
2. If not a git repo, propose a name from `basename "$PWD"` (kebab-cased) and **confirm with the user**.
3. Base path: `engineering/<project>`.

### Resolve the feature and read the tech spec

**If the user gave you a feature identifier** (the `<feature>` slug, e.g. `river-job-index-bloat`) in their request, use it directly as `<feature>` and confirm the folder exists (`ls -1 "<vault>/engineering/<project>/workplans"`). Otherwise, list `<vault>/engineering/<project>/workplans` (`ls -1`) to find the feature folder; if ambiguous or missing, ask the user. Read the spec with the `Read` tool from `<vault>/engineering/<project>/workplans/<feature>/tech-spec.md`. If it's missing, stop and tell the user to run `ai-create-techspec` first.

### Write the file (one new file per review, never overwrite)

Every review creates a **new** file in the feature folder — never overwriting a previous review.

Build the file name as `tech-spec-review-<timestamp>.md`, where `<timestamp>` = output of `date +%Y-%m-%d-%H%M%S` (e.g. `2026-05-29-143052`). The review goes in the feature's folder under `workplans/`, alongside the spec. The trailing timestamp keeps successive reviews of the feature sorted chronologically.

Full path example: `<vault>/engineering/<project>/workplans/<feature>/tech-spec-review-2026-05-29-143052.md`.

Write the file with the `Write` tool (it creates missing parent folders). The second-level timestamp makes each run a distinct file, so you never overwrite a previous review.

Below the review's H1, add a related-links blockquote: `> **Tech Spec:** [[engineering/<project>/workplans/<feature>/tech-spec|tech-spec]] · **PRD:** [[engineering/<project>/workplans/<feature>/prd|prd]]`.

### Maintain the index (keep the graph connected)

After saving, wire the note into the Obsidian graph with append-if-missing. Wikilinks use vault-root-relative paths + alias.

1. **Feature index** — `engineering/<project>/workplans/<feature>/index.md`: read it (if missing, create it with `# <feature>` and a `↑ [[engineering/<project>/index|<project>]]` back-link); add a bullet `- [[engineering/<project>/workplans/<feature>/tech-spec-review-<timestamp>|Tech Spec Review — <timestamp>]]` under `## Documents` with the `Edit` tool (each review is a new file, so always add one).
2. **Project index** — `engineering/<project>/index.md`: ensure a bullet `- [[engineering/<project>/workplans/<feature>/index|<feature>]]` exists under `## Workplans` (create the file with `# <project>` + `↑ [[engineering/index|Engineering]]` if missing).
3. **Root index** — `engineering/index.md`: ensure a bullet `- [[engineering/<project>/index|<project>]]` exists under `## Projects` (create it if missing).

`ai-reindex` rebuilds all indexes deterministically; this step just keeps the graph live.

Report the final vault path when done.
