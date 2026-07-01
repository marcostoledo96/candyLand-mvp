// Test helpers for order confirmation transaction tests.
// No .env reads; only a dummy DATABASE_URL is needed for `prisma generate`.
// Stdlib only — no test framework, no supertest, no real DB.
//
// makeTxStub builds a fake prisma client exposing $transaction(fn) and a
// tx-scoped surface (cart.findUnique, product.updateMany, product.findUnique,
// order.create, cartItem.deleteMany) that records call args so tests can
// assert the exact stock-decrement / order / cleanup contract.

function makeTxStub({ products = new Map(), carts = new Map(), orderFactory } = {}) {
  const calls = {
    updateMany: [],
    orderCreate: [],
    cartItemDeleteMany: [],
    productFindUnique: [],
  };

  const tx = {
    product: {
      updateMany: async (args) => {
        calls.updateMany.push(args);
        const p = products.get(args.where.id);
        if (!p) return { count: 0 };
        const activeOk = args.where.active === true ? p.active === true : true;
        const gte = args.where.stock && args.where.stock.gte;
        const stockOk = gte !== undefined ? p.stock >= gte : true;
        if (activeOk && stockOk) {
          p.stock -= args.data.stock.decrement;
          return { count: 1 };
        }
        return { count: 0 };
      },
      findUnique: async ({ where: { id } }) => {
        calls.productFindUnique.push(id);
        const p = products.get(id);
        return p ? { ...p } : null;
      },
    },
    cart: {
      findUnique: async ({ where: { id } }) => {
        const c = carts.get(id);
        if (!c) return null;
        return {
          ...c,
          items: (c.items || []).map((it) => ({ ...it, product: { ...it.product } })),
          customer: c.customer ? { ...c.customer } : null,
        };
      },
    },
    order: {
      create: async (args) => {
        calls.orderCreate.push(args);
        if (orderFactory) return orderFactory(args);
        const items = (args.data.items && args.data.items.create) || [];
        return {
          id: 1,
          orderNumber: args.data.orderNumber || 'CL-000001',
          totalCents: args.data.totalCents,
          items: items.map((i, idx) => ({ id: idx + 1, ...i })),
          payment: { method: args.data.payment.create.method, status: 'PENDING' },
          customer: customerFor(carts, args.data.customerId),
        };
      },
    },
    cartItem: {
      deleteMany: async (args) => {
        calls.cartItemDeleteMany.push(args);
        return { count: 0 };
      },
    },
  };

  const prisma = {
    $transaction: async (fn) => {
      const productSnapshot = new Map([...products.entries()].map(([id, product]) => [id, { ...product }]));
      try {
        return await fn(tx);
      } catch (err) {
        products.clear();
        for (const [id, product] of productSnapshot.entries()) products.set(id, product);
        throw err;
      }
    },
    __calls: calls,
    __tx: tx,
  };

  return { prisma, tx, calls };
}

function customerFor(carts, customerId) {
  for (const c of carts.values()) {
    if (c.customer && c.customer.id === customerId) return { ...c.customer };
  }
  return { id: customerId, name: 'Test', phone: '1', address: 'a', city: 'c', province: 'p', postalCode: '1' };
}

module.exports = { makeTxStub };
