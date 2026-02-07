package mypackage_test

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestSomeFunction(t *testing.T) {
	t.Run("valid input returns expected result", func(t *testing.T) {
		// Arrange
		input := "test input"
		expected := "expected output"

		// Act
		result := SomeFunction(input)

		// Assert
		require.Equal(t, expected, result)
	})

	t.Run("empty input returns error", func(t *testing.T) {
		// Arrange
		input := ""

		// Act
		result, err := SomeFunctionWithError(input)

		// Assert
		require.Error(t, err)
		require.Empty(t, result)
	})

	t.Run("nil input returns error", func(t *testing.T) {
		// Arrange
		var input *string

		// Act
		result, err := SomeFunctionWithPointer(input)

		// Assert
		require.ErrorIs(t, err, ErrNilInput)
		require.Empty(t, result)
	})
}
