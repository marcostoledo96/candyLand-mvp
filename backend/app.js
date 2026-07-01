// App Express central con todas las rutas del backend
// Este archivo exporta el app sin levantar servidor (ideal para serverless y para tests).
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const prisma = require('./prismaClient');
const { randomUUID } = require('crypto');
const { buildCorsOptions } = require('./utils/runtime');
const adminRoutes = require('./routes/admin');
const publicRoutes = require('./routes/public');
const { sendOrderConfirmationEmail } = require('./services/email');

const app = express();
// CORS allowlist from CORS_ORIGIN (comma-separated). Falls back to dev origins
// (localhost + production Vercel domain) so local curl and the deployed frontend work.
// No-origin requests (curl, health probes) are allowed regardless of origin.
app.use(cors(buildCorsOptions(process.env)));
// 20kb limit rejects oversized public form submissions at the parser boundary
// before any handler/persistence runs.
app.use(express.json({ limit: '20kb' }));
// Malformed JSON / oversized body -> 400 with a plain message, no stack trace.
// Runs before all routes so every public/admin endpoint returns a safe 400.
app.use((err, _req, res, next) => {
  if (err && (err.type === 'entity.parse.failed' || err.type === 'entity.too.large' || err.status === 400 || err.status === 413)) {
    return res.status(400).json({ error: 'Invalid request body' });
  }
  return next(err);
});

// Ruta base y health para chequeos rápidos
app.get('/api', (_req, res) => {
  res.json({ message: 'API ok' });
});
app.get('/api/health', (_req, res) => {
  res.status(200).send('ok');
});

// DB health (probar conexión real a la base de datos)
app.get('/api/db/health', async (_req, res) => {
  try {
    // consulta mínima; si falla, Prisma/DB no están accesibles
    await prisma.$queryRaw`SELECT 1`;
    const products = await prisma.product.count().catch(() => null);
    res.json({ ok: true, productsCount: products });
  } catch (err) {
    console.error('DB health check failed:', err);
    res.status(500).json({ ok: false, error: 'DB connection failed' });
  }
});

// Endpoint de diagnóstico para revisar variables de entorno y conectividad rápida
app.get('/api/env-check', async (_req, res) => {
  const dbUrl = process.env.DATABASE_URL;
  const summary = { hasDatabaseUrl: !!dbUrl, databaseUrlPreview: dbUrl ? dbUrl.slice(0, 50) + '...' : null };
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({ ok: true, prisma: 'reachable', ...summary });
  } catch (err) {
    console.error('Env check DB error:', err);
    return res.status(500).json({ ok: false, prisma: 'error', error: String(err.message || err), ...summary });
  }
});

// Helpers
async function getOrCreateCart(cartId) {
  if (cartId) {
    let cart = await prisma.cart.findUnique({ where: { id: cartId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { id: cartId } });
    }
    return cart;
  }
  const newId = randomUUID();
  const cart = await prisma.cart.create({ data: { id: newId } });
  return cart;
}

async function buildCartResponse(cartId) {
  const items = await prisma.cartItem.findMany({
    where: { cartId },
    include: { product: true },
    orderBy: { id: 'asc' },
  });

  const mapped = items.map((ci) => ({
    id: ci.id,
    productId: ci.productId,
    title: ci.product.title,
    description: ci.product.description,
    priceCents: ci.product.priceCents,
    image: ci.product.image,
    quantity: ci.quantity,
    subtotalCents: ci.quantity * ci.product.priceCents,
  }));

  const totalItems = mapped.reduce((acc, i) => acc + i.quantity, 0);
  const totalCents = mapped.reduce((acc, i) => acc + i.subtotalCents, 0);

  return { cartId, items: mapped, totalItems, totalCents };
}

// Carrito - obtener estado actual (crea si no existe)
app.get('/api/carrito', async (req, res) => {
  try {
    const cartId = typeof req.query.cartId === 'string' ? req.query.cartId : undefined;
    const cart = await getOrCreateCart(cartId);
    const payload = await buildCartResponse(cart.id);
    res.json(payload);
  } catch (err) {
    console.error('Error fetching cart:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Carrito - agregar producto
app.post('/api/carrito', async (req, res) => {
  try {
    const cartId = typeof req.query.cartId === 'string' ? req.query.cartId : undefined;
    const { productId, quantity } = req.body || {};
    const qty = Number.isInteger(quantity) && quantity > 0 ? quantity : 1;
    const pid = Number(productId);
    if (!Number.isInteger(pid) || pid <= 0) {
      return res.status(400).json({ error: 'productId inválido' });
    }

    const cart = await getOrCreateCart(cartId);
    const prod = await prisma.product.findUnique({ where: { id: pid } });
    if (!prod) return res.status(404).json({ error: 'Producto no encontrado' });
    if (prod.active === false) return res.status(404).json({ error: 'Producto no disponible' });

    const existing = await prisma.cartItem.findFirst({ where: { cartId: cart.id, productId: pid } });
    if (existing) {
      await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: existing.quantity + qty } });
    } else {
      await prisma.cartItem.create({ data: { cartId: cart.id, productId: pid, quantity: qty } });
    }

    const payload = await buildCartResponse(cart.id);
    res.json(payload);
  } catch (err) {
    console.error('Error adding to cart:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Selección de método de pago
app.post('/api/payment-method', async (req, res) => {
  try {
    const cartId = typeof req.query.cartId === 'string' ? req.query.cartId : undefined;
    const { method } = req.body || {};
    const cart = await getOrCreateCart(cartId);
    const normalized = String(method || '').toLowerCase();
    let pm;
    if (normalized === 'efectivo') pm = 'CASH';
    else if (normalized === 'transferencia') pm = 'TRANSFER';
    else return res.status(400).json({ error: 'Método inválido. Use "efectivo" o "transferencia".' });

    await prisma.cart.update({ where: { id: cart.id }, data: { paymentMethod: pm } });

    const bank = {
      alias: process.env.BANK_ALIAS || 'candyland.tienda.mp',
      cbu: process.env.BANK_CBU || '0000003100000000000000',
      titular: process.env.BANK_TITULAR || 'CandyLand',
    };

    res.json({ cartId: cart.id, method: normalized, bank: pm === 'TRANSFER' ? bank : null });
  } catch (err) {
    console.error('Error guardando método de pago:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Payment method allowlist for order confirmation (trust boundary).
// Stored cart.paymentMethod is a plain string; confirmation must re-validate.
// Accepts normalized codes (CASH/TRANSFER) and pre-normalization aliases
// (efectivo/transferencia). Everything else -> 400, no writes, no email.
const PAYMENT_ALLOWLIST = new Map([
  ['CASH', 'CASH'],
  ['EFECTIVO', 'CASH'],
  ['TRANSFER', 'TRANSFER'],
  ['TRANSFERENCIA', 'TRANSFER'],
]);

class OrderConfirmDomainError extends Error {
  constructor(status, body) {
    super(body.error || 'Order confirmation failed');
    this.status = status;
    this.body = body;
  }
}

function orderConfirmError(status, body) {
  return new OrderConfirmDomainError(status, body);
}

// Confirmar orden — single consistency boundary.
// Runs cart load, stock validation/decrement, order+payment+items creation,
// and cart cleanup inside one prisma.$transaction. Email is post-commit and
// non-blocking (never throws to the route, never runs on failed confirmation).
app.post('/api/orders/confirm', async (req, res) => {
  try {
    const cartId = typeof req.query.cartId === 'string' ? req.query.cartId : undefined;
    if (!cartId) return res.status(400).json({ error: 'cartId requerido' });

    const order = await prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({
        where: { id: cartId },
        include: { items: { include: { product: true } }, customer: true },
      });

      if (!cart) throw orderConfirmError(404, { error: 'Carrito no encontrado' });
      if (!cart.customerId || !cart.customer) throw orderConfirmError(400, { error: 'Faltan datos de checkout del cliente' });
      if (!cart.items.length) throw orderConfirmError(400, { error: 'El carrito está vacío' });
      if (!cart.paymentMethod) throw orderConfirmError(400, { error: 'Falta seleccionar método de pago' });

      // Payment allowlist (re-validate stored method at confirmation).
      const normalizedPayment = PAYMENT_ALLOWLIST.get(String(cart.paymentMethod).toUpperCase());
      if (!normalizedPayment) {
        throw orderConfirmError(400, { error: 'Método de pago inválido' });
      }

      // Reject non-positive / non-integer quantities before any stock write.
      const badQty = cart.items.find((it) => !Number.isInteger(it.quantity) || it.quantity <= 0);
      if (badQty) {
        throw orderConfirmError(400, { error: `Cantidad inválida para producto ${badQty.productId}` });
      }

      // Reject inactive products (admin soft-deleted after add-to-cart).
      const inactiveItems = cart.items.filter((it) => it.product.active === false);
      if (inactiveItems.length) {
        throw orderConfirmError(400, {
          error: 'El carrito contiene productos no disponibles',
          inactiveProducts: inactiveItems.map((it) => ({ productId: it.productId, title: it.product.title })),
        });
      }

      // Deterministic stock decrement: sort items by productId ascending.
      const sortedItems = [...cart.items].sort((a, b) => a.productId - b.productId);

      // Conditional decrement per item: only decrements if active && stock >= qty.
      // If count === 0, re-read product inside the tx to discriminate inactive vs
      // insufficient/concurrent and return the spec'd 400 payload.
      const insufficientStock = [];
      for (const it of sortedItems) {
        const result = await tx.product.updateMany({
          where: { id: it.productId, active: true, stock: { gte: it.quantity } },
          data: { stock: { decrement: it.quantity } },
        });
        if (result.count === 0) {
          const fresh = await tx.product.findUnique({ where: { id: it.productId } });
          if (fresh && fresh.active === false) {
            // Became inactive between precheck and decrement (race).
            insufficientStock.push({ productId: it.productId, title: fresh.title, requested: it.quantity, available: 0 });
          } else {
            insufficientStock.push({
              productId: it.productId,
              title: fresh ? fresh.title : it.product.title,
              requested: it.quantity,
              available: fresh ? fresh.stock : 0,
            });
          }
        }
      }
      if (insufficientStock.length) {
        throw orderConfirmError(400, { error: 'Stock insuficiente', insufficientStock });
      }

      const totalCents = cart.items.reduce((acc, it) => acc + it.quantity * it.product.priceCents, 0);
      const prefix = 'CL-';
      const rnd = Math.floor(100000 + Math.random() * 900000);
      const orderNumber = `${prefix}${rnd}`;

      const created = await tx.order.create({
        data: {
          orderNumber,
          customerId: cart.customerId,
          totalCents,
          status: 'PENDING',
          payment: { create: { method: normalizedPayment, status: 'PENDING' } },
          items: { create: cart.items.map((ci) => ({ productId: ci.productId, quantity: ci.quantity, priceCents: ci.product.priceCents })) },
        },
        include: { items: true, payment: true, customer: true },
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return { created, paymentMethod: normalizedPayment };
    });

    const { created, paymentMethod } = order;

    const response = {
      orderId: created.id,
      orderNumber: created.orderNumber,
      totalCents: created.totalCents,
      paymentMethod: paymentMethod === 'CASH' ? 'efectivo' : 'transferencia',
      items: created.items.map((it) => ({ productId: it.productId, quantity: it.quantity, priceCents: it.priceCents, subtotalCents: it.quantity * it.priceCents })),
      customer: {
        id: created.customer.id,
        nombre: created.customer.name,
        telefono: created.customer.phone,
        direccion: created.customer.address,
        localidad: created.customer.city,
        provincia: created.customer.province,
        codigoPostal: created.customer.postalCode,
      },
    };

    // Post-commit email: fire-and-forget; never blocks confirmation, never throws to the route.
    Promise.resolve()
      .then(() => sendOrderConfirmationEmail(response))
      .catch(() => {
        console.error('email: send failed (provider error swallowed)');
      });

    return res.json(response);
  } catch (err) {
    if (err instanceof OrderConfirmDomainError) {
      return res.status(err.status).json(err.body);
    }
    console.error('Error confirmando orden:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Checkout - guardar datos del cliente
app.post('/api/checkout', async (req, res) => {
  try {
    const cartId = typeof req.query.cartId === 'string' ? req.query.cartId : undefined;
    const { nombre, telefono, direccion, localidad, provincia, codigoPostal } = req.body || {};

    const missing = [];
    if (!nombre) missing.push('nombre');
    if (!telefono) missing.push('telefono');
    if (!direccion) missing.push('direccion');
    if (!localidad) missing.push('localidad');
    if (!provincia) missing.push('provincia');
    if (!codigoPostal) missing.push('codigoPostal');
    if (missing.length) return res.status(400).json({ error: 'Campos requeridos faltantes', missing });

    const cart = await getOrCreateCart(cartId);
    const customer = await prisma.customer.create({
      data: {
        name: nombre,
        phone: telefono,
        address: direccion,
        city: localidad,
        province: provincia,
        postalCode: String(codigoPostal),
      },
    });
    await prisma.cart.update({ where: { id: cart.id }, data: { customerId: customer.id } });

    return res.json({
      cartId: cart.id,
      customer: {
        id: customer.id,
        nombre: customer.name,
        telefono: customer.phone,
        direccion: customer.address,
        localidad: customer.city,
        provincia: customer.province,
        codigoPostal: customer.postalCode,
      },
      message: 'Checkout guardado correctamente',
    });
  } catch (err) {
    console.error('Error en checkout:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Carrito - modificar cantidad de item
app.put('/api/carrito/:id', async (req, res) => {
  try {
    const cartId = typeof req.query.cartId === 'string' ? req.query.cartId : undefined;
    const id = Number(req.params.id);
    const { quantity } = req.body || {};
    const qty = Number(quantity);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'id inválido' });
    if (!Number.isInteger(qty)) return res.status(400).json({ error: 'quantity inválida' });

    const item = await prisma.cartItem.findUnique({ where: { id }, include: { cart: true } });
    if (!item) return res.status(404).json({ error: 'Item no encontrado' });
    if (cartId && item.cartId !== cartId) return res.status(404).json({ error: 'Item no pertenece al carrito' });

    if (qty <= 0) await prisma.cartItem.delete({ where: { id } });
    else await prisma.cartItem.update({ where: { id }, data: { quantity: qty } });

    const payload = await buildCartResponse(item.cartId);
    res.json(payload);
  } catch (err) {
    console.error('Error updating cart item:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Carrito - eliminar item
app.delete('/api/carrito/:id', async (req, res) => {
  try {
    const cartId = typeof req.query.cartId === 'string' ? req.query.cartId : undefined;
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'id inválido' });

    const item = await prisma.cartItem.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ error: 'Item no encontrado' });
    if (cartId && item.cartId !== cartId) return res.status(404).json({ error: 'Item no pertenece al carrito' });

    await prisma.cartItem.delete({ where: { id } });
    const payload = await buildCartResponse(item.cartId);
    res.json(payload);
  } catch (err) {
    console.error('Error deleting cart item:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Productos - listar todos (solo activos en la ruta pública)
app.get('/api/productos', async (_req, res) => {
  try {
    const products = await prisma.product.findMany({ where: { active: true }, include: { category: true }, orderBy: { id: 'asc' } });
    const data = products.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      priceCents: p.priceCents,
      image: p.image,
      categoryId: p.categoryId,
      category: p.category ? p.category.name : null,
    }));
    res.json(data);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Productos - detalle por id
app.get('/api/productos/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid product id' });
  try {
    const p = await prisma.product.findUnique({ where: { id }, include: { category: true } });
    if (!p || p.active === false) return res.status(404).json({ error: 'Product not found' });
    return res.json({
      id: p.id,
      title: p.title,
      description: p.description,
      priceCents: p.priceCents,
      image: p.image,
      categoryId: p.categoryId,
      category: p.category ? p.category.name : null,
    });
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Public routes (categories listing + contact/job/franchise form submissions).
// Mounted before admin routes so no admin token is required on these paths.
app.use('/api', publicRoutes.router);

// Admin routes (login, me, products, categories, and orders CRUD).
app.use('/api', adminRoutes.router);

module.exports = app;
