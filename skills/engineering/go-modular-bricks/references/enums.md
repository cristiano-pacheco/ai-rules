# Enums

## Recipe: create a constrained string value

Use an enum when a module accepts one of a closed set of strings. Create
`internal/modules/<module>/enum/<snake_case_name>_enum.go`. Before writing it,
list every accepted literal and add `ErrInvalid<EnumName>` with
`http.StatusBadRequest` to the module `errs` package. Add that code to every
existing locale file.

The enum file has six components in this order: constants, validation map,
wrapper type, constructor, `String`, and private validator.

```go
package enum

import "example.com/project/internal/modules/shipment/errs"

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

`validateShipmentMode` is the one permitted package-level helper in this file.
The wrapper has no collaborators, so the helper keeps construction concise.

## Naming and placement

| Artifact | Required form | Example |
| --- | --- | --- |
| File | `<snake_case>_enum.go` | `shipment_mode_enum.go` |
| Constants | `<EnumName><Value>` | `ShipmentModeExpress` |
| Set | `valid<EnumName>s` | `validShipmentModes` |
| Wrapper | `<EnumName>Enum` | `ShipmentModeEnum` |
| Constructor | `New<EnumName>Enum` | `NewShipmentModeEnum` |
| Validator | `validate<EnumName>` | `validateShipmentMode` |
| Error | `ErrInvalid<EnumName>` | `ErrInvalidShipmentMode` |

Use `map[string]struct{}` for membership. Do not accept arbitrary strings and
defer validation to a database or handler. Construct the enum where raw input
becomes an application value, then pass the validated wrapper through policy.
Use a string constant directly only when the value is known at compile time.

## Tests

Test the constructor, not only `String`:

```go
func TestNewShipmentModeEnum(t *testing.T) {
	value, err := enum.NewShipmentModeEnum(enum.ShipmentModeExpress)
	require.NoError(t, err)
	assert.Equal(t, "express", value.String())

	_, err = enum.NewShipmentModeEnum("overnight")
	assert.ErrorIs(t, err, errs.ErrInvalidShipmentMode)
}
```

Test every accepted constant and at least one rejected literal. Then verify
that each constant appears once in the set, invalid input returns the typed
module error, and every locale contains that error code.
