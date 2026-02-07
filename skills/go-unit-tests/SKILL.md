---
name: go-unit-tests
description: Generate comprehensive Go unit tests following testify patterns and best practices. Use when creating or updating Go test files, writing test suites for structs with dependencies, testing standalone functions, working with mocks, or when asked to add test coverage for Go code.
---

# Go Unit Tests

Generate comprehensive Go unit tests following testify patterns and the Arrange-Act-Assert methodology.

## Planning Phase

Before writing tests, identify:

1. **Test Structure**: Determine if test suite (for structs with dependencies) or individual test functions (for standalone functions) should be used
2. **Dependencies**: Identify dependencies or side effects requiring mocks or stubs
3. **Test Cases**: Define scenarios covering happy paths, edge cases, and error conditions
4. **Naming**: Number each test case clearly (e.g., `TestFunction_ValidInput_ReturnsExpectedResult`, `TestFunction_EmptyInput_ReturnsError`)

Show the code without explanations during planning.

## Implementation Patterns

### Pattern 1: Test Suites for Structs with Dependencies

Use `suite.Suite` from testify for structs with dependencies.

**Key Rules:**
- Create suite struct with `sut` (System Under Test) field
- Implement `SetupTest` method to initialize sut and dependencies
- Use constructor (typically `NewTypeName`) to create instances
- Always use `_test` suffix for package name
- Use `suite` methods for assertions (e.g., `suite.Equal(v, 10)`)
- Use `suite.Require()` for error assertions (e.g., `suite.Require().ErrorIs`, `suite.Require().Error`)
- Never use `.AssertExpectations(s.T())`

**Example:** See `examples/suite_test.go` for basic suite structure.

**With Mocks:** See `examples/suite_with_mocks_test.go` for suite with mocked dependencies.

**Mock Rules:**
- Always pass `mock.Anything` for context parameters
- Mock naming follows pattern `MockType` (e.g., `MockUserRepository`, `MockTokenService`)
- Import mocks with aliases: `user_repository_mocks "github.com/project/internal/domain/repository/mocks"`

### Pattern 2: Tests for Standalone Functions

Use individual test functions with subtests for functions without instances.

**Key Rules:**
- Create test functions using `func TestXxx(t *testing.T)`
- Use `t.Run` for subtests covering different scenarios
- Use `require` for error assertions (e.g., `require.ErrorIs`, `require.Error`)

**Example:** See `examples/function_test.go` for function test structure.

## Test Structure Requirements

### Arrange-Act-Assert Pattern

Every test must follow AAA pattern with explicit comments:

```go
// Arrange
// Act
// Assert
```

### Code Style

- Never use inline struct construction; always create variable first
- Maximum 120 characters per line
- Test names must clearly indicate what is being tested
- Add comments for complex test setups or assertions

### Test Coverage

- Include happy path scenarios
- Include edge cases
- Include error handling
- Aim for minimum test scenarios possible while maintaining at least 80% coverage

## Completion

When tests are complete, respond with: **Tests Done, Oh Yeah!**
