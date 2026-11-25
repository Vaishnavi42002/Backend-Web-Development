const jwt = require('jsonwebtoken');

const SECRET = process.env.ACCESS_SECRET;
const ALGORITHM = 'HS256';

/**
 * Sign a JWT access token with the test secret.
 * @param {string} sub  - the user id (subject)
 * @param {string} role - the user's role: 'member' | 'moderator' | 'admin'
 * @param {string} [expiresIn='1h']
 * @returns {string} signed JWT
 */
function signToken(sub, role, expiresIn = '1h') {
  return jwt.sign({ sub, role }, SECRET, { algorithm: ALGORITHM, expiresIn });
}

module.exports = { signToken };
