# Shared infrastructure

`shared` contains cross-module technical infrastructure with no business
owner. Typical responsibilities include configuration bootstrap, database
setup, generic transport primitives, and technical clients used by several
modules.

Keep domain behavior with the module that owns the business capability.
Repositories, module policy, and catch-all helper packages belong with their
module or with a newly identified owner.

Place a capability in `shared` only after the impact map shows that several
modules need the same technical mechanism and no module owns its business
meaning. Keep its API technical, narrow, and independent of a module's domain
types.

Compose shared infrastructure in the application composition root, then inject
it into the modules that need it through their own boundaries.
