# Data flow

Build each business behavior as one visible path:

```text
entry point -> input mapping -> use case -> consumer-owned port -> adapter -> infrastructure
entry point <- output mapping <- use-case output or typed error
```

An entry point receives transport, command, or event input. It validates input
that belongs to that boundary, maps it to the application input, invokes one
use case, maps the result, and returns through its local response mechanism.

The use case owns application policy. It decides validation timing,
authorization, state transitions, idempotency, transaction scope, and the
sequence of port calls. Its public input and output are application contracts.

A port states only what the use case needs. Its adapter performs I/O and maps
between application values and infrastructure values. The adapter receives the
caller context whenever the collaboration supports it.

Map every representation at its boundary. Transport DTOs, application inputs
and outputs, persistence models, provider values, and internal data contracts
may share fields but retain separate ownership and types.

Expected business outcomes cross the boundary as stable module errors. Technical
failures retain their identity until the established entry-point error path
renders them safely.

The resulting path assigns business policy to the use case and technical work
to adapters. The entry point and adapter remain focused on their own boundary.
