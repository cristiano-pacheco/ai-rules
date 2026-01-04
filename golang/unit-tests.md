Unit tests

## Planning Rules

1. Identify Items to Test:

  - just show the code, don't need to explain anything.
  - Determine if a test suite (for structs with dependencies) or individual test functions (for standalone functions) should be used.
  - Identify dependencies or side effects that may require mocks or stubs.
  - Consider error conditions and how to test them.

2. Defining Test Cases:

  - Number each test case clearly (e.g., TestFunction_ValidInput_ReturnsExpectedResult, TestFunction_EmptyInput_ReturnsError).
  - Each test case should concisely describe the scenario being tested.

## Implementation Rules

1. Test Suites for Structs with Dependencies:

  - Use suite.Suite from testify.
  - Create a suite struct that contains a sut (System Under Test) field.
  - Implement a SetupTest method to initialize the sut and its dependencies.
  - Do not use .AssertExpectations(s.T()).
  - Identify the constructor for the type and use it. Generally the name is NewTypeName, example NewAccountValidator(deps...)
  - Always use _test suffix for the package name in the tests
  - for test suite always use suite instead of assert, example: 
    example:
     - suite.Equals(v, 10)
  - for error assertion on the suite tests, always use suite.Require(). 
    example:
    - suite.Require().ErrorIs
    - suite.Require().Error 
  - for error assertion on the non suite tests, always use require. 
     example:  
     - require.ErrorIs
     - require.Error

- test suite example:
```go
package mypackage_test

import (
	"testing"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
)

// Test suite for structs with dependencies
type MyStructTestSuite struct {
	suite.Suite
	sut *mypackage.MyStruct
}

func (s *MyStructTestSuite) SetupTest() {
	// Initialize sut and dependencies
  // example of config initialization
  s.cfg = config.Config{
		MAIL: config.MAIL{
			Sender: "test@example.com",
		},
		App: config.App{
			BaseURL: "https://example.com",
			Name:    "Test App",
			Version: "1.0.0",
		},
		Telemetry: config.Telemetry{
			Enabled: false,
		},
		Log: config.Log{
			LogLevel: "disabled",
		},
	}

	// Initialize otel for testing
	otel.Init(s.cfg)

	// Use real logger but with disabled level
	s.logger = logger.New(s.cfg)

	s.sut = mypackage.New()
}

func TestMyStructSuite(t *testing.T) {
	suite.Run(t, new(MyStructTestSuite))
}

func (s *MyStructTestSuite) TestSomeMethod() {
  // Arrange
  // Act
	// Assert
}
```

1.1 on mocks always pass mock.Anything for contexts.
For example: 
s.recurringPaymentRepoMock.On("Update", mock.Anything, payment).Return(nil)

1. Tests for Functions Without Instances:
  
  - Create individual test functions using func TestXxx(t *testing.T).
  - Use t.Run for subtests covering different scenarios.
  - example:

```go
func TestSomeFunction(t *testing.T) {
	t.Run("scenario description", func(t *testing.T) {
		// Arrange
		// Act
		// Assert
	})
}
```
3. Test Coverage:
  
  - Include happy path scenarios.
  - Include edge cases.
  - Minimum test scenarios possible.
  - Include error handling.
  - Aim for at least 80% coverage.

4. Using Assertions:

  - Use testify assertion functions (e.g., s.True(result) instead of assert.True(s.T(), result)).
  - Avoid .AssertExpectations(s.T()).

5. Mocks and Stubs:

  - Use mocks or stubs to isolate dependencies as needed.
  - Mocks are already in place; no need to generate them.
  - Example imports:
     - user_repository_mocks "github.com/cristiano-pacheco/go-bidding-service/internal/identity/domain/repository/mocks"
     - token_service_mocks "github.com/cristiano-pacheco/go-bidding-service/internal/identity/domain/service/mocks"

6. Mock Naming Convention:

  - Mocks follow the pattern MockType, for example:
    - user_repository_mocks.MockUserRepository
    - token_service_mocks.MockTokenService

7. Arrange-Act-Assert Pattern:

  - Each test should follow the AAA pattern:
    - Arrange: prepare environment and data
    - Act: perform the action being tested
    - Assert: verify the results
    - In the code the comments must be in the pattern below:
    ```
    // Arrange
    // Act
    // Assert
    ```

8. Naming and Clarity:

  - Test names must clearly indicate what is being tested.
  - Add comments for complex test setups or assertions if needed.
  - Never use inline struct construction, always create a new varialbe and assigns the instance to it.
  - Each line has to have in max 120 characters.

9. Never explain the test after generating the code. Just say Tests Done, Oh Yeah! when the process is finished.