const jwt = require('../utils/jwt');

function authenticateAdmin(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1] || req.session?.token;

  console.log("🔐 Token received:", token);
  console.log("🛡️ JWT_SECRET present?", Boolean(process.env.JWT_SECRET));

  if (!token) return res.status(401).json({ message: 'Unauthorized – No token provided' });

  try {
    const payload = jwt.verifyToken(token);
    console.log("✅ Token payload:", payload);

    const allowedRoles = ['Super Admin', 'Editor', 'Moderator', 'Analyst'];
    if (!allowedRoles.includes(payload.role)) {
      return res.status(403).json({ message: 'Forbidden – Role not allowed' });
    }

    req.user = payload;
    next();
  } catch (err) {
    console.error("❌ Token verification failed:", err.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = { authenticateAdmin };
