# Validators

## Choose the validation level

Put simple, operation-local constraints on the use-case input with `validate`
tags and call `uc.validator.Struct(input)` first in `Execute`. Create a named
validator only for a reusable business rule or a rule that needs external data.

Classify by the rule's acceptance/rejection behavior, not the caller count,
method name, or dependencies. Reading a repository, filesystem, or remote API
does not turn a validation rule into a service. A public validation command may
call a use case that orchestrates loading and validation; the reusable rule
itself remains a validator. Loading, conversion, and mutation belong to their
respective components, not to `Validate`.

Name the component `<Name>Validator`, with a consumer-owned port of the same
name. A validating `*Service` in `service/` is a classification failure, even
if its methods are private or it currently has one caller.

A named validator always has two files:

1. `internal/modules/<module>/ports/<name>_validator.go`
2. `internal/modules/<module>/validator/<name>_validator.go`

The port contains only the interface; document non-obvious rules according to
the project's comment policy. Keep the implementation in
this order: package, imports, constants, type, interface assertion, constructor,
public methods, then private methods.

## Recipe: stateless validator

Prefer a stateless validator. Put thresholds in package-level constants and
return a typed module error for each rejected business condition.

```go
package ports

// PasswordValidator validates password strength according to the module's
// security policy.
type PasswordValidator interface {
	Validate(password string) error
}
```

```go
package validator

import (
	"example.com/project/internal/modules/identity/errs"
	"example.com/project/internal/modules/identity/ports"
)

const (
	minPasswordLength = 8
	maxPasswordLength = 128
)

type PasswordValidator struct{}

var _ ports.PasswordValidator = (*PasswordValidator)(nil)

func NewPasswordValidator() *PasswordValidator {
	return &PasswordValidator{}
}

func (v *PasswordValidator) Validate(password string) error {
	if len(password) < minPasswordLength {
		return errs.ErrPasswordTooShort
	}
	if len(password) > maxPasswordLength {
		return errs.ErrPasswordTooLong
	}
	return nil
}
```

The examples use sentinel errors and interface comments. Apply the project's
error and comment contracts instead when they differ: a constructor-based error
is returned as `errs.ErrX(cause)`, and a no-boilerplate-comment policy also applies
to ports. Own validation failures in the validator's component error file when
the project requires per-component files. Add locale entries only for a project
that uses the locale error profile; see [errors](errors.md) when adding or changing
an error contract.

## Recipe: I/O-backed validator

Add dependencies and `context.Context` only when the rule performs I/O. Inject
ports, not concrete repositories or services.

```go
package ports

import "context"

// UsernameValidator checks format and confirms that no account owns the name.
type UsernameValidator interface {
	Validate(ctx context.Context, username string) error
}
```

```go
type UsernameValidator struct {
	userRepository ports.UserRepository
}

var _ ports.UsernameValidator = (*UsernameValidator)(nil)

func NewUsernameValidator(userRepository ports.UserRepository) *UsernameValidator {
	return &UsernameValidator{userRepository: userRepository}
}

func (v *UsernameValidator) Validate(ctx context.Context, username string) error {
	if len(username) < minUsernameLength {
		return errs.ErrUsernameTooShort
	}

	exists, err := v.userRepository.ExistsByUsername(ctx, username)
	if err != nil {
		return err
	}
	if exists {
		return errs.ErrUsernameAlreadyExists
	}
	return nil
}
```

Give one `Validate` method one purpose. A validator that owns a coherent set of
checks may instead use descriptive methods such as `ValidateEmail` and
`ValidatePasswordMatch`.

## Wire and test

Bind the implementation in `internal/modules/<module>/fx.go`:

```go
fx.Provide(
	fx.Annotate(
		validator.NewPasswordValidator,
		fx.As(new(ports.PasswordValidator)),
	),
)
```

Select the project's permitted test seam before creating tests. A project that
requires real-adapter integration tests through public use cases must prove
these rules there, without validator-local tests or doubles. Otherwise create
`validator/<name>_validator_test.go`. Cover a valid value, every invalid
condition, empty input when relevant, and both sides of each threshold. Assert
the typed error through the project's supported identity contract, never its
rendered message. For an I/O-backed validator, prove both the collaborator error
and domain outcome; stub the port only when the project permits doubles.
The following test assumes exported sentinel errors and a permitted unit seam:

```go
func TestPasswordValidator_TooShort_ReturnsError(t *testing.T) {
	v := validator.NewPasswordValidator()
	err := v.Validate("Ab1!")
	require.Error(t, err)
	assert.ErrorIs(t, err, errs.ErrPasswordTooShort)
}
```

## Check before finishing

- Local shape rules remain use-case tags; reusable rules have the two-file
  port-and-implementation pattern.
- Constants define thresholds and ports describe non-obvious rules.
- Stateless is the default. Context and dependencies appear only for I/O.
- The implementation asserts the port and its constructor returns a pointer.
- Each rejection follows the project's typed-error ownership and construction
  pattern; locales appear only under the locale profile.
- Boundary tests use the project-selected seam, without forbidden local tests
  or doubles.
- No reusable validation is implemented as a service or hidden in its helpers.
