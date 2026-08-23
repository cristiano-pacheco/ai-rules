# Errors

## Module errors

Define expected business errors in the owning module's `errs/` package. Give
each exported error a unique, stable code, a short safe message, and the status
mapping used by the established entry-point renderer. Keep the existing module
ordering and error constructor convention.

```go
var ErrOrderAlreadyConfirmed = brickserrs.New(
	"ORDER_02",
	"order already confirmed",
	http.StatusConflict,
	nil,
)
```

Do not change an exposed code or message without accepting its compatibility
impact. A typed module error crosses the application boundary for an expected
business result. An unexpected technical failure keeps its identity until the
entry point renders it safely.

## Validation errors

Create a field-error constructor only when validation needs field-level
details. Reuse the stable code, message, and status of the module's validation
error. Add every new error code to every existing module locale file with a
user-safe translation.

## Adapter translation

Adapters translate a known infrastructure outcome to the corresponding module
error when the outcome has business meaning, such as a duplicate key becoming a
conflict. They return an unknown infrastructure failure unchanged. Application
policy does not return raw error strings for expected conditions.

## Helpers

Error constructors may be package-level functions. Keep stateful behavior with
the type that owns it, and keep error helpers limited to constructing or
classifying errors.
