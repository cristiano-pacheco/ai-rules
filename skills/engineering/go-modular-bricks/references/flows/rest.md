# REST router

Use for an HTTP boundary in scope, not merely a feature reachable over HTTP.
Inspect the owning adapter and its immediate contracts. Select only matching
rows; adding an endpoint often matches several, editing one may match just one.

## Select HTTP contracts

| Responsibility in scope | Read in full | Stop condition / companion |
| --- | --- | --- |
| Request/response fields, JSON tags, transport DTO ownership or shape | `../http-dtos.md` | Existing DTOs used unchanged do not select this contract unless their wire guarantee is under review. |
| Decoding, transport validation, use-case invocation, status, response or error rendering | `../http-handlers.md` | Inspect the called use-case API; continue downstream only for an affected or unverified guarantee. |
| Path, method, route group, registration, or middleware attachment/scope | `../http-routers.md` | An existing router registering a new method on an existing handler need not change Fx. |
| Middleware implementation or transport-context behavior | `../http-middleware.md` | Add routers only if attachment/scope is affected; application authorization policy belongs to use cases. |
| Collection pagination, ordering, filters, or page metadata | `../pagination-filtering.md` | Add DTO, handler, and application contracts only for the boundaries that implement the affected query/response guarantee. |
| Requested API documentation, or documentation required by the project for this route | `../api-documentation.md` | A route change alone does not activate documentation. Documentation alone does not activate implementation contracts. |

A new endpoint normally selects handlers and routers; select HTTP DTOs if it
introduces or changes a wire representation. Inspect constructor and route-group
registration to determine whether composition also changes.

## Cross-boundary work

Use `application.md` only when a non-HTTP responsibility is in scope: for example,
representation mapping, a new/changed use-case contract, business error semantics,
new constructor dependencies, or Fx registration. Select its matching rows, not
all downstream contracts. A new transport mapping selects mappers even when
implemented inline; it does not automatically select persistence mapping.

Pure HTTP mapper changes can go directly to `application.md` for mappers and
unit tests; add the DTO or handler specialist only if that boundary's guarantee
also changes or is being judged. Passing an existing error to the established
renderer selects handlers, not error-catalog or locale work.

## Proof

Use the project's existing HTTP test setup to prove affected method, path,
middleware scope, status, serialization, and error behavior. Do not introduce
an endpoint-specific test framework or isolated handler tests by default.
Select application test contracts only when application/adapter behavior or a
composed integration seam is part of the proof. Project verification requirements
take precedence over these defaults.
