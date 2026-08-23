# Modules

Give each module a business name and one data ownership boundary. Keep its
application policy, ports, adapters, configuration, operational assets, and Fx
composition together under that module when the responsibility exists.

Create directories only for responsibilities the module actually has. A module
may own use cases, ports, application DTOs, typed errors, validated values,
pure mappings, repositories, external-capability adapters, models, transport
adapters, migrations, locales, templates, and configuration. Each artifact
remains in the owner that changes with its behavior.

A module calls another module through an injected public use-case API. The
calling module translates its own request into that public contract and keeps
its dependency explicit. It depends on no internal package of the owner module.
This preserves the owner module's policy and data boundary.

When a new behavior has no clear owner, identify the business capability before
creating packages. When two modules need the same policy, extract an explicitly
owned capability with a public contract rather than distribute the policy.
