# Engineering Plan Template

> **Plan:** [[engineering/<project>/workplans/<plan>/index|<plan>]]

## Overview

[Provide a concise technical overview of the requested change. Explain the problem, the desired outcome, and why this plan is needed.]

## Goals

[List specific, testable goals:

* What must work after implementation
* Key constraints
* Success criteria]

## Out of Scope

[Clearly state what this plan will not include.]

## Repository Findings

[Summarize the relevant codebase findings:

* Existing modules, interfaces, handlers, jobs, models, or config involved
* Existing patterns to follow
* Project standards from `docs/`, if present
* Important dependencies and integration points]

## Technical Approach

[Describe the chosen implementation approach:

* Components to create or modify
* Data flow
* Error handling
* Configuration
* Persistence or external services, if applicable
* Observability, if applicable]

## Implementation Steps

[List the concrete implementation sequence:

1. First change and why it comes first
2. Second change and dependency
3. Remaining changes
4. Integration and verification]

## Files to Change

[List relevant files and expected changes:

* `path/to/file.go` - change description
* `path/to/test.go` - test coverage]

## Testing and Verification

[Describe exactly how to verify the work:

* Unit tests
* Integration tests
* Manual checks
* Commands to run]

## Risks and Mitigations

[Identify implementation risks and how to handle them.]

## Open Questions

[List unresolved questions or write "None".]
