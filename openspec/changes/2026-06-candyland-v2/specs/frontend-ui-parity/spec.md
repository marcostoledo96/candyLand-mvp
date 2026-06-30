# Delta for frontend-ui-parity

Branch: `frontend/nuevas-rutas-macarena` · Scope: public routes + connected forms · Backend unchanged.

## ADDED Requirements

### Requirement: Public navigation parity

Header and Footer MUST route to real public pages via React Router: `/menu`, `/tutoriales`, `/franquicias`, `/trabaja-con-nosotros`, `/contacto`, `/catalogo`. Placeholder anchors (`#tutoriales`, `#franquicias`, etc.) MUST NOT remain in production nav. `/tienda` and `/nuestros-dulces` MAY alias `/catalogo`.

#### Scenario: Header links resolve
- GIVEN a user is on any public page
- WHEN they click a Header nav item
- THEN the app navigates to a real mounted route (no `#`-anchors, no 404)

#### Scenario: Mobile nav parity
- GIVEN the mobile viewport
- WHEN the mobile menu is open
- THEN every desktop route MUST be reachable from the mobile menu

### Requirement: Menu page consumes categories API

`/menu` MUST fetch `GET /api/categories` and render loading, error, empty, and success states. It MUST NOT link to product detail (`/producto/:id`). Menu is category-led; product grid stays in `/catalogo`.

#### Scenario: Loading and success
- GIVEN the API is reachable
- WHEN the user opens `/menu`
- THEN a loading state MUST show, then active categories render with their active product count

#### Scenario: Error and empty
- GIVEN the API fails OR returns no active categories
- WHEN `/menu` renders
- THEN an error state (with retry) OR an empty state MUST show, respectively

### Requirement: Tutorials are static visual cards

`/tutoriales` MUST render visual cards only. It MUST NOT call any backend and MUST NOT require a CMS.

#### Scenario: Static render
- GIVEN the tutorials page is opened
- WHEN it mounts
- THEN visual cards render from static assets with no network request

### Requirement: Contact form posts to API

`/contacto` MUST submit to `POST /api/contact`, validate required fields (name, email, message), and show loading, error, and success states.

#### Scenario: Successful submit
- GIVEN the user fills required fields
- WHEN they submit
- THEN the form posts to `/api/contact` and shows success feedback

#### Scenario: Validation and error
- GIVEN required fields are empty OR the API returns an error
- WHEN the user submits
- THEN inline validation OR an error state MUST show without clearing valid input

### Requirement: Franchise form posts to API

`/franquicias` MUST submit to `POST /api/franchise/leads`, validate required fields (fullName, email, city), and show loading, error, and success states.

#### Scenario: Successful submit
- GIVEN required fields are filled
- WHEN the user submits
- THEN the form posts to `/api/franchise/leads` and shows success feedback

#### Scenario: Error state
- GIVEN the API returns an error
- WHEN the user submits
- THEN an error state MUST show with retry, preserving valid input

### Requirement: Jobs form uses optional cvUrl, no upload

`/trabaja-con-nosotros` MUST submit to `POST /api/jobs/applications`, validate required fields (fullName, email, position), and show loading, error, and success states. File upload MUST NOT be offered. `cvUrl` is an OPTIONAL text field only.

#### Scenario: Submit with cvUrl
- GIVEN the user fills required fields and a URL in cvUrl
- WHEN they submit
- THEN the form posts successfully with cvUrl included

#### Scenario: No file input
- GIVEN the jobs page is rendered
- WHEN inspecting the form
- THEN no `<input type="file">` MUST be present

### Requirement: Accessibility, mobile-first, light-only

Public pages MUST be mobile-first, light-mode only, and meet accessibility basics: labels on inputs, alt on images, focus-visible, semantic buttons. Dark mode MUST NOT be added.

#### Scenario: Form labels and focus
- GIVEN any public form renders
- WHEN a user tabs through it
- THEN every field MUST have a label and visible focus state