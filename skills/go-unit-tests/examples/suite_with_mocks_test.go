package mypackage_test

import (
	"context"
	"testing"

	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/suite"

	"github.com/example/project/test/mocks"
)

type UserServiceTestSuite struct {
	suite.Suite
	sut              *mypackage.UserService
	userRepoMock     *mocks.MockUserRepository
	tokenServiceMock *mocks.MockTokenService
}

func (s *UserServiceTestSuite) SetupTest() {
	// Initialize mocks
	s.userRepoMock = mocks.NewMockUserRepository(s.T())
	s.tokenServiceMock = mocks.NewMockTokenService(s.T())

	// Initialize sut with mocked dependencies
	s.sut = mypackage.NewUserService(
		s.userRepoMock,
		s.tokenServiceMock,
	)
}

func TestUserServiceSuite(t *testing.T) {
	suite.Run(t, new(UserServiceTestSuite))
}

func (s *UserServiceTestSuite) TestCreateUser_ValidInput_CreatesUser() {
	// Arrange
	ctx := context.Background()
	user := &mypackage.User{
		Email: "test@example.com",
		Name:  "Test User",
	}

	s.userRepoMock.On("Create", mock.Anything, user).Return(nil)

	// Act
	err := s.sut.CreateUser(ctx, user)

	// Assert
	s.Require().NoError(err)
}

func (s *UserServiceTestSuite) TestCreateUser_RepositoryError_ReturnsError() {
	// Arrange
	ctx := context.Background()
	user := &mypackage.User{
		Email: "test@example.com",
		Name:  "Test User",
	}
	expectedError := errors.New("repository error")

	s.userRepoMock.On("Create", mock.Anything, user).Return(expectedError)

	// Act
	err := s.sut.CreateUser(ctx, user)

	// Assert
	s.Require().ErrorIs(err, expectedError)
}

func (s *UserServiceTestSuite) TestGenerateToken_ValidUser_ReturnsToken() {
	// Arrange
	ctx := context.Background()
	userID := "user-123"
	expectedToken := "token-abc"

	s.tokenServiceMock.On(
		"Generate",
		mock.Anything,
		userID,
	).Return(expectedToken, nil)

	// Act
	token, err := s.sut.GenerateToken(ctx, userID)

	// Assert
	s.Require().NoError(err)
	s.Equal(expectedToken, token)
}
