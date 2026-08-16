# Rules 75-81 — Standard library

## #75 — Providing a wrong time duration
**Rule:** Make time units explicit when constructing `time.Duration` values.
**Why:** `time.Duration` is an integer nanosecond count; raw numeric configuration or conversions can silently use the wrong unit or overflow.
**Apply:** Multiply typed quantities by `time.Second`/other units, parse human input with `time.ParseDuration`, and define configuration units in the contract.

### Examples
**Bad**
```go
time.Sleep(1000) // 1000 nanoseconds, not 1000 milliseconds
```
**Better**
```go
time.Sleep(1000 * time.Millisecond)
// or simply:
time.Sleep(time.Second)
```

## #76 — `time.After` and memory leaks
**Rule:** On a Go 1.26 module, do not claim `time.After` inherently leaks because modern timers are garbage-collectable.
**Why:** Go 1.23 changed timer reachability/lifecycle behavior; the historical leak warning is no longer generally correct.
**Apply:** Use `time.After` for simple one-shot waits; use `NewTimer`/`NewTicker` when reset, cancellation, explicit ownership, or lifecycle control is needed. See version notes.

### Examples
The historical blanket claim that `time.After` leaks until the timer fires is outdated for normal Go 1.26 semantics: unreferenced timers can be garbage-collected.

**Bad when lifecycle control is required**
```go
for {
    select {
    case <-time.After(time.Minute):
        poll()
    case <-ctx.Done():
        return
    }
}
```
**Better when a reusable/cancellable timer is part of the design**
```go
t := time.NewTimer(time.Minute)
defer t.Stop()
for {
    select {
    case <-t.C:
        poll()
        t.Reset(time.Minute)
    case <-ctx.Done():
        return
    }
}
```
Prefer the simpler `time.After` when no reset/stop/ownership behavior is needed.

## #77 — JSON handling common mistakes
**Rule:** Treat JSON decoding/encoding as an API boundary with explicit schema, presence, number, unknown-field, and nil/empty semantics.
**Why:** Zero values can blur "missing" vs "present as zero", `any` numbers default to floating representation, unknown fields may pass silently, and unexported fields are ignored.
**Apply:** Use typed structs, pointer/optional fields when presence matters, `Decoder.UseNumber`/strict validation where needed, and define wire compatibility intentionally.

### Examples
**Bad**
```go
var v map[string]any
_ = json.Unmarshal(data, &v)
id := v["id"].(int64) // JSON numbers decode to float64 in this shape
```
**Better**
```go
type payload struct {
    ID int64 `json:"id"`
}
var v payload
if err := json.Unmarshal(data, &v); err != nil { return err }
```
Prefer typed decoding; use `Decoder.UseNumber` when dynamic numeric decoding is required.

## #78 — Common SQL mistakes
**Rule:** Use `database/sql` as a pooled concurrent abstraction and manage transactions/rows/errors explicitly.
**Why:** Treating `*sql.DB` as one connection, forgetting `Rows.Close`/`Rows.Err`, mishandling transactions, or concatenating SQL inputs can cause leaks, partial writes, and injection.
**Apply:** Reuse `*sql.DB`, parameterize queries, bound contexts/timeouts, close rows, check iteration errors, and commit/rollback exactly once.

### Examples
**Bad**
```go
db, _ := sql.Open("postgres", dsn)
rows, _ := db.QueryContext(ctx, query)
for rows.Next() { /* scan */ }
return nil // no Ping, no Close, no rows.Err
```
**Better**
```go
db, err := sql.Open("postgres", dsn)
if err != nil { return err }
if err := db.PingContext(ctx); err != nil { return err }
rows, err := db.QueryContext(ctx, query)
if err != nil { return err }
defer rows.Close()
for rows.Next() { /* scan */ }
return rows.Err()
```
Also configure pool limits and handle nullable columns deliberately.

## #79 — Not closing transient resources
**Rule:** Close owned resources such as HTTP response bodies, `sql.Rows`, and files on every path once acquisition succeeds.
**Why:** Leaked descriptors/connections exhaust pools and prevent HTTP connection reuse or timely resource release.
**Apply:** Establish ownership immediately; defer close at the correct scope and handle meaningful close errors. Do not close resources you do not own.

### Examples
**Bad**
```go
resp, err := client.Get(url)
if err != nil { return err }
b, err := io.ReadAll(resp.Body)
```
**Better**
```go
resp, err := client.Get(url)
if err != nil { return err }
defer resp.Body.Close()
b, err := io.ReadAll(resp.Body)
```
Apply the same ownership discipline to files, rows, response bodies, and similar resources.

## #80 — Forgetting `return` after replying to HTTP
**Rule:** After writing a terminal HTTP error/response, return unless intentionally continuing to write the same response.
**Why:** `http.Error` and `ResponseWriter.Write` do not stop handler execution; later logic can run with invalid state or write conflicting output.
**Apply:** Use guard clauses like `http.Error(...); return` and structure handlers around explicit terminal branches.

### Examples
**Bad**
```go
if err != nil {
    http.Error(w, "bad request", http.StatusBadRequest)
}
process(request) // continues after response error
```
**Better**
```go
if err != nil {
    http.Error(w, "bad request", http.StatusBadRequest)
    return
}
process(request)
```

## #81 — Using default HTTP client and server
**Rule:** For production network boundaries, configure client/server timeouts and transport behavior rather than relying blindly on permissive defaults.
**Why:** Unbounded waits and implicit defaults can consume connections/goroutines under slow or malicious peers.
**Apply:** Reuse configured clients/transports, set context/request deadlines and server read/write/idle/header limits appropriate to the protocol; keep `http.DefaultClient` only when its semantics are acceptable.

### Examples
**Bad**
```go
resp, err := http.Get(url) // no request-specific/client timeout policy
http.ListenAndServe(":8080", handler) // no server timeouts
```
**Better**
```go
client := &http.Client{Timeout: 5 * time.Second}
resp, err := client.Get(url)

srv := &http.Server{
    Addr:              ":8080",
    Handler:           handler,
    ReadHeaderTimeout: 5 * time.Second,
    IdleTimeout:       60 * time.Second,
}
err = srv.ListenAndServe()
```
Tune timeout values to the service rather than copying these numbers blindly.
