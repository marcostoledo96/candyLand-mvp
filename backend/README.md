CandyLand Backend (Express + Prisma)

Contexto
- Esto vive dentro del monorepo principal (`/candyLand`). El frontend está en la raíz con Vite.
- Usamos PostgreSQL (Neon) en `.env` con `DATABASE_URL` y Prisma como ORM.

Cómo correrlo local
1) Variables de entorno
   - Copiá `.env.example` a `.env` y ajustá `DATABASE_URL`. Por defecto usamos Neon.
   - `PORT` (por defecto 5050) y datos bancarios para el paso de pago.

2) Dependencias y Prisma
   - `npm install`
   - `npx prisma generate`
   - Inicial: `npx prisma db push` (sin migraciones SQLite) y `node prisma/seed.js`

3) Backend dev
   - `npm run dev` (arranca en `http://127.0.0.1:5050`)
   - Health: `GET /api/health` devuelve `ok`

Notas técnicas
- El archivo `backend/app.js` exporta la app de Express sin levantar el servidor (sirve para serverless).
- `backend/server.js` sólo levanta el HTTP local y usa `app.js`.
- Prisma está instanciado como singleton en `backend/prismaClient.js` para evitar conexiones de más en serverless.

Endpoints
- GET /api  → { "message": "API ok" }
- GET /api/productos → lista todos los productos
- POST /api/carrito → agregar producto (usa query ?cartId=)
- POST /api/checkout → guarda datos del comprador
- POST /api/payment-method → método de pago
- POST /api/orders/confirm → confirma orden

Deploy en Vercel (resumen)
- En la raíz hay `vercel.json` con:
  - build de Vite → `dist/`
  - rewrites de `/api/*` a `api/index.cjs` (función serverless)
  - fallback SPA a `/index.html`
- Variables de entorno a cargar en Vercel:
  - `DATABASE_URL` (Neon, con `sslmode=require`)
  - `BANK_ALIAS`, `BANK_CBU`, `BANK_TITULAR` si usás transferencia
- El `postinstall` del `package.json` raíz corre `prisma generate` con el schema del backend.

