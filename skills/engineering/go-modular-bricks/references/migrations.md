# Migrations

## Recipe: change schema through an owned migration

Create an ordered up migration and its reversible down migration in the
project's migration location. When the project has no established location,
use `migrations/<sequence>_<verb>_<noun>.up.sql` and
`migrations/<sequence>_<verb>_<noun>.down.sql`. When the runner supports module
file systems, keep a module's schema change with that module's migration
contribution. Preserve applied migrations. Create a new ordered migration for
every deployed schema change.

For a new invoice table, write the schema first:

```sql
CREATE TABLE invoices (
    id BIGSERIAL PRIMARY KEY,
    number TEXT NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL,
    note TEXT NULL,
    amount_cents BIGINT NOT NULL,
    metadata JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoices_customer_id ON invoices (customer_id);
```

The down migration reverses only this migration:

```sql
DROP TABLE invoices;
```

Add the model after completing the SQL. Its table, column order, nullability,
indexes, and defaults must match the up migration. When adding a non-null column
to populated data, write an explicit backfill. Add the column as nullable,
backfill it, then make it non-null in a later migration if deployment safety
requires the split.

## Recipe: register module migrations

Put the module-owned migration files and its `embed.FS` in
`internal/modules/<module>/migrations/`. Use the migration contribution type
and group already consumed by the project runner. The module's `fx.go` provides
the contribution. This keeps server and migration commands on the same Fx graph
without making migration execution a use case.

```go
package migrations

import (
	"embed"

	"github.com/cristiano-pacheco/bricks/pkg/migration"
)

// Files contains the billing module SQL migrations.
//
//go:embed *.sql
var Files embed.FS

func NewFileSystem() migration.FileSystem {
	return migration.New(Files)
}
```

```go
fx.Provide(
	fx.Annotate(
		migrations.NewFileSystem,
		fx.ResultTags(`group:"migration_filesystems"`),
	),
)
```

Keep `NewFileSystem` aligned with the Bricks migration contribution type. Do
not invent a second runner or execute migrations from a handler,
repository, or use case.

## Check before finishing

- New SQL has a unique ordered name and the runner's required down path.
- The change preserves existing data and deployment ordering.
- The owner module registers its migration file system through Fx with
  `group:"migration_filesystems"`.
- The corresponding model and persistence integration test use the migrated schema.
