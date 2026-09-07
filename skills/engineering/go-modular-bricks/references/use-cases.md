# Use cases

For direct injection without a decorator, use the complete example in
[direct use cases](direct-use-cases.md). It preserves the contracts below and
keeps `Execute` as the only method on the use-case type.

## Recipe: add one business operation

Create one file per operation at
`internal/modules/<module>/usecase/<noun>_<action>_usecase.go`. For the noun
`Order` and action `Confirm`, use these names:

| Artifact | Required name |
| --- | --- |
| File | `order_confirm_usecase.go` |
| Type | `OrderConfirmUseCase` |
| Input | `OrderConfirmInput` |
| Output | `OrderConfirmOutput` |
| Constructor | `NewOrderConfirmUseCase` |
| Public method | `Execute` |

The file order is input, output, use-case type, constructor, `Execute`, then
private methods. Define both input and output even when one is empty. Their
fields are explicit, self-contained application values with no JSON tags and no
HTTP DTO, GORM model, or SDK type. Keep each operation's input and output as
its own named struct. Reuse canonical application values through named fields
according to [application DTOs](application-dtos.md), never another operation's
contract through aliases, defined underlying types, or embedding.

This example follows a project that injects a logger into its use cases:

```go
package usecase

import (
	"context"

	"github.com/cristiano-pacheco/bricks/pkg/logger"
	"github.com/cristiano-pacheco/bricks/pkg/validator"
	"example.com/project/internal/modules/order/errs"
	"example.com/project/internal/modules/order/model"
	"example.com/project/internal/modules/order/ports"
)

type OrderConfirmInput struct {
	OrderID uint64 `validate:"required"`
}

type OrderConfirmOutput struct {
	OrderID uint64
	Status  string
}

type OrderConfirmUseCase struct {
	orderRepository ports.OrderRepository
	validator       validator.Validator
	logger          logger.Logger
}

func NewOrderConfirmUseCase(
	orderRepository ports.OrderRepository,
	validator validator.Validator,
	logger logger.Logger,
) *OrderConfirmUseCase {
	return &OrderConfirmUseCase{
		orderRepository: orderRepository,
		validator:       validator,
		logger:          logger,
	}
}
```

Inject ports rather than concrete adapter types. A use case may use models from
its own module as internal persistence values, but its public input and output
contain no models. The constructor returns a pointer and initializes every
dependency by name. Logger injection is allowed when it matches the module's
existing use-case convention; it is not required by this contract.

## Recipe: write `Execute`

Validate the full input as the first call. Then apply the operation's policy,
call collaborators with the request context, translate expected outcomes to the
module `errs` package, and map the final value to the output.

```go
func (uc *OrderConfirmUseCase) Execute(
	ctx context.Context,
	input OrderConfirmInput,
) (OrderConfirmOutput, error) {
	if err := uc.validator.Struct(input); err != nil {
		uc.logger.Error("order confirmation validation failed", logger.Error(err))
		return OrderConfirmOutput{}, err
	}

	order, err := uc.orderRepository.FindByID(ctx, input.OrderID)
	if err != nil {
		uc.logger.Error("order lookup failed", logger.Error(err))
		return OrderConfirmOutput{}, err
	}
	if order.Status == model.OrderStatusConfirmed {
		return OrderConfirmOutput{}, errs.ErrOrderAlreadyConfirmed
	}

	order.Status = model.OrderStatusConfirmed
	confirmed, err := uc.orderRepository.Update(ctx, order)
	if err != nil {
		uc.logger.Error("order confirmation failed", logger.Error(err))
		return OrderConfirmOutput{}, err
	}
	return OrderConfirmOutput{OrderID: confirmed.ID, Status: confirmed.Status}, nil
}
```

Follow the module's existing logging convention. When its use cases inject a
logger, log at the same failure boundaries and with the same message style.
When its decorator or entry point owns error logging, return the error without
adding a second convention. For a lookup where absence is an expected branch,
distinguish it from an unexpected lookup failure with `errors.Is`; return a
typed module error for the expected business condition. Never return
`errors.New(...)` for that condition.

Do not create generic execution tracing or metrics inside `Execute`. The
selected runtime profile owns shared observability. Add domain telemetry
only when the project permits it and the requested behavior needs it. Keep
stateful helpers as private methods on the use-case type. Do not add
package-level helpers beside a use-case type.

## Recipe: call another module

Inject only the other module's exported use-case API. Build its public input,
call `Execute`, and consume its public output or error. Never import its
repository, model, errors, HTTP package, mapper, validator, or Fx code.

```go
reservation, err := uc.inventoryReserve.Execute(ctx, inventory.ReserveInput{
	ItemID: input.ItemID,
	Amount: input.Amount,
})
if err != nil {
	uc.logger.Error("inventory reservation failed", logger.Error(err))
	return OrderConfirmOutput{}, err
}
```

If the public boundary cannot express the interaction, extend that public API
when the requested task authorizes it. Otherwise follow `adr-exceptions.md` to
resolve the scope decision. Keep the other module's internals private.

## Runtime wiring

Follow the profile in [Fx composition](fx-wiring.md) when wiring this operation.

## Check before finishing

- One operation has one `Execute(ctx, input) (output, error)` contract.
- Input validation is the first action and error logging follows the module's established use-case convention.
- Expected outcomes use typed module errors; ports are interfaces.
- Telemetry and injection follow the selected runtime profile.
- Public operation contracts contain no model; internal policy uses only models owned by its module.
- Unknown errors retain their causes; operation wrappers stay distinct.
- Helpers belong to the use case, service, validator, enum, error catalog, or
  mapper according to their behavior, not simply their original file location.
- Fx exposes the selected public use-case type.
