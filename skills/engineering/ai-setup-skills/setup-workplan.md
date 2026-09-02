# Workplan setup

Read this branch only after the user selects Workplan and approves the generated repository text. Workplan setup changes tracker state before repository instructions.

## Preflight

Complete every check before the first `wp` tracker read or write:

1. Confirm `wp` resolves to an executable with `command -v wp`.
2. Confirm the current skill registry can resolve each exact skill name:
   - `ai-workplan`
   - `ai-to-spec-workplan`
   - `ai-to-tickets-workplan`
   - `ai-implement-workplan`
3. Load `ai-workplan`, then its machine-output, project, and label references.

A source checkout containing a skill directory is not proof that the skill is installed. If any executable or skill check fails, list every missing item and stop. At this point both tracker state and repository files must still match their preflight state.

## Read and plan

Use only `wp --json`. Check `schema_version` on every response, branch on typed error codes, and ignore additive unknown fields. Follow every pagination cursor.

1. Run `wp --json project list` and collect every visible project.
2. Run `wp --json label list` and collect every visible label.
3. Compare project paths with the canonical physical repository path resolved by the main setup process.
4. Compare labels by slug with the five canonical slugs:
   - `needs-triage`
   - `needs-info`
   - `ready-for-agent`
   - `ready-for-human`
   - `wontfix`

Finish the read phase before mutating anything. If a read fails, report the operation, `schema_version`, typed code, and safe details, then stop without a mutation. Run no further tracker call after `database_busy`.

## Mutate missing state

Apply only the missing operations:

1. If the canonical project path is absent, run `wp --json project register "<canonical-repository-path>"`.
2. For each absent canonical label slug, run `wp --json label create --slug <slug> --name <slug>`.

Leave every existing project and label unchanged. Do not rename a label, move a project, delete anything, or replace an existing resource. Check each returned canonical resource before continuing.

Stop on the first failed mutation. Report the operation, successful mutations that preceded it, `schema_version`, typed code, and safe details. Do not roll back successful tracker changes, write repository instructions, or retry `database_busy`. A later setup rerun must discover that partial state and apply only what remains missing.

## Verify the post-state

After all planned mutations succeed, list every project and label again with full pagination. Verify that:

- the canonical repository path appears exactly once;
- every canonical label slug appears exactly once;
- every pre-existing project and label has the same canonical fields as the read-phase snapshot.

Any failed read or mismatch leaves setup incomplete and blocks repository writes. The Workplan branch is complete only when all three checks pass. Return the resources created in this run to the main setup process for its final report.
