# Unit tests

## Select the seam

Add a unit test when a changed validator, enum, mapper, or pure service has a
deterministic contract. Put it beside the implementation:

| Implementation | Test path |
| --- | --- |
| `internal/modules/<module>/validator/<name>_validator.go` | `internal/modules/<module>/validator/<name>_validator_test.go` |
| `internal/modules/<module>/enum/<name>_enum.go` | `internal/modules/<module>/enum/<name>_enum_test.go` |
| `internal/modules/<module>/mapper/<name>_mapper.go` | `internal/modules/<module>/mapper/<name>_mapper_test.go` |
| `internal/modules/<module>/service/<name>_service.go` | `internal/modules/<module>/service/<name>_service_test.go` |

Use the external package name, such as `validator_test`. Test a use case or a
repository through the integration contract instead. Select success, each
expected typed error, and boundary values that can change behavior. When the
change creates an expected error, assert the `errs.Err...` value and update its
stable locale entries in the owning module.

## Test pure code

For a function, value object, enum, mapper, or dependency-free service, use
top-level tests. Name every case `Test<TypeOrFunction>_<Scenario>_<Result>`.
Use a table when one operation has several independent inputs. Keep each test
in Arrange, Act, Assert order.

```go
package enum_test

import (
	"testing"

	"example.com/project/internal/modules/catalog/enum"
	"example.com/project/internal/modules/catalog/errs"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewProductState_AllowedValues_ReturnState(t *testing.T) {
	// Arrange
	tests := []struct {
		name  string
		value string
	}{
		{name: "draft", value: enum.ProductStateDraft},
		{name: "published", value: enum.ProductStatePublished},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Act
			state, err := enum.NewProductState(tt.value)

			// Assert
			require.NoError(t, err)
			assert.Equal(t, tt.value, state.String())
		})
	}
}

func TestNewProductState_UnknownValue_ReturnsTypedError(t *testing.T) {
	// Arrange
	value := "retired"

	// Act
	state, err := enum.NewProductState(value)

	// Assert
	require.ErrorIs(t, err, errs.ErrInvalidProductState)
	assert.Equal(t, enum.ProductState{}, state)
}
```

Use `require` for preconditions and errors that must stop the test. Use
`assert` or the equivalent `suite.Suite` method for value comparisons. Do not
test span internals, log formatting, or an implementation's private helper.

## Test code with collaborators

When a deterministic implementation has injected collaborators, use a
`suite.Suite`. Keep the file order as package, imports, suite type,
`SetupTest`, suite runner, then test methods. `SetupTest` creates a fresh SUT
and mocks for every test. Generate mocks in `test/mocks/` with the project's
mock generator; construct them with `s.T()` so cleanup checks expectations.

```go
package service_test

import (
	"context"
	"testing"

	"example.com/project/internal/modules/catalog/service"
	"example.com/project/test/mocks"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/suite"
)

type PublishNotifierTestSuite struct {
	suite.Suite
	sut    *service.PublishNotifier
	sender *mocks.MockMessageSender
}

func (s *PublishNotifierTestSuite) SetupTest() {
	s.sender = mocks.NewMockMessageSender(s.T())
	s.sut = service.NewPublishNotifier(s.sender)
}

func TestPublishNotifierSuite(t *testing.T) {
	suite.Run(t, new(PublishNotifierTestSuite))
}

func (s *PublishNotifierTestSuite) TestExecute_ValidProduct_SendsMessage() {
	// Arrange
	ctx := context.Background()
	s.sender.On("Send", mock.Anything, uint64(42)).Return(nil)

	// Act
	err := s.sut.Execute(ctx, 42)

	// Assert
	s.Require().NoError(err)
}
```

Match `context.Context` arguments with `mock.Anything`. Use
`mock.AnythingOfType` only when the concrete type matters. Mark logging and
metrics expectations `.Maybe()` when the test does not make them observable.
Construct the SUT through its pointer constructor, retain its compile-time
interface assertion in production code, and bind its port in the owner
module's `fx.go`; the unit test calls the constructor directly.

## Check before finishing

- Every changed deterministic boundary has success, expected-error, and
  behavior-changing edge-case evidence.
- Test names state the operation, scenario, and observable result.
- Tests use caller context where the method accepts it and compare typed errors
  with `ErrorIs`.
- The test package, mock location, constructor, interface assertion, Fx
  binding, error code, and locale entries match the changed production
  contract.
