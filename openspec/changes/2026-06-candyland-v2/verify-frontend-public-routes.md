# Verification Report: Frontend Public Routes

**Change**: `2026-06-candyland-v2`  
**Branch slice**: `frontend/nuevas-rutas-macarena`  
**Mode**: Strict TDD verify, frontend-safe execution only  
**Artifact store**: hybrid (OpenSpec + Engram)

## Completeness

| Metric | Value |
|---|---:|
| Branch-scoped 7c implementation tasks | 24 complete / 0 incomplete |
| Verification/archive tasks in 7c | 1 completed during verify, 3 still open in tasks artifact |
| Broad parent UI backlog tasks | Not judged for this branch slice |

Notes:
- 7c phases 1-8 and 9.1 are checked in `tasks.md` and match the inspected implementation.
- 7c.9.4 browser DOM checks were executed during this verify phase, but `tasks.md` remains unchecked because this phase did not edit task checkboxes.
- 7c.9.2 and 7c.9.3 backend local/curl smokes were skipped because this verification was explicitly constrained to avoid backend Prisma generate, secrets, and production/shared DB access.
- 7c.9.5 remains an archive-phase documentation handoff.

## Build & Tests Execution

| Command | Result | Evidence |
|---|---|---|
| `npm run assert:public-routes` | Passed | Static route/form contract script reported `assert-public-routes: PASS`; package script now fails on assertion errors. |
| `node scripts/assert-public-routes.mjs` | Passed | Direct fatal execution reported `assert-public-routes: PASS`. |
| `npm run lint` | Passed | ESLint completed with no reported errors. |
| `npm run build` | Passed | Vite built 82 modules in 1.31s; new route chunks emitted. |
| Local Vite + Playwright smoke | Passed | Mocked public API responses; verified route render, menu filtering, no product-detail links, no jobs file input, mobile nav parity, form error preservation, and success clearing. |

Coverage analysis: not available; the project has no configured coverage runner for this frontend slice.

## TDD Compliance

| Check | Result | Details |
|---|---|---|
| TDD Evidence reported | ✅ | `apply-progress` contains a TDD Cycle Evidence table. |
| Test file exists | ✅ | `scripts/assert-public-routes.mjs` exists and was executed directly. |
| GREEN confirmed | ✅ | Direct assertion script, lint, build, and browser smoke passed. |
| RED history confirmed | ⚠️ | Apply report says the script failed before implementation; current working tree cannot independently replay that historical RED state. |
| Assertion quality | ✅ | No tautologies/ghost loops found; `package.json` runs the script directly so assertion failures block. |
| Runtime smoke | ✅ | Playwright smoke covered key DOM/user-flow invariants without DB/secrets. |

## Test Layer Distribution

| Layer | Tests / Checks | Files / Tool |
|---|---:|---|
| Static source-contract | 70+ checks | `scripts/assert-public-routes.mjs` |
| Lint/type/build | 2 commands | `npm run lint`, `npm run build` |
| Browser smoke | 8 route/form/menu/mobile invariants | Playwright MCP against local Vite dev server with mocked API |
| Backend/live DB | 0 | Skipped by safety constraints |

## Spec Compliance Matrix

| Requirement | Scenario | Evidence | Result |
|---|---|---|---|
| Public navigation parity | Header links resolve | Static assertions + browser route smoke for `/menu`, `/tutoriales`, `/franquicias`, `/trabaja-con-nosotros`, `/contacto`; no `#` nav anchors found. | ✅ COMPLIANT |
| Public navigation parity | Mobile nav parity | Playwright 390px viewport: hamburger opens and all desktop route hrefs are present. | ✅ COMPLIANT |
| Menu page consumes categories API | Loading and success | `MenuPage` calls `fetchCategories`; Playwright mocked API rendered active category with count and filtered inactive category. | ✅ COMPLIANT |
| Menu page consumes categories API | Error and empty | Playwright mocked 500 error rendered alert + retry; mocked empty array rendered empty state. | ✅ COMPLIANT |
| Tutorials are static visual cards | Static render | Static assertions + browser smoke: 6 images with non-empty `alt`; no fetch/API calls in `TutorialesPage`. | ✅ COMPLIANT |
| Contact form posts to API | Successful submit | Playwright mocked second `POST /api/contact` success; form cleared after success. | ✅ COMPLIANT |
| Contact form posts to API | Validation and error | Source validation present; Playwright mocked first `POST /api/contact` 500 and verified valid input was preserved. | ✅ COMPLIANT |
| Franchise form posts to API | Successful submit | Playwright mocked `POST /api/franchise/leads` success and verified form cleared. | ✅ COMPLIANT |
| Franchise form posts to API | Error state | Playwright mocked first franchise submit 500 and verified valid input was preserved. | ✅ COMPLIANT |
| Jobs form uses optional cvUrl, no upload | Submit with cvUrl | Playwright filled `cvUrl`, mocked jobs submit failure then success, and verified preservation/clearing behavior. | ✅ COMPLIANT |
| Jobs form uses optional cvUrl, no upload | No file input | Static assertion + Playwright DOM: `input[type="file"]` count is 0. | ✅ COMPLIANT |
| Accessibility, mobile-first, light-only | Form labels and focus | Static/source inspection: labels present; shared CSS includes `:focus-visible`; no dark-mode patterns found. | ✅ COMPLIANT |

## Correctness (Static Evidence)

| Area | Status | Notes |
|---|---|---|
| API helpers in `src/lib/api.ts` | ✅ | Adds typed category/form contracts and public POST helpers through the API layer. |
| Routes in `src/App.tsx` | ✅ | Adds required routes plus `/tienda`, `/nuestros-dulces`, and `/checkout` aliases; no `/producto/:id`. |
| Header/Footer nav | ✅ | Header and Footer use React Router links; no fake newsletter form remains. |
| Menu page | ✅ | Filters `activeProductCount > 0`; loading/error/empty/success paths exist. |
| Tutoriales page | ✅ | Static visual cards only; no backend/CMS dependency. |
| Contact/Franchise/Jobs forms | ✅ | POST helpers wired; preserve on error and clear on success. |
| Forbidden scope | ✅ | No actual file input, `/producto/:id` route/link, dark mode, WhatsApp, Mercado Pago, or card payment scope found. |
| Static assertion determinism | ✅ | Direct node script is deterministic and fatal; npm script wrapper runs it directly. |

## Design Coherence

| Design decision | Followed? | Notes |
|---|---|---|
| Frontend-only React Router slice | ✅ | No backend/DB/deploy code changed in this slice. |
| API calls through `src/lib/api.ts` | ✅ | Public form/category helpers live in `api.ts`. |
| Local `useState` forms | ✅ | Implemented per page/component without new abstraction. |
| Shared compact CSS module | ✅ | New pages share `PublicRoutes.module.css`. |
| Footer social placeholders inert unless real URLs exist | ✅ | Rendered as labeled inert spans. |
| Runtime smoke/manual pass | ✅ | Automated Playwright smoke substituted for manual DOM checks safely. |

## Issues Found

### CRITICAL

None.

### WARNING

1. Review budget is exceeded. Current working tree is about 1,704 changed lines including OpenSpec artifacts, or about 1,314 changed lines for app/test/package files; both exceed the 800-line budget.
2. Backend/curl smoke was not executed because the prompt forbids backend Prisma generate and production/shared DB access; form endpoint behavior was verified with browser-level mocked API responses instead.
3. `tasks.md` still has 7c verification/archive checkboxes open even though browser DOM checks were completed in this verify pass.

### SUGGESTION

1. Add `name`/`autocomplete` attributes consistently to public form inputs in a follow-up polish pass.
2. Consider optimizing large tutorial images before deploy; `tutorial5` emits a ~4.8 MB asset in the production build.

## Review Budget

| Scope | Changed lines |
|---|---:|
| Modified tracked files | 433 |
| New/untracked OpenSpec artifacts | 321 |
| New/untracked app/test files | 950 |
| Total working-tree review surface | ~1,704 |

The configured 800-line review budget is exceeded. This is not a functional blocker, but it is a review-risk warning for single-PR delivery.

## Verdict

**PASS WITH WARNINGS**

The frontend public-routes slice conforms to the OpenSpec delta and design under the allowed verification constraints. Mandatory frontend checks passed, and browser smoke covered the critical route/menu/form invariants without touching secrets or shared databases.
