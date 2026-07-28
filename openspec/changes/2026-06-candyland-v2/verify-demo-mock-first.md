# Verify — Demo mock-first (post-merge production smoke)

**Date:** 2026-07-28  
**Parent:** `2026-06-candyland-v2` (remains open)  
**Deploy:** `https://candy-land-mvp.vercel.app/` on `main` @ `07b7690` (PR #19)  
**Mode:** `VITE_DATA_MODE` default mock (no Railway/DB required)

## Verdict

**PASS WITH NOTES** for the portfolio demo path.

## Production UI smoke (browser)

| Step | Result | Evidence (redacted) |
|---|---|---|
| Catalog `/catalogo` | PASS | Mock products rendered (e.g. Caramelos Frutales, filters by category) |
| Add to cart | PASS | `localStorage.cartId` set; mock cart 1 item |
| Cart `/carrito` | PASS | Line + total $1200 |
| Checkout address → payment → confirm | PASS | Order `DEMO-00001`; UI “Tu pedido fue confirmado”; stock product id 1: 50→49 |
| Admin login | PASS | Demo credentials note visible; session authorized |
| Admin products | PASS | Stock 49 shown for Caramelos Frutales |
| Admin orders | PASS | `DEMO-00001` listed as Pendiente / Efectivo |
| Admin cancel + stock restore (UI) | SKIPPED | Interrupted waiting on browser approval |
| Admin cancel + stock restore (unit) | PASS | `test/demo-mock.test.mjs` — cancel restores +1 stock; forged `.mock` tokens rejected |

No secrets, response bodies, or PII beyond demo labels were recorded.

## Automated checks (repository)

Re-verified 2026-07-28 during PR #20 audit:

- `npm run test:demo-mock` — **4/4**
- Full `npm test` — **85 pass**, 1 expected skip (historical RED), **0 fail**
- `npm run build` — PASS
- Production bundle contains mock fixtures (`Frutales`, `candyland.mock`); no `railway.app` in client JS

## Deferred (parent stays open)

- Railway provider config / migrate / API-mode QA (`tasks.md` item 3.4)  
- Parent OpenSpec closure (PD-08) until API path evidence exists **or** product decides demo-only is final  

## Source of truth

- `docs/DEMO_MOCK.md`  
- `docs/DECISIONES_CERRADAS.md` (pivot 2026-07-28)  
- PR #19 merge commit `07b7690`
