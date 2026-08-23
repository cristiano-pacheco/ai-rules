# Data flow

## Recipe: map one behavior through its owner

Build each business behavior as one visible path. Record its owner and every
representation before editing:

```text
entry point -> input mapping -> use case -> consumer-owned port -> adapter -> infrastructure
entry point <- output mapping <- use-case output or typed error
```

The inbound adapter lives under its owner module. An HTTP adapter uses
`internal/modules/<module>/http/chi/handler/`; a command uses `cmd/`; an
application operation uses `internal/modules/<module>/usecase/`; and an
outbound contract lives in `internal/modules/<module>/ports/`. The concrete
adapter stays beside its mechanism, such as `repository/`, `client/`,
`provider/`, `service/`, or `cache/`. The module's `fx.go` is the only place
that joins a concrete adapter to a port or exposes an inbound contribution.

An entry point receives transport, command, or event input. It validates syntax
that belongs to that boundary, maps it to an explicit application input, calls
one public decorated use case with the caller context, maps the output, and
returns through its local response mechanism. The entry point logs every
returned error before its established renderer or command boundary handles it.

The use case owns application policy. It decides validation timing,
authorization, state transitions, idempotency, transaction scope, and the
sequence of port calls. Its public input and output are application contracts.

A port states only what the use case needs. Its adapter performs I/O and maps
between application values and infrastructure values. A stateful adapter has a
concrete type, an interface assertion immediately below it, and a named-field,
pointer-returning constructor. Each I/O method receives caller
`context.Context` first, starts one `Type.Method` span, defers `span.End()`,
and logs an error before returning it when the local adapter convention owns
logging.

Map every representation at its boundary. Transport DTOs, application inputs
and outputs, persistence models, provider values, and internal data contracts
may share fields but retain separate ownership and types.

Expected business outcomes cross the boundary as stable module errors in
`internal/modules/<module>/errs/errs.go`. Allocate the next module code, use a
lowercase internal message and matching HTTP status, then add the code to every
existing module locale. Technical failures retain their identity until the
established entry-point error path renders them safely.

The resulting path assigns business policy to the use case and technical work
to adapters. Prove a pure deterministic boundary with a neighboring unit test.
Prove a changed use case or persistence flow with an integration test that uses
real controlled infrastructure. The test calls the same public boundary the
entry point calls and asserts its output, typed errors, persisted state, and
side effects.

## Examples

### Good

```go
input := usecase.CreateProductInput{Name: createRequest.Name}
output, err := h.createProduct.Execute(r.Context(), input)
if err != nil {
	return dto.ProductResponse{}, err
}

return dto.ProductResponse{ID: output.ID, Name: output.Name}, nil
```

### Bad

```go
product := model.ProductModel{Name: createRequest.Name}
if err := h.db.Create(&product).Error; err != nil {
	return dto.ProductResponse{}, err
}
return dto.ProductResponse{ID: product.ID, Name: product.Name}, nil
```
