
require('dotenv').config();                   // ensure .env is loaded

const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET;

if (!SECRET) {
  console.error('🛡️ MISSING JWT_SECRET in .env!');
  process.exit(1);
}

function signToken(payload, options = {}) {
  // default to a 1h expiry if none provided
  return jwt.sign(
    { ...payload },
    SECRET,
    { expiresIn: '1h', ...options }
  );
}

function verifyToken(token) {
  // throws on invalid/expired tokens
  return jwt.verify(token, SECRET);
}

module.exports = { signToken, verifyToken };
