# Introduction to Webhooks: HMAC Verification & Idempotency

The webhook endpoint `POST /webhooks` currently accepts any POST request without
verifying the sender. Implement HMAC-SHA256 signature verification, event-id
idempotency, and fast 200 acknowledgement so the handler is secure and correct
under retry conditions. You implement one file.

---

## What you are building

```
POST /webhooks
  verify HMAC-SHA256 over raw body -> 401 if invalid/missing
  parse body -> check event.id against processed store
    seen   -> 200 already_processed (no re-processing)
    new    -> mark seen -> 200 received -> handleEvent(event) after response
```

## Project structure

```
src/
  app.js             ← Express app, route wired (given, do not modify)
  eventHandlers.js    ← stub handleEvent() used for test tracking (given, do not modify)
  webhookHandler.js   ← YOU IMPLEMENT THIS
tests/
  run.js              ← automated tests (do not modify)
.env.example          ← copy to .env
package.json           ← express, dotenv already listed
```

## Setup

```bash
npm install
cp .env.example .env      # WEBHOOK_SECRET=supersecretkey
npm start                  # runs on http://localhost:3000
npm test                   # fails until you implement webhookHandler.js
```

## What to implement

### `src/webhookHandler.js`

Export `handleWebhook(req, res)` and `_processedIds` (a `Set`).

1. **Verify the HMAC-SHA256 signature.** Header `x-webhook-signature` arrives as
   `sha256=<hex>`. Compute
   `crypto.createHmac('sha256', WEBHOOK_SECRET).update(req.body).digest('hex')`
   over `req.body` **as a Buffer**, not a parsed object. Compare with
   `crypto.timingSafeEqual`. Missing or mismatched signature → `401`.
2. **Parse after verification.** `const event = JSON.parse(req.body)`.
3. **Idempotency check.** If `_processedIds.has(event.id)`, return
   `200 { status: 'already_processed' }` without touching `handleEvent`.
4. **Mark the event id as processed** before acknowledging.
5. **Return 200 before processing.**
   `res.status(200).json({ status: 'received' })`, then call
   `handleEvent(event)` inside `setImmediate(() => { ... })`.

## Rules

- Do not modify `src/app.js`, `src/eventHandlers.js`, or `tests/run.js`.
- HMAC must be computed over `req.body` as a **Buffer**, not a parsed or
  re-serialised object.
- Use `crypto.timingSafeEqual`, not `===`.
- `handleEvent` must be called after the response is sent.

## Run the tests

```bash
npm test
```

Five scenarios:

1. A valid webhook (correct HMAC signature) is accepted and returns `200`.
2. A forged webhook (wrong signature) is rejected with `401`.
3. A missing signature header is rejected with `401`.
4. Replaying the same event id a second time returns `200` without calling
   `handleEvent` again.
5. A new event id is processed (`handleEvent` called) and the id is added to
   the store.

Expected when correct:

```
Results: 5 passed, 0 failed
All tests passed! ✓
```

## Debugging guide

| Symptom | Likely cause |
|---|---|
| `Hmac.update` throws "must be of type string or an instance of Buffer" | `req.body` is a parsed object, not a Buffer. Check that `express.raw()` runs before any `express.json()` middleware sees this route (see `src/app.js` comment) |
| Test 1 fails with `501` | `handleWebhook` still returns the stub `501`, implement it |
| Test 2/3 fail (no 401) | Signature comparison logic wrong, or missing-header case not handled before hashing |
| Test 4 fails (event re-processed) | Idempotency check missing, or the id is marked *after* calling `handleEvent` instead of before |
| Test 5 fails (`handleEvent` never called) | `setImmediate` callback missing, or `res.status(200)` never sent |

## Submission

1. Fork or clone this project and create a branch in your own repository.
2. Implement `src/webhookHandler.js`.
3. Create a `.env` file with `WEBHOOK_SECRET=supersecretkey`.
4. Run `npm test`, confirm `Results: 5 passed, 0 failed`.
5. Open a PR. In the description, briefly explain: *the three steps the
   handler performs in order, and why event-id idempotency is necessary even
   for a handler that returns 200 immediately.*
6. Submit the PR link.
