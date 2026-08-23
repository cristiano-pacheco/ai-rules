# Architecture exceptions

An architecture exception is a deliberate departure from a selected modular
contract. Record it in an ADR before implementing the departure.

Place the ADR in the repository's established ADR location. State the context,
the contract that cannot be followed, the decision, alternatives considered,
the affected modules and dependencies, the owner, and a removal condition or
review date.

Keep the exception narrow. The affected code follows the ADR exactly, and the
impact map names the ADR with every changed boundary it authorizes.

An undocumented deviation remains a contract violation. Restore the selected
flow or obtain the ADR decision before completing the change.

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
