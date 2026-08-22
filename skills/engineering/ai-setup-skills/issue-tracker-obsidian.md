# Issue tracker: Obsidian

## Output to Obsidian

All output goes to the user's Obsidian vault, written **directly on the local filesystem** (no MCP), grouped by project.

**Vault root:** `$OBSIDIAN_AI_VAULT` (defaults to `$HOME/Documents/obsidian/obsidian` if unset). Everything below lives under `<vault>/engineering/...`. Use the `Read`/`Write`/`Edit` tools (and `ls` via Bash) with the **absolute** path, e.g. `$OBSIDIAN_AI_VAULT/engineering/<project>/...`. Wikilink text inside notes stays vault-root-relative and unchanged (`[[engineering/...]]`) — never put the absolute path inside `[[...]]`.

### Resolve the project base path

1. Run `git rev-parse --show-toplevel`; the basename of that path is the project name.
2. If the current directory is not a git repo (the command fails), propose a project name from `basename "$PWD"` (kebab-cased) and **confirm it with the user before writing**.
3. The base path in the vault is `engineering/<project>`.

Issues and specs for this repo live as markdown files in `<vault>/engineering/<project>/workplans/<feature>/`.

## Conventions

- One feature per directory: `<vault>/engineering/<project>/workplans/<feature>/`
- The spec is `<vault>/engineering/<project>/workplans/<feature>/spec.md`
- Implementation issues are one file per ticket at `<vault>/engineering/<project>/workplans/<feature>/issues/<NN>-<slug>.md`, numbered from `01`, never a single combined tickets file
- Triage state is recorded as a `Status:` line near the top of each issue file (see `triage-labels.md` for the role strings)
- Comments and conversation history append to the bottom of the file under a `## Comments` heading

## When a skill says "publish to the issue tracker"

Create a new file under `<vault>/engineering/<project>/workplans/<feature>/` (creating the directory if needed).

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path. The user will normally pass the path or the issue number directly.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a file with one **child** file per ticket.

- **Map**: `<vault>/engineering/<project>/workplans/<feature>/map.md` (the Notes / Decisions-so-far / Fog body).
- **Child ticket**: `<vault>/engineering/<project>/workplans/<feature>/issues/NN-<slug>.md`, numbered from `01`, with the question in the body. A `Type:` line records the ticket type (`research`/`prototype`/`grilling`/`task`); a `Status:` line records `claimed`/`resolved`.
- **Blocking**: a `Blocked by: NN, NN` line near the top. A ticket is unblocked when every file it lists is `resolved`.
- **Frontier**: scan `<vault>/engineering/<project>/workplans/<feature>/issues/` for files that are open, unblocked, and unclaimed; first by number wins.
- **Claim**: set `Status: claimed` and save before any work.
- **Resolve**: append the answer under an `## Answer` heading, set `Status: resolved`, then append a context pointer (gist + link) to the map's Decisions-so-far in `map.md`.
