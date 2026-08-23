# Mappers

## Recipe: map one representation to another

Create `internal/modules/<module>/mapper/<name>_mapper.go` for a transformation
that is reused or too large to keep at one boundary. A mapper contains functions
only. It has no struct, interface, constructor, context, I/O, logger, database
call, provider client, or Fx registration.

Put public functions before private helpers. Name a public function for the
output with `To<Xxx>`. Return exactly one value, plus `error` only when parsing
or conversion can fail.

```go
package mapper

import (
	"example.com/project/internal/modules/order/dto"
	"example.com/project/internal/modules/order/model"
	"example.com/project/internal/modules/order/usecase"
)

func ToOrderConfirmInput(request dto.ConfirmOrderRequest) usecase.OrderConfirmInput {
	return usecase.OrderConfirmInput{OrderID: request.OrderID}
}

func ToOrderResponse(order model.OrderModel) dto.OrderResponse {
	return dto.OrderResponse{ID: order.ID, Status: order.Status}
}
```

The mapper makes the source and target types explicit. It does not decide
authorization, state transitions, persistence behavior, or validation policy.

## Recipe: collection and shared sub-mapping

When the same item appears in a collection, add a collection mapper. Let it
call the single-item public mapper. Keep a shared nested conversion private.

```go
func ToOrderListResponse(orders []model.OrderModel) []dto.OrderResponse {
	responses := make([]dto.OrderResponse, len(orders))
	for i, order := range orders {
		responses[i] = ToOrderResponse(order)
	}
	return responses
}

func ToOrderResponse(order model.OrderModel) dto.OrderResponse {
	return dto.OrderResponse{ID: order.ID, Customer: toCustomerResponse(order)}
}

func toCustomerResponse(order model.OrderModel) dto.CustomerResponse {
	return dto.CustomerResponse{ID: order.CustomerID, Name: order.CustomerName}
}
```

Use `To<Xxx>List` or `To<Xxx>ListResponse` for a slice. Use `to<Xxx>` for a
private sub-mapping. Do not add comments that merely repeat the conversion name.

## Recipe: fallible conversion

Return a typed module error only when the conversion itself can fail, such as a
parse. Keep the underlying parsing detail out of the application contract.

```go
func ToProductModel(request dto.CreateProductRequest) (model.ProductModel, error) {
	price, err := parsePrice(request.Price)
	if err != nil {
		return model.ProductModel{}, errs.ErrInvalidPrice
	}
	return model.ProductModel{Name: request.Name, Price: price}, nil
}
```

Do not return an error for ordinary field copies. Do not hide a repository or
HTTP call inside a mapper to obtain a missing field. Make that collaborator call
in the use case or adapter, then map its result.

## Check before finishing

- The file is under the owning module's `mapper/` directory.
- Each public mapper begins with `To` and names its output.
- Every function has one output, with optional `error` as the second result.
- Collection functions call the single-item mapper.
- The file has no state, side effect, context, or infrastructure dependency.
