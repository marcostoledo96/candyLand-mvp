# Archive — Parent change closed (demo-only final)

## Result

- **Status:** CLOSED by product supersession
- **Change:** `2026-06-candyland-v2`
- **Date:** 2026-07-28
- **Actor:** product owner (Marcos) — explicit choice **“1. Demo-only final”** after PR #22 merge
- **Mode:** documentation only; no provider mutation, no Railway QA executed

## Decision

The portfolio goal is **complete** as a Vercel mock-first demo.  
Railway / PostgreSQL / API-mode production evidence (PD-01..PD-07 provider path) is **out of scope as a closure gate**.

`backend/` remains in the repository for optional `VITE_DATA_MODE=api` later; that work is a **new OpenSpec change** if revived, not a reopen of this parent.

## PD-08 closure review

| Item | Outcome |
|---|---|
| Portfolio demo evidence | Satisfied — `verify-demo-mock-first.md`, PRs #19–#21 |
| Docs / README / DEMO_MOCK | Satisfied — including PR #21 audit fixes and #22 reconcile |
| PD-01..PD-07 Railway writes / migrate / seed / rollback QA | **Waived** by product supersession (not “missing unnoticed”) |
| Parent folder move / main-spec merge | **Not performed** — per-slice convention; folder retained as historical ledger |
| Parent status | **CLOSED** |

This supersedes the prior rule that the parent MUST stay open until Railway production evidence exists.

## Related artifacts

- `archive-demo-mock-first.md` — portfolio slice
- `docs/DECISIONES_CERRADAS.md` — decision recorded
- `docs/DEMO_MOCK.md` — contract remains authoritative for demo
- `tasks.md` Ops 3.4 waived; 3.8 parent closed

## Next work (outside this change)

Any future API-mode deploy QA should open a **new** change under `openspec/changes/`, referencing `docs/DEPLOY_RAILWAY_VERCEL.md`.
