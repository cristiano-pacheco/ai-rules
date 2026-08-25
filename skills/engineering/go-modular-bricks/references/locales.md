# Locales

## Recipe: add a module locale file system

Keep module-owned translations in `internal/modules/<module>/locales/`.
Store each language in its own JSON file and embed the directory from
`locales.go`.

```text
internal/modules/catalog/locales/
├── locales.go
├── en.json
└── pt_BR.json
```

```go
package locales

import (
	"embed"

	"github.com/cristiano-pacheco/bricks/pkg/i18n/locale"
)

// Files contains the catalog module translations.
//
//go:embed *.json
var Files embed.FS

func NewFileSystem() locale.FileSystem {
	return locale.New(Files)
}
```

Register `NewFileSystem` from the owner module's `fx.go` as the locale group
the project i18n loader consumes. The project baseline uses
`group:"locale_filesystems"`.

```go
fx.Provide(
	fx.Annotate(
		locales.NewFileSystem,
		fx.ResultTags(`group:"locale_filesystems"`),
	),
)
```

Do not embed module locales from `cmd`, a handler, or `internal/shared`. The
server's i18n module collects the Fx group as `[]locale.FileSystem`.

## Recipe: add an expected-error translation

When an expected module error changes, allocate and return its typed error in
`internal/modules/<module>/errs/errs.go`. Then add its stable code below
`errors` in every existing module locale. Use the exact code as the key and a
safe sentence-case message as the value.

```json
{
  "errors": {
    "CATALOG_02": "Product is already published"
  }
}
```

Keep the error code, internal lowercase error message, status, and translation
keys stable after release. Map known technical outcomes to the typed module
error at the adapter boundary. Preserve unknown technical errors so the
established entry point can log and render them safely.

## Test and check before finishing

Add a focused test when locale registration, a locale file's schema, or a
translation fallback changes. Construct the project i18n loader with the
module's registered file system and assert the requested key resolves in every
supported locale. For an expected error, also assert its stable code, lowercase
internal message, and HTTP status at the module error boundary.

- The module owns the translated message and embeds only its own locale files.
- `NewFileSystem` returns the embedded files and `fx.go` contributes them once.
- Every expected-error code appears in every existing module locale.
- The i18n test covers changed registration, schema, or fallback behavior.
