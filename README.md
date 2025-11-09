# CandyLand

CandyLand es un e-commerce full stack para golosinas y snacks premium. El objetivo es mostrar en GitHub y en mi portafolio un proyecto colaborativo con un frontend veloz, un backend sólido y un pipeline de deploy moderno.

## 🚀 Por qué destaca
- Catálogo navegable con cards, filtros básicos y detalle de producto.
- Carrito persistente con actualización en tiempo real mediante Context API.
- Checkout guiado que calcula totales y habilita múltiples formas de pago.
- API REST que centraliza productos, órdenes y stock usando Express + Prisma.
- Deploy serverless en Vercel, optimizado para cargas variables y fácil de replicar.

## 🧱 Stack principal
- **Frontend:** React 18 + Vite + TypeScript, React Router y estado global en `CartContext`. Las llamadas a la API se encapsulan en `src/lib/api.ts`.
- **Backend:** Express + Prisma sobre PostgreSQL (Neon). Prisma maneja schema, migraciones y seeding.
- **Infraestructura:** Vercel para el frontend y para `/api`, proxy de Vite en desarrollo y serverless handler en `api/index.cjs`.

## 🔩 Arquitectura en breve
- SPA alojada en `src/` con componentes desacoplados (`components/`, `pages/`, `layout/`) para Home, Catálogo, Carrito y Checkout.
- Backend en `backend/` exportando `app.js` (serverless) y `server.js` (modo long-running) con prisma client compartido.
- `api/index.cjs` actúa como bridge para desplegar Express como función serverless en Vercel.
- `vercel.json` define build, rewrites y fallback SPA, por lo que el repositorio está listo para `vercel deploy`.

## 📦 Scripts útiles (raíz)
- `npm run dev` · levanta Vite con proxy automático hacia `/api`.
- `npm run build` · genera el bundle listo para producción en `dist/`.
- `npm run preview` · sirve el build de forma local.
- El `postinstall` crea Prisma Client en cuanto corrés `npm install`.

## 🛠️ Cómo correrlo localmente
1. Cloná el repo y ejecutá `npm install` en la raíz.
2. Backend (`backend/`):
   - Copiá `.env.example` a `.env` y completá `DATABASE_URL` (Neon) y `PORT` si querés algo distinto de 5050.
   - `npx prisma db push` para sincronizar el schema y `node prisma/seed.js` la primera vez para datos base.
   - `npm run dev` (o `npm --prefix backend run dev` desde la raíz) para levantar la API.
3. Frontend:
   - `npm run dev` desde la raíz y abrí `http://localhost:5173`.
   - Vite proxea `/api` al backend, así que no hay que tocar CORS en desarrollo.

## ☁️ Deploy en Vercel
- `vercel.json` ya incluye:
  - Build del frontend con Vite → `dist/`.
  - Rewrites de `/api/*` hacia `api/index.cjs`.
  - Fallback SPA a `index.html`.
- Variables recomendadas en Project Settings → Environment Variables:
  - `DATABASE_URL` (Neon) con `sslmode=require`.
  - `BANK_ALIAS`, `BANK_CBU`, `BANK_TITULAR` si activás pagos por transferencia.
- Los logs de la función `/api` viven en la pestaña **Functions** de cada deployment.

## 🤝 Trabajo colaborativo
CandyLand nació como un esfuerzo conjunto. Planeamos el alcance en tableros compartidos, hicimos pair programming en los flujos críticos (carrito y checkout) y revisiones cruzadas en cada PR para asegurar consistencia. Documenté las decisiones de arquitectura, definimos acuerdos de código y dejamos issues descriptivos para que cualquier integrante pueda continuar el trabajo sin fricción. El resultado es un proyecto que demuestra capacidad técnica y también mi forma de liderar y entregar en entornos colaborativos.

## 🗂️ Estructura rápida
```
.
├── src/                # SPA con páginas (Home, Catálogo, Carrito, Checkout) y Context del carrito
├── backend/            # Express + Prisma, expone API REST y scripts de base de datos
├── api/index.cjs       # Handler serverless que reutiliza la app de Express
├── public/             # Assets estáticos para Vite
├── vercel.json         # Configuración de build, rewrites y runtime
└── README.md
```

¿Querés ir más a fondo? Mirá `backend/README.md` para los detalles del schema y endpoints.

---

Listo para escalar nuevas features (auth, dashboards, analytics) y abierto a contribuciones. Si querés colaborar, abrí un issue o escribime por la red social que prefieras.
