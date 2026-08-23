# Services

## Shape

Use a service for a reusable, single-responsibility capability consumed by use
cases or other services. A pure service needs only its implementation. An I/O
service may need a module DTO, a consumer-owned port in `ports/`, and a concrete
implementation in `service/`. Create only the artifacts that responsibility
needs.

The implementation has its concrete type, interface assertion, pointer-returning
constructor, and methods. The port describes purpose and non-obvious behavior.
The implementation depends on ports, never concrete adapters.

## Examples

```go
type TokenIssuer interface {
	Issue(ctx context.Context, subject string) (string, error)
}

type SignedTokenIssuer struct {
	signer ports.TokenSigner
	logger logger.Logger
}

var _ ports.TokenIssuer = (*SignedTokenIssuer)(nil)

func NewSignedTokenIssuer(
	signer ports.TokenSigner,
	logger logger.Logger,
) *SignedTokenIssuer {
	return &SignedTokenIssuer{signer: signer, logger: logger}
}
```

## Variants

Use `Execute` with a dedicated input for one action. Use descriptive methods
when one service groups related operations. Omit logger, configuration, and
context from a pure capability.

## Ownership and wiring

Fx binds a concrete I/O service to its consumer-owned port in the module's
composition root. Put construction that can fail at startup in a constructor
that returns `(*Service, error)`; normal constructors return only `*Service`.

## I/O

An I/O method receives `context.Context` first, creates the established adapter
span, and ends it with `defer`. Name a constructor's logger parameter `logger`.

## Error handling

A fallible I/O service has the established logger and logs a returned error
with its structured error field before propagating it:

```go
if err != nil {
	s.logger.Error("token issue failed", logger.Error(err))
	return "", err
}
```

Keep helper behavior with the stateful service that owns it. Put reusable pure
transformation in a mapper or pure service instead of duplicating helpers across
service files.

## Structure

Keep implementation helpers with their stateful service. Use a package-level
function only for a pure, focused mapper or service with no stateful owner.

## Documentation

Document an exported service port's purpose and behavior. Omit implementation
comments that only repeat the type, constructor, or method name.
