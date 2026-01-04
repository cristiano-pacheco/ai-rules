# Go UseCase Pattern Rule

## Description
Generate Go UseCases for the Application Layer, following the established patterns in the codebase. UseCases encapsulate business logic and orchestrate interactions between domain entities and infrastructure services.

## Location & Naming

- **Directory**: `internal/modules/<module_name>/usecase` (e.g., `internal/modules/identity/usecase`)
- **Filename**: Must end with `_usecase.go` (e.g., `auth_login_usecase.go`), with the pattern [noun]_[verb]_usecase.go
- **Package**: `package usecase`
- **Naming Convention**: Use the pattern `[Noun][Verb]UseCase` (e.g., `UserCreateUseCase`, `AuthLoginUseCase`).

## Pattern

### 1. **Responsibility**
- **Application Layer**: UseCases reside in the Application Layer.
- **Orchestration**: They are the entry point for business operations.
- **Access Control**: Only UseCases should access Infrastructure Layer components (Repositories, Services, Producers, etc.).
- **Interfaces Only**: Access to these components must **always** be through interfaces (Ports), **never** concrete implementations.
- **Isolation**: UseCases should not depend on HTTP-specific types (like Fiber context or DTOs).

### 2. **Input & Output Structs**
- Define dedicated `Input` and `Output` structs for each UseCase.
- **Input**:
    - Contains all data required to execute the UseCase.
    - Uses `validate` tags for input validation.
- **Output**:
    - Contains the result of the operation.
    - Should be a struct (value), not a pointer.

### 3. **Struct Definition**
- Define a struct `XUseCase` (e.g., `AuthLoginUseCase`).
- Use dependency injection for all required services (Repositories, Validators, Loggers, etc.).

### 4. **Constructor**
- Implement `NewXUseCase` taking all dependencies as arguments.
- Return a pointer to the struct `*XUseCase`.

### 5. **Execute Method**
- **Single Responsibility**: The UseCase struct must have **only one public method** named `Execute`.
- **Signature**: `func (u *XUseCase) Execute(ctx context.Context, input Input) (Output, error)`
- **Context**: The first argument **must always** be `ctx context.Context`.
- **Tracing**: Start a span at the beginning:
  ```go
  ctx, span := trace.Span(ctx, "XUseCase.Execute")
  defer span.End()
  ```
- **Validation**: Validate the input struct immediately:
  ```go
  if err := u.validator.Struct(input); err != nil {
      return Output{}, err
  }
  ```
- **Logic**: Implement the business logic, calling repositories and services as needed.
- **Error Handling**: Return domain-specific errors or wrap errors appropriately. Log errors when necessary.

## Example

```go
package usecase

import (
	"context"

	"github.com/cristiano-pacheco/go-bidding-service/internal/modules/identity/repository"
	"github.com/cristiano-pacheco/go-bidding-service/internal/shared/modules/logger"
	"github.com/cristiano-pacheco/go-bidding-service/internal/shared/modules/validator"
	"github.com/cristiano-pacheco/go-otel/trace"
)

type CreateUserInput struct {
	Email    string `validate:"required,email"`
	Password string `validate:"required,min=8"`
}

type CreateUserOutput struct {
	UserID uint64
}

type CreateUserUseCase struct {
	userRepository repository.UserRepositoryI
	validator      validator.Validate
	logger         logger.Logger
}

func NewCreateUserUseCase(
	userRepository repository.UserRepositoryI,
	validator validator.Validate,
	logger logger.Logger,
) *CreateUserUseCase {
	return &CreateUserUseCase{
		userRepository: userRepository,
		validator:      validator,
		logger:         logger,
	}
}

func (u *CreateUserUseCase) Execute(ctx context.Context, input CreateUserInput) (CreateUserOutput, error) {
	ctx, span := trace.Span(ctx, "CreateUserUseCase.Execute")
	defer span.End()

	if err := u.validator.Struct(input); err != nil {
		return CreateUserOutput{}, err
	}

	// Business logic here...
	// user, err := u.userRepository.Create(...)

	return CreateUserOutput{UserID: 123}, nil
}
```
