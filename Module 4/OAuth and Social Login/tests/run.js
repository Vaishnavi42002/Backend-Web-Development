'use strict';
// tests/run.js — LU55 OAuth & Social Login
//
// How this works without a real browser:
//   verifyCallback is exported from src/auth/passport.js.
//   We call it directly with mock Google profile objects and
//   wrap the done() callback in a Promise — so we can use async/await.
//   The HTTP tests (T7, T8) start the server on port 3001 and use
//   raw http.request — no test framework needed.
//
// Run: npm test

process.env.NODE_ENV            = 'test';
process.env.ACCESS_SECRET       = 'lu55-test-secret-do-not-use-in-production-32c';
process.env.GOOGLE_CLIENT_ID    = 'test-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';

const http = require('http');

// Require modules AFTER env is set
const { verifyCallback }         = require('../src/auth/passport');
const { signToken, verifyToken } = require('../src/utils/jwt');
const { users }                  = require('../src/data');
const app                        = require('../src/app');

// ── Assertion helpers ─────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    failed++;
  }
}

// Wraps Passport's done-style callback into a Promise so we can await it
function callVerify(profile) {
  return new Promise((resolve, reject) => {
    verifyCallback(null, null, profile, (err, user) => {
      if (err) reject(err);
      else resolve(user);      // user is false if auth was rejected
    });
  });
}

// Raw HTTP request helper (no dependencies)
function request(method, path, headers = {}) {
  return new Promise((resolve) => {
    const opts = {
      hostname: 'localhost',
      port: 3001,
      method,
      path,
      headers: { 'Content-Type': 'application/json', ...headers },
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        let body;
        try { body = JSON.parse(data); } catch { body = data; }
        resolve({ status: res.statusCode, body });
      });
    });
    req.on('error', (e) => resolve({ status: 0, body: e.message }));
    req.end();
  });
}

// ── Mock Google profiles ──────────────────────────────────────────────────────
//
// bobProfile    → profile.id matches u-2's googleId (returning OAuth user)
// aliceProfile  → email matches u-1 (local account, no googleId) → should link
// carolProfile  → completely new, no match → should create
//
const bobProfile = {
  id: 'google-sub-bob-999',
  emails: [{ value: 'bob@gmail.com' }],
  displayName: 'Bob Jones',
  _json: { email_verified: true },
};

const aliceProfile = {
  id: 'google-sub-alice-456',
  emails: [{ value: 'alice@gmail.com' }],
  displayName: 'Alice Smith',
  _json: { email_verified: true },
};

const carolProfile = {
  id: 'google-sub-carol-789',
  emails: [{ value: 'carol@example.com' }],
  displayName: 'Carol Williams',
  _json: { email_verified: true },
};

// unverifiedProfile → email_verified is false; linking should be rejected
const unverifiedProfile = {
  id: 'google-sub-unverified-000',
  emails: [{ value: 'alice@gmail.com' }],   // matches u-1 by email
  displayName: 'Attacker',
  _json: { email_verified: false },
};

// ── Run all tests ─────────────────────────────────────────────────────────────
const server = app.listen(3001);

(async () => {
  console.log('\n── LU55 OAuth & Social Login — Test Suite ──\n');

  // ── Test 1: Returning OAuth user (googleId match) ─────────────────────────
  console.log('Test 1: Returning OAuth user — googleId already stored');
  const bob = await callVerify(bobProfile);
  assert('returns the existing user object (u-2)', bob && bob.id === 'u-2');
  assert('role preserved (moderator)', bob && bob.role === 'moderator');
  assert('no duplicate created', users.filter((u) => u.email === 'bob@gmail.com').length === 1);

  // ── Test 2: Link existing local account (email match) ─────────────────────
  console.log('\nTest 2: Existing local account — email match → link googleId');
  const userCountBeforeLink = users.length;
  const alice = await callVerify(aliceProfile);
  assert('returns existing user (u-1, not a new user)', alice && alice.id === 'u-1');
  assert('googleId now set on existing account', alice && alice.googleId === 'google-sub-alice-456');
  assert('no new user created', users.length === userCountBeforeLink);

  // ── Test 3: Brand-new user ────────────────────────────────────────────────
  console.log('\nTest 3: Brand-new user — no match → create');
  const countBeforeCreate = users.length;
  const carol = await callVerify(carolProfile);
  assert('new user returned (not false)', carol !== null && carol !== false);
  assert('user added to store', users.length === countBeforeCreate + 1);

  // ── Test 4: New user gets default role ────────────────────────────────────
  console.log('\nTest 4: New user role defaults to member');
  assert('role is member', carol && carol.role === 'member');

  // ── Test 5: New user has googleId stored ──────────────────────────────────
  console.log('\nTest 5: New user googleId matches profile.id');
  assert('googleId is profile.id', carol && carol.googleId === carolProfile.id);

  // ── Test 6: Unverified email — reject, do NOT link ────────────────────────
  console.log('\nTest 6: Unverified email → reject account linking (security)');
  const unverifiedResult = await callVerify(unverifiedProfile);
  assert('returns false (rejected, not linked)', unverifiedResult === false);
  const aliceAfter = users.find((u) => u.id === 'u-1');
  assert('Alice googleId unchanged (not hijacked)', aliceAfter && aliceAfter.googleId === 'google-sub-alice-456');

  // ── Test 7: signToken + verifyToken round-trip ────────────────────────────
  console.log('\nTest 7: signToken issues a valid verifiable JWT');
  const knownToken = signToken({ sub: 'u-2', role: 'moderator' });
  let payload = null;
  try { payload = verifyToken(knownToken); } catch { /* stays null */ }
  assert('JWT is verifiable with verifyToken', payload !== null);
  assert('sub claim is correct', payload && payload.sub === 'u-2');
  assert('role claim is correct', payload && payload.role === 'moderator');

  // ── Test 8: Issued JWT passes requireAuth on protected route ──────────────
  console.log('\nTest 8: Issued JWT works on protected GET /posts');
  const r8 = await request('GET', '/posts', { Authorization: `Bearer ${knownToken}` });
  assert('status 200', r8.status === 200);
  assert('response contains userId', r8.body && r8.body.userId === 'u-2');

  // ── Test 9: No token returns 401 ─────────────────────────────────────────
  console.log('\nTest 9: Missing token → 401 on protected route');
  const r9 = await request('GET', '/posts');
  assert('status 401', r9.status === 401);

  // ── Results ───────────────────────────────────────────────────────────────
  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed === 0) console.log('All tests passed! ✓');
  server.close();
  process.exit(failed > 0 ? 1 : 0);
})();
