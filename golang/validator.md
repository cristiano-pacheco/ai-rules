# Go Validator Pattern Rule

## Description
Generate Go Validators for encapsulating complex validation logic that goes beyond simple struct tags. Validators ensure data integrity and business rule compliance.

## Location & Naming

- **Directory**: `internal/modules/<module_name>/validator` (e.g., `internal/modules/identity/validator`)
- **Filename**: Must end with `_validator.go` (e.g., `password_validator.go`)
- **Package**: `package validator`

## Pattern

### 1. **Interface Definition**
- Define an interface `XValidatorI` (e.g., `PasswordValidatorI`).
- Typically includes a `Validate` method accepting the data to validate.

### 2. **Struct Definition**
- Define a struct `XValidator` (e.g., `PasswordValidator`).
- Can contain dependencies or configuration constants if needed.
- **Compile-time Check**: Ensure the struct implements the interface:
  ```go
  var _ XValidatorI = (*XValidator)(nil)
  ```

### 3. **Constructor**
- Implement `NewXValidator`.
- Return a pointer to the struct `*XValidator`.

### 4. **Constants & Helpers**
- **Constants**: Define private constants for validation thresholds (e.g., `minimumPasswordLength`).
- **Helper Structs**: Use private structs to hold intermediate validation state if complex (e.g., `passwordRequirements`).
- **Helper Methods**: Extract complex logic into private methods (e.g., `checkRequirements`) to keep the main `Validate` method clean.

### 5. **Method Implementation**
- **Validate Method**: `func (v *XValidator) Validate(input Type) error`
- **Logic**:
    - **Business Rules**: Implement checks that are too complex for struct tags (e.g., password strength, cross-field validation).
    - **Helper Methods**: Use private helper methods (e.g., `checkRequirements`) to keep the main `Validate` method clean and readable.
    - **Error Handling**: Return specific, descriptive errors defined in the module's `errs` package (e.g., `errs.ErrPasswordTooShort`). Do not return generic errors.
- **Performance**: Optimize validation logic. For example, iterate over a string once to check multiple conditions (uppercase, lowercase, number, special char) instead of iterating multiple times.

## Example

```go
package validator

import (
	"unicode"
	"unicode/utf8"

	"github.com/cristiano-pacheco/go-bidding-service/internal/modules/identity/errs"
)

const (
	minimumPasswordLength = 8
)

type PasswordValidatorI interface {
	Validate(password string) error
}

type PasswordValidator struct {
}

var _ PasswordValidatorI = (*PasswordValidator)(nil)

func NewPasswordValidator() *PasswordValidator {
	return &PasswordValidator{}
}

type passwordRequirements struct {
	hasUpper   bool
	hasLower   bool
	hasNumber  bool
	hasSpecial bool
}

func (v *PasswordValidator) checkRequirements(password string) passwordRequirements {
	reqs := passwordRequirements{}

	for _, r := range password {
		switch {
		case unicode.IsUpper(r):
			reqs.hasUpper = true
		case unicode.IsLower(r):
			reqs.hasLower = true
		case unicode.IsNumber(r):
			reqs.hasNumber = true
		case unicode.IsPunct(r) || unicode.IsSymbol(r):
			reqs.hasSpecial = true
		}
	}

	return reqs
}

func (v *PasswordValidator) Validate(password string) error {
	if utf8.RuneCountInString(password) < minimumPasswordLength {
		return errs.ErrPasswordTooShort
	}

	reqs := v.checkRequirements(password)

	if !reqs.hasUpper {
		return errs.ErrPasswordNoUppercase
	}
	if !reqs.hasLower {
		return errs.ErrPasswordNoLowercase
	}
	if !reqs.hasNumber {
		return errs.ErrPasswordNoNumber
	}
	if !reqs.hasSpecial {
		return errs.ErrPasswordNoSpecialChar
	}

	return nil
}
```
