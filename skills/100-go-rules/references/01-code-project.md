# Rules 1-16 — Code and project organization

## #1 — Unintended variable shadowing
**Rule:** Avoid shadowing when it can hide the variable you intend to update or inspect.
**Why:** Inner declarations can silently create a different variable, especially around `err`, leaving outer state unchanged and confusing readers.
**Apply:** Prefer assignment when updating existing state; keep intentional shadowing narrow and obvious; let analyzers flag suspicious cases.

### Examples
**Bad**
```go
var err error
if retry {
    result, err := fetch() // new err; outer err is unchanged
    _ = result
}
return err
```
**Better**
```go
var err error
if retry {
    var result Result
    result, err = fetch()
    _ = result
}
return err
```

## #2 — Unnecessary nested code
**Rule:** Keep the happy path left-aligned with guard clauses and early returns.
**Why:** Deep nesting increases cognitive load and obscures the main flow.
**Apply:** Drop `else` after a branch that returns/continues/breaks, and reject invalid states early.

### Examples
**Bad**
```go
if user != nil {
    if user.Active {
        return serve(user)
    } else {
        return ErrInactive
    }
}
return ErrMissing
```
**Better**
```go
if user == nil {
    return ErrMissing
}
if !user.Active {
    return ErrInactive
}
return serve(user)
```

## #3 — Misusing init functions
**Rule:** Use `init` only for unavoidable package initialization with no meaningful failure/parameterization path.
**Why:** `init` cannot return errors, encourages hidden global state, and complicates tests and dependency control.
**Apply:** Prefer explicit constructors/setup functions; reserve `init` for small deterministic registration/static setup.

### Examples
**Bad**
```go
var db *sql.DB

func init() {
    db, _ = sql.Open("postgres", os.Getenv("DSN"))
}
```
**Better**
```go
func NewStore(dsn string) (*Store, error) {
    db, err := sql.Open("postgres", dsn)
    if err != nil {
        return nil, err
    }
    return &Store{db: db}, nil
}
```

## #4 — Overusing getters and setters
**Rule:** Do not mechanically wrap every field with getters/setters.
**Why:** Boilerplate does not improve encapsulation unless methods enforce invariants, hide representation, or preserve API compatibility.
**Apply:** Expose fields when appropriate; add methods when they provide behavior or protect future evolution.

### Examples
**Bad**
```go
type User struct{ name string }
func (u *User) GetName() string { return u.name }
func (u *User) SetName(v string) { u.name = v }
```
**Better**
```go
type User struct{ Name string }
```
Use methods only when they enforce behavior or an invariant:
```go
func (u *User) Rename(v string) error {
    if strings.TrimSpace(v) == "" { return ErrEmptyName }
    u.name = v
    return nil
}
```

## #5 — Interface pollution
**Rule:** Introduce interfaces for demonstrated abstraction needs, not speculative flexibility.
**Why:** Premature interfaces add indirection, methods, mocks, and dependency complexity without proven value.
**Apply:** Start concrete; extract the smallest useful interface when multiple implementations, substitution, or test seams are actually needed.

### Examples
**Bad**
```go
type UserRepository interface {
    Create(User) error
    Get(string) (User, error)
}

type PostgresUserRepository struct{ db *sql.DB }
```
**Better**
```go
type PostgresUserRepository struct{ db *sql.DB }

// Introduce an interface only at a real substitution boundary.
type userGetter interface {
    Get(string) (User, error)
}
```

## #6 — Interface on the producer side
**Rule:** Usually define an interface where it is consumed, not where a concrete implementation is produced.
**Why:** Consumer-owned interfaces express only required behavior and avoid forcing one abstraction on all clients.
**Apply:** Keep consumer interfaces minimal; producer-side interfaces are justified when the abstraction is a stable part of the producer API.

### Examples
**Bad**
```go
// package storage
type Store interface {
    Get(context.Context, string) ([]byte, error)
    Put(context.Context, string, []byte) error
    Delete(context.Context, string) error
}
func New() Store { return &postgresStore{} }
```
**Better**
```go
// package storage
func New() *PostgresStore { return &PostgresStore{} }

// package report (consumer)
type reader interface {
    Get(context.Context, string) ([]byte, error)
}
```

## #7 — Returning interfaces
**Rule:** Prefer returning concrete types and accepting narrow interfaces.
**Why:** Returning an interface can constrain clients to the producer's abstraction and hide useful concrete capabilities.
**Apply:** Return an interface only when abstraction itself is the contract or multiple implementations must be intentionally hidden.

### Examples
**Bad**
```go
func NewCache() Cache {
    return &memoryCache{}
}
```
**Better**
```go
func NewCache() *MemoryCache {
    return &MemoryCache{}
}
```
The caller can still define a narrow interface if it needs abstraction.

## #8 — `any` says nothing
**Rule:** Use `any` only when values are genuinely unconstrained.
**Why:** `any` discards type information and shifts mistakes from compile time to assertions/reflection/runtime logic.
**Apply:** Prefer concrete types, interfaces with behavior, or type parameters; keep `any` for generic serialization/formatting/dynamic boundaries.

### Examples
**Bad**
```go
func Add(a, b any) any {
    return a.(int) + b.(int)
}
```
**Better**
```go
func Add(a, b int) int {
    return a + b
}
```
Or use a type parameter when the operation truly spans a useful type set.

## #9 — Being confused about when to use generics
**Rule:** Use type parameters when one algorithm/data structure truly operates across a meaningful type set.
**Why:** Generics can remove duplication but premature constraints and parameterization create harder APIs and diagnostics.
**Apply:** Prefer ordinary functions/interfaces first; add generics when they reduce real duplication while preserving readable semantics.

### Examples
**Bad**
```go
func PrintOne[T any](v T) {
    fmt.Println(v)
}
```
**Better**
```go
func PrintOne(v any) {
    fmt.Println(v)
}
```
A generic type is useful when type relationships matter:
```go
func First[T any](s []T) (T, bool) {
    if len(s) == 0 { var zero T; return zero, false }
    return s[0], true
}
```

## #10 — Problems with type embedding
**Rule:** Embed types to promote intended behavior, not merely to shorten selectors.
**Why:** Embedding also promotes fields/methods and can accidentally expose implementation details or locking/state operations.
**Apply:** Use a named field when promotion is not part of the public contract; audit the promoted method set before exporting an embedding type.

### Examples
**Bad**
```go
type Cache struct {
    sync.Mutex // Lock and Unlock become part of Cache's promoted API
    data map[string]string
}
```
**Better**
```go
type Cache struct {
    mu   sync.Mutex
    data map[string]string
}
```

## #11 — Not using the functional options pattern
**Rule:** Consider functional options for constructors with many optional, evolving, or defaulted settings.
**Why:** Long positional parameter lists and config variants are brittle; options can preserve call-site clarity and API compatibility.
**Apply:** Keep required inputs explicit, validate options, and avoid the pattern when a simple config struct or a few parameters are clearer.

### Examples
**Bad**
```go
func NewServer(addr string, port int, tls bool, timeout time.Duration, logger *slog.Logger) *Server
```
**Better**
```go
type Option func(*options) error

func WithTimeout(d time.Duration) Option {
    return func(o *options) error {
        if d <= 0 { return ErrInvalidTimeout }
        o.timeout = d
        return nil
    }
}

func NewServer(addr string, opts ...Option) (*Server, error) { /* ... */ }
```

## #12 — Project misorganization
**Rule:** Organize packages around cohesive capabilities and dependency boundaries, not arbitrary technical layers or a universal folder template.
**Why:** Poor package boundaries create cycles, broad APIs, unstable dependencies, and difficulty locating ownership.
**Apply:** Keep packages focused, dependency direction clear, exported surface small, and structure proportional to project size.

### Examples
**Bad**
```text
/internal/controllers
/internal/services
/internal/repositories
/internal/utils
```
when every feature crosses all four packages and dependency ownership is unclear.

**Better**
```text
/internal/customer
/internal/billing
/internal/shipping
```
with small technical subpackages only where a real boundary exists.

## #13 — Creating utility packages
**Rule:** Avoid generic `util`, `common`, or `helpers` dumping grounds.
**Why:** They accumulate unrelated dependencies and hide the actual domain ownership of behavior.
**Apply:** Put helpers with the code/domain they support; extract a focused package only when it has a coherent, reusable purpose.

### Examples
**Bad**
```go
package utils
func NormalizeEmail(string) string
func Retry(context.Context, func() error) error
func ParseMoney(string) (Money, error)
```
**Better**
```go
package customer
func NormalizeEmail(string) string

package retry
func Do(context.Context, func() error) error
```
Keep behavior with its domain or give a reusable package a focused name.

## #14 — Ignoring package name collisions
**Rule:** Choose package names that remain clear and usable at call sites.
**Why:** Collisions force aliases, reduce readability, and can make common imports awkward.
**Apply:** Prefer short domain nouns, avoid redundant repository prefixes, and evaluate likely import combinations before publishing an API.

### Examples
**Bad**
```go
import (
    "acme/internal/http"
    "net/http"
)
```
**Better**
```go
import (
    "acme/internal/web"
    "net/http"
)
```
If a collision is unavoidable, use a meaningful import alias rather than a vague one.

## #15 — Missing code documentation
**Rule:** Document exported APIs and non-obvious invariants, contracts, ownership, concurrency, and failure behavior.
**Why:** Names alone cannot communicate every semantic constraint; stale or missing docs turn implementation details into tribal knowledge.
**Apply:** Write concise doc comments that explain what callers need to know, not line-by-line restatements of code.

### Examples
**Bad**
```go
// Get gets a thing.
func Get(ctx context.Context, id string) (User, error)
```
**Better**
```go
// Get returns the user identified by id.
// It returns ErrNotFound when no such user exists.
func Get(ctx context.Context, id string) (User, error)
```

## #16 — Not using linters
**Rule:** Automate static checks appropriate to the codebase instead of relying only on review memory.
**Why:** Compilers do not catch every correctness, style, security, or maintenance issue consistently.
**Apply:** At minimum use `go vet`; add targeted linters with low-noise rules, pin/configure them, and keep exceptions explicit.

### Examples
**Bad**
```sh
go test ./...
```
with no static-analysis step in CI.

**Better**
```sh
go test ./...
go vet ./...
```
Add pinned low-noise linters only when they provide value for the project.
