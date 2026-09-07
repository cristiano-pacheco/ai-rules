# Architecture exceptions

First apply the project's documented source precedence. An explicit local
standard selecting direct injection, logging, test layout, or another supported
profile already resolves that choice. It does not require a new ADR just to
replace a generic example in this skill.

For an undocumented departure from a dependency or representation contract,
search the project's documented ADR location. If none is documented, check
`docs/adr` and `docs/adrs`. Read an applicable accepted ADR in full and apply
only the scope it justifies. Nearby violations do not authorize another one.

Keep new work compliant and report unrelated existing debt. Continue routine
implementation and fixes within the authorized task. Ask only when conflicting
project requirements leave a material decision unresolved, or compliance needs
a change outside the authorized scope. State the conflicting sources and the
specific decision needed. Create or change an ADR only when authorized.
