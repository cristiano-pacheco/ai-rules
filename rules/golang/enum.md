# Golang Enum Pattern

Template:

```go
package enum

import "errors"

const (
	Enum{EnumName}{Value1} string = "{Value1}"
	Enum{EnumName}{Value2} string = "{Value2}"
	// Add more values as needed
)

type {EnumName}Enum struct {
	value string
}

func New{EnumName}Enum(value string) ({EnumName}Enum, error) {
	if err := validate{EnumName}Enum(value); err != nil {
		return {EnumName}Enum{}, err
	}

	return {EnumName}Enum{value: value}, nil
}

func (e *{EnumName}Enum) String() string {
	return e.value
}

func validate{EnumName}Enum(value string) error {
	allowedValues := map[string]struct{}{
		Enum{EnumName}{Value1}: {},
		Enum{EnumName}{Value2}: {},
		// Add all enum values here
	}

	if _, ok := allowedValues[value]; !ok {
		return errors.New("invalid {enum name}: " + value)
	}

	return nil
}
```

Naming:
- Constants: Enum{EnumName}{Value}
- Struct: {EnumName}Enum  
- Constructor: New{EnumName}Enum
- Validator: validate{EnumName}Enum

Usage:
```go
status, err := NewSubscriptionStatusEnum(EnumSubscriptionStatusActive)
if err != nil {
    // handle error
}
fmt.Println(status.String()) // "Active"
```