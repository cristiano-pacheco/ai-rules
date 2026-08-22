# Rules 36-41 — Strings

## #36 — Not understanding the concept of rune
**Rule:** Distinguish bytes, Unicode code points (`rune`), and user-perceived characters/grapheme clusters.
**Why:** Go strings are byte sequences (typically UTF-8), so one displayed character may span multiple bytes or code points.
**Apply:** Choose byte operations for protocols/binary text, rune operations for code points, and specialized Unicode segmentation when grapheme semantics matter.

### Examples
**Bad**
```go
s := "é"
fmt.Println(len(s)) // 2 bytes, not 1 character
```
**Better**
```go
fmt.Println(utf8.RuneCountInString("é")) // 1 rune
```
Choose bytes, runes, or user-perceived grapheme clusters according to the problem.

## #37 — Inaccurate string iteration
**Rule:** Choose iteration based on whether you need byte offsets/bytes or decoded runes.
**Why:** Indexing a string yields bytes; `range` decodes UTF-8 and reports byte offsets, not rune indices.
**Apply:** Use `for i := 0; i < len(s); i++` for bytes and `for i, r := range s` for runes; validate malformed UTF-8 when input contracts require it.

### Examples
**Bad**
```go
s := "café"
for i := 0; i < len(s); i++ {
    fmt.Printf("%c\n", s[i]) // iterates bytes
}
```
**Better**
```go
for _, r := range "café" {
    fmt.Printf("%c\n", r)
}
```

## #38 — Misusing trim functions
**Rule:** Match the trim API to exact semantic intent.
**Why:** Character-set trim functions remove any leading/trailing rune in the cutset, not a literal substring.
**Apply:** Use prefix/suffix functions for exact affixes and space/cutset functions only for their documented semantics.

### Examples
**Bad**
```go
s := strings.TrimRight("123oxo", "xo") // cutset semantics, not suffix removal
```
**Better**
```go
s := strings.TrimSuffix("123oxo", "xo")
```
Use `TrimPrefix`/`TrimSuffix` for exact affixes; trim-cutset functions remove any matching rune.

## #39 — Under-optimized string concatenation
**Rule:** Avoid repeated `+` growth in loops when building sizable strings.
**Why:** Repeated immutable string construction can cause many allocations and copies.
**Apply:** Use `strings.Builder` (and `Grow` when size is known) or `bytes.Buffer` when byte-oriented operations are needed; keep simple `+` for small fixed expressions.

### Examples
**Bad**
```go
var s string
for _, p := range parts {
    s += p
}
```
**Better**
```go
var b strings.Builder
for _, p := range parts {
    b.WriteString(p)
}
s := b.String()
```
For a small fixed number of pieces, plain `+` can remain clearer.

## #40 — Useless string conversions
**Rule:** Avoid gratuitous `string`↔`[]byte` conversions in hot paths.
**Why:** Conversions can allocate/copy and obscure the natural data representation expected by APIs.
**Apply:** Keep data in the representation used most often and use APIs accepting strings/bytes directly; verify allocation behavior before micro-optimizing.

### Examples
**Bad**
```go
if string(bytesValue) == expected {
    return true
}
```
**Better**
```go
if bytes.Equal(bytesValue, []byte(expected)) {
    return true
}
```
At hot boundaries, avoid repeated `string`/`[]byte` conversions when an API can work in the existing representation.

## #41 — Substring and memory leaks
**Rule:** Avoid retaining a tiny substring that keeps a very large source string alive.
**Why:** A substring can reference the original string data, extending its lifetime.
**Apply:** Clone/copy the retained substring when its lifetime greatly exceeds the large source and profiling or scale makes retention material.

### Examples
**Bad**
```go
func prefix(big string) string {
    return big[:16] // may retain the large backing string data
}
```
**Better**
```go
func prefix(big string) string {
    return strings.Clone(big[:16])
}
```
Clone only when retaining the tiny substring materially prolongs the life of a large string.
