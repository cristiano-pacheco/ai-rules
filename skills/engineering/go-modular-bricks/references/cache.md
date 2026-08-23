# Cache adapters

## Recipe: add cache only to a flow that uses it

Create a cache after the impact map identifies cached state. Do not create an
empty `cache/` package, a no-op implementation, or an Fx binding merely to make
caching optional. Put the consumer-owned port at
`internal/modules/<module>/ports/<name>_cache.go` and the adapter at
`internal/modules/<module>/cache/<name>_cache.go`.

Choose a boolean port for presence, flags, and rate limits. Choose a typed
value port for structured state. TTL stays inside the adapter and never appears
in the port.

```go
package ports

import "context"

// SessionCache keeps session presence for authentication operations. Get
// returns false without an error when the session key is absent.
type SessionCache interface {
	Set(ctx context.Context, id uint64) error
	Get(ctx context.Context, id uint64) (bool, error)
	Delete(ctx context.Context, id uint64) error
}
```

## Adapter shape and context

Keep stateful key and TTL helpers on the concrete cache type. Place constants,
type, assertion, constructor, public methods, then helpers in that order. Use
the caller context for every cache call.

```go
const (
	sessionCacheKeyPrefix = "session:"
	sessionCacheTTL       = 10 * time.Minute
)

type SessionCache struct {
	client cacheclient.UniversalClient
}

var _ ports.SessionCache = (*SessionCache)(nil)

func NewSessionCache(client cacheclient.UniversalClient) *SessionCache {
	return &SessionCache{client: client}
}

func (c *SessionCache) Set(ctx context.Context, id uint64) error {
	return c.client.Set(ctx, c.buildKey(id), "1", sessionCacheTTL).Err()
}

func (c *SessionCache) Get(ctx context.Context, id uint64) (bool, error) {
	err := c.client.Get(ctx, c.buildKey(id)).Err()
	if err == nil {
		return true, nil
	}
	if errors.Is(err, redislib.Nil) {
		return false, nil
	}
	return false, err
}

func (c *SessionCache) Delete(ctx context.Context, id uint64) error {
	return c.client.Del(ctx, c.buildKey(id)).Err()
}

func (c *SessionCache) buildKey(id uint64) string {
	return fmt.Sprintf("%s%d", sessionCacheKeyPrefix, id)
}
```

Import the configured Redis interface as `cacheclient` and
`github.com/redis/go-redis/v9` as `redislib`. Check `redislib.Nil` with
`errors.Is`. A boolean miss returns `false, nil`. A typed-value miss returns its
zero or nil value with no error, unless the port defines absence as an expected
typed error.

## Typed values, keys, and TTL

Keep typed cache values in a DTO package. Marshal before `Set` and unmarshal
after `Get`; wrap serialization failures with an action and noun, such as
`fmt.Errorf("marshal session state: %w", err)`. Build keys with a stable
module-and-purpose prefix. Concatenate string IDs and format numeric or
composite IDs explicitly.

```go
func (c *SessionStateCache) Set(ctx context.Context, key string, state dto.SessionState) error {
	value, err := json.Marshal(state)
	if err != nil {
		return fmt.Errorf("marshal session state: %w", err)
	}
	return c.client.Set(ctx, c.buildKey(key), value, sessionStateCacheTTL).Err()
}

func (c *SessionStateCache) Get(ctx context.Context, key string) (dto.SessionState, error) {
	value, err := c.client.Get(ctx, c.buildKey(key)).Bytes()
	if err != nil {
		if errors.Is(err, redislib.Nil) {
			return dto.SessionState{}, nil
		}
		return dto.SessionState{}, err
	}

	var state dto.SessionState
	if err := json.Unmarshal(value, &state); err != nil {
		return dto.SessionState{}, fmt.Errorf("unmarshal session state: %w", err)
	}
	return state, nil
}
```

Use a fixed TTL for independently written, short-lived values. For a large
batch of long-lived values, calculate an inclusive random TTL between defined
minimum and maximum bounds to spread expiry. Do not pass TTL through a use case
or port method.

```go
func (c *SessionCache) calculateTTL() time.Duration {
	min := sessionCacheTTLMin.Milliseconds()
	max := sessionCacheTTLMax.Milliseconds()
	return time.Duration(min+rand.Int63n(max-min+1)) * time.Millisecond
}
```

Bind the adapter only in the owning module when the selected flow uses it:

```go
fx.Provide(
	fx.Annotate(cache.NewSessionCache, fx.As(new(ports.SessionCache))),
)
```

Test every behavior the port exposes, plus key construction, serialization
failures, and TTL selection when the adapter uses them. Use controlled Redis
for an integration flow that relies on cache semantics.
