---
name: ai-review-and-fix
description: Review and correct an already implemented engineering task.
disable-model-invocation: true
---

# AI Review and Fix

Review a completed task as an implementation owner and release reviewer. Work from the repository and Obsidian vault; never depend on review artifacts or task context supplied by an external loop.

This is a finite workflow. Fix material defects discovered in the review, run the relevant checks, and stop after the bounded re-review described below. Record small, acceptable follow-ups in implementation notes instead of continuing to polish indefinitely.

## Resolve the task independently

1. Resolve the code repository with `git rev-parse --show-toplevel`; its basename is `<project>`. If this fails, propose `basename "$PWD"` in kebab case and ask the user to confirm before writing.
2. Resolve the vault as `V="${OBSIDIAN_AI_VAULT:-$HOME/Documents/obsidian/obsidian}"`. Require `V/engineering`, the project workplans directory, and a vault Git repository. Stop with the `ai-setup` remedy if they are absent.
3. If the user supplied `<feature>` and optionally `NN`, confirm `engineering/<project>/workplans/<feature>` exists and locate `NN-task.md` directly.
4. Otherwise, inspect every `engineering/<project>/workplans/*/tasks.md`, its numbered task files, and `implementation-notes.md`. Identify candidates that are marked complete or have implementation evidence. Select only when one completed task is unambiguous; otherwise show the candidates and ask the user to choose.
5. Read directly from disk: `prd.md`, `tech-spec.md` when present, `tasks.md`, the resolved `NN-task.md`, `implementation-notes.md` when present, and any prior `review-and-fix-*.md` notes. Also inspect repository standards in `docs/` when present.

Do not use an artifact path or finding handed over by a loop as a substitute for this discovery. Treat it only as a hint, then verify it from the vault and repository.

## Review and correction workflow

1. Establish scope from the task's success criteria, relevant files, and recorded implementation decisions. Inspect `git status --short`, `git log main..HEAD --oneline`, `git diff main...HEAD`, and unstaged changes. Use the task's relevant files as a guide, but trace callers, callees, tests, configuration, persistence, and error paths when needed.
2. Review for correctness, regression risk, missing requirements, validation and security gaps, data consistency, error handling, concurrency, observability, and test coverage. Ignore purely cosmetic changes.
3. Categorize findings before editing:
   - **Must fix**: violates a task requirement, can cause incorrect behavior, security/data loss, or makes required verification fail.
   - **Acceptable follow-up**: small, non-blocking improvement with a clear owner or trigger; do not use this category for a release-blocking risk.
4. Implement all must-fix items using existing project patterns. Keep the code change scoped to the executed task.
5. Run the task's required checks, then the narrowest relevant tests plus lint/type checks or the project's equivalent. Re-review the changed paths once after the fixes.
6. Make at most two correction-and-verification attempts per failed check. If a material issue remains after that, do not claim the task is approved or commit a broken fix; report the blocker with evidence. If the only remaining items are acceptable follow-ups, record them and finish.

Never change a task checkbox here. It reflects execution status, not review approval.

## Obsidian artifacts and graph

Create a new, immutable review note at `<vault>/engineering/<project>/workplans/<feature>/review-and-fix-<timestamp>.md`, where `<timestamp>` is `date +%Y-%m-%d-%H%M%S`. Never overwrite a prior review. Under the H1 add:

`> **Task:** [[engineering/<project>/workplans/<feature>/NN-task|Task NN]] · **Tasks:** [[engineering/<project>/workplans/<feature>/tasks|tasks]] · **Implementation Notes:** [[engineering/<project>/workplans/<feature>/implementation-notes|implementation-notes]]`

Use this compact structure:

```markdown
# Review and Fix — <feature> Task NN — <timestamp>
> related links

## Scope and evidence
- Task requirements reviewed:
- Code/commit range reviewed:
- Inputs discovered directly:

## Findings and corrections
### Must-fix
- Finding → correction → affected files

### Accepted follow-ups
- Item → why non-blocking → owner or trigger

## Verification
- Commands and results:
- Re-review result:

## Outcome
- Approved / Approved with follow-ups / Blocked
```

Update `implementation-notes.md` rather than replacing prior history. Add a dated **Review and Fix** entry with the corrected material findings, accepted follow-ups, verification results, and any blocker. Create it only if missing, using the existing AI implementation-notes structure and task/tech-spec links.

Maintain the Obsidian graph append-if-missing:

1. In the feature `index.md`, add `- [[engineering/<project>/workplans/<feature>/review-and-fix-<timestamp>|Review and Fix — <timestamp>]]` under `## Documents`, and ensure `implementation-notes` is linked.
2. In the project index, ensure the workplan link exists under `## Workplans`.
3. In `engineering/index.md`, ensure the project link exists under `## Projects`.

Use vault-root-relative wikilinks only. `ai-reindex` remains the deterministic normalizer.

## Commit and push through ai-commit

Inspect the code worktree after verification. Delegate the code commit first to `ai-commit` with `target: code`, a Conventional Commit message such as `fix(<feature>): address review findings`, and the exact repository-relative files changed by this skill. It stages only those paths, commits, and pushes the current branch.

Then delegate the vault commit to `ai-commit` with the message:

```
ai-review-and-fix: <feature> NN
```

Never run `git add`, `git commit`, or `git push` directly. `ai-commit` owns both delegated operations and protects the vault/code boundary. If no code changed, skip the code-target delegation; always delegate the vault artifact commit. A missing `origin` or failed push is non-fatal, but report it.

## Report

Report the discovered feature and task, fixed findings, accepted follow-ups, verification results, code and vault commit/push status, and final vault artifact path. If blocked, state the exact failing check or unresolved material finding and stop.
