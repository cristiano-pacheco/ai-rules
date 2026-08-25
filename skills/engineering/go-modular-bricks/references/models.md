# GORM models

## Recipe: map a module table

Create `internal/modules/<module>/model/<entity>_model.go` for a table owned by
`<module>`. Read the migration first. It defines the exact table name, column
order, nullability, constraints, and defaults. Keep the file in this order:
package declaration, narrow imports, exported model type with its comment, then
`TableName` with its comment.

```go
package model

import "time"

// InvoiceModel stores an invoice row owned by the billing module.
type InvoiceModel struct {
	ID          uint64    `gorm:"primarykey"`
	Number      string    `gorm:"uniqueIndex"`
	CustomerID  uint64    `gorm:"index"`
	Note        *string
	AmountCents int64
	Metadata    []byte    `gorm:"type:jsonb"`
	Status      string    `gorm:"default:'pending'"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

// TableName returns the invoice table name.
func (*InvoiceModel) TableName() string {
	return "invoices"
}
```

Use `uint64` with `gorm:"primarykey"` for an ID. Use `uint64` for a required
foreign key and `*uint64` for a nullable foreign key. Map nullable text,
boolean, numeric, and timestamp columns to Go pointers. Map `TIMESTAMPTZ` to
`time.Time`, `JSONB` to `[]byte` with `gorm:"type:jsonb"`, numeric values to
`int64` or `*int64`, and small ordered values to `int` or `*int`.

Follow GORM's snake-case convention. Add a tag only for a primary key, index,
unique index, JSONB type, default, or a documented exception to the convention. A
composite index gives every participating field the same index name:

```go
InvoiceID uint64 `gorm:"uniqueIndex:idx_invoice_line"`
LineID    uint64 `gorm:"uniqueIndex:idx_invoice_line"`
```

Keep JSON tags, domain behavior, repository queries, and transport values out
of models. Use Go pointers instead of `database/sql` nullable values. Keep
fields in migration order. Change deployed tables and columns only through
migrations.

## Examples

Use a pointer for an optional field:

```go
Description *string
ExpiresAt   *time.Time
```

Use the join-table shape when the table has its own ID and relationship
constraint:

```go
type InvoiceLabelModel struct {
	ID        uint64    `gorm:"primarykey"`
	InvoiceID uint64    `gorm:"uniqueIndex:idx_invoice_label"`
	LabelID   uint64    `gorm:"uniqueIndex:idx_invoice_label"`
	CreatedAt time.Time
}
```

## Check before finishing

- The migration exists first and the model belongs to its owning module.
- The table name, columns, nullability, tags, indexes, and defaults match the migration.
- Every exported model and `TableName` method has a useful comment.
- No model leaks into a use-case contract or an HTTP response.
