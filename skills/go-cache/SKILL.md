---
name: go-cache
description: Generate Go cache implementations following GO modular architechture conventions. Use when creating cache layers in internal/modules/<module>/cache/ - user state caching, session caching, rate limiting data, temporary data storage, or any domain cache that uses Redis for fast data access with TTL support.
---

# Go Cache

Generate cache files for Go backend using Redis.

## Two-File Pattern

Every cache requires two files:

1. **Port interface**: `internal/modules/<module>/ports/<cache_name>_cache.go`
2. **Cache implementation**: `internal/modules/<module>/cache/<cache_name>_cache.go`

### Cache File Layout Order

1. Constants (cache key prefix, TTL)
2. Implementation struct (`XxxCache`)
3. Compile-time interface assertion
4. Constructor (`NewXxxCache`)
5. Methods (`Set`, `Get`, `Delete`, etc.)
6. Helper methods (`buildKey`, `calculateTTL`)

## Port Interface

**Location**: `internal/modules/<module>/ports/<cache_name>_cache.go`

```go
package ports

import "context"

// XxxCache describes ...
type XxxCache interface {
	Set(ctx context.Context, id uint64) error
	Get(ctx context.Context, id uint64) (bool, error)
	Delete(ctx context.Context, id uint64) error
}
```

## Cache Implementation

**Location**: `internal/modules/<module>/cache/<cache_name>_cache.go`

```go
package cache

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/cristiano-pacheco/bricks/pkg/redis"
	"github.com/cristiano-pacheco/pingo/internal/modules/<module>/ports"
	redislib "github.com/redis/go-redis/v9"
)

const (
	entityCacheKeyPrefix = "entity_name:"
	entityCacheTTL       = 10 * time.Minute
)

type EntityCache struct {
	redisClient redis.UniversalClient
}

var _ ports.EntityCache = (*EntityCache)(nil)

func NewEntityCache(redisClient redis.UniversalClient) *EntityCache {
	return &EntityCache{
		redisClient: redisClient,
	}
}

func (c *EntityCache) Set(ctx context.Context, id uint64) error {
	key := c.buildKey(id)
	return c.redisClient.Set(ctx, key, "1", entityCacheTTL).Err()
}

func (c *EntityCache) Get(ctx context.Context, id uint64) (bool, error) {
	key := c.buildKey(id)
	result := c.redisClient.Get(ctx, key)
	if err := result.Err(); err != nil {
		if errors.Is(err, redislib.Nil) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

func (c *EntityCache) Delete(ctx context.Context, id uint64) error {
	key := c.buildKey(id)
	return c.redisClient.Del(ctx, key).Err()
}

func (c *EntityCache) buildKey(id uint64) string {
	return fmt.Sprintf("%s%d", entityCacheKeyPrefix, id)
}
```

## Cache Variants

### Boolean Flag Cache (Set/Get/Delete)

Use when caching simple existence or state flags.

- Store `"1"` as value
- Return `false, nil` when key doesn't exist

### JSON Data Cache (Set/Get/Delete)

Use when caching structured data. Data structs are defined in the `dto` package.

- Serialize with `json.Marshal` before storing
- Deserialize with `json.Unmarshal` when retrieving
- Return `nil, nil` on missing key, or a domain error if the key is expected to always exist (e.g. `errs.ErrXxxNotFound`)
- Use distinct variable names (`getErr`, `unmarshalErr`) to avoid shadowing

## Redis Nil Detection

Always import `redislib "github.com/redis/go-redis/v9"` and use `redislib.Nil`:

```go
if errors.Is(err, redislib.Nil) {
	return false, nil // key doesn't exist — not an error
}
```

## Key Building

String ID (simple concatenation):

```go
func (c *EntityCache) buildKey(id string) string {
	return entityCacheKeyPrefix + id
}
```

Uint64 ID:

```go
func (c *EntityCache) buildKey(id uint64) string {
	return fmt.Sprintf("%s%d", entityCacheKeyPrefix, id)
}
```

Composite key:

```go
func (c *EntityCache) buildKey(userID uint64, resourceID string) string {
	return fmt.Sprintf("%s%d:%s", entityCacheKeyPrefix, userID, resourceID)
}
```

## TTL Configuration

**Fixed TTL** — for short-lived data where stampede is not a concern:

```go
const (
	entityCacheKeyPrefix = "entity_name:"
	entityCacheTTL       = 10 * time.Minute
)
```

**Randomized TTL** — for long-lived data created in bulk (prevents cache stampede):

```go
import "math/rand"

const (
	entityCacheKeyPrefix = "entity_name:"
	entityCacheTTLMin    = 23 * time.Hour
	entityCacheTTLMax    = 25 * time.Hour
)

func (c *EntityCache) calculateTTL() time.Duration {
	min := entityCacheTTLMin.Milliseconds()
	max := entityCacheTTLMax.Milliseconds()
	randomMs := min + rand.Int63n(max-min+1)
	return time.Duration(randomMs) * time.Millisecond
}
```

Common TTL ranges:
- `5-15 minutes` — OTP codes, OAuth state, rate limits
- `50-70 minutes` — User sessions
- `12-25 hours` — Activation flags, daily metrics
- `6.5-7.5 days` — Weekly aggregations

## Context

Always accept `ctx context.Context` as the first parameter in every method:

```go
func (c *EntityCache) Set(ctx context.Context, id uint64) error {
```

## Naming

- Port interface: `XxxCache` (`ports` package, no suffix)
- Implementation struct: `XxxCache` (`cache` package — same name, disambiguated by package)
- Constructor: `NewXxxCache`, returns `*XxxCache`
- Constants: lowercase, package-level (e.g. `entityCacheKeyPrefix`, `entityCacheTTL`)

## Fx Wiring

Add to `internal/modules/<module>/module.go`:

```go
fx.Provide(
	fx.Annotate(
		cache.NewXxxCache,
		fx.As(new(ports.XxxCache)),
	),
),
```

## Dependencies

- `redis.UniversalClient` from `"github.com/cristiano-pacheco/bricks/pkg/redis"`
- `redislib "github.com/redis/go-redis/v9"` for nil detection

## Example: JSON Data Cache (OAuth State)

DTO (`dto/oauth_state_dto.go`):

```go
package dto

type OAuthStateData struct {
	// fields
}
```

Port (`ports/oauth_state_cache.go`):

```go
package ports

import (
	"context"

	"github.com/cristiano-pacheco/pingo/internal/modules/identity/dto"
)

// OAuthStateCache manages temporary OAuth state tokens used during the authorization flow.
// Tokens are short-lived and must be consumed exactly once to prevent CSRF attacks.
type OAuthStateCache interface {
	Set(ctx context.Context, state string, data dto.OAuthStateData) error
	Get(ctx context.Context, state string) (*dto.OAuthStateData, error)
	Delete(ctx context.Context, state string) error
}
```

Implementation (`cache/oauth_state_cache.go`):

```go
package cache

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/cristiano-pacheco/bricks/pkg/redis"
	"github.com/cristiano-pacheco/pingo/internal/modules/identity/dto"
	"github.com/cristiano-pacheco/pingo/internal/modules/identity/errs"
	"github.com/cristiano-pacheco/pingo/internal/modules/identity/ports"
	redislib "github.com/redis/go-redis/v9"
)

const (
	oauthStateKeyPrefix = "oauth_state:"
	oauthStateTTL       = 10 * time.Minute
)

type OAuthStateCache struct {
	redisClient redis.UniversalClient
}

var _ ports.OAuthStateCache = (*OAuthStateCache)(nil)

func NewOAuthStateCache(redisClient redis.UniversalClient) *OAuthStateCache {
	return &OAuthStateCache{
		redisClient: redisClient,
	}
}

func (c *OAuthStateCache) Set(ctx context.Context, state string, data dto.OAuthStateData) error {
	key := c.buildKey(state)
	jsonData, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("marshal oauth state: %w", err)
	}
	return c.redisClient.Set(ctx, key, jsonData, oauthStateTTL).Err()
}

func (c *OAuthStateCache) Get(ctx context.Context, state string) (*dto.OAuthStateData, error) {
	key := c.buildKey(state)
	result := c.redisClient.Get(ctx, key)
	if getErr := result.Err(); getErr != nil {
		if errors.Is(getErr, redislib.Nil) {
			return nil, errs.ErrOAuthStateNotFound
		}
		return nil, getErr
	}
	jsonData, err := result.Bytes()
	if err != nil {
		return nil, fmt.Errorf("get bytes: %w", err)
	}
	var data dto.OAuthStateData
	if unmarshalErr := json.Unmarshal(jsonData, &data); unmarshalErr != nil {
		return nil, fmt.Errorf("unmarshal oauth state: %w", unmarshalErr)
	}
	return &data, nil
}

func (c *OAuthStateCache) Delete(ctx context.Context, state string) error {
	key := c.buildKey(state)
	return c.redisClient.Del(ctx, key).Err()
}

func (c *OAuthStateCache) buildKey(state string) string {
	return oauthStateKeyPrefix + state
}
```

Fx wiring (`module.go`):

```go
fx.Provide(
	fx.Annotate(
		cache.NewOAuthStateCache,
		fx.As(new(ports.OAuthStateCache)),
	),
),
```

## Critical Rules

1. **Two files**: Port in `ports/`, implementation in `cache/`
2. **Interface assertion**: `var _ ports.XxxCache = (*XxxCache)(nil)` below the struct
3. **Constructor**: Returns `*XxxCache` (pointer)
4. **Context**: Always accept `ctx context.Context` as first parameter — never use `context.Background()` internally
5. **Redis nil**: Import `redislib "github.com/redis/go-redis/v9"` and use `errors.Is(err, redislib.Nil)`
6. **Fixed vs randomized TTL**: Use fixed TTL for short-lived data; use `calculateTTL()` only for long-lived bulk data to prevent cache stampede
7. **buildKey**: Always use a `buildKey()` helper; use `+` concatenation for string IDs, `fmt.Sprintf` for numeric IDs
8. **Missing keys**: Return zero value + `nil`, or a domain error if the key is expected to exist
9. **Data types in dto**: Define data structs in the `dto` package, never in `ports`
10. **No comments on methods**: Only add detailed doc comments on port interfaces
11. **Redis client type**: `redis.UniversalClient` from `github.com/cristiano-pacheco/bricks/pkg/redis`
12. **No TTL in interface**: TTL is internal, never exposed as a method parameter
13. **Error messages**: Use short format `"action noun: %w"` (e.g. `"marshal oauth state: %w"`)

## Workflow

1. Create port interface in `ports/<name>_cache.go`
2. Create cache implementation in `cache/<name>_cache.go`
3. Add Fx wiring to `module.go`
4. Run `make lint`
5. Run `make nilaway`
