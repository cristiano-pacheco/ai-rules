# Decorated use cases

Use this wiring only for the decorated profile selected in `fx-wiring.md`.

Register the raw constructor and expose the decorated API from the module's
`fx.go`:

```go
type decorateUseCasesIn struct {
	fx.In
	UseCaseDecoratorFactory *ucdecorator.Factory
	OrderConfirmUseCase     *usecase.OrderConfirmUseCase
}

type decorateUseCasesOut struct {
	fx.Out
	OrderConfirmUseCase ucdecorator.UseCase[usecase.OrderConfirmInput, usecase.OrderConfirmOutput]
}

func provideDecoratedUseCases(in decorateUseCasesIn) decorateUseCasesOut {
	return decorateUseCasesOut{
		OrderConfirmUseCase: ucdecorator.Wrap(in.UseCaseDecoratorFactory, in.OrderConfirmUseCase),
	}
}
```

Keep one `provideDecoratedUseCases` function for the module and add the raw
constructor to its `fx.Provide` group.
