---
name: go-usecase
description: Generate Go use cases for modular architecture using ports-based dependencies and decorator-based observability. Use when implementing business actions in internal/modules/<module>/usecase/ such as create, update, list, delete, status transitions, uploads, notifications, or any domain operation that orchestrates repositories/services.
---

# Go UseCase

Generate a use case that depends on ports (interfaces), not concrete implementations.

## Create the file

Create one file per operation in:
`internal/modules/<module>/usecase/<operation>_usecase.go`

Use:
- package: `usecase`
- struct name: `<Operation>UseCase`
- method name: `Execute`

**Only `_usecase.go` files belong in this package.** Mappers, utility helpers, and standalone functions do not belong here — put them in `mapper/`, `service/`, or the appropriate package. Never add package-level variables; all dependencies must be injected via the constructor.

## Naming (CRITICAL)

Apply consistent naming for every use case.

Rules:
- file: `<operation>_usecase.go`
- input DTO: `<Operation>Input`
- output DTO: `<Operation>Output`
- use case struct: `<Operation>UseCase`
- constructor: `New<Operation>UseCase`

Example (`contact_create`):
- file: `contact_create_usecase.go`
- input: `ContactCreateInput`
- output: `ContactCreateOutput`
- struct: `ContactCreateUseCase`
- constructor: `NewContactCreateUseCase`

Example (`contact_list`, no real input):
- file: `contact_list_usecase.go`
- input: `ContactListInput` (empty struct)
- output: `ContactListOutput`
- struct: `ContactListUseCase`
- constructor: `NewContactListUseCase`

## Follow the structure (CRITICAL)

Implement this order in the file:
1. Input struct (ALWAYS present; can be empty)
2. Output struct (ALWAYS present; can be empty)
3. Use case struct with dependencies
4. Constructor `New<Operation>UseCase`
5. Public `Execute` method (contains all business logic)

## Current architecture rule

Use cases contain business logic only.

Do NOT include in usecases:
- logger dependencies
- metrics dependencies
- tracing code
- private `execute` method wrappers

Observability and error translation are handled by `ucdecorator` in Fx wiring.

## Use this template

```go
package usecase

import (
	"context"

	"github.com/cristiano-pacheco/bricks/pkg/validator"
	"github.com/cristiano-pacheco/catzi/internal/modules/<module>/ports"
)

type <Operation>Input struct {
	Field string `validate:"required,max=255"`
}

type <Operation>Output struct {
	Result string
}

type <Operation>UseCase struct {
	repo      ports.<Entity>Repository
	validator validator.Validator // include only if needed
}

func New<Operation>UseCase(
	repo ports.<Entity>Repository,
	validator validator.Validator,
) *<Operation>UseCase {
	return &<Operation>UseCase{
		repo:      repo,
		validator: validator,
	}
}

func (uc *<Operation>UseCase) Execute(ctx context.Context, input <Operation>Input) (<Operation>Output, error) {
	if err := uc.validator.Validate(input); err != nil {
		return <Operation>Output{}, err
	}

	// Add business orchestration here
	// - read/write via repositories
	// - call domain services
	// - map model to output DTO

	return <Operation>Output{}, nil
}
```

## Apply variants

### No-input use case

When no parameters are needed, still define an empty input:

```go
type ContactListInput struct{}
```

And keep the same contract:

```go
func (uc *ContactListUseCase) Execute(ctx context.Context, input ContactListInput) (ContactListOutput, error)
```

### No-output use case

When no result payload is needed, define an empty output:

```go
type ContactDeleteOutput struct{}
```

And return it:

```go
return ContactDeleteOutput{}, nil
```

### No-validation use case

When validation is not required, remove `validator.Validator` from dependencies and skip validation.

### Multi-dependency orchestration

Inject multiple ports as interfaces (repositories, caches, services) in the use case struct and constructor.

## Apply common patterns

### Check existing record before create

```go
import brickserrors "github.com/cristiano-pacheco/bricks/pkg/errs"

record, err := uc.repo.FindByX(ctx, input.Field)
if err != nil && !errors.Is(err, brickserrors.ErrRecordNotFound) {
	return <Operation>Output{}, err
}
if record.ID != 0 {
	return <Operation>Output{}, brickserrors.ErrAlreadyExists
}
```

### Convert enum from input

```go
enumVal, err := enum.NewTypeEnum(input.Type)
if err != nil {
	return <Operation>Output{}, err
}
// Assign to your model field
```

### Map list response

```go
items, err := uc.repo.FindAll(ctx)
if err != nil {
	return <Operation>Output{}, err
}

output := <Operation>Output{
	Items: make([]ItemOutput, len(items)),
}
for i, item := range items {
	output.Items[i] = ItemOutput{ID: item.ID, Name: item.Name}
}
return output, nil
```

---

## Common Mistakes to Avoid

These patterns were found in production code and must never appear in a usecase.

---

### 1. Non-usecase files in the usecase package

Only `_usecase.go` files belong here. Never place mappers, helpers, or utility types in `usecase/`.

```go
// WRONG — a mapper type living in usecase/product_attributes_mapper.go
package usecase

type ProductAttributesMapper struct{}

var productAttributesMapper = NewProductAttributesMapper() // also a global!
```

```go
// RIGHT — mapper lives in mapper/, injected as a port
// internal/modules/catalog/mapper/product_attributes_mapper.go
```

---

### 2. Package-level global variables

Never declare `var` at the package level. All dependencies must be injected.

```go
// WRONG
var productAttributesMapper = NewProductAttributesMapper()
```

```go
// RIGHT — inject via constructor
type ProductCreateUseCase struct {
	attributesMapper ports.ProductAttributesMapper
}
```

---

### 3. ORM or infrastructure imports in a usecase

Usecases must only import `ports.*` interfaces and domain packages. If an error originates from GORM, the repository must wrap it into a domain error before it reaches the usecase.

```go
// WRONG — gorm leaks into usecase
import "gorm.io/gorm"

if errors.Is(err, gorm.ErrDuplicatedKey) { ... }
```

```go
// RIGHT — repository wraps the error; usecase checks a domain error
import brickserrs "github.com/cristiano-pacheco/bricks/pkg/errs"

if errors.Is(err, brickserrs.ErrAlreadyExists) { ... }
```

Same rule applies to: `os`, `sync`, `database/sql`, `net/http` (for status codes), and any driver-specific package.

---

### 4. Hardcoded magic strings and IDs as business rules

Business rules must not depend on raw string literals or database row IDs baked into code. Use enums, constants from a dedicated `constants/` package, or config.

```go
// WRONG — magic string and magic ID in business logic
const uncategorizedCategoryID uint64 = 1

switch categorySlug {
case "kits-para-banheiro":
    ...
}
```

```go
// RIGHT — use an enum or a constant package
import "github.com/cristiano-pacheco/catzi/internal/modules/catalog/constants"

if input.ID == constants.UncategorizedCategoryID { ... }

// or drive selection through a port/service, not a hardcoded slug
```

---

### 5. Infrastructure state in the usecase struct

A usecase struct must hold only injected ports. Never store in-memory caches, mutexes, sync primitives, or worker groups inside a usecase — these belong in a dedicated cache port or service.

```go
// WRONG — usecase owns an in-memory cache and concurrency primitives
type ProductQualityScoreUseCase struct {
	requestGroup    singleflight.Group
	recentResults   map[string]cachedResult
	recentResultsMu sync.Mutex
	recentResultTTL time.Duration
	...
}
```

```go
// RIGHT — delegate caching to a port, consistent with other usecases
type ProductQualityScoreUseCase struct {
	textGenerationCache aiports.TextGenerationCache // injected
	textGeneratorService aiports.TextGeneratorService
	...
}
```

---

### 6. Direct OS or filesystem calls

Never call `os.Stat`, `os.ReadFile`, `os.Remove`, etc. directly. Delegate to a storage port.

```go
// WRONG
zipFileInfo, err := os.Stat(zipFilePath)
```

```go
// RIGHT — the service/port returns what the usecase needs
zipResult, err := uc.zipPackagerService.Package(ctx, input)
// zipResult.FilePath, zipResult.FileSize already available
```

---

### 7. Duplicated private methods across usecase files

When multiple usecases in the same package share identical logic, extract it once — either into a shared private package in a dedicated file (if it's truly stateless and package-scoped), or into an injected service/port.

```go
// WRONG — buildCategoryVariable copy-pasted into 4 different usecase files
func (uc *ProductTitleGenerateUseCase) buildCategoryVariable(id *uint64) string { ... }
func (uc *ProductDescriptionGenerateUseCase) buildCategoryVariable(id *uint64) string { ... }
// ... repeated in 2 more files
```

```go
// RIGHT — extracted once, either as a package-level helper file in usecase/
// (e.g., usecase/helpers.go, no struct, only package-private functions)
// OR as a method on an injected service port
```

Similarly, `resolveCollection` was duplicated across 3 AI usecase files. If multiple usecases need the same orchestration step, it's a sign that step belongs in a shared service port.

---

### 8. `record.ID == 0` check after `FindByID`

`FindByID` must return `ErrRecordNotFound` when the record doesn't exist — that is the repository contract. Checking `ID == 0` after a successful `FindByID` call is a workaround for a broken contract and hides bugs.

```go
// WRONG — defensive zero-check leaks repository implementation detail
product, err := uc.productRepository.FindByID(ctx, input.ProductID)
if err != nil {
	return ProductOutput{}, err
}
if product.ID == 0 {
	return ProductOutput{}, brickserrs.ErrRecordNotFound
}
```

```go
// RIGHT — FindByID returns ErrRecordNotFound; trust the contract
product, err := uc.productRepository.FindByID(ctx, input.ProductID)
if err != nil {
	return ProductOutput{}, err // ErrRecordNotFound surfaces here
}
```

If the repository you're implementing doesn't do this, fix the repository — not the usecase.

---

### 9. In-memory membership or uniqueness checks

Never fetch all records from a repository just to check whether one specific record exists. Add the right query method to the repository port instead.

```go
// WRONG — loads all prompts to check for a name conflict
existingPrompts, err := uc.aiImagePromptRepository.FindAll(ctx)
for _, p := range existingPrompts {
	if strings.EqualFold(p.Name, input.Name) {
		return ..., errs.ErrNameConflict
	}
}
```

```go
// RIGHT — dedicated port method; O(1) query
_, err := uc.aiImagePromptRepository.FindByName(ctx, input.Name)
if err == nil {
	return ..., errs.ErrNameConflict
}
if !errors.Is(err, brickserrs.ErrRecordNotFound) {
	return ..., err
}
```

Same applies to membership checks — instead of loading a full collection to see if a product belongs to it, add `ExistsByCollectionAndProduct(ctx, collectionID, productID) (bool, error)` to the port.

---

### 10. N+1 query pattern

Never call a repository method inside a loop to fetch individual records. Use a batch/bulk repository method instead.

```go
// WRONG — one DB query per product
for _, productID := range input.ProductIDs {
	product, err := uc.productRepository.FindByID(ctx, productID) // N queries
	...
}
```

```go
// RIGHT — single query
products, err := uc.productRepository.FindByIDs(ctx, input.ProductIDs)
if err != nil {
	return ..., err
}
// validate products in memory
```

---

### 11. Tracing or logging inside a usecase

Observability (tracing, logging, metrics) is handled exclusively by the `ucdecorator` wrapper. Adding it inside a usecase creates inconsistency, duplicates work, and couples business logic to infrastructure.

```go
// WRONG — tracing and logging inside Execute
func (uc *MyUseCase) Execute(ctx context.Context, input MyInput) (MyOutput, error) {
	ctx, span := trace.Span(ctx, "MyUseCase.Execute")
	defer span.End()

	if err := doThing(); err != nil {
		uc.logger.Error("MyUseCase.Execute failed", logger.Error(err))
		return MyOutput{}, err
	}
	...
}
```

```go
// RIGHT — no tracing or logging in the usecase; decorator handles it
func (uc *MyUseCase) Execute(ctx context.Context, input MyInput) (MyOutput, error) {
	if err := uc.validator.Validate(input); err != nil {
		return MyOutput{}, err
	}
	// business logic only
	return MyOutput{}, nil
}
```

If you ever add a `trace.Span` call anywhere in a usecase, make sure to use the returned `ctx` — discarding it (`_, span := trace.Span(...)`) silently breaks trace propagation.

---

## Wire with Fx

Register raw usecases and decorate them via `ucdecorator`.

### Minimal provider example

```go
fx.Provide(
	usecase.New<Operation>UseCase,
)
```

### Decorator wiring pattern (recommended)

Use a consolidated provider (`fx.In` + `fx.Out`) and wrap usecases with:

```go
ucdecorator.Wrap(factory, rawUseCase)
```

`Wrap` infers:
- usecase name (e.g. `CategoryCreateUseCase.Execute`)
- metric name (e.g. `category_create`)

No need to pass metric/usecase name strings manually.

### Full module wiring pattern (single-file, `fx.In` + `fx.Out`)

Use this when the module has multiple usecases and you want less boilerplate in `fx.go`.

```go
type decorateIn struct {
	fx.In

	Factory *ucdecorator.Factory
	Create  *usecase.<Entity>CreateUseCase
	List    *usecase.<Entity>ListUseCase
}

type decorateOut struct {
	fx.Out

	Create ucdecorator.UseCase[usecase.<Entity>CreateInput, usecase.<Entity>CreateOutput]
	List   ucdecorator.UseCase[usecase.<Entity>ListInput, usecase.<Entity>ListOutput]
}

func provideDecoratedUseCases(in decorateIn) decorateOut {
	return decorateOut{
		Create: ucdecorator.Wrap(in.Factory, in.Create),
		List:   ucdecorator.Wrap(in.Factory, in.List),
	}
}

var Module = fx.Module(
	"<module>",
	fx.Provide(
		// repositories/services/validators
		// raw usecases
		usecase.New<Entity>CreateUseCase,
		usecase.New<Entity>ListUseCase,

		// decorated usecases
		provideDecoratedUseCases,

		// handlers/routers
	),
)
```

This keeps:
1. Raw constructors simple
2. Decoration centralized in one provider
3. Handler injection strongly typed via `ucdecorator.UseCase[Input, Output]`

## Enforce rules

1. **Only `_usecase.go` files in this package.** No mappers, helpers, or standalone utilities.
2. **No package-level variables.** All dependencies go through the constructor.
3. **No infrastructure imports.** Allowed: `ports.*`, domain enums/errs, `bricks/pkg/validator`, `bricks/pkg/errs`. Not allowed: `gorm.io/*`, `os`, `sync`, `database/sql`, driver packages.
4. **No hardcoded magic strings or IDs as business rules.** Use enums, `constant/` package, or config.
5. **No state in the usecase struct.** No maps, mutexes, singleflight groups, or in-memory caches — delegate to a cache port.
6. **No observability in usecases.** No `logger`, `trace.Span`, or metrics calls — all of these live in the `ucdecorator` wrapper.
7. **Trust the repository contract.** `FindByID` returns `ErrRecordNotFound` when not found. Never add `if record.ID == 0` as a guard after a successful `FindByID`.
8. **No in-memory collection scans.** To check existence or uniqueness, add `FindByName`, `FindByID`, or `ExistsByX` to the repository port.
9. **No N+1 queries.** Never call a repository method in a loop. Use batch methods (`FindByIDs`, etc.).
10. **No duplicated private methods across files.** If multiple usecases share the same logic, extract it to a shared service port or a single package-level helper file.
11. **No standalone functions when the file has a struct.** All private helpers must be methods on the use case struct.
12. **Depend only on `ports.*` interfaces.** Never bypass the ports layer.
13. **Keep orchestration in usecases; keep persistence in repositories.**
14. **Use a single public `Execute` method.** No private `execute` wrappers.
15. **Always define both Input and Output structs** (use empty struct when needed).
16. **Input/Output must NOT have `json` tags.** Use validation tags on Input only when needed.
17. **Return typed output DTOs.** Never leak persistence models.

## Final checklist

1. File is named `<operation>_usecase.go` and lives in `internal/modules/<module>/usecase/`.
2. Input and Output structs are defined (including empty structs when needed).
3. All dependencies are injected via constructor — no package-level vars.
4. `Execute` contains all business logic; no private `execute` wrapper exists.
5. No `gorm`, `os`, `sync`, `net/http` or other infra imports.
6. No hardcoded magic strings or IDs — enums or `constant/` package used instead.
7. No logger, tracer, or metrics inside the usecase struct or Execute.
8. `FindByID` is trusted to return `ErrRecordNotFound` — no `ID == 0` guard.
9. No repository calls inside loops (N+1) — batch methods used instead.
10. No in-memory scans to check uniqueness or membership — port has the right query method.
11. No logic duplicated from another usecase file — extracted to a service or shared helper.
12. Wired in Fx and decorated with `ucdecorator.Wrap(factory, raw)`.
13. Unit tests created with the `go-unit-tests` skill.
14. `make test` passes.
15. `make lint` passes.
16. `make nilaway` passes.