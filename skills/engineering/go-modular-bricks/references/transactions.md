# Transactions

## Decide the transaction owner

Use a use-case transaction when one business operation must commit changes made
through more than one repository as one unit. The use case owns the scope; a
consumer-owned transaction-manager port hides GORM or another database driver.
Use a repository-local transaction only when one repository operation contains
every write and consistency rule.

Never start a hidden repository transaction to coordinate a second repository.
Move that boundary to the use case instead.

## Recipe: application transaction

Define the port in `internal/modules/<module>/ports/transaction_manager.go` and
bind its concrete adapter in the composition root.

```go
package ports

import "context"

// TransactionManager runs an application operation in one persistence
// transaction. Repositories use the callback context for every participating
// call.
type TransactionManager interface {
	Within(ctx context.Context, fn func(context.Context) error) error
}
```

Validate before opening the transaction. Put authorization, state changes,
repository calls, and output assignment inside the callback. Return the first
error so the manager can roll back.

```go
func (uc *OrderConfirmUseCase) Execute(
	ctx context.Context,
	input OrderConfirmInput,
) (OrderConfirmOutput, error) {
	if err := uc.validator.Struct(input); err != nil {
		uc.logger.Error("order confirmation validation failed", logger.Error(err))
		return OrderConfirmOutput{}, err
	}

	var output OrderConfirmOutput
	err := uc.transactions.Within(ctx, func(txCtx context.Context) error {
		order, err := uc.orders.Confirm(txCtx, input.OrderID)
		if err != nil {
			return err
		}
		if err := uc.reservations.Commit(txCtx, order.ID); err != nil {
			return err
		}
		output = OrderConfirmOutput{OrderID: order.ID, Status: order.Status}
		return nil
	})
	if err != nil {
		uc.logger.Error("order confirmation failed", logger.Error(err))
		return OrderConfirmOutput{}, err
	}
	return output, nil
}
```

Pass `txCtx` to every repository call inside the callback. Do not call
`context.Background`, re-open a transaction in a child repository, or assign a
successful output before all required writes succeed.

## Recipe: repository-local GORM transaction

For one adapter-owned operation, use its `WithTX` callback and `*TX` methods.
`WithTX` is the sole owner of the GORM boundary: it receives the callback's
first error, rolls back on failure, and returns a commit error. The callback
passes its active transaction only to the adapter's `CreateTX`, `UpdateTX`,
and equivalent operations.

## Check before finishing

- The transaction scope covers the exact writes that must be atomic.
- Multiple repositories use a use-case-owned transaction and the callback
  context.
- A local repository operation uses the `WithTX` recipe and does not manage a
  second transaction inside its callback.
- Every failure reaches the transaction owner, and commit failure reaches the
  caller.
