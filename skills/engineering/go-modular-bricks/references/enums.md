# Enums

## Value object

Use an enum value object when a module accepts one of a constrained set of
strings. Put it in the owning module's `enum/` package. Define string
constants, a private valid-value set, the wrapper type, a validating
constructor, `String`, and a private validator.

## Example

```go
const (
	ShipmentModeStandard = "standard"
	ShipmentModeExpress  = "express"
)

var validShipmentModes = map[string]struct{}{
	ShipmentModeStandard: {},
	ShipmentModeExpress:  {},
}

type ShipmentModeEnum struct {
	value string
}

func NewShipmentModeEnum(value string) (ShipmentModeEnum, error) {
	if err := validateShipmentMode(value); err != nil {
		return ShipmentModeEnum{}, err
	}
	return ShipmentModeEnum{value: value}, nil
}

func (e ShipmentModeEnum) String() string {
	return e.value
}

func validateShipmentMode(value string) error {
	if _, ok := validShipmentModes[value]; !ok {
		return errs.ErrInvalidShipmentMode
	}
	return nil
}
```

## Creation

Choose the owning module and complete allowed values before adding the type.
Add an invalid-value module error with the established code, safe message, and
locale entries.

## Naming

Name the file `<name>_enum.go`, constants `<EnumName><Value>`, the private set
`valid<EnumName>s`, the wrapper `<EnumName>Enum`, the constructor
`New<EnumName>Enum`, and the private validator `validate<EnumName>`.

## Checklist

Verify that every allowed string has a constant and a valid-value-set entry,
the constructor rejects any other value with the typed module error, and the
module locale files include that error's code.

## Use

Construct the value at the boundary that receives the raw string. Pass the
validated value into application policy. Use constants directly only when the
value is known at compile time. Test accepted values, rejected values, and the
string representation.
