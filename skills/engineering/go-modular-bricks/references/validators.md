# Validators

## Choose the validation level

Put simple, operation-local constraints on the use-case input with `validate`
tags and call `uc.validator.Struct(input)` first in `Execute`. Create a named
validator only for a reusable business rule or a rule that needs external data.

A named validator always has two files:

1. `internal/modules/<module>/ports/<name>_validator.go`
2. `internal/modules/<module>/validator/<name>_validator.go`

The port has the documented interface only. The implementation order is imports,
package constants, type, interface assertion, constructor, public methods, then
private methods.

## Recipe: stateless validator

Use a stateless validator by default. Put thresholds in package-level constants
and return a typed module error for each rejected business condition.

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

Do not add comments above the implementation type, constructor, or methods.
The port comment explains purpose and rules. Add locale entries for each new
typed error.

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

Use one `Validate` method for one purpose. A validator that owns a coherent set
of checks may use descriptive methods such as `ValidateEmail` and
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

Create `validator/<name>_validator_test.go`. Cover a valid value, every invalid
condition, empty input when relevant, and both sides of each threshold. Assert
the typed error with `assert.ErrorIs`, never its rendered message. For an
I/O-backed validator, stub the port and prove both the collaborator error and
the domain outcome.

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
- Every typed validation error has locale entries and complete boundary tests.
