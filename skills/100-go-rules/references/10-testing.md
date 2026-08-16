# Rules 82-90 — Testing

## #82 — Not categorizing tests
**Rule:** Separate tests by cost/environment so developers and CI can run the right suites predictably.
**Why:** Mixing fast unit tests with network, integration, or long-running tests makes feedback slow and execution assumptions unclear.
**Apply:** Use package boundaries, build tags sparingly, environment gates, and `testing.Short()` conventions with explicit CI jobs.

### Examples
**Bad**
```go
func TestCheckout(t *testing.T) {
    // always starts containers and calls external services
}
```
**Better**
```go
func TestCheckoutIntegration(t *testing.T) {
    if testing.Short() { t.Skip("integration test") }
    // integration setup
}
```
Build tags or explicit environment gates can also separate slow/external suites.

## #83 — Not enabling the race flag
**Rule:** Run representative tests with `go test -race` in CI or scheduled validation.
**Why:** Many data races are timing-sensitive and invisible to ordinary tests.
**Apply:** Exercise concurrent paths under the race detector; remember it detects executed races, not all possible races, and incurs overhead.

### Examples
**Bad**
```sh
go test ./...
```
for a concurrent codebase with no race-detector coverage.

**Better**
```sh
go test -race ./...
```
Run it in an appropriate CI lane; the detector only finds races exercised by the tests/workload.

## #84 — Not using test execution modes
**Rule:** Use parallel and shuffled test execution to expose unwanted ordering/shared-state assumptions when tests are safe to run that way.
**Why:** A suite that only passes in declaration order or serial execution may hide coupling.
**Apply:** Use `t.Parallel()` deliberately, `-shuffle` in CI, and isolate global/shared state before increasing concurrency.

### Examples
**Bad**
```go
func TestA(t *testing.T) { /* mutates hidden global */ }
func TestB(t *testing.T) { /* silently depends on TestA */ }
```
**Better**
```sh
go test -shuffle=on ./...
```
and use `t.Parallel()` for tests that are actually independent.

## #85 — Not using table-driven tests
**Rule:** Use table-driven tests when many cases share setup/action/assertion structure.
**Why:** They make coverage and edge cases easier to scan while reducing repetitive test code.
**Apply:** Give cases meaningful names and keep case-specific logic small; do not force heterogeneous scenarios into an unreadable mega-table.

### Examples
**Bad**
```go
func TestParseEmpty(t *testing.T) { /* repeated setup */ }
func TestParseValid(t *testing.T) { /* repeated setup */ }
func TestParseInvalid(t *testing.T) { /* repeated setup */ }
```
**Better**
```go
func TestParse(t *testing.T) {
    tests := []struct{
        name string
        in   string
        want int
        ok   bool
    }{
        {"empty", "", 0, false},
        {"valid", "42", 42, true},
    }
    for _, tc := range tests {
        t.Run(tc.name, func(t *testing.T) { /* assert */ })
    }
}
```

## #86 — Sleeping in unit tests
**Rule:** Avoid fixed sleeps as synchronization in deterministic unit tests.
**Why:** Sleeps make tests slow and flaky because timing differs across machines and load.
**Apply:** Synchronize on observable events, channels, conditions, fake clocks, or bounded polling with deadlines when external timing is unavoidable.

### Examples
**Bad**
```go
go doAsync()
time.Sleep(100 * time.Millisecond)
if !done { t.Fatal("not done") }
```
**Better**
```go
done := make(chan struct{})
go func() { doAsync(); close(done) }()
select {
case <-done:
case <-time.After(time.Second):
    t.Fatal("timeout")
}
```
Prefer deterministic synchronization; in Go 1.26, `testing/synctest` may also fit async time/concurrency tests.

## #87 — Not dealing with the time API efficiently
**Rule:** Abstract or control time when logic depends on "now", timers, or delays.
**Why:** Direct wall-clock coupling makes tests slow, nondeterministic, and hard to exercise around boundaries.
**Apply:** Inject a small clock/time source or explicit timestamps; keep abstractions narrow and use current testing facilities where suitable.

### Examples
**Bad**
```go
func Expired(deadline time.Time) bool {
    return time.Now().After(deadline)
}
```
which forces wall-clock behavior into tests.

**Better**
```go
type Clock interface { Now() time.Time }
func Expired(clock Clock, deadline time.Time) bool {
    return clock.Now().After(deadline)
}
```
Or pass `now time.Time` directly when that is simpler.

## #88 — Not using testing utility packages
**Rule:** Use standard test helpers such as `httptest` and `iotest` before building custom infrastructure.
**Why:** Standard helpers encode edge cases and reduce boilerplate for HTTP and I/O behavior.
**Apply:** Prefer in-process servers/recorders and I/O fault helpers; add custom fixtures only for requirements the standard tools cannot express.

### Examples
**Bad**
```go
srv := &http.Server{Addr: ":0", Handler: handler}
// custom listener lifecycle just for a unit test
```
**Better**
```go
srv := httptest.NewServer(handler)
defer srv.Close()
resp, err := srv.Client().Get(srv.URL)
```
Use `httptest`, `iotest`, and other standard testing helpers instead of rebuilding test infrastructure.

## #89 — Writing inaccurate benchmarks
**Rule:** Benchmark the code path you intend to measure under representative inputs and control setup/noise.
**Why:** Compiler elimination, setup inside timed regions, allocations, scheduler effects, caches, and tiny durations can produce misleading numbers.
**Apply:** Use `b.ResetTimer`/`StopTimer` or modern loop APIs as appropriate, consume results, benchmark realistic sizes, report allocations, repeat runs, and compare statistically. See version notes.

### Examples
**Bad**
```go
func BenchmarkEncode(b *testing.B) {
    for b.Loop() {
        input := makeInput() // setup cost accidentally included
        encode(input)
    }
}
```
**Better**
```go
func BenchmarkEncode(b *testing.B) {
    input := makeInput()
    b.ReportAllocs()
    for b.Loop() {
        result = encode(input)
    }
}
```
Keep results observable when needed so compiler elimination does not invalidate the benchmark; isolate setup according to what is being measured.

## #90 — Not exploring all Go testing features
**Rule:** Use the `testing` package features that make failures localized, cleanup reliable, and suites reproducible.
**Why:** Ignoring subtests, helpers, cleanup, temp dirs, environment scoping, deadlines, parallelism, fuzzing, examples, and benchmark tooling leads to custom fragile patterns.
**Apply:** Prefer standard facilities such as `t.Run`, `t.Helper`, `t.Cleanup`, `t.TempDir`, `t.Setenv`, and current Go 1.26 testing APIs before inventing replacements.

## Supplemental — Not using fuzzing (community mistake, unnumbered)
**Rule:** Add fuzz tests for parsers, decoders, protocol boundaries, and invariant-rich functions that accept broad input spaces.
**Why:** Example tests cover selected cases; fuzzing explores unexpected combinations and automatically preserves failing inputs as regressions.
**Apply:** Seed useful cases, assert invariants rather than implementation details, and keep fuzz targets deterministic and bounded.

### Examples
**Bad**
```go
if err != nil {
    t.Errorf("setup failed: %v", err)
    return
}
```
repeated in every test helper.

**Better**
```go
func mustOpen(t *testing.T, name string) *os.File {
    t.Helper()
    f, err := os.Open(name)
    if err != nil { t.Fatal(err) }
    t.Cleanup(func() { _ = f.Close() })
    return f
}
```
Use subtests, helpers, cleanup, coverage, external test packages, fuzzing, and current testing features where they improve signal.
