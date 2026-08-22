# Engineering index & wikilink conventions

This is the **single source of truth** for how the `ai-*` suite interlinks notes
in the Obsidian vault so the graph is fully connected. Both `ai-reindex` (full
rebuild) and the individual skills (incremental append-if-missing) follow it.

## Wikilink format (non-negotiable)

Always use a **vault-root-relative path + alias**, dropping the `.md` extension:

```
[[engineering/<project>/workplans/<feature>/prd|prd]]
[[engineering/<project>/index|<project>]]
```

Full paths are required because many notes share a basename (`index`,
`01-task`, timestamped reviews). A bare `[[index]]` would be ambiguous; the
full path resolves regardless of Obsidian's "New link format" setting.

## The three index tiers

Only these three folders get an `index.md`. The flat artifact folders
(`code-reviews/`, `codebase-reviews/`, `pull-requests/`) do **not** get their
own index — their files are listed directly inside the project index.

### 1. Root — `engineering/index.md`

```markdown
# Engineering

AI-generated engineering documents, grouped by project.

## Projects
- [[engineering/<project-a>/index|<project-a>]]
- [[engineering/<project-b>/index|<project-b>]]
```

List every immediate subdirectory of `engineering/` (each is a project),
sorted alphabetically. Skip `index.md` itself and any loose files.

### 2. Project — `engineering/<project>/index.md`

```markdown
# <project>

↑ [[engineering/index|Engineering]]

## Workplans
- [[engineering/<project>/workplans/<feature>/index|<feature>]]

## Code Reviews
- [[engineering/<project>/code-reviews/<file-basename>|<file-basename>]]

## Codebase Reviews
- [[engineering/<project>/codebase-reviews/<file-basename>|<file-basename>]]

## Pull Requests
- [[engineering/<project>/pull-requests/<file-basename>|<file-basename>]]
```

Rules:
- **Workplans**: one bullet per feature folder under `workplans/`, linking to that
  feature's `index.md`. Sort alphabetically by feature slug.
- **Code Reviews / Codebase Reviews / Pull Requests**: one bullet per `.md` file
  in the respective folder (these filenames are timestamp-prefixed). Sort by
  filename **descending** so the newest is on top. Use the filename without `.md`
  as both the link target and the alias.
- **Omit any section whose folder is missing or empty.**

### 3. Feature — `engineering/<project>/workplans/<feature>/index.md`

```markdown
# <feature>

↑ [[engineering/<project>/index|<project>]]

## Documents
- [[engineering/<project>/workplans/<feature>/prd|PRD]]
- [[engineering/<project>/workplans/<feature>/tech-spec|Tech Spec]]
- [[engineering/<project>/workplans/<feature>/tech-spec-review-<ts>|Tech Spec Review — <ts>]]
- [[engineering/<project>/workplans/<feature>/tasks|Tasks]]
- [[engineering/<project>/workplans/<feature>/01-task|Task 01]]
- [[engineering/<project>/workplans/<feature>/implementation-notes|Implementation Notes]]
```

Rules:
- List **every `.md` file in the feature folder except `index.md` itself**.
- Preferred order: `prd` → `tech-spec` → `tech-spec-review-*` (newest first) →
  `tasks` → `NN-task` (ascending) → `implementation-notes` → anything else
  (alphabetical). Any file not in this list still gets a bullet — never drop a file.
- Aliases: use the friendly labels above for known files; for others use the
  filename without `.md`.

Paths here are on the local filesystem under the vault root
(`$HOME/Documents/obsidian/obsidian` by default) — `<F>` means
`<vault>/engineering/...`. Use `Read`/`Write`/`Edit` and `ls` on the **absolute**
path. Wikilink *text* inside the notes stays vault-root-relative (`[[engineering/...]]`).

## Rebuild recipe for one index (deterministic — used by ai-reindex)

To (re)build the `index.md` of a folder `F`:

1. `ls -1 "<F>"` to get its children.
2. Build the markdown body for F's tier using the rules above.
3. `Write` the body to `<F>/index.md` — the `Write` tool overwrites any existing
   index and creates missing parent folders.

Overwriting makes the rebuild idempotent: running it twice yields byte-identical output.

## Append-if-missing recipe (used by the individual skills)

When a skill has just written a new note and only needs to keep the graph live
(cheap, no full rebuild):

1. `Read` the index file (`<index path>`).
   - If it doesn't exist, create it with `Write` using the tier header above plus the one bullet.
2. If the exact wikilink for the new note is **not already present** in the file,
   add a bullet with that wikilink under the right section using the `Edit` tool
   (or `Write` the updated file). (Ordering drift is fine — `ai-reindex` normalizes it later.)
