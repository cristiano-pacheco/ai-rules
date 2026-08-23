# Remote-service clients

## Recipe: call an internal remote service

Create a client when application policy needs another service through HTTP,
gRPC, or another transport. Put the consumer-owned port at
`internal/modules/<module>/ports/<name>_client.go` and the transport adapter at
`internal/modules/<module>/client/<name>_client.go`. Keep the port's input and
output in module DTOs. It does not expose request objects, response objects, or
client-library types.

```go
package ports

import (
	"context"

	"example.com/project/internal/modules/orders/dto"
)

// InventoryClient reserves stock through the inventory service. It returns the
// module's unavailable or rejected outcome when the remote response has that meaning.
type InventoryClient interface {
	Reserve(ctx context.Context, input dto.ReserveInventoryInput) (dto.Reservation, error)
}
```

The client owns transport mapping, I/O tracing, and contextual logging. It does
not choose business retries, transactions, or state transitions. Use the
caller context for every outbound request. The constructor returns a pointer,
the type asserts its port, and Fx binds it in the owning module.

```go
type InventoryClient struct {
	baseURL    string
	httpClient *http.Client
	logger     logger.Logger
}

var _ ports.InventoryClient = (*InventoryClient)(nil)

func NewInventoryClient(
	cfg config.InventoryConfig,
	httpClient *http.Client,
	logger logger.Logger,
) *InventoryClient {
	return &InventoryClient{
		baseURL:    cfg.BaseURL,
		httpClient: httpClient,
		logger:     logger,
	}
}

func (c *InventoryClient) Reserve(
	ctx context.Context,
	input dto.ReserveInventoryInput,
) (dto.Reservation, error) {
	ctx, span := trace.Span(ctx, "InventoryClient.Reserve")
	defer span.End()

	body, err := json.Marshal(inventoryReserveRequest{SKU: input.SKU, Quantity: input.Quantity})
	if err != nil {
		c.logger.Error("InventoryClient.Reserve failed", logger.Error(err))
		return dto.Reservation{}, fmt.Errorf("marshal inventory reservation: %w", err)
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/reservations", bytes.NewReader(body))
	if err != nil {
		c.logger.Error("InventoryClient.Reserve failed", logger.Error(err))
		return dto.Reservation{}, fmt.Errorf("build inventory reservation request: %w", err)
	}
	response, err := c.httpClient.Do(req)
	if err != nil {
		c.logger.Error("InventoryClient.Reserve failed", logger.Error(err))
		return dto.Reservation{}, fmt.Errorf("reserve inventory: %w", err)
	}
	defer response.Body.Close()
	if response.StatusCode == http.StatusConflict {
		return dto.Reservation{}, errs.ErrInventoryUnavailable
	}
	if response.StatusCode < http.StatusOK || response.StatusCode >= http.StatusMultipleChoices {
		return dto.Reservation{}, errs.ErrInventoryUnavailable
	}

	var payload inventoryReserveResponse
	if err := json.NewDecoder(response.Body).Decode(&payload); err != nil {
		c.logger.Error("InventoryClient.Reserve failed", logger.Error(err))
		return dto.Reservation{}, fmt.Errorf("decode inventory reservation: %w", err)
	}
	return dto.Reservation{ID: payload.ID}, nil
}
```

Place the private transport request and response types beside the adapter. Map
them explicitly to module DTOs. Map known remote business outcomes to the
owning module's stable errors and locale entries. Return unknown transport or
decode errors wrapped with operation context. The entry point renders them
safely.

```go
fx.Provide(
	fx.Annotate(client.NewInventoryClient, fx.As(new(ports.InventoryClient))),
)
```

Test request mapping, response mapping, known status translation, cancellation,
and malformed payload handling with a controlled test server. In an integrated
flow, fake this client only when the real remote service is uncontrolled.
