---
name: ai-execute-plan
description: Execute a technical implementation plan.
disable-model-invocation: true
---

You are responsible for **correctly implementing an engineering plan**. Read the plan, do the setup, and **implement it** properly - no hacks or shortcuts.

This is the execution step for `ai-create-plan`. The plan is read from Obsidian; the **code is written in the local repository**; implementation notes are kept in Obsidian when there is relevant context to preserve.

<critical>You are not lazy. Do not rush. Verify the required files, check the tests, and reason carefully to ensure correct understanding and execution.</critical>
<critical>THE PLAN IS NOT COMPLETE UNTIL ALL TESTS PASS WITH 100% SUCCESS.</critical>
<critical>NEVER mention plan documents in code comments - these documents are not committed to the project, so such references are useless.</critical>
<critical>Use the context7 MCP to consult documentation for the languages, frameworks, and libraries involved.</critical>

## Inputs (read from the vault)

- Plan: `engineering/<project>/workplans/<plan>/plan.md`
- Project standards: the repo's `docs/` folder, if present

## Output to Obsidian

Code changes go to the local repository. The only thing written to the Obsidian vault is `implementation-notes.md`, and only when there is relevant context to preserve - written **directly on the local filesystem** (no MCP).

**Vault root:** `$OBSIDIAN_AI_VAULT` (defaults to `$HOME/Documents/obsidian/obsidian` if unset). The vault docs live under `<vault>/engineering/...`. Use the `Read`/`Write`/`Edit` tools (and `ls` via Bash) with the **absolute** path, e.g. `$OBSIDIAN_AI_VAULT/engineering/<project>/...`. Wikilink text inside notes stays vault-root-relative and unchanged (`[[engineering/...]]`) - never put the absolute path inside `[[...]]`.

**Two separate repositories — never mix them.** This skill writes to **two** different git repos:

1. **The code repo** (the current working directory) - where you implement the plan. Any `git add` / `git commit` here is the user's responsibility and outside this skill's scope; do not auto-commit code unless the user asks.
2. **The vault repo** (`$OBSIDIAN_AI_VAULT`) - where the implementation notes live. The vault commit is delegated to `ai-commit`.

<critical>NEVER run `git add` / `git commit` / `git push` against the vault from inside this skill. Delegate the vault commit to the `ai-commit` skill (see `ai-commit/SKILL.md`). `ai-commit` resolves the vault root from `$OBSIDIAN_AI_VAULT` and guards against operating inside the code repo.</critical>

If `implementation-notes.md` is written or updated, delegate the vault commit to the `ai-commit` skill. Pass the commit message:

```
ai-execute-plan: <plan>
```

`ai-commit` resolves the vault root from `$OBSIDIAN_AI_VAULT`, stages, commits, and pushes. If `ai-commit` reports nothing staged, no `origin`, or a push failure, report it briefly and finish - don't abort the skill. `ai-setup` configures the repo and its `origin`.

### Resolve the project base path

1. Run `git rev-parse --show-toplevel`; the basename is the project name (this is also the repo you implement in).
2. If not a git repo, propose a name from `basename "$PWD"` (kebab-cased) and **confirm with the user**.
3. Base path: `engineering/<project>`.

### Resolve the plan and read inputs

**If the user gave you a plan identifier** (the `<plan>` slug, e.g. `integrate-zoho-provider`) in their request, use it directly as `<plan>` and confirm the folder exists (`ls -1 "<vault>/engineering/<project>/workplans"`). Otherwise, list `<vault>/engineering/<project>/workplans` (`ls -1`) to find the plan folder; if ambiguous or missing, ask the user.

Read the plan with the `Read` tool from `<vault>/engineering/<project>/workplans/<plan>/plan.md`. If it's missing, stop and tell the user to run `ai-create-plan` first.

### Maintain implementation notes

Create or update `<vault>/engineering/<project>/workplans/<plan>/implementation-notes.md` only when there is relevant context that is not already planned or obvious from the code. Follow `references/implementation-notes-template.md`. Write it with the `Write` tool - it overwrites if present and creates any missing parent folders.

Capture only what helps future maintainers or reviewers:

- decisions made because the plan was ambiguous or incomplete
- assumptions made during implementation
- changes made that were not explicitly planned
- tradeoffs considered and chosen
- deviations from the original plan
- issues discovered while implementing
- test results and verification notes
- anything important that is not obvious from the code

Directly under the notes' H1, add a related-links blockquote (this is a vault note, not code - the no-references-in-code rule does not apply here): `> **Plan:** [[engineering/<project>/workplans/<plan>/plan|plan]]`.

### Maintain the index (keep the graph connected)

If implementation notes are written, wire them into the Obsidian graph with append-if-missing. Wikilinks use vault-root-relative paths + alias.

1. **Plan index** - `engineering/<project>/workplans/<plan>/index.md`: read it (if missing, create it with `# <plan>` and a `Back: [[engineering/<project>/index|<project>]]` link); if the wikilink for `implementation-notes` isn't present, add a bullet `- [[engineering/<project>/workplans/<plan>/implementation-notes|Implementation Notes]]` under `## Documents` (with the `Edit` tool, or `Write` the updated file).
2. **Project index** - `engineering/<project>/index.md`: ensure a bullet `- [[engineering/<project>/workplans/<plan>/index|<plan>]]` exists under `## Workplans` (create the file with `# <project>` + `Back: [[engineering/index|Engineering]]` if missing).
3. **Root index** - `engineering/index.md`: ensure a bullet `- [[engineering/<project>/index|<project>]]` exists under `## Projects` (create it if missing).

Never duplicate an existing link. `ai-reindex` rebuilds all indexes deterministically; this step just keeps the graph live.

## Execution steps

### 1. Pre-plan setup

Read the plan and project standards. Understand the requested behavior, dependencies, risks, and verification requirements.

### 2. Plan analysis

Consider the main objectives, how the plan fits the project, alignment with project standards, and possible implementation approaches. Identify anything missing or risky before editing code.

### 3. Plan summary

Briefly state: Plan ID, objective, key technical approach, files likely to change, dependencies, main risks, and verification commands.

### 4. Approach plan

List the concrete steps you will take.

### 5. Implement immediately

After the summary and approach, **begin implementing right away**: run required commands, make the code changes in the local repo, and follow established project standards.

### 6. Review

Run `make lint && make test` (or the project's equivalent). Fix every issue. Do not finalize until all issues are resolved and tests pass 100%.

### 7. Notes

If relevant context exists that was not planned or is not obvious from code, write or update `implementation-notes.md` using the rules above. If nothing relevant needs to be preserved, do not create notes just to say there were none.

### 8. Report

State which plan was implemented, which verification commands passed, whether implementation notes were written, and echo `Plan ID: <plan>` so the user can reference it later.

<critical>DO NOT SKIP ANY STEP.</critical>
<critical>Do not mark anything as completed in the vault. This workflow has no task checkbox.</critical>
