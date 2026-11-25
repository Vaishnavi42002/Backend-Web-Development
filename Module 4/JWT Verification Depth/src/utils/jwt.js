const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET;
const ALGORITHM = 'HS256';
const AUDIENCE = 'lu51-api';

/**
 * Sign a JWT with optional audience.
 * @param {object} claims - Custom claims (e.g. { sub: 'user-7' })
 * @param {object} [opts]
 * @param {string} [opts.expiresIn='1h']
 * @param {boolean} [opts.includeAudience=true] - Include audience claim
 * @returns {string} Signed JWT
 */
function signToken(claims, { expiresIn = '1h', includeAudience = true } = {}) {
  return jwt.sign(claims, SECRET, {
    algorithm: ALGORITHM,
    expiresIn,
    ...(includeAudience ? { audience: AUDIENCE } : {}),
  });
}

/**
 * Sign a token with no audience claim (for wrong-audience tests).
 */
function signTokenNoAudience(claims, expiresIn = '1h') {
  return signToken(claims, { expiresIn, includeAudience: false });
}

/**
 * Sign a token with wrong audience.
 */
function signTokenWrongAudience(claims, expiresIn = '1h') {
  return jwt.sign(claims, SECRET, { algorithm: ALGORITHM, expiresIn, audience: 'other-api' });
}

/**
 * Sign an expired token (0 second lifetime).
 */
function signExpiredToken(claims) {
  return signToken(claims, { expiresIn: '0s' });
}

/**
 * Sign a token with a different secret (invalid signature when verified with correct secret).
 */
function signWithWrongSecret(claims) {
  return jwt.sign(claims, 'wrong-secret-for-testing-only', {
    algorithm: ALGORITHM,
    expiresIn: '1h',
    audience: AUDIENCE,
  });
}

module.exports = { signToken, signTokenNoAudience, signTokenWrongAudience, signExpiredToken, signWithWrongSecret, AUDIENCE };
