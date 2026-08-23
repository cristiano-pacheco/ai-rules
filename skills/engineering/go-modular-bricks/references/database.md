# Database infrastructure

## Recipe: compose one shared database

Put technical database setup in `internal/shared/database/`. It has no module
models, repositories, or business errors. Keep database configuration in the
shared configuration bootstrap, then inject the resulting shared database into
module repositories through their constructors.

Use the project's configured GORM driver and its wrapper name. The following
PostgreSQL shape is complete when the project uses `config.DatabaseConfig` with
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
	db, err := gorm.Open(postgres.Open(cfg.DSN), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("open database: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("get database handle: %w", err)
	}
	lifecycle.Append(fx.Hook{
		OnStop: func(context.Context) error {
			return sqlDB.Close()
		},
	})

	return &ProjectDB{DB: db}, nil
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

## Check before finishing

- Only shared technical code owns the driver, connection pool, and lifecycle hook.
- The concrete wrapper constructor returns a pointer and reports setup errors with context.
- Module repositories receive the shared wrapper and pass caller context to every query.
- Controlled integration tests create an isolated database, apply migrations, and close it with their test lifecycle.
