# Rules 48-54 — Error management

## #48 — Panicking
**Rule:** Reserve panic for unrecoverable programmer/invariant failures, not ordinary operational errors.
**Why:** Panics bypass normal local error flow and force recovery decisions far from the failure.
**Apply:** Return errors for expected I/O, validation, network, dependency, and user-caused failures; recover only at deliberate process/request boundaries.

### Examples
**Bad**
```go
func ParsePort(s string) int {
    n, err := strconv.Atoi(s)
    if err != nil { panic(err) }
    return n
}
```
**Better**
```go
func ParsePort(s string) (int, error) {
    return strconv.Atoi(s)
}
```
Reserve panic for truly unrecoverable programmer/runtime invariants, not ordinary invalid input.

## #49 — Ignoring when to wrap an error
**Rule:** Wrap errors when callers should retain cause identity plus useful context; avoid exposing causes that are not part of the API contract.
**Why:** `%w` makes underlying errors discoverable with `errors.Is/As`, which can become a compatibility commitment.
**Apply:** Add concise operation/context and choose `%w` vs `%v` based on whether cause inspection should remain supported.

### Examples
**Bad**
```go
return fmt.Errorf("load user: %v", err) // caller cannot errors.Is/As through it
```
**Better**
```go
return fmt.Errorf("load user %q: %w", id, err)
```
Use `%w` only when exposing the underlying error is intentionally part of the contract.

## #50 — Comparing an error type inaccurately
**Rule:** Use `errors.As` to detect wrapped typed errors.
**Why:** Direct type assertions/switches only see the outer error and can miss a wrapped cause.
**Apply:** Declare a target of the appropriate type and call `errors.As`; use direct assertions only when wrapping is explicitly impossible/irrelevant.

### Examples
**Bad**
```go
var e *PathError
if _, ok := err.(*PathError); ok { /* ... */ }
```
**Better**
```go
var e *PathError
if errors.As(err, &e) { /* ... */ }
```

## #51 — Comparing an error value inaccurately
**Rule:** Use `errors.Is` for sentinel/value identity through wrapping.
**Why:** `==` generally checks only the outer error value and does not traverse an error chain.
**Apply:** Compare with `errors.Is(err, target)` when target identity is part of the contract.

### Examples
**Bad**
```go
if err == fs.ErrNotExist { /* ... */ }
```
**Better**
```go
if errors.Is(err, fs.ErrNotExist) { /* ... */ }
```

## #52 — Handling an error twice
**Rule:** Handle an error at one responsibility boundary: either resolve/log it there or return it with context, not both by default.
**Why:** Logging and returning the same failure creates duplicated/noisy logs and unclear ownership.
**Apply:** Let a higher boundary decide final reporting; lower layers add context or recover when they can take meaningful action.

### Examples
**Bad**
```go
if err != nil {
    slog.Error("query failed", "err", err)
    return fmt.Errorf("query user: %w", err)
}
```
when an outer layer also logs the returned error.

**Better**
```go
if err != nil {
    return fmt.Errorf("query user: %w", err)
}
```
Choose one layer to add context and one appropriate boundary to log/report.

## #53 — Not handling an error
**Rule:** Do not discard errors without a documented reason.
**Why:** Ignored failures can corrupt state, lose data, or hide broken cleanup/communication.
**Apply:** Propagate, handle, aggregate, or explicitly justify the ignored result; use linters for common unchecked-error cases.

### Examples
**Bad**
```go
value, _ := strconv.Atoi(input)
```
**Better**
```go
value, err := strconv.Atoi(input)
if err != nil {
    return fmt.Errorf("parse value: %w", err)
}
```
Ignore errors only when the reason is explicit and safe.

## #54 — Not handling defer errors
**Rule:** Account for errors returned by deferred cleanup when they can affect correctness.
**Why:** `Close`, `Flush`, `Commit`-like operations can surface the final write or release failure.
**Apply:** In functions returning an error, merge/replace the result deliberately; otherwise log/report at an appropriate boundary rather than silently dropping it.

### Examples
**Bad**
```go
f, err := os.Create(name)
if err != nil { return err }
defer f.Close()
return writeAll(f)
```
for a write path where close/flush errors matter.

**Better**
```go
func writeFile(name string) (err error) {
    f, err := os.Create(name)
    if err != nil { return err }
    defer func() {
        if closeErr := f.Close(); err == nil {
            err = closeErr
        }
    }()
    return writeAll(f)
}
```
