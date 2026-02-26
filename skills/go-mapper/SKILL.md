---
name: go-mapper
description: Generate Go mapper implementations following GO modular architecture conventions (interface-first design, Fx DI, stateless mapping). Use when creating mapping logic in internal/modules/<module>/mapper/ - mapping HTTP request DTOs to use case inputs, mapping domain/persistence models to HTTP response DTOs, mapping between layers of the application, or any struct-to-struct transformation that needs to be injectable and testable. Always use this skill when the user says "create a mapper", "add a mapper", "map request to input", "map model to response", "convert between structs", or when any layer needs a dedicated type for converting between representations.
---

# Go Mapper

Generate mapper files for GO modular architecture conventions.

## Two-File Pattern

Every mapper requires two files:

1. **Port interface**: `internal/modules/<module>/ports/<mapper_name>_mapper.go`
2. **Mapper implementation**: `internal/modules/<module>/mapper/<mapper_name>_mapper.go`

### Port File Structure

The port file contains only the interface definition with its documentation comment.

**Example structure:**
```go
package ports

import (
	"github.com/cristiano-pacheco/pingo/internal/modules/<module>/dto"
	"github.com/cristiano-pacheco/pingo/internal/modules/<module>/usecase"
	"github.com/cristiano-pacheco/pingo/internal/modules/<module>/model"
)

// UserMapper maps between User representations across application layers.
// It converts HTTP request DTOs to use case inputs and persistence models to response DTOs.
type UserMapper interface {
	ToCreateInput(req dto.CreateUserRequest) usecase.CreateUserInput
	ToResponse(m model.UserModel) dto.UserResponse
}
```

### Mapper File Structure

The mapper implementation file follows this order:

1. **Package declaration and imports**
2. **Struct definition** - the mapper implementation struct (empty for stateless mappers)
3. **Interface assertion** - compile-time check with `var _ ports.XxxMapper = (*XxxMapper)(nil)`
4. **Constructor** - `NewXxxMapper` function
5. **Public methods** - the mapping methods defined in the interface
6. **Private methods** - shared mapping helpers used by multiple public methods

**Example structure:**
```go
package mapper

import (
	"github.com/cristiano-pacheco/pingo/internal/modules/<module>/dto"
	"github.com/cristiano-pacheco/pingo/internal/modules/<module>/model"
	"github.com/cristiano-pacheco/pingo/internal/modules/<module>/ports"
)

type UserMapper struct{}

var _ ports.UserMapper = (*UserMapper)(nil)

func NewUserMapper() *UserMapper {
	return &UserMapper{}
}

func (m *UserMapper) ToCreateInput(req dto.CreateUserRequest) usecase.CreateUserInput {
	return usecase.CreateUserInput{
		Name:  req.Name,
		Email: req.Email,
	}
}

func (m *UserMapper) ToResponse(u model.UserModel) dto.UserResponse {
	return dto.UserResponse{
		ID:        u.ID,
		Name:      u.Name,
		Email:     u.Email,
		CreatedAt: u.CreatedAt,
	}
}
```

## Mapper Variants

### HTTP mapper (most common)

Maps between HTTP request/response DTOs and use case input/output structs or persistence models.

Port (`ports/user_mapper.go`):

```go
package ports

import (
	"github.com/cristiano-pacheco/pingo/internal/modules/<module>/dto"
	"github.com/cristiano-pacheco/pingo/internal/modules/<module>/model"
)

// UserMapper maps User data between HTTP and domain layers.
// ToCreateInput converts an HTTP create request into a use case input.
// ToResponse converts a persistence model into an HTTP response DTO.
type UserMapper interface {
	ToCreateInput(req dto.CreateUserRequest) usecase.CreateUserInput
	ToResponse(m model.UserModel) dto.UserResponse
	ToListResponse(models []model.UserModel) []dto.UserResponse
}
```

Implementation (`mapper/user_mapper.go`):

```go
package mapper

import (
	"github.com/cristiano-pacheco/pingo/internal/modules/<module>/dto"
	"github.com/cristiano-pacheco/pingo/internal/modules/<module>/model"
	"github.com/cristiano-pacheco/pingo/internal/modules/<module>/ports"
)

type UserMapper struct{}

var _ ports.UserMapper = (*UserMapper)(nil)

func NewUserMapper() *UserMapper {
	return &UserMapper{}
}

func (m *UserMapper) ToCreateInput(req dto.CreateUserRequest) usecase.CreateUserInput {
	return usecase.CreateUserInput{
		Name:  req.Name,
		Email: req.Email,
	}
}

func (m *UserMapper) ToResponse(u model.UserModel) dto.UserResponse {
	return dto.UserResponse{
		ID:        u.ID,
		Name:      u.Name,
		Email:     u.Email,
		CreatedAt: u.CreatedAt,
	}
}

func (m *UserMapper) ToListResponse(models []model.UserModel) []dto.UserResponse {
	responses := make([]dto.UserResponse, len(models))
	for i, u := range models {
		responses[i] = m.ToResponse(u)
	}
	return responses
}
```

### Mapper with private helper methods

Use private methods when multiple public methods share common field-mapping logic.

```go
package mapper

import (
	"github.com/cristiano-pacheco/pingo/internal/modules/<module>/dto"
	"github.com/cristiano-pacheco/pingo/internal/modules/<module>/model"
	"github.com/cristiano-pacheco/pingo/internal/modules/<module>/ports"
)

type ArticleMapper struct{}

var _ ports.ArticleMapper = (*ArticleMapper)(nil)

func NewArticleMapper() *ArticleMapper {
	return &ArticleMapper{}
}

func (m *ArticleMapper) ToResponse(a model.ArticleModel) dto.ArticleResponse {
	return dto.ArticleResponse{
		ID:     a.ID,
		Title:  a.Title,
		Author: m.toAuthorResponse(a),
	}
}

func (m *ArticleMapper) ToListResponse(models []model.ArticleModel) []dto.ArticleResponse {
	responses := make([]dto.ArticleResponse, len(models))
	for i, a := range models {
		responses[i] = m.ToResponse(a)
	}
	return responses
}

func (m *ArticleMapper) toAuthorResponse(a model.ArticleModel) dto.AuthorResponse {
	return dto.AuthorResponse{
		ID:   a.AuthorID,
		Name: a.AuthorName,
	}
}
```

### Mapper with dependencies (stateful)

Use when mapping requires external data (e.g., formatting config, locale, feature flags). This is rare — prefer stateless mappers.

```go
package mapper

import (
	"github.com/cristiano-pacheco/pingo/internal/modules/<module>/dto"
	"github.com/cristiano-pacheco/pingo/internal/modules/<module>/model"
	"github.com/cristiano-pacheco/pingo/internal/modules/<module>/ports"
)

type PriceMapper struct {
	currencyFormatter ports.CurrencyFormatter
}

var _ ports.PriceMapper = (*PriceMapper)(nil)

func NewPriceMapper(currencyFormatter ports.CurrencyFormatter) *PriceMapper {
	return &PriceMapper{
		currencyFormatter: currencyFormatter,
	}
}

func (m *PriceMapper) ToResponse(p model.PriceModel) dto.PriceResponse {
	return dto.PriceResponse{
		Amount:    p.Amount,
		Formatted: m.currencyFormatter.Format(p.Amount, p.Currency),
	}
}
```

## Method Naming Conventions

Choose the naming style that reads most naturally for the direction of mapping:

| Pattern | Meaning | Example |
|---|---|---|
| `ToXxx` | Maps to an `Xxx` type | `ToResponse`, `ToCreateInput` |
| `MapToXxx` | Same as `ToXxx`, use when disambiguation helps | `MapToUserResponse` |
| `FromXxx` | Constructs the mapper's primary type from `Xxx` | `FromRequest`, `FromModel` |
| `MapFromXxx` | Same as `FromXxx`, use when disambiguation helps | `MapFromCreateRequest` |

Prefer `ToXxx` for simple, clear cases. Use the `MapTo`/`MapFrom` prefix when the method name would otherwise be ambiguous or the struct has many similar mappings.

## Naming

- Port interface: `XxxMapper` (in `ports` package)
- Implementation struct: `XxxMapper` (in `mapper` package, same name — disambiguated by package)
- Constructor: `NewXxxMapper`, returns a pointer of the struct implementation
- Mapping methods: `ToXxx`, `MapToXxx`, `FromXxx`, or `MapFromXxx` depending on direction and clarity

## Fx Wiring

Add to `internal/modules/<module>/fx.go`:

```go
fx.Provide(
	fx.Annotate(
		mapper.NewUserMapper,
		fx.As(new(ports.UserMapper)),
	),
),
```

## Dependencies

Mappers depend on interfaces only. Most mappers are stateless and have no dependencies. When a mapper does have dependencies:

- `ports.XxxFormatter` — for value formatting (currency, dates, localization)
- Configuration values — passed as constructor parameters

## Critical Rules

1. **No standalone functions**: When a file contains a struct with methods, do not add standalone functions. Use private methods on the struct instead.
2. **Two files**: Port interface in `ports/`, implementation in `mapper/`
3. **Interface in ports**: Interface lives in `ports/<name>_mapper.go`
4. **Interface assertion**: Add `var _ ports.XxxMapper = (*XxxMapper)(nil)` below the struct
5. **Constructor**: MUST return pointer `*XxxMapper`
6. **Stateless by default**: Only add dependencies when mapping requires external data or configuration
7. **No context**: Mappers are pure transformations — never accept `context.Context`
8. **No errors**: Mappers never return errors — if conditional logic is needed, use private helper methods
9. **Private helpers**: Extract shared sub-mapping logic into private methods on the struct
10. **No comments on implementations**: Do not add redundant comments above methods in the implementations
11. **Add detailed comment on interfaces**: Provide comprehensive comments on the port interfaces to describe their purpose and mapping directions
12. **Slice helpers**: When mapping a single item, also add a list variant (e.g., `ToResponse` + `ToListResponse`) if the mapped type is ever returned in collections

## Workflow

1. Create port interface in `ports/<name>_mapper.go`
2. Create mapper implementation in `mapper/<name>_mapper.go`
3. Add Fx wiring to module's `fx.go`
4. Run `make lint` to verify code quality
5. Run `make nilaway` for static analysis
