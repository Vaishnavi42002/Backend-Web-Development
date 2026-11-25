'use strict';
// routes/health.js — a NON-auth route with no rate limit. Given — do not modify.
// The tests hit this after the auth limit is exhausted to prove the limiter
// is scoped to the auth routes only, not the whole app.

const router = require('express').Router();

router.get('/', (_req, res) => {
  res.json({ status: 'ok' });
});

module.exports = router;
