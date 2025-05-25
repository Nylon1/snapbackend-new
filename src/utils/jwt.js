// src/utils/jwt.js
require('dotenv').config();

const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET;

if (!SECRET) {
  console.error('🛡️ MISSING JWT_SECRET in .env!');
  process.exit(1);
}

function signToken(payload, options = {}) {
  return jwt.sign({ ...payload }, SECRET, { expiresIn: '1h', ...options });
}

function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

module.exports = { signToken, verifyToken };

