# Background Jobs with BullMQ: Email Verification OTP Flow

Registration sends a welcome email synchronously, blocking the request for up to 3,000 ms.
Move email delivery to a BullMQ background job with retries, and implement a complete
email verification flow: `POST /auth/request-verification` enqueues an OTP email job;
`POST /auth/verify-otp` checks the code with expiry and attempt-limit guards. You
complete three files.

---

## What you are building

```
POST /auth/request-verification
  generate OTP -> store it -> emailQueue.add('otp', ...) -> 200 (< 10ms)

Worker (separate, async):
  picks up the 'otp' job -> sends email -> completed (or throws -> retried)

POST /auth/verify-otp
  verifyOTP() -> not_found/wrong_code -> 401, expired -> 410, too_many_attempts -> 429, ok -> 200
```

## Project structure

```
src/
  app.js       ← Express app, both routes wired (given, do not modify)
  email.js     ← nodemailer transporter from .env (given, do not modify)
  queue.js     ← YOU IMPLEMENT THIS
  worker.js    ← YOU IMPLEMENT THIS
  otpStore.js  ← YOU IMPLEMENT THIS
tests/
  run.js       ← automated tests (do not modify)
.env.example    ← copy to .env and fill in SMTP credentials
package.json    ← bullmq, express, nodemailer, dotenv already listed
```

## Setup

```bash
npm install
cp .env.example .env      # fill in SMTP_USER / SMTP_PASS from https://ethereal.email/create
redis-server               # Redis must be running before you start or test
npm start                  # runs on http://localhost:3000
npm test                   # fails until you implement all three files
```

## What to implement

### 1. `src/queue.js`
- Create a BullMQ `Queue` named `'email'` with a Redis connection (host and port from `process.env.REDIS_HOST` / `REDIS_PORT`, defaulting to `localhost:6379`).
- Export `{ emailQueue, connection }`.

### 2. `src/worker.js`
- Create a BullMQ `Worker` that listens on the `'email'` queue.
- Handle `job.name === 'otp'`: send an email via `transporter.sendMail()` from `src/email.js` with the OTP in the body.
- Configure retries: `defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 1000 } }`.
- Log `'completed'` and `'failed'` events.
- Throwing inside the worker function signals failure → retry. Returning signals completion.

### 3. `src/otpStore.js`
Implement and export:
- `generateOTP()`: returns a random 6-digit numeric string.
- `storeOTP(email, otp)`: stores the OTP in a Map with `expiresAt` (10 minutes from now) and `attempts: 0`.
- `verifyOTP(email, code)`: checks the OTP and returns `{ ok, reason }`. Enforce **in order**:
  1. Not found → `{ ok: false, reason: 'not_found' }` (route returns 401)
  2. Expired → `{ ok: false, reason: 'expired' }` (route returns 410)
  3. Too many attempts (>= 3) → `{ ok: false, reason: 'too_many_attempts' }` (route returns 429)
  4. Wrong code → increment `attempts`, return `{ ok: false, reason: 'wrong_code' }` (route returns 401)
  5. Correct → delete from store (single-use), return `{ ok: true }`
- **Also export the Map itself as `_store`:** `module.exports = { generateOTP, storeOTP, verifyOTP, markVerified, _store }`. The test suite reaches into `_store` directly to simulate an already-expired OTP, there's no other way to fast-forward time. Skip this and the expiry test fails even with a correct `verifyOTP()`.

## Rules

- Do not modify `src/app.js`, `src/email.js`, or `tests/run.js`.
- Redis must be running locally before `npm test`.
- The worker must be configured with `attempts: 3` and `backoff: exponential`, these are tested.
- The OTP must be exactly 6 digits.

## Run the tests

```bash
npm test
```

Six scenarios:

1. `POST /auth/request-verification` returns 200 with a message.
2. The OTP is a 6-digit numeric string.
3. `POST /auth/verify-otp` with the correct OTP returns 200.
4. `POST /auth/verify-otp` with a wrong OTP returns 401.
5. After 3 wrong OTP attempts, `POST /auth/verify-otp` returns 429.
6. `POST /auth/verify-otp` with an expired OTP (mocked via `_store`) returns 410.

Expected when correct:

```
Results: 6 passed, 0 failed
All tests passed! ✓
```

## Debugging guide

| Symptom | Likely cause |
|---|---|
| Test 1 fails, or the server crashes on start | `queue.js` not returning a real `Queue`, or Redis isn't running |
| Emails never arrive (Ethereal inbox empty) | `worker.js` not sending mail, or wrong SMTP credentials in `.env` |
| Test 5 fails (no 429 after 3 wrong attempts) | Attempt counter not incremented, or checked after the code comparison instead of before |
| Test 6 fails even though `verifyOTP` looks correct | `_store` not exported from `otpStore.js`, the test can't inject an expired entry |
| Worker never retries on failure | `attempts` / `backoff` missing from `defaultJobOptions` |

## Submission

1. Fork or clone this project and create a branch in your own repository.
2. Implement `src/queue.js`, `src/worker.js`, and `src/otpStore.js`.
3. Create a `.env` file with Ethereal SMTP credentials (from https://ethereal.email/create).
4. Run `npm test`, confirm `Results: 6 passed, 0 failed`.
5. Open a PR. In the description, briefly explain: *why does `POST /auth/request-verification` return before the email is sent, and why is the worker configured with retries?*
6. Submit the PR link.
