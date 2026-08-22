---
name: ai-create-plan
description: Create a technical implementation plan.
disable-model-invocation: true
---

You are an expert Staff+ engineer at creating **clear, implementation-ready engineering plans** for focused technical work.

This skill is a lightweight planning workflow for changes that do not need a full PRD, tech spec, and task list. The plan is read later by `ai-execute-plan`, so it must be saved to the vault.

<critical>EXPLORE THE PROJECT FIRST, BEFORE ASKING CLARIFYING QUESTIONS.</critical>
<critical>DO NOT GENERATE THE PLAN WITHOUT FIRST ASKING CLARIFYING QUESTIONS.</critical>
<critical>UNDER NO CIRCUMSTANCES DEVIATE FROM THE PLAN TEMPLATE.</critical>
<critical>PREFER EXISTING LIBRARIES, PATTERNS, AND PROJECT CONVENTIONS OVER CUSTOM DEVELOPMENT.</critical>

## Objectives

1. Turn a small or medium technical request into a **precise implementation plan**.
2. Analyze the repository before deciding the approach.
3. Capture enough context for `ai-execute-plan` to implement safely later.
4. Generate `plan.md` from the bundled template and save it to the vault.

## Template

The plan structure is defined in `references/plan-template.md`. Read it and follow it exactly.

The plan is technical. Focus on **HOW** the change should be implemented, while keeping just enough **WHAT and WHY** to preserve context.

## Output to Obsidian

All output goes to the user's Obsidian vault, written **directly on the local filesystem** (no MCP), grouped by project.

**Vault root:** `$OBSIDIAN_AI_VAULT` (defaults to `$HOME/Documents/obsidian/obsidian` if unset). Everything below lives under `<vault>/engineering/...`. Use the `Read`/`Write`/`Edit` tools (and `ls` via Bash) with the **absolute** path, e.g. `$OBSIDIAN_AI_VAULT/engineering/<project>/...`. Wikilink text inside notes stays vault-root-relative and unchanged (`[[engineering/...]]`) - never put the absolute path inside `[[...]]`.

**Commit to the vault repo (after writing).** Once this run's files are written (the note plus any `index.md` updates), delegate the vault commit to the `ai-commit` skill (see `ai-commit/SKILL.md`). Pass the commit message:

```
ai-create-plan: <plan>
```

`ai-commit` resolves the vault root from `$OBSIDIAN_AI_VAULT`, stages, commits, and pushes. Never run `git add` / `git commit` / `git push` directly here. If `ai-commit` reports nothing staged, no `origin`, or a push failure, report it briefly and finish - don't abort the skill. `ai-setup` configures the repo and its `origin`.

### Resolve the project base path

1. Run `git rev-parse --show-toplevel`; the basename is the project name.
2. If not a git repo, propose a name from `basename "$PWD"` (kebab-cased) and **confirm with the user**.
3. Base path: `engineering/<project>`.

### Resolve the plan folder

The plan lives at `engineering/<project>/workplans/<plan>/plan.md`, where `<plan>` is an automatically generated kebab-case slug describing the work (e.g. `integrate-zoho-provider`).

Derive the slug from the user's request. Keep it short, specific, and action-oriented. If a folder for this plan may already exist, list `<vault>/engineering/<project>/workplans` (`ls -1`) and reuse the matching folder.

### Write the file

Write `<vault>/engineering/<project>/workplans/<plan>/plan.md` with the `Write` tool - it overwrites if present (regenerating replaces it) and creates any missing parent folders.

### Maintain the index (keep the graph connected)

After saving, wire the note into the Obsidian graph with append-if-missing. Wikilinks use vault-root-relative paths + alias.

1. **Plan index** - `engineering/<project>/workplans/<plan>/index.md`: read it (if missing, create it with `# <plan>` and a `Back: [[engineering/<project>/index|<project>]]` link); if the wikilink for `plan` isn't present, add a bullet `- [[engineering/<project>/workplans/<plan>/plan|Plan]]` under `## Documents` (with the `Edit` tool, or `Write` the updated file).
2. **Project index** - `engineering/<project>/index.md`: ensure a bullet `- [[engineering/<project>/workplans/<plan>/index|<plan>]]` exists under `## Workplans` (create the file with `# <project>` + `Back: [[engineering/index|Engineering]]` if missing).
3. **Root index** - `engineering/index.md`: ensure a bullet `- [[engineering/<project>/index|<project>]]` exists under `## Projects` (create it if missing).

Never duplicate an existing link. `ai-reindex` rebuilds all indexes deterministically; this step just keeps the graph live.

## Workflow

### 1. Understand the request (mandatory)

Extract the goal, expected behavior, constraints, and what is out of scope. Do not write the plan yet.

### 2. Deep project analysis (mandatory)

Discover relevant files, modules, interfaces, and integration points. Map dependencies and critical paths. Explore patterns, risks, alternatives, tests, configuration, persistence, concurrency, error handling, and infrastructure when relevant.

If the repo has a `docs/` folder with project standards, review it.

### 3. Technical clarifications (mandatory)

Ask focused questions about ambiguous behavior, domain placement, data flow, external dependencies, core interfaces, and test expectations.

### 4. Generate the plan (mandatory)

Use `references/plan-template.md` as the exact structure. Fill the related-links blockquote right under the H1 with `[[engineering/<project>/workplans/<plan>/index|<plan>]]`.

Keep the plan concise and implementation-ready. Prefer specific file paths, commands, interfaces, and sequencing over broad recommendations.

### 5. Save (mandatory)

Write to `engineering/<project>/workplans/<plan>/plan.md` using the recipe above, then confirm the path.

### 6. Report

Give the final vault path and a **very brief** summary of the plan. Then surface the **plan identifier** prominently so it can be carried into a fresh session for execution:

```text
Plan ID: <plan>
Next: in a new session inside this repo, run ai-execute-plan for `<plan>`
```

The `<plan>` slug is the only thing the user needs to pass to `ai-execute-plan` - the project resolves automatically from the git repo.

## Quality checklist

- [ ] Repository analyzed before questions
- [ ] Clarifying questions asked and answered
- [ ] Plan follows the template
- [ ] Relevant standards and existing patterns considered
- [ ] Related-links blockquote filled; plan/project/root indexes updated
- [ ] Saved to `engineering/<project>/workplans/<plan>/plan.md`
- [ ] Final vault path reported

<critical>EXPLORE THE PROJECT FIRST, BEFORE ASKING CLARIFYING QUESTIONS.</critical>
<critical>DO NOT GENERATE THE PLAN WITHOUT FIRST ASKING CLARIFYING QUESTIONS.</critical>
<critical>UNDER NO CIRCUMSTANCES DEVIATE FROM THE PLAN TEMPLATE.</critical>
