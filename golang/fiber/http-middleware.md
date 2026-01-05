# Go Middleware Pattern Rule

## Description
Generate Go middleware for the Fiber framework following the established patterns in the codebase, including dependency injection and proper error handling.

## Location & Naming

### Middleware
- **Directory**: `internal/modules/<module_name>/http/<router_name>/middleware` (e.g., `internal/modules/identity/http/fiber/middleware`)
- **Filename**: Must end with `_middleware.go` (e.g., `auth_middleware.go`)
- **Package**: `package middleware`

## Pattern

### 1. **Responsibility**
- The middleware acts as an HTTP interceptor that runs before handlers.
- It **must only** perform cross-cutting concerns (authentication, logging, validation, etc.).
- **NEVER** implement business logic in middleware - delegate to services/use cases when needed.

### 2. **Struct Definition**
- Define a struct `XMiddleware` containing pointers to necessary dependencies (services, registries, etc.).
- Use dependency injection for all external dependencies.
- Include a logger for debugging and error tracking.

### 3. **Constructor**
- Implement `NewXMiddleware` taking dependencies as arguments.
- Return a pointer to the struct `*XMiddleware`.
- Validate required dependencies are not nil.

### 4. **Middleware Method**
- **Signature**: `func (m *XMiddleware) Middleware() fiber.Handler`
- **Return**: Must return `fiber.Handler` (which is `func(*fiber.Ctx) error`).
- **Implementation**: Return an anonymous function that implements the middleware logic.

### 5. **Handler Function Logic**
- **Context**: Use `c.UserContext()` to get the request context.
- **Headers**: Access headers using `c.Get("Header-Name")`.
- **Request Modification**: 
    - Add data to context using `context.WithValue()`.
    - Set new context with `c.SetUserContext(newCtx)`.
- **Flow Control**:
    - Return errors directly to stop the chain: `return fiber.ErrUnauthorized`.
    - Call `return c.Next()` to continue to the next middleware/handler.
- **Error Handling**: Use custom errors from the module's `errs` package when possible.

### 6. **Context Keys**
- Use predefined keys from `internal/shared/sdk/http/request` package.
- Common keys: `UserIDKey`, `RoleKey`, etc.
- Always use type-safe context value retrieval.

## Example

### Middleware (`internal/modules/identity/http/fiber/middleware/auth_middleware.go`)

```go
package middleware

import (
	"context"
	// ... other imports
	"github.com/gofiber/fiber/v2"
	"github.com/cristiano-pacheco/go-bidding-service/internal/shared/sdk/http/request"
)

type AuthMiddleware struct {
	privateKeyRegistry    registry.PrivateKeyRegistryI
	userActivationService service.UserActivationServiceI
	jwtParser             *jwt.Parser
	logger                logger.Logger
}

func NewAuthMiddleware(
	privateKeyRegistry registry.PrivateKeyRegistryI,
	userActivationService service.UserActivationServiceI,
	jwtParser *jwt.Parser,
	logger logger.Logger,
) *AuthMiddleware {
	return &AuthMiddleware{
		privateKeyRegistry,
		userActivationService,
		jwtParser,
		logger,
	}
}

func (m *AuthMiddleware) Middleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Extract and validate token from Authorization header
		bearerToken := c.Get("Authorization")
		if !strings.HasPrefix(bearerToken, "Bearer ") {
			return fiber.ErrUnauthorized
		}

		// Parse and validate JWT token
		// ... token parsing logic ...

		// Extract user information from claims
		// ... user extraction logic ...

		// Validate user status using service
		ctx := c.UserContext()
		isActivated, err := m.userActivationService.IsUserActivated(ctx, userID)
		if err != nil {
			return err
		}

		if !isActivated {
			return errs.ErrUserIsNotActive
		}

		// Add user information to context
		newCtx := context.WithValue(ctx, request.UserIDKey, userID)
		c.SetUserContext(newCtx)

		return c.Next()
	}
}
```

### Usage in Router

```go
// In router setup
authMiddleware := middleware.NewAuthMiddleware(
	privateKeyRegistry,
	userActivationService,
	jwtParser,
	logger,
)

// Apply to protected routes
protected := api.Group("/protected")
protected.Use(authMiddleware.Middleware())
protected.Get("/profile", profileHandler.GetProfile)
```

## Common Middleware Types

### 1. **Authentication Middleware**
- Validates JWT tokens
- Sets user context
- Checks user status/activation

### 2. **Authorization Middleware**
- Checks user permissions/roles
- Validates resource access
- Enforces business rules

### 3. **Logging Middleware**
- Logs request/response details
- Tracks performance metrics
- Handles request tracing

### 4. **Validation Middleware**
- Validates request headers
- Checks content types
- Enforces rate limiting

## Best Practices

1. **Error Handling**: Use module-specific errors when possible.
2. **Performance**: Keep middleware lightweight and fast.
3. **Context**: Always use `c.UserContext()` for context operations.
4. **Testing**: Make middleware easily testable with dependency injection.
5. **Documentation**: Document middleware purpose and usage clearly.
6. **Order**: Consider middleware execution order when applying multiple middlewares.