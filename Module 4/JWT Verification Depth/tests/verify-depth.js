/**
 * LU 51.1 — JWT Verification Depth Tests
 *
 * Write at least ONE test for each failure mode:
 *   1. Missing Authorization header → 401
 *   2. Expired token              → 401
 *   3. Invalid signature          → 401
 *   4. Wrong or missing audience  → 401
 *
 * Each test must assert:
 *   - response status === 401
 *   - response body.error.code === 'AUTH_REQUIRED'
 *
 * The helpers below handle HTTP requests and common token creation.
 * Write your test cases in the RUN TESTS section at the bottom.
 */

require('dotenv').config();
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'lu51-depth-test-secret-do-not-use-in-production-32chars';

const http = require('http');
const {
  signToken,
  signExpiredToken,
  signWithWrongSecret,
  signTokenWrongAudience,
  signTokenNoAudience,
} = require('../src/utils/jwt');

// Silence app startup log
const originalLog = console.log;
console.log = () => {};
const app = require('../src/app');
console.log = originalLog;

const server = http.createServer(app);

// ─── HTTP helper ─────────────────────────────────────────────────────────────
function request(options) {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const req = http.request(
      { hostname: '127.0.0.1', port: addr.port, ...options },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
          catch { resolve({ status: res.statusCode, body: data }); }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

// ─── Assertion helper ────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) { console.log(`  ✓ ${message}`); passed++; }
  else           { console.log(`  ✗ ${message}`); failed++; }
}

// ─── RUN TESTS ───────────────────────────────────────────────────────────────
// Add your test cases here. Example structure:
//
//   console.log('\nTest: <description>');
//   {
//     const res = await request({ path: '/profile', headers: { Authorization: '...' } });
//     assert(res.status === 401, 'Status is 401');
//     assert(res.body?.error?.code === 'AUTH_REQUIRED', 'Code is AUTH_REQUIRED');
//   }

async function runTests() {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  console.log('\nLU 51.1 — JWT Verification Depth Tests\n');

  // ── TODO: Test 1 — Missing Authorization header ────────────────────────────
  // Hint: send a request to /profile with no headers.

  // ── TODO: Test 2 — Expired token ──────────────────────────────────────────
  // Hint: use signExpiredToken({ sub: 'user-7' }) and wait 100ms before sending.

  // ── TODO: Test 3 — Invalid signature ──────────────────────────────────────
  // Hint: use signWithWrongSecret({ sub: 'user-7' }).

  // ── TODO: Test 4 — Wrong or missing audience ──────────────────────────────
  // Hint: use signTokenWrongAudience({ sub: 'user-7' }) or signTokenNoAudience({ sub: 'user-7' }).

  server.close();

  console.log(`\n${'─'.repeat(40)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);

  if (passed === 0 && failed === 0) {
    console.log('\nNo tests written yet. Add your tests in tests/verify-depth.js');
  } else if (failed > 0) {
    console.log('\nSome tests failed. Check your requireAuth implementation.');
    process.exit(1);
  } else {
    console.log('\nAll tests passed! ✓');
  }
}

runTests().catch((err) => {
  console.error('Test runner error:', err.message);
  process.exit(1);
});
