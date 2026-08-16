---
name: ai-setup
description: Set up and verify Obsidian integration.
disable-model-invocation: true
---

You verify that the `ai-*` spec-driven workflow is ready to use and fix or report anything that's missing. The suite writes all generated documents into the user's Obsidian vault, grouped by project, so this skill confirms that pipe is connected end to end.

Run the checks below in order and finish with a short summary.

## 1. Vault reachable

The suite reads and writes the Obsidian vault **directly on the local filesystem** — no MCP, no plugins, no HTTP API. It just needs the vault directory to exist and be writable.

**Vault root:** `$OBSIDIAN_AI_VAULT` (defaults to `$HOME/Documents/obsidian/obsidian` if unset). The suite resolves the vault root with `${OBSIDIAN_AI_VAULT:-$HOME/Documents/obsidian/obsidian}` at every step, so setting `$OBSIDIAN_AI_VAULT` is the single override point across all `ai-*` skills.

**Recommend the env var.** If `$OBSIDIAN_AI_VAULT` is not set, tell the user to export it in their shell profile so every `ai-*` skill resolves the same vault without per-invocation overrides:

```bash
echo 'export OBSIDIAN_AI_VAULT="$HOME/Documents/obsidian/obsidian"' >> ~/.zshrc   # or ~/.bashrc
source ~/.zshrc
```

Substitute the actual vault path if it differs from the default.

**Run a live test:** confirm the vault directory exists and is writable:

```bash
V="${OBSIDIAN_AI_VAULT:-$HOME/Documents/obsidian/obsidian}"
test -d "$V" && test -w "$V" && echo OK
```

If it doesn't print `OK`, the vault isn't where expected. Tell the user to either create the directory, point Obsidian's vault there, set `$OBSIDIAN_AI_VAULT` to the correct absolute path, or re-run this skill — then re-run this skill.

Don't continue the remaining checks until this test passes — every other step depends on it.

## 2. Ensure the `engineering/` vault root

All suite output lives under `<vault>/engineering/<project>/...`. Check whether it exists:

```bash
V="${OBSIDIAN_AI_VAULT:-$HOME/Documents/obsidian/obsidian}"
test -d "$V/engineering"
```

If it's missing, create the root index note at `<vault>/engineering/index.md` with the `Write` tool (it creates the parent folder). This is the top of the Obsidian graph; the suite links every project up to it. Suggested content:

```markdown
# Engineering

AI-generated engineering documents, grouped by project (repository).
Each project folder holds feature specs (prd.md, tech-spec.md, tasks.md, ...),
plus pull-requests/, code-reviews/, and codebase-reviews/.

## Projects
```

The `## Projects` list is filled as projects appear (each skill links its project here, and `ai-reindex` rebuilds the whole thing). If a legacy `engineering/README.md` exists from an older setup, leave it — but `index.md` is now the canonical root.

## 3. Initialize the vault git repo

The vault is version-controlled: every ai-* skill delegates its vault commit to `ai-commit`, which stages, commits, and pushes the output. Set this up here.

First **ask the user for the git repository** (the remote URL, e.g. `git@github.com:user/obsidian-vault.git`) unless they already gave one. This is the `origin` the vault pushes to.

Then, from the **vault root** (`${OBSIDIAN_AI_VAULT:-$HOME/Documents/obsidian/obsidian}` — the Obsidian root directory), initialize the repo, wire the remote, and make the first commit:

```bash
V="${OBSIDIAN_AI_VAULT:-$HOME/Documents/obsidian/obsidian}"
if [ -d "$V/.git" ]; then
  echo "already a git repo"
  git -C "$V" remote -v
else
  git -C "$V" init -b main
  git -C "$V" remote add origin "<REPO_URL>"
  git -C "$V" add -A
  git -C "$V" commit -m "chore: initial vault commit"
  git -C "$V" push -u origin main
fi
```

Substitute `<REPO_URL>` with the URL the user gave. If it's already a repo, leave it as is (just confirm `origin`). If the push fails (no access, empty remote conflict), report the exact error and let the user resolve it — don't force-push.

## 4. Verify project detection

The suite names the project from the git repository:
- Run `git rev-parse --show-toplevel`; the basename is the project name, so the base path is `engineering/<basename>`.
- If the current directory is not a git repo, the skills fall back to proposing a name from `basename "$PWD"` and asking for confirmation.

Report the resolved base path for the current directory (or, if there's no git repo here, state that the no-git fallback will apply).

## 5. Confirm the suite is available

The spec-driven suite is:

- `ai-create-prd` — PRD → `engineering/<project>/workplans/<feature>/prd.md`
- `ai-create-techspec` — tech spec → `workplans/<feature>/tech-spec.md`
- `ai-review-techspec` — architect review → `workplans/<feature>/tech-spec-review.md`
- `ai-create-tasks` — task list → `workplans/<feature>/tasks.md` + `NN-task.md`
- `ai-execute-task` — implement in repo; notes → `workplans/<feature>/implementation-notes.md`
- `ai-create-pr` — PR description → `<project>/pull-requests/<branch>.md`
- `ai-code-review` — branch review → `<project>/code-reviews/review-<branch>.md`
- `ai-codebase-review` — codebase audit → `<project>/codebase-reviews/<system>.md`
- `ai-reindex` — rebuild the wikilink graph (root, per-project, and per-feature `index.md`)
- `ai-commit` — the single chokepoint that stages, commits, and pushes vault changes; every other `ai-*` skill delegates its vault commit here instead of running git directly

Every skill above cross-links its output and maintains three tiers of `index.md`
(`engineering/index.md`, `engineering/<project>/index.md`, and
`engineering/<project>/workplans/<feature>/index.md`) so the notes form a
connected Obsidian graph. `ai-reindex` regenerates all of them deterministically.

Check which of these you can see in your available skills and flag any that are missing. If skills are missing, the user can install the full suite with:

```bash
npx skills add cristiano-pacheco/ai-tools
```

## 6. Summary

Print a short report:
- ✅ / ❌ `$OBSIDIAN_AI_VAULT` set (or falling back to default)
- ✅ / ❌ Vault directory reachable and writable
- ✅ / ❌ `engineering/` root present with `engineering/index.md` (created if it was missing)
- ✅ / ❌ Vault git repo initialized with `origin` set (or already present)
- Resolved project base path for the current directory
- Which suite skills are available, and any that are missing

If everything is green, tell the user they can start with `ai-create-prd`. Otherwise, list exactly what to fix.
