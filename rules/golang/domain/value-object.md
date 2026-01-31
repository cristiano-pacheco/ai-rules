# Go Domain Value Objects Pattern Rule

## Description
Generate Go value objects following domain-driven design principles for immutable, self-validating types that represent domain concepts through their value rather than identity.

## What is a Value Object?

A value object is a small, immutable object that represents a descriptive aspect of the domain with no conceptual identity. Two value objects are equal if all their fields are equal. Examples include: Email, Name, Money, PhoneNumber, Address, etc.

## Key Characteristics

- **Immutability**: Once created, values cannot be changed
- **Value Equality**: Compared by value, not reference/identity
- **Self-Validating**: Always in a valid state after construction
- **No Identity**: No ID field needed
- **Side-Effect Free**: Methods don't modify state

## Pattern

### 1. **Struct Definition**
- Use a private struct with private fields
- Typically wraps a single value or closely related values
- No ID or timestamp fields (unlike entities)

### 2. **Constructor Function**
- Named `NewXModel(value)`
- Returns `(Model, error)` tuple
- Validates input before creating instance
- Trims whitespace before validation
- Returns zero value and error on validation failure
- Always returns value, not pointer (immutability)

### 3. **Validation**
- Create separate `validateX()` private function
- Check format, length, and business rules
- Return descriptive error messages
- Use unicode package for character validation
- Use regex for complex patterns (protect against ReDoS attacks)
- Use lo package utilities for validation helpers

### 4. **Getter Methods**
- Provide `String()` method to return the underlying value
- Add specific getters if wrapping multiple values
- Methods should not modify state (immutability)

### 5. **Comparison**
- Value objects are compared by value
- Go's `==` operator works for simple value objects
- For complex value objects, provide `Equals()` method

### 6. **Business Methods**
- Add domain-specific behavior if needed
- All methods must be side-effect free
- Return new instances if transformation is needed

## Example: Simple Value Object

```go
package domain

import (
    "errors"
    "regexp"
    "strings"
)

type EmailModel struct {
    value string
}

func NewEmailModel(email string) (EmailModel, error) {
    email = strings.TrimSpace(email)
    if err := validateEmail(email); err != nil {
        return EmailModel{}, err
    }
    return EmailModel{value: strings.ToLower(email)}, nil
}

func (e EmailModel) String() string {
    return e.value
}

// validateEmail checks if the email format is valid
func validateEmail(email string) error {
    if email == "" {
        return errors.New("email cannot be empty")
    }
    
    if len(email) > 254 {
        return errors.New("email cannot exceed 254 characters")
    }
    
    // Simple email regex (adjust based on requirements)
    emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)
    if !emailRegex.MatchString(email) {
        return errors.New("invalid email format")
    }
    
    return nil
}
```

## Example: Multi-Field Value Object

```go
package domain

import (
    "errors"
    "strings"
)

type MoneyModel struct {
    amountInCents   int64
    currency string
}

func NewMoneyModel(amount int64, currency string) (MoneyModel, error) {
    currency = strings.TrimSpace(strings.ToUpper(currency))
    if err := validateMoney(amount, currency); err != nil {
        return MoneyModel{}, err
    }
    return MoneyModel{
        amount:   amount,
        currency: currency,
    }, nil
}

func (m MoneyModel) AmountInCents() int64 {
    return m.amount
}

func (m MoneyModel) Currency() string {
    return m.currency
}

func (m MoneyModel) String() string {
    return fmt.Sprintf("%d %s", m.amount, m.currency)
}

func (m MoneyModel) Equals(other MoneyModel) bool {
    return m.amount == other.amount && m.currency == other.currency
}

func (m MoneyModel) Add(other MoneyModel) (MoneyModel, error) {
    if m.currency != other.currency {
        return MoneyModel{}, errors.New("cannot add money with different currencies")
    }
    return MoneyModel{
        amount:   m.amount + other.amount,
        currency: m.currency,
    }, nil
}

func validateMoney(amount int64, currency string) error {
    if amount < 0 {
        return errors.New("amount cannot be negative")
    }
    
    if currency == "" {
        return errors.New("currency cannot be empty")
    }
    
    if len(currency) != 3 {
        return errors.New("currency must be 3 characters (ISO 4217)")
    }
    
    return nil
}
```

## Testing Value Objects

```go
package domain_test

import (
    "testing"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

func TestNewEmailModel(t *testing.T) {
    t.Run("valid email", func(t *testing.T) {
        email, err := CreateEmailModel("test@example.com")
        require.NoError(t, err)
        assert.Equal(t, "test@example.com", email.String())
    })
    
    t.Run("trims whitespace", func(t *testing.T) {
        email, err := CreateEmailModel("  test@example.com  ")
        require.NoError(t, err)
        assert.Equal(t, "test@example.com", email.String())
    })
    
    t.Run("empty email returns error", func(t *testing.T) {
        _, err := CreateEmailModel("")
        assert.Error(t, err)
        assert.Contains(t, err.Error(), "cannot be empty")
    })
    
    t.Run("invalid format returns error", func(t *testing.T) {
        _, err := CreateEmailModel("invalid-email")
        assert.Error(t, err)
        assert.Contains(t, err.Error(), "invalid email format")
    })
}

func TestEmailModel_Immutability(t *testing.T) {
    email1, _ := CreateEmailModel("test@example.com")
    email2, _ := CreateEmailModel("test@example.com")
    
    // Value objects with same value should be equal
    assert.Equal(t, email1, email2)
}
```

## Common Value Objects

### Examples to implement:
- **EmailModel**: Email address
- **NameModel**: Person's name
- **PhoneNumberModel**: Phone number
- **URLModel**: Web address
- **MoneyModel**: Monetary value with currency
- **AddressModel**: Physical or mailing address
- **DateRangeModel**: Start and end dates
- **PercentageModel**: Percentage value (0-100)
- **QuantityModel**: Quantity with units

## Best Practices

1. **Keep Value Objects Small**: Focus on a single concept
2. **Make Them Immutable**: No setters, return new instances for changes
3. **Validate in Constructor**: Ensure objects are always valid
4. **Use Descriptive Names**: Name reflects the domain concept
5. **Return Values, Not Pointers**: Emphasizes immutability
6. **Provide String() Method**: For easy conversion to string
7. **Test Thoroughly**: Cover all validation rules and edge cases
8. **Document Formats**: Clearly specify expected formats and constraints

## Anti-Patterns to Avoid

❌ **Don't use pointers for value objects**
```go
// Bad
func NewEmail(value string) (*EmailModel, error)

// Good
func NewEmail(value string) (EmailModel, error)
```

❌ **Don't add setters**
```go
// Bad
func (e *EmailModel) SetValue(value string) { e.value = value }
```

❌ **Don't skip validation**
```go
// Bad
func NewEmail(value string) EmailModel {
    return EmailModel{value: value} // No validation!
}
```

❌ **Don't add ID fields**
```go
// Bad - value objects don't have identity
type EmailModel struct {
    id    uint64  // ❌ Remove this
    value string
}
```

## Tags
`go`, `domain`, `value-object`, `ddd`, `immutable`, `validation`, `architecture`

---

**Usage**: Apply this rule when creating value objects to ensure immutability, proper validation, and adherence to domain-driven design principles.
