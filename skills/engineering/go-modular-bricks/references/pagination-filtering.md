# Pagination and filtering

Use this contract for collection endpoints that accept page controls, ordering,
or filters. Give the application operation a dedicated collection input and
output. The HTTP layer parses query parameters into that input. The use case
maps it to primitive repository arguments or model-owned persistence criteria;
the repository does not receive the application input.

## Query contract

Name each accepted query parameter and document its type, default, limit, and
meaning. Reject malformed values at the HTTP boundary. Treat an omitted filter
differently from an empty filter only when the operation defines a meaning for
that difference.

Expose a fixed allowlist of filter fields and sort fields. Parse external enum
and date values before policy consumes them. Never turn an arbitrary query key,
column name, or sort expression into a database query.

## Ordering and pages

Choose a documented default order and add a stable tie-breaker. Apply the same
order on every page; otherwise clients may see duplicates or gaps. Cap
requested page size at the operation's defined maximum. Reject or normalize an
invalid page according to the published HTTP contract.

Apply filters before computing the total and before taking the page. Use the
same filtered base query for both values. Keep database-specific query building
inside the repository adapter.

## Response metadata

Return collection items and promised metadata through a response DTO. Metadata
may include page number, page size, total matching items, and active order. Do
not make clients infer totals from a truncated list.
