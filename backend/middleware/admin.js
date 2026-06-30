// requireAdmin middleware — protects all /api/admin/* routes.
// Verifies a Bearer JWT (HS256) and requires role === 'ADMIN'.
// Secret is read lazily from JWT_SECRET at request time so the app still
// boots/imports when admin config is absent (public routes + health keep
// working without a JWT_SECRET). Returns 500 if the secret is missing on an
// admin request.
//
// After verifying the token signature, re-checks the current user state
// against the DB so disabled admins or role changes take effect before the
// 8h token expires. The user lookup is injectable via options.lookup so tests
// can stub it without a DB.

const { verifyAdminToken } = require('../utils/jwt');
const prisma = require('../prismaClient');

const defaultLookup = async (id) => prisma.user.findUnique({ where: { id }, select: { id: true, email: true, role: true, active: true } });

function requireAdmin(secretOpt, options = {}) {
  // secretOpt is optional; if not provided we read JWT_SECRET at request time.
  // lookup lets tests inject a fake DB; default queries the real Prisma client.
  const lookup = options.lookup || defaultLookup;
  return async function requireAdminMiddleware(req, res, next) {
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

    // Re-check current user state against the DB so disabling an admin or
    // changing their role revokes access before the token TTL elapses.
    // If the lookup itself fails (DB down) we fail closed: 401.
    try {
      const user = await lookup(payload.id);
      if (!user || !user.active || user.role !== 'ADMIN') {
        return res.status(401).json({ error: 'Account no longer has admin access' });
      }
      req.user = { id: user.id, email: user.email, role: user.role };
    } catch (err) {
      console.error('admin re-check lookup failed:', err);
      return res.status(401).json({ error: 'Unable to verify account status' });
    }
    next();
  };
}

module.exports = { requireAdmin, defaultLookup };