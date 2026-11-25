/**
 * LU 54 — Authorization & RBAC Test Suite
 *
 * Tests run against the Express app without an external test framework.
 * They sign tokens for each role and check role gates + ownership checks,
 * with the core deliverable being that the IDOR is closed (Test 2).
 */
require('dotenv').config();
process.env.ACCESS_SECRET =
  process.env.ACCESS_SECRET || 'lu54-test-secret-do-not-use-in-production-32chars';

const http = require('http');
const jwt = require('jsonwebtoken');

const SECRET = process.env.ACCESS_SECRET;
const token = (sub, role) => jwt.sign({ sub, role }, SECRET, { algorithm: 'HS256', expiresIn: '1h' });

// Silence the app's listen log during tests
const originalLog = console.log;
console.log = () => {};
const app = require('../src/app');
console.log = originalLog;

const server = http.createServer(app);

function request(server, options, body) {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const port = addr ? addr.port : 0;
    const opts = {
      hostname: '127.0.0.1',
      port,
      path: options.path || '/',
      method: options.method || 'GET',
      headers: options.headers || {},
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

let passed = 0;
let failed = 0;
function assert(condition, message) {
  if (condition) {
    console.log(`  \u2713 ${message}`);
    passed++;
  } else {
    console.log(`  \u2717 ${message}`);
    failed++;
  }
}

// Helper: authorised request with a role token
function as(role, sub, method, path, body) {
  return request(
    server,
    { method, path, headers: { Authorization: `Bearer ${token(sub, role)}`, 'Content-Type': 'application/json' } },
    body
  );
}

async function runTests() {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  console.log('\nLU 54 — Authorization & RBAC Tests\n');

  console.log('Test 1: Owner (member A) edits their own post 1 \u2192 200');
  {
    const res = await as('member', 'u-A', 'PATCH', '/posts/1', { title: 'mine' });
    assert(res.status === 200, `Status is 200 (got ${res.status})`);
  }

  console.log('\nTest 2: Member B edits member A\u2019s post 1 \u2192 403 (IDOR closed)');
  {
    const res = await as('member', 'u-B', 'PATCH', '/posts/1', { title: 'hacked' });
    assert(res.status === 403, `Status is 403 (got ${res.status})`);
    assert(res.body?.error?.code === 'FORBIDDEN', `error.code is FORBIDDEN (got ${res.body?.error?.code})`);
  }

  console.log('\nTest 3: Moderator deletes any post (post 2) \u2192 200 (privileged bypass)');
  {
    const res = await as('moderator', 'u-mod', 'DELETE', '/posts/2');
    assert(res.status === 200, `Status is 200 (got ${res.status})`);
  }

  console.log('\nTest 4: Member hides a post \u2192 403');
  {
    const res = await as('member', 'u-A', 'POST', '/posts/1/hide');
    assert(res.status === 403, `Status is 403 (got ${res.status})`);
    assert(res.body?.error?.code === 'FORBIDDEN', `error.code is FORBIDDEN (got ${res.body?.error?.code})`);
  }

  console.log('\nTest 5: Moderator hides a post \u2192 200');
  {
    const res = await as('moderator', 'u-mod', 'POST', '/posts/1/hide');
    assert(res.status === 200, `Status is 200 (got ${res.status})`);
  }

  console.log('\nTest 6: Member calls admin-only DELETE /users/:id \u2192 403');
  {
    const res = await as('member', 'u-B', 'DELETE', '/users/u-A');
    assert(res.status === 403, `Status is 403 (got ${res.status})`);
    assert(res.body?.error?.code === 'FORBIDDEN', `error.code is FORBIDDEN (got ${res.body?.error?.code})`);
  }

  console.log('\nTest 7: Admin calls DELETE /users/:id \u2192 200');
  {
    const res = await as('admin', 'u-admin', 'DELETE', '/users/u-A');
    assert(res.status === 200, `Status is 200 (got ${res.status})`);
  }

  console.log('\nTest 8: PATCH a missing post 999 \u2192 404 (before any ownership check)');
  {
    const res = await as('member', 'u-A', 'PATCH', '/posts/999', { title: 'x' });
    assert(res.status === 404, `Status is 404 (got ${res.status})`);
  }

  console.log('\nTest 9: No token on a protected route \u2192 401');
  {
    const res = await request(server, { path: '/posts' });
    assert(res.status === 401, `Status is 401 (got ${res.status})`);
  }

  server.close();

  console.log(`\n${'\u2500'.repeat(40)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.log('\nSome tests failed. Check your requireRole and ownership checks.');
    process.exit(1);
  } else {
    console.log('\nAll tests passed! \u2713');
  }
}

runTests().catch((err) => {
  console.error('Test runner error:', err.message);
  process.exit(1);
});
