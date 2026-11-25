'use strict';
// tests/run.js — LU57 Idempotency & Safe APIs. Run: npm test
// No test framework — raw http against the running app on port 3101.

process.env.PORT = '3101';
const http = require('http');
const app = require('../src/app');

let passed = 0, failed = 0;
function assert(label, cond) {
  if (cond) { console.log('  \u2713 ' + label); passed++; }
  else { console.error('  \u2717 ' + label); failed++; }
}

function request(method, path, headers, body) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = { hostname: 'localhost', port: 3101, method, path,
      headers: Object.assign({ 'Content-Type': 'application/json' }, headers || {}) };
    const req = http.request(opts, (res) => {
      let buf = '';
      res.on('data', (c) => (buf += c));
      res.on('end', () => {
        let parsed; try { parsed = JSON.parse(buf); } catch { parsed = buf; }
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    req.on('error', (e) => resolve({ status: 0, body: e.message }));
    if (data) req.write(data);
    req.end();
  });
}

const count = async () => (await request('GET', '/_debug/charge-count')).body.count;

const server = app.listen(3101);

(async () => {
  console.log('\n\u2500\u2500 LU57 Idempotency & Safe APIs \u2014 Test Suite \u2500\u2500\n');

  // T1 — first payment with key-1 charges once
  console.log('Test 1: First request with a key charges once');
  const r1 = await request('POST', '/payments', { 'Idempotency-Key': 'key-1' }, { amount: 500 });
  assert('status is 201', r1.status === 201);
  assert('response has a charge id', !!(r1.body && r1.body.id));
  const id1 = r1.body && r1.body.id;

  // T2 — retry with the SAME key returns the cached response, no new charge
  console.log('\nTest 2: Retry with the same key returns the cached response, no new charge');
  const r2 = await request('POST', '/payments', { 'Idempotency-Key': 'key-1' }, { amount: 500 });
  assert('status is 201', r2.status === 201);
  assert('returns the SAME charge id (cached)', r2.body && r2.body.id === id1);
  assert('charge count is still 1', (await count()) === 1);

  // T3 — a DIFFERENT key is a separate operation
  console.log('\nTest 3: A different key is a separate charge');
  const r3 = await request('POST', '/payments', { 'Idempotency-Key': 'key-2' }, { amount: 900 });
  assert('status is 201', r3.status === 201);
  assert('returns a NEW charge id', r3.body && r3.body.id && r3.body.id !== id1);
  assert('charge count is now 2', (await count()) === 2);
  const id2 = r3.body && r3.body.id;

  // T4 — a missing key is a validation error
  console.log('\nTest 4: A missing Idempotency-Key is rejected');
  const r4 = await request('POST', '/payments', {}, { amount: 100 });
  assert('status is 400', r4.status === 400);
  assert('error code is IDEMPOTENCY_KEY_REQUIRED', r4.body && r4.body.error && r4.body.error.code === 'IDEMPOTENCY_KEY_REQUIRED');
  assert('no charge was created for the missing key', (await count()) === 2);

  // T5 — retry of key-2 still returns its cached response
  console.log('\nTest 5: Retry of the second key is still deduplicated');
  const r5 = await request('POST', '/payments', { 'Idempotency-Key': 'key-2' }, { amount: 900 });
  assert('returns the SAME id as its first call', r5.body && r5.body.id === id2);
  assert('charge count is still 2', (await count()) === 2);

  // T6 — exactly-once across all the calls above
  console.log('\nTest 6: Exactly-once overall');
  assert('only 2 real charges happened despite the retries', (await count()) === 2);

  console.log('\nResults: ' + passed + ' passed, ' + failed + ' failed');
  if (failed === 0) console.log('All tests passed! \u2713');
  server.close();
  process.exit(failed > 0 ? 1 : 0);
})();
