# Application DTOs

## Use-case contracts

Define each operation's input and output in its use-case file. Give every
operation its own types, even when two operations have matching fields. Declare
fields explicitly and keep nested contract types in the same operation file
when they are not shared.

```go
type OrderConfirmInput struct {
	OrderID uint64
}

type OrderConfirmOutput struct {
	OrderID string
	Status  string
}
```

Application contracts have no JSON tags and do not reuse HTTP DTOs, persistence
models, or provider values. Map values at each boundary. A port may use a
dedicated application DTO when it improves a stable, business-shaped contract.

## Ownership

Put data shared by application collaborators in the module's `dto/` package
only when it has a real owner and more than one consumer. Keep it separate from
the port interface and from an adapter's private representation. Do not create
a generic DTO package for values that one operation already owns.

When a contract is part of a collection, state the item values and collection
metadata explicitly. Query parsing and HTTP response shape remain transport
concerns; persistence projections remain adapter concerns.
