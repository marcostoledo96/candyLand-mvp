# Demo mock-first — CandyLand v2

**Fecha:** 2026-07-28  
**Estado:** decisión de producto vigente para el objetivo portfolio/demo.

## Objetivo

Publicar una **demo frontend en Vercel** que funcione **sin backend y sin base de datos**.  
El código debe permitir activar un **backend real** más adelante sin reescribir pantallas.

## Modos de datos

| Modo | Variable | Comportamiento |
|---|---|---|
| **Mock (default demo)** | `VITE_DATA_MODE=mock` (o ausente → mock) | Catálogo, menú, carrito, checkout, admin y formularios públicos usan adapters mock. No hay `fetch` a Railway/Postgres. |
| **API real (opcional)** | `VITE_DATA_MODE=api` + `VITE_API_URL=<origen backend>` | Mismos contratos de UI; los adapters HTTP llaman al backend Express/Prisma existente en `backend/`. |

Reglas:

- No hardcodear URL de Railway en componentes.
- El default de producción/demo es **mock**.
- Activar API real es configuración explícita, no el camino de deploy del portfolio.

## Arquitectura prevista

```text
UI (pages/components)
  → src/lib/*Api / servicios de dominio (mismos tipos/contratos)
    → adapter seleccionado por VITE_DATA_MODE
      → mock: src/mocks/* (+ localStorage donde haga falta sesión)
      → api:  fetch(VITE_API_URL + /api/...)
```

Contratos a cubrir con mock (misma forma que el backend actual):

- productos / categorías (catálogo + menú);
- carrito;
- checkout (dirección, método de pago, confirmación con idempotencia simulada);
- admin (login demo, productos, categorías, pedidos + restauración de stock en memoria);
- formularios públicos (contacto / trabaja / franquicias) como éxito simulado documentado.

Persistencia mock sugerida:

- catálogo base: JSON/fixtures en repo;
- carrito + checkout en curso: `localStorage` / memoria de sesión;
- stock y pedidos admin: memoria de sesión (reset al recargar es aceptable y debe documentarse en UI/README).

## Qué queda del stack full-stack

- La carpeta `backend/` **se conserva** como implementación de referencia para el modo `api`.
- Prisma, migraciones, Railway y PostgreSQL **no son requisito** del deploy demo.
- OpenSpec parent `2026-06-candyland-v2` **no se cierra** por este pivot: la evidencia productiva Railway/Vercel API queda **diferida** (modo `api`), no descartada como código.

## Deploy demo

1. Vercel compila sólo frontend (`npm run build` → `dist`).
2. Variables: `VITE_DATA_MODE=mock` (o sin variable en Vite = mock).
3. **No** hace falta `VITE_API_URL`, `DATABASE_URL`, Railway ni CORS para la demo.
4. Smoke demo: abrir home, catálogo, menú, carrito, checkout y admin mock; no curls a `/api` remoto.

## Credenciales admin demo

```text
email: admin@candyland.demo
password: demo
```

La “auth” admin en mock es **solo de demo**: el token se emite al login y se valida contra la lista local de sesiones (`adminTokens`). No es seguridad real; el store vive en el navegador.

Estado mock (stock, carrito, pedidos) vive en `localStorage` (`candyland.mock.v1`) y se reinicia borrando esa clave o recargando con storage limpio. Payloads corruptos se descartan y se regeneran fixtures.

En modo `api`, `VITE_API_URL` es **obligatorio** (fail-closed).

## Activar backend real (futuro)

Cuando se quiera modo API:

1. Levantar `backend/` (local o Railway) con Postgres y migraciones.
2. Setear `VITE_DATA_MODE=api` y `VITE_API_URL` al origen público del API.
3. Configurar `CORS_ORIGIN` en el backend.
4. Seguir `docs/DEPLOY_RAILWAY_VERCEL.md` (contrato histórico / modo API).

## Fuera de alcance de la demo mock

- Persistencia real entre dispositivos/sesiones.
- Emails reales (noop / mensaje simulado).
- Pagos online, WhatsApp, detalle `/producto/:id`, dark mode (siguen prohibidos).
- QA productiva contra Railway como gate de cierre del portfolio demo.
