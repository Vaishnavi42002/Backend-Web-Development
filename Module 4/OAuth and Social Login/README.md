# LU55 — OAuth & Social Login (Starter)

Implement Google OAuth login with Passport.js. The OAuth protocol, JWT utilities, and Express setup are already wired. Your job is two focused functions: the Passport verify callback that decides which user to return, and the route handler that issues your app JWT.

---

## What you are building

```
GET /auth/google            ← triggers the OAuth flow (given)
GET /auth/google/callback   ← Passport catches the code, runs your verifyCallback,
                              then your handler issues the app JWT  (you implement this)
GET /posts                  ← protected route; tests your issued JWT (given)
```

When a user clicks "Continue with Google," Passport handles the full OAuth dance — redirect, code exchange, userinfo fetch — and hands you a `profile` object. You decide what to do with it.

---

## Project structure

```
src/
  app.js                    ← Express setup, Passport init (given, do not modify)
  data.js                   ← in-memory user store, three pre-seeded users (given, do not modify)
  auth/
    passport.js             ← GoogleStrategy config + verifyCallback stub  ← YOU IMPLEMENT THIS
  middleware/
    requireAuth.js          ← JWT Bearer verification (given, do not modify)
  routes/
    auth.js                 ← /auth/google trigger (given) + /auth/google/callback stub  ← YOU IMPLEMENT THIS
    posts.js                ← protected GET /posts used in tests (given, do not modify)
  utils/
    jwt.js                  ← signToken / verifyToken (given, do not modify)
tests/
  run.js                    ← automated test suite (do not modify)
.env.example
package.json
```

---

## Setup

**1. Clone and install**

```bash
git clone https://github.com/kalviumcommunity/Backend-Web-Development
cd "Module 5/OAuth and Social Login"
npm install
```

**2. Copy the environment file**

```bash
cp .env.example .env
```

The tests inject their own `ACCESS_SECRET` and dummy Google credentials, so `.env` is only needed for running the server manually.

**3. (Optional) Get real Google credentials for manual testing**

- Go to [console.cloud.google.com](https://console.cloud.google.com).
- Create a project → APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client IDs.
- Application type: **Web application**.
- Authorised redirect URI: `http://localhost:3000/auth/google/callback`.
- Copy Client ID and Client Secret into `.env`.

For `npm test`, real credentials are not required — the test suite calls `verifyCallback` directly with mock profiles.

---

## Pre-seeded users

`src/data.js` ships with three users that cover the three scenarios you must handle:

| id | email | role | googleId | What it tests |
|---|---|---|---|---|
| `u-1` | alice@gmail.com | member | `null` | email match → link operation |
| `u-2` | bob@gmail.com | moderator | `google-sub-bob-999` | googleId match → returning user |
| `u-3` | admin@thread.io | admin | `null` | local-only account |

Do not modify `data.js`. The test assertions depend on these exact values.

---

## What to implement

### File 1 — `src/auth/passport.js`

Find `verifyCallback`. Remove the stub line `return done(null, false)` and replace it with real logic. The function receives a verified Google profile and must return the right user. Handle three scenarios **in this order**:

**Scenario A — Returning OAuth user**
Find a user whose `googleId === profile.id`. If found, call `done(null, user)` and return. Bob's profile hits this path.

**Scenario B — Existing local account, first Google login**
Find a user whose `email === profile.emails[0].value`. If found:
- Check `profile._json.email_verified`. If `false`, call `done(null, false)` — never link an unverified email.
- If `true`, set `user.googleId = profile.id` (link the account) and call `done(null, user)`.
Alice's profile hits this path.

**Scenario C — Brand-new user**
No match at all. Build a new user:
```js
const newUser = { id: nextId(), googleId: profile.id, email, name, role: 'member' };
users.push(newUser);
return done(null, newUser);
```
Carol's profile hits this path.

On any unexpected error, call `done(err)`.

**Why this order matters:** if you check email before `googleId`, a returning user (Bob) who changed his linked email address would create a ghost account instead of finding the existing one. The `googleId` is Google's permanent identifier; the email can change.

### File 2 — `src/routes/auth.js`

Find the `/google/callback` handler. Remove the stub response and add:

```js
const token = signToken({ sub: req.user.id, role: req.user.role });
res.json({ token });
```

`signToken` is already imported. `req.user` is set by Passport after your `verifyCallback` calls `done(null, user)`.

**Why your own JWT?** Google's `accessToken` is scoped to Google's API and expires on Google's schedule. Your API needs a token with your claims (`sub`, `role`), your expiry, and your secret — fully independent of Google.

---

## Run the tests

```bash
npm test
```

The test suite starts the server on port 3001 and runs 9 scenarios (18 assertions). It calls `verifyCallback` directly with mock profiles — no real browser or Google account is needed.

### What each test checks and why it matters

**Test 1 — Returning OAuth user (googleId match)**
Bob's profile has `id: 'google-sub-bob-999'` which matches `u-2`. Your code must find him by `googleId`, return the existing user, and create no duplicate. Two assertions: correct user returned, store length unchanged.

**Test 2 — Link existing local account (email match)**
Alice has `email: 'alice@gmail.com'` in the store with no `googleId`. Her Google profile has the same email and `email_verified: true`. Your code must find her by email, set `user.googleId`, and return the same user (not a new one). Three assertions: same user returned, `googleId` now set, store length unchanged.

**Test 3 — Brand-new user (create)**
Carol has no match in the store. Your code must create a new user object, push it into `users`, and return it. Two assertions: truthy user returned, store is one longer than before.

**Test 4 — New user role defaults to member**
Carol's new user must have `role: 'member'`. Every new OAuth account starts at the lowest privilege. One assertion.

**Test 5 — New user googleId stored**
Carol's new user must have `googleId` equal to `profile.id`. This is the lookup key for all future logins. One assertion.

**Test 6 — Unverified email rejected (security)**
An attacker profile matches Alice's email but has `email_verified: false`. Your code must return `false` (rejected) and leave Alice's existing `googleId` unchanged. Two assertions: result is false, Alice's record not mutated. This is the hardest test — it catches code that links without checking verification.

**Test 7 — signToken produces a valid JWT**
`signToken({ sub: 'u-2', role: 'moderator' })` must produce a JWT that `verifyToken` can decode with the correct `sub` and `role` claims. Three assertions. This is given code — if this fails you likely modified `jwt.js`.

**Test 8 — Issued JWT passes requireAuth**
The token from Test 7 is sent as `Authorization: Bearer ...` to `GET /posts`. Must return 200 with the correct `userId`. Two assertions. If this fails, your token shape is wrong (`sub` vs `id` claim).

**Test 9 — No token returns 401**
`GET /posts` with no Authorization header must return 401. One assertion. This comes from `requireAuth` — if this fails you removed the middleware.

### Expected output when all pass

```
── LU55 OAuth & Social Login — Test Suite ──

Test 1: Returning OAuth user — googleId already stored
  ✓ returns the existing user object (u-2)
  ✓ role preserved (moderator)
  ✓ no duplicate created

Test 2: Existing local account — email match → link googleId
  ✓ returns existing user (u-1, not a new user)
  ✓ googleId now set on existing account
  ✓ no new user created

Test 3: Brand-new user — no match → create
  ✓ new user returned (not false)
  ✓ user added to store

Test 4: New user role defaults to member
  ✓ role is member

Test 5: New user googleId matches profile.id
  ✓ googleId is profile.id

Test 6: Unverified email → reject account linking (security)
  ✓ returns false (rejected, not linked)
  ✓ Alice googleId unchanged (not hijacked)

Test 7: signToken issues a valid verifiable JWT
  ✓ JWT is verifiable with verifyToken
  ✓ sub claim is correct
  ✓ role claim is correct

Test 8: Issued JWT works on protected GET /posts
  ✓ status 200
  ✓ response contains userId

Test 9: Missing token → 401 on protected route
  ✓ status 401

Results: 18 passed, 0 failed
All tests passed! ✓
```

---

## Debugging guide

| Failing test | What to check |
|---|---|
| Test 1 fails (returns false) | You are not looking up by `googleId` first |
| Test 2 fails (new user created) | You are creating instead of finding by email |
| Test 2 fails (googleId not set) | You are not mutating `user.googleId` before calling `done` |
| Test 3 fails (user not added) | You are not pushing the new user into `users` |
| Test 6 fails (not rejected) | You are not checking `profile._json.email_verified` |
| Test 8 fails (401 instead of 200) | Your token uses `id` claim but `requireAuth` expects `sub`; use `signToken({ sub: user.id, ... })` |
| Test 8 fails (wrong userId) | You are passing `req.user.id` as the sub but `posts.js` reads `req.user.sub` — check your `signToken` call |

---

## Security rules

| Rule | Why |
|---|---|
| Check `googleId` before `email` | `googleId` is permanent; email can change — email-first creates ghost accounts |
| Only link when `email_verified: true` | An unverified email is attacker-controlled — never link without verification |
| Issue your own JWT, never return `accessToken` | Google's token is scoped to Google; yours carries your claims and expires on your schedule |
| Default new users to `role: 'member'` | Least privilege — promotion must be deliberate |
| `session: false` on every `passport.authenticate` call | Stateless API; no server-side session cookies |

---

## Submission

1. Implement `verifyCallback` in `src/auth/passport.js`.
2. Implement the callback handler in `src/routes/auth.js`.
3. Run `npm test` — confirm `Results: 18 passed, 0 failed`.
4. Push your branch and open a PR.
5. In the PR description, answer:
   - Why does the check order (googleId → email → create) matter?
   - Why do you issue your own JWT instead of returning Google's `accessToken`?
