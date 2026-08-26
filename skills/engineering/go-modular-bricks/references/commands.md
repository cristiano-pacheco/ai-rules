# Commands

## Recipe: add a business command

Keep `main.go` limited to `cmd.Execute()`. Put each executable operation in
`cmd/<command>.go` and register its Cobra command from `init`. A business
command parses flags, builds one application input, resolves one decorated
public use case, calls `Execute` exactly once, and renders only its command
result. It does not
validate business policy, query storage, open a transaction, call a provider,
or translate a technical error into a new business error.

Use the module's existing Fx composition helper. The command must receive the
decorated public use-case contract, not a repository, model, adapter, or raw
use-case implementation. Its `RunE` uses `cmd.Context()` and returns the error
after the command boundary has logged or rendered it according to local
convention.

```go
package cmd

import (
	"context"

	"github.com/cristiano-pacheco/bricks/pkg/ucdecorator"
	"github.com/spf13/cobra"
	"go.uber.org/fx"

	"example.com/project/internal/modules/catalog/usecase"
)

var publishProductID uint64

var publishProductCmd = &cobra.Command{
	Use:   "product:publish",
	Short: "Publish one product",
	RunE: func(cmd *cobra.Command, _ []string) error {
		return runPublishProduct(cmd, publishProductID)
	},
}

func init() {
	rootCmd.AddCommand(publishProductCmd)
	publishProductCmd.Flags().Uint64Var(&publishProductID, "product-id", 0, "Product identifier")
}

func runPublishProduct(cmd *cobra.Command, productID uint64) error {
	return runCommand(cmd.Context(), func(
		publishProductUseCase ucdecorator.UseCase[
			usecase.ProductPublishInput,
			usecase.ProductPublishOutput,
		],
	) error {
		_, err := publishProductUseCase.Execute(cmd.Context(), usecase.ProductPublishInput{
			ProductID: productID,
		})
		return err
	})
}

func runCommand(ctx context.Context, invoke any) (runErr error) {
	app := fx.New(commandModules(), fx.Invoke(invoke))
	if err := app.Start(ctx); err != nil {
		return err
	}
	defer func() {
		if err := app.Stop(context.Background()); err != nil && runErr == nil {
			runErr = err
		}
	}()
	return nil
}
```

`commandModules` is the project-owned Fx option that selects the shared
infrastructure and modules required by the command. Inspect it before use and
preserve its lifecycle, logger, and error-rendering behavior. If the project
does not have it, add it in the command package as the single command
composition seam. The module-specific `runPublishProduct` function should
supply only the decorated public use case and application input.

Use the same file order for a command: package, imports, flag variables,
`cobra.Command`, `init`, then command runner. Keep flags at package scope only
because Cobra registers them before execution. Convert flag values to the
application input at this boundary. Put command-specific expected errors in
the owning module's `errs` package and add their locale entries in every
existing module locale; do not create a command error package.

## Recipe: compose the server

`cmd/server.go` is infrastructure. It creates exactly one Fx application from
the Bricks platform modules required by the enabled capabilities,
`internal/shared.Module`, and every enabled business module. It starts and
stops the application through Fx. A module is not wired into the server until
this composition includes its `Module`.

```go
package cmd

import (
	"context"

	"go.uber.org/fx"

	"example.com/project/internal/modules/catalog"
	"example.com/project/internal/shared"
)

var serverCmd = &cobra.Command{
	Use:   "server",
	Short: "Run the HTTP server",
	RunE: func(cmd *cobra.Command, _ []string) error {
		app := fx.New(
			platformModules(),
			shared.Module,
			catalog.Module,
		)
		if err := app.Start(cmd.Context()); err != nil {
			return err
		}
		defer app.Stop(context.Background())
		return waitForShutdown(cmd.Context())
	},
}
```

`platformModules` and `waitForShutdown` stand for the project's existing
composition helpers. Keep the platform order used by the project: tracing, Chi
server, logger, validator, HTTP response handling, metrics, i18n, and use-case
decoration before shared and business modules. Do not hand-wire an HTTP server,
database connection, handler, or route in `cmd/server.go`. The process boundary
logs startup and shutdown errors through the configured logger. It uses the
command context for startup and the project's shutdown context for `Stop`.

## Recipe: execute migrations

`cmd/migrate.go` owns the `db:migrate` infrastructure command. It loads only
the database and migration runner dependencies, collects the registered module
migration file systems in deterministic order, and executes pending migrations.
It does not construct a use case or create an HTTP server.

```go
var migrateCmd = &cobra.Command{
	Use:   "db:migrate",
	Short: "Apply pending database migrations",
	RunE: func(cmd *cobra.Command, _ []string) error {
		return runMigrationCommand(cmd.Context())
	},
}

func init() {
	rootCmd.AddCommand(migrateCmd)
}
```

`runMigrationCommand` is the project's migration composition helper. It must
receive the same `group:"migration_filesystems"` contributions as the server,
use the configured write database, and close its Fx lifecycle before returning.
Add a module's migration contribution in the module `fx.go` and register the
module in both `cmd/server.go` and `cmd/migrate.go`. Never run a migration from
a handler, repository, use case, or package initializer.

## Check before finishing

- `main.go` starts only `cmd.Execute()`.
- Each business command maps to exactly one decorated public use case and executes it once.
- Server startup and migration execution stay infrastructure commands with
  their own Fx composition.
- Every changed command propagates Cobra's context, uses the established logger
  at the process boundary, and preserves typed module errors.
- A changed command follows `command-tests.md` for parsing, mapping, lifecycle,
  and failure proof. Business behavior remains in the use-case integration test.
