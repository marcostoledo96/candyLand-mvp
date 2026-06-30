# Design — CandyLand v2 Railway/Admin/UI

## Architecture

```text
Browser
  ↓
Vercel Frontend React/Vite
  ↓ VITE_API_URL
Railway Backend Express
  ↓ Prisma
Railway PostgreSQL
```

## Frontend boundaries

- `src/pages`: pantallas públicas/admin.
- `src/components`: UI reutilizable.
- `src/lib/api.ts`: cliente API.
- `src/context`: carrito/auth si ya existe o se agrega.
- `public/img/candyland`: assets estáticos.

## Backend boundaries

- `backend/app.js`: Express app.
- `backend/server.js`: listener Railway.
- `backend/prisma`: schema, migrations, seed.
- Servicios recomendados:
  - products service;
  - categories service;
  - orders service;
  - email service;
  - auth service.

No reestructurar toda la carpeta si el proyecto actual es simple. Priorizar cambios incrementales.

## Email architecture

```text
orderController
  → orderService.createOrder()
  → emailService.sendOrderNotification()
       → resendProvider | smtpProvider | noopProvider
```

El pedido se confirma antes del email. El email no debe bloquear la respuesta.

## Admin auth

MVP recomendado:

- JWT (HS256 vía Node crypto, sin dependencia externa).
- password hashing con scrypt (Node crypto), sin bcrypt.
- usuario admin seed.
- rutas protegidas.

## Data flow catálogo

```text
Admin crea producto con imageUrl
  → PostgreSQL Product
  → GET /api/productos
  → CatalogPage
  → ProductCard
```

## Data flow menú

```text
Category/Product activos
  → GET /api/categories o /api/menu
  → MenuPage
```
