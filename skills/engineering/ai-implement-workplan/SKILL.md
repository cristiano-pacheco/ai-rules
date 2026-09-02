---
name: ai-implement-workplan
description: Claim and implement one Workplan ticket through checks, review, commit, completion, and release.
disable-model-invocation: true
---

# ai-implement-workplan

Claim and execute one Workplan ticket. One invocation performs one implementation pass, one required-check pass, and one review. The invocation authorizes the unambiguous tracker writes and repository commit in this process.

Before using `wp`, load the `ai-workplan` skill. If it is unavailable, stop and tell the user to install it. Follow its pointers to the dispatch, ticket, review, and machine-output references. They define command flags, claim behavior, response envelopes, exact text storage, and typed errors. Use only `wp --json` for tracker reads and writes. Do not read the database or web UI, and do not retry `database_busy`.

## Process

1. **Claim one ticket.** When the invocation names a complete ticket identifier, claim it directly:

   ```text
   wp --json ticket claim <workplan-slug/NN-ticket-slug>
   ```

   Otherwise run `wp --json ticket claim-next` from the current repository. Add only workplan and repeatable label filters explicitly supplied by the invocation. Let the command discover the current project. Do not broaden the search with `--all-projects` or infer filters from recent work.

   Check `schema_version` and branch on `error.code`. `no_ready_ticket` is a clean no-work result. Report it and stop without implementation, checks, review, commit, status, or release calls. Return every other typed claim failure without substituting another ticket.

   The successful claim response is the execution snapshot. Keep that exact full resource in context for the rest of the run. Do not refresh the ticket and silently adopt later data.

2. **Implement the snapshot.** Use the snapshot's identifier, title, `content_markdown`, type, project, labels, prerequisites, and reviews as the complete ticket context. Read repository instructions and the source workplan or spec when the ticket requires it. Record the repository `HEAD` and initial worktree before editing. Implement only this ticket in its linked project.

   This step is complete when every acceptance criterion in the snapshot has observable implementation evidence and the run's complete repository diff contains no unrelated change.

3. **Run required checks.** Determine the repository's mandatory checks from its instructions and build files. Run the focused checks needed during implementation, then one required-check pass over the completed diff. Use the execution snapshot when deciding what to verify.

   This step is complete when every required check passes and its exact command and result are recorded.

4. **Open review while retaining the claim.** Set the stored status before review:

   ```text
   wp --json ticket status <identifier> review
   ```

   Verify the returned ticket still has the claim from this run. Status writes do not release claims.

5. **Review once and persist the report.** Invoke `ai-review-changes` exactly once with the claim-time repository `HEAD` as its fixed point and the claimed ticket as the spec source. The review input is the complete implementation diff, including staged, unstaged, and untracked files. Capture the report exactly as returned. Do not trim, summarize, reformat, or regenerate it.

   Write those exact bytes to one private temporary file, then append the immutable review:

   ```text
   wp --json review add <identifier> --content <temporary-file>
   ```

   Remove the temporary file after the call, including on failure. Verify the returned review text is byte-for-byte equal to the captured report. A clean report has no Standards or Spec findings. Continue this clean path only for that result.

6. **Commit the clean change.** Commit only the implementation diff produced by this run, following the repository's commit rules. The review record is tracker data and does not belong in the repository commit. Record the resulting commit identifier.

   This step is complete when the commit succeeds and contains the reviewed implementation diff.

7. **Complete, then release.** Preserve this order after the commit:

   ```text
   wp --json ticket status <identifier> completed
   wp --json ticket release <identifier>
   ```

   Verify the status response still carries the claim. Verify the release response has stored status `completed` and a null claim. Never release before the completed status succeeds.

8. **Return the result.** Report the canonical ticket identifier, exact checks, review record, commit identifier, and released completed ticket. Ignore additive unknown JSON fields throughout the run.
