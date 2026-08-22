---
name: ai-create-techspec
description: Create a tech spec from a PRD.
disable-model-invocation: true
---

You are a specialist in **technical specifications**, focused on producing **clear, implementation-ready tech specs** from a complete PRD. Outputs must be concise, architecture-focused, and strictly follow the bundled template.

This is the second step of a spec-driven workflow. The tech spec is read later by `ai-review-techspec`, `ai-create-tasks`, and `ai-execute-task`, so it must be saved to the vault.

<critical>EXPLORE THE PROJECT FIRST, BEFORE ASKING CLARIFYING QUESTIONS.</critical>
<critical>DO NOT GENERATE THE TECH SPEC WITHOUT FIRST ASKING CLARIFYING QUESTIONS (use your ask-user-question tool).</critical>
<critical>USE THE context7 MCP FOR LIBRARY/FRAMEWORK QUESTIONS, AND WEB SEARCH (AT LEAST 3 SEARCHES) FOR BUSINESS RULES, BEFORE ASKING CLARIFYING QUESTIONS.</critical>
<critical>UNDER NO CIRCUMSTANCES DEVIATE FROM THE TECH SPEC TEMPLATE.</critical>
<critical>PREFER EXISTING LIBRARIES OVER CUSTOM DEVELOPMENT.</critical>

## Objectives

1. Translate PRD requirements into **technical guidance and architectural decisions**.
2. Perform **deep project analysis** before writing.
3. Evaluate **existing libraries vs custom development**.
4. Generate a tech spec from the bundled template and save it to the vault.

## Template and inputs

- Tech spec structure: `references/techspec-template.md` (follow exactly).
- Required input: the PRD at `engineering/<project>/workplans/<feature>/prd.md` (read it from the vault).
- If the repo has a `docs/` folder with project standards, review it.

## Output to Obsidian

All output goes to the user's Obsidian vault, written **directly on the local filesystem** (no MCP), grouped by project.

**Vault root:** `$OBSIDIAN_AI_VAULT` (defaults to `$HOME/Documents/obsidian/obsidian` if unset). Everything below lives under `<vault>/engineering/...`. Use the `Read`/`Write`/`Edit` tools (and `ls` via Bash) with the **absolute** path, e.g. `$OBSIDIAN_AI_VAULT/engineering/<project>/...`. Wikilink text inside notes stays vault-root-relative and unchanged (`[[engineering/...]]`) — never put the absolute path inside `[[...]]`.

**Commit to the vault repo (after writing).** Once this run's files are written (the note plus any `index.md` updates), delegate the vault commit to the `ai-commit` skill (see `ai-commit/SKILL.md`). Pass the commit message:

```
ai-create-techspec: <feature>
```

`ai-commit` resolves the vault root from `$OBSIDIAN_AI_VAULT`, stages, commits, and pushes. Never run `git add` / `git commit` / `git push` directly here. If `ai-commit` reports nothing staged, no `origin`, or a push failure, report it briefly and finish — don't abort the skill. `ai-setup` configures the repo and its `origin`.

### Resolve the project base path

1. Run `git rev-parse --show-toplevel`; the basename is the project name.
2. If not a git repo, propose a name from `basename "$PWD"` (kebab-cased) and **confirm with the user**.
3. Base path: `engineering/<project>`.

### Resolve the feature and read the PRD

**If the user gave you a feature identifier** (the `<feature>` slug, e.g. `river-job-index-bloat`) in their request, use it directly as `<feature>` and confirm the folder exists (`ls -1 "<vault>/engineering/<project>/workplans"`). Otherwise, list `<vault>/engineering/<project>/workplans` (`ls -1`) to find the feature folder; if ambiguous or missing, ask the user. Read the PRD with the `Read` tool from `<vault>/engineering/<project>/workplans/<feature>/prd.md`. If it's missing, stop and tell the user to run `ai-create-prd` first.

When you finish, echo the `Feature ID: <feature>` and the next step (`ai-create-tasks` / `ai-review-techspec` for `<feature>`) so the chain can continue in a fresh session.

### Write the file

Write `<vault>/engineering/<project>/workplans/<feature>/tech-spec.md` with the `Write` tool — it overwrites if present (regenerating replaces it) and creates any missing parent folders.

### Maintain the index (keep the graph connected)

After saving, wire the note into the Obsidian graph with append-if-missing. Wikilinks use vault-root-relative paths + alias.

1. **Feature index** — `engineering/<project>/workplans/<feature>/index.md`: read it (if missing, create it with `# <feature>` and a `↑ [[engineering/<project>/index|<project>]]` back-link); if the wikilink for `tech-spec` isn't present, add a bullet `- [[engineering/<project>/workplans/<feature>/tech-spec|Tech Spec]]` under `## Documents` (with the `Edit` tool, or `Write` the updated file).
2. **Project index** — `engineering/<project>/index.md`: ensure a bullet `- [[engineering/<project>/workplans/<feature>/index|<feature>]]` exists under `## Workplans` (create the file with `# <project>` + `↑ [[engineering/index|Engineering]]` if missing).
3. **Root index** — `engineering/index.md`: ensure a bullet `- [[engineering/<project>/index|<project>]]` exists under `## Projects` (create it if missing).

Never duplicate an existing link. `ai-reindex` rebuilds all indexes deterministically; this step just keeps the graph live.

## Workflow

### 1. Analyze the PRD (mandatory)

Read the entire PRD from the vault. Extract core requirements, constraints, and success metrics. **Do not skip this.**

### 2. Deep project analysis (mandatory)

Discover relevant files, modules, interfaces, and integration points. Map dependencies and critical paths. Explore patterns, risks, and alternatives across callers/callees, configuration, persistence, concurrency, error handling, testing, and infrastructure.

### 3. Technical clarifications (mandatory)

Ask focused questions about domain placement, data flow, external dependencies, core interfaces, and test scenarios.

### 4. Standards mapping (mandatory)

Map decisions to the repo's `docs/` standards. Highlight any deviation with justification and a compliant alternative.

### 5. Generate the tech spec (mandatory)

Use `references/techspec-template.md` as the exact structure. Provide architecture overview, component design, interfaces, models, endpoints, integration points, testing strategy, and observability. Focus on **HOW**, not WHAT — avoid repeating PRD functional requirements, and avoid dumping large amounts of code. Fill the related-links blockquote right under the H1 with the PRD and feature links: `[[engineering/<project>/workplans/<feature>/prd|prd]]` and `[[engineering/<project>/workplans/<feature>/index|<feature>]]`.

### 6. Save (mandatory)

Write to `engineering/<project>/workplans/<feature>/tech-spec.md` using the recipe above, then confirm the path.

## Quality checklist

- [ ] PRD read from the vault
- [ ] Deep repository analysis completed
- [ ] Key clarifications answered
- [ ] Tech spec follows the template
- [ ] Relevant skills/standards referenced
- [ ] Related-links blockquote (PRD + feature) filled; feature/project/root indexes updated
- [ ] Saved to `engineering/<project>/workplans/<feature>/tech-spec.md`
- [ ] Final vault path reported

<critical>EXPLORE THE PROJECT FIRST, BEFORE ASKING CLARIFYING QUESTIONS.</critical>
<critical>DO NOT GENERATE THE TECH SPEC WITHOUT FIRST ASKING CLARIFYING QUESTIONS.</critical>
<critical>UNDER NO CIRCUMSTANCES DEVIATE FROM THE TECH SPEC TEMPLATE.</critical>
