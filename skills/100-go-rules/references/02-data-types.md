# Rules 17-29 — Data types

## #17 — Creating confusion with octal literals
**Rule:** Write integer literals so their base is explicit and unambiguous.
**Why:** Legacy-looking leading-zero forms are easy to misread and can represent octal rather than decimal intent.
**Apply:** Prefer modern prefixes such as `0o` for octal and separators where they improve readability.

### Examples
**Bad**
```go
const mode = 0755
```
**Better**
```go
const mode = 0o755
```

## #18 — Neglecting integer overflows
**Rule:** Treat integer conversion and arithmetic overflow as part of input validation and algorithm design.
**Why:** Fixed-width integer operations can wrap/truncate without producing an error, especially across narrower or signed/unsigned types.
**Apply:** Validate bounds before conversions/arithmetic when values may approach limits; use suitable widths and checked logic where correctness depends on range.

### Examples
**Bad**
```go
func toUint32(n uint64) uint32 {
    return uint32(n) // truncates high bits
}
```
**Better**
```go
func toUint32(n uint64) (uint32, error) {
    if n > math.MaxUint32 { return 0, ErrOverflow }
    return uint32(n), nil
}
```

## #19 — Not understanding floating-points
**Rule:** Do not assume binary floating-point exactly represents decimal values or associative arithmetic.
**Why:** Rounding error makes direct equality and reordered calculations surprising.
**Apply:** Compare with domain-appropriate tolerances, choose decimal/fixed-point representations for exact monetary-style requirements, and avoid unstable accumulation patterns.

### Examples
**Bad**
```go
if 0.1+0.2 == 0.3 {
    // assume exact decimal arithmetic
}
```
**Better**
```go
func closeEnough(a, b, eps float64) bool {
    return math.Abs(a-b) <= eps
}
```
For exact decimal business values, use an exact representation such as integer minor units.

## #20 — Not understanding slice length and capacity
**Rule:** Distinguish slice length from capacity and remember that a slice is a view over a backing array.
**Why:** Reslicing and append behavior depend on capacity; multiple slices may share storage and mutations.
**Apply:** Reason about `len`, `cap`, ownership, and whether `append` can mutate shared backing storage.

### Examples
**Bad**
```go
base := []int{1, 2, 3, 4}
a := base[:2]
a = append(a, 99) // overwrites base[2] because capacity is shared
```
**Better**
```go
base := []int{1, 2, 3, 4}
a := base[:2:2] // cap-limited view
a = append(a, 99) // forces independent backing storage
```

## #21 — Inefficient slice initialization
**Rule:** Pre-size slices according to whether the final length is known or only an upper-bound capacity is known.
**Why:** Repeated growth allocates/copies; confusing length with capacity can also create unwanted zero elements.
**Apply:** Use `make([]T, n)` when filling by index, or `make([]T, 0, n)` when appending up to an expected size.

### Examples
**Bad**
```go
out := make([]Item, n)
for _, v := range in {
    out = append(out, transform(v)) // leaves n zero values first
}
```
**Better**
```go
out := make([]Item, 0, n)
for _, v := range in {
    out = append(out, transform(v))
}
```
If filling by index, use `make([]Item, n)` and assign `out[i]`.

## #22 — Being confused about nil vs. empty slice
**Rule:** Treat nil and empty slices as equivalent only when the external contract permits it.
**Why:** Both have length zero, but serialization, reflection, APIs, and tests can distinguish them.
**Apply:** Prefer nil as the natural zero value internally; deliberately normalize when wire/API semantics require `[]` instead of `null` or vice versa.

### Examples
**Bad**
```go
func Tags() []string {
    return []string{} // chosen accidentally even though nil is fine internally
}
```
**Better**
```go
func Tags() []string {
    return nil // natural zero value when contract does not distinguish
}
```
At JSON/API boundaries, normalize deliberately if `null` vs `[]` matters.

## #23 — Not properly checking if a slice is empty
**Rule:** Check emptiness with `len(s) == 0`, not `s == nil`.
**Why:** A non-nil empty slice has zero elements just like a nil slice.
**Apply:** Test nilness only when the distinction itself is meaningful to the contract.

### Examples
**Bad**
```go
if s == nil {
    return ErrEmpty
}
```
**Better**
```go
if len(s) == 0 {
    return ErrEmpty
}
```

## #24 — Not making slice copies correctly
**Rule:** Allocate independent destination storage when an actual slice copy is required.
**Why:** Simple assignment copies only the slice header, so both slices still reference the same backing array.
**Apply:** Use `copy` into appropriately sized storage or an idiomatic cloning operation; verify nested/reference elements if deep independence is required.

### Examples
**Bad**
```go
copyOf := original
copyOf[0] = 99 // also changes original[0]
```
**Better**
```go
copyOf := slices.Clone(original)
copyOf[0] = 99
```

## #25 — Unexpected side effects using slice append
**Rule:** Assume `append` may reuse existing capacity and mutate storage visible through aliases.
**Why:** Whether append allocates a new backing array depends on capacity, so aliasing bugs can be data-dependent.
**Apply:** Establish ownership; clone or cap-limit a subslice before appending when mutation must not affect another view.

### Examples
**Bad**
```go
func addHeader(buf []byte) []byte {
    return append(buf, '\n') // may mutate caller-owned backing array
}
```
**Better**
```go
func addHeader(buf []byte) []byte {
    out := slices.Clone(buf)
    return append(out, '\n')
}
```
Clone only when ownership requires independence.

## #26 — Slices and memory leaks
**Rule:** Avoid retaining a large backing array or large pointed-to objects through a tiny live slice.
**Why:** Reachability through the slice keeps underlying storage/elements alive even when most data is no longer needed.
**Apply:** Copy the small retained portion into right-sized storage; clear discarded pointer slots when long-lived backing arrays would otherwise retain objects.

### Examples
**Bad**
```go
func token(big []byte) []byte {
    return big[:16] // keeps the entire backing array reachable
}
```
**Better**
```go
func token(big []byte) []byte {
    return bytes.Clone(big[:16])
}
```

## #27 — Inefficient map initialization
**Rule:** Give `make(map[K]V, n)` a useful size hint when cardinality is reasonably known.
**Why:** Avoidable growth and rehashing increase allocation and CPU cost.
**Apply:** Pre-size from reliable estimates, but do not over-allocate huge maps based on untrusted or highly uncertain input.

### Examples
**Bad**
```go
m := map[string]int{}
for _, v := range values {
    m[v.Key] = v.Count
}
```
**Better**
```go
m := make(map[string]int, len(values))
for _, v := range values {
    m[v.Key] = v.Count
}
```
Use a size hint when a reasonable count is known.

## #28 — Maps and memory leaks
**Rule:** Do not assume deleting map entries necessarily returns all allocated map storage to the OS or shrinks internal capacity.
**Why:** Map implementation retains internal structures for reuse, and pointer-heavy values may dominate retained memory.
**Apply:** Rebuild/replace a long-lived map after major shrinkage when profiling shows retention; keep guidance semantic because map internals can change across Go releases.

### Examples
**Bad**
```go
type Cache struct {
    items map[string][1 << 20]byte
}
// Repeated delete/insert churn is assumed to return all map storage immediately.
```
**Better**
```go
// Rebuild when profiling shows retained map capacity is material.
fresh := make(map[string][1 << 20]byte, len(cache.items))
for k, v := range cache.items {
    fresh[k] = v
}
cache.items = fresh
```
Do this only from measured memory pressure, not as routine churn.

## #29 — Comparing values incorrectly
**Rule:** Use comparison mechanisms that match the type's semantics.
**Why:** Some values are not directly comparable; `reflect.DeepEqual` can encode surprising nil/empty or unexported-field semantics and is often too broad.
**Apply:** Prefer `==` for comparable domain values, `slices`/`maps` helpers where suitable, or explicit/domain-specific equality for semantic comparisons.

### Examples
**Bad**
```go
if reflect.DeepEqual(got, want) { /* ... */ }
```
when nil-vs-empty or unexported/internal representation is not part of the contract.

**Better**
```go
if slices.Equal(got, want) { /* ... */ }
```
Use type-specific equality (`==`, `slices.Equal`, `maps.Equal`, or domain comparison) that matches semantic intent.
