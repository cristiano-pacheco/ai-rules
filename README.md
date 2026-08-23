# AI Tools

A collection of rules, guidelines, skills, and workflows designed to help AI coding assistants generate high-quality, consistent, and idiomatic code.

## Project Structure

```
ai-tools/
├── docs/              # Architecture and agent-workflow documentation
└── skills/            # Active and deprecated AI skills
```

## Skills

Located in `skills/`, these are specialized instructions for engineering work:

### Go Skills (Modular Architecture)

| Skill | Description |
|-------|-------------|
| `go-cache` | Redis cache implementations with ports/cache pattern |
| `go-chi-handler` | Chi HTTP handlers for API endpoints |
| `go-chi-router` | Chi routers for route registration |
| `go-enum` | String-based enums with validation |
| `go-error` | Typed module errors using bricks/pkg/errs |
| `go-gorm-model` | GORM persistence models |
| `go-integration-tests` | Integration tests with real infrastructure |
| `go-repository` | Repository ports + GORM implementations |
| `go-service` | Reusable domain services |
| `go-unit-tests` | Unit tests with testify suites |
| `go-usecase` | Business operations with metrics/tracing |
| `go-validator` | Validation ports + implementations |

### Workflow Skills

| Skill | Description |
|-------|-------------|
| `100-go-rules` | Go design and code-quality rulebook |
| `ai-commit` | Commit and push handoff artifacts for AI workflows |
| `ai-code-review` | Parallel standards and specification review for a branch diff |
| `ai-implement` | Implement work from a specification or tickets |
| `ai-setup-skills` | Configure the issue tracker, triage labels, and domain docs |
| `ai-to-spec` | Synthesize the current conversation into an issue-tracker specification |
| `ai-to-tickets` | Break a plan or specification into tracer-bullet tickets |
| `commit` | Create a Conventional Commit from staged changes |
| `deslop` | Remove unnecessary AI-generated complexity from a branch diff |

Deprecated skills remain available in `skills/deprecated/` for reference only.

## Documentation

Located in `docs/`:

| Document | Description |
|----------|-------------|
| `go-modular-architecture.md` | Complete guide for Go modular architecture with Fx DI, ports/usecase/repository boundaries, Chi HTTP adapters, typed errors, tracing, and metrics |

## Usage

These resources are intended to be used as context for AI models to ensure generated code and documentation adhere to specific project standards and architectural patterns.
