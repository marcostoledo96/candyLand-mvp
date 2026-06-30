// PR-4 requireAdmin middleware unit checks. Pure stdlib asserts, no test framework.
// Run: node test/admin-middleware.test.js
// Covers: missing token, malformed token, valid token, expired token, non-admin role,
// and DB re-check of current user state (active/non-admin/missing/lookup error).
// Uses an injectable lookup so no DB is needed.

const assert = require('assert');
const { signAdminToken } = require('../utils/jwt');
const { requireAdmin } = require('../middleware/admin');

function test(name, fn) {
  try {
    fn();
    console.log(`  ok - ${name}`);
  } catch (err) {
    console.error(`  FAIL - ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

const SECRET = 'test-secret';

function fakeReq(authHeader) {
  return { headers: authHeader ? { authorization: authHeader } : {} };
}

function fakeRes() {
  return { _status: null, _body: null, status(c) { this._status = c; return this; }, json(b) { this._body = b; return this; } };
}

// Middleware is async: resolve once next() is called OR a response is sent.
function callMiddleware(req, factory) {
  return new Promise((resolve) => {
    const res = fakeRes();
    const mw = factory;
    let settled = false;
    const done = (result) => { if (!settled) { settled = true; resolve(result); } };
    mw(req, res, () => done({ nextCalled: true, res }));
    // Safety timeout for sync rejection paths; async paths resolve via res.json.
    setTimeout(() => done({ nextCalled: false, res }), 50);
  });
}

// Token + injectable lookup helper.
function adminToken(id = 1, email = 'admin@candy.com', role = 'ADMIN') {
  return signAdminToken({ id, email, role }, SECRET);
}
function lookupReturning(user) { return async () => user; }
function lookupThrowing(err) { return async () => { throw err; }; }

const ACTIVE_ADMIN = { id: 1, email: 'admin@candy.com', role: 'ADMIN', active: true };
const INACTIVE_ADMIN = { id: 1, email: 'admin@candy.com', role: 'ADMIN', active: false };
const DEMOTED_USER = { id: 1, email: 'admin@candy.com', role: 'CUSTOMER', active: true };

console.log('requireAdmin middleware:');
test('returns 500 when JWT_SECRET is missing (no crash at request time)', async () => {
  const savedSecret = process.env.JWT_SECRET;
  delete process.env.JWT_SECRET;
  try {
    const req = fakeReq('Bearer some.token.here');
    const { nextCalled, res } = await callMiddleware(req, requireAdmin());
    assert.equal(nextCalled, false, 'next MUST NOT be called');
    assert.equal(res._status, 500, 'MUST return 500 when secret missing');
  } finally {
    process.env.JWT_SECRET = savedSecret;
  }
});

test('rejects missing Authorization header with 401', async () => {
  const req = fakeReq(null);
  const { nextCalled, res } = await callMiddleware(req, requireAdmin(SECRET));
  assert.equal(nextCalled, false, 'next MUST NOT be called');
  assert.equal(res._status, 401);
  assert.ok(res._body && res._body.error, 'response MUST have error body');
});

test('rejects malformed Authorization header (no Bearer)', async () => {
  const req = fakeReq('Token abc');
  const { nextCalled, res } = await callMiddleware(req, requireAdmin(SECRET));
  assert.equal(nextCalled, false);
  assert.equal(res._status, 401);
});

test('rejects invalid token', async () => {
  const req = fakeReq('Bearer not-a-jwt');
  const { nextCalled, res } = await callMiddleware(req, requireAdmin(SECRET));
  assert.equal(nextCalled, false);
  assert.equal(res._status, 401);
});

test('rejects token signed with different secret', async () => {
  const token = signAdminToken({ id: 1, email: 'a@b.com', role: 'ADMIN' }, 'other-secret');
  const req = fakeReq(`Bearer ${token}`);
  const { nextCalled, res } = await callMiddleware(req, requireAdmin(SECRET));
  assert.equal(nextCalled, false);
  assert.equal(res._status, 401);
});

test('accepts valid admin token with active DB user, sets req.user, calls next', async () => {
  const token = adminToken();
  const req = fakeReq(`Bearer ${token}`);
  const { nextCalled } = await callMiddleware(req, requireAdmin(SECRET, { lookup: lookupReturning(ACTIVE_ADMIN) }));
  assert.equal(nextCalled, true, 'next MUST be called for valid token + active admin');
  assert.ok(req.user, 'req.user MUST be set');
  assert.equal(req.user.id, 1);
  assert.equal(req.user.email, 'admin@candy.com');
  assert.equal(req.user.role, 'ADMIN');
});

test('rejects token with non-ADMIN role (in payload, before DB lookup)', async () => {
  const token = signAdminToken({ id: 1, email: 'a@b.com', role: 'CUSTOMER' }, SECRET);
  const req = fakeReq(`Bearer ${token}`);
  const { nextCalled, res } = await callMiddleware(req, requireAdmin(SECRET, { lookup: lookupReturning(DEMOTED_USER) }));
  assert.equal(nextCalled, false);
  assert.equal(res._status, 403);
});

test('rejects token if DB user is inactive (disabled admin)', async () => {
  const token = adminToken();
  const req = fakeReq(`Bearer ${token}`);
  const { nextCalled, res } = await callMiddleware(req, requireAdmin(SECRET, { lookup: lookupReturning(INACTIVE_ADMIN) }));
  assert.equal(nextCalled, false, 'next MUST NOT be called for inactive admin');
  assert.equal(res._status, 401);
  assert.ok(/admin access/i.test(res._body.error), 'MUST mention account access');
});

test('rejects token if DB user role was changed away from ADMIN', async () => {
  const token = adminToken();
  const req = fakeReq(`Bearer ${token}`);
  const { nextCalled, res } = await callMiddleware(req, requireAdmin(SECRET, { lookup: lookupReturning(DEMOTED_USER) }));
  assert.equal(nextCalled, false);
  assert.equal(res._status, 401);
});

test('rejects token if DB user no longer exists (null lookup)', async () => {
  const token = adminToken();
  const req = fakeReq(`Bearer ${token}`);
  const { nextCalled, res } = await callMiddleware(req, requireAdmin(SECRET, { lookup: lookupReturning(null) }));
  assert.equal(nextCalled, false);
  assert.equal(res._status, 401);
});

test('rejects token (fail closed, 401) if DB lookup throws', async () => {
  const token = adminToken();
  const req = fakeReq(`Bearer ${token}`);
  const { nextCalled, res } = await callMiddleware(req, requireAdmin(SECRET, { lookup: lookupThrowing(new Error('DB down')) }));
  assert.equal(nextCalled, false, 'MUST fail closed when lookup errors');
  assert.equal(res._status, 401);
});

if (process.exitCode) {
  console.error('\nadmin-middleware tests FAILED');
} else {
  console.log('\nOK: admin-middleware asserts passed.');
}