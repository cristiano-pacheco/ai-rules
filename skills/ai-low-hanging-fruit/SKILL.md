---
name: ai-low-hanging-fruit
description: Find the MVP slice in a PRD or engineering plan.
disable-model-invocation: true
---

You help a team **solve the problem in a PRD or engineering plan with the least effort possible**, so they can ship something testable fast and iterate faster. You are not designing the full feature — you are finding the **low-hanging fruit**: the moves that are cheap to build, quick to validate, and unlock learning.

Your core tool is **inversion**. The mathematician Carl Gustav Jacob Jacobi advised *"invert, always invert"* (*man muss immer umkehren*), and Charlie Munger built a career on it: many hard problems are best solved backwards. So instead of only asking *"how do we build everything in this PRD or plan?"*, you also ask the inverse: *"what would guarantee we ship late, waste effort, or can't iterate?"* — then you avoid exactly that. The scope that survives inversion is the low-hanging fruit.

## Inputs

Two modes, decided by what the user gives you:

- **Directory mode** — the user points at a workplan in the vault. Read `prd.md` **or** `plan.md` (at least one must exist), and read `tech-spec.md` **if it exists** (don't require it). Write the result into the same workplan folder.
- **Text mode** — the user pastes PRD text, plan text, or a description directly. Analyze the text; there's no tech spec to read. Write the result to `./low-hanging-fruit.md` at the current project root.

If it's ambiguous which mode applies, ask.

### Directory mode: resolve project, workplan, and inputs

Output lives in the user's Obsidian vault, written **directly on the local filesystem** (no MCP), grouped by project.

**Vault root:** `$OBSIDIAN_AI_VAULT` (defaults to `$HOME/Documents/obsidian/obsidian` if unset). Everything below lives under `<vault>/engineering/...`. Use `Read`/`Write`/`Edit` (and `ls` via Bash) with the **absolute** path. Wikilink text inside notes stays vault-root-relative (`[[engineering/...]]`) — never put the absolute path inside `[[...]]`.

**Commit to the vault repo (after writing).** Once this run's files are written (the note plus any `index.md` updates), delegate the vault commit to the `ai-commit` skill (see `ai-commit/SKILL.md`). Pass the commit message:

```
ai-low-hanging-fruit: <workplan>
```

`ai-commit` resolves the vault root from `$OBSIDIAN_AI_VAULT`, stages, commits, and pushes. Never run `git add` / `git commit` / `git push` directly here. If `ai-commit` reports nothing staged, no `origin`, or a push failure, report it briefly and finish — don't abort the skill. `ai-setup` configures the repo and its `origin`.

1. **Project:** run `git rev-parse --show-toplevel`; the basename is the project name. If not a git repo, propose a name from `basename "$PWD"` (kebab-cased) and confirm with the user. Base path: `engineering/<project>`.
2. **Workplan:** if the user gave a feature or plan slug (e.g. `river-job-index-bloat` or `integrate-zoho-provider`), use it and confirm the folder exists (`ls -1 "<vault>/engineering/<project>/workplans"`). Otherwise list `<vault>/engineering/<project>/workplans` to find it; if ambiguous or missing, ask.
3. **Inputs:** read `<vault>/engineering/<project>/workplans/<workplan>/prd.md` if it exists. Read `<vault>/engineering/<project>/workplans/<workplan>/plan.md` if it exists. At least one of `prd.md` or `plan.md` is required; if both are missing, stop and tell the user to run `ai-create-prd` or `ai-create-plan` first. Then read `tech-spec.md` from the same folder **only if it exists** — its presence unlocks the tech-spec descope analysis below.

### Text mode

Take the PRD or plan text from the message. There is no tech spec. Write output to `./low-hanging-fruit.md` in the current working directory (overwrite if present).

## How to find the low-hanging fruit

Do the thinking before you write. Work in this order:

1. **Find the real problem.** Strip the PRD or plan down to the one outcome that must become true for this to be worth doing. Features and implementation steps are proxies; the outcome is the target. Everything else is negotiable.

2. **Invert.** Ask the backwards questions and let the answers point at what to cut:
   - *What would guarantee this ships late or never?* (Usually: building the whole PRD or the whole plan before anything is testable.)
   - *What are we building for a problem we don't have yet?* (Hypothetical scale, config for one value, abstractions with one caller, edge cases no real user hits.)
   - *If we could only ship one thing this week, what would prove or kill the idea?* That thing is the first slice.
   - *What can we fake, hardcode, or do manually now and automate later without regret?*
   - *What would a senior engineer call overcomplicated here?*

3. **Rank by effort × impact.** Low-hanging fruit = low effort, high impact, fast to test. Name each item's effort (S/M/L), the impact, and — crucially — **how you'd validate it quickly** (a manual test, one metric, a single user, a script). If you can't test it fast, it isn't low-hanging.

4. **Descope the plan and tech spec.** If `plan.md` was read, go through the plan and mark what can be **removed, deferred, or simplified** to deliver sooner. If `tech-spec.md` was read, do the same for the spec. Focus on components that aren't on the path to the core outcome, premature infrastructure, generalized solutions to specific problems, anything that adds delivery risk without moving the outcome. Be specific: name the section and say cut / defer / simplify and why.

5. **Define the fastest testable slice.** The smallest end-to-end thing that lets the team learn. Say explicitly what's included, and what's deliberately left out *for now* (deferring is not deleting — record it so it isn't lost).

Be honest about tradeoffs. If cutting something has a real risk, say so — inversion is about avoiding dumb effort, not shipping broken work. Never simplify away input validation at trust boundaries, security, data-loss protection, or anything the PRD or plan names as non-negotiable.

## Output structure

Write a short, scannable, action-oriented document — not an essay. Use this template:

```markdown
# Low-Hanging Fruit — <workplan or title>
> **PRD:** [[engineering/<project>/workplans/<workplan>/prd|prd]] · **Plan:** [[engineering/<project>/workplans/<workplan>/plan|plan]] · **Tech Spec:** [[engineering/<project>/workplans/<workplan>/tech-spec|tech-spec]]

## The real problem
One or two sentences: the single outcome that must become true.

## Inversion — what would make us fail
- What guarantees late delivery / wasted effort / no iteration, so we avoid it.

## Low-hanging fruit (ranked)
| # | Move | Effort | Impact | How to test it fast |
|---|------|--------|--------|---------------------|
| 1 | ...  | S      | High   | ...                 |

## Cut / defer / simplify from the plan or tech spec
_(Only include sources that exist.)_
- **Cut:** <plan or spec item> — why it isn't on the path to the outcome.
- **Defer:** <plan or spec item> — safe to add later, add-when trigger.
- **Simplify:** <plan or spec item> — the cheaper version that still works.

## Fastest testable slice
What we build first (end-to-end), and how we'll know it worked.

## Deliberately not doing (yet)
What we're deferring on purpose, so it isn't forgotten.
```

In directory mode, include only the blockquote links for files that exist. Include the plan/tech-spec descope section only if `plan.md` or `tech-spec.md` exists. Drop the blockquote links and the plan/tech-spec descope section in text mode (there's no vault workplan or spec). Keep the rest.

## Save and (directory mode only) keep the graph connected

**Directory mode:** write `<vault>/engineering/<project>/workplans/<workplan>/low-hanging-fruit.md` with `Write` (overwrites if present, creates missing parents). Then wire it into the Obsidian graph, append-if-missing:

1. **Workplan index** — `engineering/<project>/workplans/<workplan>/index.md`: read it (if missing, create with `# <workplan>` and a `↑ [[engineering/<project>/index|<project>]]` back-link); if not already present, add `- [[engineering/<project>/workplans/<workplan>/low-hanging-fruit|Low-Hanging Fruit]]` under `## Documents`.
2. **Project index** — `engineering/<project>/index.md`: ensure `- [[engineering/<project>/workplans/<workplan>/index|<workplan>]]` exists under `## Workplans` (create the file with `# <project>` + `↑ [[engineering/index|Engineering]]` if missing).
3. **Root index** — `engineering/index.md`: ensure `- [[engineering/<project>/index|<project>]]` exists under `## Projects` (create if missing).

Never duplicate an existing link. `ai-reindex` rebuilds indexes deterministically; this just keeps the graph live.

**Text mode:** write `./low-hanging-fruit.md` at the project root. No index, no wikilinks.

Report the final path when done.
