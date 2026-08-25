# Modular architecture

Build the service as a modular monolith. Each business capability owns the code
and data that change with it. A module is a vertical slice, not a shared
technical layer.

Dependencies point toward application policy. A use case depends on its own
application contracts and consumer-owned ports. An adapter depends on the port
it implements and its technical mechanism. The module composition root may
know both sides to connect them.

Keep representation boundaries explicit. HTTP and command packages own their
input and output contracts. Use cases own operation contracts. Persistence and
provider adapters own their representations. Mapping makes a boundary visible
instead of making one representation a service-wide type.

Make a business operation available through a single use-case API. Inbound
adapters call that API. Outbound dependencies appear as narrow ports owned by
the use case's module. The module's composition root binds concrete adapters to
those ports.

Treat module ownership and dependency direction as part of the contract. A
change that crosses either boundary needs a deliberate public contract and an
impact map that names both modules.

## Examples

### Good

```go
type CreateProductUseCase struct {
	products ports.ProductRepository
}

func (uc *CreateProductUseCase) Execute(ctx context.Context, input CreateProductInput) (CreateProductOutput, error) {
	product, err := uc.products.Create(ctx, Product{Name: input.Name})
	if err != nil {
		return CreateProductOutput{}, err
	}
	return CreateProductOutput{ID: product.ID}, nil
}
```

### Bad

```go
type CreateProductUseCase struct {
	db *gorm.DB
}

func (uc *CreateProductUseCase) Execute(ctx context.Context, input CreateProductInput) error {
	return uc.db.WithContext(ctx).Create(&model.ProductModel{Name: input.Name}).Error
}
```
