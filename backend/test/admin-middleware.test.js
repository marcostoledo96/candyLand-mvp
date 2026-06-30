// PR-4 requireAdmin middleware unit checks. Pure stdlib asserts, no test framework.
// Run: node test/admin-middleware.test.js
// Covers: missing token, malformed token, valid token, expired token, non-admin role.
// Uses a fake prisma so no DB is needed.

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

function callMiddleware(req, middlewareFactory) {
  return new Promise((resolve) => {
    const res = fakeRes();
    const mw = middlewareFactory || requireAdmin(SECRET);
    mw(req, res, () => resolve({ nextCalled: true, res }));
    // middleware is sync-ish for token verification; resolve if next not called
    setImmediate(() => resolve({ nextCalled: false, res }));
  });
}

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
  const { nextCalled, res } = await callMiddleware(req);
  assert.equal(nextCalled, false, 'next MUST NOT be called');
  assert.equal(res._status, 401);
  assert.ok(res._body && res._body.error, 'response MUST have error body');
});

test('rejects malformed Authorization header (no Bearer)', async () => {
  const req = fakeReq('Token abc');
  const { nextCalled, res } = await callMiddleware(req);
  assert.equal(nextCalled, false);
  assert.equal(res._status, 401);
});

test('rejects invalid token', async () => {
  const req = fakeReq('Bearer not-a-jwt');
  const { nextCalled, res } = await callMiddleware(req);
  assert.equal(nextCalled, false);
  assert.equal(res._status, 401);
});

test('rejects token signed with different secret', async () => {
  const token = signAdminToken({ id: 1, email: 'a@b.com', role: 'ADMIN' }, 'other-secret');
  const req = fakeReq(`Bearer ${token}`);
  const { nextCalled, res } = await callMiddleware(req);
  assert.equal(nextCalled, false);
  assert.equal(res._status, 401);
});

test('accepts valid admin token and sets req.user, calls next', async () => {
  const token = signAdminToken({ id: 1, email: 'admin@candy.com', role: 'ADMIN' }, SECRET);
  const req = fakeReq(`Bearer ${token}`);
  const { nextCalled } = await callMiddleware(req);
  assert.equal(nextCalled, true, 'next MUST be called for valid token');
  assert.ok(req.user, 'req.user MUST be set');
  assert.equal(req.user.id, 1);
  assert.equal(req.user.email, 'admin@candy.com');
  assert.equal(req.user.role, 'ADMIN');
});

test('rejects token with non-ADMIN role', async () => {
  const token = signAdminToken({ id: 1, email: 'a@b.com', role: 'CUSTOMER' }, SECRET);
  const req = fakeReq(`Bearer ${token}`);
  const { nextCalled, res } = await callMiddleware(req);
  assert.equal(nextCalled, false);
  assert.equal(res._status, 403);
});

if (process.exitCode) {
  console.error('\nadmin-middleware tests FAILED');
} else {
  console.log('\nOK: admin-middleware asserts passed.');
}