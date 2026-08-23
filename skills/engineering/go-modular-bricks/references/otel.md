# OpenTelemetry tracing

## Trace adapter I/O

Add an OTEL span to every changed repository, client, provider, cache, or I/O
service method. The method takes caller `context.Context` first. Its first
statements create and defer the span, named `Type.Method`.

```go
package provider

import (
	"context"

	"example.com/project/pkg/logger"
	"example.com/project/pkg/otel/trace"
	"example.com/project/internal/modules/billing/ports"
)

type ReceiptProvider struct {
	client ports.ReceiptClient
	logger logger.Logger
}

var _ ports.ReceiptProvider = (*ReceiptProvider)(nil)

func NewReceiptProvider(
	client ports.ReceiptClient,
	logger logger.Logger,
) *ReceiptProvider {
	return &ReceiptProvider{client: client, logger: logger}
}

func (p *ReceiptProvider) Issue(ctx context.Context, orderID uint64) error {
	ctx, span := trace.Span(ctx, "ReceiptProvider.Issue")
	defer span.End()

	if err := p.client.Issue(ctx, orderID); err != nil {
		p.logger.Error("ReceiptProvider.Issue failed", logger.Error(err))
		return err
	}
	return nil
}
```

The production file order is type, interface assertion, pointer constructor,
public methods, then private methods. Bind the constructor once in
`internal/modules/<module>/fx.go` with `fx.As(new(ports.ReceiptProvider))`.
Keep a repository's known database-error translation in its adapter and leave
unknown technical errors unchanged. An I/O service logs each returned error.
The span and log carry the caller context; neither creates a background context
nor a new module error or locale entry.

## Trace domain events in use cases

The existing decorated use-case boundary owns generic execution tracing,
duration, and outcome telemetry. Add a use-case span only for a meaningful
domain event that needs its own trace segment. Put it around that event inside
`internal/modules/<module>/usecase/<noun>_<action>_usecase.go`; do not wrap the
whole `Execute` method a second time.

```go
func (uc *OrderConfirmUseCase) Execute(
	ctx context.Context,
	input OrderConfirmInput,
) (OrderConfirmOutput, error) {
	if err := uc.validator.Struct(input); err != nil {
		uc.logger.Error("order confirmation validation failed", logger.Error(err))
		return OrderConfirmOutput{}, err
	}

	ctx, span := trace.Span(ctx, "OrderConfirmUseCase.confirmation")
	defer span.End()

	confirmed, err := uc.orderRepository.Confirm(ctx, input.OrderID)
	if err != nil {
		uc.logger.Error("order confirmation failed", logger.Error(err))
		return OrderConfirmOutput{}, err
	}
	return OrderConfirmOutput{OrderID: confirmed.ID, Status: confirmed.Status}, nil
}
```

Keep validation first and preserve the use case's `Execute(ctx, input)`
contract, pointer constructor, typed errors, and locale entries. The span does
not replace logging or error translation. The owner module's existing
`provideDecoratedUseCases` wiring continues to expose the decorated contract to
entry points.

## Prove behavior, not tracing internals

Use a unit test for the pure or mocked behavior and an integration test for the
changed I/O or use-case flow. Pass a caller context, assert returned typed or
preserved errors, persisted state, and provider side effects. Do not test the
implementation of `trace.Span`; the trace is an operational consequence of the
production path.

## Check before finishing

- Every changed I/O method starts and defers one `Type.Method` span.
- A use-case span identifies one domain event and leaves generic execution
  telemetry to the decorated boundary.
- Constructors, assertions, Fx bindings, context propagation, logging, typed
  errors, and locale ownership remain with their production responsibility.
