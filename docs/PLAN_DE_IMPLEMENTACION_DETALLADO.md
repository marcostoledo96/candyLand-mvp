# Plan de implementación detallado — CandyLand v2

> Restricciones globales:  
> - Presupuesto de review: **800 líneas cambiadas por PR**.  
> - Sin dark mode, sin MercadoPago/tarjetas/WhatsApp, sin `/producto/:id`, imágenes por URL, menú desde API.  
> - Cada PR debe poder verificarse con `npm run lint` + `npm run build` + backend health local.

## Secuencia de branches/PRs

### PR-1 — `docs/actualiza-readme-y-env-backend`
**Objetivo:** alinear documentación y configuración local con el stack real antes de tocar código funcional.

| Cambio | Archivos estimados |
|---|---|
| Actualizar `README.md` (quitar Neon/serverless, agregar Railway/Vercel separados) | `README.md` |
| Actualizar `backend/.env.example` a PostgreSQL + variables Railway | `backend/.env.example` |
| Eliminar `backend/prisma/dev.db` del repo y agregar a `.gitignore` | `.gitignore`, borrar archivo |
| Limpiar assets duplicados en `src/assets/img` si no se usan | `src/assets/img/*` |
| Actualizar `docs/DEPLOY_RAILWAY_VERCEL.md` si es necesario | `docs/*` |

- **Líneas estimadas:** 150–300
- **Riesgo:** bajo
- **Testing manual:**
  - `npm run lint` pasa.
  - `npm run build` pasa.
  - No hay cambios de runtime; verificar que `backend/prisma/dev.db` no vuelva a aparecer con `git status`.

---

### PR-2 — `backend/railway-separacion-deploy`
**Objetivo:** dejar el backend listo para correr en Railway y Vercel solo como frontend.

| Cambio | Archivos estimados |
|---|---|
| `backend/server.js`: host `0.0.0.0`, escuchar `process.env.PORT` | `backend/server.js` |
| `backend/app.js`: CORS restringido por `CORS_ORIGIN` | `backend/app.js` |
| Deprecar `api/index.cjs` (mover a `api/index.cjs.deprecated` o eliminar) | `api/index.cjs`, `vercel.json` |
| `vercel.json`: frontend-only, sin rewrite `/api` | `vercel.json` |
| Quitar `serverless-http` de `package.json` root | `package.json` |
| Agregar `backend/.env.example` con variables Railway completas | `backend/.env.example` |

- **Líneas estimadas:** 100–250
- **Riesgo:** medio (afecta deploy actual)
- **Testing manual:**
  - `cd backend && npm run prisma:generate`
  - `cd backend && npm run dev` (con `.env` local PostgreSQL o Railway)
  - `curl http://127.0.0.1:5050/api/health` → `ok`
  - `curl http://127.0.0.1:5050/api/db/health` → `{ ok: true, ... }`
  - Verificar que `vercel.json` no reescriba `/api`.

---

### PR-3 — `backend/schema-migraciones-admin-stock`
**Objetivo:** extender el schema para soportar admin real, stock y hover de imágenes.

| Cambio | Archivos estimados |
|---|---|
| Agregar `User` al schema (admin) | `backend/prisma/schema.prisma` |
| Agregar `stock`, `active`, `hoverImage` a `Product` | `backend/prisma/schema.prisma` |
| Agregar modelo `ContactMessage` | `backend/prisma/schema.prisma` |
| Agregar modelos `JobApplication` y `FranchiseLead` | `backend/prisma/schema.prisma` |
| Generar migración Prisma | `backend/prisma/migrations/*` |
| Actualizar `seed.js` para setear `stock` y `active` | `backend/prisma/seed.js` |

- **Líneas estimadas:** 250–450
- **Riesgo:** medio (migraciones DB)
- **Testing manual:**
  - `cd backend && npx prisma migrate dev --name admin_stock_forms`
  - `cd backend && npm run seed`
  - Verificar tablas en Prisma Studio: `User`, `Product.stock`, `Product.active`, `ContactMessage`, etc.
  - `curl http://127.0.0.1:5050/api/productos` sigue funcionando.

---

### PR-4 — `backend/admin-auth-crud`
**Objetivo:** endpoints de autenticación y CRUD de admin.

| Cambio | Archivos estimados |
|---|---|
| `POST /api/admin/login` con JWT | `backend/app.js` o nuevo `backend/routes/admin.js` |
| Middleware `requireAdmin` | `backend/middleware/admin.js` |
| `GET/POST/PATCH/DELETE /api/admin/products` | `backend/routes/admin.js` |
| `GET/POST/PATCH/DELETE /api/admin/categories` | `backend/routes/admin.js` |
| `GET /api/admin/orders` + `PATCH /api/admin/orders/:id` | `backend/routes/admin.js` |
| Script/seed para crear usuario admin inicial | `backend/prisma/seed.js` |

- **Líneas estimadas:** 400–700
- **Riesgo:** alto (seguridad)
- **Testing manual:**
  - Login con credenciales de seed → recibir JWT.
  - Crear/editar producto con imagen URL.
  - Listar categorías y pedidos.
  - Verificar que endpoints admin fallan sin token.
  - `npm run lint` pasa.

**Si supera 800 líneas**, dividir en:
- PR-4a: auth + middleware + productos.
- PR-4b: categorías + pedidos.

---

### PR-5 — `backend/formularios-publicos-y-categorias`
**Objetivo:** endpoints públicos faltantes para las nuevas páginas.

| Cambio | Archivos estimados |
|---|---|
| `GET /api/categories` | `backend/app.js` o `backend/routes/public.js` |
| `POST /api/contact` | `backend/routes/public.js` |
| `POST /api/jobs/applications` | `backend/routes/public.js` |
| `POST /api/franchise/leads` | `backend/routes/public.js` |
| Validación básica de entrada | middleware/util |

- **Líneas estimadas:** 250–450
- **Riesgo:** bajo-medio
- **Testing manual:**
  - `curl http://127.0.0.1:5050/api/categories`
  - `curl -X POST -H "Content-Type: application/json" -d '{...}' http://127.0.0.1:5050/api/contact`
  - Verificar registros en Prisma Studio.
  - Probar validación con campos vacíos.

---

### PR-6 — `backend/orders-stock-emails`
**Objetivo:** validar stock al confirmar orden y enviar email sin romper el checkout.

| Cambio | Archivos estimados |
|---|---|
| Validar `stock >= quantity` en `POST /api/orders/confirm` | `backend/app.js` |
| Decrementar stock al confirmar orden | `backend/app.js` |
| Servicio de email desacoplado (`services/email.js`) | `backend/services/email.js` |
| Resend como provider, fallback noop/SMTP | `backend/services/email.js` |
| Enviar email de orden confirmada (si hay provider configurado) | `backend/app.js` |
| Email failure no falla la orden | `backend/app.js` |

- **Líneas estimadas:** 300–550
- **Riesgo:** alto (flujo de compra)
- **Testing manual:**
  - Crear carrito, checkout, seleccionar pago, confirmar orden.
  - Verificar que el stock del producto disminuye.
  - Verificar que con stock insuficiente la orden falla con 400.
  - Con `EMAIL_PROVIDER=noop`, la orden sigue funcionando.
  - Con `EMAIL_PROVIDER=resend` + API key real, llega email.

---

### PR-7 — `frontend/nuevas-rutas-macarena`
**Objetivo:** crear las páginas públicas faltantes y actualizar navegación.

| Cambio | Archivos estimados |
|---|---|
| `src/pages/Menu/MenuPage.tsx` (consume API categorías) | nuevo |
| `src/pages/Tutoriales/TutorialesPage.tsx` (tarjetas visuales) | nuevo |
| `src/pages/Franquicias/FranquiciasPage.tsx` + form | nuevo |
| `src/pages/Trabaja/TrabajaPage.tsx` + form | nuevo |
| Actualizar `src/App.tsx` con rutas | `src/App.tsx` |
| Actualizar `src/components/Header/Header.tsx` con 6 links | `src/components/Header/Header.tsx` |
| Actualizar `src/components/Footer/Footer.tsx` con `Link` reales | `src/components/Footer/Footer.tsx` |
| Funciones API en `src/lib/api.ts` para endpoints nuevos | `src/lib/api.ts` |

- **Líneas estimadas:** 500–800
- **Riesgo:** medio
- **Testing manual:**
  - Navegar todas las rutas desde header y footer.
  - `/menu` muestra categorías reales de la API.
  - `/tutoriales` muestra 6 tarjetas visuales.
  - Formularios de `/franquicias` y `/trabaja-con-nosotros` envían datos y muestran éxito/error.
  - `npm run build` pasa.
  - Mobile: menú hamburguesa funciona.

**Si supera 800 líneas**, dividir en:
- PR-7a: rutas y navegación (Header, Footer, App).
- PR-7b: páginas Menu, Tutoriales, Franquicias, Trabaja.

---

### PR-8 — `frontend/home-redesign`
**Objetivo:** alinear Home con la referencia visual.

| Cambio | Archivos estimados |
|---|---|
| Nuevo `src/components/HeroCarousel/HeroCarousel.tsx` | nuevo |
| Sección "Nuestros Productos" con carousel | `src/pages/Home/Home.tsx` |
| Sección "Nuestro Mundo Dulce" | `src/pages/Home/Home.tsx` |
| Banners destacados (2 cajas) | `src/pages/Home/Home.tsx` |
| Sección locales (decorativa) | `src/pages/Home/Home.tsx` |
| CSS Modules asociados | `src/pages/Home/*.module.css`, `src/components/HeroCarousel/*.module.css` |

- **Líneas estimadas:** 400–700
- **Riesgo:** medio
- **Testing manual:**
  - Hero carousel avanza solo y con flechas/dots.
  - Imágenes se cargan desde `public/img/`.
  - Build pasa; no hay errores de lint.
  - Mobile: carousel usable, texto legible.

---

### PR-9 — `frontend/admin-ui`
**Objetivo:** interfaz de administración.

| Cambio | Archivos estimados |
|---|---|
| `src/pages/Admin/AdminLogin.tsx` | nuevo |
| `src/pages/Admin/AdminProducts.tsx` | nuevo |
| `src/pages/Admin/AdminCategories.tsx` | nuevo |
| `src/pages/Admin/AdminOrders.tsx` | nuevo |
| Layout admin con protección de ruta | nuevo |
| Funciones API admin en `src/lib/api.ts` | `src/lib/api.ts` |
| Actualizar `src/App.tsx` con rutas `/admin/*` | `src/App.tsx` |

- **Líneas estimadas:** 600–900
- **Riesgo:** medio-alto
- **Testing manual:**
  - Login con credenciales admin.
  - CRUD de productos con imagen URL y stock.
  - CRUD de categorías.
  - Listado y cambio de estado de pedidos.
  - Sin token, las rutas `/admin/*` redirigen a `/admin/login`.
  - `npm run build` pasa.

**Si supera 800 líneas**, dividir en:
- PR-9a: login + layout + productos.
- PR-9b: categorías + pedidos.

---

### PR-10 — `frontend/checkout-fixes`
**Objetivo:** corregir inconsistencia campo `ciudad`/`localidad` y mejorar UX.

| Cambio | Archivos estimados |
|---|---|
| `AddressForm.tsx`: campo `localidad` consistente con backend | `src/pages/Checkout/AddressForm.tsx` |
| Estados loading/error en checkout | `src/pages/Checkout/*` |
| Mensajes de error claros si backend no responde | `src/pages/Checkout/*` |

- **Líneas estimadas:** 100–250
- **Riesgo:** bajo
- **Testing manual:**
  - Flujo completo de checkout localidad → pago → confirmación.
  - Verificar que el backend recibe `localidad` correctamente.
  - Probar error de red.

---

### PR-11 — `ops/deploy-railway-vercel`
**Objetivo:** configuración final de deploy y variables.

| Cambio | Archivos estimados |
|---|---|
| Confirmar `vercel.json` frontend-only | `vercel.json` |
| Confirmar `backend/server.js` host `0.0.0.0` | ya en PR-2 |
| Documentar variables de entorno en `docs/DEPLOY_RAILWAY_VERCEL.md` | `docs/*` |
| Agregar health check script opcional | `scripts/health-check.js` (opcional) |

- **Líneas estimadas:** 50–200
- **Riesgo:** bajo
- **Testing manual:**
  - Deploy backend en Railway: `/api/health` y `/api/db/health` responden.
  - Deploy frontend en Vercel: consume Railway.
  - Checkout end-to-end crea pedido.
  - Admin accede en producción.

## Dependencias entre PRs

```
PR-1 (docs)
   |
PR-2 (deploy backend) ──┬── PR-3 (schema) ──┬── PR-4 (admin) ──┐
                        │                    │                  │
                        └── PR-5 (forms) ────┘                  ├── PR-6 (orders)
                        │                                        │
                        └── PR-7 (frontend routes) ─── PR-8 (home) ─── PR-9 (admin UI)
                                                                  │
PR-10 (checkout fixes) <──────────────────────────────────────────┘
   |
PR-11 (deploy final)
```

## Criterios de división si un PR excede 800 líneas

1. Separar backend de frontend.
2. Separar schema/migraciones de lógica de negocio.
3. Separar auth de CRUD.
4. Separar páginas individuales (una página por PR si es visualmente densa).
5. Separar componentes compartidos (Header/Footer) de páginas concretas.

## Reglas que cada PR debe respetar

- No agregar dark mode.
- No agregar `/producto/:id`.
- No agregar MercadoPago, tarjetas ni WhatsApp.
- Imágenes administrables solo por URL; no upload de archivos.
- Menú (`/menu`) consume API; no hardcode permanente.
- Tutoriales solo tarjetas visuales, sin CMS.
- Backend en Railway; Vercel solo frontend.
- Producción usa `prisma migrate deploy`, no `db push`.

## Testing manual por área

| Área | Enfoque de testing manual |
|---|---|
| Backend | Health checks, DB health, CRUD admin con token, stock en checkout, emails con noop/resend. |
| Frontend | Build OK, lint OK, navegación header/footer, estados loading/error/vacío, mobile hamburguesa, flujo checkout. |
| Deploy | Railway responde health, Vercel build OK, frontend consume Railway, checkout crea pedido real. |
| DB | Migraciones aplicadas, seed idempotente, tablas de admin/forms existen. |

## Checklist del plan

```text
[ ] PRs ordenados por dependencias
[ ] Ningún PR estimado supera 800 líneas (con planes de split)
[ ] Cada PR tiene testing manual definido
[ ] Decisiones cerradas respetadas
[ ] Migraciones DB separadas de rediseño visual
[ ] Deploy Vercel/Railway separado de cambios de producto
```
