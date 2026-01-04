# Go Service Pattern Rule

## Description
Generate Go Services, which encapsulate reusable domain logic or infrastructure utilities that are not specific to a single application workflow.

## Service vs. UseCase

It is crucial to distinguish between a **Service** and a **UseCase**:

| Feature | UseCase | Service |
| :--- | :--- | :--- |
| **Scope** | Application Layer | Domain or Infrastructure Layer |
| **Purpose** | Handles a specific user action/request (e.g., "Login", "Create Order"). Orchestrates flow. | Encapsulates reusable logic (e.g., "Password Hashing", "Email Sending", "Currency Conversion"). |
| **Reusability** | Low (specific to a scenario) | High (can be used by multiple UseCases or other Services) |
| **Dependencies** | Can use Services, Repositories, Producers. | Can use Repositories or other Services. Should NOT depend on UseCases. |
| **State** | Stateless (usually) | Stateless |

## Location & Naming

- **Directory**: `internal/modules/<module_name>/service` (e.g., `internal/modules/identity/service`)
- **Filename**: Must end with `_service.go` (e.g., `hash_service.go`)
- **Package**: `package service`
- **Single Action Naming**: If the service performs a single specific action, name it using the pattern `[Verb][Noun]Service` (e.g., `GenerateJWTService`, `SendEmailService`).
    - In this case, the main method should be named `Execute`.

## Pattern

### 1. **Interface Definition**
- Define an interface `XServiceI` (e.g., `HashServiceI`).
- Defines the contract for the service.

### 2. **Struct Definition**
- Define a struct `XService` (e.g., `HashService`).
- Can contain dependencies (like Repositories, other Services, Loggers).
- **Compile-time Check**: Ensure the struct implements the interface:
  ```go
  var _ XServiceI = (*XService)(nil)
  ```

### 3. **Constructor**
- Implement `NewXService` taking dependencies as arguments.
- Return a pointer to the struct `*XService`.

### 4. **Method Implementation**
- **Context**: Methods that perform I/O (database, network) **must** accept `context.Context` as the first argument. Pure utility methods (like hashing) might not need it.
- **Logic**: Implement the specific domain or utility logic.

## Example

### Utility Service (No Context)

```go
package service

import (
	"crypto/rand"

	"golang.org/x/crypto/bcrypt"
)

type HashServiceI interface {
	GenerateFromPassword(password []byte) ([]byte, error)
	CompareHashAndPassword(hashedPassword, password []byte) error
}

type HashService struct {
}

var _ HashServiceI = (*HashService)(nil)

func NewHashService() *HashService {
	return &HashService{}
}

func (s *HashService) GenerateFromPassword(password []byte) ([]byte, error) {
	return bcrypt.GenerateFromPassword(password, bcrypt.DefaultCost)
}

func (s *HashService) CompareHashAndPassword(hashedPassword, password []byte) error {
	return bcrypt.CompareHashAndPassword(hashedPassword, password)
}
```

### Service (Single Action Example)

```go
package service

import (
	"context"
	"strconv"
	"time"

	"github.com/cristiano-pacheco/go-bidding-service/internal/modules/identity/model"
	"github.com/cristiano-pacheco/go-bidding-service/internal/shared/modules/config"
	"github.com/cristiano-pacheco/go-bidding-service/internal/shared/modules/logger"
	"github.com/cristiano-pacheco/go-bidding-service/internal/shared/modules/registry"
	"github.com/cristiano-pacheco/go-otel/trace"
	"github.com/golang-jwt/jwt/v5"
)

type GenerateJWTServiceI interface {
	Execute(ctx context.Context, user model.UserModel) (string, error)
}

type GenerateJWTService struct {
	privateKeyRegistry registry.PrivateKeyRegistryI
	conf               config.Config
	logger             logger.Logger
}

var _ GenerateJWTServiceI = (*GenerateJWTService)(nil)

func NewGenerateJWTService(
	conf config.Config,
	privateKeyRegistry registry.PrivateKeyRegistryI,
	logger logger.Logger,
) *GenerateJWTService {
	return &GenerateJWTService{privateKeyRegistry, conf, logger}
}

func (s *GenerateJWTService) Execute(ctx context.Context, user model.UserModel) (string, error) {
	_, span := trace.Span(ctx, "GenerateJWTService.Execute")
	defer span.End()

	// Logic implementation...
	return "signed-token", nil
}
```
