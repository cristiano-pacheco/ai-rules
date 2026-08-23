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

For one adapter-owned relationship replacement, start the transaction in the
repository, roll back on each failed step, and check commit failure.

```go
func (r *OrderRepository) ReplaceItems(
	ctx context.Context,
	orderID uint64,
	itemIDs []uint64,
) error {
	ctx, span := trace.Span(ctx, "OrderRepository.ReplaceItems")
	defer span.End()

	tx := r.DB.Begin()
	_, err := gorm.G[model.OrderItemModel](tx).
		Where("order_id = ?", orderID).
		Delete(ctx)
	if err != nil {
		tx.Rollback()
		return err
	}

	items := make([]model.OrderItemModel, 0, len(itemIDs))
	for _, itemID := range itemIDs {
		items = append(items, model.OrderItemModel{OrderID: orderID, ItemID: itemID})
	}
	if err := gorm.G[model.OrderItemModel](tx).CreateInBatches(ctx, &items, len(items)); err != nil {
		tx.Rollback()
		return err
	}
	return tx.Commit().Error
}
```

Read the repository's existing transaction convention before copying this
pattern. Preserve its rollback and error-translation behavior.

## Check before finishing

- The transaction scope covers the exact writes that must be atomic.
- Multiple repositories use a use-case-owned transaction and the callback
  context.
- A local repository transaction cannot leak its consistency rule outside that
  adapter.
- Every failure rolls back or reaches the transaction manager, and commit
  failure reaches the caller.
