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
