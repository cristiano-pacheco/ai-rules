# Mappers

## Recipe: map one representation to another

Create `internal/modules/<module>/mapper/<name>_mapper.go` for a reused
transformation or one too large to keep at its boundary. A mapper contains only
functions. It has no struct, interface, constructor, context, I/O, logger, database
call, provider client, or Fx registration.

Put public functions before private helpers. Name a public function for the
output with `To<Xxx>`. Return exactly one value, plus `error` only when parsing
or conversion can fail.

```go
package mapper

import (
	httpdto "example.com/project/internal/modules/order/http/dto"
	"example.com/project/internal/modules/order/usecase"
)

func ToOrderConfirmInput(request httpdto.ConfirmOrderRequest) usecase.OrderConfirmInput {
	return usecase.OrderConfirmInput{OrderID: request.OrderID}
}

func ToOrderResponse(output usecase.OrderConfirmOutput) httpdto.OrderResponse {
	return httpdto.OrderResponse{ID: output.OrderID, Status: output.Status}
}
```

The mapper makes source and target types explicit. Authorization, state
transitions, persistence behavior, and validation policy belong elsewhere.

## Recipe: collection and shared sub-mapping

When the same item appears in a collection, add a collection mapper. Let it
call the single-item public mapper. Keep a shared nested conversion private.

```go
func ToOrderListResponse(items []usecase.OrderListItem) []httpdto.OrderResponse {
	responses := make([]httpdto.OrderResponse, len(items))
	for i, item := range items {
		responses[i] = ToOrderResponse(item)
	}
	return responses
}

func ToOrderResponse(item usecase.OrderListItem) httpdto.OrderResponse {
	return httpdto.OrderResponse{ID: item.ID, Customer: toCustomerResponse(item.Customer)}
}

func toCustomerResponse(customer usecase.OrderCustomer) httpdto.CustomerResponse {
	return httpdto.CustomerResponse{ID: customer.ID, Name: customer.Name}
}
```

Use `To<Xxx>List` or `To<Xxx>ListResponse` for a slice. Use `to<Xxx>` for a
private sub-mapping. Do not add comments that merely repeat the conversion name.

## Recipe: fallible conversion

Return a typed module error only when the conversion itself can fail, such as a
parse. Keep the underlying parsing detail out of the application contract.

```go
func ToProductCreateInput(request httpdto.CreateProductRequest) (usecase.ProductCreateInput, error) {
	price, err := parsePrice(request.Price)
	if err != nil {
		return usecase.ProductCreateInput{}, errs.ErrInvalidPrice
	}
	return usecase.ProductCreateInput{Name: request.Name, Price: price}, nil
}
```

Return no error for ordinary field copies. If mapping needs data from a
repository or HTTP call, make that collaborator call in the use case or adapter,
then map its result.

## Check before finishing

- The file is under the owning module's `mapper/` directory.
- Each public mapper begins with `To` and names its output.
- Every function has one output, with optional `error` as the second result.
- Collection functions call the single-item mapper.
- The file has no state, side effect, context, or infrastructure dependency.
- An HTTP mapper converts only HTTP DTOs and use-case contracts; no GORM model crosses that boundary.
