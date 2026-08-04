# Handoff Cursor → OpenCode — CandyLand MVP

**Fecha:** 2026-08-04  
**Audiencia:** sesión nueva en OpenCode / Gentle AI  
**Repo:** https://github.com/marcostoledo96/candyLand-mvp  
**Path local:** `/home/marcos/Escritorio/CandyLand/CandyLand/candyLand-mvp`  
**Demo live:** https://candy-land-mvp.vercel.app/

## 0. Leer primero (orden)

1. Este archivo (`docs/HANDOFF_CURSOR_OPENCODE.md`)
2. `AGENTS.md`
3. `docs/DECISIONES_CERRADAS.md`
4. `docs/DEMO_MOCK.md` ← **contrato vigente del portfolio**
5. `docs/PLANIFICACION_CANDYLAND_V2.md` (fase 0)
6. `openspec/config.yaml`
7. Si vas a modo API: `docs/DEPLOY_RAILWAY_VERCEL.md` (opcional, no es el gate del demo)

Usá CodeGraph antes de lecturas masivas. No leas `.env` ni inventes secretos.

---

## 1. Estado del repo al cerrar el trabajo en Cursor

| Ítem | Estado |
|---|---|
| Objetivo de producto | **Demo portfolio en Vercel con mocks** (sin Railway/DB en runtime) |
| Tip `main` al documentar | `830c0f8` (merge PR #22) — **verificar `git pull`** |
| PR de cierre OpenSpec | **#23** `docs/closes-openspec-demo-only` — debe estar **MERGED** antes de tratar el parent como CLOSED |
| OpenSpec `2026-06-candyland-v2` | **CLOSED** por decisión demo-only final (si #23 ya mergeó); artifacto `archive-parent-demo-only.md` |
| Backend en repo | **Conservado** en `backend/` para `VITE_DATA_MODE=api` opcional |
| Modo default | `VITE_DATA_MODE=mock` (o ausente → mock) |

### Acción inmediata al abrir OpenCode

```bash
cd /home/marcos/Escritorio/CandyLand/CandyLand/candyLand-mvp
git checkout main && git pull --ff-only
gh pr view 23 --json state,mergedAt,url
# Si state=OPEN → mergear #23 (dueño) y volver a pull
```

---

## 2. Qué se hizo en Cursor (cronología)

### Contexto de entrada

- Se partió de QA de deploy productivo (PR #18 ya estaba mergeado).
- Railway público respondía smoke GET 4/4.
- Vercel tenía `VITE_API_URL` vacío → el front en API mode pegaba a `/api` relativo → 404.
- Decisión de producto: **no depender de backend/DB para la demo de portfolio**.

### Pivot mock-first (2026-07-28)

| PR | Qué | Merge |
|---|---|---|
| **#19** | Capa mock/api: adapters, fixtures, `localStorage` store, admin demo, fail-closed API | `07b7690` |
| **#19 fix** | Harden: `cartId`, storage corrupto, precios vivos, `adminTokens`+exp, idempotency claim, validación checkout | `4778aa3` (en #19) |
| **#20** | Evidencia smoke Vercel (catalog→checkout→admin) | `90eccbd` |
| **#21** | README mock-first + fixes de auditoría (seed/`create-admin`/migrate prod/reset storage) | `642c404` |
| **#22** | Archive OpenSpec mock-first, PD-08 parcial, parent aún abierto | `830c0f8` |
| **#23** | **Cierre parent** demo-only final (PD-08 por supersesión; Railway waived) | *merge pendiente al escribir este handoff* |

### Flujo UI smoke en producción (mock)

- Catálogo → carrito → checkout → orden `DEMO-00001` (stock 50→49).
- Admin login → productos (stock 49) → listado pedidos.
- Cancel + restore stock: **UI skip** (bloqueo browser approval); **cubierto por unit tests** (`test/demo-mock.test.mjs`).
- Evidencia: `openspec/changes/2026-06-candyland-v2/verify-demo-mock-first.md`.

### Tests de referencia (última verificación en sesión Cursor)

- `npm test` → ~85 pass, 1 skip histórico RED, 0 fail  
- `npm run test:demo-mock` → 4/4  
- `npm run build` / `npm run lint` → OK  

Re-corrélos después del pull; no asumas números exactos si hubo commits nuevos.

---

## 3. Arquitectura de datos (lo que OpenCode debe respetar)

```text
UI (pages/components)
  → src/lib/api.ts | src/lib/adminApi.js  (mismos contratos)
    → dataMode (src/lib/dataMode.js)
      → mock: src/mocks/* + localStorage key candyland.mock.v1
      → api:  fetch(VITE_API_URL + /api/...)
```

### Archivos clave mock

| Path | Rol |
|---|---|
| `src/lib/dataMode.js` | `getDataMode` / `isMockMode` / `getApiBaseUrl` (prod api sin URL = fail-closed) |
| `src/mocks/fixtures.js` | Productos, categorías, admin demo |
| `src/mocks/store.js` | Persistencia `candyland.mock.v1`, stock/carrito/pedidos |
| `src/mocks/publicApi.js` | Catálogo, carrito, checkout, forms públicos |
| `src/mocks/adminApiMock.js` | Login, CRUD, cancel + restore stock |
| `src/lib/adminApiError.js` | Error compartido (extraído al cablear mock) |
| `.env.example` | `VITE_DATA_MODE=mock` por defecto |

### Credenciales admin demo (solo mock)

```text
email: admin@candyland.demo
password: demo
ruta: /admin/login
```

Auth mock ≠ seguridad real. Token en lista local `adminTokens` con expiración.

### Reset estado mock

Borrar `localStorage` key `candyland.mock.v1` (o ventana privada).

### Modo API opcional (no es el demo)

```bash
cd backend && npm install && cp .env.example .env
npm run prisma:generate
npx prisma migrate dev          # solo local
npm run db:seed
npm run create-admin            # ADMIN_EMAIL / ADMIN_PASSWORD
npm run dev                     # :5050

# raíz .env
# VITE_DATA_MODE=api
# VITE_API_URL=http://127.0.0.1:5050
npm run dev
```

Prod/Railway: **solo** `prisma migrate deploy` (nunca `migrate dev` / `db push` en prod).

---

## 4. Decisiones de producto vigentes

- Marca CandyLand, **solo modo claro**.
- Pagos: efectivo / transferencia. Sin Mercado Pago, tarjetas, WhatsApp.
- Sin página `/producto/:id`.
- Imágenes por URL (no upload).
- Tutoriales: tarjetas visuales.
- Menú desde contrato de categorías (mock o API), no hardcode definitivo.
- `backend/` **no borrar**.
- Deploy portfolio = **solo Vercel + mock**.
- OpenSpec parent cerrado como demo-only; revive API = **change nuevo**.

Detalle: `docs/DECISIONES_CERRADAS.md`.

---

## 5. OpenSpec — cómo interpretarlo ahora

| Artifacto | Uso |
|---|---|
| `openspec/changes/2026-06-candyland-v2/` | Ledger histórico (carpeta **no movida**) |
| `archive-parent-demo-only.md` | **Cierre oficial** del parent |
| `archive-demo-mock-first.md` | Slice portfolio mock |
| `verify-demo-mock-first.md` | Smoke Vercel |
| `tasks.md` Op 3.4 | **WAIVED** (Railway no gate) |
| `tasks.md` Op 3.8 | Parent CLOSED |
| `openspec/specs/*` | Specs canónicas históricas; contrastar con `DEMO_MOCK.md` |

**No reabrir** `2026-06-candyland-v2`. Si hay trabajo API/Railway, crear `openspec/changes/<fecha>-...`.

---

## 6. Convenciones de la sesión Cursor (copiar en OpenCode)

- Commits: Conventional Commits; **sin** `Co-authored-by: Cursor` / trailers AI. Si el hook los inyecta: `git commit-tree` + `git reset --soft`.
- **No mergear** PRs sin pedido explícito del dueño.
- **No** force-push a `main`.
- **No** leer `.env` con secretos reales.
- Auditoría pre-merge: docs vs código + tests; en PRs de código usar reviews estructurados.
- Engram: guardar decisiones/bugs; nunca secretos.

---

## 7. Checklist al arrancar en OpenCode

```text
[ ] git pull en main; confirmar PR #23 MERGED (o mergearlo)
[ ] Leer DECISIONES + DEMO_MOCK + este handoff
[ ] codegraph status (o init si falta .codegraph/)
[ ] npm install && npm test && npm run build
[ ] npm run dev → verificar catálogo/carrito/admin mock
[ ] Definir próxima feature (nueva change OpenSpec si es grande)
```

---

## 8. Próximos trabajos sugeridos (fuera del change cerrado)

Elegí uno; no mezclar “revive Railway” con rediseño grande:

1. **Polish UI portfolio** — home/header/footer/móvil alineado a referencia Macarena (`tienda-candyland`).
2. **Enriquecer fixtures mock** — más productos/imágenes realistas; estados empty/error visibles.
3. **Completar smoke UI** — cancel pedido + restore stock en browser (quedó skip).
4. **Nuevo change OpenSpec modo API** — solo si se quiere Railway otra vez (`DEPLOY_RAILWAY_VERCEL.md`).
5. **Actualizar `PROMPT_MAESTRO_OPENCODE.md`** — el archivo histórico aún habla de Railway como obligatorio; preferí este handoff + `DEMO_MOCK.md`.

---

## 9. Prompt listo para pegar en OpenCode

```text
Estoy en CandyLand MVP:
/home/marcos/Escritorio/CandyLand/CandyLand/candyLand-mvp

Referencia visual:
/home/marcos/Escritorio/CandyLand/CandyLand_Macarena/tienda-candyland

Leé en este orden:
1. docs/HANDOFF_CURSOR_OPENCODE.md
2. AGENTS.md
3. docs/DECISIONES_CERRADAS.md
4. docs/DEMO_MOCK.md
5. docs/PLANIFICACION_CANDYLAND_V2.md (fase 0)
6. openspec/config.yaml

Reglas:
- Demo vigente = VITE_DATA_MODE=mock en Vercel; sin Railway/DB obligatorios.
- Conservar backend/ para modo api opcional.
- OpenSpec 2026-06-candyland-v2 está CLOSED (demo-only). Trabajo API nuevo = change nuevo.
- CodeGraph antes de explorar en masa. No leer secretos .env.
- Commits sin atribución AI. No mergear sin que yo lo pida.

Primera tarea:
1) git pull + confirmar que PR #23 está merged (si no, avisame).
2) Resumen de 10 líneas del estado real vs este handoff.
3) Proponé 2–3 siguientes slices chicos y esperá mi elección antes de codear.
```

---

## 10. Links útiles

- Repo: https://github.com/marcostoledo96/candyLand-mvp  
- Demo: https://candy-land-mvp.vercel.app/  
- PR cierre: https://github.com/marcostoledo96/candyLand-mvp/pull/23  
- PRs mock: #19 #20 #21 #22  
- Chat Cursor (contexto): agent transcript bajo el project `candyLand-mvp` si hace falta detalle fino  

## 11. Fuera de alcance de esta handoff

- No documenta valores de secretos ni URLs privadas no ya públicas.
- No reemplaza `DEPLOY_RAILWAY_VERCEL.md` para un revive API.
- No cierra ítems históricos abiertos del `tasks.md` pre-pivot (muchas casillas viejas quedan como ledger; la autoridad de producto es `DEMO_MOCK.md` + este handoff).
