# Go Domain Model Pattern Rule

## Description
Generate Go domain models following the established patterns in the codebase for consistent domain-driven design implementation.

## Pattern

When creating domain models in Go, follow these patterns:

### 1. **Struct Definition**
- Use private fields with descriptive names
- Include common fields like `id`, `createdAt`, `updatedAt` for entities
- Use value objects for complex types (e.g., NameModel, EmailModel)

### 2. **Constructor Functions**
- `NewXModel()` for new instances (without ID, sets timestamps)
- `RestoreXModel()` for existing instances (with ID and all fields)
- Both return `(Model, error)` and validate inputs
- Always return value instead of pointers
- Trim whitespace before validation
- Return zero value and error on validation failure

### 3. **Validation**
- Create separate `validateX()` functions for complex validation
- Check required fields, length constraints, format rules
- Return descriptive error messages
- Use unicode package for character validation
- Use regex for complex pattern matching
- Prevent DDOS regex attacks
- Use lo package to help in the validation

### 4. **Getter Methods**
- Provide public getter methods for all fields
- Use descriptive method names (e.g., `ID()`, `Name()`, `Email()`)
- Return appropriate types (pointers for optional fields)

### 5. **Business Methods**
- Add domain-specific behavior methods
- Update `updatedAt` timestamp when state changes
- Use UTC time for all timestamps

### 6. **String Method**
- Implement `String()` method for value objects
- Return the underlying value

### 7. **Error Handling**
- Use descriptive error messages
- Include context in error messages
- Use `errors.New()` for simple errors

### 8. **Testing**
- Create comprehensive test files with `_test.go` suffix
- Test both valid and invalid inputs
- Use testify/assert and testify/require

## Example Structure for a domain model

```go
type XModel struct {
    id        uint64
    field     string
    createdAt time.Time
    updatedAt time.Time
}

func NewXModel(field string) (XModel, error) {
    field = strings.TrimSpace(field)
    if err := validateX(field); err != nil {
        return XModel{}, err
    }
    return XModel{
        field:     field,
        createdAt: time.Now().UTC(),
        updatedAt: time.Now().UTC(),
    }, nil
}

func RestoreXModel(id uint64, field string, createdAt, updatedAt time.Time) (XModel, error) {
    // validation...
    return XModel{
        id:        id, 
        field:     field, 
        createdAt: createdAt, 
        updatedAt: updatedAt,
    }, nil
}

func (x *XModel) Field() string { return x.field }

func validateX(value string) error { 
    // validation logic
    return nil
}
```

## Example structure for a value object

```go
type XModel struct {
    value string
}

func NewXModel(value string) (XModel, error) {
    value = strings.TrimSpace(value)
    if err := validateX(value); err != nil {
        return XModel{}, err
    }
    return XModel{value: value}, nil
}


func (x *XModel) String() string { return x.field }

func validateX(value string) error { 
    // validation logic
    return nil
}
```

## Tags
`go`, `domain`, `model`, `ddd`, `validation`, `architecture`

---

**Usage**: Apply this rule when creating new domain models to maintain consistency with the established codebase patterns and ensure proper domain-driven design principles.
