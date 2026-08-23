# HTTP DTOs

## Transport contracts

Put HTTP request and response contracts in the owning module's `http/dto/`
package. A request DTO describes JSON accepted by one endpoint. A response DTO
describes JSON returned by one endpoint. Give every exported JSON field its
wire name with a `json` tag.

Keep DTOs free of business methods, persistence concerns, and provider types.
HTTP DTOs do not become use-case inputs or outputs, even when their fields
match. A GORM model never reaches this package.

Represent omission, `null`, zero, and empty string deliberately when the
endpoint needs to distinguish them. Parse external enum strings and other
constrained values before application policy consumes them.

## Mapping

After decoding, map the request DTO explicitly to the operation input. Map the
operation output explicitly to the response DTO before encoding it. A pure
mapping function may live with the module's mapping code when it is reused; a
handler may keep a small mapping local when that is its only use.

Transport validation covers HTTP-shaped input: malformed JSON, path and query
syntax, supported media, and invalid external encodings. The use case decides
whether a valid transport value is allowed by business policy.

For collections, map query values to a dedicated application input and map
both items and collection metadata to a response DTO. Do not pass query values
or a transport pagination type into a repository.
