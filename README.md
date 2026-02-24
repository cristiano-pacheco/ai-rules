# AI Tools

A collection of rules, guidelines, skills, and workflows designed to help AI coding assistants generate high-quality, consistent, and idiomatic code.

## Project Structure

```
ai-tools/
├── commands/          # AI workflow commands
├── docs/              # Architecture and design documentation
├── skills/            # Specialized AI skills for Go
└── templates/         # Document templates for workflows
```

## Commands

Located in `commands/`, these are structured workflows for AI assistants:

| Command | File | Description |
|---------|------|-------------|
| **Create PRD** | `create-prd.md` | Gather requirements and generate a Product Requirements Document |
| **Create Tech Spec** | `create-techspec.md` | Analyze requirements and design technical solutions |
| **Create Tasks** | `create-tasks.md` | Break down a Tech Spec into actionable development tasks |
| **Execute Task** | `execute-task.md` | Guidelines for implementing a specific task |

## Skills

Located in `skills/`, these are specialized instructions for generating code:

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

## Documentation

Located in `docs/`:

| Document | Description |
|----------|-------------|
| `go-modular-architecture.md` | Complete guide for Go modular architecture with Fx DI, ports/usecase/repository boundaries, Chi HTTP adapters, typed errors, tracing, and metrics |

## Templates

Located in `templates/`, standard formats for generated documents:

| Template | File | Description |
|----------|------|-------------|
| PRD | `prd-template.md` | Product Requirements Document format |
| Tech Spec | `techspec-template.md` | Technical design specification format |
| Tasks | `tasks-template.md` | Task list format |
| Task | `task-template.md` | Individual task definition format |

## Usage

These resources are intended to be used as context for AI models to ensure generated code and documentation adhere to specific project standards and architectural patterns.
