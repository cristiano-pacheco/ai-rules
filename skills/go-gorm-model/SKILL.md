---
name: go-gorm-model
description: Generate Go GORM models following Pingo modular architecture conventions. Use when creating or updating persistence models in internal/modules/<module>/model/, including table mapping, nullable SQL types, timestamps, and relation fields for identity and monitor modules.
---

# Go GORM Model

Generate GORM persistence models in `internal/modules/<module>/model/`.

## Pattern

Model files must follow this location and naming:

- Path: `internal/modules/<module>/model/<entity>_model.go`
- Package: `model`
- Struct name: `<Entity>Model`
- TableName method:
  - `func (*<Entity>Model) TableName() string { return "<table_name>" }`

## File Structure

Use this order:

1. `package model`
2. Imports (`time`, `database/sql` only when needed)
3. Struct definition
4. `TableName()` method

## Base Template

```go
package model

import (
	"database/sql"
	"time"
)

type EntityModel struct {
	ID        uint64         `gorm:"primarykey"`
	Name      string         `gorm:"column:name"`
	Meta      sql.NullString `gorm:"column:meta"`
	CreatedAt time.Time      `gorm:"column:created_at"`
	UpdatedAt time.Time      `gorm:"column:updated_at"`
}

func (*EntityModel) TableName() string {
	return "entities"
}
```

If a field name matches GORM defaults and project style keeps it untagged, omit explicit `gorm:"column:..."`.

## Conventions from Current Codebase

### IDs and Primary Keys

- Use `uint64` for numeric IDs.
- Set primary key as:
  - ``ID uint64 `gorm:"primarykey"` ``

### Time fields

- Use `time.Time` for required timestamps.
- Common fields:
  - `CreatedAt time.Time`
  - `UpdatedAt time.Time`
- Use explicit column tags for snake_case DB columns when needed.

### Nullable database fields

Use `database/sql` nullable types when DB column can be null:

- `sql.NullString`
- `sql.NullInt32`
- `sql.NullBool`
- `sql.NullTime`

Examples in this repo:

- `Nonce sql.NullString`
- `StatusCode sql.NullInt32`
- `ResponseTimeMs sql.NullInt32`

### Column tags

Use explicit tags when any of these apply:

- DB column differs from Go field naming
- You want consistency with existing model files
- Composite or relation keys need explicit mapping

Pattern:

- ``Field string `gorm:"column:field_name"` ``

### Table name mapping

Always implement `TableName()` and return the exact SQL table name.

Examples:

- `authorization_codes`
- `external_accounts`
- `http_monitor_checks`
- `contacts`

## Generation Steps

1. Identify module and entity.
2. Open migration/schema and confirm table + columns.
3. Create or update `internal/modules/<module>/model/<entity>_model.go`.
4. Define struct fields with correct Go and nullable SQL types.
5. Add `gorm` tags (`primarykey`, `column:...`) where needed.
6. Add `TableName()` with exact table name.
7. Ensure naming aligns with repository/usecase expectations.
8. Run `make test` and `make lint`.

## Type Mapping Guide

Use these defaults unless migration requires otherwise:

- `BIGINT/UNSIGNED BIGINT` -> `uint64`
- `VARCHAR/TEXT` -> `string`
- `BOOLEAN` -> `bool`
- `TIMESTAMP/DATETIME` -> `time.Time`
- nullable string/int/time -> `sql.NullString` / `sql.NullInt32` / `sql.NullTime`
- binary hash columns -> `[]byte`

## Example: Identity-style Model

```go
type AuthorizationCodeModel struct {
	ID                  uint64         `gorm:"primarykey"`
	CodeHash            []byte         `gorm:"column:code_hash"`
	UserID              uint64         `gorm:"column:user_id"`
	ClientID            string         `gorm:"column:client_id"`
	RedirectURI         string         `gorm:"column:redirect_uri"`
	Scope               string         `gorm:"column:scope"`
	CodeChallenge       string         `gorm:"column:code_challenge"`
	CodeChallengeMethod string         `gorm:"column:code_challenge_method;default:S256"`
	Nonce               sql.NullString `gorm:"column:nonce"`
	ExpiresAt           time.Time      `gorm:"column:expires_at"`
	CreatedAt           time.Time      `gorm:"column:created_at"`
}
```

## Example: Monitor-style Model

```go
type HTTPMonitorCheckModel struct {
	ID             uint64         `gorm:"primarykey"`
	HTTPMonitorID  uint64         `gorm:"column:http_monitor_id"`
	CheckedAt      time.Time      `gorm:"column:checked_at"`
	ResponseTimeMs sql.NullInt32  `gorm:"column:response_time_ms"`
	StatusCode     sql.NullInt32  `gorm:"column:status_code"`
	Success        bool           `gorm:"column:success"`
	ErrorMessage   sql.NullString `gorm:"column:error_message"`
}
```

## Critical Rules

- Models are persistence only; business logic belongs in usecases.
- Do not expose GORM models directly in HTTP DTO responses.
- Keep field names and types aligned with SQL migrations.
- Do not change existing column/table names without migration updates.
- Use module-local model package only (`internal/modules/<module>/model`).
- Never use `json` tags on GORM models.

## Checklist

- [ ] File created in `internal/modules/<module>/model/`
- [ ] Struct named `<Entity>Model`
- [ ] `ID uint64` with `gorm:"primarykey"`
- [ ] Nullable columns mapped with `database/sql` nullable types
- [ ] Timestamp fields typed correctly
- [ ] `TableName()` added with exact table name
- [ ] Tags and naming consistent with existing module style
- [ ] `make test` and `make lint` executed
