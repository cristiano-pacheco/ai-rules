# Use cases

## Public operation

Give each business operation one use case in the owning module's `usecase/`
package. Use the `EntityOperationUseCase` name, a pointer-returning
`NewEntityOperationUseCase` constructor, and one public method:

```go
func (uc *OrderConfirmUseCase) Execute(
	ctx context.Context,
	input OrderConfirmInput,
) (OrderConfirmOutput, error)
```

Keep the operation's input and output with the use case. Use a separate type
for each operation, including an empty input or output when it has no fields.
The public contract contains application values only. HTTP DTOs, GORM models,
provider SDK values, and foreign module internals stay outside it.

## Discovery

Before changing an operation, identify its owning module, comparable use case,
input and output, policy decisions, ports, typed errors, and integration seam.

## Shape

Use one operation boundary for one business behavior. Inject the consumer-owned
port interfaces it needs. Keep helpers as private methods when they need
use-case state; move reusable pure transformation to a mapper or pure service.

## Policy

`Execute` owns the order of application policy:

1. Validate simple input constraints first through the established validator.
2. Decide authorization, state changes, idempotency, and business rules.
3. Call the required consumer-owned ports with the request context.
4. Translate expected outcomes to stable module errors.
5. Map collaborator results to the operation output.

Log a terminal error through the established logger immediately before returning
it. Preserve an unexpected technical error's identity unless operation context
is necessary. Shared timing and outcome instrumentation belongs in the
decorated use-case boundary; adapter I/O instrumentation belongs in adapters.

## Module boundary

Call another module only through the owning module's injected exported use
case. The caller supplies that use case's public input and receives its public
output or error. It does not access the other module's repositories, models,
HTTP package, mappers, validators, errors, or Fx composition.

```go
result, err := uc.inventoryReserve.Execute(ctx, inventory.ReserveInput{
	ItemID: input.ItemID,
	Amount: input.Amount,
})
```

An operation that cannot use this boundary needs an ADR before the change.
