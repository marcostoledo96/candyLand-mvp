# Change Proposal — CandyLand v2 Railway/Admin/UI

## Why

CandyLand ya tiene base funcional de e-commerce, pero necesita una versión más completa y profesional: backend desplegado correctamente en Railway, base PostgreSQL propia, pantallas institucionales de la referencia, admin real y documentación para que OpenCode/Gentle AI trabaje mejor.

## What changes

- Separar frontend Vercel y backend Railway.
- Migrar DB a PostgreSQL Railway exclusivamente.
- Mantener Prisma y usar migraciones versionadas.
- Agregar admin de productos/categorías/pedidos.
- Usar stock real.
- Guardar imágenes de productos como URL.
- Guardar pedidos en PostgreSQL.
- Enviar emails de pedido con provider desacoplado.
- Agregar rutas públicas faltantes de Macarena.
- Agregar AGENTS.md, docs, OpenSpec, Engram Guide y CodeGraph Guide.

## Out of scope

- Mercado Pago.
- Tarjetas.
- WhatsApp automático.
- Dark mode.
- Upload de imágenes.
- Detalle público de producto `/producto/:id`.
- CMS real de tutoriales.

## Risk

- Migraciones de DB pueden romper datos si no se revisan.
- CORS puede bloquear Vercel si se configura mal.
- Vercel puede seguir llamando `/api` local si no se migra `VITE_API_URL`.
- Email provider puede fallar si no hay dominio/credenciales.

## Rollback

- Mantener branch separada.
- No borrar `api/index.cjs` hasta confirmar Railway.
- Mantener seed manual.
- Documentar migraciones antes de aplicar a producción.
- Permitir `EMAIL_PROVIDER=disabled`.
