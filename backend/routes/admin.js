// Admin routes: auth (login, me) + protected products CRUD.
// JWT (HS256) + scrypt password verification. No external auth dependency.
// DTO maps imageUrl <-> Product.image and hoverImageUrl <-> Product.hoverImage
// (DB columns kept as image/hoverImage per PR-3 decision; admin API uses *Url names).
//
// Scope note: categories CRUD and orders CRUD are deferred to a follow-up
// branch to keep this review under budget (admin auth + products CRUD only).

const express = require('express');
const prisma = require('../prismaClient');
const { verifyPassword } = require('../utils/password');
const { signAdminToken } = require('../utils/jwt');
const { requireAdmin } = require('../middleware/admin');

const router = express.Router();

// --- DTO mapping ---

/**
 * Map a Prisma Product row to the admin DTO.
 * image -> imageUrl, hoverImage -> hoverImageUrl.
 */
function mapProductToAdminDto(p) {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    priceCents: p.priceCents,
    imageUrl: p.image,
    hoverImageUrl: p.hoverImage,
    stock: p.stock,
    active: p.active,
    categoryId: p.categoryId,
    category: p.category ? p.category.name : null,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

/**
 * Map an admin input DTO to Prisma Product create/update data.
 * imageUrl -> image, hoverImageUrl -> hoverImage.
 * Strips id/createdAt/updatedAt if present (not settable by client).
 */
function mapAdminDtoToProductData(input) {
  const data = {
    title: input.title,
    description: input.description,
    priceCents: input.priceCents,
    image: input.imageUrl,
    hoverImage: input.hoverImageUrl,
    stock: input.stock,
    active: input.active,
    categoryId: input.categoryId,
  };
  // Omit undefined keys so partial PATCH updates don't null out fields.
  Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
  return data;
}

/**
 * Validate product input at the trust boundary.
 * @returns {{ok:boolean, errors:string[], normalized:object}}
 */
function validateProductInput(input, { partial = false } = {}) {
  const errors = [];
  const normalized = {};
  const v = input || {};

  // title
  if (v.title !== undefined) {
    const t = String(v.title).trim();
    if (t.length === 0) errors.push('title MUST be non-empty');
    else if (t.length > 200) errors.push('title MUST be at most 200 chars');
    else normalized.title = t;
  } else if (!partial) {
    errors.push('title is required');
  }

  // priceCents
  if (v.priceCents !== undefined) {
    const p = Number(v.priceCents);
    if (!Number.isInteger(p) || p < 0) errors.push('priceCents MUST be a non-negative integer');
    else normalized.priceCents = p;
  } else if (!partial) {
    errors.push('priceCents is required');
  }

  // stock
  if (v.stock !== undefined) {
    const s = Number(v.stock);
    if (!Number.isInteger(s) || s < 0) errors.push('stock MUST be a non-negative integer');
    else normalized.stock = s;
  } else if (!partial) {
    normalized.stock = 0; // default
  }

  // categoryId
  if (v.categoryId !== undefined) {
    const c = Number(v.categoryId);
    if (!Number.isInteger(c) || c <= 0) errors.push('categoryId MUST be a positive integer');
    else normalized.categoryId = c;
  } else if (!partial) {
    errors.push('categoryId is required');
  }

  // imageUrl (optional, must be string if present)
  if (v.imageUrl !== undefined && v.imageUrl !== null) {
    if (typeof v.imageUrl !== 'string') errors.push('imageUrl MUST be a string');
    else normalized.imageUrl = v.imageUrl.trim() || null;
  }
  if (v.hoverImageUrl !== undefined && v.hoverImageUrl !== null) {
    if (typeof v.hoverImageUrl !== 'string') errors.push('hoverImageUrl MUST be a string');
    else normalized.hoverImageUrl = v.hoverImageUrl.trim() || null;
  }

  // description (optional)
  if (v.description !== undefined && v.description !== null) {
    if (typeof v.description !== 'string') errors.push('description MUST be a string');
    else normalized.description = v.description;
  }

  // active (optional, defaults true on create)
  if (v.active !== undefined) {
    normalized.active = Boolean(v.active);
  } else if (!partial) {
    normalized.active = true;
  }

  return { ok: errors.length === 0, errors, normalized };
}

// --- Auth routes (public) ---

// POST /api/admin/login
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      // Admin auth not configured — refuse to issue tokens rather than crash.
      return res.status(500).json({ error: 'Admin auth not configured (JWT_SECRET missing)' });
    }
    const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase().trim() } });
    if (!user || !user.active || user.role !== 'ADMIN') {
      // ponytail: same message for wrong-user/wrong-password/non-admin to avoid
      // user enumeration and role disclosure. Non-admin users cannot log in here.
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    if (!verifyPassword(String(password), user.passwordHash)) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const token = signAdminToken({ id: user.id, email: user.email, role: user.role }, secret);
    return res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    console.error('admin login error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/admin/me — protected, returns current admin from token.
// requireAdmin reads JWT_SECRET lazily so /admin/me returns 500 (not crash) if
// the secret is missing; public routes and health keep working regardless.
router.get('/admin/me', requireAdmin(), (req, res) => {
  res.json({ id: req.user.id, email: req.user.email, role: req.user.role });
});

// --- Admin products CRUD (protected) ---

const adminGuard = requireAdmin();

// GET /api/admin/products
router.get('/admin/products', adminGuard, async (_req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { id: 'asc' },
    });
    res.json(products.map(mapProductToAdminDto));
  } catch (err) {
    console.error('admin list products error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/admin/products
router.post('/admin/products', adminGuard, async (req, res) => {
  try {
    const { ok, errors, normalized } = validateProductInput(req.body);
    if (!ok) return res.status(400).json({ error: 'Validation failed', errors });
    // Verify category exists
    const cat = await prisma.category.findUnique({ where: { id: normalized.categoryId } });
    if (!cat) return res.status(400).json({ error: 'categoryId does not exist' });
    const data = mapAdminDtoToProductData(normalized);
    const created = await prisma.product.create({ data, include: { category: true } });
    res.status(201).json(mapProductToAdminDto(created));
  } catch (err) {
    console.error('admin create product error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PATCH /api/admin/products/:id
router.patch('/admin/products/:id', adminGuard, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid product id' });
    const { ok, errors, normalized } = validateProductInput(req.body, { partial: true });
    if (!ok) return res.status(400).json({ error: 'Validation failed', errors });
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Product not found' });
    if (normalized.categoryId !== undefined && normalized.categoryId !== existing.categoryId) {
      const cat = await prisma.category.findUnique({ where: { id: normalized.categoryId } });
      if (!cat) return res.status(400).json({ error: 'categoryId does not exist' });
    }
    const data = mapAdminDtoToProductData(normalized);
    const updated = await prisma.product.update({ where: { id }, data, include: { category: true } });
    res.json(mapProductToAdminDto(updated));
  } catch (err) {
    console.error('admin update product error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE /api/admin/products/:id — soft delete via active=false
router.delete('/admin/products/:id', adminGuard, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid product id' });
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Product not found' });
    await prisma.product.update({ where: { id }, data: { active: false } });
    res.json({ id, active: false, deleted: true });
  } catch (err) {
    console.error('admin delete product error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- Admin categories CRUD: DEFERRED to follow-up branch ---
// --- Admin orders CRUD: DEFERRED to follow-up branch ---

module.exports = { router, mapProductToAdminDto, mapAdminDtoToProductData, validateProductInput };