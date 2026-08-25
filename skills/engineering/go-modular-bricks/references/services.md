# Services

## Choose the service shape

Use a service for a reusable capability with one responsibility, consumed by
use cases or other services. A pure capability needs only
`internal/modules/<module>/service/<name>_service.go`. An I/O capability uses a
consumer-owned port in `ports/`, an implementation in `service/`, and a `dto/`
file when a service-specific input or output improves the contract.

Use one `Execute` method with a dedicated DTO for a single action. Use named
methods when one service has a coherent family of operations, such as password
hashing. Do not manufacture a port for a private pure helper.

## Recipe: I/O service

Create the DTO only when the service needs a named shared shape:

```go
package dto

type SendEmailConfirmationInput struct {
	UserID uint64
	Token  string
}
```

Create the documented port in
`internal/modules/<module>/ports/send_email_confirmation_service.go`:

```go
package ports

import (
	"context"

	"example.com/project/internal/modules/identity/dto"
)

// SendEmailConfirmationService sends the confirmation message for a registered
// user. It returns a provider error when delivery fails.
type SendEmailConfirmationService interface {
	Execute(ctx context.Context, input dto.SendEmailConfirmationInput) error
}
```

Create the implementation in
`internal/modules/<module>/service/send_email_confirmation_service.go`. Its
order is type, assertion, constructor, public methods, then private methods.

```go
package service

import (
	"context"

	"github.com/cristiano-pacheco/bricks/pkg/logger"
	"github.com/cristiano-pacheco/bricks/pkg/otel/trace"
	"example.com/project/internal/modules/identity/dto"
	"example.com/project/internal/modules/identity/ports"
)

type SendEmailConfirmationService struct {
	sender ports.EmailSender
	logger logger.Logger
}

var _ ports.SendEmailConfirmationService = (*SendEmailConfirmationService)(nil)

func NewSendEmailConfirmationService(
	sender ports.EmailSender,
	logger logger.Logger,
) *SendEmailConfirmationService {
	return &SendEmailConfirmationService{sender: sender, logger: logger}
}

func (s *SendEmailConfirmationService) Execute(
	ctx context.Context,
	input dto.SendEmailConfirmationInput,
) error {
	ctx, span := trace.Span(ctx, "SendEmailConfirmationService.Execute")
	defer span.End()

	if err := s.sender.Send(ctx, input.UserID, input.Token); err != nil {
		s.logger.Error("SendEmailConfirmationService.Execute failed", logger.Error(err))
		return err
	}
	return nil
}
```

Every I/O method takes `context.Context` first, starts a Bricks span named
`StructName.MethodName`, and defers `span.End()`. A service that returns an
error has a `logger logger.Logger` field, and logs each returned error directly
before returning it with `s.logger.Error(..., logger.Error(err))`. Name the
constructor parameter `logger`, never `log` or `l`.

## Recipe: pure service

Keep deterministic work such as hashing or formatting in a dependency-free
implementation. Omit context, tracing, logger, configuration, and a port unless
another module genuinely consumes it as a boundary.

```go
type PasswordHashService struct{}

func NewPasswordHashService() *PasswordHashService {
	return &PasswordHashService{}
}

func (s *PasswordHashService) Generate(password []byte) ([]byte, error) {
	return bcrypt.GenerateFromPassword(password, bcrypt.DefaultCost)
}
```

When the file has a stateful service type, keep helper logic as private methods
on that type. Do not add standalone package functions beside service methods.
Put an independent pure transformation in `mapper/` instead.

## Wire and test

Bind an I/O service in the module's `fx.go`:

```go
fx.Provide(
	fx.Annotate(
		service.NewSendEmailConfirmationService,
		fx.As(new(ports.SendEmailConfirmationService)),
	),
)
```

Test the port-visible behavior and errors. For an I/O service, fake or mock the
consumer-owned dependency, assert it receives the input, and assert the error
path returns the collaborator error. Do not test `trace.Span` internals.

## Check before finishing

- The service has one clear reusable responsibility.
- I/O services have port, implementation, assertion, pointer constructor, span,
  context, and logged error return.
- Pure services omit I/O-only dependencies.
- Implementation comments do not repeat type, constructor, or method names.
- Fx binds the concrete service to the port.
