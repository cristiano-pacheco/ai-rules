# Go HTTP Handler Pattern Rule

## Description
Generate Go HTTP handlers for the Fiber framework following the established patterns in the codebase, including DTOs and Swagger documentation.

## Location & Naming

### Handlers
- **Directory**: `internal/modules/<module_name>/http/<router_name>/handler` (e.g., `internal/modules/identity/http/fiber/handler`)
- **Filename**: Must end with `_handler.go` (e.g., `auth_handler.go`)
- **Package**: `package handler`

### DTOs
- **Directory**: `internal/modules/<module_name>/http/dto`
- **Filename**: Must end with `_dto.go` (e.g., `auth_dto.go`)
- **Package**: `package dto`

## Pattern

### 1. **Responsibility**
- The handler acts as the HTTP entrypoint.
- It **must only** call the UseCase to perform operations.
- **NEVER** implement business logic in the handler.

### 2. **Struct Definition**
- Define a struct `XHandler` containing pointers to necessary UseCases.
- Use dependency injection.

### 3. **Constructor**
- Implement `NewXHandler` taking UseCases as arguments.
- Return a pointer to the struct `*XHandler`.

### 4. **Handler Methods**
- **Signature**: `func (h *XHandler) MethodName(c *fiber.Ctx) error`
- **Context**: Retrieve context using `ctx := c.UserContext()`
- **Request Parsing**:
    - Define a variable of the Request DTO type.
    - Use `c.BodyParser(&req)` to parse the body.
    - Return `err` immediately if parsing fails.
- **UseCase Execution**:
    - Map DTO to UseCase Input struct.
    - Call `h.useCase.Execute(ctx, input)`.
    - Handle errors: `if err != nil { return err }`.
- **Response**:
    - Map UseCase Output to Response DTO (if applicable).
    - **ALWAYS** wrap the response data using `response.NewEnvelope(data)`.
        - This enforces a consistent response structure where the payload is wrapped in a `data` attribute.
        - Example JSON output:
          ```json
          {
              "data": {
                  "user_id": 1
              }
          }
          ```
    - Return `c.Status(http.StatusOK).JSON(res)`.

### 5. **Swagger Documentation**
- Add comments above each handler method.
- **Tags**: Group by feature/module.
- **Param**: Document request body using the DTO.
- **Success**: Document 200 OK with `response.Envelope[dto.ResponseDTO]`.
- **Failure**: Document 400, 401, 404, 500 with `errs.Error`.
- **Router**: Specify path and method.

### 6. **DTO Definition**
- Define simple structs with JSON tags.
- Group Request and Response structs in the same file if related to the same feature, or separate by entity.

## Example

### Handler (`internal/modules/identity/http/fiber/handler/auth_handler.go`)

```go
package handler

import (
	"net/http"

	"github.com/cristiano-pacheco/go-bidding-service/internal/modules/identity/http/dto"
	"github.com/cristiano-pacheco/go-bidding-service/internal/modules/identity/usecase"
	"github.com/cristiano-pacheco/go-bidding-service/internal/shared/sdk/http/response"
	"github.com/gofiber/fiber/v2"
)

type AuthHandler struct {
	authLoginUseCase *usecase.AuthLoginUseCase
}

func NewAuthHandler(
	authLoginUseCase *usecase.AuthLoginUseCase,
) *AuthHandler {
	return &AuthHandler{
		authLoginUseCase: authLoginUseCase,
	}
}

// @Summary		Authenticate the user
// @Description	Authenticates user credentials
// @Tags		Authentication
// @Accept		json
// @Produce		json
// @Param		request	body	dto.AuthLoginRequest	true	"Login credentials"
// @Success		200	{object}	response.Envelope[dto.AuthLoginResponse]	"Successfully logged in"
// @Failure		400	{object}	errs.Error	"Invalid request"
// @Failure		401	{object}	errs.Error	"Invalid credentials"
// @Failure		500	{object}	errs.Error	"Internal server error"
// @Router		/api/v1/auth/login [post]
func (h *AuthHandler) Login(c *fiber.Ctx) error {
	ctx := c.UserContext()
	var req dto.AuthLoginRequest
	if err := c.BodyParser(&req); err != nil {
		return err
	}

	input := usecase.AuthLoginInput{
		Email:    req.Email,
		Password: req.Password,
	}

	output, err := h.authLoginUseCase.Execute(ctx, input)
	if err != nil {
		return err
	}

	res := response.NewEnvelope(dto.AuthLoginResponse{UserID: output.UserID})
	return c.Status(http.StatusOK).JSON(res)
}
```

### DTO (`internal/modules/identity/http/dto/auth_dto.go`)

```go
package dto

type AuthLoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthLoginResponse struct {
	UserID uint64 `json:"user_id"`
}
```
