---
name: go-create-error
description: Generate custom Go errors following GO modular architecture conventions using bricks errs.New(code, message, httpStatus, metadata). Use when creating new domain errors, extending internal/modules/<module>/errs/errs.go, or standardizing error codes/messages/statuses in identity and monitor modules.
---

# Go Error Generator

Generate typed custom errors for module-level `errs` packages.

## Pattern

Place errors in:

`internal/modules/<module>/errs/errs.go`

Each module error file follows:

1. `package errs`
2. Imports:
   - `net/http`
   - `github.com/cristiano-pacheco/bricks/pkg/errs`
3. `var (...)` block with exported error variables
4. Error creation via:
   - `errs.New("<MODULE>_<NN>", "<Message>", http.<Status>, nil)`

## Example Structure

```go
package errs

import (
	"net/http"

	"github.com/cristiano-pacheco/bricks/pkg/errs"
)

var (
	// ErrInvalidContactType is returned when contact type is invalid.
	ErrInvalidContactType = errs.New("MONITOR_01", "Invalid contact type", http.StatusBadRequest, nil)
	// ErrContactNameAlreadyInUse is returned when contact name already exists.
	ErrContactNameAlreadyInUse = errs.New("MONITOR_02", "Contact name already in use", http.StatusConflict, nil)
)
```

## Generation Steps

1. **Identify error details**:
   - Target module (`identity`, `monitor`, ...)
   - Error variable name (`ErrInvalidContactType`)
   - Human message (`"Invalid contact type"`)
   - HTTP status (`http.StatusBadRequest`)

2. **Find the next code**:
   - Open `internal/modules/<module>/errs/errs.go`
   - Extract existing codes for that module prefix
   - Allocate the next available code while preserving format:
     - `IDENTITY_01`, `IDENTITY_02`, ...
     - `MONITOR_01`, `MONITOR_02`, ...
   - Keep code uniqueness inside the module

3. **Add the new error**:
   - Insert into the module `var (...)` block
   - Keep alphabetical or domain-group ordering used by the file
   - Prefer a short doc comment for consistency where comments are already used

4. **Validate usage path**:
   - Ensure new/updated usecases, validators, handlers, or enum constructors return the new typed error
   - Do not return raw `errors.New(...)` from business flows when a typed module error exists

5. **Update translations (mandatory)**:
   - Every new custom error must add a translation entry in `locales/en.json`
   - If additional locale files exist (for example `locales/pt_BR.json`), add the same key there too
   - Keep translation keys and structure consistent across all locale files
   - Do not merge a new custom error without the corresponding locale updates

## Naming Conventions

- **Variable**: `Err` + clear domain phrase in PascalCase
  - Example: `ErrInvalidUserStatus`, `ErrOAuthStateNotFound`
- **Code**: `<MODULE>_<NN>`
  - `IDENTITY_54`, `MONITOR_05`
- **Message**:
  - Short, user-safe, sentence case
  - Start with uppercase letter
  - Avoid punctuation unless needed
- **HTTP status**:
  - Validation errors: `http.StatusBadRequest`
  - Auth failures: `http.StatusUnauthorized` / `http.StatusForbidden`
  - Missing resources: `http.StatusNotFound`
  - Conflicts: `http.StatusConflict`
  - Rate limit: `http.StatusTooManyRequests`
  - Infra/internal failures: `http.StatusInternalServerError` / `http.StatusServiceUnavailable`

## Implementation Checklist

- [ ] Open target `internal/modules/<module>/errs/errs.go`
- [ ] Compute next unique module code
- [ ] Add exported `Err...` variable with `errs.New(...)`
- [ ] Match existing ordering/grouping style
- [ ] Ensure message and status align with domain behavior
- [ ] Replace raw error returns in calling code with typed `errs.Err...` where applicable
- [ ] Add translation for the new error in `locales/en.json`
- [ ] Add the same translation key in every other existing locale file (e.g., `locales/pt_BR.json`)

## Usage Pattern

```go
if input.RedirectURI == "" {
	return errs.ErrInvalidRedirectURI
}

if user == nil {
	return errs.ErrUserNotFound
}
```

## Critical Rules

- Do not create a new error package; use module-local `internal/modules/<module>/errs`
- Do not duplicate codes within the same module
- Do not return persistence or infrastructure-specific raw errors to transport when a typed domain error exists
- Keep error messages stable once exposed, unless migration/compatibility impact is accepted
- Every new custom error requires locale entries in `locales/en.json` and all other existing locale files
