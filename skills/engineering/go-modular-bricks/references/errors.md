# Errors

## Select the project error profile

Read the project's error rules and coding patterns before choosing a declaration
or return shape. Error files, constructors, cause handling, codes, HTTP statuses,
and locales are one project contract, not independent options to mix.

| Project pattern | Recipe |
| --- | --- |
| Component-owned sentinels and constructors, without codes or locales | Component-owned constructors below |
| Bricks error codes, HTTP statuses and translations | Bricks catalog error below |

Use only the selected recipe. An existing catalog does not override a stricter
documented pattern.

If no profile is documented, inspect the established error path. Resolve a
material conflict through `adr-exceptions.md` rather than combining profiles.

## Recipe: component-owned constructors

Create `internal/modules/<module>/errs/<component>_error.go`. The component that
owns the failing operation or rejected rule owns this file; validation failures
belong to the validator, not its calling service. Declare a distinct unexported
sentinel and same-named exported constructor for each expected outcome or failing
operation, following the project's exact pattern:

```go
var errCreateRunFailed = errors.New("create run failed")

func ErrCreateRunFailed(cause error) error {
	return fmt.Errorf("%w: %w", errCreateRunFailed, cause)
}
```

Callers return the constructor result directly:

```go
if err := tx.Create(&run).Error; err != nil {
	return model.RunModel{}, errs.ErrCreateRunFailed(err)
}
```

Keep `fmt.Errorf` inside these constructors when the project mandates it.
Preserve real causes; for a rejected condition without an underlying error,
follow the project's documented constructor convention instead of fabricating
a technical cause. If that convention is missing, resolve it before adding the
error. Tests use the supported public identity contract; an unexported sentinel
is not accessible to external integration tests, and a constructor is not an
`errors.Is` target.

Before finishing, verify each error's owner, file, identity, constructor and
cause behavior. Check that callers return it directly and that the diff adds no
catalog or locale files. Skip the catalog-specific checks below.

## Recipe: Bricks catalog error

Under the catalog profile, expected business outcomes live in
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
otherwise return `brickserrs.ErrRecordNotFound` under the catalog profile.
For component constructors, use the project-required operation error with the
original cause. Under the catalog profile, return unknown technical failures
unchanged so diagnostics retain their identity. The entry point renders
them safely. Never manufacture `errors.New(...)` for an expected business result.

## Check before finishing: catalog profile

- The module code is unique and follows the local sequence.
- The internal message is lowercase and the locale messages cover every locale.
- The status describes the business result, not the storage mechanism.
- Known adapter outcomes map to typed errors; unknown failures retain their
  cause.
- Callers return the typed value rather than raw string errors.
