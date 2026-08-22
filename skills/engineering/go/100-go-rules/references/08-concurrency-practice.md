# Rules 61-74 — Concurrency practice

## #61 — Propagating an inappropriate context
**Rule:** Derive child contexts from the request/work context whose lifetime should govern the operation.
**Why:** Using `context.Background()` mid-call can detach cancellation/deadlines; using an already-short context for longer independent cleanup can cancel too early.
**Apply:** Propagate the incoming context by default; detach only deliberately with a clearly defined lifetime and bounded timeout.

### Examples
**Bad**
```go
func handle(w http.ResponseWriter, r *http.Request) {
    go persistAudit(r.Context(), event) // request cancellation kills detached work
}
```
**Better**
```go
func handle(w http.ResponseWriter, r *http.Request) {
    ctx, cancel := context.WithTimeout(context.WithoutCancel(r.Context()), 2*time.Second)
    go func() {
        defer cancel()
        _ = persistAudit(ctx, event)
    }()
}
```
Detach cancellation only when the work truly must outlive the request; still bound its lifetime.

## #62 — Starting a goroutine without knowing when to stop it
**Rule:** Every goroutine should have an explicit termination condition and an owner responsible for its lifecycle.
**Why:** Blocked or orphaned goroutines retain memory/resources and can outlive requests, tests, or components.
**Apply:** Define cancellation, channel closure, bounded work, or process-lifetime ownership before launching; test shutdown paths.

### Examples
**Bad**
```go
func Start() {
    go func() {
        for { refresh() }
    }()
}
```
**Better**
```go
func Run(ctx context.Context) {
    for {
        select {
        case <-ctx.Done():
            return
        case <-time.After(time.Second):
            refresh()
        }
    }
}
```
Every long-lived goroutine should have an owner and a termination path.

## #63 — Goroutines and loop variables
**Rule:** Under Go 1.22+ loop semantics, do not report the classic closure-capture bug for loop-declared variables unless older semantics or assignment to pre-existing variables applies.
**Why:** Modern Go creates per-iteration variables for loop declarations, removing the historical shared-variable trap.
**Apply:** Check the module language version and loop form; still reason about pointer-to-copy issues and data shared by the values themselves. See version notes.

### Examples
In ordinary Go 1.26 modules, variables declared by `range` have per-iteration scope. Do **not** teach the old capture workaround as universally required.

**Bad in Go 1.26 when reusing a pre-existing variable**
```go
var u User
for _, u = range users { // assignment reuses u
    go func() { process(u) }()
}
```
**Better**
```go
for _, u := range users { // per-iteration variable in modern Go
    go func() { process(u) }()
}
```
Also see #32 for `&rangeValue` pointing to a copy rather than the collection element.

## #64 — Expecting deterministic behavior from `select`
**Rule:** Do not rely on source order when multiple `select` cases are simultaneously ready.
**Why:** Go pseudo-randomly chooses among ready cases to avoid deterministic priority.
**Apply:** Encode priority/state explicitly if correctness depends on ordering; test nondeterministic schedules.

### Examples
**Bad**
```go
select {
case <-a:
    handleA()
case <-b:
    handleB()
}
// assumes A wins when both are ready
```
**Better**
```go
// Encode priority/order explicitly if the requirement needs it.
select {
case <-priority:
    handlePriority()
default:
    select {
    case <-priority:
        handlePriority()
    case <-normal:
        handleNormal()
    }
}
```
Do not rely on source order for selection among simultaneously ready cases.

## #65 — Not using notification channels
**Rule:** For one-way events with no payload, use a signal-oriented channel shape and clear ownership.
**Why:** Inventing dummy values obscures that the event itself is the information.
**Apply:** Prefer `chan struct{}`/channel close for pure notification when it matches the lifecycle; document who sends/closes and whether the signal is one-shot or repeated.

### Examples
**Bad**
```go
done := make(chan bool)
go func() {
    work()
    done <- true
}()
<-done
```
**Better**
```go
done := make(chan struct{})
go func() {
    defer close(done)
    work()
}()
<-done
```
Use `chan struct{}` when only a signal is needed.

## #66 — Not using nil channels
**Rule:** Use nil channel semantics deliberately to disable `select` cases when dynamic state warrants it.
**Why:** Send/receive on a nil channel blocks forever, which can cleanly remove a case from selection but can also deadlock if accidental.
**Apply:** Assign a channel variable to nil only in clear select-state machines; never close a nil channel.

### Examples
**Bad**
```go
for {
    select {
    case v := <-in:
        if in == nil { /* special branching elsewhere */ }
        use(v)
    case out <- next:
    }
}
```
**Better**
```go
for in != nil || out != nil {
    select {
    case v, ok := <-in:
        if !ok { in = nil; continue }
        pending = v
    case out <- pending:
        out = nil // disable this case until re-enabled
    }
}
```
A nil channel disables its `select` case without extra booleans.

## #67 — Being puzzled about channel size
**Rule:** Choose channel capacity from required synchronization/backpressure semantics, not arbitrary "performance" numbers.
**Why:** Buffering changes when senders block and can hide overload while consuming memory; unbuffered channels couple handoff directly.
**Apply:** Start from ownership and queueing requirements; measure capacity under realistic load and bound queues intentionally.

### Examples
**Bad**
```go
jobs := make(chan Job, 1000000) // arbitrary buffer used as a "performance fix"
```
**Better**
```go
jobs := make(chan Job, workers) // size follows an explicit backpressure model
```
Choose capacity from producer/consumer behavior, burst tolerance, memory, and backpressure requirements; measure it.

## #68 — Side effects with string formatting
**Rule:** Treat formatting/logging as potentially executing user code via methods such as `String`, `Error`, or formatting hooks.
**Why:** Calling those methods while holding locks or in sensitive concurrent sections can re-enter code, block, or deadlock.
**Apply:** Copy needed state under lock, release the lock, then format/log; avoid invoking unknown callbacks while holding synchronization primitives.

### Examples
**Bad**
```go
func (s *State) String() string {
    s.mu.Lock()
    defer s.mu.Unlock()
    return fmt.Sprintf("state=%v", s) // recursively calls String while lock is held
}
```
**Better**
```go
func (s *State) String() string {
    s.mu.Lock()
    v := s.value
    s.mu.Unlock()
    return fmt.Sprintf("state=%v", v)
}
```
Formatting can invoke `String`, `Error`, or `Format`; avoid hidden callbacks while holding locks.

## #69 — Creating data races with append
**Rule:** Do not concurrently mutate or append to the same slice/header/backing array without synchronization or ownership separation.
**Why:** `append` can mutate both the slice header and shared storage, and capacity-dependent reallocations make races subtle.
**Apply:** Partition independent storage, synchronize shared mutation, or have workers return results for a single owner to combine.

### Examples
**Bad**
```go
s := make([]int, 0, 100)
go func() { s = append(s, 1) }()
go func() { s = append(s, 2) }()
```
**Better**
```go
var mu sync.Mutex
s := make([]int, 0, 100)
appendSafe := func(v int) {
    mu.Lock()
    s = append(s, v)
    mu.Unlock()
}
go appendSafe(1)
go appendSafe(2)
```

## #70 — Using mutexes inaccurately with slices and maps
**Rule:** A lock protects the invariant and all shared reachable state, not merely the map/slice header access where it is acquired.
**Why:** Returning aliases or unlocking before callers finish using shared values can reintroduce races despite apparently locked lookup/update operations.
**Apply:** Define lock ownership, avoid leaking mutable aliases, copy data when crossing the lock boundary, and keep read/write locking consistent.

### Examples
**Bad**
```go
func (c *Cache) Values() []Value {
    c.mu.RLock()
    defer c.mu.RUnlock()
    return c.values // caller mutates shared backing array after unlock
}
```
**Better**
```go
func (c *Cache) Values() []Value {
    c.mu.RLock()
    defer c.mu.RUnlock()
    return slices.Clone(c.values)
}
```
Protect ownership, not just the moment a slice/map header is read.

## #71 — Misusing `sync.WaitGroup`
**Rule:** Register work before it can complete/wait, and pair every registered task with exactly one completion.
**Why:** Misordered `Add`, missing `Done`, or reuse across overlapping waits can panic, race, or deadlock.
**Apply:** On Go 1.25+, prefer `wg.Go(f)` for straightforward child goroutines; otherwise call `Add` before launching and `defer Done` inside. See version notes.

### Examples
**Bad**
```go
var wg sync.WaitGroup
go func() {
    wg.Add(1) // can race with Wait
    defer wg.Done()
    work()
}()
wg.Wait()
```
**Better (Go 1.26)**
```go
var wg sync.WaitGroup
wg.Go(work)
wg.Wait()
```
For patterns that need explicit `Add`, call it before starting the goroutine.

## #72 — Forgetting about `sync.Cond`
**Rule:** Consider `sync.Cond` when many goroutines wait for a predicate over shared state and channels would awkwardly model repeated state changes.
**Why:** Polling wastes resources; one-shot channels are not always a natural fit for broadcast/state-condition coordination.
**Apply:** Hold the associated lock while checking the predicate, wait in a loop, and use `Signal`/`Broadcast` only after updating relevant state.

### Examples
**Bad**
```go
for !ready() {
    time.Sleep(10 * time.Millisecond) // polling
}
```
**Better**
```go
mu.Lock()
for !ready() {
    cond.Wait()
}
mu.Unlock()
```
Use `sync.Cond` when many goroutines wait for a state predicate and channel semantics would be awkward.

## #73 — Not using `errgroup`
**Rule:** For a bounded group of related goroutines that should aggregate failure/cancellation, prefer structured coordination such as `errgroup` over ad-hoc channels/WaitGroups.
**Why:** Manual fan-out often forgets error propagation, cancellation, or waiting for every child.
**Apply:** Derive a group with context when sibling cancellation is desired; set a concurrency limit when the workload must be bounded.

### Examples
**Bad**
```go
var wg sync.WaitGroup
var firstErr error // also needs synchronization
for _, u := range urls {
    u := u
    wg.Go(func() { firstErr = fetch(ctx, u) })
}
wg.Wait()
return firstErr
```
**Better**
```go
g, ctx := errgroup.WithContext(ctx)
for _, u := range urls {
    g.Go(func() error { return fetch(ctx, u) })
}
return g.Wait()
```
Use `errgroup` when a group of goroutines shares cancellation and error propagation.

## #74 — Copying a sync type
**Rule:** Do not copy values containing synchronization primitives after first use.
**Why:** Copying `Mutex`, `RWMutex`, `WaitGroup`, `Once`, atomic wrappers, or structs containing them creates independent internal state protecting shared data incorrectly.
**Apply:** Use pointer receivers/addresses for non-copyable state and let `go vet`/copylocks-style checks catch accidental copies.

### Examples
**Bad**
```go
type Counter struct {
    mu sync.Mutex
    n  int
}
func (c Counter) Inc() { // copies the mutex
    c.mu.Lock()
    defer c.mu.Unlock()
    c.n++
}
```
**Better**
```go
func (c *Counter) Inc() {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.n++
}
```
Do not copy values containing mutexes, `Once`, `WaitGroup`, atomics, or other no-copy synchronization state after first use.
