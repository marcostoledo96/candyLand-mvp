```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:30f7a0975e45690d5a681c3a0c7462b2b6e9c126a8b293451c1a88190cb449f8
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: "6/8 repository-verifiable subset; production closure pending"
scenarios: "10/16 repository-verifiable subset; 6 production-only pending"
test_command: "NODE_OPTIONS=--require=/tmp/opencode/no-dotenv.cjs npm test"
test_exit_code: 0
test_output_hash: sha256:bcbb4c8646701026372a6bbb706763eabd8fdd0d932f59c61f3548b001209087
build_command: "npm run build"
build_exit_code: 0
build_output_hash: sha256:95ac677f316a7b6f48dcd3857c58466bc9a1a9c1c3886ce35a2e30b847ea4651
```

## Verification Report

**Change**: `2026-06-candyland-v2` — Production Deploy QA  
**Mode**: Strict TDD, hybrid, repository-only, single PR, cap 3,000  
**Verdict**: **PASS WITH WARNINGS for the repository slice. Production closure remains blocked.**

### Completeness

| Metric | Value |
|---|---:|
| PD requirements / scenarios | 8 / 16 |
| Repository-verifiable scenarios passed | 10 / 10 |
| Production-only scenarios pending | 6 / 6 |
| PD tasks complete / total | 11 / 13 |
| Pending tasks | 3.4 provider/data actions; 3.6 archive |

### Executed Evidence

| Check | Result | Output SHA-256 |
|---|---|---|
| PD focused tests | 7/7 PASS | `7652773a2de23c0131cb9124d08a786b1fb4bb7847df29b74eda96051455d9cb` |
| Root tests | 80 PASS, 1 expected historical-RED skip, 0 fail | `bcbb4c8646701026372a6bbb706763eabd8fdd0d932f59c61f3548b001209087` |
| ESLint (`npm run lint`) | PASS | `0eb52fc629fd2d9532951a4fd644e6a0e532f50f80f1b837c5220779df2ea15d` |
| Vite production build | PASS, 110 modules | `95ac677f316a7b6f48dcd3857c58466bc9a1a9c1c3886ce35a2e30b847ea4651` |
| Static contract suite | PASS | `3b9a936987170929ff91c1de739e77417234a76ea56a7088368683eb44dc7643` |
| Backend tests | 12/12 files PASS | `5b49c35a31d5c257f1699f936e185a872e9caf8692dd4e54b5ddb818487008f7` |
| Host/port/CORS runtime tests | 17/17 PASS | `f75a972d436aad51e867deef965f502db42ff0fb7bfce748247f4c99b2e26ad1` |
| Prisma validate + generate, dummy URL | PASS; no DB connection | `847462790fdabd69c2818a320129ff2fdf8e8e1c48ca89707667a384d57738a7` |
| Checkout differential | 4 PASS, 1 expected RED skip; candidate GREEN ran | `9a09a0e198a8de1b801064d2e8ca9fa9c5bc387352b5ed57ece9f062506ca056` |
| Bank matrix | missing/blank/all-zero → CASH-only; valid trimmed values → TRANSFER | `4e739b78f0aaa73a2cebc86db551acde0366d055ab5b6976f4738aaa73f5feea` |
| Checkout Playwright candidate | 16 scenarios, 0 errors; CASH-only hidden + valid transfer retained | runtime result `{scenarios:16, requests:7, errors:[]}` |
| Public production smoke | 4/4 GET 200, redacted | `c084d7f5deda55bcb2044dbc66490d9f2bf58b29721995c2631d77946b36b148` |

Prisma printed its normal `.env` discovery message, but the command injected the dummy `DATABASE_URL`; no value was printed and no real database operation ran.

### Spec Compliance

| Requirement / scenario | Repository result | Production state |
|---|---|---|
| PD-01 Public diagnostic | ✅ COMPLIANT — local HTTP 404, zero DB calls, no URL/provider/stack leak | Candidate only; production removal not claimed |
| PD-01 Database failure | ✅ COMPLIANT for selected deletion design — diagnostic DB path is unreachable | Production behavior not claimed |
| PD-02 Successful release | ✅ COMPLIANT repository contract — exact build → pre-deploy → start/health config | Root Directory and `/railway.json` provider selection pending |
| PD-02 Pre-deploy failure | ✅ COMPLIANT repository ordering contract | Railway non-promotion behavior pending provider evidence |
| PD-03 First eligible release | ⏳ BLOCKED | Production migration not authorized or executed |
| PD-03 Repeated release | ⏳ BLOCKED | No real/shared DB migration replay |
| PD-04 Frontend deployment | ✅ COMPLIANT — frontend-only Vercel config and local build pass | Vercel provider state/variables not inspected |
| PD-04 Cross-origin request | ✅ COMPLIANT repository contract — allowlist parser/runtime tests pass | Production `CORS_ORIGIN` value not inspected |
| PD-05 Healthy smoke | ✅ COMPLIANT — four current-production GETs passed | This observes pre-merge production, not candidate promotion |
| PD-05 Failed smoke | ✅ COMPLIANT — fake 503 records failure, four GETs only, no retry/write | No production failure induced |
| PD-06 Unapproved write | ✅ COMPLIANT — all mutations skipped and recorded | No checkout/admin/provider writes performed |
| PD-06 Approved mutation | ⏳ BLOCKED | No approval, actor, mutation, or rollback evidence |
| PD-07 Post-release regression | ⏳ BLOCKED | Rollback documented, not executed/tested |
| PD-07 Migration regression | ⏳ BLOCKED | Forward-fix policy asserted; no production exercise |
| PD-08 Closure review | ⏳ BLOCKED | PD-01..07 production evidence and archive incomplete |
| PD-08 Missing evidence | ✅ COMPLIANT — parent remains open with missing conditions recorded | Correct current state |

### Repository Contracts

- `railway.json` exactly uses `npm ci --include=dev && npm run prisma:generate`, then `npx prisma migrate deploy`, then `npm start`, with `/api/health`.
- `vercel.json` builds `npm run build` to `dist`; it has no `/api` rewrite or DB command. `.vercelignore` excludes legacy JS/CJS API handlers.
- `scripts/smoke-production.mjs` performs exactly four ordered GETs, sends no body/auth/cookies/query, does not retry, and omits URL/body/header/log/env data from evidence.
- The smoke script applies a native per-request timeout with `AbortSignal.timeout`; a stalled fetch produces redacted failure evidence and a nonzero exit without retries.
- Bank validity currently means all three trimmed values are present and CBU is not all zero. Missing, blank, and all-zero configurations are CASH-only; valid values enable TRANSFER.

### TDD Compliance

| Check | Result | Details |
|---|---|---|
| Apply evidence table | ✅ | Five PD/corrective rows present |
| RED evidence | ✅ | Test files and historical RED descriptions exist |
| GREEN execution | ✅ | Focused, root, backend, differential, and browser checks passed |
| Triangulation | ✅ | Success/failure, missing/all-zero/valid, baseline present/absent cases |
| Safety net | ⚠️ | Initial PD-01 deletion explicitly lacked a pre-edit affected-suite baseline; later full regression is green |

### Test Layers / Coverage / Assertions

| Layer | Related cases | Files |
|---|---:|---:|
| Static/unit | 11 | 2 |
| HTTP integration | 2 | 2 |
| Browser E2E | 16 | 1 |

Coverage analysis skipped — no coverage command/tool is configured.  
**Assertion quality**: ✅ No tautologies, ghost loops, assertion-free production paths, or mock-heavy files found in the changed PD/correction tests.

### Design Coherence

| Decision | Result |
|---|---|
| Delete public diagnostic | ✅ Followed |
| Version exact Railway release order | ✅ Followed in repository |
| Keep Vercel frontend-only | ✅ Followed in repository |
| Dependency-free redacted smoke | ✅ Followed |
| Gate provider/data mutations | ✅ Followed |
| Bank fallback correction | ✅ Followed for missing/blank/all-zero + valid transfer contract |

### Issues

**CRITICAL**: None for the repository slice.  
**WARNING**:
1. Smoke timeout coverage is complete; provider-side deployment evidence remains pending.
2. Bank validation does not reject every malformed or obvious placeholder string; it only enforces present trimmed fields plus non-all-zero CBU. This is outside receipt `review-854a4e825922af36`'s tested missing/blank/all-zero boundary.
3. Strict TDD safety-net history for the initial PD-01 deletion is incomplete.

### Production Blockers

1. Candidate `/api/env-check` removal and bank behavior are not deployed or proven in production.
2. Railway Root Directory, Config File path, variables, deploy, and non-promotion behavior are uninspected.
3. Production migration/replay and optional seed are unperformed.
4. Vercel `VITE_API_URL`, Railway `CORS_ORIGIN`, and provider deployment state are uninspected.
5. Checkout/admin write QA and rollback execution are unapproved and unperformed.
6. PD archive and parent reconciliation remain pending.

### Surface and Next Phase

- Exact post-verify surface: `771 additions + 155 deletions = 926 / 3,000`.
- Projected archive: `801 additions + 155 deletions = 956 / 3,000`, using a fixed 30-line concise archive budget.
- Next: `sdd-archive` for this repository slice only; keep the parent change open and preserve all production blockers above.

### Codex P2 Correction — 2026-07-15

- Order confirmation now rejects a stored `TRANSFER` when current bank-backed availability is CASH-only, before stock, order, cleanup, or email effects; the stale-transfer regression passes.
- Payment availability starts pending on first render. The fieldset and Continue action remain disabled until GET settles; delayed GET proves zero payment/address POST, and 503 exposes an alert plus retry while preserving the stored selection.
- Production smoke now uses native `AbortSignal.timeout` per request (10 seconds by default; positive CLI or non-secret `SMOKE_TIMEOUT_MS` override). A non-settling fake fetch records four redacted `timeout` failures without retry and terminates.
- Correction verification: root **81 pass + 1 expected historical-RED skip**, backend **12/12 files**, focused smoke **7/7**, lint, build (110 modules), static contracts, differential (**4 pass + 1 expected skip**), Prisma validate/generate with dummy URL, Playwright `{scenarios:16, requests:12, errors:[]}`, public smoke **4/4 GET 200**, and `git diff --check` all passed.
- No provider configuration, deploy, migration, seed, write QA, Git commit/push, PR mutation, or merge was performed. Production blockers remain unchanged.
