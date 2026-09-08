# Services

## Choose the service shape

Apply the responsibility classification in `../SKILL.md` first. A service owns
a reusable capability only after ruling out validation, representation mapping,
persistence, and protocol adaptation. Reuse and I/O alone do not make a service.

A rule whose result is acceptance or rejection belongs to
[validators](validators.md), even when it reads a repository or filesystem.
A conversion that builds a target representation belongs to
[mappers](mappers.md), even when only one service calls it. A loader can own
loading while delegating those responsibilities. Classify by behavior, not by
names such as `Check`, `Build`, `Normalize`, or `Execute`.

A pure capability needs only
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

Keep capabilities such as password hashing or a reusable business calculation
in a dependency-free implementation. Deterministic DTO assembly, serialization,
and representation formatting follow the mapper contract instead. Omit context,
tracing, logger, configuration, and a port unless another module consumes it as
a boundary.

```go
type PasswordHashService struct{}

func NewPasswordHashService() *PasswordHashService {
	return &PasswordHashService{}
}

func (s *PasswordHashService) Generate(password []byte) ([]byte, error) {
	return bcrypt.GenerateFromPassword(password, bcrypt.DefaultCost)
}
```

Keep service-owned implementation detail as private methods in the owning
service's file, whether the type is stateful or stateless. Each method must
implement that service responsibility; a receiver is not evidence of ownership.
Extract conversion to a boundary-owned mapper and reusable checks to a validator
instead of creating `service/*_helpers.go`, `service/*_mapping.go`, or a second
file containing only private methods. Standalone package functions do not belong
beside service methods.

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

Prove service behavior through the project's required test seam. Integration-only
projects use public use cases and real adapters, without local tests or doubles.
When isolated tests are permitted, fake or mock the I/O service's consumer-owned
dependency. Assert that it receives the input and that the service returns its
errors. Do not test `trace.Span` internals.

## Check before finishing

- The service has one clear reusable responsibility not owned by a validator,
  mapper, repository, client, or provider; private methods satisfy the same rule.
- I/O services have port, implementation, assertion, pointer constructor, span,
  context, and logged error return.
- Pure services omit I/O-only dependencies.
- Implementation comments do not repeat type, constructor, or method names.
- Fx binds the concrete service to the port.
