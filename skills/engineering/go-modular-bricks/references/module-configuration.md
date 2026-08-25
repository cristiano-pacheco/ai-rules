# Module configuration

## Recipe: add configuration owned by a module

Create `internal/modules/<module>/config/config.go` only for settings owned by
the module. Keep its `Config` type in `package config`; do not place module
settings in `internal/shared/config` or pass primitive configuration values
through unrelated constructors.

```go
package config

type Config struct {
	PublicationEnabled bool `config:"publication_enabled"`
	PublicBaseURL      string `config:"public_base_url"`
}
```

Add the matching YAML under the module's global section. The YAML key, struct
field, and tag use one naming contract.

```yaml
app:
  catalog:
    publication_enabled: true
    public_base_url: "http://localhost:8080"
```

Provide that type from the module composition root. Use the module path as the
only lookup boundary.

```go
package catalog

import (
	bricksconfig "github.com/cristiano-pacheco/bricks/pkg/config"
	"go.uber.org/fx"

	moduleconfig "example.com/project/internal/modules/catalog/config"
)

var Module = fx.Module(
	"catalog",
	bricksconfig.Provide[moduleconfig.Config]("app.catalog"),
	fx.Provide(
		func(loaded bricksconfig.Config[moduleconfig.Config]) moduleconfig.Config {
			return loaded.Get()
		},
	),
)
```

Preserve the module's existing `fx.go` ordering. Place the typed configuration
provider with other module-wide inputs, before constructors that consume it. A
constructor receives `config.Config`, not a YAML map, a global configuration
type, or an individual primitive supplied separately.

```go
type PublicationService struct {
	cfg config.Config
}

func NewPublicationService(cfg config.Config) *PublicationService {
	return &PublicationService{cfg: cfg}
}
```

When initialization performs fallible I/O, return
`(*PublicationService, error)` and wrap setup errors with the failed operation. A pure configuration consumer has no context, span, or logger solely
for receiving configuration. An I/O adapter still takes caller context first,
creates its adapter span, and logs a returned I/O error through the local logger
convention.

Keep behavior checks in the use case or adapter test that uses the setting. Add
a focused configuration test when tags, defaults, section ownership, or the
module provider changes. Cover the valid base value and relevant environment
override; never assert a secret value in source control.

## Check before finishing

- The module owns the setting and declares it once in `config.Config`.
- YAML lives below `app.<module>` and its tags match the YAML keys.
- `fx.go` provides `config.Config` with `bricksconfig.Provide` for that exact
  section.
- Consumers receive one typed config value through their constructors.
- Tests cover changed deserialization or behavior without storing secrets.
