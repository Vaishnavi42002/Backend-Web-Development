'use strict';
// tests/run.js — LU58 Rate Limiting & Abuse Prevention. Run: npm test
// No test framework — raw http against the app on port 3102.

process.env.PORT = '3102';
const http = require('http');
const app = require('../src/app');

let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { console.log('  \u2713 ' + label); passed++; }
  else { console.error('  \u2717 ' + label); failed++; }
}

function request(method, path, body) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = { hostname: 'localhost', port: 3102, method, path, headers: { 'Content-Type': 'application/json' } };
    const req = http.request(opts, (res) => {
      let buf = '';
      res.on('data', (c) => (buf += c));
      res.on('end', () => {
        let parsed; try { parsed = JSON.parse(buf); } catch { parsed = buf; }
        resolve({ status: res.statusCode, headers: res.headers, body: parsed });
      });
    });
    req.on('error', (e) => resolve({ status: 0, headers: {}, body: e.message }));
    if (data) req.write(data);
    req.end();
  });
}

const badLogin = () => request('POST', '/auth/login', { email: 'alice@example.com', password: 'wrong' });

const server = app.listen(3102);

(async () => {
  console.log('\n\u2500\u2500 LU58 Rate Limiting & Abuse Prevention \u2014 Test Suite \u2500\u2500\n');

  // T1 — the first 5 failed attempts are allowed through (401), not throttled
  console.log('Test 1: The first 5 failed login attempts return 401 (not throttled)');
  let allUnthrottled = true;
  for (let i = 0; i < 5; i++) {
    const r = await badLogin();
    if (r.status !== 401) allUnthrottled = false;
  }
  assert('attempts 1-5 all return 401 (within the limit)', allUnthrottled);

  // T2 — the 6th attempt is blocked with 429
  console.log('\nTest 2: The 6th attempt is blocked with 429');
  const r6 = await badLogin();
  assert('status is 429', r6.status === 429);

  // T3 — the 429 response carries a Retry-After header
  console.log('\nTest 3: The 429 response includes a Retry-After header');
  assert('Retry-After header is present', r6.headers['retry-after'] !== undefined);
  assert('Retry-After is a positive number of seconds', Number(r6.headers['retry-after']) > 0);

  // T4 — a non-auth route is unaffected (limiter is scoped to auth routes)
  console.log('\nTest 4: A non-auth route still works after the auth limit is hit');
  const h = await request('GET', '/health');
  assert('GET /health returns 200 (not rate limited)', h.status === 200);

  console.log('\nResults: ' + passed + ' passed, ' + failed + ' failed');
  if (failed === 0) console.log('All tests passed! \u2713');
  server.close();
  process.exit(failed > 0 ? 1 : 0);
})();
