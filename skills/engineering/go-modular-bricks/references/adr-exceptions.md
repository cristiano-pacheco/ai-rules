# Architecture exceptions

An architecture exception is a deliberate departure from a selected modular
contract. Record it in an ADR before implementing the departure.

Place the ADR in `docs/adrs`. It applies only when its content explicitly
justifies the violated contract for the current context. Follow the exception
as narrowly as the document describes it.

Search `docs/adrs` when the requested change or a comparable local flow
violates an invariant. Read a candidate ADR in full before relying on it and
cite it with the affected boundary. Treat a deviation without an applicable
ADR as a contract violation. Keep the changed flow compliant and report an
existing violation. If the requested change cannot comply, stop and ask before
creating an ADR or implementing the exception.

## Examples

### Good

```markdown
# ADR-0042: use a shared read model for order history

Status: accepted

The reporting module needs data from orders and billing. It will read a
published read model for 90 days, owned by reporting. Owner: platform team.
Remove this exception when the reporting API replaces the read model.
```

### Bad

```markdown
Use billing's repository from orders for now. Revisit later.
```
