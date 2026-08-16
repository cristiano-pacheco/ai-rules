# Rules 91-100 — Optimization and runtime

## #91 — Not understanding CPU caches
**Rule:** Optimize memory access patterns only with awareness that locality and cache misses can dominate CPU time.
**Why:** Contiguous/predictable access often outperforms pointer-heavy/random layouts even at similar algorithmic complexity.
**Apply:** Profile first; favor locality-friendly structures and iteration when hot data paths demonstrate cache pressure.

### Examples
**Bad**
```go
for col := 0; col < cols; col++ {
    for row := 0; row < rows; row++ {
        sum += matrix[row][col] // poor locality for row-major slices
    }
}
```
**Better**
```go
for row := 0; row < rows; row++ {
    for col := 0; col < cols; col++ {
        sum += matrix[row][col]
    }
}
```
Only optimize layout/traversal after profiling shows it matters.

## #92 — False sharing
**Rule:** Avoid placing independently hot, concurrently written fields on the same cache line when measurements show coherence contention.
**Why:** CPUs invalidate cache lines, not individual fields, so unrelated writes can bounce one line between cores.
**Apply:** Confirm with profiles/benchmarks; partition ownership or pad/separate hot counters only where contention is material and architecture assumptions are acceptable.

### Examples
**Bad**
```go
type Counters struct {
    a atomic.Int64
    b atomic.Int64 // hot counters may share a cache line
}
```
**Better when profiling proves false sharing**
```go
type paddedCounter struct {
    v atomic.Int64
    _ [64]byte // illustrative; actual cache-line assumptions are platform-specific
}
```
Do not hard-code padding casually; verify architecture and benchmark the workload.

## #93 — Ignoring instruction-level parallelism
**Rule:** In tight CPU loops, recognize that dependency chains can limit the processor even without goroutine-level concurrency.
**Why:** Independent operations may execute in parallel inside a core, while serial dependencies constrain throughput.
**Apply:** Let the compiler optimize first; restructure only proven hotspots and verify generated code/benchmarks rather than guessing.

### Examples
**Bad**
```go
var sum int
for _, v := range xs {
    sum += v // one long dependency chain
}
```
**Better only for a proven hotspot**
```go
var a, b int
for i := 0; i+1 < len(xs); i += 2 {
    a += xs[i]
    b += xs[i+1]
}
sum := a + b
if len(xs)%2 != 0 { sum += xs[len(xs)-1] }
```
For integer addition this preserves the intended reduction while exposing independent accumulators. Verify generated code and benchmark results before applying the transformation.

## #94 — Not being aware of data alignment
**Rule:** Understand struct padding/alignment when memory footprint or atomic access patterns matter at scale.
**Why:** Field order can add padding, multiplying memory use across large object counts; alignment also affects low-level operations.
**Apply:** Measure with `unsafe.Sizeof`/profiles and reorder fields only when material; never trade maintainability for negligible bytes without evidence.

### Examples
**Bad**
```go
type Row struct {
    flag bool
    id   int64
    kind byte
}
```
**Better when memory footprint is measured and material**
```go
type Row struct {
    id   int64
    flag bool
    kind byte
}
```
Inspect `unsafe.Sizeof` rather than assuming a layout win.

## #95 — Not understanding stack vs. heap
**Rule:** Treat escape placement as a compiler decision, not as a direct consequence of `new`, pointers, or syntax.
**Why:** Values move to the heap when their lifetime/usage requires it; heap allocation increases GC work but stack allocation is cheap and dynamic.
**Apply:** Use escape diagnostics/profiles for hot allocations; design clear APIs first and optimize escape behavior only when measured.

### Examples
**Bad**
```go
func newUser() *User {
    u := &User{}
    // assumes "pointer syntax means heap" and rewrites API solely for that reason
    return u
}
```
**Better**
```go
func newUser() User {
    return User{}
}
```
Choose API semantics first; use compiler escape diagnostics and profiles to learn actual placement.

## #96 — Not knowing how to reduce allocations
**Rule:** Reduce allocations by changing data flow/ownership before reaching for pools.
**Why:** Fewer conversions/copies, reusable buffers, capacity hints, and compiler-friendly lifetimes often beat `sync.Pool` complexity.
**Apply:** Profile `alloc_space`/alloc counts, remove unnecessary boxing/conversions, preallocate when justified, and use `sync.Pool` only for temporary reusable objects under measured pressure.

### Examples
**Bad**
```go
func join(parts []string) string {
    s := ""
    for _, p := range parts { s += p }
    return s
}
```
**Better**
```go
func join(parts []string) string {
    var b strings.Builder
    for _, p := range parts { b.WriteString(p) }
    return b.String()
}
```
Preallocate/reuse only after allocation profiles or benchmark counts justify it; `sync.Pool` is not a general object cache.

## #97 — Not relying on inlining
**Rule:** Write small clear functions without manually destroying abstractions solely out of fear of call overhead.
**Why:** The compiler can inline many calls, and inlining decisions evolve by release; manual duplication can worsen code and even optimization opportunities.
**Apply:** Benchmark first and inspect compiler diagnostics for hot calls before reshaping APIs. Go 1.26 tooling can help modernize/analyze code.

### Examples
**Bad**
```go
// Duplicates a small helper everywhere because of assumed call overhead.
result := x*x + y*y
```
**Better**
```go
func square(v int) int { return v * v }
result := square(x) + square(y)
```
Let Go 1.26's compiler decide whether to inline; inspect diagnostics only when a measured hotspot warrants it.

## #98 — Not using Go diagnostics tooling
**Rule:** Use the Go toolchain's diagnostics before speculative tuning or debugging by intuition.
**Why:** CPU/heap profiles, execution traces, race detection, benchmarks, compiler diagnostics, `go vet`, and modernizers expose different classes of problems.
**Apply:** Match tool to hypothesis: `pprof` for hotspots/allocations, trace for scheduling/latency, race detector for executed races, benchmarks for changes, `go vet`/`go fix` for static modernization. See version notes.

### Examples
**Bad**
```text
"The service is slow, so let's add goroutines and sync.Pool everywhere."
```
**Better**
```sh
go test -bench=. -benchmem ./...
go test -race ./...
go tool pprof cpu.pprof
go tool trace trace.out
go vet ./...
go fix ./...
```
Select the tool that tests the current hypothesis rather than optimizing by intuition.

## #99 — Not understanding how the GC works
**Rule:** Optimize garbage-collection behavior through allocation rate, live-heap size, latency goals, and memory limits rather than folklore about collector internals.
**Why:** GC CPU/memory tradeoffs depend on workload reachability and runtime settings; Go 1.26 uses the Green Tea collector by default.
**Apply:** Profile live/allocated heap, set `GOMEMLIMIT` and `GOGC` from service constraints when needed, leave headroom, and validate latency/CPU under production-like load. See version notes.

### Examples
**Bad**
```sh
GOGC=off ./server
```
as a blanket latency optimization without a bounded heap strategy.

**Better**
```sh
GOMEMLIMIT=900MiB ./server
```
with workload-specific `GOGC`/memory-limit tuning only after observing allocation rate, live heap, GC CPU, and latency. Go 1.26 uses Green Tea GC by default.

## #100 — Go in Docker and Kubernetes
**Rule:** Treat container CPU and memory controls as runtime inputs and size Go runtime behavior to actual limits.
**Why:** CPU quotas can throttle parallel work and memory limits can turn GC/transient peaks into OOM kills; orchestration requests and limits have different effects.
**Apply:** On Go 1.26 rely on container-aware default `GOMAXPROCS` unless evidence calls for override; set/derive a sensible `GOMEMLIMIT`, leave non-heap headroom, profile under real quotas, and monitor throttling/OOM/GC metrics. See version notes.

### Examples
**Bad**
```yaml
resources:
  limits:
    cpu: "1"
    memory: "512Mi"
env:
  - name: GOMAXPROCS
    value: "64" # overrides Go's container-aware default
```
**Better (Go 1.26 baseline)**
```yaml
resources:
  requests:
    cpu: "500m"
    memory: "512Mi"
  limits:
    cpu: "1"
    memory: "1Gi"
```
Rely on the container-aware `GOMAXPROCS` default unless measurements justify an override, and set a deliberate `GOMEMLIMIT` with headroom when memory limits make that useful.
