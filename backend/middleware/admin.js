// requireAdmin middleware — protects all /api/admin/* routes.
// Verifies a Bearer JWT (HS256) and requires role === 'ADMIN'.
// Secret is read lazily from JWT_SECRET at request time so the app still
// boots/imports when admin config is absent (public routes + health keep
// working without a JWT_SECRET). Returns 500 if the secret is missing on an
// admin request.

const { verifyAdminToken } = require('../utils/jwt');

function requireAdmin(secretOpt) {
  // secretOpt is optional; if not provided we read JWT_SECRET at request time.
  return function requireAdminMiddleware(req, res, next) {
    const secret = secretOpt || process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: 'Admin auth not configured (JWT_SECRET missing)' });
    }
    const auth = req.headers && req.headers.authorization;
    if (!auth || typeof auth !== 'string' || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header required' });
    }
    const token = auth.slice('Bearer '.length).trim();
    if (!token) return res.status(401).json({ error: 'Token required' });

    const payload = verifyAdminToken(token, secret);
    if (!payload) return res.status(401).json({ error: 'Invalid or expired token' });

    if (payload.role !== 'ADMIN') return res.status(403).json({ error: 'Admin role required' });

    req.user = { id: payload.id, email: payload.email, role: payload.role };
    next();
  };
}

module.exports = { requireAdmin };