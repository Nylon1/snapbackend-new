function authenticateAdmin(req, res, next) {
  if (req.method === 'OPTIONS') {
    return next();
  }
  if (req.session && req.session.token) {
    return next();
  }
  return res.status(401).json({ message: 'No auth token provided' });
}

module.exports = { authenticateAdmin };
