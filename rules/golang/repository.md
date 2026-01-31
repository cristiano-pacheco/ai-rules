# Go Repository Pattern Rule

## Description
Generate Go repositories for database access using GORM, following the established patterns in the codebase, including interface definition, tracing, and error handling.

## Location & Naming

- **Directory**: `internal/modules/<module_name>/repository` (e.g., `internal/modules/identity/repository`)
- **Filename**: Must end with `_repository.go` (e.g., `user_repository.go`)
- **Package**: `package repository`

## Pattern

### 1. **Interface Definition**
- Define an interface `XRepositoryI` (e.g., `UserRepositoryI`).
- Methods must accept `context.Context` as the first argument.
- **Value Semantics**: Methods must **always** accept and return values (structs), **never** pointers.
    - **Correct**: `Find(ctx context.Context, id uint64) (model.User, error)`
    - **Incorrect**: `Find(ctx context.Context, id uint64) (*model.User, error)`
    - **Correct**: `Create(ctx context.Context, user model.User) (model.User, error)`
    - **Incorrect**: `Create(ctx context.Context, user *model.User) (*model.User, error)`

### 2. **Struct Definition**
- Define a struct `XRepository` (e.g., `UserRepository`).
- Embed `*database.PingoDB` (or the specific database wrapper used in the project).
- **Compile-time Check**: Ensure the struct implements the interface:
  ```go
  var _ XRepositoryI = (*XRepository)(nil)
  ```

### 3. **Constructor**
- Implement `NewXRepository` taking the database connection as an argument.
- Return a pointer to the struct `*XRepository`.

### 4. **Method Implementation**
- **Tracing**: Start a span at the beginning of each method using `trace.Span`.
  ```go
  ctx, otelSpan := trace.Span(ctx, "XRepository.MethodName")
  defer otelSpan.End()
  ```
- **GORM Usage**: Use the generic GORM wrapper `gorm.G[Model](r.DB)` for type safety.
- **Error Handling**:
    - Check for `gorm.ErrRecordNotFound` and return a domain-specific error (e.g., `errs.ErrRecordNotFound`).
    - Return the zero value of the model and the error.
- **Updates**: Check `rowsAffected` to ensure the record existed before returning success.

## Example

```go
package repository

import (
	"context"
	"errors"

	"github.com/cristiano-pacheco/go-bidding-service/internal/modules/identity/model"
	"github.com/cristiano-pacheco/go-bidding-service/internal/shared/errs"
	"github.com/cristiano-pacheco/go-bidding-service/internal/shared/modules/database"
	"github.com/cristiano-pacheco/go-otel/trace"
	"gorm.io/gorm"
)

type UserRepositoryI interface {
	FindByID(ctx context.Context, userID uint64) (model.UserModel, error)
	Create(ctx context.Context, user model.UserModel) (model.UserModel, error)
}

type UserRepository struct {
	*database.PingoDB
}

var _ UserRepositoryI = (*UserRepository)(nil)

func NewUserRepository(db *database.PingoDB) *UserRepository {
	return &UserRepository{db}
}

func (r *UserRepository) FindByID(ctx context.Context, userID uint64) (model.UserModel, error) {
	ctx, otelSpan := trace.Span(ctx, "UserRepository.FindByID")
	defer otelSpan.End()

	user, err := gorm.G[model.UserModel](r.DB).Limit(1).Where("id = ?", userID).First(ctx)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return model.UserModel{}, errs.ErrRecordNotFound
		}
		return model.UserModel{}, err
	}
	return user, nil
}

func (r *UserRepository) Create(ctx context.Context, user model.UserModel) (model.UserModel, error) {
	ctx, otelSpan := trace.Span(ctx, "UserRepository.Create")
	defer otelSpan.End()

	err := gorm.G[model.UserModel](r.DB).Create(ctx, &user)
	return user, err
}
```
