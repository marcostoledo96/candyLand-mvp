# Planificación CandyLand MVP v2 — React + Node + PostgreSQL + Railway

**Fecha:** 2026-06-29  
**Proyecto principal:** `marcostoledo96/candyLand-mvp`  
**Proyecto de referencia visual/assets:** `macarenadaianaleiva/tienda-candyland`  
**Deploy actual:** `https://candy-land-mvp.vercel.app/`  
**Marca final:** `CandyLand`  
**Modo visual:** sólo modo claro

## 1. Contexto de trabajo local

Repo principal donde Marcos va a trabajar con OpenCode:

```bash
/home/marcos/Escritorio/CandyLand/CandyLand/candyLand-mvp
```

Repo de referencia visual, pantallas e imágenes:

```bash
/home/marcos/Escritorio/CandyLand/CandyLand_Macarena/tienda-candyland
```

Regla principal: el proyecto final se implementa siempre en **React**, combinando lo mejor del MVP actual y del proyecto de Macarena. El proyecto de Macarena se usa como referencia visual, fuente de pantallas faltantes y fuente de assets, pero no se copia HTML/CSS/JS viejo sin adaptarlo a React.

---

## 2. Decisiones cerradas

| Tema | Decisión |
|---|---|
| ORM | Mantener Prisma. |
| Backend | Node.js + Express dentro de la misma repo, usando `backend/` como root de Railway. |
| Base de datos | PostgreSQL exclusivamente en Railway. Neon queda deprecado. |
| Seed | Manual/controlado, no automático en cada deploy. |
| Admin productos | Sí, crear panel admin para productos, precios, stock, categorías e imágenes. |
| Imágenes de productos | Se cargan mediante URL. No hay upload de archivos en esta etapa. |
| Stock | Real, persistido y descontado/validado en backend. |
| Pedidos | Guardar pedidos en PostgreSQL aunque el pago sea manual. |
| Emails | Sí. Implementar de forma simple y desacoplada. Recomendado: Resend si hay dominio verificado; fallback SMTP/Nodemailer si se busca demo rápida. |
| WhatsApp | No enviar pedidos por WhatsApp. |
| Pagos | Transferencia o efectivo. No Mercado Pago ni tarjeta en esta etapa. |
| Rutas | Mantener la ruta actual de catálogo y agregar las rutas faltantes de Macarena. Recomendado: `/catalogo` canónica + aliases opcionales `/tienda` y `/nuestros-dulces`. |
| Diseño | Combinar lo mejor de ambos proyectos, siempre React. |
| Páginas obligatorias | Todas: Contacto, Tutoriales, Menú, Franquicias, Trabajá con nosotros, Home, Catálogo, Carrito, Checkout, Admin. |
| Nuestro menú | Debe salir de la API, no ser hardcodeado definitivo. |
| Tutoriales | Sólo tarjetas visuales para portfolio. |
| Detalle de producto | No crear `/producto/:id` por ahora. |
| Marca | Usar CandyLand en todos los textos. |
| Logo | Revisar si hay logo útil en el proyecto de Macarena; si existe, adaptarlo. Si no, mantener logo/texto actual de CandyLand. |
| Assets Macarena | Se pueden usar en deploy público. |
| Deploy frontend | Vercel. |
| Deploy backend | Railway. |
| Dominio CORS | `https://candy-land-mvp.vercel.app/` y localhost en desarrollo. |
| Dominio propio | No por ahora; usar el dominio anterior de Vercel. |
| Railway auto-deploy | Sí, desde `main`. |
| Vercel previews | Sí, previews por branch. |
| Documentación deploy | Sí, dejar paso a paso reproducible. |

---

## 3. Objetivo de la versión v2

La versión v2 debe transformar CandyLand de un MVP e-commerce funcional a un proyecto más completo para portfolio, con mejor experiencia visual, pantallas institucionales, panel admin y backend más profesional.

Objetivos principales:

1. Separar responsabilidades: frontend en Vercel, backend en Railway, base PostgreSQL en Railway.
2. Quitar dependencia de Neon y de `/api` serverless en Vercel.
3. Mantener React + Vite + TypeScript como frontend.
4. Mantener Node.js + Express + Prisma como backend.
5. Agregar rutas y pantallas del proyecto de Macarena.
6. Crear admin real para productos, categorías, stock e imágenes por URL.
7. Guardar pedidos reales en PostgreSQL.
8. Enviar email al crear pedido, sin bloquear la compra si el email falla.
9. Dejar documentación `AGENTS.md`, OpenSpec, Engram y CodeGraph para que OpenCode trabaje con menos pérdida de contexto.

---

## 4. Orden recomendado de ejecución

### Fase 0 — Preparación de IA, documentación y grafo

Antes de tocar código:

```bash
cd /home/marcos/Escritorio/CandyLand/CandyLand/candyLand-mvp

git checkout main
git pull
git checkout -b feature/candyland-v2-railway-admin-ui

# Inicializar CodeGraph del proyecto principal
codegraph init
codegraph status
```

También conviene indexar la referencia:

```bash
cd /home/marcos/Escritorio/CandyLand/CandyLand_Macarena/tienda-candyland
codegraph init
codegraph status
```

Agregar `.codegraph/` al `.gitignore` si no está:

```gitignore
.codegraph/
```

Copiar a la repo principal los documentos de este pack:

```bash
cp AGENTS.md /home/marcos/Escritorio/CandyLand/CandyLand/candyLand-mvp/AGENTS.md
cp -r docs /home/marcos/Escritorio/CandyLand/CandyLand/candyLand-mvp/docs
cp -r openspec /home/marcos/Escritorio/CandyLand/CandyLand/candyLand-mvp/openspec
```

Criterio de listo:

- Rama creada.
- CodeGraph inicializado en MVP y referencia.
- AGENTS.md copiado.
- OpenSpec copiado.
- Documentación base copiada.

---

### Fase 1 — Auditoría inicial con OpenCode

Objetivo: que OpenCode entienda el proyecto sin empezar a modificar código.

Pedirle a OpenCode:

```text
Trabajá en:
/home/marcos/Escritorio/CandyLand/CandyLand/candyLand-mvp

Usá como referencia:
/home/marcos/Escritorio/CandyLand/CandyLand_Macarena/tienda-candyland

Primero no modifiques código. Leé AGENTS.md, docs/DECISIONES_CERRADAS.md, openspec/config.yaml y usá CodeGraph para explorar estructura.

Tareas:
1. Generá docs/MAPA_REFERENCIA.md con pantallas, rutas, assets y estilos de tienda-candyland que faltan en candyLand-mvp.
2. Generá docs/AUDITORIA_INICIAL.md con estado real del frontend, backend, API, Prisma, Vercel y scripts.
3. Identificá qué hay que eliminar de Vercel serverless para mover backend a Railway.
4. No hagas cambios de implementación todavía.
```

Criterio de listo:

- Existe `docs/MAPA_REFERENCIA.md`.
- Existe `docs/AUDITORIA_INICIAL.md`.
- Quedan claras las pantallas faltantes y los assets de Macarena.

---

### Fase 2 — Backend Railway + PostgreSQL exclusivo

Objetivo: backend long-running en Railway y base PostgreSQL Railway.

Tareas:

1. Mantener `backend/` como servicio Railway.
2. Confirmar `backend/package.json` con scripts:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "prisma:generate": "prisma generate",
    "migrate:deploy": "prisma migrate deploy",
    "seed": "node prisma/seed.js"
  }
}
```

3. Confirmar `server.js`:

```js
const app = require('./app');

const port = process.env.PORT || 5050;

app.listen(port, '0.0.0.0', () => {
  console.log(`CandyLand API running on port ${port}`);
});
```

4. Prisma debe usar PostgreSQL:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

5. Producción usa:

```bash
npx prisma migrate deploy
```

No usar `prisma db push` en producción.

6. Seed sólo manual:

```bash
npm run seed
```

7. Variables Railway backend:

```env
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
CORS_ORIGIN=https://candy-land-mvp.vercel.app,http://localhost:5173
BANK_ALIAS=...
BANK_CBU=...
BANK_TITULAR=...
EMAIL_PROVIDER=resend
RESEND_API_KEY=...
MAIL_FROM=CandyLand <pedidos@tudominio.com>
MAIL_TO=...
```

8. Endpoints mínimos:

```http
GET  /api/health
GET  /api/db/health
GET  /api/productos
GET  /api/categories
POST /api/carrito
POST /api/checkout
POST /api/orders/confirm
```

9. Endpoints nuevos:

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
POST   /api/contact
POST   /api/jobs/applications
POST   /api/franchise/leads
```

Criterio de listo:

- Railway levanta backend con `npm start`.
- Railway PostgreSQL está conectado.
- `/api/health`, `/api/db/health` y `/api/productos` responden.
- Seed corre sólo manualmente.
- No quedan secretos en Git.

---

### Fase 3 — Separación Vercel/Railway

Objetivo: Vercel sólo compila frontend; Railway corre API y DB.

Tareas:

1. Frontend usa `VITE_API_URL`.
2. Vercel env:

```env
VITE_API_URL=https://TU-BACKEND.up.railway.app
```

3. Local env:

```env
VITE_API_URL=http://127.0.0.1:5050
```

4. Quitar lógica de base de datos del build de Vercel.
5. Quitar rewrites `/api` a `api/index.cjs` si ya no se usa serverless.
6. Mantener fallback SPA.
7. Revisar si `api/index.cjs` queda deprecated y documentarlo antes de borrar.

Criterio de listo:

- `npm run build` no ejecuta Prisma, seed ni DB push.
- El frontend deployado consume Railway.
- La consola del navegador no muestra CORS ni errores de API.

---

### Fase 4 — Modelo de datos v2

Objetivo: soportar admin, stock real, imágenes por URL, pedidos y formularios.

Modelo recomendado:

```prisma
model Category {
  id        Int       @id @default(autoincrement())
  name      String    @unique
  slug      String    @unique
  isActive  Boolean   @default(true)
  products  Product[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Product {
  id          Int      @id @default(autoincrement())
  name        String
  slug        String   @unique
  description String?
  price       Decimal  @db.Decimal(10, 2)
  stock       Int      @default(0)
  imageUrl    String?
  hoverImageUrl String?
  isFeatured  Boolean @default(false)
  isActive    Boolean @default(true)
  categoryId  Int?
  category    Category? @relation(fields: [categoryId], references: [id])
  orderItems  OrderItem[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

Revisar el schema actual antes de reemplazar. Si ya existen modelos similares, migrar incrementalmente.

Reglas:

- `imageUrl` y `hoverImageUrl` son texto URL.
- No almacenar archivos ni base64.
- `stock` debe validarse antes de confirmar pedido.
- Productos con `isActive=false` no se muestran en catálogo público.
- Categorías inactivas no se muestran en menú público.

Criterio de listo:

- Migración creada.
- Seed actualizado.
- Productos demo tienen imágenes por URL.
- Stock real funciona.

---

### Fase 5 — Admin MVP

Objetivo: panel admin simple y real para portfolio.

Rutas frontend recomendadas:

```text
/admin/login
/admin
/admin/productos
/admin/categorias
/admin/pedidos
```

Funcionalidades mínimas:

- Login admin simple.
- Ver productos.
- Crear producto.
- Editar producto.
- Activar/desactivar producto.
- Gestionar precio.
- Gestionar stock.
- Gestionar URL de imagen principal y hover.
- Ver pedidos.
- Ver estado de pago manual.

Autenticación recomendada para MVP:

- JWT simple con usuario admin seed.
- Password hasheada con bcrypt.
- `.env` para secreto JWT.
- Sin registro público.

Variables:

```env
JWT_SECRET=...
ADMIN_EMAIL=...
ADMIN_PASSWORD_SEED=...
```

Reglas:

- No hardcodear credenciales.
- El seed puede crear el admin inicial si no existe.
- No exponer endpoints admin sin auth.

Criterio de listo:

- Admin puede cargar productos nuevos con URL de imagen.
- Catálogo público refleja cambios.
- Stock real se ve y se actualiza.

---

### Fase 6 — Pedidos, pagos manuales y emails

Objetivo: checkout realista sin integración de pasarela de pago.

Métodos de pago:

- Transferencia.
- Efectivo.

Flujo recomendado:

1. Usuario arma carrito.
2. Usuario completa checkout.
3. Backend valida stock.
4. Backend crea `Order` y `OrderItem`.
5. Backend descuenta/reserva stock según decisión final.
6. Backend registra método de pago.
7. Backend intenta enviar email.
8. Si el email falla, el pedido sigue creado y se registra el error en logs.

Email recomendado:

- Para portfolio real y simple: `Resend` con SDK Node.js.
- Para demo rápida sin dominio: `Nodemailer` + SMTP, idealmente Brevo SMTP o Gmail App Password sólo para prueba.

Implementación desacoplada:

```text
backend/src/services/emailService.js
backend/src/services/emailProviders/resendProvider.js
backend/src/services/emailProviders/smtpProvider.js
backend/src/services/emailProviders/noopProvider.js
```

Regla:

- El pedido no debe fallar porque falló el email.
- Guardar `emailStatus` opcional en `Order`: `pending`, `sent`, `failed`, `disabled`.
- En desarrollo, si no hay credenciales, usar provider `disabled/noop`.

Criterio de listo:

- Pedido guardado en PostgreSQL.
- Stock validado.
- Email enviado o fallo registrado sin romper checkout.
- Admin puede ver pedidos.

---

### Fase 7 — Rutas y pantallas públicas

Rutas obligatorias:

| Ruta | Página React | Fuente visual |
|---|---|---|
| `/` | `HomePage` | MVP + `index.html` Macarena |
| `/catalogo` | `CatalogPage` | MVP + `tienda.html` Macarena |
| `/tienda` | Redirect/Alias a `/catalogo` | Macarena |
| `/nuestros-dulces` | Redirect/Alias a `/catalogo` | Menú visual Macarena |
| `/menu` | `MenuPage` | `menu-tienda.html`, pero datos desde API |
| `/tutoriales` | `TutorialsPage` | `tutoriales.html`, tarjetas visuales |
| `/franquicias` | `FranchisePage` | `franquicias.html` |
| `/trabaja-con-nosotros` | `JobsPage` | `trabaja-en-tdc.html` |
| `/contacto` | `ContactPage` | `contacto.html` + componente actual |
| `/carrito` | `CartPage` | MVP |
| `/checkout` | `CheckoutPage` | MVP |
| `*` | `NotFoundPage` | Nueva |

Header público:

```text
Inicio
Nuestros dulces
Nuestro menú
Tutoriales
Franquicias
Trabajá con nosotros
Contacto
Carrito
```

Reglas:

- Mobile con menú hamburguesa.
- Cerrar menú al cambiar de ruta.
- CTA visible a catálogo.
- No agregar dark mode.
- Todo texto debe decir CandyLand.

Criterio de listo:

- Todas las rutas públicas cargan.
- Se ven bien en mobile.
- No hay rutas rotas desde Header/Footer.

---

### Fase 8 — Integración de assets de Macarena

Objetivo: usar assets reales donde sumen valor visual.

Tareas:

1. Auditar `/img` del proyecto de Macarena.
2. Identificar si hay logo útil.
3. Copiar assets estáticos a:

```text
public/img/candyland/
  hero/
  productos-demo/
  tutoriales/
  institucional/
  logos/
```

4. Crear manifiesto:

```text
src/data/candylandAssets.ts
```

Reglas:

- Assets institucionales y decorativos pueden vivir en `public/img/candyland`.
- Imágenes de productos administrables deben ser URLs en DB.
- No mezclar assets demo con imágenes administrables sin documentarlo.
- Agregar `alt` real.
- Optimizar si pesan demasiado.

Criterio de listo:

- Logo revisado.
- Assets útiles copiados.
- Componentes usan rutas consistentes.

---

### Fase 9 — Formularios públicos

Formularios:

- Contacto.
- Trabajá con nosotros.
- Franquicias.

Primera versión:

- Validación frontend.
- POST al backend.
- Guardar en PostgreSQL o enviar email, según sea más simple.
- Mostrar éxito/error.

Endpoints:

```http
POST /api/contact
POST /api/jobs/applications
POST /api/franchise/leads
```

Criterio de listo:

- No quedan formularios falsos sin comportamiento.
- Si el envío real se posterga, debe estar claramente documentado.

---

### Fase 10 — QA, deploy y documentación final

Comandos locales:

```bash
# Frontend (build/lint bloquean hasta terminar; dev queda adjunto)
npm install
npm run lint
npm run build
npm run dev   # terminal dedicada; detener con Ctrl+C tras las pruebas

# Backend (mismo patrón: dev en terminal dedicada)
cd backend
npm install
npm run prisma:generate
npm run dev
```

Pruebas API (desde otra terminal mientras corren los `npm run dev`):

```bash
curl http://127.0.0.1:5050/api/health
curl http://127.0.0.1:5050/api/db/health
curl http://127.0.0.1:5050/api/productos
```

Pruebas deploy:

```bash
curl https://TU-BACKEND.up.railway.app/api/health
curl https://TU-BACKEND.up.railway.app/api/db/health
curl https://TU-BACKEND.up.railway.app/api/productos
```

Checklist final:

```text
[ ] AGENTS.md root creado
[ ] docs/DECISIONES_CERRADAS.md creado
[ ] docs/MAPA_REFERENCIA.md generado por OpenCode
[ ] docs/DEPLOY_RAILWAY_VERCEL.md actualizado
[ ] openspec/config.yaml copiado
[ ] CodeGraph inicializado en MVP
[ ] CodeGraph inicializado en referencia
[ ] .codegraph/ en .gitignore
[ ] Backend Railway funcionando
[ ] PostgreSQL Railway funcionando
[ ] Vercel sólo frontend
[ ] VITE_API_URL configurado
[ ] CORS con dominio Vercel actual
[ ] Admin login funcionando
[ ] CRUD productos funcionando
[ ] Imágenes de productos por URL
[ ] Stock real funcionando
[ ] Pedidos guardados
[ ] Email implementado o provider noop documentado
[ ] Rutas Macarena agregadas
[ ] Modo claro solamente
[ ] Build frontend OK
[ ] Deploy final OK
```

---

## 5. Prompts recomendados por iteración

### Prompt 1 — Inicialización técnica

```text
Leé AGENTS.md, docs/DECISIONES_CERRADAS.md y openspec/config.yaml.
Usá CodeGraph antes de abrir muchos archivos.
No modifiques código todavía.
Generá docs/MAPA_REFERENCIA.md y docs/AUDITORIA_INICIAL.md comparando:
- /home/marcos/Escritorio/CandyLand/CandyLand/candyLand-mvp
- /home/marcos/Escritorio/CandyLand/CandyLand_Macarena/tienda-candyland

Necesito saber qué pantallas, assets, rutas, estilos y componentes faltan para completar CandyLand v2.
```

### Prompt 2 — Backend Railway

```text
Implementá la Fase Backend Railway de acuerdo con docs/DECISIONES_CERRADAS.md y openspec/specs/backend-railway/spec.md.
Objetivos:
- Backend Express long-running en backend/.
- Railway con process.env.PORT.
- PostgreSQL Railway por DATABASE_URL.
- Prisma migrate deploy para producción.
- Seed manual.
- CORS con https://candy-land-mvp.vercel.app y localhost.
No toques todavía las pantallas públicas salvo que sea necesario para VITE_API_URL.
```

### Prompt 3 — Admin productos

```text
Implementá admin MVP según openspec/specs/admin-productos/spec.md.
Debe incluir:
- /admin/login
- /admin/productos
- /admin/categorias
- /admin/pedidos
- CRUD productos con imageUrl y hoverImageUrl como URL.
- Stock real.
- Auth admin básica con JWT.
No implementar upload de archivos.
```

### Prompt 4 — UI parity con Macarena

```text
Implementá las pantallas públicas faltantes usando React y tomando como referencia la carpeta de Macarena.
Rutas obligatorias:
/menu, /tutoriales, /franquicias, /trabaja-con-nosotros, /contacto.
Mantener /catalogo como ruta canónica y agregar aliases si conviene.
Combinar lo mejor de ambos proyectos, modo claro únicamente y marca CandyLand.
No crear detalle de producto.
```

### Prompt 5 — Emails de pedidos

```text
Implementá envío de emails de pedido de forma desacoplada según docs/EMAILS_PEDIDOS.md.
Preferencia: Resend si están las variables RESEND_API_KEY y MAIL_FROM.
Fallback: SMTP/Nodemailer o noop si no hay credenciales.
Regla clave: el pedido no debe fallar si el email falla.
Guardar emailStatus o registrar error de forma segura.
```
