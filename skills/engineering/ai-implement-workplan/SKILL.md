---
name: ai-implement-workplan
description: Claim and implement one Workplan ticket through one check and review pass, then commit or return findings.
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

2. **Choose the pass from the snapshot.** An empty `reviews` list starts an initial implementation pass. A nonempty list starts a review-guided fix pass. Pin the last review reference in the snapshot's oldest-first review list, then follow `wp --json review list <identifier>` pagination until that review ID appears. Use its exact text as required fix context. Verify its ticket identifier and creation time against the pinned reference. Ignore reviews absent from the claim snapshot, including any appended after the claim.

   This step is complete when the run is identified as initial or fix and, for a fix, the exact latest claim-time review is in context.

3. **Implement the snapshot once.** Use the snapshot's identifier, title, `content_markdown`, type, project, labels, and prerequisites as the ticket context. On a fix pass, also account for every blocking Standards and Spec finding in the pinned review. Read repository instructions and the source workplan or spec when the ticket requires it. Record the repository `HEAD` and initial worktree before editing. Preserve prior implementation changes already present in a fix worktree and implement only this ticket in its linked project.

   This step is complete when every acceptance criterion and, on a fix pass, every blocking finding has observable implementation evidence. The run's complete repository diff must contain no unrelated change.

4. **Run required checks once.** Determine the repository's mandatory checks from its instructions and build files. Run the focused checks needed during implementation, then one required-check pass over the completed diff. Use the execution snapshot and, on a fix pass, the pinned review when deciding what to verify.

   This step is complete when every required check passes and its exact command and result are recorded.

5. **Open review while retaining the claim.** Set the stored status before review:

   ```text
   wp --json ticket status <identifier> review
   ```

   Verify the returned ticket still has the claim from this run. Status writes do not release claims.

6. **Review once and persist the report.** Invoke `ai-review-changes` exactly once with the claim-time repository `HEAD` as its fixed point and the claimed ticket as the spec source. The review input is the complete implementation diff, including staged, unstaged, and untracked files. Capture the report exactly as returned. Do not trim, summarize, reformat, regenerate, or start another fix pass in this invocation.

   Write those exact bytes to one private temporary file, then append the immutable review:

   ```text
   wp --json review add <identifier> --content <temporary-file>
   ```

   Remove the temporary file after the call, including on failure. Verify the returned review text is byte-for-byte equal to the captured report. A clean report has no Standards or Spec findings.

7. **Return blocking findings to ready.** When the persisted report has any Standards or Spec finding, keep the complete implementation diff in the worktree. Do not commit, reset, revert, clean, or stash it. Preserve this order:

   ```text
   wp --json ticket status <identifier> ready
   wp --json ticket release <identifier>
   ```

   Verify the status response still carries the claim. Verify the release response has stored status `ready` and a null claim, then verify the implementation diff remains in the worktree. Report the canonical ticket identifier and immutable review record, state that the next claim is a fix pass, and stop.

8. **Commit the clean change.** For either an initial or fix pass with a clean report, commit only the complete reviewed implementation diff, following the repository's commit rules. The review record is tracker data and does not belong in the repository commit. Record the resulting commit identifier.

   This step is complete when the commit succeeds and contains the reviewed implementation diff.

9. **Complete, then release.** Preserve this order after the commit:

   ```text
   wp --json ticket status <identifier> completed
   wp --json ticket release <identifier>
   ```

   Verify the status response still carries the claim. Verify the release response has stored status `completed` and a null claim. Never release before the completed status succeeds.

10. **Return the result.** Report whether this was an initial or review-guided fix pass, the canonical ticket identifier, exact checks, review record, commit identifier, and released completed ticket. Ignore additive unknown JSON fields throughout the run.
