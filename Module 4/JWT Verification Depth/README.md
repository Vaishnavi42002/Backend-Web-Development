# LU 51.1 Bonus — JWT Verification Depth Starter

## Task

1. **Extend `requireAuth`** in `src/middleware/requireAuth.js` to:
   - Add `audience: 'lu51-api'` to `jwt.verify` options.
   - Log error name and message internally inside the catch block.
   - Return the same generic 401 for all four failure modes: missing header, expired, invalid signature, wrong audience.

2. **Write tests** in `tests/verify-depth.js`:
   - At least one test per failure mode (4 total).
   - Each test asserts `status === 401` and `body.error.code === 'AUTH_REQUIRED'`.

## Setup

```bash
cp .env.example .env
npm install
npm start
```

## Run tests

```bash
npm test
```

## Files to edit

```
src/middleware/requireAuth.js   ← extend here
tests/verify-depth.js          ← write tests here
```

Do not modify any other files.
