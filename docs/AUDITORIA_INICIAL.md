# Auditoría inicial — CandyLand v2

> **Historical snapshot.** This audit records the repository state on 2026-06-29. It is not rewritten as current-state documentation; use `DEPLOY_RAILWAY_VERCEL.md` and the Production Deploy QA OpenSpec slice for the current deployment contract.

> Fecha: 2026-06-29  
> Rama: `docs/auditoria-inicial-candyland-v2`  
> Alcance: frontend, backend, API, Prisma, deploy, documentación.

## 1. Resumen ejecutivo

El MVP tiene un frontend funcional (Home, Catálogo, Carrito, Checkout, Contacto) y un backend Express con endpoints básicos de productos, carrito y órdenes. Sin embargo, hay **diferencias importantes** respecto a las decisiones cerradas de v2:

- El backend todavía no tiene endpoints de admin, categorías, contacto, empleos ni franquicias.
- El schema de Prisma no tiene `stock`, `active` ni `hoverImage` en `Product`.
- El frontend no tiene las rutas `/menu`, `/tutoriales`, `/franquicias`, `/trabaja-con-nosotros` ni el admin.
- La configuración de deploy todavía asume serverless en Vercel (`api/index.cjs`, rewrite `/api` en `vercel.json`).
- El `README.md` y `backend/.env.example` mencionan Neon/SQLite y desactualizan el stack real.
- Ningún formulario de contacto/trabajo/franquicia envía datos reales al backend.

No hay bloqueadores técnicos graves; el principal riesgo es **mezclar migraciones DB + rediseño visual + separación de deploy en un solo cambio grande**.

## 2. Frontend

### 2.1 Estado actual

| Área | Estado | Evidencia |
|---|---|---|
| Framework | React 19 + Vite + TypeScript | `package.json` |
| Router | React Router 7 | `src/App.tsx` |
| Build | `npm run build` | script disponible |
| Lint | `npm run lint` | `eslint.config.js` |
| Rutas públicas | Parcial | `/`, `/catalogo`, `/contacto`, `/carrito`, checkout |
| Rutas faltantes | 4 páginas | `/menu`, `/tutoriales`, `/franquicias`, `/trabaja-con-nosotros` |
| Admin | Inexistente | No hay carpeta `src/admin` ni rutas `/admin/*` |
| Header | Parcial | Solo 4 links; faltan tutoriales, menú, franquicias, trabajá |
| Footer | Parcial | Links son anchors `#`; no usan `Link` de React Router |
| Home | Parcial | Falta hero carousel, secciones de referencia |
| Contacto | Falso | `Contacto.tsx` hace `console.log` + `alert`; no llama a API |
| Estados de carga/error/vacío | Parcial | Catálogo tiene loading; otros no verificados |
| Imágenes | OK | Assets en `public/img/` con versiones WebP |
| Dark mode | No aplica | Modo claro único, respetado |

### 2.2 Problemas detectados

1. **`src/pages/Home/Home.tsx`** usa imágenes hardcodeadas en lugar de consumir la API de productos/destacados.
2. **`src/pages/Catalog/CatalogPage.tsx`** tiene una función `fixByTitleLocal` que mapea imágenes por título: es deuda técnica; debería venir de la API.
3. **`src/components/Footer/Footer.tsx`** no usa `Link` de React Router; los links no navegan.
4. **`src/components/Contact/Contacto.tsx`** no conecta al backend.
5. **No existe página de error 404** ni ruta catch-all.

## 3. Backend

### 3.1 Estado actual

| Área | Estado | Evidencia |
|---|---|---|
| Framework | Express 4 | `backend/app.js` |
| Servidor | Long-running + serverless bridge | `backend/server.js` + `api/index.cjs` |
| Health checks | Existen | `GET /api/health`, `GET /api/db/health` |
| Productos | CRUD parcial | `GET /api/productos`, `GET /api/productos/:id` |
| Categorías | Inexistente | No hay `GET /api/categories` |
| Carrito | Existe | `GET/POST/PUT/DELETE /api/carrito` |
| Checkout | Existe | `POST /api/checkout`, `POST /api/payment-method`, `POST /api/orders/confirm` |
| Admin | Inexistente | No hay endpoints `/api/admin/*` |
| Contacto | Inexistente | No hay `POST /api/contact` |
| Empleos | Inexistente | No hay `POST /api/jobs/applications` |
| Franquicias | Inexistente | No hay `POST /api/franchise/leads` |
| Emails | Inexistente | No hay servicio de email |
| CORS | Hardcodeado abierto | `app.use(cors())` sin origen controlado |

### 3.2 Endpoints implementados vs. requeridos

| Endpoint | Implementado | Requerido por | Notas |
|---|---|---|---|
| `GET /api/health` | Sí | `backend/AGENTS.md` | `text/plain` "ok" |
| `GET /api/db/health` | Sí | `backend/AGENTS.md` | Devuelve `productsCount` |
| `GET /api/productos` | Sí | `backend/AGENTS.md` | Sin paginación |
| `GET /api/productos/:id` | Sí | — | No debe exponerse como `/producto/:id` público |
| `GET /api/categories` | No | `backend/AGENTS.md` | Necesario para `/menu` |
| `POST /api/carrito` | Sí | — | Funcional |
| `POST /api/checkout` | Sí | — | Guarda customer con el contrato canónico `localidad`; checkout frontend ya envía los seis campos normalizados |
| `POST /api/payment-method` | Sí | — | Soporta transferencia/efectivo |
| `POST /api/orders/confirm` | Sí | — | No valida stock; no envía email |
| `POST /api/contact` | No | `backend/AGENTS.md` | Necesario para `/contacto` real |
| `POST /api/jobs/applications` | No | `backend/AGENTS.md` | Necesario para `/trabaja-con-nosotros` |
| `POST /api/franchise/leads` | No | `backend/AGENTS.md` | Necesario para `/franquicias` |
| Admin endpoints | No | `openspec/specs/admin-productos` | Productos, categorías, pedidos, login |

### 3.3 Problemas detectados

1. **CORS abierto**: `app.use(cors())` no restringe por `CORS_ORIGIN`.
2. **No valida stock** al confirmar orden.
3. **No hay servicio de email** ni fallback noop.
4. **`/api/productos/:id`** existe pero no debe usarse para una página pública de detalle (decisión cerrada #16).
5. **`backend/server.js`** escucha en `127.0.0.1` por defecto; Railway requiere `0.0.0.0`.
6. **No hay manejo centralizado de errores** ni rate limiting mínimo en formularios públicos.

## 4. API y contratos

### 4.1 Contratos actuales

| Recurso | Request | Response | Notas |
|---|---|---|---|
| Productos | `GET /api/productos` | `{ id, title, description, priceCents, image, categoryId, category }[]` | Campo `image` puede ser ruta local o URL. |
| Carrito | `GET /api/carrito?cartId=...` | `{ cartId, items[], totalItems, totalCents }` | Items incluyen producto desnormalizado. |
| Checkout | `POST /api/checkout` | `{ cartId, customer: {...} }` | Contrato canónico: frontend normaliza y envía `localidad`; confirmación conserva estado ante resultados no concluyentes. |
| Pago | `POST /api/payment-method` | `{ cartId, method, bank }` | `bank` solo para transferencia. |
| Orden | `POST /api/orders/confirm` | `{ orderId, orderNumber, totalCents, ... }` | No email, no stock. |

### 4.2 Contratos faltantes

- `GET /api/categories` → listado de categorías.
- `POST /api/contact` → `{ nombre, email, asunto, mensaje }`.
- `POST /api/jobs/applications` → `{ nombre, apellido, email, telefono, puesto, sucursal, mensaje }`.
- `POST /api/franchise/leads` → `{ nombre, apellido, email, telefono, zona, origen }`.
- Admin JWT login y CRUD de productos/categorías/pedidos.

## 5. Prisma / base de datos

### 5.1 Schema actual

| Modelo | Campos | Observaciones |
|---|---|---|
| `Category` | `id`, `name` | Relación con `Product`. |
| `Product` | `id`, `title`, `description`, `priceCents`, `image`, `categoryId` | **Faltan**: `stock`, `active`, `hoverImage`. |
| `Cart` | `id`, `customerId`, `paymentMethod` | OK. |
| `CartItem` | `id`, `cartId`, `productId`, `quantity` | OK. |
| `Customer` | `id`, `name`, `phone`, `address`, `city`, `province`, `postalCode` | Campo `city` no se usa en frontend actual. |
| `Order` | `id`, `orderNumber`, `customerId`, `totalCents`, `status` | Relación `Payment`. |
| `OrderItem` | `id`, `orderId`, `productId`, `quantity`, `priceCents` | OK. |
| `Payment` | `id`, `orderId`, `method`, `status`, `reference` | OK. |
| Admin/User | No existe | Necesario para login admin. |

### 5.2 Problemas detectados

1. **`backend/prisma/dev.db` existe**: es SQLite. Debe eliminarse de Git y asegurar que no se use.
2. **`backend/.env.example`** dice `DATABASE_URL="file:./dev.db"`, contradictorio con PostgreSQL.
3. **No hay migraciones para `stock`, `active`, `hoverImage`, `User`**.
4. **El seed no setea `stock` ni `active`** porque no existen.
5. **`priceCents` se guarda como entero**, correcto para dinero; frontend convierte a pesos.

## 6. Vercel / Railway / Deploy

### 6.1 Estado actual

| Elemento | Estado | Evidencia |
|---|---|---|
| `vercel.json` | Serverless legacy | rewrite `/api/(.*)` → `/api/index` |
| `api/*` | Existe | Varios entrypoints serverless (`index.cjs`, `index.js`, `[...path].cjs`, `[...path].js`, `ping.js`) que mantienen backend bajo Vercel `/api` |
| `postinstall` root | Genera Prisma client | `package.json` |
| Scripts root con db push/seed | Existen | `db:migrate:deploy`, `db:seed`, `db:reset` |
| Backend package.json | OK | `start`, `dev`, `prisma:generate`, `seed` |
| `backend/server.js` | Necesita ajuste | host `127.0.0.1` por defecto |
| `.vercelignore` | Existe | ignora `node_modules`, `.env` |

### 6.2 Qué deprecar para separar Vercel ↔ Railway

| Elemento | Acción | Justificación |
|---|---|---|
| `api/*` serverless | Deprecar/eliminar después de confirmar Railway, o documentar explícitamente cualquier handler legacy que quede | Vercel no debe correr backend. |
| `vercel.json` rewrite `/api/(.*)` | Eliminar | Frontend llamará directo a `VITE_API_URL`. |
| `serverless-http` dependency root | Eliminar | Solo era para `api/index.cjs`. |
| `DATABASE_URL` en Vercel | No configurar | Vercel solo compila frontend. |
| `VITE_API_URL` en Vercel | Configurar | Apunta a Railway. |
| `db:reset` root | No correr en prod | Borra datos. |
| `backend/prisma/dev.db` | Eliminar de repo | Es SQLite. |
| `backend/.env.example` SQLite | Actualizar a PostgreSQL | Evita confusión. |

### 6.3 Configuración recomendada

```json
// vercel.json frontend-only
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/((?!assets/|img/).*)", "destination": "/index.html" }
  ]
}
```

```env
# Variables Railway backend
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
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

```env
# Variables Vercel frontend
VITE_API_URL=https://<backend>.up.railway.app
```

## 7. Scripts y herramientas

| Script | Ubicación | Estado | Notas |
|---|---|---|---|
| `npm run dev` | root | OK | Vite con proxy `/api`. |
| `npm run build` | root | OK | Build de frontend. |
| `npm run lint` | root | OK | ESLint. |
| `npm run images:webp` | root | OK | Convierte imágenes a WebP con `sharp`. |
| `npm run postinstall` | root | OK | Genera Prisma client; no necesita DB. |
| `npm run db:migrate:deploy` | root | Peligroso si se corre en Vercel | Mover a backend/Railway. |
| `npm start` | backend | OK | `node server.js`. |
| `npm run dev` | backend | OK | `nodemon server.js`. |
| `npm run seed` | backend | OK | Manual. |

## 8. Documentación

| Documento | Estado | Notas |
|---|---|---|
| `AGENTS.md` (root) | Actualizado | Decisiones cerradas claras. |
| `docs/DECISIONES_CERRADAS.md` | Actualizado | 25 decisiones cerradas. |
| `docs/DEPLOY_RAILWAY_VERCEL.md` | Actualizado | Buena guía de deploy. |
| `docs/CODEGRAPH_INIT.md` | Actualizado | Indica inicializar CodeGraph. |
| `docs/ENGRAM_GUIDE.md` | Actualizado | Guía de memoria. |
| `README.md` | **Desactualizado** | Menciona Neon, serverless, `/api/index.cjs`. Requiere actualización. |
| `backend/README.md` | **Desactualizado** | Menciona Neon, `prisma db push` y Vercel serverless. |
| `backend/.env.example` | **Desactualizado** | SQLite en lugar de PostgreSQL. |
| `src/AGENTS.md` | Actualizado | Rutas obligatorias claras. |
| `openspec/specs/*` | Actualizados | 4 specs alineadas. |

## 9. Riesgos y bloqueadores

### Riesgos

| # | Riesgo | Impacto | Mitigación |
|---|---|---|---|
| 1 | Mezclar migraciones DB + rediseño visual + deploy en un solo PR | Alto | Dividir en slices por fase (ver plan de implementación). |
| 2 | `backend/server.js` escucha `127.0.0.1` en Railway y no acepta conexiones externas | Alto | Cambiar host a `0.0.0.0`. |
| 3 | CORS abierto permite cualquier origen | Medio | Configurar `CORS_ORIGIN`. |
| 4 | Schema actual no soporta admin ni stock real | Medio | Migraciones adicionales necesarias. |
| 5 | Formularios de contacto/trabajo/franquicia son falsos | Medio | Conectar a backend; validar entrada. |
| 6 | `README.md` desactualizado genera confusión en reviewers | Bajo | Actualizar en PR de documentación inicial. |
| 7 | Assets duplicados en `src/assets/img` y `public/img` | Bajo | Limpiar `src/assets/img` si no se usan. |

### Bloqueadores actuales

Ningún bloqueador técnico grave. El único requisito previo para cualquier trabajo de backend es:

- Tener acceso al proyecto Railway y la base PostgreSQL para aplicar migraciones.

## 10. Checklist de salida de la auditoría

```text
[ ] Se documentó el mapa de referencia (MAPA_REFERENCIA.md)
[ ] Se documentó la auditoría inicial (AUDITORIA_INICIAL.md)
[ ] Se documentó el plan de implementación (PLAN_DE_IMPLEMENTACION_DETALLADO.md)
[ ] Se identificaron elementos a deprecar para separación Vercel/Railway
[ ] Se identificaron endpoints faltantes
[ ] Se identificaron campos faltantes en Prisma
[ ] Se identificó README y .env.example desactualizados
[ ] Se guardó memoria en Engram
```
