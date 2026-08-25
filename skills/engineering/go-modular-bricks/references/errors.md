# Errors

## Recipe: add an expected module error

Expected business outcomes live in
`internal/modules/<module>/errs/errs.go`. Read that file before editing it. Use
its module prefix, group order, existing `brickserrs` alias, and the next unused
sequential code. Do not guess an error code.

Add the error to the existing `var` block:

```go
package errs

import (
	"net/http"

	brickserrs "github.com/cristiano-pacheco/bricks/pkg/errs"
)

var (
	ErrOrderAlreadyConfirmed = brickserrs.New(
		"ORDER_02",
		"order already confirmed",
		http.StatusConflict,
		nil,
	)
)
```

Apply this sequence:

1. Choose `Err` plus a clear PascalCase domain phrase, such as
   `ErrOrderAlreadyConfirmed`.
2. Allocate `<MODULE>_<NN>`. Uppercase the module prefix. Pad one-digit numbers
   to two digits: `ORDER_01` through `ORDER_09`, then `ORDER_10`.
3. Use a short, lowercase, punctuation-free internal message. The locale holds
   the user-facing capitalization.
4. Pick the status that matches the result: invalid input `BadRequest`, missing
   resource `NotFound`, conflict `Conflict`, authentication `Unauthorized` or
   `Forbidden`, upstream failure `BadGateway`, unavailable dependency
   `ServiceUnavailable`, and internal failure `InternalServerError`.
5. Add the code under `errors` in `locales/en.json` and in every other existing
   locale file. Use a safe sentence-case translation.
6. Return the new value from the use case, validator, enum, or adapter that owns
   the expected outcome.

```json
{
  "errors": {
    "ORDER_02": "Order already confirmed"
  }
}
```

The code, internal message, status, and locale key form a compatibility
contract. Keep them stable after release unless an accepted migration changes
them.

## Recipe: validation error with field details

Define one stable validation error variable first. Add a package-level helper
only when a caller needs field-level details. Reuse the stable error's code,
message, and status instead of allocating one code per field.

```go
var (
	ErrProfileValidationFailed = brickserrs.New(
		"PROFILE_01",
		"profile validation failed",
		http.StatusBadRequest,
		nil,
	)
)

func NewProfileValidationError(details []brickserrs.Detail) *brickserrs.Error {
	return brickserrs.New(
		ErrProfileValidationFailed.Code,
		ErrProfileValidationFailed.Message,
		ErrProfileValidationFailed.Status,
		details,
	)
}
```

This helper belongs at package scope because it only constructs an error. Keep
other application or adapter behavior out of the error package.

## Translate infrastructure at the adapter boundary

An adapter maps a known technical outcome when it has business meaning. For a
repository with a declared conflict error, map a duplicate key there:

```go
err := gorm.G[model.OrderModel](r.DB).Create(ctx, &order)
if err != nil {
	if errors.Is(err, gorm.ErrDuplicatedKey) {
		return model.OrderModel{}, errs.ErrOrderNumberConflict
	}
	return model.OrderModel{}, err
}
```

Map a missing GORM record to the module error when the module defines one;
otherwise return `brickserrs.ErrRecordNotFound`. Return unknown technical
failures unchanged so diagnostics retain their identity. The entry point renders
them safely. Never manufacture `errors.New(...)` for an expected business result.

## Check before finishing

- The module code is unique and follows the local sequence.
- The internal message is lowercase and the locale messages cover every locale.
- The status describes the business result, not the storage mechanism.
- Known adapter outcomes map to typed errors; unknown failures retain their
  cause.
- Callers return the typed value rather than raw string errors.
