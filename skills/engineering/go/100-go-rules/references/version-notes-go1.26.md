# Go 1.26 baseline notes

Use these notes to modernize historically correct advice from the original 100 Go Mistakes material.

## Baseline

- Default target: Go 1.26 language/toolchain behavior.
- Language semantics may still depend on the `go` directive in `go.mod`; inspect it when compatibility matters.
- Prefer current documentation and compiler/runtime evidence over assumptions about old implementations.

## Changes that alter or qualify rules

### Loop variables — #31, #32, #63

Since Go 1.22, loop variables declared by the loop with `:=` have per-iteration scope for modules using Go 1.22+ semantics. The classic goroutine/closure capture bug from reusing one range variable is therefore historical for a normal Go 1.26 module. Still check:

- loops using assignment (`=`) to pre-existing variables;
- pointer-to-copy mistakes when taking the address of a ranged value instead of indexing the underlying slice/array;
- projects whose `go.mod` selects pre-1.22 semantics.

### Timers — #76

Since Go 1.23 semantics, unreferenced timers and tickers can be garbage-collected even if not stopped. Do not claim that repeated `time.After` inherently leaks memory in a Go 1.26 module. Prefer `time.NewTimer`/`NewTicker` when cancellation, reset, ownership, or explicit lifecycle control is required.

### WaitGroup — #71

Go 1.25 added `(*sync.WaitGroup).Go`, and `go vet` gained a waitgroup analyzer. Prefer `wg.Go(f)` for straightforward child goroutines when it fits; otherwise ensure `Add` happens before starting the goroutine and every counted task completes exactly once.

### Testing and benchmarking — #89, #90

Use current `testing` features. Keep benchmark setup out of the timed section when appropriate, control parallel noise, and use allocation metrics only in stable conditions. Native fuzzing is available; treat the unnumbered fuzzing entry as supplemental testing guidance.

### Inlining and diagnostics — #97, #98

Do not hard-code assumptions about compiler inlining. Measure and inspect compiler decisions when relevant. Go 1.26 rewrote `go fix` around the Go analysis framework and includes modernizers; use `go vet`, `go test`, `go test -race`, profiles/traces, compiler diagnostics, and `go fix` where appropriate.

### Garbage collector — #99

Go 1.26 enables the Green Tea garbage collector by default. Preserve conceptual guidance about allocation rate, reachability, GC CPU, `GOGC`, and `GOMEMLIMIT`, but avoid relying on obsolete collector implementation details. Profile the actual Go 1.26 workload.

### Containers — #100

Since Go 1.25, the runtime's default `GOMAXPROCS` is container-aware on supported systems and can adapt to CPU limits. Do not automatically prescribe manual `GOMAXPROCS` tuning for Go 1.26. Still reason explicitly about CPU quota behavior, memory limits/`GOMEMLIMIT`, GC headroom, throttling, requests vs limits, and observability.

## Go 1.26 additions worth preferring when relevant

- `new(expr)` can directly allocate and initialize a value; useful for optional pointer fields without a temporary variable.
- Generic types can refer to themselves in their type parameter list.
- `go fix` modernizers can migrate code to newer idioms and core-library APIs.
- The Green Tea GC is the default collector.
