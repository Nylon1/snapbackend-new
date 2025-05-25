const { verifyToken } = require('../utils/jwt');

function authenticateAdmin(req, res, next) {
  // 2. Extract token from header or session
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : req.session?.token;

  if (!token) {
    return res.status(401).json({ message: 'No auth token provided' });
  }

  let payload;
  try {
    // 3. Call verifyToken directly (no jwt qualifier)
    payload = verifyToken(token);
  } catch (err) {
    console.error('❌ Token verification failed:', err);
    return res.status(401).json({ message: 'Invalid token' });
  }

  // 4. Attach user info and continue
  req.user = { id: payload.sub, role: payload.role, email: payload.email };
  next();
}

module.exports = { authenticateAdmin };

