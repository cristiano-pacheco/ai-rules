# Direct use cases

Use this variant when the task or project selects direct injection. Keep the
naming and operation contracts from `use-cases.md`. The constructor returns a
concrete pointer, and `Execute` is the use-case type's only method. Outbound
dependencies retain their consumer-owned ports.

Create `internal/modules/order/usecase/order_show_usecase.go`:

```go
package usecase

import (
	"context"

	"github.com/cristiano-pacheco/bricks/pkg/validator"

	"example.com/project/internal/modules/order/ports"
)

type OrderShowInput struct {
	OrderID uint64 `validate:"required"`
}

type OrderShowOutput struct {
	OrderID uint64
	Status  string
}

type OrderShowUseCase struct {
	orderRepository ports.OrderRepository
	validator       validator.Validator
}

func NewOrderShowUseCase(
	orderRepository ports.OrderRepository,
	validator validator.Validator,
) *OrderShowUseCase {
	return &OrderShowUseCase{
		orderRepository: orderRepository,
		validator:       validator,
	}
}

func (uc *OrderShowUseCase) Execute(
	ctx context.Context,
	input OrderShowInput,
) (OrderShowOutput, error) {
	if err := uc.validator.Struct(input); err != nil {
		return OrderShowOutput{}, err
	}

	order, err := uc.orderRepository.FindByID(ctx, input.OrderID)
	if err != nil {
		return OrderShowOutput{}, err
	}

	return OrderShowOutput{
		OrderID: order.ID,
		Status:  order.Status,
	}, nil
}
```

The example assumes the repository port returns a model value and translates
expected absence into a typed module error. Replace the example module path
and fields with the project's contracts. Preserve any project-required error
logging at its established owner.

## Direct registration and invocation

Add the constructor to the owning module's existing `fx.Provide` group:

```go
fx.Provide(usecase.NewOrderShowUseCase)
```

Keep the repository and validator bindings in that graph. The caller receives
`*usecase.OrderShowUseCase` and invokes it directly:

```go
output, err := orderShowUseCase.Execute(ctx, usecase.OrderShowInput{
	OrderID: orderID,
})
```

Use the caller's context. Keep input and output as named structs even when
empty. This variant has no use-case interface, execution wrapper, decorator
registration, or telemetry dependency. Put reusable behavior in its owning
mapper, validator, or service, keeping `Execute` as the only method.
