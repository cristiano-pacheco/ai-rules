---
name: ai-implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets.

## Tracker tickets

When the work comes from an issue-tracker ticket, the ticket file tracks the work end to end. Follow the repo's issue-tracker doc (`docs/agents/issue-tracker.md`, "Implementation ticket lifecycle"):

1. **Claim before implementing.** Set the ticket's `Status:` to `claimed` and save.
2. **Tick acceptance criteria as they land.** Each `- [ ]` in the ticket is an acceptance criterion; flip it to `- [x]` the moment it is verifiably done.
3. **Resolve after commit.** With every criterion ticked, append the completion comment under `## Comments` and set `Status: resolved`. A fully ticked checklist plus `Status: resolved` is the done state of ticket-tracked work.

## Review and commit

Run typechecking (make lint) regularly, single test files regularly, and the full test suite once at the end.

Once done, use /ai-review-changes skill to review the work.

Commit your work to the current branch.
