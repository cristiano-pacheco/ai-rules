---
name: ai-create-pr
description: Write a PR title and description.
disable-model-invocation: true
---

You write a Pull Request title and description for the current branch (vs. `main`) so a reviewer understands the change without opening the diff.

Goal: **short, plain, human** — like a teammate explaining the PR in chat, not a corporate write-up.

<critical>load and use the unslop skill to produce the text</critical>
<critical>EXPLORE THE BRANCH DIFF FIRST.</critical>
<critical>WRITE LIKE A HUMAN — SHORT, PLAIN, NO PADDING.</critical>
<critical>NEVER INVENT METRICS, CONFIGS, MIGRATIONS, OR ENDPOINTS — ONLY CITE WHAT IS IN THE DIFF.</critical>

## Voice and length

- **Aim for under 250 words total.** If you're over, you're padding.
- Write like a person. Contractions are fine. Cut phrases like "this PR introduces", "in order to", "going forward", "at production scale".
- Short sentences. Bullets over paragraphs. One line per bullet.
- Cite specifics (file paths, table names, metric names). Drop the prose around them.
- A section with nothing real to say is worse than no section — delete it.

## What to produce

1. A **title** in Conventional Commits: `<type>: <imperative summary>`. Types: `feat`, `fix`, `chore`, `refactor`, `perf`, `docs`, `test`, `build`, `ci`, `style`, `revert`. Scope optional (`feat(renderer): ...`). No leading emoji.
2. A **description** that answers *Why? How? What can break?* — and nothing else.
3. The PR document, saved to the vault (see below).

## Output to Obsidian

All output goes to the user's Obsidian vault, written **directly on the local filesystem** (no MCP), grouped by project.

**Vault root:** `$OBSIDIAN_AI_VAULT` (defaults to `$HOME/Documents/obsidian/obsidian` if unset). Everything below lives under `<vault>/engineering/...`. Use the `Read`/`Write`/`Edit` tools (and `ls` via Bash) with the **absolute** path, e.g. `$OBSIDIAN_AI_VAULT/engineering/<project>/...`. Wikilink text inside notes stays vault-root-relative and unchanged (`[[engineering/...]]`) — never put the absolute path inside `[[...]]`.

**Commit to the vault repo (after writing).** Once this run's files are written (the note plus any `index.md` updates), delegate the vault commit to the `ai-commit` skill (see `ai-commit/SKILL.md`). Pass the commit message:

```
ai-create-pr: <branch>
```

`ai-commit` resolves the vault root from `$OBSIDIAN_AI_VAULT`, stages, commits, and pushes. Never run `git add` / `git commit` / `git push` directly here. If `ai-commit` reports nothing staged, no `origin`, or a push failure, report it briefly and finish — don't abort the skill. `ai-setup` configures the repo and its `origin`.

### Resolve the project base path

1. Run `git rev-parse --show-toplevel`; the basename is the project name.
2. If not a git repo, propose a name from `basename "$PWD"` (kebab-cased) and **confirm with the user**.
3. Base path: `engineering/<project>`.

### Write the file (one new file per run, never overwrite)

Every run creates a **new** file directly in `engineering/<project>/pull-requests/` — never a subfolder, and never overwriting a previous PR doc.

Build the file name as `<timestamp>-<branch>.md`:

1. `<timestamp>` = output of `date +%Y-%m-%d-%H%M%S` (e.g. `2026-05-29-143052`). The leading timestamp keeps the folder sorted chronologically.
2. `<branch>` = the current branch with every character outside `[A-Za-z0-9._-]` replaced by `-` (so `/` becomes `-`). Example: `cristiano-pacheco/add-communication-flows` → `cristiano-pacheco-add-communication-flows`.

Full path example: `<vault>/engineering/<project>/pull-requests/2026-05-29-143052-cristiano-pacheco-add-communication-flows.md`.

Write the file with the `Write` tool (it creates missing parent folders). The second-level timestamp makes each run a distinct file, so you never overwrite a previous PR doc.

Below the PR's hero line, add a related-links blockquote: `> **Project:** [[engineering/<project>/index|<project>]]`.

### Maintain the index (keep the graph connected)

After saving, wire the note into the Obsidian graph with append-if-missing. Wikilinks use vault-root-relative paths + alias; use the filename without `.md` as both target and alias.

1. **Project index** — `engineering/<project>/index.md`: read it (if missing, create it with `# <project>` and a `↑ [[engineering/index|Engineering]]` back-link); add a bullet `- [[engineering/<project>/pull-requests/<timestamp>-<branch>|<timestamp>-<branch>]]` under a `## Pull Requests` heading with the `Edit` tool (each run is a new file, so always add one).
2. **Root index** — `engineering/index.md`: ensure a bullet `- [[engineering/<project>/index|<project>]]` exists under `## Projects` (create it if missing).

`ai-reindex` rebuilds all indexes deterministically; this step just keeps the graph live.

## Workflow

### 1. Inspect the branch
Run in parallel:
- `git rev-parse --abbrev-ref HEAD`
- `git log main..HEAD --oneline`
- `git diff main...HEAD --stat`
- `git diff main...HEAD` (read selectively — skip tests and generated files first pass)

If on `main`, stop and report.

### 2. Pick one archetype

| Archetype | Keep these sections |
|---|---|
| `feat` | Why · How · Key points · Surface area · Observability (only if metrics added) |
| `perf` | Why · How · Key points · Observability |
| `fix` | Why · Root cause · Fix |
| `refactor` | Why · What changed · Migration notes (only if breaking) |
| `docs` | Why · What changed |

Borrow other sections only when there's real content. Skip the rest.

### 3. Extract facts from the diff

- New/changed HTTP or gRPC endpoints
- New migrations, tables, columns
- New config keys (`config/`, `*.yaml`, `Bind*`)
- New metrics (`metrics.gen.yaml`)
- Behavioral changes (retry, idempotency, ordering)

If a fact isn't in the diff, don't write it.

### 4. Write the PR

Use `references/pr-template.md` for structure.

- **Hero line**: one short sentence — what changed, what it unlocks. Lead with the archetype emoji (🚀 feat · ⚡ perf · 🐛 fix · 🧱 refactor · 🛡️ security · 📚 docs).
- **Why**: 2–3 sentences. The pain. Plain English.
- **How**: a short paragraph. When behavior shifts, show **before vs. after** — side-by-side bullets or a diagram.
- **Diagrams**: always `mermaid`. Prefer `flowchart`, `stateDiagram-v2`, or `classDiagram` over `sequenceDiagram`. Use a sequence diagram only when ordering across multiple actors is the actual point. Skip diagrams for trivial changes.
- **Make diagrams dead simple** — grokable in under 5 seconds. Few nodes (≤7). Plain labels. One clear flow. If you can't make it that simple, use a bullet list.
- **Key points**: 3–6 emoji bullets, one line each — the properties a reviewer needs (correctness, blast radius, idempotency).
- Tables only for enumerable facts (config keys, retry boundaries). Never for narrative.

### 5. Save and report

Save to `engineering/<project>/pull-requests/<timestamp>-<branch>.md` (see the naming rule above). Report the path and the title.

## Don't do these

- ❌ Multi-line bullets that read like paragraphs
- ❌ "This PR aims to..." / "In order to..." / "Going forward..."
- ❌ Listing every file you touched
- ❌ Inventing alerts, dashboards, or metrics
- ❌ A "Migration / rollout" section when nothing is breaking
- ❌ Restating the same fact in three sections
- ❌ Filler adjectives ("crisp", "robust", "production-grade")

## Checklist (one pass before saving)

- [ ] Diff inspected
- [ ] Title is Conventional Commits, no emoji
- [ ] Description under ~250 words
- [ ] Reads like a person wrote it
- [ ] Every fact is in the diff
- [ ] Empty sections deleted
- [ ] Saved to `engineering/<project>/pull-requests/<timestamp>-<branch>.md`
