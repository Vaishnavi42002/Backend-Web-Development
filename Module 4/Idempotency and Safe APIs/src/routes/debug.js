'use strict';
// routes/debug.js — a test-only helper. Given — do not modify.
// GET /_debug/charge-count returns how many REAL charges have happened.
// The test suite uses it to verify a retried request does not double-charge.

const router = require('express').Router();
const { charges } = require('../store');

router.get('/charge-count', (_req, res) => {
  res.json({ count: charges.length });
});

module.exports = router;
