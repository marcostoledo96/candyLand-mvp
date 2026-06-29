# Deploy Railway + Vercel — CandyLand v2

## Objetivo

- Frontend en Vercel.
- Backend Node/Express en Railway.
- PostgreSQL en Railway.
- Prisma para schema/migraciones.

## Railway — backend

### 1. Crear proyecto Railway

1. Crear nuevo proyecto.
2. Conectar GitHub repo `marcostoledo96/candyLand-mvp`.
3. Crear servicio PostgreSQL.
4. Crear servicio backend desde el mismo repo.
5. Configurar `Root Directory`:

```text
backend
```

### 2. Variables Railway backend

```env
NODE_ENV=production
HOST=0.0.0.0
DATABASE_URL=${{Postgres.DATABASE_URL}}
CORS_ORIGIN=https://candy-land-mvp.vercel.app,http://localhost:5173
JWT_SECRET=...
BANK_ALIAS=...
BANK_CBU=...
BANK_TITULAR=...
EMAIL_PROVIDER=resend
RESEND_API_KEY=...
MAIL_FROM=CandyLand <pedidos@tudominio.com>
MAIL_TO=marcos@example.com
```

### 3. Comandos Railway

Build command recomendado si hace falta:

```bash
npm install --include=dev && npx prisma generate
```

> Prisma CLI está en `backend/devDependencies`; el build debe instalar dev deps o proveer Prisma CLI de otra forma para poder generar el cliente.

Start command:

```bash
npm start
```

Migraciones:

```bash
npx prisma migrate deploy
```

Según cómo quede Railway configurado, ejecutar migraciones como pre-deploy/runtime command o manualmente desde Railway/CLI. No meter migraciones dentro del build de Vercel.

> Antes del primer seed en una base nueva, aplicar migraciones. `prisma generate` sólo genera cliente; no crea tablas.

### 4. Seed manual

Sólo si la base está vacía o si se quiere resetear demo:

```bash
npm run seed
```

El seed debe ser idempotente o confirmar antes de borrar datos.

### 5. Health checks

```bash
curl https://TU-BACKEND.up.railway.app/api/health
curl https://TU-BACKEND.up.railway.app/api/db/health
curl https://TU-BACKEND.up.railway.app/api/productos
```

## Vercel — frontend

### 1. Variables Vercel

```env
VITE_API_URL=https://TU-BACKEND.up.railway.app
```

No usar `DATABASE_URL` en Vercel si Vercel sólo compila frontend.

### 2. Build command

```bash
npm run build
```

> **Atención:** Vercel debe ejecutar sólo `npm run build`. No poner `prisma db push`, `prisma migrate deploy` ni `seed` en el build de Vercel porque requieren `DATABASE_URL` y pertenecen al backend/Railway.

### 3. Output directory

```text
dist
```

### 4. `postinstall` del root

El `package.json` root define:

```json
"postinstall": "prisma generate --schema backend/prisma/schema.prisma"
```

Vercel ejecuta `postinstall` antes del build aunque falte `DATABASE_URL`. En una receta frontend-only `prisma generate` no necesita `DATABASE_URL` (sólo genera el cliente a partir del schema), pero deja una dependencia frágil. Si se quiere evitar por completo, anular el install en Vercel con:

```env
INSTALL_COMMAND=npm install --ignore-scripts
```

o, más seguro, dejar `prisma generate` (no requiere `DATABASE_URL`) y mantener `db push`/`seed` fuera del build de Vercel.

### 5. `vercel.json`

`vercel.json` is now frontend-only: the `/api` serverless rewrite has been removed
so the frontend calls the Railway backend directly via `VITE_API_URL`. The SPA
fallback and static-asset cache headers are preserved.

The legacy `api/` serverless surface is deprecated (kept for rollback safety,
not routed). It is also excluded by `.vercelignore` (`api/*.js`, `api/**/*.js`,
`api/*.cjs`, `api/**/*.cjs`, `api/package.json`), so Vercel does not deploy JS
or CJS API functions while the frontend-only config is in place. These files can
be deleted once the Railway backend is confirmed stable in production.

Current `vercel.json` rewrites only the SPA fallback (no `/api`):

```json
{
  "rewrites": [
    { "source": "/((?!api/).*)", "has": [ { "type": "header", "key": "accept", "value": ".*text/html.*" } ], "destination": "/index.html" }
  ]
}
```

## CORS

En backend permitir:

```text
https://candy-land-mvp.vercel.app
http://localhost:5173
```

Si Vercel preview genera dominios dinámicos, hay dos opciones:

1. Agregar previews manuales cuando se necesiten.
2. Permitir patrón controlado de Vercel previews si se implementa validación segura.

Para MVP, opción simple: dominio producción + localhost.

## Checklist deploy desde cero

```text
[ ] Railway proyecto creado
[ ] Railway PostgreSQL creado
[ ] Railway backend conectado a repo
[ ] Root Directory backend configurado
[ ] DATABASE_URL configurado
[ ] CORS_ORIGIN configurado
[ ] Backend responde /api/health
[ ] Backend responde /api/db/health
[ ] Migraciones aplicadas
[ ] Seed manual ejecutado si corresponde
[ ] Vercel conectado a repo
[ ] VITE_API_URL configurado
[ ] Build Vercel OK
[ ] Front consume Railway
[ ] Checkout crea pedido
[ ] Admin accede
[ ] No hay secrets en GitHub
```
