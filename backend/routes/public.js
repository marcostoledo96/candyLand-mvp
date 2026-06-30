// Public routes: category listing + contact/job/franchise form submissions.
// No admin token required. No email sending. No product payload in categories.
//
// Slug is shared via utils/slug (admin uses the same helper). Categories expose
// activeProductCount computed from active products only (Product.active === true).
//
// Error shape (matches existing public/admin API):
//   validation 400 -> { error: 'Validation failed', errors: [...] }
//   malformed/oversized body 400 -> { error: <reason> }
//   internal 500 -> { error: 'Internal Server Error' }

const express = require('express');
const prisma = require('../prismaClient');
const { slugify } = require('../utils/slug');

const router = express.Router();

// --- Field length limits (validation at the trust boundary) ---
const PUBLIC_FIELD_LIMITS = {
  name: 100,
  fullName: 100,
  position: 100,
  city: 100,
  phone: 100,
  email: 254,
  cvUrl: 500,
  message: 2000,
};

// --- Helpers (pure, exported for unit tests) ---

/**
 * Basic email check: something@something.suffix. Not RFC-complete; good enough
 * for a trust-boundary guard. The DB stores whatever passes.
 */
function isValidEmail(value) {
  if (typeof value !== 'string') return false;
  const t = value.trim();
  if (t.length === 0) return false;
  // local@domain.tld — require a dot in the domain part.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

/**
 * Validate a required string field: must be a non-empty trimmed string within
 * maxLen. Optional fields skip the required check.
 */
function validateString(errors, normalized, input, field, { required, maxLen }) {
  if (input[field] === undefined || input[field] === null) {
    if (required) errors.push(`${field} is required`);
    return;
  }
  if (typeof input[field] !== 'string') {
    errors.push(`${field} MUST be a string`);
    return;
  }
  const t = input[field].trim();
  if (required && t.length === 0) {
    errors.push(`${field} MUST be non-empty`);
    return;
  }
  if (t.length === 0) {
    // optional empty -> store as undefined (Prisma treats as "not provided")
    return;
  }
  if (t.length > maxLen) {
    errors.push(`${field} MUST be at most ${maxLen} chars`);
    return;
  }
  normalized[field] = t;
}

/**
 * Map a Prisma Category row to the public DTO.
 * @param {object} c - Prisma category row (may include _count from a relation count)
 * @param {number} [explicitCount] - active product count if computed outside Prisma
 */
function mapCategoryToPublicDto(c, explicitCount) {
  const count = typeof explicitCount === 'number'
    ? explicitCount
    : (c && c._count && typeof c._count.products === 'number' ? c._count.products : 0);
  return {
    id: c.id,
    name: c.name,
    slug: slugify(c.name),
    activeProductCount: count,
  };
}

/**
 * Validate contact submission input: name, email, message required; phone optional.
 */
function validateContactInput(input) {
  const errors = [];
  const normalized = {};
  const v = input || {};

  validateString(errors, normalized, v, 'name', { required: true, maxLen: PUBLIC_FIELD_LIMITS.name });
  validateString(errors, normalized, v, 'phone', { required: false, maxLen: PUBLIC_FIELD_LIMITS.phone });

  if (v.email === undefined || v.email === null) {
    errors.push('email is required');
  } else if (typeof v.email !== 'string') {
    errors.push('email MUST be a string');
  } else {
    const e = v.email.trim();
    if (e.length === 0) errors.push('email MUST be non-empty');
    else if (e.length > PUBLIC_FIELD_LIMITS.email) errors.push('email MUST be at most 254 chars');
    else if (!isValidEmail(e)) errors.push('email MUST be a valid email address');
    else normalized.email = e;
  }

  validateString(errors, normalized, v, 'message', { required: true, maxLen: PUBLIC_FIELD_LIMITS.message });

  return { ok: errors.length === 0, errors, normalized };
}

/**
 * Validate job application input: fullName, email, position required;
 * phone, message, cvUrl optional.
 */
function validateJobApplicationInput(input) {
  const errors = [];
  const normalized = {};
  const v = input || {};

  validateString(errors, normalized, v, 'fullName', { required: true, maxLen: PUBLIC_FIELD_LIMITS.fullName });
  validateString(errors, normalized, v, 'phone', { required: false, maxLen: PUBLIC_FIELD_LIMITS.phone });
  validateString(errors, normalized, v, 'position', { required: true, maxLen: PUBLIC_FIELD_LIMITS.position });
  validateString(errors, normalized, v, 'message', { required: false, maxLen: PUBLIC_FIELD_LIMITS.message });
  validateString(errors, normalized, v, 'cvUrl', { required: false, maxLen: PUBLIC_FIELD_LIMITS.cvUrl });

  if (v.email === undefined || v.email === null) {
    errors.push('email is required');
  } else if (typeof v.email !== 'string') {
    errors.push('email MUST be a string');
  } else {
    const e = v.email.trim();
    if (e.length === 0) errors.push('email MUST be non-empty');
    else if (e.length > PUBLIC_FIELD_LIMITS.email) errors.push('email MUST be at most 254 chars');
    else if (!isValidEmail(e)) errors.push('email MUST be a valid email address');
    else normalized.email = e;
  }

  return { ok: errors.length === 0, errors, normalized };
}

/**
 * Validate franchise lead input: fullName, email, city required; phone, message optional.
 */
function validateFranchiseLeadInput(input) {
  const errors = [];
  const normalized = {};
  const v = input || {};

  validateString(errors, normalized, v, 'fullName', { required: true, maxLen: PUBLIC_FIELD_LIMITS.fullName });
  validateString(errors, normalized, v, 'phone', { required: false, maxLen: PUBLIC_FIELD_LIMITS.phone });
  validateString(errors, normalized, v, 'city', { required: true, maxLen: PUBLIC_FIELD_LIMITS.city });
  validateString(errors, normalized, v, 'message', { required: false, maxLen: PUBLIC_FIELD_LIMITS.message });

  if (v.email === undefined || v.email === null) {
    errors.push('email is required');
  } else if (typeof v.email !== 'string') {
    errors.push('email MUST be a string');
  } else {
    const e = v.email.trim();
    if (e.length === 0) errors.push('email MUST be non-empty');
    else if (e.length > PUBLIC_FIELD_LIMITS.email) errors.push('email MUST be at most 254 chars');
    else if (!isValidEmail(e)) errors.push('email MUST be a valid email address');
    else normalized.email = e;
  }

  return { ok: errors.length === 0, errors, normalized };
}

// --- Routes ---

// GET /api/categories — public, no admin token.
// Returns categories with id, name, derived slug, activeProductCount (active
// products only). No product payload.
router.get('/categories', async (_req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { id: 'asc' },
      _count: { select: { products: { where: { active: true } } } },
    });
    res.json(categories.map((c) => mapCategoryToPublicDto(c)));
  } catch (err) {
    console.error('public list categories error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/contact — public, persists ContactMessage, no email.
router.post('/contact', async (req, res) => {
  try {
    const { ok, errors, normalized } = validateContactInput(req.body);
    if (!ok) return res.status(400).json({ error: 'Validation failed', errors });
    const created = await prisma.contactMessage.create({
      data: {
        name: normalized.name,
        email: normalized.email,
        phone: normalized.phone || null,
        message: normalized.message,
      },
    });
    res.status(201).json({ ok: true, id: created.id });
  } catch (err) {
    console.error('public contact create error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/jobs/applications — public, persists JobApplication.
router.post('/jobs/applications', async (req, res) => {
  try {
    const { ok, errors, normalized } = validateJobApplicationInput(req.body);
    if (!ok) return res.status(400).json({ error: 'Validation failed', errors });
    const created = await prisma.jobApplication.create({
      data: {
        fullName: normalized.fullName,
        email: normalized.email,
        phone: normalized.phone || null,
        position: normalized.position,
        message: normalized.message || null,
        cvUrl: normalized.cvUrl || null,
      },
    });
    res.status(201).json({ ok: true, id: created.id });
  } catch (err) {
    console.error('public job application create error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/franchise/leads — public, persists FranchiseLead.
router.post('/franchise/leads', async (req, res) => {
  try {
    const { ok, errors, normalized } = validateFranchiseLeadInput(req.body);
    if (!ok) return res.status(400).json({ error: 'Validation failed', errors });
    const created = await prisma.franchiseLead.create({
      data: {
        fullName: normalized.fullName,
        email: normalized.email,
        phone: normalized.phone || null,
        city: normalized.city,
        message: normalized.message || null,
      },
    });
    res.status(201).json({ ok: true, id: created.id });
  } catch (err) {
    console.error('public franchise lead create error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = {
  router,
  slugify, // re-exported for convenience (shared from utils/slug)
  isValidEmail,
  mapCategoryToPublicDto,
  validateContactInput,
  validateJobApplicationInput,
  validateFranchiseLeadInput,
  PUBLIC_FIELD_LIMITS,
};