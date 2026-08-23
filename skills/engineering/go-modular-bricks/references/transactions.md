# Transactions

## Decide the transaction owner

Use a use-case transaction when one business operation must commit changes made
through more than one repository as one unit. The use case owns the scope; a
consumer-owned transaction provider creates the active GORM transaction.
Use a repository-local transaction only when one repository operation contains
every write and consistency rule.

Never start a hidden repository transaction to coordinate a second repository.
Move that boundary to the use case instead.

## Recipe: application transaction

Define the port in
`internal/modules/<module>/ports/transaction_provider.go`. It starts and
exposes `*gorm.DB`: `CreateTX` gives a caller an active transaction, while
`WithTX` owns the same lifecycle for a callback.

```go
package ports

import (
	"context"

	"gorm.io/gorm"
)

// TransactionProvider creates persistence transactions. CreateTX transfers
// commit and rollback to its caller. WithTX commits on success and rolls back
// when its callback returns an error.
type TransactionProvider interface {
	CreateTX(ctx context.Context) (*gorm.DB, error)
	WithTX(ctx context.Context, fn func(tx *gorm.DB) error) error
}
```

Implement it in
`internal/modules/<module>/repository/transaction_provider.go`. Put the
assertion below the type, use a named pointer constructor, trace both public
methods, and bind it through Fx in the owning module.

```go
package repository

import (
	"context"
	"errors"

	"example.com/project/internal/modules/order/ports"
	"example.com/project/internal/shared/database"
	"example.com/project/pkg/otel/trace"
	"gorm.io/gorm"
)

type TransactionProvider struct {
	*database.ProjectDB
}

var _ ports.TransactionProvider = (*TransactionProvider)(nil)

func NewTransactionProvider(db *database.ProjectDB) *TransactionProvider {
	return &TransactionProvider{ProjectDB: db}
}

func (p *TransactionProvider) CreateTX(ctx context.Context) (*gorm.DB, error) {
	ctx, span := trace.Span(ctx, "TransactionProvider.CreateTX")
	defer span.End()

	tx := p.DB.WithContext(ctx).Begin()
	if tx.Error != nil {
		return nil, tx.Error
	}
	return tx.WithContext(ctx), nil
}

func (p *TransactionProvider) WithTX(
	ctx context.Context,
	fn func(tx *gorm.DB) error,
) (err error) {
	ctx, span := trace.Span(ctx, "TransactionProvider.WithTX")
	defer span.End()

	tx, err := p.CreateTX(ctx)
	if err != nil {
		return err
	}
	defer func() {
		if recovered := recover(); recovered != nil {
			_ = tx.Rollback().Error
			panic(recovered)
		}
		if err != nil {
			if rollbackErr := tx.Rollback().Error; rollbackErr != nil {
				err = errors.Join(err, rollbackErr)
			}
			return
		}
		err = tx.Commit().Error
	}()

	return fn(tx)
}
```

```go
fx.Provide(
	fx.Annotate(
		repository.NewTransactionProvider,
		fx.As(new(ports.TransactionProvider)),
	),
)
```

Use `WithTX` for the normal path. Validate input before opening the
transaction. Put authorization, state changes, repository calls, and output
assignment inside the callback. Return the first error so `WithTX` can roll
back.

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
	err := uc.transactions.WithTX(ctx, func(tx *gorm.DB) error {
		order, err := uc.orders.ConfirmTX(ctx, tx, input.OrderID)
		if err != nil {
			return err
		}
		if err := uc.reservations.CommitTX(ctx, tx, order.ID); err != nil {
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

Pass `tx` and the caller context to every `*TX` repository call inside the
callback. The repository port declares each participating `*TX` method with
`context.Context` first and `*gorm.DB` second. Do not call
`context.Background`, create another transaction in a child repository, or
assign a successful output before all required writes succeed.

Use `CreateTX` only when the caller must control commit and rollback itself.
After the first repository error, roll back and return it. Commit once after
all writes succeed; return `tx.Commit().Error` to preserve a commit failure.

```go
tx, err := uc.transactions.CreateTX(ctx)
if err != nil {
	return OrderConfirmOutput{}, err
}

order, err := uc.orders.ConfirmTX(ctx, tx, input.OrderID)
if err != nil {
	if rollbackErr := tx.Rollback().Error; rollbackErr != nil {
		return OrderConfirmOutput{}, errors.Join(err, rollbackErr)
	}
	return OrderConfirmOutput{}, err
}
if err := uc.reservations.CommitTX(ctx, tx, order.ID); err != nil {
	if rollbackErr := tx.Rollback().Error; rollbackErr != nil {
		return OrderConfirmOutput{}, errors.Join(err, rollbackErr)
	}
	return OrderConfirmOutput{}, err
}
if err := tx.Commit().Error; err != nil {
	return OrderConfirmOutput{}, err
}
```

## Recipe: repository-local GORM transaction

For one adapter-owned operation, use its `WithTX` callback and `*TX` methods.
`WithTX` is the sole owner of the GORM boundary: it receives the callback's
first error, rolls back on failure, and returns a commit error. The callback
passes its active transaction only to the adapter's `CreateTX`, `UpdateTX`,
and equivalent operations.

## Check before finishing

- The transaction scope covers the exact writes that must be atomic.
- Multiple repositories use `TransactionProvider.WithTX` and receive the same
  caller context and `*gorm.DB`.
- A caller that uses `CreateTX` commits or rolls back exactly once.
- A manual `CreateTX` rollback returns both the operation and rollback errors.
- A local repository operation uses the `WithTX` recipe and does not manage a
  second transaction inside its callback.
- Every failure reaches the transaction owner, and commit failure reaches the
  caller.
