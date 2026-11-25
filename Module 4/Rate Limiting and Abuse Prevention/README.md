# LU58 — Rate Limiting & Abuse Prevention (Starter)

Add `express-rate-limit` to the auth routes so brute-force attempts are throttled with a `429` and a `Retry-After` header. You complete one file.

---

## What you are building

```
POST /auth/login | /auth/register | /auth/refresh
  first 5 attempts per 15 min per IP  -> handled normally (401 on bad login, etc.)
  6th attempt                         -> 429 Too Many Requests + Retry-After
GET  /health                          -> never rate limited (proves the limiter is scoped)
```

## Project structure

```
src/
  app.js                     ← Express setup (given, do not modify)
  data.js                    ← user store for /auth/login (given, do not modify)
  routes/
    auth.js                  ← login/register/refresh, authLimiter already wired (given, do not modify)
    health.js                ← GET /health, no limit (given, do not modify)
  middleware/
    rateLimiter.js           ← YOU IMPLEMENT THIS
tests/
  run.js                     ← automated tests (do not modify)
package.json                 ← express-rate-limit is already listed
```

## Setup

```bash
npm install
cp .env.example .env
npm test        # fails until you implement the limiter
```

## What to implement — `src/middleware/rateLimiter.js`

Replace the pass-through stub with a real `express-rate-limit` instance, exported as the module:

```js
const rateLimit = require('express-rate-limit');
module.exports = rateLimit({
  windowMs: 15 * 60 * 1000,      // 15 minutes
  max: 5,                        // 5 attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,  // only failed attempts count
  handler: (req, res) => {
    // set a Retry-After header, then respond 429
  },
});
```

Requirements checked by the tests:

- `windowMs` 15 min, `max` 5.
- After the limit, a **429** with a **`Retry-After`** header (positive seconds).
- `standardHeaders: true`, `legacyHeaders: false`, `skipSuccessfulRequests: true`.

You must also **add a comment** explaining how a Redis-backed store (`rate-limit-redis`) replaces the in-memory store in a multi-instance deployment — and why the in-memory store fails behind a load balancer (each instance keeps its own counter, so a client spread across N instances gets N× the limit).

## Run the tests

```bash
npm test
```

Four scenarios:

**Test 1 — First 5 attempts allowed.** Five failed logins all return `401` (within the limit, not throttled).

**Test 2 — 6th attempt blocked.** The sixth attempt returns `429`.

**Test 3 — Retry-After present.** The 429 response carries a `Retry-After` header with a positive value.

**Test 4 — Limiter is scoped.** `GET /health` still returns `200` after the auth limit is hit, proving the limiter is on the auth routes only, not global.

Expected when correct:

```
Results: 5 passed, 0 failed
All tests passed! ✓
```

## Debugging guide

| Failing test | What to check |
|---|---|
| Test 2 (no 429) | Your export is still the pass-through, or `max` is not set to 5 |
| Test 3 (no Retry-After) | Your `handler` does not set the `Retry-After` header |
| Test 4 (health blocked) | You applied the limiter globally instead of via the given `auth.js` wiring |

## Submission

1. Implement `src/middleware/rateLimiter.js` (including the Redis comment).
2. `npm test` → `Results: 5 passed, 0 failed`.
3. Open a PR explaining why auth routes get a stricter limit and why the in-memory store fails across instances.
