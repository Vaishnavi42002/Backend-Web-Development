# LU 54 — Authorization & RBAC

## What you are building

Authentication is already done. You will add the **authorization** layer: a `requireRole` factory middleware, role gates on the privileged routes, and ownership checks on the post routes so a member can only modify their own posts — **closing the IDOR** (Broken Object Level Authorization).

When a request comes in, the pipeline should be:
1. `requireAuth` verifies the token and sets `req.user = { id, role }` (already done).
2. `requireRole(...roles)` — your factory — allows or blocks by role (403 on mismatch).
3. On resource routes, an **ownership check** confirms the caller owns the post, or is a moderator/admin.

Authentication failures are **401**; permission failures are **403**. Never mix them.

---

## What is already provided

You do **not** need to build authentication, routing, login, or the tests. Everything except the authorization logic is ready.

| File | What it does | Edit? |
|---|---|---|
| `src/app.js` | Express app; `requireAuth` applied globally; login + user route wired | ✅ Yes (add the admin gate) |
| `src/middleware/requireAuth.js` | Verifies the token, sets `req.user = { id, role }` | ❌ No |
| `src/middleware/requireRole.js` | **Your task** — currently a pass-through | ✅ Yes |
| `src/routes/posts.js` | **Your task** — `PATCH`/`DELETE` have an open IDOR; `hide` needs a gate | ✅ Yes |
| `src/data.js` | In-memory users (with roles) and posts | ❌ No |
| `src/utils/jwt.js` | Signs test tokens for the login route | ❌ No |
| `tests/run.js` | Automated test suite — 9 scenarios | ❌ No |
| `.env.example` | Contains the test `ACCESS_SECRET` | ❌ No |

> **No database. No bcrypt.** This assignment is authorization only.

---

## Roles and routes

Roles in `src/data.js`:

| User | Role |
|---|---|
| `u-A`, `u-B` | `member` |
| `u-mod` | `moderator` |
| `u-admin` | `admin` |

| Route | Rule to enforce |
|---|---|
| `GET /posts` | any authenticated user |
| `POST /posts` | any authenticated user (author = caller) |
| `PATCH /posts/:id` | owner **or** moderator/admin (else 403); 404 if missing |
| `DELETE /posts/:id` | owner **or** moderator/admin (else 403); 404 if missing |
| `POST /posts/:id/hide` | `moderator` or `admin` only |
| `DELETE /users/:id` | `admin` only |

---

## Setup

**Step 1 — Copy the `.env.example` to `.env`:**

```bash
cp .env.example .env
```

Do not change the secret — the test suite uses the same one to sign tokens.

**Step 2 — Install dependencies:**

```bash
npm install
```

**Step 3 — Start the server:**

```bash
npm start
```

Server runs on `http://localhost:3000`.

---

## Your task

### Step 1 — Implement the `requireRole` factory

Open `src/middleware/requireRole.js`. It currently returns a pass-through:

```js
module.exports = function requireRole(...allowedRoles) {
  return (req, res, next) => {
    next(); // ← stub — replace with the real check
  };
};
```

Implement the real check:

```js
module.exports = function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: { code: 'UNAUTHENTICATED', message: 'Authentication required' },
      });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Insufficient role' },
      });
    }
    next();
  };
};
```

Notice `requireRole` **returns** the middleware — that is the factory pattern, so you can configure it per route: `requireRole('admin')`, `requireRole('moderator', 'admin')`. Read the role from `req.user.role` only — never `req.body`.

### Step 2 — Gate the admin route (`src/app.js`)

```js
const requireRole = require('./middleware/requireRole');
// ...
app.delete('/users/:id', requireRole('admin'), (req, res) => { /* ... */ });
```

Order is the contract: `requireAuth` (applied globally) runs first, then `requireRole('admin')`.

### Step 3 — Gate the hide route (`src/routes/posts.js`)

```js
router.post('/:id/hide', requireRole('moderator', 'admin'), (req, res) => { /* ... */ });
```

### Step 4 — Add ownership checks (`src/routes/posts.js`)

`PATCH` and `DELETE /posts/:id` currently let any user modify any post. Add a check: the caller must own the post, or be a moderator/admin. A shared helper keeps it clean:

```js
const PRIVILEGED = ['moderator', 'admin'];

function loadOwnedOrPrivileged(req, res) {
  const post = posts.find((p) => p.id === req.params.id);
  if (!post) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Post not found' } });
    return null;
  }
  const isOwner = post.authorId === req.user.id;
  const isPrivileged = PRIVILEGED.includes(req.user.role);
  if (!isOwner && !isPrivileged) {
    res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You do not own this resource' } });
    return null;
  }
  return post;
}
```

Then use it:

```js
router.patch('/:id', (req, res) => {
  const post = loadOwnedOrPrivileged(req, res);
  if (!post) return; // 404 or 403 already sent
  post.title = req.body?.title ?? post.title;
  return res.status(200).json(post);
});
```

Check **404 before** the ownership check so you never reveal that a post exists to someone not allowed to see it.

---

## Test manually with curl

**Get a token for a role (login route signs one):**

```bash
curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"sub":"u-B","role":"member"}'
```

Response: `{ "token": "eyJhbGci..." }` — copy the token value.

**Member B edits member A's post 1 (should return 403 after your fix):**

```bash
curl -s -X PATCH http://localhost:3000/posts/1 \
  -H "Authorization: Bearer <MEMBER_B_TOKEN>" \
  -H "Content-Type: application/json" -d '{"title":"hacked"}'
```

Expected: `{ "error": { "code": "FORBIDDEN", "message": "..." } }`

**A member hitting the admin route (should return 403):**

```bash
curl -s -X DELETE http://localhost:3000/users/u-A \
  -H "Authorization: Bearer <MEMBER_B_TOKEN>"
```

Expected: same 403 body.

---

## Run the automated tests

```bash
npm test
```

The suite signs a token for each role and checks nine scenarios. Here is exactly what each one is testing and why it matters:

1. **Owner edits their own post → 200.** Member A owns post 1, so the ownership check passes and the update goes through. Proves you did not over-restrict — owners must still be able to edit.
2. **Member B edits member A's post → 403 (the IDOR).** This is the core of the assignment. Member B is authenticated but is neither the owner nor privileged, so your ownership check must reject it with `403 FORBIDDEN`. Before your fix this returns 200 — that is the vulnerability.
3. **Moderator deletes any post → 200.** A moderator is not the owner of post 2, but the privileged-role branch lets them through. Proves your bypass for `moderator`/`admin` works.
4. **A member tries to hide a post → 403.** Hiding is a pure role decision gated by `requireRole('moderator', 'admin')`. A member is not in that list, so the gate returns 403.
5. **A moderator hides a post → 200.** The same gate lets a moderator through. Proves the role gate is configured with the right roles.
6. **A member calls `DELETE /users/:id` → 403.** The admin-only route is gated by `requireRole('admin')`. A member fails the gate.
7. **An admin calls `DELETE /users/:id` → 200.** The admin passes the same gate. Proves 6 and 7 are decided by role, not by anything else.
8. **PATCH a missing post (`/posts/999`) → 404.** The post does not exist, so you must return `404 NOT_FOUND` — and you must do it *before* the ownership check, so you never leak whether a post exists.
9. **A protected route with no token → 401.** This is produced by the existing `requireAuth`, not your code. It confirms authentication still runs first and that you did not accidentally return 403 for a missing identity.

Each scenario is one or two assertions (status code, and the `error.code` on the 403s), so the full suite is **12 assertions**. When your implementation is correct:

```
Results: 12 passed, 0 failed
All tests passed! ✓
```

If a test fails, read its line: a failing Test 2 means the IDOR is still open; a failing Test 6 means the admin gate is missing; a failing Test 8 means you checked ownership before checking that the post exists.

---

## Security rules — do not break these

| Rule | Why |
|---|---|
| Read the role from `req.user`, never `req.body` | Request bodies are attacker-controlled — anyone can send `role: admin` |
| Return 403 (not 401) for a wrong role | 401 means "unknown identity"; here the identity is known and denied |
| Add an ownership check, not just a role check | Members share a role — a role check alone lets any member edit any post (the IDOR) |
| Check 404 before ownership | Don't reveal a resource exists to someone not allowed to see it |
| Don't modify `requireAuth.js` | Authentication is done; keep authorization separate |

---

## Submission

1. Fork or copy this starter into your own repository.
2. Implement `requireRole` and the ownership checks.
3. Run `npm test` and confirm all tests pass.
4. In the PR description, explain **why test #2 now returns 403 and where that decision is made.**
5. Commit on a feature branch, push, and open a pull request.
6. Submit the pull request link on the platform.
