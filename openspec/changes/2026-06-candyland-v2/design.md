# Design: CandyLand v2 — Production Deploy QA

## Technical Approach

Close PD-01..08 minimally: delete the public diagnostic, version Railway commands, retain Vercel configuration, add dependency-free read-only smoke/evidence tooling, and document gates. This phase performs no provider mutation, deploy, migration, Git action, CLI setup, or secret access.

## Architecture Decisions

| Decision | Choice and rationale | Rejected |
|---|---|---|
| Diagnostic | Delete `/api/env-check`; health endpoints already cover liveness/DB reachability safely. | Auth/dev gate: needless surface. |
| Railway authority | Add root `railway.json`; retain dashboard Root Directory=`backend`. Config-as-code overrides dashboard commands and makes order reviewable. | Dashboard-only commands drift. |
| Exact release | Build `npm ci --include=dev && npm run prisma:generate`; pre-deploy `npx prisma migrate deploy`; start `npm start`; health path `/api/health`. Failed build/pre-deploy prevents the new start. | Migration in build/start; seed; `db push`. |
| Vercel | Keep `vercel.json`/`.vercelignore`; assert build=`npm run build`, output=`dist`, no `/api` rewrite/DB command, and API handlers ignored. | Linking/provider edits. |
| Evidence | One Node script performs four public GETs and emits metadata, never payloads. | Payload capture; dependency. |

## Data Flow

```text
local static/backend tests -> human release approval -> Railway build
  -> approved migrate deploy -> backend start/health -> public GET smoke
  -> redacted evidence + Vercel assertion -> verify -> archive/parent closure
```

## File Changes

| File | Action | Description |
|---|---|---|
| `backend/app.js` | Modify | Delete `/api/env-check`. |
| `backend/test/env-check-removed.test.js` | Create | Prove 404, no DB call, and no sentinel/stack/provider leak. |
| `railway.json` | Create | Version build, pre-deploy, start, and health path. |
| `scripts/smoke-production.mjs` | Create | Public GET-only runner for health, DB health, products, categories. |
| `test/production-deploy-qa.test.mjs` | Create | RED config, GET-only, failure, and redaction tests. |
| `package.json` | Modify | Add focused assertion/smoke scripts; no dependency change. |
| `docs/DEPLOY_RAILWAY_VERCEL.md`, `README.md` | Modify | Runbook, gates, evidence, rollback; fix stale wording. |
| `openspec/changes/2026-06-candyland-v2/{tasks.md,verify-production-deploy-qa.md,archive-production-deploy-qa.md}` | Modify/Create later | Scenario traceability and closure evidence. |

## Interfaces / Contracts

Smoke input is one public HTTPS API base URL. Requests are exactly `GET /api/health`, `/api/db/health`, `/api/productos`, `/api/categories`, without auth/body/cookie/query. Failure records `fail`, blocks closure, and never causes a write.

Evidence schema: `{revision, observedAt, checks:[{method,path,status,result}], providers:[{name,state,reference}], approvals:[{action,actor,approvedAt}], skipped:[{action,reason}], redactions[]}`. Omit bodies, headers, cookies, queries, environment/provider values, logs/stacks, and credentials.

## Testing Strategy

| Layer | What / approach |
|---|---|
| Backend | Real HTTP against stubbed app: `/api/env-check` is 404 and leak-free. |
| Static/unit | `node:test` parses Railway/Vercel/package config and injects fake fetch into smoke/redaction logic. |
| Integration | Existing backend tests, Prisma validate/generate with dummy URL, root tests/lint/build. |
| Production smoke | Four public GETs. Migration, seed, writes, rollback, linking/config changes require human approval. |

## Threat Matrix

| Boundary | Applicability | Design response | Planned RED tests |
|---|---|---|---|
| Documentation-like paths | N/A: no classification | Inert runbook | None |
| Git repository selection | N/A: no Git commands | Fixed paths | None |
| Commit state | N/A: no commit automation | — | None |
| Push state | N/A: no push automation | — | None |
| PR commands | N/A: no PR automation | — | None |

## Migration / Rollout / Rollback

Automatic later: repository tests/build, config inspection, then post-promotion public smoke. This design runs none. A human must approve the pre-deploy production migration; authenticated writes remain skipped until separately bounded.

Pre-deploy failure leaves the prior release serving. Regression rolls providers back. Keep the nullable forward migration; never drop columns/index during response—ship a forward fix. Switching email to `noop` needs approval.

Closure requires 404 proof, Railway root/release evidence, Vercel assertions, four passing GETs, approval/skipped ledger, rollback references, reconciled docs/OpenSpec/Engram, verify, and archive. Otherwise the parent stays open.

Forecast: planning 260 + implementation/tests 420 + docs 180 + verify/archive 180 + reserve 260 = **~1,300 lines**. At **2,400** pause/reforecast; **2,600** prepare split; **>2,800** hard-split optional docs polish only; **3,000 forbidden**. Tests, redaction, approval gates, rollback, verify, and archive never defer.

Decision needed before apply: No  
Chained PRs recommended: No  
400-line budget risk: High

## History

Supersedes checkout-hardening as the active rolling design only. Prior specs, verify/archive files, and Engram revisions remain authoritative history.

## Open Questions

None.

## Result Contract

- **status**: success
- **executive_summary**: Minimal PD-01..08 design deletes the leak, versions deterministic Railway commands, preserves Vercel separation, and gates all production writes behind approval.
- **artifacts**: `openspec/changes/2026-06-candyland-v2/design.md`; Engram `sdd/2026-06-candyland-v2/design`
- **next_recommended**: sdd-tasks
- **risks**: Railway Root Directory remains dashboard state; merge can trigger an approved migration; provider rollback/config evidence requires authenticated access
- **skill_resolution**: paths-injected — sdd-design, deploy-to-vercel, cognitive-doc-design, nodejs-backend-patterns, supabase-postgres-best-practices, karpathy-guidelines, ponytail; shared conventions
