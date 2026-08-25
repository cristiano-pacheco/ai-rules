# External-provider doubles

## Keep the integration boundary real

An integration suite uses the real database, migrations, cache, local services,
validators, repositories, and use case. Replace only an external provider that
remains outside test control, such as an email gateway, payment API, or remote
HTTP service.

The provider contract stays consumer-owned at
`internal/modules/<module>/ports/<name>_provider.go`. Its concrete adapter
lives in `internal/modules/<module>/provider/<name>_provider.go`, retains the
compile-time assertion below the type, returns a pointer from
`New<Name>Provider`, receives caller context, starts its adapter span, logs a
returned I/O error, and binds to the port in the owner `fx.go`. The integration
suite replaces that binding only at this uncontrolled seam.

## Configure the generated mock

Generate the mock under `test/mocks/`; do not hand-write it. Name it
`Mock<Name>Provider` and construct it with `s.T()` inside `SetupTest`.
Expectation setup belongs in Arrange. Match a context parameter with
`mock.Anything`. Capture an externally visible request with `Run` when the
assertion needs its content.

```go
type receiptRecord struct {
	orderID uint64
	email   string
}

type OrderConfirmTestSuite struct {
	suite.Suite
	receiptProvider *mocks.MockReceiptProvider
	receipts        []receiptRecord
}

func (s *OrderConfirmTestSuite) SetupTest() {
	s.receipts = nil
	s.receiptProvider = mocks.NewMockReceiptProvider(s.T())
}

func (s *OrderConfirmTestSuite) expectReceipt() {
	s.receiptProvider.On("Issue", mock.Anything, mock.Anything).
		Run(func(args mock.Arguments) {
			request := args.Get(1).(dto.ReceiptRequest)
			s.receipts = append(s.receipts, receiptRecord{
				orderID: request.OrderID,
				email:   request.Email,
			})
		}).
		Return(nil).
		Once()
}
```

Use `.Maybe()` only when a metric, logger, or optional provider call is not the
behavior under test. In a provider-failure test, return a real sentinel error
from the mock, call the use case with a caller context, and assert the
documented error path and negative persisted state. The provider adapter owns
technical error logging; a module maps only expected business outcomes to
`errs` and locale entries.

## Check before finishing

- Every real local dependency stays real in the integration suite.
- A double corresponds to one uncontrolled provider port and is fresh per test.
- The suite asserts captured provider input or the documented provider-failure
  result, rather than mock implementation details.
- Production provider construction, interface assertion, context, tracing,
  logging, typed errors, locales, and Fx binding remain in the owner module.
