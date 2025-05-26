const { verifyToken } = require('../utils/jwt');

function authenticateAdmin(req, res, next) {
  if (req.method === 'OPTIONS') return next();

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No auth token provided' });
  }
  const token = authHeader.slice(7);

  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    console.error('❌ Token verification failed:', err);
    return res.status(401).json({ message: 'Invalid token' });
  }

  req.user = payload;
  next();
}

module.exports = { authenticateAdmin };


