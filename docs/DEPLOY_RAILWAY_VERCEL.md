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
npm install && npx prisma generate
```

Start command:

```bash
npm start
```

Migraciones:

```bash
npx prisma migrate deploy
```

Según cómo quede Railway configurado, ejecutar migraciones como pre-deploy/runtime command o manualmente desde Railway/CLI. No meter migraciones dentro del build de Vercel.

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

### 3. Output directory

```text
dist
```

### 4. `vercel.json`

Debe mantener fallback SPA y headers de estáticos, pero no debe enviar `/api` a serverless si Railway ya es la API oficial.

Ejemplo conceptual:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/((?!assets/|img/).*)",
      "destination": "/index.html"
    }
  ]
}
```

Revisar el `vercel.json` real antes de reemplazarlo.

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
