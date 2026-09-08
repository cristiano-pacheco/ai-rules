# Mappers

## Recipe: map one representation to another

Choose the package by the representation boundary before extracting a mapper:

| Transformation | Owner |
| --- | --- |
| Persistence model/view to canonical application value | Module `mapper/` |
| Application value or use-case output to CLI DTO | `cmd/mapper/` |
| HTTP DTO to use-case input, or output to HTTP DTO | HTTP adapter `mapper/` |

Follow project paths for these owners. A module mapper may import `model` and
`dto`, but not `usecase`, `cmd`, or HTTP packages. The use case assembles its
own output wrapper from mapped application values. Transport mappers may
import public use-case contracts and canonical DTOs, never GORM models.

Keep a trivial, single-use field copy inline at its owning boundary. Extract a
transformation when it is reused, assembles nested values or collections, parses
a representation, or has enough logic to need a helper. A single caller does
not justify keeping that helper as a private service or use-case method.

For example, a service's `toRunDTO`, `buildAgentInput`, or `mapSteps` belongs in
`mapper/` when its body only converts supplied values. Remove the receiver and
pass the source values explicitly. Inspect the body rather than relying on its
name. Split I/O from conversion at the caller.

A mapper contains only functions. It has no struct, interface, constructor,
context, I/O, logger, database call, provider client, or Fx registration.

Apply the project's private-function rule before selecting helper shape. If
package-level private functions are prohibited, compose meaningful exported
`To<Xxx>` conversions or keep a small sub-conversion inline; do not introduce a
mapper struct or move conversion into a service to obtain private methods.
Otherwise put public functions before private helpers. Name each public function
for its output with `To<Xxx>`. Return exactly one value, plus `error` only when
parsing or conversion can fail.

The following example belongs in the HTTP adapter mapper package:

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
call the single-item public mapper. The example below uses a private nested
conversion only in projects that allow package-level private functions. Under a
no-private-functions rule, use an exported `ToCustomerResponse` conversion and
update its call instead.

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
parse. Keep the underlying parsing detail out of the application contract while
preserving the cause according to the project's error pattern. The example uses
a sentinel-style error; projects requiring constructors use `errs.ErrX(cause)`.
Any parsing helper also follows the private-function rule above.

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

- The file and its imports follow the representation owner in the table above;
  no extracted conversion remains disguised as a private service method.
- Each public mapper begins with `To` and names its output.
- Every function has one output, with optional `error` as the second result.
- Collection functions call the single-item mapper.
- The file has no state, side effect, context, or infrastructure dependency.
- An HTTP mapper converts only HTTP DTOs and use-case contracts; no GORM model crosses that boundary.
