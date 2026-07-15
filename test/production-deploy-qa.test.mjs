import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  DEFAULT_API_BASE_URL,
  ENDPOINTS,
  parseApiBaseUrl,
  runProductionSmoke,
} from '../scripts/smoke-production.mjs';

const readJson = async (file) => JSON.parse(await readFile(new URL(`../${file}`, import.meta.url), 'utf8'));

test('Railway config keeps the backend release ordered and free of unsafe commands', async () => {
  const railway = await readJson('railway.json');

  assert.equal(railway.$schema, 'https://railway.com/railway.schema.json');
  assert.equal(railway.build.buildCommand, 'npm ci --include=dev && npm run prisma:generate');
  assert.deepEqual(railway.deploy.preDeployCommand, ['npx prisma migrate deploy']);
  assert.equal(railway.deploy.startCommand, 'npm start');
  assert.equal(railway.deploy.healthcheckPath, '/api/health');
  assert.equal(JSON.stringify(railway).includes('db push'), false);
  assert.equal(JSON.stringify(railway).includes('seed'), false);
});

test('Vercel remains frontend-only with no API rewrite or database command', async () => {
  const vercel = await readJson('vercel.json');
  const packageJson = await readJson('package.json');
  const vercelIgnore = await readFile(new URL('../.vercelignore', import.meta.url), 'utf8');

  assert.equal(vercel.buildCommand, 'npm run build');
  assert.equal(vercel.outputDirectory, 'dist');
  assert.equal(vercel.rewrites.some((rule) => rule.source.startsWith('/api')), false);
  assert.equal(/prisma|seed|db push|migrate/i.test(JSON.stringify(vercel)), false);
  assert.equal(packageJson.scripts[vercel.buildCommand.slice('npm run '.length)], 'vite build');
  assert.match(vercelIgnore, /^api\/\*\.cjs$/m);
});

test('the smoke runner accepts only a clean HTTPS API base URL', () => {
  assert.equal(parseApiBaseUrl(DEFAULT_API_BASE_URL), DEFAULT_API_BASE_URL);
  assert.throws(() => parseApiBaseUrl('http://example.test'), /HTTPS/);
  assert.throws(() => parseApiBaseUrl('https://example.test/api?token=secret'), /origin/);
  assert.throws(() => parseApiBaseUrl('https://user:pass@example.test'), /credentials/);
});

test('the smoke runner performs exactly four redacted GET checks in a deterministic order', async () => {
  const calls = [];
  let tick = 0;
  const evidence = await runProductionSmoke(DEFAULT_API_BASE_URL, {
    now: () => `2026-07-15T00:00:0${tick++}.000Z`,
    monotonicNow: () => tick++ * 3,
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return { status: 200 };
    },
  });

  assert.equal(evidence.result, 'pass');
  assert.deepEqual(calls.map(({ url }) => new URL(url).pathname), ENDPOINTS);
  assert.ok(calls.every(({ options }) => options.method === 'GET' && options.redirect === 'error' && options.signal instanceof AbortSignal));
  assert.deepEqual(evidence.checks.map((check) => check.path), ENDPOINTS);
  assert.deepEqual(evidence.checks.map((check) => check.category), ['health', 'database-health', 'catalog', 'categories']);
  assert.equal(JSON.stringify(evidence).includes(DEFAULT_API_BASE_URL), false);
  assert.equal(/"headers"\s*:/.test(JSON.stringify(evidence)), false);
  assert.equal(/"body"\s*:/.test(JSON.stringify(evidence)), false);
});

test('a failed smoke check records only safe metadata and never retries or writes', async () => {
  const calls = [];
  const evidence = await runProductionSmoke(DEFAULT_API_BASE_URL, {
    now: () => '2026-07-15T00:00:00.000Z',
    monotonicNow: () => 1,
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return { status: new URL(url).pathname === '/api/productos' ? 503 : 200 };
    },
  });

  assert.equal(evidence.result, 'fail');
  assert.equal(calls.length, 4);
  assert.deepEqual(calls.map(({ options }) => options.method), ['GET', 'GET', 'GET', 'GET']);
  assert.deepEqual(evidence.checks.find((check) => check.path === '/api/productos'), {
    method: 'GET', path: '/api/productos', status: 503, timingMs: 0, category: 'unexpected-status', result: 'fail',
  });
  assert.equal(JSON.stringify(evidence).includes('503 response body'), false);
});

test('a non-settling request times out with redacted failure evidence and no retry', async () => {
  const calls = [];
  const evidence = await runProductionSmoke(DEFAULT_API_BASE_URL, {
    timeoutMs: 10,
    fetchImpl: (url, options) => {
      calls.push({ url, options });
      return new Promise((resolve, reject) => options.signal.addEventListener('abort', () => reject(options.signal.reason), { once: true }));
    },
  });

  assert.equal(evidence.result, 'fail');
  assert.equal(calls.length, 4);
  assert.ok(calls.every(({ options }) => options.method === 'GET' && options.signal instanceof AbortSignal));
  assert.ok(evidence.checks.every((check) => check.category === 'timeout' && check.status === null));
  assert.equal(JSON.stringify(evidence).includes(DEFAULT_API_BASE_URL), false);
});

test('the forward idempotency migration is non-destructive and its release gate is documented', async () => {
  const migration = await readFile(new URL('../backend/prisma/migrations/20260715090000_order_confirmation_idempotency/migration.sql', import.meta.url), 'utf8');
  const deployGuide = await readFile(new URL('../docs/DEPLOY_RAILWAY_VERCEL.md', import.meta.url), 'utf8');

  assert.match(migration, /ADD COLUMN "confirmationKey" TEXT/);
  assert.match(migration, /CREATE UNIQUE INDEX "Order_confirmationKey_key"/);
  assert.equal(/\bDROP\b/i.test(migration), false);
  assert.match(deployGuide, /forward fix/i);
  assert.match(deployGuide, /approval/i);
});
