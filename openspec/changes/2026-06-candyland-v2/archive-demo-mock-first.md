# Archive — Demo mock-first (portfolio path)

## Result

- **Status:** success with deferred Railway path
- **Parent:** `2026-06-candyland-v2` remains **open**
- **Mode:** documentation + prior code already on `main` (PRs #19–#21)
- **Scope:** reconcile the 2026-07-28 mock-first pivot for the Vercel portfolio demo; do **not** close the parent

## What shipped (already on main)

| PR | Topic | Tip / note |
|---|---|---|
| #19 | `feat(demo)` mock adapters + store + admin demo | merge `07b7690` |
| #20 | production UI smoke evidence | `verify-demo-mock-first.md` |
| #21 | README mock-first + audit onboarding fixes | merge `642c404` |

## Portfolio path — reconciled

- Deploy demo: Vercel frontend-only; `VITE_DATA_MODE=mock` (or absent).
- No Railway / Postgres / `VITE_API_URL` required for portfolio.
- Contracts: `docs/DEMO_MOCK.md`, `docs/DECISIONES_CERRADAS.md`, root `README.md`, `AGENTS.md`.
- Evidence: `verify-demo-mock-first.md` (catalog→checkout→admin; cancel+stock restore covered by unit tests).
- `backend/` retained for optional `VITE_DATA_MODE=api`.

## PD-01..PD-08 under the pivot

| PD | Portfolio demo | Railway / API mode |
|---|---|---|
| PD-01..PD-07 provider writes | N/A for mock deploy | **BLOCKED / deferred** (`tasks.md` 3.4) |
| PD-05 public API smoke | Not required for mock Vercel | Optional when API mode is revived |
| PD-08 | **Partial:** mock path + docs reconciled in this archive | Parent **stays open** until API evidence **or** explicit product decision that demo-only is final |

## Explicit non-closure

Per `specs/ops/production-deploy-qa/spec.md` PD-08: parent MUST NOT close while required production (API-mode) evidence for PD-01..PD-07 is absent, unless product supersedes that gate.

**Decision still needed from product:** keep parent open for future Railway QA, **or** declare demo-only final and close with a recorded supersession.

## Source of truth

- `docs/DEMO_MOCK.md`
- `verify-demo-mock-first.md`
- `tasks.md` (Ops 3.4 deferred; demo slice archived here)
- No main-spec merge and no parent-folder move.
