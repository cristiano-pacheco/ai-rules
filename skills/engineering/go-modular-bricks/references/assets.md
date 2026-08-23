# Assets

## Recipe: add a module-owned static resource

Put a static resource under the module that owns its business meaning:
`internal/modules/<module>/ui/assets/`. Do not create this directory for a
module that has no UI resource.

```text
internal/modules/catalog/ui/assets/
├── assets.go
└── product-published.html
```

Embed the files from the package that owns them. Keep package declarations,
imports, the embedded variable, then its constructor in that order.

```go
package assets

import (
	"embed"
	"io/fs"
)

// Files contains the catalog module static resources.
//
//go:embed *.html
var Files embed.FS

func NewFileSystem() fs.FS {
	return Files
}
```

Register the returned file system from `internal/modules/<module>/fx.go` using
the resource group already consumed by the project. Keep the group tag and
contribution type with the shared asset loader; do not create a second global
asset registry in a module.

```go
fx.Provide(
	fx.Annotate(
		assets.NewFileSystem,
		fx.ResultTags(`group:"asset_filesystems"`),
	),
)
```

The code block applies when the shared loader consumes `fs.FS` contributions
through `group:"asset_filesystems"`. If the project names its contribution type
or group differently, preserve the established type and tag while keeping this
constructor in the owning module. The server composes the collector. Handlers,
use cases, and repositories do not read embedded assets directly.

Use an asset through a narrow module service when application policy needs it.
That service receives the caller context for I/O, starts an adapter span for
filesystem or network work, logs returned I/O errors through the local logger,
and returns a typed module error only for an expected business outcome. A
pure `embed.FS` lookup needs none of those dependencies.

## Test and check before finishing

Add a package test for a changed embed pattern or resource lookup. Open the
expected file through `NewFileSystem`, assert that it exists, and assert its
content or parse result where that is part of behavior. Add an integration test
when an Fx-built component consumes the asset.

- The resource lives under its owner module's `ui/assets/` package.
- The embed pattern includes every required file and no generated output.
- The module registers exactly one contribution with the existing resource
  collector.
- A consumer does not bypass its boundary to open another module's asset.
