# Ports

## Ownership

Put an outbound port in the module whose application policy consumes it. The
port says what that policy needs, not what a database, provider, or framework
offers. Keep it narrow and name methods by the business operation they support.

```go
package ports

type InventoryReservation interface {
	Reserve(ctx context.Context, itemID uint64, amount int) (Reservation, error)
}
```

The module's adapter implements the port and maps between application values
and its infrastructure values. The adapter constructor returns its concrete
pointer. Fx binds that pointer to the port interface in the owning composition
root.

## Contract rules

Use application-owned values in port signatures. Do not expose GORM types,
HTTP types, provider SDK types, database handles, cache clients, or adapter
configuration through a port. Accept `context.Context` as the first parameter
when the operation can perform I/O.

Document exported port interfaces when the purpose, consistency rule, absence
behavior, or ownership is not obvious from their names. Keep comments on the
contract, not as restatements on its implementation.

Use an interface assertion for an exported adapter when it makes the binding
clear:

```go
var _ ports.InventoryReservation = (*InventoryGateway)(nil)
```

Do not introduce a port for a pure, local helper. Keep that code in a mapper or
pure service until it needs a replaceable collaborator.
