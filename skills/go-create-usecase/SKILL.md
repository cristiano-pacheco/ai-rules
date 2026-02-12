---
name: go-create-usecase
description: Generate Go use cases following go conventions (Fx DI, ports/usecase architecture). Use for any business logic operation in internal/modules/<module>/usecase/ - entity operations (create, update, list, delete), infrastructure operations (upload file, send notification), or any domain action requiring metrics, tracing, and validation.
---

# Go Use Case Creator

## Core Principle

**Use cases NEVER depend on concrete implementations.** Always depend on interfaces (ports) instead.

```go
// ❌ WRONG - concrete implementation
type MyUseCase struct {
    repo *repository.PostgresRepository
}

// ✅ CORRECT - interface (port)
type MyUseCase struct {
    repo ports.MyRepository
}
```

## Structure Template

```go
package usecase

// 1. Input (skip if no params needed)
type <Name>Input struct {
    Field string `validate:"required,max=255"`
}

// 2. Output
type <Name>Output struct {
    Result string
}

// 3. UseCase struct
type <Name>UseCase struct {
    // Dependencies (repos, ports, services)
    // Always required:
    logger         logger.Logger
    useCaseMetrics metrics.UseCaseMetrics
    // Optional:
    validator      validator.Validator  // if input validation
}

// 4. Constructor
func New<Name>UseCase(
    logger logger.Logger,
    useCaseMetrics metrics.UseCaseMetrics,
) *<Name>UseCase {
    return &<Name>UseCase{
        logger:         logger,
        useCaseMetrics: useCaseMetrics,
    }
}

// 5. Public Execute (metrics wrapper)
func (uc *<Name>UseCase) Execute(ctx context.Context, input <Name>Input) (<Name>Output, error) {
    start := time.Now()
    output, err := uc.execute(ctx, input)
    uc.useCaseMetrics.ObserveDuration("metric_name", time.Since(start))
    if err != nil {
        uc.useCaseMetrics.IncError("metric_name")
        return output, err
    }
    uc.useCaseMetrics.IncSuccess("metric_name")
    return output, nil
}

// 6. Private execute (business logic)
func (uc *<Name>UseCase) execute(ctx context.Context, input <Name>Input) (<Name>Output, error) {
    ctx, span := trace.Span(ctx, "<Name>UseCase.Execute")
    defer span.End()

    output := <Name>Output{}

    // Validate if needed
    if err := uc.validator.Validate(input); err != nil {
        return output, err
    }

    // Business logic here
    
    return output, nil
}
```

## Real Examples

### Example 1: Entity CRUD (ContactCreate)

```go
package usecase

type ContactCreateInput struct {
    Name        string `validate:"required,min=3,max=255"`
    ContactType string `validate:"required,oneof=email webhook"`
    ContactData string `validate:"required,max=500"`
}

type ContactCreateOutput struct {
    ContactID   uint64
    Name        string
    ContactType string
}

type ContactCreateUseCase struct {
    contactValidator  ports.ContactValidator
    contactRepository ports.ContactRepository
    validator         validator.Validator
    logger            logger.Logger
    useCaseMetrics    metrics.UseCaseMetrics
}
```

**File**: `contact_create_usecase.go`  
**Metric**: `contact_create`

### Example 2: File Upload (Non-entity)

```go
package usecase

type FileUploadInput struct {
    FileName    string `validate:"required,max=255"`
    ContentType string `validate:"required"`
    Data        []byte `validate:"required"`
}

type FileUploadOutput struct {
    URL       string
    FileSize  int64
    UploadedAt time.Time
}

type FileUploadUseCase struct {
    s3Client       ports.S3Client
    logger         logger.Logger
    useCaseMetrics metrics.UseCaseMetrics
}
```

**File**: `file_upload_usecase.go`  
**Metric**: `file_upload`

### Example 3: No Input (ContactList)

```go
package usecase

type ContactListOutput struct {
    Contacts []ContactListItem
}

type ContactListItem struct {
    ContactID   uint64
    Name        string
}

type ContactListUseCase struct {
    contactRepository ports.ContactRepository
    logger            logger.Logger
    useCaseMetrics    metrics.UseCaseMetrics
}

func (uc *ContactListUseCase) Execute(ctx context.Context) (ContactListOutput, error) {
    // No input parameter
}
```

**File**: `contact_list_usecase.go`  
**Metric**: `contact_list`

## Common Patterns

### Check existing record
```go
record, err := uc.repo.FindByX(ctx, value)
if err != nil && !errors.Is(err, shared_errs.ErrRecordNotFound) {
    uc.logger.Error("error finding", logger.Error(err))
    return output, err
}
if record.ID != 0 {
    return output, errs.ErrAlreadyExists
}
```

### Enum conversion
```go
enumVal, err := enum.NewTypeEnum(input.Type)
if err != nil {
    return output, err
}
model.Type = enumVal.String()
```

### List mapping
```go
items, err := uc.repo.FindAll(ctx)
if err != nil {
    uc.logger.Error("error listing", logger.Error(err))
    return output, err
}

output.Items = make([]Item, len(items))
for i, item := range items {
    output.Items[i] = Item{ID: item.ID, Name: item.Name}
}
```

## Naming

- **Package**: `usecase` (always)
- **File**: `<operation>_usecase.go` (e.g., `contact_create_usecase.go`, `file_upload_usecase.go`)
- **Struct**: `<Operation>UseCase` (e.g., `ContactCreateUseCase`, `FileUploadUseCase`)
- **Metric**: `<operation>` lowercase_underscore (e.g., `contact_create`, `file_upload`)
- **Span**: `<StructName>.Execute`

## Required Imports

```go
package usecase

import (
    "context"
    "time"
    
    "github.com/cristiano-pacheco/bricks/pkg/logger"
    "github.com/cristiano-pacheco/bricks/pkg/otel/trace"
    "github.com/cristiano-pacheco/pingo/internal/shared/metrics"
    
    // Add as needed:
    "github.com/cristiano-pacheco/bricks/pkg/validator"
    "github.com/cristiano-pacheco/pingo/internal/modules/<module>/ports"
    "github.com/cristiano-pacheco/pingo/internal/modules/<module>/model"
    "github.com/cristiano-pacheco/pingo/internal/modules/<module>/errs"
)
```

## Checklist

1. Input struct with validation tags (skip if no params)
2. Output struct with result fields
3. UseCase struct with logger + metrics + dependencies
4. Constructor with all params
5. Public Execute with metrics (ObserveDuration, IncError, IncSuccess)
6. Private execute with trace span + business logic
7. Place in `internal/modules/<module>/usecase/`
8. Wire in `fx.go`
9. Run `make test`, `make lint` and `make nilaway`
