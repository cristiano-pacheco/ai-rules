# Mappers

## Pure boundary

Use a mapper for an explicit transformation between representations that is
reused or too large for one boundary. Put module mappers in `mapper/`, with one
`<name>_mapper.go` file per domain concept. A mapper is functions only: no
struct, interface, constructor, context, I/O, logging, or side effect.

Each exported mapper begins with `To`, receives one or more inputs, and returns
one output. It may return an error only when the transformation can fail.

## Examples

```go
func ToOrderConfirmInput(request dto.ConfirmOrderRequest) usecase.OrderConfirmInput {
	return usecase.OrderConfirmInput{OrderID: request.OrderID}
}

func ToOrderResponse(order model.Order) dto.OrderResponse {
	return dto.OrderResponse{ID: order.ID, Status: order.Status}
}
```

## Naming

Name public functions `ToXxx` for their output type, private helpers `toXxx`,
and collection functions `ToXxxList` or `ToXxxListResponse`.

## Composition

Place public mapping functions before private helpers. Use a private `to...`
helper for a shared sub-mapping. Add a slice mapper when that mapped value
appears in collections. Keep a mapper's direction explicit in its name and
avoid comments that repeat the conversion name.

Return a typed module error when parsing or conversion makes a mapping fail.
Keep business policy in the use case and persistence behavior in the adapter.
