// Runtime config pure functions for Railway/Vercel separation.
// Extracted from server.js/app.js to be unit-testable (no side effects).

// Dev fallback when CORS_ORIGIN is not set — sensible localhost + prod domain.
const DEV_CORS_FALLBACK = ['http://localhost:5173', 'https://candy-land-mvp.vercel.app'];

// Default Railway port.
const DEFAULT_PORT = 5050;

// Default bind host: 0.0.0.0 is required by Railway (container ingress).
// Override via HOST env for local 127.0.0.1 access.
const DEFAULT_HOST = '0.0.0.0';

/**
 * Parse CORS_ORIGIN (comma-separated origins) into a trimmed allowlist.
 * Falls back to dev origins when CORS_ORIGIN is missing/empty so local dev
 * and the known Vercel domain keep working without manual config.
 */
function parseCorsOrigins(env) {
  const raw = env && env.CORS_ORIGIN;
  if (!raw || !raw.trim()) return DEV_CORS_FALLBACK.slice();
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter((o) => o.length > 0);
}

/**
 * Resolve bind host. Defaults to 0.0.0.0 (Railway requirement).
 * HOST env lets local dev keep 127.0.0.1 for curl.
 */
function resolveHost(env) {
  return (env && env.HOST) || DEFAULT_HOST;
}

/**
 * Resolve listen port. Railway injects PORT; fall back to 5050.
 */
function resolvePort(env) {
  const p = env && env.PORT;
  if (!p) return DEFAULT_PORT;
  const port = Number(p);
  return Number.isInteger(port) && port > 0 && port <= 65535 ? port : DEFAULT_PORT;
}

/**
 * Build cors middleware options from env.
 * Never returns origin:true — always an explicit allowlist.
 */
function buildCorsOptions(env) {
  return { origin: parseCorsOrigins(env) };
}

module.exports = { parseCorsOrigins, resolveHost, resolvePort, buildCorsOptions, DEV_CORS_FALLBACK, DEFAULT_HOST, DEFAULT_PORT };
