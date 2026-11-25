// GIVEN — do not modify.
// Verifies the Bearer access token and attaches req.user = { id, role }.
// This is the authentication layer from LU51/LU52. Your job is authorization.
const jwt = require('jsonwebtoken');

module.exports = function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization ?? '';
  const match = /^Bearer ([^\s]+)$/i.exec(authHeader);
  const token = match ? match[1] : null;

  if (!token) {
    return res
      .status(401)
      .json({ error: { code: 'UNAUTHENTICATED', message: 'Authentication required' } });
  }

  try {
    const payload = jwt.verify(token, process.env.ACCESS_SECRET, {
      algorithms: ['HS256'],
    });
    // Identity is trusted from here on. role is a signed claim.
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (_error) {
    return res
      .status(401)
      .json({ error: { code: 'UNAUTHENTICATED', message: 'Authentication required' } });
  }
};
