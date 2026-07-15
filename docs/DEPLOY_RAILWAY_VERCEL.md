# Deploy Railway + Vercel — CandyLand v2

## Objetivo

- Frontend en Vercel.
- Backend Node/Express en Railway.
- PostgreSQL en Railway.
- Prisma para schema/migraciones.

## Railway — backend

## Current repository contract

The repository versions the Railway release sequence in root `railway.json`:

1. build: `npm ci --include=dev && npm run prisma:generate`;
2. pre-deploy: `npx prisma migrate deploy`;
3. start: `npm start`;
4. health check: `GET /api/health`.

Railway service settings remain provider state: the backend service must keep Root Directory `backend`, and its Config File path must be the absolute repository path `/railway.json`. Railway runs build and deploy commands from the configured root directory; its config-file path does not follow that directory automatically.

> **Approval boundary:** committing this file does not change Railway. Config-path changes, deploys, migration execution, seed execution, variable changes, linking, and rollback execution require separate explicit authorization.

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

Configure names only; never copy values into this repository: `NODE_ENV`, `HOST`, `DATABASE_URL`, `CORS_ORIGIN`, `JWT_SECRET`, `BANK_ALIAS`, `BANK_CBU`, `BANK_TITULAR`, `EMAIL_PROVIDER`, `RESEND_API_KEY`, `MAIL_FROM`, and `MAIL_TO`.

`EMAIL_PROVIDER=noop` is the credential-free default. `RESEND_API_KEY`, `MAIL_FROM`, and `MAIL_TO` are required only when `EMAIL_PROVIDER=resend`.

### 3. Comandos Railway

`railway.json` is the repository source of truth once the approved service Config File path points to `/railway.json`:

```bash
npm ci --include=dev && npm run prisma:generate
```

> Prisma CLI está en `backend/devDependencies`; el build debe instalar dev deps o proveer Prisma CLI de otra forma para poder generar el cliente.

Pre-deploy command (after an explicit production-migration approval):

```bash
npx prisma migrate deploy
```

Start command:

```bash
npm start
```

`prisma migrate deploy` runs before the new backend starts. A build or pre-deploy failure must leave the new release unpromoted. Do not put migration, seed, or `prisma db push` in build/start commands, and never put any of them in Vercel.

> Antes del primer seed en una base nueva, aplicar migraciones. `prisma generate` sólo genera cliente; no crea tablas.

### 4. Seed manual

Sólo si la base está vacía o si se quiere resetear demo:

```bash
npm run seed
```

El seed debe ser idempotente o confirmar antes de borrar datos.

### 5. Read-only production smoke

```bash
npm run smoke:production
# or a different approved public API origin
npm run smoke:production -- https://example.up.railway.app
# optional timeout override in milliseconds (default: 10000)
npm run smoke:production -- https://example.up.railway.app 5000
```

The default documented public API origin is `https://candyland-mvp-production.up.railway.app`. The script performs exactly four public GETs: `/api/health`, `/api/db/health`, `/api/productos`, and `/api/categories`. Each request uses `AbortSignal.timeout` with a 10-second default; pass a positive millisecond value as the second CLI argument or set non-secret `SMOKE_TIMEOUT_MS` to override it. A timeout is recorded as failed redacted evidence and makes the process exit nonzero. The script sends no bodies, credentials, cookies, queries, retries, or writes. Its JSON evidence contains only method, path, status, timing, category, result, timestamp, and the redaction list—never response bodies, headers, URLs, environment values, or logs.

## Vercel — frontend

### 1. Variables Vercel

Configure only `VITE_API_URL` in Vercel. Do not configure `DATABASE_URL` for this frontend-only deployment.

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

## Approval tiers, evidence, and rollback

| Tier | Allowed work | Evidence / boundary |
|---|---|---|
| Repository-local | tests, config assertions, lint, build, Prisma validate/generate with a dummy URL | committed config and test output only |
| Public read-only | the four-endpoint smoke above | redacted JSON evidence; no write retry |
| Authenticated read-only | provider status/config inspection | explicit authorization and redacted references |
| Provider or data mutation | config/link changes, deploy, migration, seed, checkout/admin writes, rollback execution | separately authorized, bounded action with actor, scope, outcome, and rollback record |

Before promotion, record the intended rollback boundary: Vercel can revert the frontend deployment; Railway can roll back the backend deployment; checkout/email regressions require disabling or correcting the affected release; and a migration regression must halt promotion and use a forward fix when reversal could risk persisted data. Do not claim any provider rollback, migration, seed, variable, or write QA has been verified until an authorized action records it.

## Checklist deploy desde cero

```text
[ ] Railway proyecto creado
[ ] Railway PostgreSQL creado
[ ] Railway backend conectado a repo
[ ] Root Directory backend configurado
[ ] DATABASE_URL configurado
[ ] CORS_ORIGIN configurado
[ ] Railway Config File path `/railway.json` approved and configured
[ ] Backend responde `/api/health`
[ ] Backend responde `/api/db/health`
[ ] Migraciones aplicadas with separate approval
[ ] Seed manual ejecutado si corresponde y fue aprobado
[ ] Vercel conectado a repo
[ ] VITE_API_URL configurado
[ ] Build Vercel OK
[ ] Front consume Railway
[ ] Public read-only smoke records four passing GETs
[ ] Checkout/admin write QA was separately approved and recorded, if required
[ ] No hay secrets en GitHub
```
