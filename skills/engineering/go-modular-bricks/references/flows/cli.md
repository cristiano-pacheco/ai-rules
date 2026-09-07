# CLI router

Use for a Cobra command boundary in scope. Inspect `cmd`, the command owner,
and immediate composition helpers. Classify the command before selecting rows;
its name alone does not determine whether it runs policy or infrastructure.

## Select command contracts

| Responsibility in scope | Read in full | Conditional additions |
| --- | --- | --- |
| Business command: flags/arguments, input mapping, one public use-case call, output, context or errors | `../commands.md`, `../command-tests.md` | Use `application.md` for affected mapping, application contracts, or injection; not merely for calling an unchanged use case. |
| Server command: process startup, shutdown, or Fx lifecycle | `../commands.md`, `../command-tests.md` | Select Fx through `application.md` if composition/lifecycle changes; modules only if the enabled module set or ownership changes. |
| Migration command: invoking/composing the runner, execution or failure handling | `../commands.md`, `../command-tests.md` | Select migrations through `application.md` if runner semantics, migration discovery, filesystem contribution, ordering, or schema changes. A flag/output-only edit does not select schema contracts. |
| Command registration or shared Cobra behavior spanning command kinds | `../commands.md`, `../command-tests.md` | Inspect affected commands; select only kinds whose behavior is affected. |

In `../commands.md`, apply the selected command kind's recipe; the other recipes
are not instructions to create or modify those commands.

## Cross-boundary work

Use `application.md` for changed constructors, dependency bindings, public
injection types, configuration, mapping, or application behavior. New commands
require inspection of registration and composition, but Fx is selected only
when its composition contract is affected or unverified.

A server composing business modules does not select their use cases or adapters.
A migration command is not a business use case. A SQL migration without changed
Cobra behavior goes directly to the application router. A flag default or help
text change does not select global configuration unless the configuration
contract also changes.

## Proof

Apply `../command-tests.md` at the affected command boundary. Keep business proof
at the application seam selected through `application.md`; avoid duplicating
use-case integration scenarios through Cobra.
