# Templates

## Recipe: add a module-owned template

Put UI templates under `internal/modules/<module>/ui/templates/`. A template
belongs to the module whose behavior supplies its data and decides when it is
rendered. Keep its static partials next to it when they have the same owner;
place reusable cross-module technical rendering support in `internal/shared`.

```text
internal/modules/catalog/ui/templates/
├── templates.go
└── product-published.html.tmpl
```

Embed the template files and parse them once in a pointer-returning
constructor. Constructor-time parsing is fallible setup work, so return the
error with operation context. Use named fields and keep the file order as
package, imports, embedded files, type, constructor, public methods, then
private methods.

```go
package templates

import (
	"bytes"
	"embed"
	"fmt"
	"html/template"

	"example.com/project/internal/modules/catalog/dto"
)

// Files contains the catalog module templates.
//
//go:embed *.html.tmpl
var Files embed.FS

type ProductPublishedTemplates struct {
	templates *template.Template
}

func NewProductPublishedTemplates() (*ProductPublishedTemplates, error) {
	templates, err := template.New("product-published.html.tmpl").ParseFS(
		Files,
		"product-published.html.tmpl",
	)
	if err != nil {
		return nil, fmt.Errorf("parse product published template: %w", err)
	}

	return &ProductPublishedTemplates{templates: templates}, nil
}

func (t *ProductPublishedTemplates) Render(
	data dto.ProductPublishedTemplateData,
) (string, error) {
	var output bytes.Buffer
	if err := t.templates.ExecuteTemplate(&output, "product-published.html.tmpl", data); err != nil {
		return "", fmt.Errorf("render product published template: %w", err)
	}
	return output.String(), nil
}
```

`ProductPublishedTemplateData` is a module DTO, not an HTTP DTO, GORM model,
provider type, or an untyped `map[string]any`. Define it in
`internal/modules/<module>/dto/product_published_template.go`.

```go
package dto

type ProductPublishedTemplateData struct {
	ProductName string
	ProductURL  string
}
```

A template renderer consumed by application policy implements a consumer-owned
port, declares a compile-time assertion, and is bound in Fx.

```go
package ports

import "example.com/project/internal/modules/catalog/dto"

// ProductPublishedRenderer renders the catalog publication template.
type ProductPublishedRenderer interface {
	Render(data dto.ProductPublishedTemplateData) (string, error)
}
```

```go
package templateadapter

import (
	"example.com/project/internal/modules/catalog/dto"
	"example.com/project/internal/modules/catalog/ports"
	"example.com/project/internal/modules/catalog/ui/templates"
)

type ProductPublishedRenderer struct {
	templates *templates.ProductPublishedTemplates
}

var _ ports.ProductPublishedRenderer = (*ProductPublishedRenderer)(nil)

func NewProductPublishedRenderer(
	templates *templates.ProductPublishedTemplates,
) *ProductPublishedRenderer {
	return &ProductPublishedRenderer{templates: templates}
}

func (r *ProductPublishedRenderer) Render(
	data dto.ProductPublishedTemplateData,
) (string, error) {
	return r.templates.Render(data)
}
```

Register the parsing constructor and, when it is a port adapter, its concrete
renderer from the module composition root:

```go
fx.Provide(
	templates.NewProductPublishedTemplates,
	fx.Annotate(
		templateadapter.NewProductPublishedRenderer,
		fx.As(new(ports.ProductPublishedRenderer)),
	),
)
```

`Render` has no context, span, or logger when it only executes an in-memory
template. Add context and an adapter span only when rendering performs I/O.
Log a returned I/O error through the adapter logger; preserve unexpected
technical errors and use the module `errs` package only for expected business
outcomes. Do not load or parse templates in a handler, use case, or package
initializer.

## Test and check before finishing

Test the constructor and every changed render path in
`internal/modules/<module>/ui/templates/templates_test.go`. Parse the embedded
files through `NewProductPublishedTemplates`, render a complete DTO, and assert
the relevant output. Add an error-path test for malformed template syntax when
the constructor behavior changes. Test the port-visible adapter behavior when a
use case consumes it.

- Templates and template data stay with the owner module.
- Parsing happens once in the fallible constructor and Fx owns that lifecycle.
- A policy-consumed renderer has port, concrete adapter, assertion, pointer
  constructor, and Fx binding.
- Tests prove changed parsing and output behavior.
