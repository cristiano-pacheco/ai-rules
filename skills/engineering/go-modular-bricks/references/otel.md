# OpenTelemetry tracing

## Trace adapter I/O

Add an OTEL span to every changed repository, client, provider, cache, or I/O
service method. The method takes caller `context.Context` first. Its first
statements create and defer the span, named `StructName.MethodName`.

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

## Trace I/O service operations

The decorated use-case boundary already owns generic execution tracing,
duration, and outcome telemetry. Put operation-level spans in the I/O services
and adapters that do the work. A reusable service belongs in
`internal/modules/<module>/service/<name>_service.go`; its consumer-owned port,
pointer constructor, interface assertion, and Fx binding follow the selected
service contract. Use the span naming rule above without event detail in the
name.

```go
func (s *CatalogRefreshService) Execute(
	ctx context.Context,
	input dto.CatalogRefreshInput,
) error {
	ctx, span := trace.Span(ctx, "CatalogRefreshService.Execute")
	defer span.End()

	if err := s.catalogClient.Refresh(ctx, input.CatalogID); err != nil {
		s.logger.Error("CatalogRefreshService.Execute failed", logger.Error(err))
		return err
	}
	return nil
}
```

Keep the caller context, direct error logging, typed error translation, and
locale ownership with the service or adapter that owns them. The span does not
replace logging or error translation. Leave the use case's existing decorated
boundary in place.

## Prove behavior, not tracing internals

Use a unit test for the pure or mocked behavior and an integration test for the
changed I/O or use-case flow. Pass a caller context, assert returned typed or
preserved errors, persisted state, and provider side effects. Do not test the
implementation of `trace.Span`; the trace is an operational consequence of the
production path.

## Check before finishing

- Every changed I/O method starts and defers one `StructName.MethodName` span.
- A decorated use case keeps generic execution telemetry at its boundary; its
  I/O services and adapters trace their own operations.
- Constructors, assertions, Fx bindings, context propagation, logging, typed
  errors, and locale ownership remain with their production responsibility.
