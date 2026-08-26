# CLI route

Use this route for a new or changed Cobra command. Inspect `cmd`, the relevant
composition helpers, and the closest comparable command before selecting a
branch.

## Business command

A business command maps flags and arguments to exactly one decorated use case.
Read these references in full:

- `../commands.md`
- `../command-tests.md`
- `application.md`

Follow every applicable pointer in `application.md` before editing. Preserve
the project's command composition, output, logger, and error conventions when
they do not conflict with `../data-flow.md`.

## Server command

A server command owns process and Fx lifecycle, not application policy. Read:

- `../commands.md`
- `../command-tests.md`
- `../fx-wiring.md`
- `../modules.md` when the enabled module set changes
- `../global-configuration.md` when server configuration changes

It does not select `application.md` merely because the server composes business
modules.

## Migration command

A migration command composes and runs migration infrastructure, not a use case.
Read:

- `../commands.md`
- `../command-tests.md`
- `../fx-wiring.md`
- `../migrations.md`
- `../database.md` when database setup or lifecycle changes

If the same task changes a module's persistence behavior, follow
`application.md` separately for that behavior.
