'use strict';

// ─── GIVEN FILE — do not modify ───────────────────────────────────────────────
require('dotenv').config();

const http   = require('node:http');
const crypto = require('node:crypto');
const { app } = require('../src/app');
const { resetCallCount, getCallCount } = require('../src/eventHandlers');
const { _processedIds } = require('../src/webhookHandler');

const SECRET = process.env.WEBHOOK_SECRET || 'testsecret';
const PORT   = 3097;

let passed = 0, failed = 0;

async function test(name, fn) {
  try { await fn(); console.log(`  ✓ ${name}`); passed++; }
  catch (err) { console.log(`  ✗ ${name}\n    ${err.message}`); failed++; }
}

function assert(cond, msg) { if (!cond) throw new Error(msg || 'Assertion failed'); }

function makeBody(overrides = {}) {
  return JSON.stringify({
    id: `evt_${Math.random().toString(36).slice(2, 10)}`,
    type: 'payment.succeeded',
    data: { amount: 2000 },
    ...overrides,
  });
}

function sign(body) {
  return 'sha256=' + crypto.createHmac('sha256', SECRET).update(Buffer.from(body)).digest('hex');
}

function request(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? Buffer.from(body) : null;
    const opts = {
      hostname: 'localhost', port: PORT, path, method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': data.length } : {}),
        ...headers,
      },
    };
    const req = http.request(opts, (res) => {
      let raw = '';
      res.on('data', c => { raw += c; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const server = http.createServer(app);
  await new Promise(r => server.listen(PORT, r));

  // reset state before each run
  resetCallCount();
  _processedIds.clear();

  const body = makeBody();
  const sig  = sign(body);

  console.log('\nTest 1: Valid webhook returns 200');
  await test('Valid signature → 200 received', async () => {
    const res = await request('POST', '/webhooks', body, { 'x-webhook-signature': sig });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.status === 'received', `Expected status 'received', got '${res.body.status}'`);
  });

  // wait for setImmediate to fire
  await wait(50);

  console.log('\nTest 2: Forged signature returns 401');
  await test('Forged signature → 401 Invalid signature', async () => {
    const badSig = 'sha256=0000000000000000000000000000000000000000000000000000000000000000';
    const res = await request('POST', '/webhooks', body, { 'x-webhook-signature': badSig });
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  console.log('\nTest 3: Missing signature header returns 401');
  await test('No signature header → 401', async () => {
    const res = await request('POST', '/webhooks', body);
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  console.log('\nTest 4: Replaying the same event id returns 200 without re-processing');
  await test('Duplicate event id → 200 already_processed, handleEvent not called again', async () => {
    const countBefore = getCallCount();
    const res = await request('POST', '/webhooks', body, { 'x-webhook-signature': sig });
    await wait(50);
    const countAfter = getCallCount();
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.status === 'already_processed', `Expected 'already_processed', got '${res.body.status}'`);
    assert(countAfter === countBefore, `handleEvent should not be called again on duplicate (called ${countAfter - countBefore} extra times)`);
  });

  console.log('\nTest 5: New event id is processed and added to processedIds');
  await test('New event id → handleEvent called, id stored', async () => {
    const newBody = makeBody({ id: 'evt_unique_new' });
    const newSig  = sign(newBody);
    const countBefore = getCallCount();
    await request('POST', '/webhooks', newBody, { 'x-webhook-signature': newSig });
    await wait(50);
    assert(getCallCount() === countBefore + 1, `Expected handleEvent to be called once, got ${getCallCount() - countBefore} calls`);
    assert(_processedIds.has('evt_unique_new'), `Expected 'evt_unique_new' to be in processedIds`);
  });

  await new Promise(r => server.close(r));

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed === 0) console.log('All tests passed! ✓');
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => { console.error(err); process.exit(1); });
