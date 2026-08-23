# Validators

## Shape

Use field tags on an operation input for simple local constraints. Create a
module-owned validator only when a named business rule needs reuse or an
external dependency. Put its documented interface in `ports/` and its concrete
implementation in `validator/`.

```go
type AddressValidator interface {
	Validate(ctx context.Context, address string) error
}

type PostalAddressValidator struct {
	coverage ports.PostalCoverage
}

var _ ports.AddressValidator = (*PostalAddressValidator)(nil)

func NewPostalAddressValidator(coverage ports.PostalCoverage) *PostalAddressValidator {
	return &PostalAddressValidator{coverage: coverage}
}
```

Return a pointer from a normal constructor.

## Examples

Use a stateless implementation when a named rule has no dependencies:

```go
type PasswordValidator struct{}

var _ ports.PasswordValidator = (*PasswordValidator)(nil)

func NewPasswordValidator() *PasswordValidator {
	return &PasswordValidator{}
}
```

## Variants

Start with a stateless validator. Add dependencies and `context.Context` only
when validation performs I/O.

## Rules and errors

Name thresholds and other rules as package constants. Return stable module
errors and add locale entries for every new error code.

## Structure

Keep stateful validation behavior with the validator type. A pure helper is
appropriate when it makes a deterministic rule clearer and does not duplicate
another validator or mapper.

## Ownership and evidence

Document the port's purpose and rules. Keep implementation comments for
non-obvious behavior rather than restating method names. Bind the concrete
validator to the consumer-owned port through Fx in its module.

## Rules and evidence

Add unit tests for a valid value, every invalid condition, and relevant boundary
values. Assert the returned typed error, not its rendered text. Test I/O-backed
validation through the smallest seam that proves its port interaction and
error handling.
