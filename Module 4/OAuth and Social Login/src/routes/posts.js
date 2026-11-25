'use strict';
// routes/posts.js — a simple protected resource route
// Given — do not modify.
//
// Used in tests to verify that the JWT issued by your OAuth callback
// is a real, valid token that passes requireAuth.

const router      = require('express').Router();
const requireAuth = require('../middleware/requireAuth');

// GET /posts — protected; returns the caller's identity from the JWT
router.get('/', requireAuth, (req, res) => {
  res.json({ ok: true, userId: req.user.sub, role: req.user.role });
});

module.exports = router;
