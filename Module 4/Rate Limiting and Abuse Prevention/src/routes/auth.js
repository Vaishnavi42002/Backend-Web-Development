'use strict';
// routes/auth.js — the auth endpoints. Given — do not modify.
//
// The `authLimiter` middleware is already wired onto all three sensitive routes.
// Your job is to make `authLimiter` a real rate limiter (see src/middleware/rateLimiter.js).

const router = require('express').Router();
const authLimiter = require('../middleware/rateLimiter');
const { users } = require('../data');

// Login — 401 on bad credentials, 200 on success.
router.post('/login', authLimiter, (req, res) => {
  const { email, password } = req.body || {};
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
  }
  return res.status(200).json({ token: 'demo-token-for-' + user.id });
});

// Register — always succeeds here (validation is out of scope).
router.post('/register', authLimiter, (_req, res) => {
  return res.status(201).json({ ok: true });
});

// Refresh — always issues a new token here.
router.post('/refresh', authLimiter, (_req, res) => {
  return res.status(200).json({ token: 'refreshed-demo-token' });
});

module.exports = router;
