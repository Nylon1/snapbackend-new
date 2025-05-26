function authenticateAdmin(req, res, next) {
  if (req.method === 'OPTIONS') return next();

  // 1. Try Authorization header (Bearer)
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : req.session?.token;

  if (!token) {
    return res.status(401).json({ message: 'No auth token provided' });
  }

  // 2. Verify the token
  let payload;
  try {
    // Adjust to your actual verifyToken import
    const { verifyToken } = require('../utils/jwt');
    payload = verifyToken(token);
  } catch (err) {
    console.error('❌ Token verification failed:', err);
    return res.status(401).json({ message: 'Invalid token' });
  }

  // 3. Attach user info (if needed)
  req.user = { id: payload.sub, role: payload.role, email: payload.email };
  next();
}




