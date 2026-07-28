// Resolves frontend data source: mock (demo) vs api (real backend).
// Node tests without Vite env keep `api` so existing fetch stubs still apply.

const ENV = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};

/**
 * @returns {'mock' | 'api'}
 */
export function getDataMode() {
  const raw = String(ENV.VITE_DATA_MODE || '').toLowerCase().trim();
  if (raw === 'api' || raw === 'mock') return raw;
  // Outside Vite (node:test importing .js clients) → preserve HTTP client behavior.
  if (ENV.MODE === undefined && ENV.DEV === undefined && ENV.PROD === undefined) return 'api';
  return 'mock';
}

export function isMockMode() {
  return getDataMode() === 'mock';
}

export function isApiMode() {
  return getDataMode() === 'api';
}
