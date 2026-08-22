# Rules 55-60 — Concurrency foundations

## #55 — Mixing up concurrency and parallelism
**Rule:** Separate program structure that handles multiple tasks concurrently from actual simultaneous execution on multiple CPUs.
**Why:** Concurrency can improve responsiveness/composition without parallel speedup; parallelism depends on runnable work and CPU resources.
**Apply:** Design concurrency for coordination first, then measure whether parallel execution benefits the workload.

### Examples
**Bad**
```go
for _, job := range jobs {
    go compute(job) // assumes goroutines imply CPU parallel speedup
}
```
**Better**
```go
workers := max(1, min(runtime.GOMAXPROCS(0), len(jobs)))
runWorkerPool(workers, jobs)
```
Model coordination (concurrency) separately from how much CPU work can run in parallel.

## #56 — Thinking concurrency is always faster
**Rule:** Do not add goroutines expecting automatic speedups.
**Why:** Scheduling, synchronization, allocation, cache effects, and small task sizes can make concurrent code slower.
**Apply:** Benchmark representative workloads; parallelize only independent work large enough to amortize overhead.

### Examples
**Bad**
```go
func square(xs []int) []int {
    var wg sync.WaitGroup
    for i := range xs {
        wg.Go(func() { xs[i] *= xs[i] }) // goroutine overhead for tiny work
    }
    wg.Wait()
    return xs
}
```
**Better**
```go
func square(xs []int) []int {
    for i := range xs { xs[i] *= xs[i] }
    return xs
}
```
Benchmark before adding concurrency for performance.

## #57 — When to use channels or mutexes
**Rule:** Use channels primarily to transfer ownership/events/work; use mutexes to protect shared in-memory state.
**Why:** Forcing one primitive into every problem increases complexity and contention.
**Apply:** Choose the primitive that directly models the coordination; combine them when each has a clear role.

### Examples
**Bad**
```go
type Cache struct {
    updates chan update // a whole goroutine protocol just to guard a map
}
```
**Better**
```go
type Cache struct {
    mu sync.RWMutex
    m  map[string]Value
}
```
Use a mutex for shared-memory ownership; use channels when transferring work/ownership or coordinating streams is the clearer model.

## #58 — Not understanding race problems
**Rule:** Distinguish data races from higher-level race conditions and satisfy the Go memory model's synchronization requirements.
**Why:** Race-free code can still have timing-dependent logic bugs, while unsynchronized conflicting memory access is invalid regardless of observed tests.
**Apply:** Run the race detector and reason separately about invariants/order; establish happens-before edges with appropriate synchronization.

### Examples
**Bad**
```go
var n int
go func() { n++ }()
go func() { n++ }() // data race
```
**Better**
```go
var n atomic.Int64
go func() { n.Add(1) }()
go func() { n.Add(1) }()
```
A race condition can also exist without a data race; synchronization must preserve the required higher-level ordering/invariant.

## #59 — Concurrency impacts of workload type
**Rule:** Match concurrency level to whether work is CPU-bound, I/O-bound, blocking, or mixed.
**Why:** CPU-bound tasks saturate finite processors; I/O-bound tasks may benefit from more concurrency while waiting.
**Apply:** Bound parallel CPU work; use backpressure/limits for I/O concurrency to protect dependencies and memory.

### Examples
**Bad**
```go
for _, req := range requests {
    go cpuHeavy(req) // unbounded CPU-bound fan-out
}
```
**Better**
```go
limit := runtime.GOMAXPROCS(0)
sem := make(chan struct{}, limit)
for _, req := range requests {
    sem <- struct{}{}
    go func(req Request) {
        defer func() { <-sem }()
        cpuHeavy(req)
    }(req)
}
```
CPU-bound and I/O-bound work need different concurrency limits; measure the workload.

## #60 — Misunderstanding Go contexts
**Rule:** Use `context.Context` for request-scoped cancellation, deadlines, and small cross-boundary metadata.
**Why:** Context is not a general dependency bag or optional-parameter mechanism, and cancellation only works when propagated/observed.
**Apply:** Pass context explicitly as the first parameter, do not store it in structs by default, propagate cancellation, and keep values request-scoped.

### Examples
**Bad**
```go
func Load(ctx context.Context, id string) error {
    _ = ctx
    return db.QueryRow("SELECT ...") // cancellation is not propagated
}
```
**Better**
```go
func Load(ctx context.Context, id string) error {
    return db.QueryRowContext(ctx, "SELECT ...", id).Err()
}
```
Use context for cancellation/deadlines/request-scoped values, not as a general parameter bag.
