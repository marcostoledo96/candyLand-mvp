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

/**
 * Base URL for real API mode.
 * - mock → ''
 * - api + VITE_API_URL → trimmed origin
 * - api in node tests / Vite DEV without URL → '' (relative `/api`, existing stubs/proxy)
 * - api in Vite production without URL → throw (fail closed)
 * @returns {string}
 */
export function getApiBaseUrl() {
  if (isMockMode()) return '';
  const url = String(ENV.VITE_API_URL || '').trim().replace(/\/$/, '');
  if (url) return url;
  const outsideVite = ENV.MODE === undefined && ENV.DEV === undefined && ENV.PROD === undefined;
  if (outsideVite || ENV.DEV) return '';
  throw new Error('VITE_API_URL is required when VITE_DATA_MODE=api');
}
