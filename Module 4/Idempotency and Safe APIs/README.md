# LU57 — Idempotency & Safe APIs (Starter)

Make `POST /payments` idempotent so a retried request with the same key is processed exactly once. Everything else is provided — you complete one file.

---

## What you are building

```
POST /payments
  Header: Idempotency-Key: <unique per purchase>
  Body:   { "amount": 500 }

  first time with a key   -> charge once, return 201 { id, amount, status }
  repeat with same key    -> return the SAME stored response, no new charge
  different key           -> a separate charge
  no key                  -> 400 IDEMPOTENCY_KEY_REQUIRED
```

## Project structure

```
src/
  app.js               ← Express setup (given, do not modify)
  store.js             ← charges[], idempotency Map, nextChargeId()  (given, do not modify)
  routes/
    payments.js        ← YOU IMPLEMENT THIS
    debug.js           ← GET /_debug/charge-count for the tests (given, do not modify)
tests/
  run.js               ← automated tests (do not modify)
package.json
```

## Setup

```bash
npm install
cp .env.example .env
npm test        # watch it fail, then implement, then watch it pass
```

## What to implement — `src/routes/payments.js`

Read the key from `req.headers['idempotency-key']` and follow four rules:

1. **Missing key** → `400` with `{ error: { code: 'IDEMPOTENCY_KEY_REQUIRED', message: '...' } }`. Without a key you cannot deduplicate, so you must reject.
2. **Repeat key** → return the stored `{ status, body }`; do **not** charge again.
3. **New key** → create one charge (`charges.push(...)`, `nextChargeId()`), store `idempotency.set(key, { status: 201, body })`, return it.
4. **Different key** → a separate operation (handled naturally by 2 and 3).

**Why reject a missing key?** With no key, two retries look like two different requests and you would double-charge. Rejecting forces the client to send a key so retries are safe.

## Run the tests

```bash
npm test
```

Six scenarios, 14 assertions:

**Test 1 — First request charges once.** A key + amount returns `201` with a charge id. (2 assertions)

**Test 2 — Same key is deduplicated.** A retry with the same key returns the **same** charge id and the charge count stays at 1. This is the core deliverable. (3 assertions)

**Test 3 — Different key charges separately.** A new key returns a new id and the count rises to 2. (3 assertions)

**Test 4 — Missing key is rejected.** No `Idempotency-Key` returns `400` with `error.code` `IDEMPOTENCY_KEY_REQUIRED`, and no charge is created. (3 assertions)

**Test 5 — Second key retry is deduplicated.** Repeating the second key returns its original id, count still 2. (2 assertions)

**Test 6 — Exactly-once overall.** Only 2 real charges happened despite the retries. (1 assertion)

Expected when correct:

```
Results: 14 passed, 0 failed
All tests passed! ✓
```

## Debugging guide

| Failing test | What to check |
|---|---|
| Test 2 (different id / count 2) | You are not returning the cached response for a known key |
| Test 3 (count wrong) | You are charging more than once, or not at all, for a new key |
| Test 4 (not 400) | You are not rejecting a missing `Idempotency-Key` |
| Test 6 (count > 2) | A retry is still creating a duplicate charge |

## Submission

1. Implement `src/routes/payments.js`.
2. `npm test` → `Results: 14 passed, 0 failed`.
3. Open a PR. **Include a Postman screenshot** showing the same key returning the cached response on retry (same charge id, no new charge).
4. In the description, explain why a missing key must be rejected.
