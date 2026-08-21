---
name: ai-commit
description: Commit and push vault artifacts or explicitly scoped code changes when an AI workflow delegates its repository handoff.
---

You commit and push changes produced by the `ai-*` workflow. You are the **only** skill in the suite allowed to run `git add` / `git commit` against the Obsidian vault. By default you operate on that vault. `ai-review-and-fix` may additionally delegate a narrowly scoped code-repository commit to you.

<critical>For the default `vault` target, NEVER run `git add`, `git commit`, or `git push` against the current working directory; target the vault root via `git -C "$V"`. For the explicit `code` target, use only the resolved code toplevel and the exact supplied paths. The vault repo and the code repo are different repositories — mixing them is the exact bug this skill exists to prevent.</critical>
<critical>If the vault root resolves to the same path as the current working directory's git toplevel, STOP and abort. That means the agent is running inside the vault as if it were the code repo, which is a misconfiguration.</critical>

## Inputs

The calling skill provides:
- **commit message** — a concise Conventional Commits message naming the note (e.g. `ai-create-prd: <feature>`). If none is provided, compose one from the staged diff.
- **target** — `vault` (default) or `code`.
- **code paths** — required only for `target: code`: exact repository-relative paths changed by the calling skill. Never infer them from the whole worktree.

## Code target (only for `ai-review-and-fix`)

When `target: code`, operate on the current working directory's Git repository, never the vault:

1. Resolve `CWD_TOPLEVEL="$(git rev-parse --show-toplevel)"`; stop if it fails.
2. Resolve the vault as below and stop if `CWD_TOPLEVEL` equals `VAULT_TOPLEVEL`.
3. Require a non-empty explicit `code paths` list. Verify each path is inside `CWD_TOPLEVEL`; reject absolute paths, `..` traversal, and paths outside the repository.
4. Stage only those paths: `git -C "$CWD_TOPLEVEL" add -- <paths>`. Never use `git add -A` for code.
5. If the scoped staged diff is empty, report that no code commit is needed. Do not create an empty commit.
6. Commit with the supplied Conventional Commit message, then push the current branch if `origin` exists. A missing origin or a push failure is non-fatal; report it exactly and do not force-push.

Do not commit unrelated pre-existing changes. The caller must inspect `git status --short` before delegating and include only files it changed.

## Workflow

Use the code-target flow above when requested. Otherwise use the vault-target workflow below.

### 1. Resolve the vault root

```bash
V="${OBSIDIAN_AI_VAULT:-$HOME/Documents/obsidian/obsidian}"
```

- If `$OBSIDIAN_AI_VAULT` is set, use it verbatim.
- Otherwise fall back to `$HOME/Documents/obsidian/obsidian`.

Validate it exists and is a git repo:

```bash
test -d "$V" || { echo "Vault not found: $V" >&2; exit 1; }
git -C "$V" rev-parse --is-inside-work-tree >/dev/null || { echo "Not a git repo: $V" >&2; exit 1; }
```

If either check fails, report the error and tell the user to run `ai-setup` or set `$OBSIDIAN_AI_VAULT`. Do not continue.

### 2. Guard against operating inside the vault

Compare the vault toplevel against the current working directory's git toplevel:

```bash
VAULT_TOPLEVEL="$(git -C "$V" rev-parse --show-toplevel)"
CWD_TOPLEVEL="$(git rev-parse --show-toplevel 2>/dev/null || echo "")"

if [ -n "$CWD_TOPLEVEL" ] && [ "$VAULT_TOPLEVEL" = "$CWD_TOPLEVEL" ]; then
  echo "ABORT: vault root equals the current working directory's git toplevel ($VAULT_TOPLEVEL)." >&2
  echo "The agent is running inside the vault repo as if it were the code repo — this is a misconfiguration." >&2
  echo "Run the calling skill from inside the code repository, not from the vault." >&2
  exit 1
fi
```

This is the critical guard that prevents the suite from committing code changes into the vault or vault notes into the code repo.

### 3. Stage

Stage everything under the vault root:

```bash
git -C "$V" add -A
```

If nothing is staged, report that the vault was already up to date and stop — never create an empty commit:

```bash
if git -C "$V" diff --cached --quiet; then
  echo "No vault changes to commit."
  exit 0
fi
```

### 4. Commit

Use a HEREDOC to preserve formatting:

```bash
git -C "$V" commit -m "$(cat <<'EOF'
<message>
EOF
)"
```

Commit message rules:
- Conventional Commits: `<type>(<optional scope>): <short description>`.
- Prefer the message the calling skill provided.
- Imperative mood, lowercase, no period.
- Never include a `Co-Authored-By` trailer.

### 5. Push (if origin exists)

```bash
if git -C "$V" remote get-url origin >/dev/null 2>&1; then
  git -C "$V" push || echo "Push failed (offline or no access) — commit is local. Resolve manually." >&2
else
  echo "No origin remote on the vault — commit is local. ai-setup configures the remote." >&2
fi
```

A push failure is non-fatal: the commit is already local, so report it and finish. Do not abort the calling skill.

### 6. Report

Print a short summary:
- The commit hash (`git -C "$V" log -1 --oneline`).
- Whether the push succeeded, was skipped (no origin), or failed.
- Any guard that triggered (e.g. vault-equals-cwd abort).

## Notes

- This skill is the single chokepoint for vault git operations. Other `ai-*` skills must not run `git add` / `git commit` / `git push` themselves — they delegate here.
- If the vault has unrelated staged changes from another source, `git add -A` will include them. This matches the historical suite behavior; the calling skills are expected to run `ai-commit` immediately after their own writes, so unrelated drift is rare. `ai-setup` initializes the repo and `origin`.
- Never force-push, amend a prior commit, or rewrite vault history. If the commit fails (e.g. hook rejection), report the exact error and let the user resolve it.
