---
name: go-usecase
description: Go use-case application policy. Use when implementing one entity operation that owns orchestration, authorization decisions, state transitions, or business validation between application inputs/outputs and consumer-owned ports. Don't use for HTTP transport mapping, persistence or infrastructure adapters, reusable validator adapters, or generic telemetry.
---

# Go UseCase

Implement **application policy**: one entity operation that owns orchestration,
authorization decisions, state transitions, and applicable business validation.
Use cases convert between application types and consumer-owned ports; transport,
persistence, and provider representations stay outside that boundary.

## Required naming

For noun `User` and action `Create`, use these names:

| Element | Name |
| --- | --- |
| File | `internal/modules/<module>/usecase/user_create_usecase.go` |
| Struct | `UserCreateUseCase` |
| Input | `UserCreateInput` |
| Output | `UserCreateOutput` |
| Constructor | `NewUserCreateUseCase` |
| Entry point | `Execute` |

`EntityOperation` is deliberate: keep the entity before the operation in every
identifier. A different shape requires an ADR that identifies the excepted
coding-standard rule, owner, and removal condition or due date.

## Canonical implementation

Resolve import paths from the target module's `go.mod`; do not copy a project
path from this example. Import `context`, the established logger and validator,
and the target module's `model` and `ports` packages. A `UserCreate` operation
has this canonical shape:

The `validate:"..."` field-tag syntax is defined by
[`github.com/go-playground/validator`](https://github.com/go-playground/validator),
which the local `validator.Validator` abstraction may wrap. Confirm every tag
against the version declared in `go.mod`; validation libraries and custom local
registrations determine the supported tag set.

```go
package usecase

type UserCreateInput struct {
	FirstName string `validate:"required,min=3,max=255"`
	LastName  string `validate:"required,min=3,max=255"`
	Password  string `validate:"required,min=8"`
	Email     string `validate:"required,email,max=255"`
}

type UserCreateOutput struct {
	UserID    uint64
	FirstName string
	LastName  string
	Email     string
}

type UserCreateUseCase struct {
	userRepository ports.UserRepository
	validator      validator.Validator
	logger         logger.Logger
}

func NewUserCreateUseCase(
	userRepository ports.UserRepository,
	validator validator.Validator,
	logger logger.Logger,
) *UserCreateUseCase {
	return &UserCreateUseCase{
		userRepository: userRepository,
		validator:      validator,
		logger:         logger,
	}
}

func (uc *UserCreateUseCase) Execute(
	ctx context.Context,
	input UserCreateInput,
) (UserCreateOutput, error) {
	if err := uc.validator.Struct(input); err != nil {
		uc.logger.Error("user creation validation failed", logger.Error(err))
		return UserCreateOutput{}, err
	}

	userModel := model.UserModel{
		FirstName: input.FirstName,
		LastName:  input.LastName,
		Email:     input.Email,
		Password:  input.Password,
	}

	createdUser, err := uc.userRepository.Create(ctx, userModel)
	if err != nil {
		uc.logger.Error("user creation failed", logger.Error(err))
		return UserCreateOutput{}, err
	}

	return UserCreateOutput{
		UserID:    createdUser.ID,
		FirstName: createdUser.FirstName,
		LastName:  createdUser.LastName,
		Email:     createdUser.Email,
	}, nil
}
```

## 1. Inspect the operation contract

Inspect before editing:

- the target module, its `go.mod`, and relevant domain context and ADRs;
- the closest comparable application operation and its integration tests;
- its input/output ownership, naming, constructor, public entry point, and
  private-helper convention;
- every port, model, domain service, validator, typed error, and mapper the
  operation needs; and
- the module's `fx.go`, the cross-module dependencies, the matching integration
  test, and the required quality gates.

**Done when:** the agent can name the owning package, comparable operation,
required collaborators, validation mechanism, composition mechanism, and
integration-test seam from repository evidence.

## 2. Choose the operation shape

Use the required `EntityOperationUseCase` shape: one operation file,
`EntityOperationInput`, `EntityOperationOutput`, a pointer-returning constructor,
and `Execute(ctx context.Context, input EntityOperationInput) (EntityOperationOutput, error)`.
Inject abstractions required by the operation; the consumer owns their `ports.*`
interfaces.

Add only directly necessary companion changes: a consumer-owned port, typed
expected error, mapper, Fx registration, or integration test. An architectural
exception requires an ADR before merging; it does not justify a competing
application boundary.

**Done when:** exactly one required operation shape is selected and every
companion change is necessary to implement its policy.

## 3. Define the application contract

Define both `EntityOperationInput` and `EntityOperationOutput` in the operation file,
including an empty struct when the operation has no fields. Treat them as a
contract owned by that application operation:

- declare every field explicitly, including fields of any nested type declared
  in the same file;
- keep input and output independent of shared module DTOs and persistence
  models;
- omit `json` tags; transport DTOs belong to the transport layer; and
- create a separate input and output type for each operation, even when shapes
  currently match.

Map at boundaries explicitly: input to domain or persistence values before a
collaborator call, and collaborator results to output before success returns.
HTTP DTOs, GORM models, and provider SDK types never cross this boundary.

Put simple constraints on input fields as Go validator tags and make
`uc.validator.Struct(input)` the first call in `Execute`. Put reusable business
validation behind a consumer-owned port and implement it in `validator/` only
when it has a real adapter responsibility. Include `validator.Validator` and
`logger.Logger` in the constructor and struct.

**Done when:** the operation owns complete input/output types and its dependency
fields are abstractions or shared infrastructure, never a concrete module
adapter, GORM handle, HTTP type, or provider client.

## 4. Implement the policy in `Execute`

Keep the application operation as policy:

1. validate simple input constraints using the Go validator mechanism;
2. make authorization decisions, state transitions, and business validations
   that belong to the operation;
3. orchestrate the required consumer-owned port calls;
4. translate expected business outcomes to module typed errors; and
5. return an explicitly mapped output.

The use case has one public `Execute` method. Keep supporting logic as
private methods on the use-case struct.

Return terminal errors deliberately. Before each error return, log it through
the operation's logger with `logger.Error(err)` when that is the local logging
convention. For expected absence used to decide a business rule, distinguish the
known absence from an unexpected lookup failure, then log the error ultimately
returned. Preserve error identity with `errors.Is` when the local error model
uses it. Return a typed module error from `errs` for an expected business
outcome; preserve an unexpected technical error unless operation context is
necessary. Never synthesize a raw error string for an expected condition.

For example, use a known not-found error only as the branch condition; all other
lookup failures remain terminal:

```go
existingUser, err := uc.userRepository.FindByEmail(ctx, input.Email)
if err != nil && !errors.Is(err, brickserrs.ErrRecordNotFound) {
	uc.logger.Error("user lookup failed", logger.Error(err))
	return UserCreateOutput{}, err
}
if existingUser.ID != 0 {
	err = errs.ErrEmailAlreadyInUse
	uc.logger.Error("user creation rejected", logger.Error(err))
	return UserCreateOutput{}, err
}
```

Leave generic execution outcome and duration telemetry to `ucdecorator`. Emit
logs, metrics, or traces from `Execute` only for meaningful domain decisions,
business events, or domain failures; I/O spans belong to the adapter.

Call another module only through its injected exported use-case API:
`*othermoduleusecase.EntityOperationUseCase.Execute(ctx, input)`. Never reach
across that boundary to a foreign repository, model, HTTP package, mapper,
validator, errors package, or Fx wiring.

**Done when:** every success path returns a complete output, every terminal
error has the required logging and typed-error treatment, and all collaborator
calls use the request context when their local signatures accept one.

## 5. Register the policy in Fx

Register the raw constructor and decorated use case in the module's `fx.go`, the
only composition root. Keep the raw constructor available to composition code
and integration tests.

Add the constructor to `fx.Provide` and extend the module's single
decorated-use-case provider. Its `fx.In` field receives
`*usecase.EntityOperationUseCase`; its `fx.Out` field exports
`ucdecorator.UseCase[usecase.EntityOperationInput, usecase.EntityOperationOutput]`;
the provider returns `ucdecorator.Wrap(factory, in.EntityOperationUseCase)`.
Preserve the existing field and provider naming in that module.

```go
var Module = fx.Module(
	"user",
	fx.Provide(
		usecase.NewUserCreateUseCase,
		provideDecoratedUseCases,
	),
)

type decorateUseCasesIn struct {
	fx.In
	UseCaseDecoratorFactory *ucdecorator.Factory
	UserCreateUseCase       *usecase.UserCreateUseCase
}

type decorateUseCasesOut struct {
	fx.Out
	UserCreateUseCase ucdecorator.UseCase[usecase.UserCreateInput, usecase.UserCreateOutput]
}

func provideDecoratedUseCases(in decorateUseCasesIn) decorateUseCasesOut {
	return decorateUseCasesOut{
		UserCreateUseCase: ucdecorator.Wrap(
			in.UseCaseDecoratorFactory,
			in.UserCreateUseCase,
		),
	}
}
```

**Done when:** every new dependency can be constructed by Fx, and application
consumers receive the decorated operation boundary.

## 6. Prove the policy at its boundary

Add or update an integration test under
`test/integration/modules/<module>/usecase/`. Exercise real validation,
repositories, migrations, and business flow. Fake only an uncontrolled external
provider through its consumer-owned port. Cover the successful result, malformed
input when applicable, every material business outcome, and every collaborator
failure introduced or changed.

Run `make lint`, `make test`, and `make test-integration`. A nonzero result
blocks the change. If infrastructure prevents an integration command, report the
exact prerequisite and result; documentation-only changes may mark the gates
`N/A` with an explanation.

**Done when:** the integration test demonstrates the policy and all required
quality gates have reproducible reported results.

## Completion check

Verify every preceding **Done when** criterion before handing off. Report the
operation policy, changed artifacts, boundary conversions, changed ports, and
the exact quality-gate results. State any ADR, exception, or validation
prerequisite plainly.
