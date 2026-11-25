/**
 * LU 51.1 Starter — Basic requireAuth to extend.
 *
 * This middleware:
 *   ✓ Reads Bearer token from Authorization header
 *   ✓ Returns 401 for missing/wrong-scheme header
 *   ✓ Calls jwt.verify with algorithms option
 *   ✓ Attaches req.user on success
 *   ✓ Returns 401 in catch block
 *
 * MISSING (your task to add):
 *   ✗ audience option in jwt.verify — tokens with wrong/missing aud are accepted
 *   ✗ internal error logging in catch block
 */

const jwt = require('jsonwebtoken');

module.exports = function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization ?? '';
  const match = /^Bearer ([^\s]+)$/i.exec(authHeader);
  const token = match ? match[1] : null;

  if (!token) {
    return res.status(401).json({
      error: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      // TODO: add audience option → audience: 'lu51-api'
    });

    req.user = payload;
    next();
  } catch (error) {
    // TODO: add internal logging → console.error(`[requireAuth] ${error.name}: ${error.message}`)
    return res.status(401).json({
      error: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
    });
  }
};
