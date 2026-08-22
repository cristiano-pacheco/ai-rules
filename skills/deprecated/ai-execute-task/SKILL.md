---
name: ai-execute-task
description: Implement the next task from a list.
disable-model-invocation: true
---

You are responsible for **correctly implementing tasks**. Identify the next available task, do the setup, and **implement it** properly — no hacks or shortcuts.

This is the execution step of a spec-driven workflow. The specs are read from Obsidian; the **code is written in the local repository**; the task status and implementation notes are kept in Obsidian.

<critical>You are not lazy. Do not rush. Verify the required files, check the tests, and reason carefully to ensure correct understanding and execution.</critical>
<critical>A TASK IS NOT COMPLETE UNTIL ALL TESTS PASS WITH 100% SUCCESS.</critical>
<critical>NEVER mention tech-spec, PRD, or task documents in code comments — these documents are not committed to the project, so such references are useless.</critical>
<critical>Use the context7 MCP to consult documentation for the languages, frameworks, and libraries involved.</critical>
<critical>After completing the task, mark it as completed in the vault's tasks.md.</critical>

## Inputs (read from the vault)

- PRD: `engineering/<project>/workplans/<feature>/prd.md`
- Tech spec: `engineering/<project>/workplans/<feature>/tech-spec.md`
- Tasks: `engineering/<project>/workplans/<feature>/tasks.md` and the relevant `<feature>/NN-task.md`
- Project standards: the repo's `docs/` folder, if present

## Output to Obsidian

Code changes go to the local repository. The only things written to the Obsidian vault (grouped by project) are the task-status update and the implementation notes — written **directly on the local filesystem** (no MCP).

**Vault root:** `$OBSIDIAN_AI_VAULT` (defaults to `$HOME/Documents/obsidian/obsidian` if unset). The vault docs live under `<vault>/engineering/...`. Use the `Read`/`Write`/`Edit` tools (and `ls` via Bash) with the **absolute** path, e.g. `$OBSIDIAN_AI_VAULT/engineering/<project>/...`. Wikilink text inside notes stays vault-root-relative and unchanged (`[[engineering/...]]`) — never put the absolute path inside `[[...]]`.

**Two separate repositories — never mix them.** This skill writes to **two** different git repos:

1. **The code repo** (the current working directory) — where you implement the task. Any `git add` / `git commit` here is the user's responsibility and outside this skill's scope; do not auto-commit code unless the user asks.
2. **The vault repo** (`$OBSIDIAN_AI_VAULT`) — where the task-status update and implementation notes live. The vault commit is delegated to `ai-commit`.

<critical>NEVER run `git add` / `git commit` / `git push` against the vault from inside this skill. Delegate the vault commit to the `ai-commit` skill (see `ai-commit/SKILL.md`). `ai-commit` resolves the vault root from `$OBSIDIAN_AI_VAULT` and guards against operating inside the code repo.</critical>

After writing this skill's vault files (the task-status update and the implementation notes), delegate the vault commit to the `ai-commit` skill. Pass the commit message:

```
ai-execute-task: <feature> NN
```

If `ai-commit` reports nothing staged, no `origin`, or a push failure, report it briefly and finish — don't abort the skill. `ai-setup` configures the repo and its `origin`.

### Resolve the project base path

1. Run `git rev-parse --show-toplevel`; the basename is the project name (this is also the repo you implement in).
2. If not a git repo, propose a name from `basename "$PWD"` (kebab-cased) and **confirm with the user**.
3. Base path: `engineering/<project>`.

### Resolve the feature and read inputs

**If the user gave you a feature identifier** (the `<feature>` slug, e.g. `river-job-index-bloat`) in their request, use it directly as `<feature>` and confirm the folder exists (`ls -1 "<vault>/engineering/<project>/workplans"`). Otherwise, list `<vault>/engineering/<project>/workplans` (`ls -1`) to find the feature folder; if ambiguous or missing, ask the user. Read the PRD, tech spec, tasks, and the specific `NN-task.md` with the `Read` tool.

### Update task status

When a task is done, mark its checkbox in `<vault>/engineering/<project>/workplans/<feature>/tasks.md` with the `Edit` tool — replace just that task's `- [ ]` with `- [x]` on its line, rather than rewriting the whole file.

### Maintain implementation notes

Keep `<vault>/engineering/<project>/workplans/<feature>/implementation-notes.md` current, following `references/implementation-notes-template.md`. Write it with the `Write` tool — it overwrites if present and creates any missing parent folders. Capture only what helps future maintainers or reviewers:

- decisions made because requirements were ambiguous or incomplete
- assumptions made during implementation
- changes made that were not explicitly requested
- tradeoffs considered and chosen
- deviations from the original plan
- issues discovered while implementing
- test results and verification notes
- anything important that is not obvious from the code

Directly under the notes' H1, add a related-links blockquote (this is a vault note, not code — the no-references-in-code rule does not apply here): `> **Tasks:** [[engineering/<project>/workplans/<feature>/tasks|tasks]] · **Tech Spec:** [[engineering/<project>/workplans/<feature>/tech-spec|tech-spec]]`.

### Maintain the index (keep the graph connected)

After writing the notes, wire them into the Obsidian graph with append-if-missing. Wikilinks use vault-root-relative paths + alias.

1. **Feature index** — `engineering/<project>/workplans/<feature>/index.md`: read it (if missing, create it with `# <feature>` and a `↑ [[engineering/<project>/index|<project>]]` back-link); if the wikilink for `implementation-notes` isn't present, add a bullet `- [[engineering/<project>/workplans/<feature>/implementation-notes|Implementation Notes]]` under `## Documents` (with the `Edit` tool, or `Write` the updated file).
2. **Project index** — `engineering/<project>/index.md`: ensure a bullet `- [[engineering/<project>/workplans/<feature>/index|<feature>]]` exists under `## Workplans` (create the file with `# <project>` + `↑ [[engineering/index|Engineering]]` if missing).
3. **Root index** — `engineering/index.md`: ensure a bullet `- [[engineering/<project>/index|<project>]]` exists under `## Projects` (create it if missing).

Never duplicate an existing link. `ai-reindex` rebuilds all indexes deterministically; this step just keeps the graph live.

## Execution steps

### 1. Pre-task setup
Read the task definition, the PRD context, and the tech spec requirements. Understand dependencies on previous tasks.

### 2. Task analysis
Consider the main objectives, how the task fits the project, alignment with project standards, and possible approaches.

### 3. Task summary
Briefly state: Task ID, name, key PRD context, key tech-spec requirements, dependencies, main objectives, and risks/challenges.

### 4. Approach plan
List the concrete steps you will take.

### 5. Implement immediately
After the summary and plan, **begin implementing right away**: run required commands, make the code changes in the local repo, and follow established project standards.

### 6. Review
Run `make lint && make test` (or the project's equivalent). Fix every issue. Do not finalize until all issues are resolved and tests pass 100%.

### 7. Report
State which task was completed and echo `Feature ID: <feature>` plus the next unchecked task in `workplans/<feature>/tasks.md` — so the user can continue in a fresh session by running `ai-execute-task` for `<feature>` again.

<critical>DO NOT SKIP ANY STEP.</critical>
<critical>After completing the task, mark it complete in the vault's tasks.md and update implementation-notes.md.</critical>
