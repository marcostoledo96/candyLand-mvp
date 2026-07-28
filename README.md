# CandyLand

CandyLand es un e-commerce de golosinas y snacks premium orientado a portfolio.  
**Demo en producción:** https://candy-land-mvp.vercel.app/ (frontend con datos mock, sin backend ni base de datos).

## Por qué destaca
- Catálogo con filtros, carrito y checkout (efectivo / transferencia).
- Panel admin demo: productos, categorías y pedidos con restauración de stock al cancelar.
- Capa de datos conmutable: **mock** (default) o **API real** (`backend/` Express + Prisma).
- Deploy portfolio en Vercel en un comando; Railway queda opcional.

## Stack
- **Frontend:** React + Vite + TypeScript, React Router, `CartContext`.
- **Datos demo:** `VITE_DATA_MODE=mock` → fixtures + `localStorage` (`src/mocks/`).
- **API opcional:** Express + Prisma + PostgreSQL en `backend/` (`VITE_DATA_MODE=api` + `VITE_API_URL`).
- **Infra demo:** sólo Vercel (`dist/`). Railway es el camino opcional documentado en `docs/DEPLOY_RAILWAY_VERCEL.md`.

## Cómo correrlo (demo mock — recomendado)

```bash
npm install
cp .env.example .env   # VITE_DATA_MODE=mock por defecto
npm run dev            # http://localhost:5173
```

No hace falta PostgreSQL ni Railway.

**Admin demo:** `admin@candyland.demo` / `demo` → `/admin/login`

## Modo API real (opcional)

```bash
# Terminal 1 — backend
cd backend
cp .env.example .env   # DATABASE_URL, JWT_SECRET, etc. (sin secretos en git)
npm run prisma:generate
npx prisma migrate dev # o migrate deploy en entornos ya versionados
npm run dev            # http://127.0.0.1:5050

# Terminal 2 — frontend
# En la raíz, .env:
# VITE_DATA_MODE=api
# VITE_API_URL=http://127.0.0.1:5050
npm run dev
```

En builds de producción con `VITE_DATA_MODE=api`, `VITE_API_URL` es obligatorio.

## Scripts útiles
- `npm run dev` · Vite (mock por defecto).
- `npm run build` · bundle en `dist/`.
- `npm run lint` · ESLint.
- `npm test` · suite Node (incluye `test:demo-mock`).
- `npm run smoke:production` · GETs públicos a un API real (modo Railway).

## Deploy
- **Demo / portfolio:** Vercel → `npm run build` → `dist/`. Variable típica: `VITE_DATA_MODE=mock` (o ausente).
- **API opcional:** Railway con Root Directory `backend` y Config File `/railway.json`. Ver `docs/DEPLOY_RAILWAY_VERCEL.md`.
- Contrato mock: `docs/DEMO_MOCK.md`. Decisiones: `docs/DECISIONES_CERRADAS.md`.

## Secretos
No se commitean `.env`. Ejemplos: `.env.example` (frontend) y `backend/.env.example`.

## Estructura rápida
```
.
├── src/           # SPA + lib API/admin
├── src/mocks/     # Fixtures y store demo
├── backend/       # Express + Prisma (modo API opcional)
├── docs/          # DEMO_MOCK, decisiones, deploy Railway
├── openspec/      # Change abierta 2026-06-candyland-v2
└── vercel.json    # Frontend-only
```

## Trabajo colaborativo
CandyLand combina alcance de e-commerce, admin y documentación SDD/OpenSpec para que el proyecto sea reproducible en portfolio y en equipo.
