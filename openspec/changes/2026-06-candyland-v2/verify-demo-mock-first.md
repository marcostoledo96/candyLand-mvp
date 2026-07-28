# Verify — Demo mock-first (post-merge production smoke)

**Date:** 2026-07-28 (updated after README PR #21)  
**Parent:** `2026-06-candyland-v2` (**CLOSED** — demo-only final)  
**Deploy:** `https://candy-land-mvp.vercel.app/` on `main` @ `642c404` (includes PRs #19–#21)  
**Mode:** `VITE_DATA_MODE` default mock (no Railway/DB required)

## Verdict

**PASS WITH NOTES** for the portfolio demo path.  
Slice archived in `archive-demo-mock-first.md`. Parent later **CLOSED** as demo-only final (`archive-parent-demo-only.md`).

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

Re-verified 2026-07-28 during PR #20 audit; README path reconciled in PR #21:

- `npm run test:demo-mock` — **4/4**
- Full `npm test` — **85 pass**, 1 expected skip (historical RED), **0 fail**
- `npm run build` — PASS
- Production bundle contains mock fixtures (`Frutales`, `candyland.mock`); no `railway.app` in client JS

## Docs reconciled after smoke

- Root `README.md` leads with mock-first onboarding (install, admin demo, `candyland.mock.v1` reset, API optional with seed/`create-admin`/prod migrate rules).
- `docs/DEMO_MOCK.md`, `docs/DECISIONES_CERRADAS.md`, `docs/INDEX.md`.

## Closure follow-up

- Railway/API QA waived for parent closure (`tasks.md` 3.4 / 3.8; `archive-parent-demo-only.md`).
- Revive of API mode = new OpenSpec change, not a reopen of this parent.

## Source of truth

- `docs/DEMO_MOCK.md`
- `docs/DECISIONES_CERRADAS.md` (pivot + demo-only closure 2026-07-28)
- `archive-demo-mock-first.md`
- `archive-parent-demo-only.md`
- PR #19 merge `07b7690`; docs PRs #20 / #21 / #22; tip at closure prep `830c0f8`
