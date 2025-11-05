# CandyLand

Proyecto e-commerce con React (Vite) + Express + Prisma.

## Qué hay acá (en criollo)
- Frontend Vite en la raíz: SPA con routing y componentes.
- Backend en `backend/`: Express + Prisma contra Postgres (Neon).
- Proxy de Vite manda `/api` al backend en dev.
- Config listo para deploy a Vercel (frontend + serverless para `/api`).

## Scripts útiles (raíz)
- `npm run dev`: Vite en modo dev.
- `npm run build`: build de producción (sale a `dist/`).
- `npm run preview`: sirve el build para probarlo localmente.
- Postinstall genera Prisma Client: se corre solo en `npm install`.

## Cómo correr local
1) Backend (mirá `backend/README.md`)
	 - Ajustá `.env` (PORT=5050, `DATABASE_URL` de Neon).
	 - `npx prisma db push` y `node prisma/seed.js` la primera vez.
	 - `npm --prefix backend run dev` arranca el backend.
2) Frontend
	 - `npm run dev` y abrir `http://localhost:5173` (o 5174).

## Deploy a Vercel
- `vercel.json` ya está configurado:
	- Build del frontend con Vite → `dist/`.
	- Rewrites de `/api/*` → `api/index.cjs` (nuestra app Express como serverless).
	- Fallback SPA → `index.html`.
- Variables de entorno en el panel de Vercel (Project Settings → Environment Variables):
	- `DATABASE_URL` (Neon) con `sslmode=require`.
	- `BANK_ALIAS`, `BANK_CBU`, `BANK_TITULAR` si se usa transferencia.
- Logs de serverless /api en la pestaña “Functions” del deployment.

## Estructura rápida
- `src/`: componentes, páginas y lógica de frontend.
- `backend/`: Express + Prisma, exporta `app.js` para serverless y `server.js` para local.
- `api/index.cjs`: función serverless que envuelve la app de Express.
- `vercel.json`: routing y build en Vercel.
