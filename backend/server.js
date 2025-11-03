const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const app = express();
const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient();
const { randomUUID } = require('crypto');

app.use(cors());
app.use(express.json());

// Ruta base de prueba
app.get('/api', (_req, res) => {
  res.json({ message: 'API ok' });
});

// Healthcheck explícito
app.get('/api/health', (_req, res) => {
  res.status(200).send('ok');
});

// Helpers
async function getOrCreateCart(cartId) {
  if (cartId) {
    let cart = await prisma.cart.findUnique({ where: { id: cartId } });
    if (!cart) {
      // Si el cliente pasó un cartId inexistente, creamos con ese id
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
    // Verificar producto
    const prod = await prisma.product.findUnique({ where: { id: pid } });
    if (!prod) return res.status(404).json({ error: 'Producto no encontrado' });

    // Agregar o incrementar
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

// Confirmar orden: crea Order + OrderItems y vacía carrito
app.post('/api/orders/confirm', async (req, res) => {
  try {
    const cartId = typeof req.query.cartId === 'string' ? req.query.cartId : undefined;
    if (!cartId) return res.status(400).json({ error: 'cartId requerido' });

    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: { include: { product: true } },
        customer: true,
      },
    });

    if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });
    if (!cart.customerId || !cart.customer)
      return res.status(400).json({ error: 'Faltan datos de checkout del cliente' });
    if (!cart.items.length)
      return res.status(400).json({ error: 'El carrito está vacío' });
    if (!cart.paymentMethod)
      return res.status(400).json({ error: 'Falta seleccionar método de pago' });

    const totalCents = cart.items.reduce((acc, it) => acc + it.quantity * it.product.priceCents, 0);

    // Generar orderNumber único sencillo
    const prefix = 'CL-';
    const rnd = Math.floor(100000 + Math.random() * 900000);
    const orderNumber = `${prefix}${rnd}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: cart.customerId,
        totalCents,
        status: 'PENDING',
        payment: {
          create: {
            method: cart.paymentMethod,
            status: 'PENDING',
          },
        },
        items: {
          create: cart.items.map((ci) => ({
            productId: ci.productId,
            quantity: ci.quantity,
            priceCents: ci.product.priceCents,
          })),
        },
      },
      include: { items: true, payment: true, customer: true },
    });

    // Vaciar carrito
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    const response = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalCents: order.totalCents,
      paymentMethod: cart.paymentMethod === 'CASH' ? 'efectivo' : 'transferencia',
      items: order.items.map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
        priceCents: it.priceCents,
        subtotalCents: it.quantity * it.priceCents,
      })),
      customer: {
        id: order.customer.id,
        nombre: order.customer.name,
        telefono: order.customer.phone,
        direccion: order.customer.address,
        localidad: order.customer.city,
        provincia: order.customer.province,
        codigoPostal: order.customer.postalCode,
      },
    };

    return res.json(response);
  } catch (err) {
    console.error('Error confirmando orden:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Checkout - guardar datos del cliente y asociar al carrito
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
    if (missing.length) {
      return res.status(400).json({ error: 'Campos requeridos faltantes', missing });
    }

    const cart = await getOrCreateCart(cartId);

    // Crea un Customer y asocia al carrito
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

    if (qty <= 0) {
      await prisma.cartItem.delete({ where: { id } });
    } else {
      await prisma.cartItem.update({ where: { id }, data: { quantity: qty } });
    }

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

// Productos - listar todos
app.get('/api/productos', async (_req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { id: 'asc' }
    });

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
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid product id' });
  }

  try {
    const p = await prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!p) return res.status(404).json({ error: 'Product not found' });

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

async function start() {
  try {
    await prisma.$connect();
    console.log('PostgreSQL: conexión exitosa');
    app.locals.prisma = prisma;
    // Forzar binding explícito a loopback IPv4 para evitar problemas de resolución en Windows
    const host = process.env.HOST || '127.0.0.1';
    const server = app.listen(PORT, host, () => {
      const addr = server.address();
      if (typeof addr === 'string') {
        console.log(`Backend listening on pipe ${addr}`);
      } else if (addr && typeof addr === 'object') {
        console.log(`Backend listening on http://${addr.address}:${addr.port}`);
      } else {
        console.log(`Backend listening on port ${PORT}`);
      }
    });
  } catch (err) {
    console.error('Error conectando a la base de datos:', err?.message || err);
    process.exit(1);
  }
}

start();

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
