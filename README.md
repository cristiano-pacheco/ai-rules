# AI tools

Reusable skills and reference material for AI-assisted engineering work.

## Contents

- `skills/engineering/` contains planning, implementation, review, Go, and workflow skills.
- `skills/misc/` contains small general-purpose skills.
- `skills/deprecated/` keeps retired skills for reference. They are not part of the active set.
- `docs/` contains repository conventions and the Go modular architecture guide.
- `pi/extensions/` contains Pi extensions.

## Active skills

| Skill | Use it for |
| --- | --- |
| `100-go-rules` | Go design, implementation, testing, debugging, and review |
| `ai-commit` | Commit and push artifacts produced by the AI workflow |
| `ai-create-plan` | Technical implementation plans |
| `ai-execute-plan` | Executing an implementation plan |
| `ai-full-code-review` | Production-risk review of a branch diff |
| `ai-implement` | Implementing a spec or tickets |
| `ai-review-changes` | Reviewing a diff against standards and its spec |
| `ai-setup-skills` | Configuring issue tracking, triage labels, and domain docs |
| `ai-to-spec` | Turning a conversation into a tracker spec |
| `ai-to-spec-workplan` | Publishing settled conversation as a Workplan spec |
| `ai-to-tickets` | Splitting a plan or spec into dependent tickets |
| `ai-to-tickets-workplan` | Publishing a stored Workplan spec as a ticket graph |
| `commit` | Committing staged changes with a Conventional Commit message |
| `deslop` | Removing unnecessary AI-generated complexity from a diff |
| `go-modular-bricks` | Routing REST and CLI development through Bricks contracts |

Each skill defines its own trigger and instructions in its `SKILL.md`. Read that file before using or changing a skill.

## Repository guidance

[`AGENTS.md`](AGENTS.md) points to the issue tracker, triage-label vocabulary, and domain-document rules used by the engineering workflow. [`docs/go-modular-architecture.md`](docs/go-modular-architecture.md) documents the Go service architecture.
