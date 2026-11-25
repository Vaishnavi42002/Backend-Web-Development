'use strict';
// store.js — in-memory state (a database in a real app). Given — do not modify.
//
//   charges       — every REAL charge that actually happened. Its length is how
//                   many times a card was charged. Tests read this to prove that
//                   retries do NOT create duplicate charges.
//   idempotency   — Map of  idempotency-key -> { status, body }  (the cached response).
//   nextChargeId  — returns a unique charge id: 'ch_1', 'ch_2', ...

const charges = [];
const idempotency = new Map();
let counter = 0;

function nextChargeId() {
  return 'ch_' + (++counter);
}

module.exports = { charges, idempotency, nextChargeId };
