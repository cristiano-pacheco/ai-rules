# Pagination and filtering

Use this contract for a collection endpoint that accepts page controls,
ordering, or filters. Give its application operation a dedicated collection
input and output. The HTTP layer parses query parameters into that input; the
repository receives only the application contract it needs.

## Query contract

Name each accepted query parameter and document its type, default, limit, and
meaning. Reject malformed values at the HTTP boundary. Treat an omitted filter
differently from an empty filter only when the operation defines a meaning for
that difference.

Expose a fixed allowlist of filter fields and sort fields. Parse external enum
and date values before policy consumes them. Never turn an arbitrary query key,
column name, or sort expression into a database query.

## Ordering and pages

Choose a documented default order and add a stable tie-breaker. The same order
must apply on every page or clients will see duplicates and gaps. Cap requested
page size at the operation's defined maximum. Reject or normalize an invalid
page according to the published HTTP contract.

Apply filters before computing the total and before taking the page. Use the
same filtered base query for both values. Keep database-specific query building
inside the repository adapter.

## Response metadata

Return collection items through a response DTO together with the metadata the
endpoint promises, such as page number, page size, total matching items, and
the active order. Do not make clients infer totals from a truncated list.
