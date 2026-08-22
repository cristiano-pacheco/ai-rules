# Rules 42-47 — Functions and methods

## #42 — Not knowing which type of receiver to use
**Rule:** Choose pointer/value receivers from semantics, mutation, copy cost, and method-set consistency.
**Why:** Value receivers copy the receiver; pointer receivers can mutate/share identity and avoid copying large or non-copyable state.
**Apply:** Use pointer receivers for mutation, large structs, or types containing sync/non-copyable fields; keep receiver style consistent unless a clear reason differs.

### Examples
**Bad**
```go
type Counter struct{ n int }
func (c Counter) Inc() { c.n++ } // mutates a copy
```
**Better**
```go
type Counter struct{ n int }
func (c *Counter) Inc() { c.n++ }
```
Use receiver choice consistently with mutation, copy cost, and copy safety.

## #43 — Never using named result parameters
**Rule:** Use named results when names genuinely clarify the contract or support a simple deferred postcondition.
**Why:** A blanket ban loses useful documentation, but names can also create hidden state in longer functions.
**Apply:** Prefer unnamed results by default; name them for short, clear cases where the meaning improves readability.

### Examples
**Bad**
```go
func bounds(xs []int) (int, int, bool) {
    // callers/readers must infer what each int means
    /* ... */
}
```
**Better**
```go
func bounds(xs []int) (min, max int, ok bool) {
    /* ... */
}
```
Named results can document same-typed returns; do not use them solely to enable naked returns.

## #44 — Side effects with named result parameters
**Rule:** Remember that deferred functions can read or modify named return variables after the return expression is evaluated.
**Why:** This can silently change the value observed by the caller.
**Apply:** Avoid mutating named results in defer unless it is deliberate and obvious (for example, merging a close error); keep such functions short.

### Examples
**Bad**
```go
func read() (err error) {
    defer func() { err = cleanup() }() // overwrites an earlier error
    return doWork()
}
```
**Better**
```go
func read() (err error) {
    defer func() {
        if closeErr := cleanup(); err == nil {
            err = closeErr
        }
    }()
    return doWork()
}
```

## #45 — Returning a nil receiver
**Rule:** Distinguish a nil concrete pointer stored in an interface from a nil interface.
**Why:** An interface containing `(*T)(nil)` is non-nil because it has dynamic type information.
**Apply:** Return a literal nil interface on failure when the contract expects nil; avoid wrapping typed nil pointers into interface results unintentionally.

### Examples
**Bad**
```go
type MyError struct{ msg string }
func (e *MyError) Error() string { return e.msg }

func validate() error {
    var e *MyError
    return e // non-nil interface containing a nil pointer
}
```
**Better**
```go
func validate() error {
    return nil
}
```
Return an untyped/actual nil interface when no error exists.

## #46 — Using a filename as a function input
**Rule:** Accept behavior-oriented abstractions such as `io.Reader`/`io.Writer` when the function only needs stream I/O, rather than forcing filenames.
**Why:** Path-only APIs couple logic to filesystem access and make reuse/testing harder.
**Apply:** Separate opening/closing resources from processing; provide convenience path wrappers only when useful.

### Examples
**Bad**
```go
func ParseFile(filename string) (Config, error) {
    b, err := os.ReadFile(filename)
    /* ... */
}
```
**Better**
```go
func Parse(r io.Reader) (Config, error) {
    /* ... */
}
```
Let the caller decide whether input comes from a file, buffer, HTTP body, test fixture, or another source.

## #47 — Ignoring how defer arguments and receivers are evaluated
**Rule:** Remember that defer evaluates function values, arguments, and value receivers when the defer statement executes.
**Why:** Later mutations may not affect the deferred call unless a closure or pointer receiver observes them.
**Apply:** Capture exactly the state you intend; use closures deliberately when cleanup must use the final value.

### Examples
**Bad**
```go
status := "starting"
defer fmt.Println(status)
status = "done" // deferred call still prints "starting"
```
**Better**
```go
status := "starting"
defer func() { fmt.Println(status) }()
status = "done"
```
Choose immediate argument evaluation or closure-time evaluation deliberately.
