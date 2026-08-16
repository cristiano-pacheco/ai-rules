# Rules 30-35 — Control structures

## #30 — Ignoring that elements are copied in range loops
**Rule:** Remember that the value variable in `for _, v := range xs` receives a copy of each element.
**Why:** Mutating `v` does not mutate the original element for value types/structs.
**Apply:** Iterate by index (`&xs[i]` / `xs[i].Field = ...`) when changing slice/array elements in place.

### Examples
**Bad**
```go
for _, u := range users {
    u.Active = true // modifies the copy
}
```
**Better**
```go
for i := range users {
    users[i].Active = true
}
```

## #31 — Ignoring how arguments are evaluated in range loops
**Rule:** Understand when a range expression is evaluated and whether it ranges over a copy or a live source.
**Why:** Array range expressions may involve copying, while channels and other range forms have different evaluation/lifetime semantics.
**Apply:** Avoid relying on mutation of a ranged array value to affect the iteration; make the intended source and ownership explicit. See version notes for modern range forms.

### Examples
**Bad**
```go
a := [3]int{1, 2, 3}
for i, v := range a { // array expression is copied for iteration
    a[i] = 0
    fmt.Println(v)
}
```
**Better**
```go
a := [3]int{1, 2, 3}
for i := range &a {
    a[i] = 0
    fmt.Println(a[i])
}
```
Choose array, pointer-to-array, slice, or channel iteration intentionally. Go 1.26 retains the relevant range-expression semantics.

## #32 — Pointer elements in range loops
**Rule:** Do not take the address of a ranged value when you need the address of the underlying slice/array element.
**Why:** The range value is a per-iteration copy; its address is not `&xs[i]` even under modern loop-variable semantics.
**Apply:** Iterate by index and take `&xs[i]`; separately account for pre-Go-1.22 loop-variable lifetime if supporting older language versions.

### Examples
**Bad**
```go
users := []User{{ID: 1}, {ID: 2}}
var ptrs []*User
for _, u := range users {
    ptrs = append(ptrs, &u) // pointers refer to loop copies, not slice elements
}
```
**Better**
```go
var ptrs []*User
for i := range users {
    ptrs = append(ptrs, &users[i])
}
```
In Go 1.26, per-iteration variables fix the old shared-loop-variable capture bug, but `&u` still points to a copy rather than `users[i]`.

## #33 — Wrong assumptions during map iteration
**Rule:** Treat map iteration order as unspecified and do not design correctness around entries inserted during the same iteration.
**Why:** Order can vary, and newly inserted entries may or may not be visited.
**Apply:** Sort keys for deterministic processing; stage mutations when the iteration set must be stable.

### Examples
**Bad**
```go
for k := range m {
    fmt.Println(k) // assumes stable order
}
```
**Better**
```go
keys := slices.Collect(maps.Keys(m))
slices.Sort(keys)
for _, k := range keys {
    fmt.Println(k)
}
```
Do not rely on iteration order; define deterministic order explicitly when required.

## #34 — Ignoring how `break` works
**Rule:** Be explicit about which construct a `break` exits.
**Why:** An unlabeled `break` exits only the innermost `for`, `switch`, or `select`, which can leave an outer loop running unexpectedly.
**Apply:** Use labeled breaks/returns when exiting an outer construct, and keep control flow simple enough that labels remain obvious.

### Examples
**Bad**
```go
for _, row := range rows {
    switch row.Kind {
    case Stop:
        break // breaks switch, not the for loop
    }
    process(row)
}
```
**Better**
```go
outer:
for _, row := range rows {
    switch row.Kind {
    case Stop:
        break outer
    }
    process(row)
}
```

## #35 — Using defer inside a loop
**Rule:** Do not accumulate deferred cleanup unintentionally across a long-running loop.
**Why:** `defer` runs when the surrounding function returns, not at the end of each loop iteration.
**Apply:** Move per-iteration work into a helper function so defer scopes to one iteration, or perform explicit cleanup when safe.

### Examples
**Bad**
```go
for _, name := range files {
    f, err := os.Open(name)
    if err != nil { return err }
    defer f.Close() // all files stay open until the outer function returns
    consume(f)
}
```
**Better**
```go
for _, name := range files {
    if err := func() error {
        f, err := os.Open(name)
        if err != nil { return err }
        defer f.Close()
        return consume(f)
    }(); err != nil {
        return err
    }
}
```
