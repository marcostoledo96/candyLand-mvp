// Admin auth helpers: JWT payload decode (UI display only), token expiry check,
// and sessionStorage token management.

export const ADMIN_TOKEN_KEY = 'admin_token';
export const ADMIN_AUTH_EXPIRED_EVENT = 'admin-auth-expired';

export function decodeAdminTokenPayload(token) {
  if (typeof token !== 'string' || !token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const bytes = atob(padded);
    const payload = JSON.parse(new TextDecoder().decode(Uint8Array.from(bytes, (byte) => byte.charCodeAt(0))));
    if (typeof payload !== 'object' || payload === null) return null;
    return payload;
  } catch {
    return null;
  }
}

export function isAdminTokenExpired(payload) {
  if (!payload || typeof payload.exp !== 'number') return true;
  return Math.floor(Date.now() / 1000) >= payload.exp;
}

export class AdminAuthError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AdminAuthError';
    this.clearedToken = true;
  }
}

export function getAdminToken() {
  try { return globalThis.sessionStorage.getItem(ADMIN_TOKEN_KEY); } catch { return null; }
}

export function setAdminToken(token) {
  try {
    globalThis.sessionStorage.setItem(ADMIN_TOKEN_KEY, String(token));
  } catch (err) {
    if (err && (err.name === 'QuotaExceededError' || err.name === 'SecurityError')) {
      throw new AdminAuthError('No se pudo guardar la sesión');
    }
    throw err;
  }
}

export function clearAdminToken() {
  try { globalThis.sessionStorage.removeItem(ADMIN_TOKEN_KEY); } catch { /* best effort */ }
}

export function expireAdminSession() {
  clearAdminToken();
  globalThis.dispatchEvent?.(new Event(ADMIN_AUTH_EXPIRED_EVENT));
}
