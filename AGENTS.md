# AGENTS.md — CandyLand MVP

Este archivo define cómo debe trabajar OpenCode/Gentle AI dentro de este repositorio.

## 1. Proyecto

CandyLand es un e-commerce full stack para golosinas y snacks premium.

Objetivo actual: evolucionar el MVP hacia una versión v2 más completa para portfolio, combinando:

- el proyecto principal React/Vite/TypeScript + Node/Express/Prisma;
- el proyecto de referencia visual `tienda-candyland`;
- backend y PostgreSQL en Railway;
- frontend en Vercel;
- documentación y flujo SDD/Gentle AI.

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
- Backend en Node.js + Express.
- ORM: Prisma.
- Base de datos: PostgreSQL exclusivamente en Railway.
- Frontend: Vercel.
- Backend: Railway, usando `backend/` como root directory.
- Modo visual: claro únicamente.
- Marca: `CandyLand`.
- Métodos de pago: transferencia o efectivo.
- No implementar Mercado Pago, tarjetas ni WhatsApp en esta etapa.
- No crear detalle de producto `/producto/:id`.
- Admin sí: productos, categorías, stock, pedidos.
- Imágenes de productos por URL, no upload de archivos.
- Tutoriales: sólo tarjetas visuales para portfolio.
- Nuestro menú: debe salir de API/categorías, no quedar hardcodeado definitivo.

## 4. Fuente de verdad documental

Antes de modificar código, leer:

1. `docs/DECISIONES_CERRADAS.md`
2. `docs/DEPLOY_RAILWAY_VERCEL.md`
3. `docs/CODEGRAPH_INIT.md`
4. `docs/ENGRAM_GUIDE.md`
5. `openspec/config.yaml`
6. specs relevantes dentro de `openspec/specs/`

Si algún documento contradice el código, auditar y documentar la discrepancia antes de aplicar cambios grandes.

## 5. Uso obligatorio de CodeGraph

Antes de leer muchos archivos, usar CodeGraph para entender estructura, flujos y dependencias.

Comandos esperados:

```bash
codegraph status
codegraph explore "cómo fluye el catálogo desde la API hasta las cards React"
codegraph explore "backend Express Prisma productos órdenes stock"
```

Reglas:

- No hacer grep/lecturas masivas si CodeGraph puede responder la pregunta estructural.
- Después de cambios grandes, verificar `codegraph status`.
- Si CodeGraph informa stale/pending, esperar o ejecutar `codegraph sync`.
- Si la carpeta `.codegraph/` no existe, pedir ejecutar `codegraph init`.

## 6. Uso de Engram

Guardar memoria cuando haya decisiones importantes:

- migraciones de DB;
- cambios de arquitectura;
- endpoints nuevos;
- decisiones de diseño;
- bugs complejos;
- credenciales/variables requeridas, sin guardar valores secretos;
- tareas pendientes importantes.

No guardar secretos reales en Engram.

Ejemplos de memoria útil:

```text
CandyLand decidió usar Railway PostgreSQL como única base, Vercel sólo frontend, Prisma migrate deploy en producción y seed manual.
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

- backend Railway;
- admin completo;
- rediseño visual completo;
- migraciones destructivas.

## 8. Reglas de implementación frontend

- React + TypeScript.
- Mantener React Router.
- Mantener `VITE_API_URL` para llamadas al backend.
- No hardcodear URL de Railway dentro del código.
- Componentes reutilizables.
- Estados obligatorios: loading, error, empty, success.
- Mobile-first.
- Sólo modo claro.
- Accesibilidad básica: labels, alt, focus visible, botones semánticos.

## 9. Reglas de implementación backend

- Express long-running en Railway.
- Escuchar `process.env.PORT` y `0.0.0.0`.
- CORS por `CORS_ORIGIN`.
- Prisma con PostgreSQL.
- Producción usa `prisma migrate deploy`.
- No usar `db push` en producción.
- Seed manual y seguro.
- Validar datos de entrada.
- No exponer stack traces al cliente.
- No bloquear pedidos por fallas de email.

## 10. Reglas de deploy

- Vercel sólo debe compilar frontend.
- Railway corre backend y DB.
- `DATABASE_URL` vive en Railway.
- `VITE_API_URL` vive en Vercel.
- CORS debe permitir:
  - `https://candy-land-mvp.vercel.app`
  - `http://localhost:5173`

## 11. Qué no hacer

- No agregar dark mode.
- No implementar pagos online todavía.
- No implementar WhatsApp automático.
- No crear página detalle de producto.
- No subir imágenes de admin como archivo.
- No dejar formularios falsos sin documentarlo.
- No commitear `.env`, `.codegraph/`, bases locales ni secretos.
- No borrar `api/index.cjs` sin documentar si queda deprecado y confirmar que Vercel ya no lo usa.

## 12. Verificación mínima antes de finalizar una tarea

Build y lint (bloquea hasta terminar, es seguro):

```bash
npm run lint
npm run build
```

Backend: generar cliente Prisma y levantar el server en una terminal aparte
(no bloquea el bloque siguiente, porque `npm run dev` queda adjunto):

```bash
cd backend
npm run prisma:generate
npm run dev   # terminal dedicada; detener con Ctrl+C tras las pruebas
```

Desde otra terminal, probar endpoints:

```bash
curl http://127.0.0.1:5050/api/health
curl http://127.0.0.1:5050/api/db/health
curl http://127.0.0.1:5050/api/productos
```

Actualizar docs cuando cambien arquitectura, endpoints, variables o deploy.
