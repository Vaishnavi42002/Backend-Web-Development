'use strict';

// ─── GIVEN FILE, do not modify ───────────────────────────────────────────────
// Automated test suite for the WebSockets & Socket.IO assignment.
// Run with: npm test

const http          = require('node:http');
const { io: Client } = require('socket.io-client');
const { initSocket } = require('../src/socket');

// ── helpers ──────────────────────────────────────────────────────────────────

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function connectClient(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const socket = Client(url, { ...opts, transports: ['websocket'] });
    socket.once('connect', () => resolve(socket));
    socket.once('connect_error', reject);
  });
}

function onceEvent(socket, event, timeoutMs = 2000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout waiting for '${event}'`)), timeoutMs);
    socket.once(event, (data) => { clearTimeout(timer); resolve(data); });
  });
}

// ── test runner ──────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ✗ ${name}`);
    console.log(`    ${err.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

// ── setup ────────────────────────────────────────────────────────────────────

const PORT = 3099;   // test port, different from the app default

async function main() {
  // Create a fresh HTTP server and attach Socket.IO
  const express = require('express');
  const appExpress = express();
  const httpServer = http.createServer(appExpress);

  const io = initSocket(httpServer);

  if (!io) {
    console.log('\n  ✗ initSocket() returned null, implement src/socket.js first\n');
    console.log(`Results: 0 passed, 5 failed`);
    process.exit(1);
  }

  await new Promise((resolve) => httpServer.listen(PORT, resolve));
  const URL = `http://localhost:${PORT}`;

  const logs = [];
  const origLog = console.log;
  console.log = (...args) => { logs.push(args.join(' ')); };

  console.log('\nTest 1: A connected client receives a socket.id');
  await test('Client connects and gets a valid socket.id', async () => {
    const a = await connectClient(URL);
    assert(typeof a.id === 'string' && a.id.length > 0, `socket.id should be a non-empty string, got: ${a.id}`);
    a.disconnect();
    await wait(100);
  });

  console.log('\nTest 2: Client in a room receives commentAdded');
  await test('Client that joined the room receives commentAdded after newComment', async () => {
    const a = await connectClient(URL);
    a.emit('joinRoom', { room: 'post-42' });
    await wait(50);

    const eventPromise = onceEvent(a, 'commentAdded');
    a.emit('newComment', { room: 'post-42', text: 'Hello World' });
    const data = await eventPromise;

    assert(data && data.text === 'Hello World', `Expected { room, text: 'Hello World' }, got: ${JSON.stringify(data)}`);
    a.disconnect();
    await wait(100);
  });

  console.log('\nTest 3: Second client in same room also receives commentAdded');
  await test('Second client in the room also receives the commentAdded event', async () => {
    const a = await connectClient(URL);
    const b = await connectClient(URL);

    a.emit('joinRoom', { room: 'post-42' });
    b.emit('joinRoom', { room: 'post-42' });
    await wait(50);

    const bPromise = onceEvent(b, 'commentAdded');
    a.emit('newComment', { room: 'post-42', text: 'Broadcast Test' });
    const data = await bPromise;

    assert(data && data.text === 'Broadcast Test', `Client B expected commentAdded event, got: ${JSON.stringify(data)}`);
    a.disconnect();
    b.disconnect();
    await wait(100);
  });

  console.log('\nTest 4: Client that left the room does NOT receive commentAdded');
  await test('Client that left the room does not receive subsequent commentAdded events', async () => {
    const a = await connectClient(URL);
    const b = await connectClient(URL);

    a.emit('joinRoom', { room: 'post-42' });
    b.emit('joinRoom', { room: 'post-42' });
    await wait(50);

    // B leaves the room
    b.emit('leaveRoom', { room: 'post-42' });
    await wait(50);

    let bReceived = false;
    b.on('commentAdded', () => { bReceived = true; });

    a.emit('newComment', { room: 'post-42', text: 'Should not reach B' });
    await wait(300);

    assert(!bReceived, 'Client B received commentAdded after leaving the room, it should not have');
    a.disconnect();
    b.disconnect();
    await wait(100);
  });

  console.log('\nTest 5: Server logs connection and disconnection');
  await test('Server logs [+] connected and [-] disconnected with socket.id', async () => {
    logs.length = 0;  // clear previous logs
    const a = await connectClient(URL);
    const id = a.id;
    await wait(50);
    a.disconnect();
    await wait(200);

    const connectLog = logs.some(l => l.includes('[+] connected') && l.includes(id));
    const disconnectLog = logs.some(l => l.includes('[-] disconnected') && l.includes(id));

    assert(connectLog, `Expected a log line with '[+] connected' and socket.id '${id}'. Logs: ${JSON.stringify(logs)}`);
    assert(disconnectLog, `Expected a log line with '[-] disconnected' and socket.id '${id}'. Logs: ${JSON.stringify(logs)}`);
  });

  // ── teardown ──────────────────────────────────────────────────────────────
  console.log = origLog;
  await new Promise((resolve) => httpServer.close(resolve));

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed === 0) {
    console.log('All tests passed! ✓');
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
