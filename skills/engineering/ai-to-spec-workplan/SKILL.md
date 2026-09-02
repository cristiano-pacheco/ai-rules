---
name: ai-to-spec-workplan
description: Publish settled conversation and repository context as one exact spec workplan through wp.
disable-model-invocation: true
---

# ai-to-spec-workplan

Turn the settled conversation into one spec and publish it to Workplan. The invocation authorizes publication. Synthesize what is known without an interview or approval round. If required intent is missing, report the missing input instead of inventing it or creating a partial workplan.

Before using `wp`, locate the installed sibling `ai-workplan/SKILL.md`. Read it, then follow its pointers to the machine-output contract and workplan command reference. They are the source of truth for envelopes, pagination, validation, typed errors, and command flags.

## Process

1. **Explore the repository.** Read the applicable domain glossary and ADRs. Inspect the implementation area, its closest precedent, and its tests. Use glossary terms in the spec and follow ADR decisions. Choose the highest existing test seam that proves the requested behavior. Introduce a lower seam only when the higher seam cannot make the behavior observable.

   This step is complete when every named domain concept matches the glossary, every applicable ADR is accounted for, and the testing decision names the highest useful seam and its precedent.

2. **Derive the identity.** Write a concise title from the settled feature. The trimmed title must be nonempty and contain no ASCII control characters. Derive an ASCII base slug from the title and repository terms: lowercase it, replace each run outside `a-z` and `0-9` with one hyphen, trim edge hyphens, and keep at most 63 bytes without leaving an edge hyphen. Use a more specific settled term if normalization produces an empty slug.

   List workplans through `wp --json workplan list`, following every cursor, because slugs are globally unique across types. Choose an unsuffixed base slug absent from the complete list. If the natural base is taken, add a meaningful settled scope term. Stop before writing if no accurate available base can be derived. Existing workplans are never updated, deleted, restored, or reused.

   This step is complete when the title passes title validation and the complete visible list contains no workplan with the chosen slug.

3. **Write the exact spec.** Produce one Markdown value with these sections:

```markdown
## Problem statement

Describe the user's problem from their perspective.

## Solution

Describe the settled solution from the user's perspective.

## User stories

Use a numbered list. Each item has the form: As an <actor>, I want <feature>, so that <benefit>. Cover every settled behavior and failure boundary without inventing scope.

## Implementation decisions

Record settled module, interface, architecture, schema, and interaction decisions. Use no file paths or code snippets unless a prototype snippet is the clearest record of a decision; trim such a snippet to that decision and identify it as prototype output.

## Testing decisions

Name the external behavior, the highest useful test seam, the modules covered, and the closest test precedent.

## Out of scope

State the boundaries of this spec.

## Further notes

Record only relevant settled context that does not fit above.
```

   The Markdown is complete when it states the settled behavior, decisions, test seam, failure boundaries, and exclusions without placeholders or unresolved guesses. Preserve the final bytes, including line endings and trailing newlines, for publication.

4. **Publish once.** Create one private temporary `.md` file and write the final Markdown to it. Run exactly one creation command, with the file as the explicit content input and without `--source`:

```text
wp --json workplan create --type spec --slug <slug> --title <title> --content <temporary-file>
```

   Remove the temporary file after success or failure, before returning. Do not use stdin, an editor, or a second temporary file. Do not retry `already_exists`, `database_busy`, or any other failure in this basic publication flow.

5. **Return the result.** Check `schema_version`, ignore additive unknown fields, and branch on the typed error code. On success, verify that `type` is `spec`, `slug` and `title` match, `source_workplan` is `null`, and `content_markdown` exactly matches the draft. Return the canonical created resource and the slug. On failure, return the typed code and its safe details after cleanup. Never replace a create failure with an update or content write.
