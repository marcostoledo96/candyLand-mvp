# backend/AGENTS.md — Backend CandyLand

## Objetivo

Backend Node.js + Express + Prisma + PostgreSQL en Railway.

## Reglas obligatorias

- Railway usa `backend/` como root directory.
- App long-running, no serverless.
- `server.js` debe escuchar `process.env.PORT || 5050` y host `0.0.0.0`.
- Base: PostgreSQL Railway exclusivamente.
- ORM: Prisma.
- Producción: `npx prisma migrate deploy`.
- No usar `prisma db push` en producción.
- Seed manual.
- CORS por variable `CORS_ORIGIN`.
- No commitear `.env`.

## Variables esperadas

```env
NODE_ENV=production
PORT=5050
DATABASE_URL=postgresql://...
CORS_ORIGIN=https://candy-land-mvp.vercel.app,http://localhost:5173
JWT_SECRET=...
BANK_ALIAS=...
BANK_CBU=...
BANK_TITULAR=...
EMAIL_PROVIDER=resend
RESEND_API_KEY=...
MAIL_FROM=...
MAIL_TO=...
```

## Endpoints públicos mínimos

```http
GET  /api/health
GET  /api/db/health
GET  /api/productos
GET  /api/categories
POST /api/carrito
POST /api/checkout
POST /api/orders/confirm
POST /api/contact
POST /api/jobs/applications
POST /api/franchise/leads
```

## Endpoints admin mínimos

```http
POST   /api/admin/login
GET    /api/admin/me
GET    /api/admin/products
POST   /api/admin/products
PATCH  /api/admin/products/:id
DELETE /api/admin/products/:id
GET    /api/admin/categories
POST   /api/admin/categories
PATCH  /api/admin/categories/:id
DELETE /api/admin/categories/:id
GET    /api/admin/orders
PATCH  /api/admin/orders/:id
```

## Pedidos y stock

- Validar stock antes de confirmar pedido.
- Guardar pedidos aunque el pago sea manual.
- Métodos: transferencia o efectivo.
- No WhatsApp.
- No Mercado Pago.
- No tarjetas.

## Emails

- Implementar servicio desacoplado.
- Provider recomendado: Resend.
- Fallback: SMTP/Nodemailer o noop.
- Si falla el email, el pedido no debe fallar.

## Seguridad mínima

- Validar entrada.
- No devolver stack traces.
- No exponer endpoints admin sin JWT.
- No guardar secretos en logs.
