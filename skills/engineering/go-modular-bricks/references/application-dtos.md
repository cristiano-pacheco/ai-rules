# Application DTOs

## Decide the owner before creating a type

Use an operation contract for every value that enters or leaves one use case.
Define it in `internal/modules/<module>/usecase/<noun>_<action>_usecase.go`,
beside the owning use case. Use a module `dto/` type only when a service, cache,
or at least two application collaborators need the same non-operation value.

Keep transport requests and responses in the HTTP `dto/` package. Keep GORM
records in `model/`. Neither crosses into an operation contract. Map at the
boundary with a mapper.

## Recipe: use-case input and output

For `OrderConfirm`, create
`internal/modules/<module>/usecase/order_confirm_usecase.go`. Put the types in
this order: input, output, use-case struct, constructor, `Execute`, then private
methods.

```go
package usecase

type OrderConfirmInput struct {
	OrderID uint64 `validate:"required"`
}

type OrderConfirmOutput struct {
	OrderID uint64
	Status  string
}
```

Follow these rules exactly:

1. Name the types `<Noun><Action>Input` and `<Noun><Action>Output`, in that
   order. `OrderConfirmInput` is correct. `ConfirmOrderInput` is not.
2. Define both types, including `struct{}` when the operation has no fields.
3. Declare every field explicitly. A nested operation-only value belongs in the
   same file and is also declared explicitly.
4. Put `validate` tags on simple input constraints. Call the shared validator on
   the whole input as the first action in `Execute`.
5. Add no `json`, database, or provider tags. The type is an application
   contract, not a transport or persistence record.
6. Do not embed or alias another use case's input or output. Matching fields do
   not make two operations one contract.
7. Do not expose an HTTP request, response, GORM model, SDK value, or a foreign
   module's internal type in a field.

## Recipe: shared application data

Create `internal/modules/<module>/dto/<service_name>_dto.go` only after naming
at least two application consumers or one service/cache port that needs the
shape. Keep the file to its input and output structs.

```go
package dto

type SendEmailConfirmationInput struct {
	UserID                uint64
	ConfirmationTokenHash []byte
}
```

Use this shape in a module service port, not in a use-case boundary:

```go
type SendEmailConfirmationService interface {
	Execute(ctx context.Context, input dto.SendEmailConfirmationInput) error
}
```

Keep an operation's input and output with that operation, even if a service
later has similar fields. Extract a business-shaped value only when it has a
clear owner and real reuse. A catch-all `dto` package has neither.

## Collection contracts

Give a collection operation its own explicit input and output. The HTTP handler
parses query strings; the repository owns its query implementation.

```go
type ProductListInput struct {
	Page     int
	PageSize int
	Status   string
}

type ProductListOutput struct {
	Products []ProductListItem
	Total    int64
}

type ProductListItem struct {
	ID   uint64
	Name string
}
```

Do not put HTTP query names, response JSON tags, SQL fragments, or GORM clauses
in these types. Add only the values the use case needs to decide policy and the
values it promises to return.

## Check before finishing

- The input and output sit in the owning use-case file.
- Both operation types exist and no other operation reuses them.
- Every field is application-owned and explicit.
- Mapping occurs at the HTTP, provider, or persistence boundary.
- A module `dto/` file has a named application consumer beyond one use case.
