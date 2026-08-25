# Third-party providers

## Recipe: adapt a provider SDK

Create a provider adapter when the module needs a third-party capability such
as payment, messaging, identity, or document signing. Put the consumer-owned
contract at
`internal/modules/<module>/ports/<name>_provider.go` and the SDK adapter at
`internal/modules/<module>/provider/<name>_provider.go`. Name both for the
capability the module needs, not for the vendor.

```go
package ports

import (
	"context"

	"example.com/project/internal/modules/billing/dto"
)

// ReceiptProvider issues receipts through the configured third-party provider.
// It returns the module's expected provider outcomes, never SDK values.
type ReceiptProvider interface {
	Issue(ctx context.Context, input dto.IssueReceiptInput) (dto.IssuedReceipt, error)
}
```

The adapter holds the SDK client, configuration, and logger. Add the assertion
below the type and a pointer constructor. Start and end one adapter span for
each provider call. Pass the caller context into the SDK when its API accepts
one. Keep private SDK request and response mapping in the adapter.

```go
type ReceiptProvider struct {
	client receiptapi.Client
	logger logger.Logger
}

var _ ports.ReceiptProvider = (*ReceiptProvider)(nil)

func NewReceiptProvider(client receiptapi.Client, logger logger.Logger) *ReceiptProvider {
	return &ReceiptProvider{client: client, logger: logger}
}

func (p *ReceiptProvider) Issue(
	ctx context.Context,
	input dto.IssueReceiptInput,
) (dto.IssuedReceipt, error) {
	ctx, span := trace.Span(ctx, "ReceiptProvider.Issue")
	defer span.End()

	result, err := p.client.Issue(ctx, receiptapi.IssueRequest{
		Reference: input.Reference,
		Amount:    input.Amount,
	})
	if err != nil {
		p.logger.Error("ReceiptProvider.Issue failed", logger.Error(err))
		if receiptapi.IsRejected(err) {
			return dto.IssuedReceipt{}, errs.ErrReceiptRejected
		}
		return dto.IssuedReceipt{}, fmt.Errorf("issue receipt: %w", err)
	}
	return dto.IssuedReceipt{Reference: result.Reference}, nil
}
```

Translate documented provider outcomes with application meaning to stable
module errors. Allocate the next module error code and add every locale entry
before returning it. Preserve an unknown SDK error with `%w`, log it once at
the adapter, and let the entry point render it safely. Put retries, idempotency
keys, and timeouts in the application policy or the provider configuration when
they are part of the capability's contract. Do not hide a new transaction or
state transition in the adapter.

```go
fx.Provide(
	fx.Annotate(provider.NewReceiptProvider, fx.As(new(ports.ReceiptProvider))),
)
```

Use a provider fake in integration tests only when the external system is
uncontrolled. Test the adapter's SDK request mapping, successful response,
known failure translation, unknown wrapped failure, context cancellation, and
logged error path.
