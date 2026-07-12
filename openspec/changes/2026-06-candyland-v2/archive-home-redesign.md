# Archive — Frontend Home Redesign

**Change**: `2026-06-candyland-v2`
**Slice / branch**: `7e. Frontend home redesign` / `frontend/home-redesign`
**Archive date**: 2026-07-12
**Mode**: per-slice archive (project convention)
**Verdict**: PASS WITH WARNINGS — closed for this slice

## Intent (recap)

Align `/` with the `tienda-candyland` reference using native React/CSS only,
without touching the catalog, the public routes (slice 7c) or the admin
slices. Scope: `HeroCarousel` (3 local slides), API-driven
"Nuestros Productos" (≤ 6 cards), 2 featured banners, "Nuestro Mundo
Dulce" decorative section, and decorative Locations. Mobile-first,
light-only, accessible, no new dependencies, no Header/Footer redesign,
no `/producto/:id`, no dark mode, no WhatsApp, no payment flow.

## Spec merge / file move policy

This branch follows the project's **per-slice archive convention** (same
as slice 7d):

- No delta spec was authored for slice 7e. The verify report explicitly
  records `0/0` formal requirements and `0/0` scenarios because the
  slice reused scenarios from the existing
  `openspec/specs/frontend-ui-parity/spec.md` (`Menu uses API`,
  `Light mode only`) as traceability anchors. **No spec merge** is
  performed; the main spec stays unchanged.
- The change folder is **not moved** to `openspec/changes/archive/`.
  Per-slice artifacts (proposal, design, spec, tasks, verify, this
  archive) live next to the rest of the active change so future slices
  can cross-reference them. The active change is **not closed**: 42
  broader tasks remain across slices 1, 2.4, 2.8, 3.1, 3.2, 3.4, 4.6,
  5.4, 6.x, 7.1–7.9, 8.4–8.7, 8.9 — this archive documents only
  slice 7e.
- This `archive-home-redesign.md` is the closure artifact for the
  slice.

## Tasks status (slice 7e)

- [x] 1.1 NEW `src/components/HeroCarousel/HeroCarousel.tsx` (3-slide
      prop API, native React/CSS, no new deps).
- [x] 1.2 NEW `src/components/HeroCarousel/HeroCarousel.module.css`
      with `transform: translateX` track, `:focus-visible` ring, and
      `prefers-reduced-motion: reduce` instant transition.
- [x] 1.3 Autoplay via `setInterval(4500)`; pause on `pointerenter` /
      focus / hover or reduced-motion; cleanup on unmount.
- [x] 1.4 Keyboard navigation: `ArrowLeft` / `ArrowRight` cycle,
      `Home` / `End` jump to first/last; prev/next buttons with real
      text labels.
- [x] 1.5 Markup: `role="region" aria-roledescription="carousel"`;
      active slide `aria-hidden="false"`, siblings `true`; live region
      announces slide index.
- [x] 2.1 `Home.tsx` now uses `fetchProducts()` from `src/lib/api.ts`
      instead of the static `productos` array.
- [x] 2.2 Products mapped to `HomeProductCard` props (`img`,
      `hoverImg`, `title`); empty `[]` renders explicit empty state
      with `<Link to="/catalogo">` and zero hardcoded products.
- [x] 2.3 States reuse `PublicRoutes.module.css`; loading renders a
      skeleton (no layout shift); retry button on error.
- [x] 3.1 NEW `src/components/HomeSections/NuestroMundoDulce.tsx` +
      module CSS using `dulzura-central.webp`; light-only, mobile-first.
- [x] 3.2 NEW `src/components/HomeSections/FeaturedBanners.tsx` +
      module CSS with 2 banners (`destacado-golosina1.webp`,
      `destacado-golosina2.webp`) linking to `/catalogo` and `/menu`;
      real `alt` per image.
- [x] 3.3 NEW `src/components/HomeSections/Locations.tsx` + module
      CSS; decorative only, `fondo-locales.webp` background,
      `aria-hidden="true"`.
- [x] 4.1 `Home.tsx` order: `HeroCarousel` → `FeaturedBanners` →
      `NuestrosProductos` → `NuestroMundoDulce` → `Locations`; static
      grid import dropped.
- [x] 4.2 `Home.module.css` extended with section spacing tokens; kept
      `Oswald` title style; no `prefers-color-scheme: dark` tokens.
- [x] 4.3 `Header`, `Footer`, `App.tsx`, `lib/api.ts` not edited.
      **Narrow exception**: `HomeProductCard.tsx` was edited during
      verification to fix the API-image behavior — keep API / data
      URLs unchanged (no synthesized WebP `<source>`) while advertising
      a local WebP source for known local `/img/*.jpg` assets
      (`golosina2.jpg` verified in the browser DOM). The corrective
      edit is approved per bounded review and matches the
      `verify-home-redesign.md` outcome (`API image URL` and
      `Local image WebP` rows both PASS). Task text was left as
      "do not edit" originally; this archive documents the narrow
      exception so future readers do not flag the file as out-of-scope.
- [x] 5.1 `npm run lint` — zero warnings on touched files.
- [x] 5.2 `npm run build` — passes.
- [x] 5.3 NEW `scripts/assert-home-redesign.mjs` wired as
      `assert:home-redesign` in `package.json`; 66 source-contract
      checks: zero `<input type="file">`, zero `/producto/:id`,
      zero `@media (prefers-color-scheme: dark)`, zero new
      `dependencies` / `devDependencies` entries.
- [x] 5.4 Runtime smoke (Playwright against Vite preview with safe API
      mocks): 3 slides, prev/next toggle `aria-hidden`, dots change
      index, ArrowLeft/Right cycle, reduced-motion disables autoplay,
      tab order prev → next → dots → CTAs.
- [x] 5.5 Contract: `fetchProducts()` returning products renders N
      cards (≤ 6); 500 error renders error state with retry; `[]`
      renders explicit empty state with `<Link to="/catalogo">` and
      zero hardcoded products.
- [x] 5.6 Scenario traceability: `Menu uses API`
      (`openspec/specs/frontend-ui-parity/spec.md`) → 5.5;
      `Light mode only` → 5.3.
- [x] 5.7 Verify phase completed; this archive closes the loop.

## Test layer (durable, kept in the candidate)

| Layer | Tests / checks | File / tool |
|---|---:|---|
| Behavioral unit (Node `node:test`) | 17 passing | `test/home-redesign.test.mjs` — imports production helpers `carouselNav.js` and `productStatus.js` |
| Static regression (CI) | 66 source-contract checks | `scripts/assert-home-redesign.mjs` (wired as `npm run assert:home-redesign`) |
| Public-route regression | 91 checks | `npm run assert:public-routes` (kept from slice 7c; no regression) |
| Browser runtime | 14 scenario groups | Playwright (Chromium) against local Vite preview with safe API mocks |
| Lint | pass | `npm run lint` |
| Build | pass | `npm run build` (92 modules, 1.79s) |

The 17-test Node suite is durable and imports the same helpers that
`HeroCarousel.tsx` and `Home.tsx` import and invoke in production. No
test-only duplicate behavior. The slide loop is guarded by an explicit
`SLIDES.length === 3` assertion, so the test cannot pass vacuously.

## Source of truth after this slice

The behavior is captured in:

- `src/components/HeroCarousel/HeroCarousel.tsx` + `.module.css` —
  3-slide accessible carousel, autoplay + pause, reduced-motion
  aware, keyboard-first.
- `src/components/HomeSections/FeaturedBanners.tsx` + `.module.css` —
  2 banners linking to `/catalogo` and `/menu`.
- `src/components/HomeSections/NuestroMundoDulce.tsx` + `.module.css`
  — decorative copy block with `dulzura-central.webp`.
- `src/components/HomeSections/Locations.tsx` + `.module.css` —
  decorative only, `aria-hidden="true"`.
- `src/components/HomeProductCard/HomeProductCard.tsx` — corrective
  edit only (see 4.3 narrow exception).
- `src/pages/Home/Home.tsx` + `Home.module.css` — composition order
  and section spacing tokens.
- `src/lib/carouselNav.js` and `src/lib/productStatus.js` — production
  helpers shared with the test suite.
- `test/home-redesign.test.mjs` — durable Node `node:test` suite.
- `scripts/assert-home-redesign.mjs` — static regression guard.
- `package.json` — `assert:home-redesign` script wired; no new
  dependencies (9 / 11 devDependencies unchanged).

No schema migration, no API change, no Header / Footer / `App.tsx`
edit, no `/producto/:id` route, no dark mode, no WhatsApp, no payment
flow, no new top-level doc, no change-folder move, no spec merge —
minimal and accurate per archive constraints.

## Verification recap (from `verify-home-redesign.md`)

- `npm run lint`: PASS, hash
  `0eb52fc629fd2d9532951a4fd644e6a0e532f50f80f1b837c5220779df2ea15d`.
- `npm run build`: PASS (92 modules, 1.79s), hash
  `f8814a631851c06bdceaf3f98e33ebd912e617666c58a149315bed678eb9a41e`.
- `npm test`: PASS, 17/17, hash
  `30011371d65956df7499e729196e5c4c52059f43cbcbba7136d631a6b1378f92`.
- `npm run assert:home-redesign`: PASS, 66 checks, hash
  `35cd5b5c8e631f989e16c898005e607473424b194dd54f3e5d4362e7fcd7863b`.
- `npm run assert:public-routes`: PASS, 91 checks, hash
  `90ac31dcfe32327037ac94cc2532e8088674f508379dbdafcdf08bce487628bf`.
- Playwright runtime against Vite preview with safe API mocks: PASS
  (loading, error+retry, empty, success ≤ 6, API/data image retained
  unchanged, local `/img/golosina2.jpg` advertises local
  `/img/golosina2.webp`, 3 slides, 3 dots, `aria-hidden` toggles,
  autoplay + hover/focus pause, reduced-motion autoplay disabled and
  transition 0s, tab order correct, controls not clipped, 390px
  responsive, clean console).
- TDD compliance: 7/7 checks pass.
- Critical findings: none. Warnings: 3 (no formal OpenSpec
  requirement / scenario for 7e; `HomeProductCard` corrective edit
  — task 4.3 text now reconciled by this archive; Chromium-only
  browser runtime).
- Scope (corrected, post-archive): actual working-tree diff is
  **1,534 / 2,000** PR review budget = 208 tracked changes (168
  insertions + 40 deletions across 6 files per
  `git diff --shortstat`) + 1,326 untracked lines across 12 new
  files (per `wc -l` over `git ls-files --others --exclude-standard`).
  The earlier `verify-home-redesign.md` figure of `1,119` referred to
  the implementation candidate before the verify artifact and this
  archive file were added; the corrected total above is the actual
  current PR review surface.
- The prior 7e verdict (FAIL on missing durable production-behavior
  test) is superseded by this retry; prior 7e history is preserved
  in `verify-home-redesign.md` and in the Engram revision log.

## Risks / open follow-ups

| Risk | Owner | Mitigation / next step |
|---|---|---|
| No formal OpenSpec requirement / scenario exists for slice 7e | Future maintainer | Add a delta spec for `frontend-ui-parity` if home-redesign scenarios are reviewed again; reuse `Menu uses API` and `Light mode only` anchors. |
| `HomeProductCard.tsx` was edited beyond the original "do not edit" rule in task 4.3 | Archive phase (closed here) | This archive documents the narrow exception (API image behavior). The corrective edit is approved per the bounded-review receipt `review-828c3f3f8ba7e841` (terminal state `approved`); the task text has been reconciled in `tasks.md`. |
| Cross-browser runtime was Chromium-only | Future verify pass | Re-run the Playwright scenario set against Firefox and WebKit when those browsers are available in the local toolchain. |
| Image intrinsic dimensions rely on CSS sizing (CLS) | Future polish | Add `width` / `height` attributes on the carousel and product-card images if Core Web Vitals show measurable CLS. |
| 42 broader tasks remain across slices 1, 2.4, 2.8, 3.1, 3.2, 3.4, 4.6, 5.4, 6.x, 7.1–7.9, 8.4–8.7, 8.9 | Other slices | The active change `2026-06-candyland-v2` stays open. This archive closes only slice 7e. |

## Skills loaded

- `sdd-archive` (this skill).
- `_shared` SDD references (Sections A–D).
- `karpathy-guidelines` (surgical minimum-change: reconcile only the
  lines that are now stale, leave the rest untouched).
- `ponytail` (full): no new `docs/FUNCIONALIDADES.md`, no spec merge,
  no change-folder move, no new top-level doc when an existing one
  already covers the topic.
- `cognitive-doc-design` applied to the surgical updates in
  `docs/MAPA_REFERENCIA.md` (one status cell per row, kept
  scannable).

## Out of scope (deliberate)

- Header / Footer redesign.
- `/producto/:id` route or product-detail screen.
- Dark mode, WhatsApp, Mercado Pago, cards, online payments.
- Asset reorganization or logo decision.
- Backend, DB, deploy, admin changes.
- New dependencies.
- New `docs/FUNCIONALIDADES.md` (functionality already covered by
  `docs/MAPA_REFERENCIA.md`, `docs/AUDITORIA_INICIAL.md`,
  `docs/PLAN_DE_IMPLEMENTACION_DETALLADO.md`, and the OpenSpec
  artifacts — per Ponytail, do not create a new file when existing
  ones already cover the topic).

Ready for the next slice on `2026-06-candyland-v2`.
