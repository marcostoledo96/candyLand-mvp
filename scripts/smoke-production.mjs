const DEFAULT_API_BASE_URL = 'https://candyland-mvp-production.up.railway.app';
const ENDPOINTS = ['/api/health', '/api/db/health', '/api/productos', '/api/categories'];
const SUCCESS_CATEGORIES = ['health', 'database-health', 'catalog', 'categories'];

function parseApiBaseUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('API base URL must be a valid HTTPS origin.');
  }
  if (url.protocol !== 'https:') throw new Error('API base URL must use HTTPS.');
  if (url.username || url.password) throw new Error('API base URL must not include credentials.');
  if (url.pathname !== '/' || url.search || url.hash) throw new Error('API base URL must be an origin without a path, query, or hash.');
  return url.origin;
}

async function runProductionSmoke(baseUrl, { fetchImpl = fetch, now = () => new Date().toISOString(), monotonicNow = () => performance.now() } = {}) {
  const origin = parseApiBaseUrl(baseUrl);
  const observedAt = now();
  const checks = [];

  for (const [index, path] of ENDPOINTS.entries()) {
    const startedAt = monotonicNow();
    try {
      const response = await fetchImpl(new URL(path, origin), { method: 'GET', redirect: 'error' });
      const status = response.status;
      const success = status >= 200 && status < 300;
      checks.push({
        method: 'GET',
        path,
        status,
        timingMs: Math.max(0, Math.round(monotonicNow() - startedAt)),
        category: success ? SUCCESS_CATEGORIES[index] : 'unexpected-status',
        result: success ? 'pass' : 'fail',
      });
    } catch {
      checks.push({
        method: 'GET',
        path,
        status: null,
        timingMs: Math.max(0, Math.round(monotonicNow() - startedAt)),
        category: 'network-error',
        result: 'fail',
      });
    }
  }

  return {
    revision: 'production-deploy-qa/v1',
    observedAt,
    result: checks.every((check) => check.result === 'pass') ? 'pass' : 'fail',
    checks,
    redactions: ['base-url', 'response-bodies', 'headers', 'cookies', 'queries', 'environment', 'logs'],
  };
}

async function main() {
  const baseUrl = process.argv[2] || DEFAULT_API_BASE_URL;
  const evidence = await runProductionSmoke(baseUrl);
  process.stdout.write(`${JSON.stringify(evidence)}\n`);
  if (evidence.result !== 'pass') process.exitCode = 1;
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  main().catch(() => {
    process.stdout.write(`${JSON.stringify({ revision: 'production-deploy-qa/v1', result: 'fail', checks: [], redactions: ['base-url', 'response-bodies', 'headers', 'cookies', 'queries', 'environment', 'logs'] })}\n`);
    process.exitCode = 1;
  });
}

export { DEFAULT_API_BASE_URL, ENDPOINTS, parseApiBaseUrl, runProductionSmoke };
