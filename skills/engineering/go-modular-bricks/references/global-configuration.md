# Global configuration

## Recipe: change the global YAML contract

Put global configuration files in `config/`:

```text
config/
├── base.yaml
├── local.yaml
├── test.yaml
└── production.yaml
```

`config/base.yaml` is required. It declares the complete configuration shape
and safe defaults. `local.yaml`, `test.yaml`, and `production.yaml` are optional
overlays. The Bricks loader resolves `APP_CONFIG_DIR`, defaulting to `config`,
loads `base.yaml`, then resolves lowercase `APP_ENV`, defaulting to `local`, and
overlays `<APP_ENV>.yaml` when that file exists. Use `bricks/pkg/config` as the
only loader.

```yaml
app:
  name: "example"
  env: "local"
  base_url: "http://localhost:8080"
  database:
    dsn: "env://DATABASE_DSN"
  catalog:
    publication_enabled: true
```

Write a secret as `env://VARIABLE_NAME` in `base.yaml`. The loader substitutes
the exact process variable while it loads the file. List each required variable
without a value in `.env.example`; keep the value out of YAML overlays, Git,
fixtures, test assertions, and logs. Do not introduce key-derived environment
overrides such as `APP_CATALOG__PUBLICATION_ENABLED` or another configuration
library.

Global platform sections belong under `app` beside module sections. A module
section is `app.<module>`, for example `app.catalog`. Do not place a module
setting in `internal/shared` or duplicate the same setting in a command flag.
If a flag deliberately overrides configuration, make the precedence explicit in
the command reference and test it.

## Test the load path

Add `internal/shared/config/config_test.go` when changing loader behavior,
overlay behavior, or the global configuration shape. Set `APP_CONFIG_DIR` to a
test fixture directory and `APP_ENV` to the overlay under test. Restore both
variables with `t.Setenv` and assert the decoded base value, overlay value, and
resolved `env://` value.

```go
func TestLoad_OverlaysTestConfiguration(t *testing.T) {
	t.Setenv("APP_CONFIG_DIR", "testdata/config")
	t.Setenv("APP_ENV", "test")
	t.Setenv("DATABASE_DSN", "postgres://test")

	loaded, err := config.New[Config]()
	require.NoError(t, err)
	cfg := loaded.Get()
	assert.Equal(t, "test", cfg.App.Env)
	assert.Equal(t, "postgres://test", cfg.App.Database.DSN)
}
```

Use the project's established Bricks loader package when it wraps `config.New`.
The test proves the same path the server and migration
commands use. It does not parse YAML directly or construct a second loader.

## Check before finishing

- `base.yaml` has the full shape and safe defaults.
- Every overlay changes only its environment-specific values.
- Each secret uses `env://VARIABLE_NAME` and appears in `.env.example` without
  a value.
- The affected typed consumer reads only its assigned `app.<module>` section.
- A focused unit test proves any changed loader, overlay, or substitution rule.
