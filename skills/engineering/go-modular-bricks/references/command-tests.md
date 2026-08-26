# Command tests

Test the command boundary according to the closest command-test pattern in the
project. Keep business behavior in the use-case integration test rather than
repeating it through Cobra.

## Business commands

Add or change a focused command test when flags, arguments, input mapping,
output, context propagation, or failure behavior changes. Prove the observable
boundary affected by the command:

- accepted flags and arguments map to the expected use-case input;
- invalid command syntax fails before application execution;
- the command passes Cobra's context to exactly one decorated use case;
- use-case output or error reaches the established command renderer;
- a mapping test does not start unrelated databases, servers, caches, clients,
  or providers.

Use the project's existing fake, mock, Fx replacement, or command factory. This
contract does not prescribe a mocking library or a second composition path.
The use case's own tests prove policy, persistence, and side effects.

## Infrastructure commands

Server and migration command tests cover their composition and lifecycle seams.
They do not assert a use-case call.

For a server command, prove changed module selection, startup failure,
shutdown, or context behavior at the narrowest existing seam. For a migration
command, prove changed migration collection, runner invocation, failure, or
lifecycle behavior. Use controlled infrastructure only when the behavior under
test requires it.

## Check before finishing

- The test follows the project's existing command-test setup.
- Each changed parsing or mapping branch has an observable assertion.
- A business command executes one use case and preserves its context and error.
- Infrastructure commands test composition rather than application policy.
- The test starts no dependency unrelated to the changed boundary.
