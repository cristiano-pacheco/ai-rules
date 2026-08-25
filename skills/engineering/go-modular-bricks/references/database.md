# Database infrastructure

## Recipe: compose one shared database

Put technical database setup in `internal/shared/database/`. It has no module
models, repositories, or business errors. Keep database configuration in the
shared configuration bootstrap, then inject the resulting shared database into
module repositories through their constructors.

Use the project's configured GORM driver and wrapper name. The following
PostgreSQL shape applies when the project uses `config.DatabaseConfig` with
`DSN` and the standard GORM driver:

```go
package database

import (
	"context"
	"fmt"

	"example.com/project/internal/shared/config"
	"go.uber.org/fx"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type ProjectDB struct {
	*gorm.DB
}

func NewProjectDB(lifecycle fx.Lifecycle, cfg config.DatabaseConfig) (*ProjectDB, error) {
	db, err := newProjectDB(lifecycle, cfg.DSN, "primary")
	if err != nil {
		return nil, err
	}

	return &ProjectDB{DB: db}, nil
}

func newProjectDB(lifecycle fx.Lifecycle, dsn string, role string) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("open %s database: %w", role, err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("get %s database handle: %w", role, err)
	}
	lifecycle.Append(fx.Hook{
		OnStop: func(context.Context) error {
			return sqlDB.Close()
		},
	})
	return db, nil
}
```

Provide `NewProjectDB` once from the application composition root. Do not open
a connection in a handler, repository constructor, use case, or test method.
Repository methods pass caller context to GORM, so request cancellation and
trace context reach the driver.

```go
var Shared = fx.Module(
	"database",
	fx.Provide(database.NewProjectDB),
)
```

Use the configured GORM logger. The process boundary that owns Fx startup logs
startup failures. Repository methods return driver errors; the entry point logs
and renders them through the established error path.

## Variation: compose separate read and write databases

`ProjectDB` remains the default wrapper. Use `ProjectReadDB` and
`ProjectWriteDB` only when configuration supplies two distinct database
connections. The read connection serves replica-safe reads. The write
connection serves writes, transactions, migrations, and read-after-write
consistency.

Put both connection values in the shared configuration. The example uses
`ReadDSN` and `WriteDSN`; keep the project's existing configuration names when
they already express the same distinction.

```go
package config

type ReadWriteDatabaseConfig struct {
	ReadDSN  string
	WriteDSN string
}
```

```go
package database

import (
	"example.com/project/internal/shared/config"
	"go.uber.org/fx"
	"gorm.io/gorm"
)

type ProjectReadDB struct {
	*gorm.DB
}

type ProjectWriteDB struct {
	*gorm.DB
}

func NewProjectReadDB(
	lifecycle fx.Lifecycle,
	cfg config.ReadWriteDatabaseConfig,
) (*ProjectReadDB, error) {
	db, err := newProjectDB(lifecycle, cfg.ReadDSN, "read")
	if err != nil {
		return nil, err
	}
	return &ProjectReadDB{DB: db}, nil
}

func NewProjectWriteDB(
	lifecycle fx.Lifecycle,
	cfg config.ReadWriteDatabaseConfig,
) (*ProjectWriteDB, error) {
	db, err := newProjectDB(lifecycle, cfg.WriteDSN, "write")
	if err != nil {
		return nil, err
	}
	return &ProjectWriteDB{DB: db}, nil
}
```

Register both constructors from the shared composition root. Omit
`NewProjectDB`; providing all three constructors makes the selected database
topology ambiguous.

```go
var Shared = fx.Module(
	"database",
	fx.Provide(
		database.NewProjectReadDB,
		database.NewProjectWriteDB,
	),
)
```

In a read/write topology, inject `*database.ProjectWriteDB` into
`TransactionProvider` and the migration runner. Keep each connection's
lifecycle hook and driver logger independent. Integration tests need evidence
that read methods use the read wrapper, writes use the write wrapper, and a
read-after-write path stays on the write wrapper.

## Check before finishing

- Only shared technical code owns the driver, connection pool, and lifecycle hook.
- The concrete wrapper constructor returns a pointer and reports setup errors
  with context.
- Module repositories receive `ProjectDB` by default, or the selected read and
  write wrappers, and pass caller context to every query.
- A read/write deployment gives every repository an explicit read or write
  wrapper for each query, and gives transactions and migrations the write
  wrapper.
- Controlled integration tests create an isolated database, apply migrations,
  and close it through the test lifecycle.
