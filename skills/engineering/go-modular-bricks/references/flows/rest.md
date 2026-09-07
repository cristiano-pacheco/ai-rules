# REST route

Use this route for a new or changed Bricks Chi endpoint.

## Inspect and classify

Inspect the owning module, its `fx.go`, and the closest comparable endpoint.
Classify the operation as a collection, single-resource read, create, update,
delete, or action. Infer established path, authentication, response, mapping,
and error conventions from that flow when they do not conflict with
`../data-flow.md`.

## Load the REST contracts

Read these references in full:

- `../http-dtos.md`
- `../http-handlers.md`
- `../http-routers.md`
- `../fx-wiring.md`
- `application.md`

Then select the applicable contracts:

| Endpoint impact | Read in full |
| --- | --- |
| Collection pagination, ordering, or filtering changes | `../pagination-filtering.md` |
| Module-owned middleware changes | `../http-middleware.md` |
| API documentation is requested or the project requires it for changed routes | `../api-documentation.md` |

`application.md` is the downstream router, not a contract to copy. Follow its
pointers before editing.

## Proof

Prove application and adapter behavior through the references selected by
`application.md`. When the project already has a composed HTTP test setup,
extend it to cover the changed route, method, status, serialization, and error
boundary. Isolated handler tests and a new endpoint-specific HTTP test framework
are outside this proof contract.
