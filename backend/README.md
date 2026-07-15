# CandyLand Backend (Express + Prisma)

Backend long-running de CandyLand. Vive dentro del monorepo principal (`/candyLand-mvp`); el frontend está en la raíz con Vite.

## Stack
- Node.js + Express + Prisma.
- PostgreSQL (Railway en producción, PostgreSQL local en desarrollo).
- App **long-running**: debe escuchar `process.env.PORT` (default `5050`) en host `0.0.0.0` para Railway. No es serverless.

> Nota histórica: una versión anterior desplegaba este backend como función serverless en Vercel usando `api/index.cjs`. Esa vía está **deprecada**; la API oficial vive en Railway.

## Variables de entorno
Copiá `.env.example` a `.env` y completá los valores. Nunca commitees `.env`.

Variables esperadas (ver `backend/AGENTS.md` y `docs/DEPLOY_RAILWAY_VERCEL.md` para el detalle):

`NODE_ENV`, `PORT`, `HOST`, `DATABASE_URL`, `CORS_ORIGIN`, `JWT_SECRET`, `BANK_ALIAS`, `BANK_CBU`, `BANK_TITULAR`, `EMAIL_PROVIDER`, `RESEND_API_KEY`, `MAIL_FROM`, and `MAIL_TO` are the supported variable names. Values belong only in the provider or local ignored environment file.

## Cómo correrlo local
1. `npm install`
2. `npm run prisma:generate` (genera el cliente Prisma)
3. Migraciones:
   - Base nueva/desarrollo: `npx prisma migrate dev` para crear/aplicar migraciones antes del seed.
   - Producción (Railway): `npx prisma migrate deploy`. **No** uses `prisma db push` en producción.
4. Seed (manual, sólo si la base está vacía): `npm run db:seed`
5. `npm run dev` → arranca en `http://127.0.0.1:5050`

> Corré el backend en una terminal dedicada. El frontend se levanta aparte desde la raíz con `npm run dev`.

## Health checks
- `GET /api/health` → `ok`
- `GET /api/db/health` → estado de la conexión PostgreSQL

## Endpoints públicos esperados para v2
- `GET /api/productos`
- `GET /api/categories`
- `POST /api/carrito`
- `POST /api/checkout`
- `POST /api/orders/confirm`
- `POST /api/contact`
- `POST /api/jobs/applications`
- `POST /api/franchise/leads`

Algunos endpoints de esta lista son objetivo v2 y todavía pueden no existir en el código actual. Ver `backend/AGENTS.md` para la lista completa (incluye endpoints admin protegidos por JWT).

## Notas técnicas
- `backend/app.js` exporta la app de Express sin levantar el servidor (útil para tests/import).
- `backend/server.js` levanta el HTTP local/producción y usa `app.js`.
- Prisma es un singleton en `backend/prismaClient.js` para reutilizar la conexión.
- CORS debe controlarse con `CORS_ORIGIN` (lista de orígenes separados por coma) en la fase de separación Railway/Vercel.
- No exponer stack traces al cliente.
- Métodos de pago: transferencia o efectivo. No Mercado Pago, no tarjetas.

## Deploy (Railway)
- Root Directory: `backend`.
- Config File: root `/railway.json` (an approved Railway dashboard setting; the path is absolute and does not follow Root Directory).
- Build: `npm ci --include=dev && npm run prisma:generate`.
- Pre-deploy: `npx prisma migrate deploy`; it must complete before `npm start` can promote the new server.
- Start: `npm start`; health check: `GET /api/health`.
- Do not run `prisma db push` or seed during build/start. Migration, seed, provider settings, and rollback execution require separate production authorization.

Ver `docs/DEPLOY_RAILWAY_VERCEL.md` para el checklist completo.
