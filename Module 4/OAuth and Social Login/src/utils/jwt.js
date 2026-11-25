'use strict';
// utils/jwt.js — thin wrapper around jsonwebtoken
// Given — do not modify.

const jwt = require('jsonwebtoken');
const ACCESS_SECRET = process.env.ACCESS_SECRET || 'lu55-test-secret-do-not-use-in-production-32c';

/**
 * Sign a payload and return a short-lived access token.
 * Caller is responsible for passing { sub, role } as minimum claims.
 */
function signToken(payload) {
  return jwt.sign(payload, ACCESS_SECRET, { algorithm: 'HS256', expiresIn: '15m' });
}

/**
 * Verify and decode a token. Throws on invalid or expired tokens.
 */
function verifyToken(token) {
  return jwt.verify(token, ACCESS_SECRET, { algorithms: ['HS256'] });
}

module.exports = { signToken, verifyToken };
