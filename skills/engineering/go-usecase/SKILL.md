---
name: go-usecase
description: Local Go use-case implementation. Use when creating or changing an application operation that coordinates domain work. Don't use for reusable domain services, HTTP handlers, persistence adapters, validators, or mappers.
---

# Go UseCase


Build one **local** application operation at a time. Local evidence decides the
application boundary, dependencies, validation, composition, and test command.
When the target has no established pattern, use the baseline in this skill.

## Baseline naming

For noun `User` and action `Create`, use these names:

| Element | Baseline |
| --- | --- |
| File | `internal/modules/<module>/usecase/user_create_usecase.go` |
| Struct | `UserCreateUseCase` |
| Input | `UserCreateInput` |
| Output | `UserCreateOutput` |
| Constructor | `NewUserCreateUseCase` |
| Entry point | `Execute` |

`NounAction` is deliberate: keep the noun before the action in every generated
identifier. Use the exact module-local equivalent only when comparable local
operations establish a different convention.

## Baseline implementation

Resolve import paths from the target module's `go.mod`; do not copy a project
path from this example. Import `context`, the established logger and validator,
and the target module's `model` and `ports` packages. With those baseline
conventions, a `UserCreate` operation has this canonical shape:

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

## 1. Inspect the local contract

Inspect before editing:

- the target module, its `go.mod`, and relevant domain context and ADRs;
- the closest comparable application operation and its focused tests;
- its input/output ownership, naming, constructor, public entry point, and
  private-helper convention;
- every port, model, domain service, validator, typed error, and mapper the
  operation needs; and
- the composition root and the narrowest documented validation command.

**Done when:** the agent can name the owning package, comparable operation,
required collaborators, validation mechanism, composition mechanism, and
focused command from repository evidence.

## 2. Choose the operation shape

Match the established application boundary. A module using function-based
commands, handlers, or another validation mechanism keeps that shape; adding a
new `UseCase`, `Execute`, Fx provider, validator, or decorator requires local
evidence or an explicit request.

When no comparable boundary exists, use this baseline:

- place one operation in `usecase/<noun>_<action>_usecase.go`;
- expose `NounActionUseCase.Execute(ctx context.Context, input NounActionInput) (NounActionOutput, error)`;
- inject module collaborators as `ports.*` interfaces; and
- construct the use case with `NewNounActionUseCase(...) *NounActionUseCase`.

If inspection leaves a material choice unresolved, stop after reporting the
evidence and request direction. Do not select an architecture by familiarity.

**Done when:** one local or baseline operation shape is selected and every
companion change is necessary to make that shape work.

## 3. Define a private operation contract

Define both `NounActionInput` and `NounActionOutput` in the operation file,
including an empty struct when the operation has no fields. Treat them as a
private contract of that operation:

- declare every field explicitly, including fields of any nested type declared
  in the same file;
- keep input and output independent of shared module DTOs and persistence
  models;
- omit `json` tags; transport DTOs belong to the transport layer; and
- create a separate input and output type for each operation, even when shapes
  currently match.

Map at boundaries explicitly: input to domain or persistence values before a
collaborator call, and collaborator results to output before success returns.

For a tag-based local validator, put validation tags on the input and make
`uc.validator.Struct(input)` the first call in `Execute`. Include
`validator.Validator` and `logger.Logger` in the baseline constructor and
struct; use the locally established equivalents when the module proves another
mechanism.

**Done when:** the operation owns complete input/output types and its dependency
fields are interfaces or locally established shared infrastructure, never a
concrete module adapter.

## 4. Implement a narrow `Execute`

Keep the application operation as orchestration:

1. validate input using the selected local mechanism;
2. perform the required domain checks and port/service calls;
3. translate expected business outcomes to module typed errors; and
4. return an explicitly mapped output.

The baseline use case has one public `Execute` method. Keep supporting logic as
private methods on the use-case struct.

Return terminal errors deliberately. Before each error return, log it through
the operation's logger with `logger.Error(err)` when that is the local logging
convention. For expected absence used to decide a business rule, distinguish the
known absence from an unexpected lookup failure, then log the error ultimately
returned. Preserve error identity with `errors.Is` when the local error model
uses it. Return a typed module error from `errs` for a business outcome rather
than synthesizing a raw error string.

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

When the module uses `ucdecorator` for observability, leave tracing and metrics
at that decorator boundary. Do not duplicate that concern inside `Execute`.

**Done when:** every success path returns a complete output, every terminal
error has the local logging and typed-error treatment, and all collaborator
calls use the request context when their local signatures accept one.

## 5. Compose without changing the boundary

Register only the construction required by the observed composition root. Keep
the raw use-case constructor available to composition code and unit tests.

For the established Fx plus `ucdecorator` variant, add the constructor to
`fx.Provide` and extend the module's single decorated-use-case provider. Its
`fx.In` field receives `*usecase.NounActionUseCase`; its `fx.Out` field exports
`ucdecorator.UseCase[usecase.NounActionInput, usecase.NounActionOutput]`; the
provider returns `ucdecorator.Wrap(factory, in.NounActionUseCase)`. Preserve the
existing field and provider naming in that module.

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

**Done when:** every new dependency can be constructed by the local composition
mechanism, and application consumers receive the same boundary type as their
peer operations.

## 6. Prove the operation

Add or update focused behavioral tests at the nearest existing seam. Cover the
successful result, validation or malformed input when applicable, each material
business outcome, and every collaborator failure introduced or changed.

Format changed Go files. Run the narrowest documented command that exercises the
changed package or test; use broader lint or nil analysis when the repository
documents it as required. If validation cannot run, report the exact command,
failure, and concrete prerequisite instead of claiming a pass.

**Done when:** focused tests demonstrate the selected contract, formatting is
clean, and the reported validation result is reproducible.

## Completion check

Verify every preceding **Done when** criterion before handing off. Report the
selected local or baseline shape, changed artifacts, observed conventions, and
the exact validation command and result. State any unresolved ambiguity or
validation prerequisite plainly.
