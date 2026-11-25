# Caching with Redis: Cache-Aside on the Trending Feed

`GET /feed` currently queries the database on every request, even when the
data hasn't changed in minutes. Wrap it with the cache-aside pattern using
Redis: serve from cache on a hit, query the database and populate the cache
on a miss, invalidate the cache when a new post is created.

---

## What you are building

```
GET /feed
  cacheGet('feed:trending') -> hit? return cached, X-Cache: HIT
                             -> miss? query DB -> cacheSet(..., 60) -> X-Cache: MISS

POST /posts
  db.createPost() -> cacheDel('feed:trending')  (invalidate stale feed)
```

## Project structure

```
src/
  app.js    <- Express app, routes wired with TODOs (given, do not modify except the TODOs)
  db.js     <- simulated DB with a 100ms artificial delay (given, do not modify)
  cache.js  <- YOU IMPLEMENT THIS
tests/
  run.js    <- automated tests (do not modify)
.env.example <- copy to .env
package.json  <- express, ioredis, dotenv already listed
```

## Setup

```bash
npm install
cp .env.example .env      # defaults work if Redis runs on localhost:6379
redis-server               # Redis must be running before you start or test
npm start                  # runs on http://localhost:3000
npm test                   # fails until you implement cache.js and app.js
```

## What to implement

### 1. `src/cache.js`

Export `cacheGet`, `cacheSet`, `cacheDel`, all wrapping `ioredis` calls in
try/catch for graceful degradation (a Redis outage should slow the app, not
break it):

- `cacheGet(key)`: `redis.get(key)`, `JSON.parse` if found, `null` on a miss
  or on error.
- `cacheSet(key, data, ttlSeconds)`: `redis.set(key, JSON.stringify(data),
  'EX', ttlSeconds)`.
- `cacheDel(key)`: `redis.del(key)`.

### 2. `src/app.js` (only the marked `TODO` lines)

Wrap `GET /feed` with cache-aside: check the cache, on a hit set
`X-Cache: HIT` and return; on a miss query `db.getTrendingPosts()`, populate
the cache with a 60-second TTL, set `X-Cache: MISS`, return. Call
`cacheDel('feed:trending')` inside `POST /posts`, after `db.createPost()`.

## Rules

- Do not modify `src/db.js` or `tests/run.js`.
- TTL must be exactly 60 seconds, tests check the timing budget.
- Every `cacheSet` call must include the `'EX', 60` options, never cache
  without a TTL.
- `X-Cache: HIT` or `X-Cache: MISS` must be set on every `GET /feed`
  response.
- Wrap all Redis calls in try/catch.

## Run the tests

```bash
npm test
```

Five scenarios:

1. `GET /feed` returns `200` with a data array.
2. A second `GET /feed` returns `X-Cache: HIT`.
3. The hit response is both faster than the miss response and under 30ms
   (a real cache read, not just DB timing noise).
4. `POST /posts` invalidates the cache, the next `GET /feed` returns
   `X-Cache: MISS`.
5. After that miss, the next `GET /feed` returns `X-Cache: HIT` again.

Expected when correct:

```
Results: 5 passed, 0 failed
All tests passed! ✓
```

## Debugging guide

| Symptom | Likely cause |
|---|---|
| Test 2 fails (`X-Cache: undefined`) | `app.js`'s `GET /feed` TODOs not implemented yet |
| Test 3 fails, hit time is high | `cacheGet` isn't actually returning the cached value, check `JSON.parse` |
| Test 4 fails (still `HIT` after `POST /posts`) | `cacheDel` not called in `POST /posts`, or called before `db.createPost()` |
| Test 5 fails | Cache not repopulated on the miss that follows invalidation, check `cacheSet` is still called on every miss |
| Everything hangs or throws on startup | Redis not running, start it with `redis-server` |

## Submission

1. Fork or clone this project and create a branch in your own repository.
2. Implement `src/cache.js` and the TODOs in `src/app.js`.
3. Run `npm test`, confirm `Results: 5 passed, 0 failed`.
4. Open a PR. In the description, include the before/after response times
   from your test output or a manual `curl`, and explain why the cache key
   must be deleted on `POST /posts` rather than waiting for the TTL to
   expire.
5. Submit the PR link.
