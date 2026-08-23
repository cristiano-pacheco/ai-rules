# Integration tests

## Select the flow

Add integration evidence for a changed use case, repository, transaction,
migration-backed persistence flow, or module composition path. Put the test
under `test/integration/`, mirroring its implementation path:

| Implementation | Test path |
| --- | --- |
| `internal/modules/<module>/usecase/<noun>_<action>_usecase.go` | `test/integration/modules/<module>/usecase/<noun>_<action>_usecase_test.go` |
| `internal/modules/<module>/repository/<entity>_repository.go` | `test/integration/modules/<module>/repository/<entity>_repository_test.go` |

Use real controlled infrastructure for the database, cache, migrations, local
services, validation, repositories, and the changed use case. List every
dependency before writing the suite. An uncontrolled external provider is the
only dependency replaced by a double.

## Build the suite

Start the file with `//go:build integration` and use the external package name.
Keep the code order as package, imports, `TestMain`, suite type, suite runner,
`SetupSuite`, `TearDownSuite`, `SetupTest`, construction helpers, and test
methods. `SetupSuite` starts the controlled containers and applies migrations.
`TearDownSuite` stops them. `SetupTest` truncates test data, creates fresh
provider doubles, and builds a fresh SUT.

```go
//go:build integration

package publish_test

import (
	"context"
	"testing"

	"example.com/project/internal/modules/catalog/repository"
	"example.com/project/internal/modules/catalog/usecase"
	"example.com/project/internal/shared/database"
	"example.com/project/pkg/itestkit"
	"example.com/project/test/mocks"
	"github.com/stretchr/testify/suite"
)

func TestMain(m *testing.M) {
	itestkit.TestMain(m)
}

type ProductPublishTestSuite struct {
	suite.Suite
	kit     *itestkit.ITestKit
	db      *database.ProjectDB
	sut     *usecase.ProductPublishUseCase
	notifier *mocks.MockPublishNotifier
}

func TestProductPublishSuite(t *testing.T) {
	suite.Run(t, new(ProductPublishTestSuite))
}

func (s *ProductPublishTestSuite) SetupSuite() {
	s.kit = itestkit.New(itestkit.Config{
		PostgresImage:  "postgres:16-alpine",
		MigrationsPath: "file://migrations",
		Database:       "project_test",
		User:           "project_test",
		Password:       "project_test",
	})
	s.Require().NoError(s.kit.StartPostgres())
	s.Require().NoError(s.kit.RunMigrations())
	s.db = &database.ProjectDB{DB: s.kit.DB()}
}

func (s *ProductPublishTestSuite) TearDownSuite() {
	if s.kit != nil {
		s.kit.StopPostgres()
	}
}

func (s *ProductPublishTestSuite) SetupTest() {
	s.kit.TruncateTables(s.T())
	s.notifier = mocks.NewMockPublishNotifier(s.T())
	s.sut = usecase.NewProductPublishUseCase(
		repository.NewProductRepository(s.db),
		s.notifier,
	)
}

func (s *ProductPublishTestSuite) TestExecute_ExistingDraft_PersistsPublishedState() {
	// Arrange
	ctx := context.Background()
	product := s.createDraftProduct(ctx)

	// Act
	output, err := s.sut.Execute(ctx, usecase.ProductPublishInput{ProductID: product.ID})

	// Assert
	s.Require().NoError(err)
	s.Equal(product.ID, output.ProductID)
	s.assertProductPublished(ctx, product.ID)
}
```

Use the module's real `fx.go` providers when the assertion covers the module's
composition or decorated public use case. Otherwise construct the raw use case
with the same concrete adapters and pointer constructors that Fx provides.
Keep adapter interface assertions beside their production types. Register a
new adapter or decorator once in the owner `fx.go`; the integration suite must
not add an alternate runtime wiring path.

## Assert the observable result

Every test has Arrange, Act, Assert comments. Assert the returned output, the
persisted state, each introduced controlled side effect, and the negative state
on an error path. Test a repository through its port-visible behavior. Test a
use case through `Execute(ctx, input)` with real validation and migrations.

Use `s.Run` for independent value variants. For expected outcomes, assert the
module's typed `errs.Err...` value. The production change owns the stable code
and every module locale entry. For unexpected failures, assert that the
original error remains recognizable with `ErrorIs` when the contract permits
it. Do not assert tracing internals, logger formatting, or raw SQL that the
behavior does not expose.

Use the caller context for every SUT and adapter call. Services that return an
error log it in production before returning it. Repositories translate known
database outcomes to typed module errors and leave unknown driver errors
intact. The suite observes those contracts through returned errors and
persisted state.

## Check before finishing

- The file has the `integration` build tag and mirrors the changed source path.
- Containers, migrations, table cleanup, and fresh provider doubles isolate
  each test.
- Success and failure cases prove output, persisted state, side effects, and
  negative state.
- The test uses the owner module's Fx graph or the same raw constructors and
  concrete adapters it registers.
