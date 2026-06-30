// JWT sign/verify using Node crypto HMAC-SHA256 (HS256).
// No external dependency — standard JWT format: base64url(header).base64url(payload).base64url(sig)
// Guards against alg-confusion attacks by strictly requiring HS256.

const crypto = require('crypto');

const ALG = 'HS256';
const TOKEN_TTL_SECONDS = 60 * 60 * 8; // 8 hours

function base64url(input) {
  return Buffer.from(input).toString('base64url');
}

function base64urlDecode(str) {
  return Buffer.from(str, 'base64url');
}

/**
 * Sign an admin JWT (HS256).
 * @param {{id:number,email:string,role:string}} payload
 * @param {string} secret - JWT_SECRET from env
 * @returns {string} JWT token
 */
function signAdminToken(payload, secret) {
  if (!secret) throw new Error('JWT_SECRET is required to sign tokens');
  const header = base64url(JSON.stringify({ alg: ALG, typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + TOKEN_TTL_SECONDS };
  const payloadB64 = base64url(JSON.stringify(body));
  const signingInput = `${header}.${payloadB64}`;
  const sig = crypto.createHmac('sha256', secret).update(signingInput).digest('base64url');
  return `${signingInput}.${sig}`;
}

/**
 * Verify an admin JWT (HS256 only). Returns payload or null on any failure.
 * @param {string} token
 * @param {string} secret
 * @returns {{id:number,email:string,role:string,iat:number,exp:number}|null}
 */
function verifyAdminToken(token, secret) {
  if (typeof token !== 'string' || !secret) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, sigB64] = parts;

  let header;
  try {
    header = JSON.parse(base64urlDecode(headerB64).toString('utf8'));
  } catch {
    return null;
  }
  // Strict alg guard — reject anything that isn't HS256 (alg-confusion defense).
  if (header.alg !== ALG) return null;
  if (header.typ && header.typ !== 'JWT') return null;

  const signingInput = `${headerB64}.${payloadB64}`;
  const expectedSig = crypto.createHmac('sha256', secret).update(signingInput).digest('base64url');
  // Constant-time compare of the base64url signatures.
  if (expectedSig.length !== sigB64.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(sigB64))) return null;

  let payload;
  try {
    payload = JSON.parse(base64urlDecode(payloadB64).toString('utf8'));
  } catch {
    return null;
  }
  // Expiry check
  if (typeof payload.exp !== 'number') return null;
  if (Math.floor(Date.now() / 1000) >= payload.exp) return null;
  return payload;
}

module.exports = { signAdminToken, verifyAdminToken, TOKEN_TTL_SECONDS };