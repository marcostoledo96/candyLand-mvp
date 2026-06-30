// Password hashing using Node crypto.scrypt (no external dependency).
// Format: scrypt$<saltHex>$<hashHex>
// Uses timingSafeEqual to prevent timing attacks on comparison.

const crypto = require('crypto');

const KEY_LEN = 64; // 64-byte derived key
const SCRYPT_PARAMS = { N: 16384, r: 16, p: 1, maxmem: 64 * 1024 * 1024 };

/**
 * Hash a plaintext password with a random salt using scrypt.
 * @param {string} password
 * @returns {string} `scrypt$<saltHex>$<hashHex>`
 */
function hashPassword(password) {
  if (typeof password !== 'string' || password.length === 0) {
    throw new Error('password MUST be a non-empty string');
  }
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, KEY_LEN, SCRYPT_PARAMS);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

/**
 * Verify a plaintext password against a scrypt hash.
 * Constant-time comparison via timingSafeEqual.
 * @param {string} password
 * @param {string} stored `scrypt$<saltHex>$<hashHex>`
 * @returns {boolean}
 */
function verifyPassword(password, stored) {
  if (typeof password !== 'string' || password.length === 0) return false;
  if (typeof stored !== 'string') return false;
  const parts = stored.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const saltHex = parts[1];
  const hashHex = parts[2];
  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(hashHex, 'hex');
  if (salt.length === 0 || expected.length === 0) return false;
  try {
    const computed = crypto.scryptSync(password, salt, expected.length, SCRYPT_PARAMS);
    // ponytail: timingSafeEqual requires equal-length buffers; scryptSync with
    // expected.length guarantees this. If a malformed stored hash has a different
    // length, computed matches expected.length by construction, so this is safe.
    return crypto.timingSafeEqual(computed, expected);
  } catch {
    return false;
  }
}

module.exports = { hashPassword, verifyPassword };