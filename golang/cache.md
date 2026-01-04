# Go Cache Pattern Rule

## Description
Generate Go cache implementations following the established patterns in the codebase using Redis.

## Pattern

When creating cache implementations in Go, follow these patterns:

### 1. **File & Package Naming**
- Place the file in a `cache` package
- Use the suffix `_cache.go` for the filename (e.g., `user_activated_cache.go`)

### 2. **Constants**
- Define `cacheKeyPrefix` with a descriptive prefix ending in `:` (e.g., `"user_activated:"`)
- Define `cacheTTL` for the expiration time (e.g., `24 * time.Hour`)

### 3. **Interface Definition**
- Define an interface `XCacheI` with `Set`, `Get`, `Delete` methods
- Methods should accept necessary identifiers (e.g., `userID uint64`) and return appropriate types/errors

### 4. **Struct Definition**
- Define a struct `XCache` containing `redisClient redis.Redis`
- Ensure compile-time check for interface implementation: `var _ XCacheI = (*XCache)(nil)`

### 5. **Constructor**
- Implement `NewXCache(redisClient redis.Redis) *XCache`
- Return a pointer to the struct

### 6. **Key Building**
- Implement private `buildKey(id type) string` method
- Use `fmt.Sprintf` to combine prefix and ID

### 7. **Method Implementation**
- **Context**: Use `context.Background()` inside methods (unless context is passed from caller, but follow existing pattern of internal context creation if consistent)
- **Client Check**: Always check if `c.redisClient.Client()` is nil before usage
- **Set**: Use `client.Set` with the defined TTL
- **Get**:
    - Use `client.Get`
    - Handle `redisClient.Nil` explicitly to return a "not found" state (e.g., `false`, `nil`) without returning an error
    - Return error for actual Redis failures
- **Delete**: Use `client.Del`

### 8. **Dependencies**
- Import `github.com/cristiano-pacheco/go-bidding-service/pkg/redis`
- Import `github.com/redis/go-redis/v9` as `redisClient`

## Example

```go
package cache

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"time"

	"github.com/cristiano-pacheco/go-bidding-service/pkg/redis"
	redisClient "github.com/redis/go-redis/v9"
)

const (
	cacheKeyPrefix = "entity_name:"
	cacheTTL       = 24 * time.Hour
)

type EntityCacheI interface {
	Set(id uint64) error
	Get(id uint64) (bool, error)
	Delete(id uint64) error
}

type EntityCache struct {
	redisClient redis.Redis
}

var _ EntityCacheI = (*EntityCache)(nil)

func NewEntityCache(redisClient redis.Redis) *EntityCache {
	return &EntityCache{
		redisClient: redisClient,
	}
}

func (c *EntityCache) Set(id uint64) error {
	key := c.buildKey(id)
	ctx := context.Background()

	client := c.redisClient.Client()
	if client == nil {
		return errors.New("redis client is nil")
	}

	return client.Set(ctx, key, "1", cacheTTL).Err()
}

func (c *EntityCache) Get(id uint64) (bool, error) {
	key := c.buildKey(id)
	ctx := context.Background()

	client := c.redisClient.Client()
	if client == nil {
		return false, errors.New("redis client is nil")
	}

	result := client.Get(ctx, key)
	if err := result.Err(); err != nil {
		if errors.Is(err, redisClient.Nil) {
			return false, nil // Key does not exist
		}
		return false, err
	}

	return true, nil
}

func (c *EntityCache) Delete(id uint64) error {
	key := c.buildKey(id)
	ctx := context.Background()

	client := c.redisClient.Client()
	if client == nil {
		return errors.New("redis client is nil")
	}

	return client.Del(ctx, key).Err()
}

func (c *EntityCache) buildKey(id uint64) string {
	return fmt.Sprintf("%s%s", cacheKeyPrefix, strconv.FormatUint(id, 10))
}
```
