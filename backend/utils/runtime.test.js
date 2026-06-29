// TDD tests for runtime config pure functions.
// Uses Node's built-in test runner — no external deps needed.
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { parseCorsOrigins, resolveHost, resolvePort, buildCorsOptions } = require('./runtime');

describe('parseCorsOrigins', () => {
  test('returns allowlist from comma-separated CORS_ORIGIN', () => {
    const env = { CORS_ORIGIN: 'https://a.vercel.app,http://localhost:5173' };
    assert.deepEqual(parseCorsOrigins(env), ['https://a.vercel.app', 'http://localhost:5173']);
  });

  test('trims whitespace around entries', () => {
    const env = { CORS_ORIGIN: ' https://a.vercel.app , http://localhost:5173 ' };
    assert.deepEqual(parseCorsOrigins(env), ['https://a.vercel.app', 'http://localhost:5173']);
  });

  test('falls back to dev allowlist when CORS_ORIGIN missing', () => {
    assert.deepEqual(parseCorsOrigins({}), [
      'http://localhost:5173',
      'https://candy-land-mvp.vercel.app',
    ]);
  });

  test('falls back to dev allowlist when CORS_ORIGIN empty string', () => {
    assert.deepEqual(parseCorsOrigins({ CORS_ORIGIN: '' }), [
      'http://localhost:5173',
      'https://candy-land-mvp.vercel.app',
    ]);
  });

  test('ignores empty entries between commas', () => {
    const env = { CORS_ORIGIN: 'https://a.vercel.app,,http://localhost:5173' };
    assert.deepEqual(parseCorsOrigins(env), ['https://a.vercel.app', 'http://localhost:5173']);
  });

  test('returns single origin without trailing array issues', () => {
    assert.deepEqual(parseCorsOrigins({ CORS_ORIGIN: 'https://only.example.com' }), ['https://only.example.com']);
  });
});

describe('resolveHost', () => {
  test('defaults to 0.0.0.0 when HOST unset (Railway requirement)', () => {
    assert.equal(resolveHost({}), '0.0.0.0');
  });

  test('honors HOST override for local 127.0.0.1 access', () => {
    assert.equal(resolveHost({ HOST: '127.0.0.1' }), '127.0.0.1');
  });

  test('honors explicit 0.0.0.0', () => {
    assert.equal(resolveHost({ HOST: '0.0.0.0' }), '0.0.0.0');
  });
});

describe('resolvePort', () => {
  test('defaults to 5050 when PORT unset', () => {
    assert.equal(resolvePort({}), 5050);
  });

  test('uses process.env.PORT', () => {
    assert.equal(resolvePort({ PORT: '3000' }), 3000);
  });

  test('coerces string PORT to number', () => {
    assert.equal(resolvePort({ PORT: '8080' }), 8080);
  });

  test('falls back to default when PORT is invalid', () => {
    assert.equal(resolvePort({ PORT: 'abc' }), 5050);
  });

  test('falls back to default when PORT is out of range', () => {
    assert.equal(resolvePort({ PORT: '65536' }), 5050);
  });
});

describe('buildCorsOptions', () => {
  test('returns origin allowlist array', () => {
    const opts = buildCorsOptions({ CORS_ORIGIN: 'https://a.vercel.app,http://localhost:5173' });
    assert.deepEqual(opts.origin, ['https://a.vercel.app', 'http://localhost:5173']);
  });

  test('includes dev fallback origins when env missing', () => {
    const opts = buildCorsOptions({});
    assert.deepEqual(opts.origin, ['http://localhost:5173', 'https://candy-land-mvp.vercel.app']);
  });

  test('does NOT set origin to true (open) in any case', () => {
    const opts = buildCorsOptions({});
    assert.notEqual(opts.origin, true);
  });
});

// CORS wiring is verified via live curl checks (see apply-progress evidence):
// - OPTIONS preflight from allowlisted origin echoes that origin (204).
// - No-origin GET /api/health returns 200 (curl/health probes preserved).
// The pure functions above are the unit-testable contract; app.js just passes
// buildCorsOptions(process.env) into cors(). Keeping a full-app integration
// test here would pull in Prisma side effects that make the suite non-deterministic.
