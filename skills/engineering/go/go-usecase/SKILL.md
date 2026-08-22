---
name: go-usecase
description: Generate use cases. Use when creating business operations, CRUD use cases, or any Execute-based module operation.
---

# Go UseCase

Generate use case implementation for Go modular architecture.

## When to Use

- Create business operations with Execute pattern
- CRUD use cases for any module
- Operations requiring input validation and error handling
- Any domain logic orchestrating ports

## File Pattern

One file per operation: `internal/modules/<module>/usecase/<noun>_<action>_usecase.go`

Examples: `user_create_usecase.go`, `product_update_usecase.go`, `order_cancel_usecase.go`

## Naming Convention

Given noun `User` and action `Create`:

| Element | Name |
|---|---|
| File | `user_create_usecase.go` |
| Struct | `UserCreateUseCase` |
| Input | `UserCreateInput` |
| Output | `UserCreateOutput` |
| Constructor | `NewUserCreateUseCase` |
| Method | `Execute` |

Pattern: **NounAction** + `UseCase` for the struct. **NounAction** + `Input` / `Output` for DTOs.

## Structure

```go
package usecase

import (
	"context"

	"github.com/cristiano-pacheco/bricks/pkg/logger"
	"github.com/cristiano-pacheco/bricks/pkg/validator"
	"github.com/cristiano-pacheco/gomies/internal/modules/<module>/model"
	"github.com/cristiano-pacheco/gomies/internal/modules/<module>/ports"
)

type NounActionInput struct {
	FirstName string `validate:"required,min=3,max=255"`
	LastName  string `validate:"required,min=3,max=255"`
	Password  string `validate:"required,min=8"`
	Email     string `validate:"required,email,max=255"`
}

type NounActionOutput struct {
	FirstName string
	LastName  string
	Email     string
	UserID    uint64
}

type NounActionUseCase struct {
	userRepository ports.UserRepository
	validator      validator.Validator
	logger         logger.Logger
}

func NewNounActionUseCase(
	userRepository ports.UserRepository,
	validator validator.Validator,
	logger logger.Logger,
) *NounActionUseCase {
	return &NounActionUseCase{
		validator: validator,
		logger:    logger,
	}
}

func (uc *NounActionUseCase) Execute(ctx context.Context, input NounActionInput) (NounActionOutput, error) {
	err := uc.validator.Struct(input)
	if err != nil {
		uc.logger.Error("user creation validation failed", logger.Error(err))
		return NounActionOutput{}, err
	}

	userModel := model.UserModel{
		FirstName: input.FirstName,
		LastName:  input.LastName,
		Email:     input.Email,
		Password:  input.Password,
	}

	createdUser, err := uc.userRepository.Create(ctx, userModel)
	if err != nil {
		uc.logger.Error("user creation failed", logger.Error(err))
		return NounActionOutput{}, err
	}

	output := NounActionOutput{
		UserID:    createdUser.ID,
		FirstName: createdUser.FirstName,
		LastName:  createdUser.LastName,
		Email:     createdUser.Email,
	}

	return output, nil
}
```

## Execute Method Flow

1. **Validate input** — always first: `uc.validator.Struct(input)`
2. **Business logic** — repository calls, service calls, domain checks
3. **Log every error** before returning it
4. **Return typed errors** from `errs` package
5. **Map result** to Output struct and return

## Input Validation

Define constraints via `validate` struct tags on the Input struct. Call `uc.validator.Struct(input)` as the first line inside `Execute`. Return validation errors directly — the shared validator formats them.

Common tags: `required`, `min=N`, `max=N`, `email`, `oneof=val1 val2 val3`

## Error Handling

Every error from a repository, service, or external call MUST be logged before returning:

```go
entity, err := uc.entityRepository.FindByID(ctx, input.ID)
if err != nil {
	uc.logger.Error("error finding entity by id", logger.Error(err))
	return EntityGetOutput{}, err
}
```

For not-found checks where absence is expected (not a terminal error):

```go
entity, err := uc.entityRepository.FindByEmail(ctx, input.Email)
if err != nil && !errors.Is(err, bricserrs.ErrRecordNotFound) {
	uc.logger.Error("error finding entity by email", logger.Error(err))
	return EntityCreateOutput{}, err
}
if entity.ID != 0 {
	return EntityCreateOutput{}, errs.ErrEmailAlreadyInUse
}
```

Import for bricks errors: `bricserrs "github.com/cristiano-pacheco/bricks/errs"`

Return typed module errors from `errs` — never `errors.New(...)`.

## Dependencies

Every use case includes these shared dependencies:

- `validator.Validator` — input struct validation via tags
- `logger.Logger` — error logging


Never inject concrete types for module dependencies.

## Fx Wiring

In the module's `fx.go`, register raw constructors and a single `provideDecoratedUseCases` function that wraps them all.

### Single use case

```go
var Module = fx.Module(
	"<module-name>",
	fx.Provide(
		usecase.NewEntityCreateUseCase,
		provideDecoratedUseCases,
	),
)

type decorateUseCasesIn struct {
	fx.In
	UseCaseDecoratorFactory *ucdecorator.Factory
	EntityCreateUseCase     *usecase.EntityCreateUseCase
}

type decorateUseCasesOut struct {
	fx.Out
	EntityCreateUseCase ucdecorator.UseCase[usecase.EntityCreateInput, usecase.EntityCreateOutput]
}

func provideDecoratedUseCases(in decorateUseCasesIn) decorateUseCasesOut {
	return decorateUseCasesOut{
		EntityCreateUseCase: ucdecorator.Wrap(in.UseCaseDecoratorFactory, in.EntityCreateUseCase),
	}
}
```

## Anti-Patterns

### Missing input validation — BAD
```go
func (uc *UserCreateUseCase) Execute(ctx context.Context, input UserCreateInput) (UserCreateOutput, error) {
	// BAD: skipped uc.validator.Struct(input)
	user, err := uc.userRepository.Create(ctx, ...)
```

### Unlogged error — BAD
```go
// BAD
entity, err := uc.entityRepository.FindByID(ctx, input.ID)
if err != nil {
	return EntityGetOutput{}, err
}

// GOOD
entity, err := uc.entityRepository.FindByID(ctx, input.ID)
if err != nil {
	uc.logger.Error("error finding entity by id", logger.Error(err))
	return EntityGetOutput{}, err
}
```

### Raw errors — BAD
```go
// BAD
return UserCreateOutput{}, errors.New("email already in use")

// GOOD
return UserCreateOutput{}, errs.ErrEmailAlreadyInUse
```

### Tracing/metrics inside use case — BAD
```go
// BAD: observability belongs in ucdecorator
ctx, span := trace.Span(ctx, "UserCreateUseCase.Execute")
defer span.End()
```

### Concrete type injection — BAD
```go
// BAD
type UserCreateUseCase struct {
	userRepository *repository.UserRepository
}

// GOOD
type UserCreateUseCase struct {
	userRepository ports.UserRepository
}
```

### Wrong naming — BAD
```go
// BAD: Input/Output not following NounAction pattern
type CreateUserInput struct {}
type CreateUserOutput struct {}

// GOOD
type UserCreateInput struct {}
type UserCreateOutput struct {}
```

### Redundant comments — BAD
```go
// BAD
// Execute executes the user create use case.
func (uc *UserCreateUseCase) Execute(...) {}

// NewUserCreateUseCase creates a new UserCreateUseCase.
func NewUserCreateUseCase(...) *UserCreateUseCase {}
```

<critical>Every error must be logged.</critical>
<critical>
Each use case must define its own Input and Output types in its own use case file, and those boundary types must be self-contained.
</critical>
<critical>Input/Output MUST NOT embed or reference shared module DTOs/models</critical>
<critical>Input/Output MUST declare all fields explicitly, either directly or via nested structs declared in the same use case file.</critical>
<critital>Input/Output types are private to that use case contract and MUST NOT be reused by other use cases.</critical>
<critical>Shared shapes belong in repository/service/domain layers, not in use case boundary contracts.</critical>
<critical>Input/Output types must not have json tags</critical>

## Critical Rules

1. **Naming**: Struct `NounActionUseCase`, Input `NounActionInput`, Output `NounActionOutput`. No exceptions.
2. **Both Input and Output**: Always define both structs, even if empty.
3. **Validate first**: `uc.validator.Struct(input)` is always the first call in `Execute`.
4. **Log every error**: `uc.logger.Error(msg, logger.Error(err))` before every error return.
5. **Typed errors**: Return errors from module `errs` package — never `errors.New(...)`.
6. **No tracing/metrics**: Observability handled by `ucdecorator` externally.
7. **Port interfaces**: Module deps must be `ports.*` interfaces.
8. **Single Execute**: One public method `Execute(ctx context.Context, input Input) (Output, error)`.
9. **Constructor returns pointer**: `NewNounActionUseCase(...)` returns `*NounActionUseCase`.
10. **No standalone functions**: Logic in `Execute` or private methods only.
11. **No redundant comments**: Do not restate method/constructor names.
12. **Fx decoration**: Wrap with `ucdecorator.Wrap` via `fx.In`/`fx.Out` structs.

## Anti-pattern: Standalone functions

Standalone functions at the package level are forbidden when a struct with methods exists in the file. They pollute the package namespace, can collide with helpers in other service files, and fragment logic that belongs to the struct.

## Workflow

1. Create `usecase/<noun>_<action>_usecase.go`
2. Define Input (with validate tags), Output, struct, constructor, `Execute`
3. Add Fx wiring to module's `fx.go` (constructor + `provideDecoratedUseCases`)
4. Run `make lint` and `make nilaway` to verify the use case follows all patterns and has no nil pointer risks.
