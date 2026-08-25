# Modules

Give each module a business name and one data-ownership boundary. Keep its
application policy, ports, adapters, configuration, operational assets, and Fx
composition together whenever the module owns those responsibilities.

Create directories only for responsibilities the module actually has. A module
may own use cases, ports, application DTOs, typed errors, validated values,
pure mappings, repositories, external-capability adapters, models, transport
adapters, migrations, locales, templates, and configuration. Each artifact
remains in the owner that changes with its behavior.

A module calls another module through an injected public use-case API. The
caller maps its request to that public contract and keeps the dependency
explicit. It imports no internal package from the owning module.
This preserves the owner module's policy and data boundary.

If new behavior has no clear owner, identify its business capability before
creating packages. When two modules need the same policy, extract an explicitly
owned capability with a public contract rather than distribute the policy.
