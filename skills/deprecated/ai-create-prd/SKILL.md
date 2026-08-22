---
name: ai-create-prd
description: Create a PRD in Obsidian.
disable-model-invocation: true
---

You are an expert at creating PRDs, focused on producing **clear, actionable requirement documents** for product and development teams.

This skill is the first step of a spec-driven workflow. The PRD it produces is read later by `ai-create-techspec`, `ai-create-tasks`, and `ai-execute-task` — all of which read it back from Obsidian. So the PRD must be saved to the vault, not to local disk.

<critical>DO NOT GENERATE THE PRD WITHOUT FIRST ASKING CLARIFYING QUESTIONS.</critical>
<critical>UNDER NO CIRCUMSTANCES DEVIATE FROM THE PRD TEMPLATE.</critical>

## Objectives

1. Capture **complete, clear, and testable requirements** focused on users and business outcomes.
2. Follow the **structured workflow** before writing any PRD.
3. Generate the PRD from the bundled template and save it to the correct vault location.

## Template

The PRD structure is defined in `references/prd-template.md`. Read it and follow it exactly — focus on **WHAT and WHY, not HOW** (implementation belongs in the tech spec).

## Output to Obsidian

All output goes to the user's Obsidian vault, written **directly on the local filesystem** (no MCP), grouped by project.

**Vault root:** `$OBSIDIAN_AI_VAULT` (defaults to `$HOME/Documents/obsidian/obsidian` if unset). Everything below lives under `<vault>/engineering/...`. Use the `Read`/`Write`/`Edit` tools (and `ls` via Bash) with the **absolute** path, e.g. `$OBSIDIAN_AI_VAULT/engineering/<project>/...`. Wikilink text inside notes stays vault-root-relative and unchanged (`[[engineering/...]]`) — never put the absolute path inside `[[...]]`.

**Commit to the vault repo (after writing).** Once this run's files are written (the note plus any `index.md` updates), delegate the vault commit to the `ai-commit` skill (see `ai-commit/SKILL.md`). Pass the commit message:

```
ai-create-prd: <feature>
```

`ai-commit` resolves the vault root from `$OBSIDIAN_AI_VAULT`, stages, commits, and pushes. Never run `git add` / `git commit` / `git push` directly here. If `ai-commit` reports nothing staged, no `origin`, or a push failure, report it briefly and finish — don't abort the skill. `ai-setup` configures the repo and its `origin`.

### Resolve the project base path

1. Run `git rev-parse --show-toplevel`; the basename of that path is the project name.
2. If the current directory is not a git repo (the command fails), propose a project name from `basename "$PWD"` (kebab-cased) and **confirm it with the user before writing**.
3. The base path in the vault is `engineering/<project>`.

### Resolve the feature folder

The PRD lives at `engineering/<project>/workplans/<feature>/prd.md`, where `<feature>` is a kebab-case slug describing the feature (e.g. `queue-routing`). `workplans/` is the project's working-docs folder; each feature gets its own subfolder under it holding the full set of working documents (PRD, tech spec, tasks, and the artifacts produced while building). Derive the slug from the feature name; if a folder for this feature may already exist, list `<vault>/engineering/<project>/workplans` (`ls -1`) and reuse the matching folder.

### Write the file

Write `<vault>/engineering/<project>/workplans/<feature>/prd.md` with the `Write` tool — it overwrites if the file exists (regenerating a PRD replaces it) and creates any missing parent folders, so you don't pre-create directories.

### Maintain the index (keep the graph connected)

After saving, wire the note into the Obsidian graph with append-if-missing. Wikilinks use vault-root-relative paths + alias, e.g. `[[engineering/<project>/workplans/<feature>/prd|prd]]`.

1. **Feature index** — `engineering/<project>/workplans/<feature>/index.md`: read it (if missing, create it with `# <feature>` and a `↑ [[engineering/<project>/index|<project>]]` back-link); if the wikilink for `prd` isn't already present, add a bullet `- [[engineering/<project>/workplans/<feature>/prd|PRD]]` under a `## Documents` heading (with the `Edit` tool, or `Write` the updated file).
2. **Project index** — `engineering/<project>/index.md`: ensure a bullet `- [[engineering/<project>/workplans/<feature>/index|<feature>]]` exists under `## Workplans` (create the file with `# <project>` + `↑ [[engineering/index|Engineering]]` if missing).
3. **Root index** — `engineering/index.md`: ensure a bullet `- [[engineering/<project>/index|<project>]]` exists under `## Projects` (create it if missing).

Never duplicate an existing link. `ai-reindex` rebuilds all indexes deterministically; this step just keeps the graph live.

## Workflow

### 1. Clarify (mandatory)

Use your ask-user-question tool to understand:

- The problem to be solved
- Core functionality
- Constraints
- What is **out of scope**

### 2. Plan (mandatory)

Outline a section-by-section approach, note areas needing research (use web search for business rules when relevant), and state assumptions and dependencies.

### 3. Write the PRD (mandatory)

- Follow `references/prd-template.md`.
- Focus on WHAT and WHY, not HOW.
- Include **numbered functional requirements**.
- Keep the document under ~2,000 words.
- Fill the `> **Feature:**` related-links blockquote right under the H1 with `[[engineering/<project>/workplans/<feature>/index|<feature>]]`.

### 4. Save (mandatory)

Write to `engineering/<project>/workplans/<feature>/prd.md` using the write recipe above.

### 5. Report

Give the final vault path and a **very brief** summary of the PRD. Then surface the **feature identifier** prominently so it can be carried into a fresh session for the next step:

```
Feature ID: <feature>
Next: in a new session inside this repo, run ai-create-techspec for `<feature>`
```

The `<feature>` slug is the only thing the user needs to pass to `ai-create-techspec`, `ai-create-tasks`, `ai-review-techspec`, and `ai-execute-task` — the project resolves automatically from the git repo.

## Quality checklist

- [ ] Clarifying questions asked and answered
- [ ] PRD follows the template
- [ ] Numbered functional requirements included
- [ ] Saved to `engineering/<project>/workplans/<feature>/prd.md`
- [ ] Related-links blockquote filled; feature/project/root indexes updated
- [ ] Final vault path reported

<critical>DO NOT GENERATE THE PRD WITHOUT FIRST ASKING CLARIFYING QUESTIONS.</critical>
<critical>UNDER NO CIRCUMSTANCES DEVIATE FROM THE PRD TEMPLATE.</critical>
