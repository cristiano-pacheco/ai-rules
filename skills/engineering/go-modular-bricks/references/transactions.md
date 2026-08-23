# Transactions

## Application transaction

When one business operation changes more than one repository atomically, the
use case owns the transaction scope through a consumer-owned transaction
manager port. The callback receives a transaction-bound application context or
unit of work, according to the repository's existing convention. Repositories
participating in the operation use that same boundary.

```go
type TransactionManager interface {
	Within(ctx context.Context, fn func(context.Context) error) error
}

func (uc *OrderConfirmUseCase) Execute(ctx context.Context, input OrderConfirmInput) (OrderConfirmOutput, error) {
	var output OrderConfirmOutput
	err := uc.transactions.Within(ctx, func(txCtx context.Context) error {
		order, err := uc.orders.Confirm(txCtx, input.OrderID)
		if err != nil {
			return err
		}
		if err := uc.reservations.Commit(txCtx, order.ID); err != nil {
			return err
		}
		output = OrderConfirmOutput{OrderID: order.ID}
		return nil
	})
	if err != nil {
		return OrderConfirmOutput{}, err
	}
	return output, nil
}
```

The use case still owns validation, authorization, state transitions, error
translation, and output mapping. A transaction manager is an adapter concern
behind the port; a use case does not depend on GORM.

## Repository-local transaction

A repository may use a local transaction when every write and consistency rule
is contained inside one adapter operation. Do not use that exception to join
unrelated repositories invisibly. If a second repository must be atomic with
the first, move the boundary to the use case transaction manager.
