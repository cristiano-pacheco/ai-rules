# Go Database Model Pattern Rule

## Description
Generate Go GORM models for database persistence following the established patterns in the codebase.

## Location & Naming

- **Directory**: `internal/modules/<module_name>/model` (e.g., `internal/modules/identity/model`)
- **Filename**: Must end with `_model.go` (e.g., `user_model.go`)
- **Package**: `package model`

## Pattern

### 1. **Struct Definition**
- Define a struct `XModel` (e.g., `UserModel`).
- Use **public fields** (exported) so GORM can access them.
- Use **GORM tags** to define primary keys, indexes, and column types (e.g., `gorm:"primarykey"`, `gorm:"uniqueIndex"`, `gorm:"type:bytea"`).

### 2. **Standard Fields**
- Include standard fields for tracking and identification:
    - `ID uint64 ` `gorm:"primarykey"`
    - `CreatedAt time.Time`
    - `UpdatedAt time.Time`
- Use pointers for nullable fields (e.g., `ConfirmedAt *time.Time`).

### 3. **Table Name**
- Implement the `TableName() string` method to specify the database table name explicitly.
- Return the pluralized, snake_case table name (e.g., `"users"`).

## Example

```go
package model

import "time"

type UserModel struct {
	ID           uint64 `gorm:"primarykey"`
	FirstName    string
	LastName     string
	Email        string `gorm:"uniqueIndex"`
	Status       string
	PasswordHash []byte `gorm:"type:bytea"`
	ConfirmedAt  *time.Time
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

func (*UserModel) TableName() string {
	return "users"
}
```
