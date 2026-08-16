---
name: ai-reindex
description: Rebuild Obsidian wikilink indexes.
disable-model-invocation: true
---

You rebuild the three tiers of `index.md` for the entire `engineering/` vault so
the `ai-*` documents form a fully connected Obsidian graph. This is the
authoritative, deterministic rebuild — it repairs any drift left by the
individual skills' incremental updates.

<critical>This skill NEVER edits the body of existing documents. It only creates/replaces `index.md` files. Regenerating an index is a full overwrite, so it must be idempotent — running twice yields identical output.</critical>

## Conventions (read first)

Read `references/index-conventions.md` in full and follow it exactly. It defines
the wikilink format, the three index tiers, their exact markdown, the ordering
rules, and the rebuild recipe. Everything below just sequences those rules over
the whole tree.

## 1. Verify the vault is reachable

**Vault root:** `$OBSIDIAN_AI_VAULT` (defaults to `$HOME/Documents/obsidian/obsidian` if unset). All paths below are under `<vault>/engineering/...`;
use `Read`/`Write`/`Edit` (and `ls` via Bash) with the **absolute** path, but keep
wikilink text vault-root-relative (`[[engineering/...]]`).

Check the vault root exists: `test -d "${OBSIDIAN_AI_VAULT:-$HOME/Documents/obsidian/obsidian}"`. If it's
missing (or `<vault>/engineering` doesn't exist), stop and tell the user to set up the
integration (run `ai-setup`). Everything else depends on this.

## 2. Walk the tree and rebuild bottom-up

Rebuild leaves before their parents so each parent links to indexes that already exist.

1. `ls -1 "<vault>/engineering"` → each subdirectory is a `<project>`.
2. For each `<project>`:
   a. `ls -1 "<vault>/engineering/<project>/workplans"` (skip if absent)
      → for each `<feature>` folder, **rebuild** its
      `engineering/<project>/workplans/<feature>/index.md` (feature tier).
   b. **Rebuild** `engineering/<project>/index.md` (project tier): list the
      feature folders under `workplans/`, plus the `.md` files under
      `code-reviews/`, `codebase-reviews/`, and `pull-requests/`. Omit empty sections.
3. **Rebuild** `engineering/index.md` (root tier): one bullet per project.

Use the "Rebuild recipe for one index" from the conventions file for every
`index.md` (list → build body → `Write` the index, overwriting any existing one).

## 3. Commit to the vault repo

After all `index.md` files are rebuilt, delegate the vault commit to the `ai-commit` skill (see `ai-commit/SKILL.md`). Pass the commit message:

```
ai-reindex: rebuild wikilink indexes
```

`ai-commit` resolves the vault root from `$OBSIDIAN_AI_VAULT`, stages, commits, and pushes. Never run `git add` / `git commit` / `git push` directly here. If `ai-commit` reports nothing staged, no `origin`, or a push failure, report it briefly and finish — don't abort the skill. `ai-setup` configures the repo and its `origin`.

## 4. Report

Print a short summary: how many projects, features, and index files were rebuilt,
and flag anything skipped (e.g. a project with no `workplans/`). If you noticed
loose files that don't fit the layout, mention them — don't try to move them.

## Notes

- Recurse only into the folders the layout defines. Don't descend into a feature
  folder looking for sub-features — features are flat.
- If `engineering/` doesn't exist, tell the user to run `ai-setup` first.
- Timestamped review/PR filenames are used verbatim as both link target and alias.
