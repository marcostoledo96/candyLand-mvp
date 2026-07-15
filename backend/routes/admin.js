// Admin routes: auth (login, me) + protected products, categories and orders CRUD.
// JWT (HS256) + scrypt password verification. No external auth dependency.
// DTO maps imageUrl <-> Product.image and hoverImageUrl <-> Product.hoverImage
// (DB columns kept as image/hoverImage per PR-3 decision; admin API uses *Url names).
//
// Category slug/active: the Prisma Category model has only {id, name @unique,
// products, createdAt, updatedAt} — no slug/active columns. Per spec guidance we
// DERIVE slug from name at read time and report a constant active=true rather
// than churning the schema in this backend-only slice. If real slug/active
// columns are added later, mapCategoryToAdminDto + the create/update handlers
// are the single place to update.
//
// Order status: the schema stores status as a String defaulting to "PENDING"
// (canonical English uppercase). The admin API accepts Spanish aliases
// (pendiente/enviado/entregado/cancelado) and canonical English, normalizing
// everything to the canonical uppercase form stored in the DB.

const express = require('express');
const { Prisma } = require('@prisma/client');
const prisma = require('../prismaClient');
const { verifyPassword } = require('../utils/password');
const { signAdminToken } = require('../utils/jwt');
const { requireAdmin } = require('../middleware/admin');
const { slugify } = require('../utils/slug');

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
    if (typeof v.title !== 'string') errors.push('title MUST be a string');
    else {
      const t = v.title.trim();
      if (t.length === 0) errors.push('title MUST be non-empty');
      else if (t.length > 200) errors.push('title MUST be at most 200 chars');
      else normalized.title = t;
    }
  } else if (!partial) {
    errors.push('title is required');
  }

  // priceCents
  if (v.priceCents !== undefined) {
    // Reject null/empty/non-number before coercion: Number('') === 0, Number(null) === 0.
    if (
      v.priceCents === null
      || typeof v.priceCents === 'boolean'
      || Array.isArray(v.priceCents)
      || (typeof v.priceCents === 'string' && v.priceCents.trim() === '')
      || (typeof v.priceCents !== 'string' && typeof v.priceCents !== 'number')
    ) {
      errors.push('priceCents MUST be a non-negative integer');
    } else {
      const p = Number(v.priceCents);
      if (!Number.isInteger(p) || p < 0) errors.push('priceCents MUST be a non-negative integer');
      else normalized.priceCents = p;
    }
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

  // active (optional, defaults true on create). Accept booleans and the
  // strings "true"/"false"; reject everything else (Boolean("false") === true).
  if (v.active !== undefined) {
    if (typeof v.active === 'boolean') {
      normalized.active = v.active;
    } else if (v.active === 'true' || v.active === 'false') {
      normalized.active = v.active === 'true';
    } else {
      errors.push('active MUST be a boolean or the string "true"/"false"');
    }
  } else if (!partial) {
    normalized.active = true;
  }

  return { ok: errors.length === 0, errors, normalized };
}

// --- Category helpers ---

/**
 * Map a Prisma Category row to the admin DTO.
 * slug is derived from name (schema has no slug column).
 * active is constant true (schema has no active column) — see file header.
 */
function mapCategoryToAdminDto(c) {
  return {
    id: c.id,
    name: c.name,
    slug: slugify(c.name),
    active: true,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

/**
 * Validate category input at the trust boundary.
 * @returns {{ok:boolean, errors:string[], normalized:object}}
 */
function validateCategoryInput(input, { partial = false } = {}) {
  const errors = [];
  const normalized = {};
  const v = input || {};

  if (v.name !== undefined) {
    if (typeof v.name !== 'string') errors.push('name MUST be a string');
    else {
      const n = v.name.trim();
      if (n.length === 0) errors.push('name MUST be non-empty');
      else if (n.length > 100) errors.push('name MUST be at most 100 chars');
      else normalized.name = n;
    }
  } else if (!partial) {
    errors.push('name is required');
  }

  return { ok: errors.length === 0, errors, normalized };
}

// --- Order helpers ---

// Canonical uppercase statuses stored in Order.status (schema default "PENDING").
const ORDER_STATUSES = ['PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

// Spanish + lowercase aliases -> canonical. Used by admin PATCH/list filter.
const ORDER_STATUS_ALIASES = {
  pendiente: 'PENDING',
  enviado: 'SHIPPED',
  entregado: 'DELIVERED',
  cancelado: 'CANCELLED',
  pending: 'PENDING',
  shipped: 'SHIPPED',
  delivered: 'DELIVERED',
  cancelled: 'CANCELLED',
};

/**
 * Normalize an order status string to its canonical uppercase form.
 * Accepts Spanish aliases and canonical English. Returns null if unknown
 * or non-string.
 */
function normalizeOrderStatus(value) {
  if (typeof value !== 'string') return null;
  const key = value.trim().toLowerCase();
  if (!key) return null;
  if (Object.prototype.hasOwnProperty.call(ORDER_STATUS_ALIASES, key)) {
    return ORDER_STATUS_ALIASES[key];
  }
  const upper = key.toUpperCase();
  if (ORDER_STATUSES.includes(upper)) return upper;
  return null;
}

function isValidOrderStatus(value) {
  return normalizeOrderStatus(value) !== null;
}

/**
 * Validate order status PATCH input.
 * @returns {{ok:boolean, errors:string[], normalized:{status:string}}}
 */
function validateOrderStatusInput(input) {
  const errors = [];
  const normalized = {};
  const v = input || {};

  if (v.status === undefined || v.status === null || v.status === '') {
    errors.push('status is required');
  } else {
    const canonical = normalizeOrderStatus(v.status);
    if (!canonical) {
      errors.push('status MUST be one of: pendiente, enviado, entregado, cancelado');
    } else {
      normalized.status = canonical;
    }
  }

  return { ok: errors.length === 0, errors, normalized };
}

function orderStatusError(status, body) {
  return Object.assign(new Error(body.error), { status, body });
}

/**
 * Map a Prisma Order (with relations) to the admin DTO.
 * Exposes enough for a future admin UI: id, orderNumber, status, totals,
 * payment method/status, contact fields, and items with product reference +
 * subtotal. Tolerates missing payment/customer/items (e.g. partial includes).
 */
function mapOrderToAdminDto(order) {
  const customer = order.customer || null;
  const payment = order.payment || null;
  const items = Array.isArray(order.items) ? order.items.map((it) => ({
    productId: it.productId,
    productTitle: it.product ? it.product.title : null,
    quantity: it.quantity,
    priceCents: it.priceCents,
    subtotalCents: it.quantity * it.priceCents,
  })) : [];

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    totalCents: order.totalCents,
    paymentMethod: payment ? payment.method : null,
    paymentStatus: payment ? payment.status : null,
    contact: customer ? {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      province: customer.province,
      postalCode: customer.postalCode,
    } : null,
    items,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
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

// --- Admin categories CRUD (protected) ---

// GET /api/admin/categories
router.get('/admin/categories', adminGuard, async (_req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { id: 'asc' },
    });
    res.json(categories.map(mapCategoryToAdminDto));
  } catch (err) {
    console.error('admin list categories error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/admin/categories
router.post('/admin/categories', adminGuard, async (req, res) => {
  try {
    const { ok, errors, normalized } = validateCategoryInput(req.body);
    if (!ok) return res.status(400).json({ error: 'Validation failed', errors });
    try {
      const created = await prisma.category.create({ data: { name: normalized.name } });
      res.status(201).json(mapCategoryToAdminDto(created));
    } catch (createErr) {
      // P2002 = unique constraint violation (duplicate name).
      if (createErr && createErr.code === 'P2002') {
        return res.status(409).json({ error: 'A category with that name already exists' });
      }
      throw createErr;
    }
  } catch (err) {
    console.error('admin create category error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PATCH /api/admin/categories/:id
router.patch('/admin/categories/:id', adminGuard, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid category id' });
    const { ok, errors, normalized } = validateCategoryInput(req.body, { partial: true });
    if (!ok) return res.status(400).json({ error: 'Validation failed', errors });
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Category not found' });
    try {
      const updated = await prisma.category.update({ where: { id }, data: { name: normalized.name } });
      res.json(mapCategoryToAdminDto(updated));
    } catch (updateErr) {
      if (updateErr && updateErr.code === 'P2002') {
        return res.status(409).json({ error: 'A category with that name already exists' });
      }
      throw updateErr;
    }
  } catch (err) {
    console.error('admin update category error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE /api/admin/categories/:id — blocked while products reference it
router.delete('/admin/categories/:id', adminGuard, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid category id' });
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Category not found' });
    // Block deletion when products reference the category.
    const productCount = await prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      return res.status(409).json({ error: 'Cannot delete a category that has products', productCount });
    }
    await prisma.category.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    console.error('admin delete category error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- Admin orders (protected) ---

// GET /api/admin/orders?status=
router.get('/admin/orders', adminGuard, async (req, res) => {
  try {
    const where = {};
    const rawStatus = req.query.status;
    if (typeof rawStatus === 'string' && rawStatus.trim() !== '') {
      const canonical = normalizeOrderStatus(rawStatus);
      if (!canonical) {
        return res.status(400).json({ error: 'Invalid status filter', allowed: ORDER_STATUSES });
      }
      where.status = canonical;
    }
    const orders = await prisma.order.findMany({
      where,
      include: {
        items: { include: { product: { select: { id: true, title: true } } } },
        payment: true,
        customer: true,
      },
      orderBy: { id: 'asc' },
    });
    res.json(orders.map(mapOrderToAdminDto));
  } catch (err) {
    console.error('admin list orders error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/admin/orders/:id
router.get('/admin/orders/:id', adminGuard, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid order id' });
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: { select: { id: true, title: true } } } },
        payment: true,
        customer: true,
      },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(mapOrderToAdminDto(order));
  } catch (err) {
    console.error('admin get order error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PATCH /api/admin/orders/:id — status update with allowlist
router.patch('/admin/orders/:id', adminGuard, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid order id' });
    const { ok, errors, normalized } = validateOrderStatusInput(req.body);
    if (!ok) return res.status(400).json({ error: 'Validation failed', errors });
    const updated = await prisma.$transaction(async (tx) => {
      const [lockedOrder] = await tx.$queryRaw(Prisma.sql`SELECT id FROM "Order" WHERE id = ${id} FOR UPDATE`);
      if (!lockedOrder) throw orderStatusError(404, { error: 'Order not found' });
      const existing = await tx.order.findUnique({ where: { id }, include: { items: true } });
      if (!existing) throw orderStatusError(404, { error: 'Order not found' });

      if (existing.status !== 'CANCELLED' && normalized.status === 'CANCELLED') {
        for (const item of [...existing.items].sort((a, b) => a.productId - b.productId)) {
          await tx.product.updateMany({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
        }
      } else if (existing.status === 'CANCELLED' && normalized.status !== 'CANCELLED') {
        for (const item of [...existing.items].sort((a, b) => a.productId - b.productId)) {
          const result = await tx.product.updateMany({
            where: { id: item.productId, active: true, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (result.count === 0) throw orderStatusError(400, { error: 'Stock insuficiente' });
        }
      }

      return tx.order.update({
        where: { id },
        data: { status: normalized.status },
        include: {
          items: { include: { product: { select: { id: true, title: true } } } },
          payment: true,
          customer: true,
        },
      });
    });
    res.json(mapOrderToAdminDto(updated));
  } catch (err) {
    if (err && err.status && err.body) return res.status(err.status).json(err.body);
    console.error('admin update order error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = {
  router,
  mapProductToAdminDto,
  mapAdminDtoToProductData,
  validateProductInput,
  // Categories
  slugify,
  mapCategoryToAdminDto,
  validateCategoryInput,
  // Orders
  ORDER_STATUSES,
  normalizeOrderStatus,
  isValidOrderStatus,
  mapOrderToAdminDto,
  validateOrderStatusInput,
};
