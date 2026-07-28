# AGENTS.md — CandyLand MVP

Este archivo define cómo debe trabajar OpenCode/Gentle AI dentro de este repositorio.

## 1. Proyecto

CandyLand es un e-commerce de golosinas y snacks premium orientado a portfolio.

Objetivo vigente (2026-07-28): **demo frontend en Vercel con mocks**, sin backend/DB en runtime. Conservar `backend/` Express/Prisma para un modo API opcional configurable.

Combinar:

- el proyecto principal React/Vite/TypeScript (+ `backend/` opcional);
- el proyecto de referencia visual `tienda-candyland`;
- deploy demo en Vercel;
- documentación y flujo SDD/Gentle AI.

Fuente del pivot: `docs/DEMO_MOCK.md` y `docs/DECISIONES_CERRADAS.md`.

## 2. Rutas locales importantes

Proyecto principal:

```bash
/home/marcos/Escritorio/CandyLand/CandyLand/candyLand-mvp
```

Proyecto de referencia visual/assets:

```bash
/home/marcos/Escritorio/CandyLand/CandyLand_Macarena/tienda-candyland
```

## 3. Decisiones obligatorias

- Implementar siempre en React + TypeScript para frontend.
- **Demo default:** `VITE_DATA_MODE=mock` (sin Railway/Postgres).
- **Modo API opcional:** `VITE_DATA_MODE=api` + `VITE_API_URL`; usa `backend/` Node/Express/Prisma/PostgreSQL.
- No borrar `backend/` ni migraciones en el pivot mock; quedan para modo API.
- Frontend demo: Vercel only.
- Modo visual: claro únicamente.
- Marca: `CandyLand`.
- Métodos de pago: transferencia o efectivo.
- No implementar Mercado Pago, tarjetas ni WhatsApp en esta etapa.
- No crear detalle de producto `/producto/:id`.
- Admin sí: productos, categorías, stock, pedidos (mock en demo).
- Imágenes de productos por URL, no upload de archivos.
- Tutoriales: sólo tarjetas visuales para portfolio.
- Nuestro menú: contrato de categorías (mock o API), no hardcode suelto en UI.
- Formularios mock/simulados deben documentarse como demo.

## 4. Fuente de verdad documental

Antes de modificar código, leer:

1. `docs/DECISIONES_CERRADAS.md`
2. `docs/DEMO_MOCK.md`
3. `docs/DEPLOY_RAILWAY_VERCEL.md` (sólo si se trabaja modo API)
4. `docs/CODEGRAPH_INIT.md`
5. `docs/ENGRAM_GUIDE.md`
6. `openspec/config.yaml`
7. specs relevantes dentro de `openspec/specs/`

Si algún documento contradice el código, auditar y documentar la discrepancia antes de aplicar cambios grandes.

## 5. Uso obligatorio de CodeGraph

Antes de leer muchos archivos, usar CodeGraph para entender estructura, flujos y dependencias.

Comandos esperados:

```bash
codegraph status
codegraph explore "cómo fluye el catálogo desde la API hasta las cards React"
codegraph explore "adapters mock api productos carrito checkout admin"
```

Reglas:

- No hacer grep/lecturas masivas si CodeGraph puede responder la pregunta estructural.
- Después de cambios grandes, verificar `codegraph status`.
- Si CodeGraph informa stale/pending, esperar o ejecutar `codegraph sync`.
- Si la carpeta `.codegraph/` no existe, pedir ejecutar `codegraph init`.

## 6. Uso de Engram

Guardar memoria cuando haya decisiones importantes:

- cambios de arquitectura (mock vs API);
- migraciones de DB (modo API);
- endpoints nuevos;
- decisiones de diseño;
- bugs complejos;
- credenciales/variables requeridas, sin guardar valores secretos;
- tareas pendientes importantes.

No guardar secretos reales en Engram.

Ejemplos de memoria útil:

```text
CandyLand demo portfolio usa VITE_DATA_MODE=mock por defecto; backend/Prisma/Railway quedan para modo api opcional.
```

```text
CandyLand no usa upload de imágenes en admin; los productos guardan imageUrl y hoverImageUrl como texto URL.
```

## 7. Flujo SDD recomendado

Para features grandes:

1. Explorar.
2. Especificar.
3. Diseñar.
4. Dividir en tareas.
5. Aplicar cambios chicos.
6. Verificar.
7. Actualizar docs.

No mezclar en un solo cambio:

- capa mock/adapters completa + rediseño visual;
- modo API Railway;
- migraciones destructivas;
- borrado de `backend/`.

## 8. Reglas de implementación frontend

- React + TypeScript.
- Mantener React Router.
- Datos vía adapters (`mock` | `api`); no fetch directo desde páginas.
- En modo API: `VITE_API_URL`; no hardcodear Railway.
- Componentes reutilizables.
- Estados obligatorios: loading, error, empty, success.
- Mobile-first.
- Sólo modo claro.
- Accesibilidad básica: labels, alt, focus visible, botones semánticos.

## 9. Reglas de implementación backend (modo API opcional)

- Express long-running (local o Railway).
- Escuchar `process.env.PORT` y `0.0.0.0`.
- CORS por `CORS_ORIGIN`.
- Prisma con PostgreSQL.
- Producción API usa `prisma migrate deploy`.
- No usar `db push` en producción.
- Seed manual y seguro.
- Validar datos de entrada.
- No exponer stack traces al cliente.
- No bloquear pedidos por fallas de email.

## 10. Reglas de deploy

- Demo: Vercel sólo frontend + mocks. Sin `DATABASE_URL`.
- Modo API: Railway backend/DB + `VITE_API_URL` en Vercel + CORS.
- No reactivar serverless `api/` en Vercel como backend de demo.

## 11. Qué no hacer

- No agregar dark mode.
- No implementar pagos online todavía.
- No implementar WhatsApp automático.
- No crear página detalle de producto.
- No subir imágenes de admin como archivo.
- No dejar formularios falsos sin documentarlo.
- No commitear `.env`, `.codegraph/`, bases locales ni secretos.
- No borrar `backend/` ni `api/index.cjs` sin documentar el deprecado y el plan de rollback.
- No exigir Railway/Postgres para validar la demo mock.

## 12. Verificación mínima antes de finalizar una tarea

Build y lint (bloquea hasta terminar, es seguro):

```bash
npm run lint
npm run build
```

Demo mock: verificar flujos en UI (catálogo, menú, carrito, checkout, admin) sin API remota.

Modo API (sólo si aplica):

```bash
cd backend
npm run prisma:generate
npm run dev
```

```bash
curl http://127.0.0.1:5050/api/health
curl http://127.0.0.1:5050/api/db/health
curl http://127.0.0.1:5050/api/productos
```

Actualizar docs cuando cambien arquitectura, endpoints, variables o deploy.
