// src/src/utils/jwt.js
const jwt = require('jsonwebtoken');

function signToken(payload) {
  // Try JWT_SECRET first, then SESSION_SECRET
  const secret = process.env.JWT_SECRET || process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error('❌ JWT_SECRET (or SESSION_SECRET) is not defined');
  }

  return jwt.sign(payload, secret, { expiresIn: '1h' });
}

module.exports = { signToken };
