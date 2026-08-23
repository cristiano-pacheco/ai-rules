# Repositories

## Recipe: define a persistence port and adapter

Create the consumer-owned port at
`internal/modules/<module>/ports/<entity>_repository.go` and the GORM adapter
at `internal/modules/<module>/repository/<entity>_repository.go`. The port
uses module models or application DTOs, never `*gorm.DB`. Its comment states
the persistence responsibility and any absence rule.

```go
package ports

import (
	"context"

	"example.com/project/internal/modules/billing/model"
)

// InvoiceRepository persists billing invoices. FindByID returns the module's
// not-found error when no invoice exists.
type InvoiceRepository interface {
	FindByID(ctx context.Context, id uint64) (model.InvoiceModel, error)
	Create(ctx context.Context, invoice model.InvoiceModel) (model.InvoiceModel, error)
	Update(ctx context.Context, invoice model.InvoiceModel) (model.InvoiceModel, error)
	Delete(ctx context.Context, id uint64) error
}
```

The implementation holds the shared database wrapper only. Put its assertion
immediately below the type and use named fields in the pointer constructor.
Each I/O method starts the adapter span, receives its caller context, and ends
the span with `defer`.

```go
package repository

import (
	"context"
	"errors"
	"time"

	brickserrs "example.com/project/pkg/errs"
	"example.com/project/pkg/otel/trace"
	"example.com/project/internal/modules/billing/errs"
	"example.com/project/internal/modules/billing/model"
	"example.com/project/internal/modules/billing/ports"
	"example.com/project/internal/shared/database"
	"gorm.io/gorm"
)

type InvoiceRepository struct {
	*database.ProjectDB
}

var _ ports.InvoiceRepository = (*InvoiceRepository)(nil)

func NewInvoiceRepository(db *database.ProjectDB) *InvoiceRepository {
	return &InvoiceRepository{ProjectDB: db}
}

func (r *InvoiceRepository) FindByID(ctx context.Context, id uint64) (model.InvoiceModel, error) {
	ctx, span := trace.Span(ctx, "InvoiceRepository.FindByID")
	defer span.End()

	invoice, err := gorm.G[model.InvoiceModel](r.DB).
		Where("id = ?", id).
		Limit(1).
		First(ctx)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return model.InvoiceModel{}, brickserrs.ErrRecordNotFound
		}
		return model.InvoiceModel{}, err
	}
	return invoice, nil
}
```

Bind it in the owner module's `fx.go`:

```go
fx.Provide(
	fx.Annotate(repository.NewInvoiceRepository, fx.As(new(ports.InvoiceRepository))),
)
```

## Recipe: select the query shape

Use `gorm.G[model.XxxModel](r.DB)` for simple lookups, creates, updates, and
deletes. Put `.Limit(1)` immediately before every `.First(ctx)`. Use
`r.DB.WithContext(ctx).Model(...)` only for dynamic conditions, joins,
subqueries, targeted columns, or raw select fragments.

```go
func (r *InvoiceRepository) Create(ctx context.Context, invoice model.InvoiceModel) (model.InvoiceModel, error) {
	ctx, span := trace.Span(ctx, "InvoiceRepository.Create")
	defer span.End()

	err := gorm.G[model.InvoiceModel](r.DB).Create(ctx, &invoice)
	if err != nil {
		return model.InvoiceModel{}, err
	}
	return invoice, nil
}

func (r *InvoiceRepository) Delete(ctx context.Context, id uint64) error {
	ctx, span := trace.Span(ctx, "InvoiceRepository.Delete")
	defer span.End()

	rows, err := gorm.G[model.InvoiceModel](r.DB).Where("id = ?", id).Delete(ctx)
	if err != nil {
		return err
	}
	if rows == 0 {
		return brickserrs.ErrRecordNotFound
	}
	return nil
}
```

For a filtered collection, build conditions and the count from the same base
query. Apply ordering, limit, and offset only after the count. Use the raw
builder for joins and other dynamic SQL shapes.

```go
func (r *InvoiceRepository) FindByCustomerID(
	ctx context.Context,
	customerID uint64,
	limit int,
	offset int,
) ([]model.InvoiceModel, int64, error) {
	ctx, span := trace.Span(ctx, "InvoiceRepository.FindByCustomerID")
	defer span.End()

	base := r.DB.WithContext(ctx).
		Model(&model.InvoiceModel{}).
		Where("customer_id = ?", customerID)

	var total int64
	if err := base.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var invoices []model.InvoiceModel
	err := base.Order("id DESC").Limit(limit).Offset(offset).Find(&invoices).Error
	if err != nil {
		return nil, 0, err
	}
	return invoices, total, nil
}

func (r *InvoiceRepository) FindByLabelID(ctx context.Context, labelID uint64) ([]model.InvoiceModel, error) {
	ctx, span := trace.Span(ctx, "InvoiceRepository.FindByLabelID")
	defer span.End()

	var invoices []model.InvoiceModel
	err := r.DB.WithContext(ctx).
		Model(&model.InvoiceModel{}).
		Joins("JOIN invoice_labels il ON il.invoice_id = invoices.id").
		Where("il.label_id = ?", labelID).
		Order("invoices.id ASC").
		Find(&invoices).Error
	if err != nil {
		return nil, err
	}
	return invoices, nil
}
```

For a fixed update that must write `false`, `0`, or an empty string, select the
columns or use a map. Plain `Updates(model)` omits zero values. Reload an
updated value with `Limit(1)` before `First(ctx)`.

```go
func (r *InvoiceRepository) Update(
	ctx context.Context,
	invoice model.InvoiceModel,
) (model.InvoiceModel, error) {
	ctx, span := trace.Span(ctx, "InvoiceRepository.Update")
	defer span.End()

	result := r.DB.WithContext(ctx).
		Model(&model.InvoiceModel{}).
		Where("id = ?", invoice.ID).
		Select("status", "note").
		Updates(&invoice)
	if result.Error != nil {
		return model.InvoiceModel{}, result.Error
	}
	if result.RowsAffected == 0 {
		return model.InvoiceModel{}, brickserrs.ErrRecordNotFound
	}

	updated, err := gorm.G[model.InvoiceModel](r.DB).
		Where("id = ?", invoice.ID).
		Limit(1).
		First(ctx)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return model.InvoiceModel{}, brickserrs.ErrRecordNotFound
		}
		return model.InvoiceModel{}, err
	}
	return updated, nil
}
```

A single-field update may use `Update` directly. For a targeted delete, zero
affected rows means not found. A cleanup that deletes expired rows returns its
driver error and treats zero rows as success.

```go
func (r *InvoiceRepository) DeleteExpired(ctx context.Context) error {
	ctx, span := trace.Span(ctx, "InvoiceRepository.DeleteExpired")
	defer span.End()

	_, err := gorm.G[model.InvoiceModel](r.DB).
		Where("expires_at < ?", time.Now().UTC()).
		Delete(ctx)
	return err
}
```

## Translate known outcomes

Map a missing GORM row to the module's declared not-found error when it has
one, otherwise use `brickserrs.ErrRecordNotFound`. Map a duplicate key to the
module conflict error when that error exists. Return unknown driver errors
unchanged so diagnostics retain their cause. The entry point logs and renders
them through the established error path.

```go
if errors.Is(err, gorm.ErrDuplicatedKey) {
	return model.InvoiceModel{}, errs.ErrInvoiceNumberConflict
}
```

The repository owns a transaction only when the entire atomic operation stays
inside that one adapter. Read the transaction contract before coordinating more
than one repository.

## Recipe: run related adapter writes in one transaction

For one adapter-local operation that needs several writes to succeed or fail
together, add `WithTX`, `CreateTX`, and `UpdateTX` to
`internal/modules/<module>/repository/<entity>_repository.go`. Keep these
methods out of `internal/modules/<module>/ports/<entity>_repository.go`: the
application port continues to hide GORM. A caller that needs atomic writes in
more than one repository uses the use-case `TransactionManager` instead.

`WithTX` owns the boundary. It derives the transaction from the caller context,
passes the active `*gorm.DB` only to the callback, rolls back when the callback
returns an error, and returns a commit error to its caller. GORM's
`Transaction` provides those rollback and commit semantics; do not call
`Begin`, `Rollback`, or `Commit` inside the callback.

```go
func (r *InvoiceRepository) WithTX(
	ctx context.Context,
	fn func(tx *gorm.DB) error,
) error {
	ctx, span := trace.Span(ctx, "InvoiceRepository.WithTX")
	defer span.End()

	return r.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		return fn(tx.WithContext(ctx))
	})
}
```

`CreateTX` and `UpdateTX` receive the transaction explicitly. Start their own
adapter spans, use the callback context, and translate known database outcomes
exactly as the non-transactional methods do. The normal `Create` and `Update`
methods remain the single-write entry points; do not make them silently open a
transaction.

```go
func (r *InvoiceRepository) CreateTX(
	ctx context.Context,
	tx *gorm.DB,
	invoice model.InvoiceModel,
) (model.InvoiceModel, error) {
	ctx, span := trace.Span(ctx, "InvoiceRepository.CreateTX")
	defer span.End()

	err := gorm.G[model.InvoiceModel](tx.WithContext(ctx)).Create(ctx, &invoice)
	if err != nil {
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			return model.InvoiceModel{}, errs.ErrInvoiceNumberConflict
		}
		return model.InvoiceModel{}, err
	}
	return invoice, nil
}

func (r *InvoiceRepository) UpdateTX(
	ctx context.Context,
	tx *gorm.DB,
	invoice model.InvoiceModel,
) (model.InvoiceModel, error) {
	ctx, span := trace.Span(ctx, "InvoiceRepository.UpdateTX")
	defer span.End()

	db := tx.WithContext(ctx)
	result := db.Model(&model.InvoiceModel{}).
		Where("id = ?", invoice.ID).
		Select("status", "note").
		Updates(&invoice)
	if result.Error != nil {
		return model.InvoiceModel{}, result.Error
	}
	if result.RowsAffected == 0 {
		return model.InvoiceModel{}, brickserrs.ErrRecordNotFound
	}

	updated, err := gorm.G[model.InvoiceModel](db).
		Where("id = ?", invoice.ID).
		Limit(1).
		First(ctx)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return model.InvoiceModel{}, brickserrs.ErrRecordNotFound
		}
		return model.InvoiceModel{}, err
	}
	return updated, nil
}
```

Call the methods only from the `WithTX` callback, return the first error, and
let `WithTX` finalize the transaction. The adapter does not log database
errors; the entry point logs the returned error once and renders its declared
module error through the established locale path.

```go
func (r *InvoiceRepository) CreateAndUpdate(
	ctx context.Context,
	invoice model.InvoiceModel,
) (model.InvoiceModel, error) {
	ctx, span := trace.Span(ctx, "InvoiceRepository.CreateAndUpdate")
	defer span.End()

	var updated model.InvoiceModel
	err := r.WithTX(ctx, func(tx *gorm.DB) error {
		created, err := r.CreateTX(ctx, tx, invoice)
		if err != nil {
			return err
		}

		created.Status = model.InvoiceStatusPending
		updated, err = r.UpdateTX(ctx, tx, created)
		return err
	})
	if err != nil {
		return model.InvoiceModel{}, err
	}
	return updated, nil
}
```

The constructor, interface assertion, and existing Fx binding are unchanged:
the concrete repository already receives `*database.ProjectDB`, and no
additional provider is required. Add an integration test that proves a
callback error rolls back a preceding `CreateTX`, a successful callback
commits both writes, and a commit error reaches the caller when the database
test harness can induce one.

## Check before finishing

- The use case receives the port, never the concrete repository or GORM database.
- Every method uses caller context and one span named `Type.Method`.
- Single-record reads limit before first; targeted mutations check affected rows.
- A bulk cleanup may delete zero rows without error.
- The constructor, assertion, port comment, and Fx binding match the adapter.
- `WithTX` alone creates the adapter-local transaction; every `*TX` method
  receives the callback transaction and uses its caller context.
- The callback returns the first failure; integration coverage proves rollback
  and successful commit for the atomic operation.
- Add integration evidence for changed persistence behavior when that test contract applies.
