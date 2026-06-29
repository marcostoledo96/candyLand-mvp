# CandyLand

CandyLand es un e-commerce full stack para golosinas y snacks premium. El objetivo es mostrar en GitHub y en mi portafolio un proyecto colaborativo con un frontend veloz, un backend sólido y un pipeline de deploy moderno.

## 🚀 Por qué destaca
- Catálogo navegable con cards y filtros básicos.
- Carrito persistente con actualización en tiempo real mediante Context API.
- Checkout guiado que calcula totales y admite transferencia o efectivo.
- API REST que centraliza productos, carrito y órdenes usando Express + Prisma sobre PostgreSQL.
- Objetivo v2: infraestructura separada con frontend en Vercel, backend y base de datos en Railway.

## 🧱 Stack principal
- **Frontend:** React 19 + Vite + TypeScript, React Router y estado global en `CartContext`. Las llamadas a la API se encapsulan en `src/lib/api.ts` usando `VITE_API_URL`.
- **Backend:** Express + Prisma sobre PostgreSQL. La v2 apunta a Railway como backend long-running + PostgreSQL.
- **Infraestructura:** Vercel debe quedar como frontend-only (`dist/`). La superficie serverless `/api` todavía existe como legado mientras se completa la separación.

> Nota histórica: una versión anterior desplegaba el backend como función serverless en Vercel (`api/*`). Esa superficie está **deprecada para v2**; la API oficial debe vivir en Railway.

## 🔩 Arquitectura en breve
- SPA alojada en `src/` con componentes desacoplados (`components/`, `pages/`, `layout/`) para Home, Catálogo, Carrito y Checkout.
- Backend en `backend/` con `server.js` (modo long-running) y `app.js` (app Express exportable). Para Railway debe escuchar `process.env.PORT` en host `0.0.0.0`.
- `api/*` existe como bridge legacy y NO debe usarse como API oficial en v2; está marcado para revisión/deprecación.
- `vercel.json` se usa para el build del frontend y el fallback SPA. La rewrite `/api` todavía existe como compatibilidad legacy y está bajo revisión.

## 📦 Scripts útiles (raíz)
- `npm run lint` · pasa ESLint (regla bloqueante).
- `npm run build` · genera el bundle de producción en `dist/`.
- `npm run dev` · levanta Vite con proxy automático hacia `/api` (`http://127.0.0.1:5050`).
- `npm run preview` · sirve el build local.
- El `postinstall` crea Prisma Client al ejecutar `npm install`.

## 🛠️ Cómo correrlo localmente
1. Cloná el repo y ejecutá `npm install` en la raíz.
2. Backend (`backend/`), en una terminal aparte:
   - Copiá `.env.example` a `.env` y completá `DATABASE_URL` (PostgreSQL local o Railway) y `PORT` si querés algo distinto de 5050.
   - `npm run prisma:generate` para generar el cliente Prisma.
   - Migraciones (desarrollo): `npx prisma migrate dev` cuando estés creando cambios de schema. En producción se usa `npx prisma migrate deploy` (Railway), **no** `prisma db push`.
   - Seed manual: `npm run db:seed` (sólo si la base está vacía).
   - `npm run dev` (o `npm --prefix backend run dev` desde la raíz) para levantar la API long-running en `http://127.0.0.1:5050`.
3. Frontend, en otra terminal:
   - `npm run dev` desde la raíz y abrí `http://localhost:5173`.
   - En desarrollo, Vite proxea `/api` al backend local (`http://127.0.0.1:5050`); en producción el frontend llama a `VITE_API_URL` (Railway).

## ☁️ Deploy
- **Vercel (frontend):** ejecuta sólo `npm run build` → `dist/`. No debe correr `prisma db push`, `prisma migrate deploy` ni `seed`. La rewrite `/api` legacy se eliminará en la fase de separación Railway/Vercel.
  - Variable requerida: `VITE_API_URL` (URL pública del backend en Railway).
- **Railway (backend + PostgreSQL):** `backend/` como root directory. En la fase de separación debe escuchar `process.env.PORT` y host `0.0.0.0`.
  - Migraciones: `npx prisma migrate deploy` (manual o como pre-deploy en Railway).
  - Seed: manual y seguro (no automatizarlo en cada deploy).
- Ver `docs/DEPLOY_RAILWAY_VERCEL.md` para el checklist completo de deploy desde cero.

## 🔐 Secretos y variables de entorno
- **No se commitean secretos.** Los valores sensibles (`DATABASE_URL`, `JWT_SECRET`, `RESEND_API_KEY`, etc.) viven en:
  - Local: `backend/.env` (ignorado por git).
  - Producción: variables de entorno de Railway (backend) y Vercel (frontend).
- `backend/.env.example` contiene sólo placeholders y nombres de variables esperadas, nunca valores reales.

## 🤝 Trabajo colaborativo
CandyLand nació como un esfuerzo conjunto. Planeamos el alcance en tableros compartidos, hicimos pair programming en los flujos críticos (carrito y checkout) y revisiones cruzadas en cada PR para asegurar consistencia. Documenté las decisiones de arquitectura, definimos acuerdos de código y dejamos issues descriptivos para que cualquier integrante pueda continuar el trabajo sin fricción. El resultado es un proyecto que demuestra capacidad técnica y también mi forma de liderar y entregar en entornos colaborativos.

## 🗂️ Estructura rápida
```
.
├── src/                # SPA con páginas (Home, Catálogo, Carrito, Checkout) y Context del carrito
├── backend/            # Express + Prisma sobre PostgreSQL, API REST long-running para Railway
├── api/                # Bridge serverless legacy (deprecado para v2) — NO usar como API oficial
├── public/             # Assets estáticos para Vite
├── vercel.json         # Configuración de build frontend-only y fallback SPA
├── docs/               # Documentación de arquitectura, deploy y auditoría
└── README.md
```

¿Querés ir más a fondo? Mirá `backend/README.md` para los detalles del schema y endpoints, y `docs/DEPLOY_RAILWAY_VERCEL.md` para el deploy.

---

Listo para escalar nuevas features (auth admin, dashboards, analytics) y abierto a contribuciones. Si querés colaborar, abrí un issue o escribime por la red social que prefieras.
