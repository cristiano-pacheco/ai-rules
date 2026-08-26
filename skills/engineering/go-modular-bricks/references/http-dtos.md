# HTTP DTOs

## Recipe: define one transport contract

Create `internal/modules/<module>/http/dto/<resource>_dto.go` in `package dto`.
Put request types first, then response types. Name a body accepted by an
operation `<Action><Resource>Request` and a body returned by an operation
`<Resource>Response` or `<Action><Resource>Response`. Give every exported wire
field an exact `json` tag.

```go
package dto

type CreateProductRequest struct {
	Name string `json:"name"`
}

type ProductResponse struct {
	ID   uint64 `json:"id"`
	Name string `json:"name"`
}
```

A DTO contains no business methods, GORM tags, persistence models, provider SDK
values, or application policy. HTTP DTOs never become use-case inputs or
outputs, even when fields match. Use pointers only when the HTTP contract must
distinguish an omitted value from `null`, an empty string, or a zero value.

## Recipe: map at the transport boundary

Decode the request into its DTO with the established request helper. Validate
URL and query syntax, content type, body syntax, and other external values at
this boundary.
Map the DTO to the operation input explicitly. Set `ctx := r.Context()` and
call the decorated use case with `ctx`. Map its output to a response DTO before
encoding it. Keep a single-use mapping in its handler; move a reused or
substantial pure mapping to
`internal/modules/<module>/mapper/<resource>_mapper.go`.

```go
func (h *ProductHandler) HandleCreateProduct(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var request dto.CreateProductRequest
	if err := request.ReadJSON(w, r, &request); err != nil {
		h.logger.Error("decode create product", logger.Error(err))
		h.errorHandler.Error(w, err)
		return
	}

	input := usecase.ProductCreateInput{Name: request.Name}
	output, err := h.productCreate.Execute(ctx, input)
	if err != nil {
		h.logger.Error("create product", logger.Error(err))
		h.errorHandler.Error(w, err)
		return
	}

	productResponse := dto.ProductResponse{ID: output.ID, Name: output.Name}
	if err := response.JSON(w, http.StatusCreated, productResponse, http.Header{}); err != nil {
		h.logger.Error("write create product response", logger.Error(err))
		h.errorHandler.Error(w, err)
		return
	}
}
```

Use the established Bricks `request` and `response` packages unless the project
has a local wrapper. The use case decides business validity, authorization, and
state transitions. It receives parsed application values, never a raw body,
query string, path value, HTTP request, response DTO, or GORM model.

## Recipe: map a collection contract

Map accepted query values to a dedicated list input. Map collection items and
promised metadata to a response DTO. Reject malformed query syntax
before calling the use case. The use case maps that input to primitive query
values or model-owned persistence criteria. The repository never receives
`url.Values`, a transport pagination type, or the application input.

```go
type ProductListResponse struct {
	Products []ProductResponse `json:"products"`
	Page     int               `json:"page"`
	PageSize int               `json:"page_size"`
	Total    int64             `json:"total"`
}
```

## Check before finishing

- The DTO file is in the owning module's `http/dto/` package and its public
  fields have exact JSON names.
- Decoding, external syntax checks, and mapping happen in the inbound adapter.
- Inputs and outputs remain application-owned types; models and provider values
  do not cross the HTTP boundary.
- Unit-test reused pure mappers when their behavior warrants focused proof.
- When the project has a composed HTTP test setup, cover changed decoding,
  mapping, status, serialization, and error behavior through that boundary.
