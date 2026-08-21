---
name: ai-workplan-manager
description: Resolve or complete one task in an AI Tools vault workplan.
disable-model-invocation: true
---

Manage the file contract for one feature workplan. This skill owns task lookup and
completion bookkeeping; callers use its result instead of duplicating either rule.

## Inputs

- **operation** — `resolve` or `complete`.
- **feature** — required workplan slug.
- **task number** — optional for `resolve`, required for `complete`. Accept a positive
  decimal number with or without leading zeroes; normalize it to `NN`.

## Resolve

1. Resolve the vault root as `V="${OBSIDIAN_AI_VAULT:-$HOME/Documents/obsidian/obsidian}"`.
   Resolve the current code repository with `git rev-parse --show-toplevel`; its basename
   is `<project>`. Stop if either lookup fails.
2. Set `W="$V/engineering/<project>/workplans/<feature>"`. Require `W/spec.md`,
   `W/tasks.md`, and the selected `W/NN-task.md` to exist. Read `spec.md` and
   `tasks.md`.
3. Parse task-summary lines only when they begin with a Markdown checkbox and a task
   number (`N.0`, `NN.0`, `N.`, or `NN.`). Preserve the matched line and its checkbox
   span; never select by a substring elsewhere in the file.
4. If a task number was supplied, select its one matching entry. Reject a missing,
   checked, duplicate, malformed, or missing-task-file entry. If no number was supplied,
   select the first unchecked entry in file order; stop if none exists.
5. Return the complete contents of `spec.md`, `tasks.md`, and `NN-task.md`, plus the
   normalized task number and selected summary line. This operation is read-only.

## Complete

1. Run **Resolve** with the supplied feature and task number. A task must be pending;
   never complete a task selected implicitly.
2. Replace only the selected line's captured `[ ]` span in `tasks.md` with `[x]`. Keep
   every other byte of the file unchanged. Re-read the file and verify that the selected
   entry is checked and that the diff contains exactly this one checkbox replacement.
3. Delegate the vault commit and push to `ai-commit` with:

   ```
   target: vault
   commit message: ai-workplan-manager: <feature> NN
   ```

   `ai-commit` is the only skill that stages, commits, or pushes the vault. Do not
   reindex, create implementation notes, or run Git mutations in the code repository.
4. Report the selected feature and task, the one checkbox updated, and the vault commit
   or push result returned by `ai-commit`.

## Failure contract

Before the single checkbox replacement, every failure is read-only: missing feature,
missing required files, invalid number, missing summary entry or task document,
duplicate entry, already-completed task, and workplans with no pending task all leave
vault files unchanged.
