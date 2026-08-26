# Shared infrastructure

`shared` contains cross-module technical infrastructure that has no business
owner. Examples include configuration bootstrap, database setup, generic
transport primitives, and technical clients used by several modules.

Keep domain behavior with the module that owns the business capability.
Repositories and module policy belong with their module. Replace catch-all
helper packages with code under a clear owner.

Place a capability in `shared` only when the selected flow shows that several
modules need the same technical mechanism and no module owns its business
meaning. Keep its API technical, narrow, and independent of a module's domain
types.

Compose shared infrastructure in the application composition root, then inject
it into the modules that need it through their own boundaries.
