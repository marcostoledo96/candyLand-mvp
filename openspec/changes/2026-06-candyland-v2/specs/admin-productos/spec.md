# Delta — Admin categories, orders, and product form

## Scope

The original requirements cover protected category/order endpoints. Later requirements add the product-form UI and the category-management UI as separate frontend slices. Public forms, payment/stock/email checkout changes, and public product detail remain out of scope.

## ADDED Requirements

### Requirement: Admin Category Management

The system MUST expose admin-only CRUD endpoints for categories protected by the admin token. Mutations MUST validate input and reject duplicate names. Deletion MUST be blocked while products reference the category.

#### Scenario: List categories as admin
- GIVEN a valid admin token
- WHEN `GET /api/admin/categories`
- THEN the system MUST return all categories with id, name, slug and active flag.

#### Scenario: Create category
- GIVEN a valid admin token and a non-existing name
- WHEN `POST /api/admin/categories` with `{ name }`
- THEN the system MUST create the category and return 201 with the new record.

#### Scenario: Duplicate category name rejected
- GIVEN a category named "Gomitas" exists
- WHEN `POST /api/admin/categories` with `{ name: "Gomitas" }`
- THEN the system MUST return 409 and MUST NOT create a duplicate.

#### Scenario: Update category
- GIVEN a valid admin token and an existing category
- WHEN `PATCH /api/admin/categories/:id`
- THEN the system MUST update allowed fields and return the updated record.

#### Scenario: Delete category with products blocked
- GIVEN a category has products referencing it
- WHEN `DELETE /api/admin/categories/:id`
- THEN the system MUST return 409 and MUST NOT delete the category.

#### Scenario: Delete category without products
- GIVEN a category has no referencing products
- WHEN `DELETE /api/admin/categories/:id`
- THEN the system MUST delete it and return 204.

#### Scenario: Unauthenticated admin category mutation
- GIVEN no admin token
- WHEN any admin category mutation endpoint is called
- THEN the system MUST return 401.

#### Scenario: Invalid category input
- GIVEN a valid admin token and empty/missing name
- WHEN `POST /api/admin/categories`
- THEN the system MUST return 400 with a validation error.

### Requirement: Admin Order Management

The system MUST expose admin-only endpoints to list and update orders. Listing MUST support optional status filtering. Status updates MUST validate against an allowlist. Responses MUST include enough detail for a future admin UI (items, totals, payment method, contact, status).

#### Scenario: List orders as admin
- GIVEN a valid admin token
- WHEN `GET /api/admin/orders`
- THEN the system MUST return a list of orders with id, status, total, payment method, contact and items summary.

#### Scenario: Filter orders by status
- GIVEN a valid admin token and orders with various statuses
- WHEN `GET /api/admin/orders?status=pendiente`
- THEN the system MUST return only orders matching the requested status.

#### Scenario: Update order status with valid value
- GIVEN a valid admin token and an order with status "pendiente"
- WHEN `PATCH /api/admin/orders/:id` with `{ status: "enviado" }`
- THEN the system MUST update the order status and return the updated order.

#### Scenario: Update order status with invalid value
- GIVEN a valid admin token
- WHEN `PATCH /api/admin/orders/:id` with `{ status: "desconocido" }`
- THEN the system MUST return 400 and MUST NOT modify the order.

#### Scenario: Unauthenticated admin order access
- GIVEN no admin token
- WHEN any admin order endpoint is called
- THEN the system MUST return 401.

#### Scenario: Order detail for admin UI
- GIVEN a valid admin token and an order exists
- WHEN `GET /api/admin/orders/:id`
- THEN the system MUST return order, items (with product reference, quantity, unit price), totals, payment method and contact fields.

## Prior Backend Slice Out of Scope (preserved)

These boundaries apply to the preceding backend scope, not this product-form addition.

- Public form/checkout endpoints.
- Admin UI screens.
- Payment integrations.
- Stock or email checkout changes.
- Public product detail page `/producto/:id`.

## ADDED Requirements (Product Form Slice)

### Requirement: Admin Product Form Data and Validation

The authenticated admin UI MUST provide one create/edit dialog. Create MUST default `active` to true; edit MUST initialize from the selected product DTO, without a detail request or stale-data merge. It MUST submit `title`, positive-integer `categoryId`, whole-peso `price` converted exactly to integer `priceCents` (`pesos * 100`), nonnegative integer `stock`, `active`, and optional `description`, `imageUrl`, and `hoverImageUrl`. URL fields MUST be text-only and MAY be empty; nonempty values MUST use `http:`, `https:`, or base64 `data:image/(png|jpeg|webp|gif)`. The dialog MUST NOT render file-upload controls.

#### Scenario: APF-01 Create a valid product
- GIVEN categories are available and required values are valid
- WHEN the admin saves a new product with whole pesos
- THEN the request contains integer `priceCents` exactly equal to pesos times 100
- AND optional blank fields follow the API contract

#### Scenario: APF-02 Edit from the list DTO
- GIVEN an existing product row is selected
- WHEN the edit dialog opens and is saved
- THEN it uses that DTO as its initial state and PATCHes that product ID
- AND it does not request a product-detail endpoint or silently merge newer data

#### Scenario: APF-03 Block invalid local input
- GIVEN price is fractional/invalid, stock is negative/non-integer, categoryId is invalid, or an image URL is unsafe
- WHEN the admin submits
- THEN the dialog MUST show local field feedback and MUST NOT send a mutation

### Requirement: Read-Only Category Options

The dialog MUST load read-only category options. It MUST expose loading, retryable error, empty, and success states; while no valid category can be selected, it MUST prevent submission.

#### Scenario: APF-04 Show category options
- GIVEN category loading is pending
- WHEN the dialog opens
- THEN it MUST announce loading and prevent saving

#### Scenario: APF-05 Populate category options
- GIVEN category loading succeeds with one or more categories
- WHEN the dialog is ready
- THEN it MUST present their IDs/names in the category selector

#### Scenario: APF-06 Handle category loading failure or emptiness
- GIVEN category loading fails or returns no categories
- WHEN the dialog is displayed
- THEN it MUST show the respective error/retry or empty state and block saving

### Requirement: Form Submission Outcomes

The dialog MUST prevent duplicate submission while a mutation is pending. On success it MUST refresh the list and close. On backend 400, it MUST preserve inputs and render `error` plus every backend `errors: string[]` member; it MAY associate only unambiguous field-prefixed messages with a field and MUST show others in a form summary. On 401 it MUST preserve inputs until the existing session-expiry flow redirects to login.

#### Scenario: APF-07 Save success
- GIVEN a valid create or edit request resolves successfully
- WHEN the response arrives
- THEN the dialog closes and the list refreshes from the server

#### Scenario: APF-08 Reject or expire safely
- GIVEN a mutation returns 400 with string-array errors or returns 401
- WHEN the response arrives
- THEN inputs remain unchanged and the errors are visible, or the existing 401 redirect occurs

#### Scenario: APF-09 Prevent duplicate save
- GIVEN a save is pending
- WHEN the admin submits again
- THEN no second mutation is sent and the saving state is announced

### Requirement: Accessible Responsive Light-Only Dialog

The dialog MUST have an accessible name, labels, visible focus, and live status/error feedback. On open it MUST focus the first form control; Escape MUST close without saving and restore focus to the invoker. It MUST remain usable on narrow viewports and use light-only styling.

#### Scenario: APF-10 Keyboard dialog lifecycle
- GIVEN the admin opens the dialog from a product action
- WHEN focus enters, Escape is pressed, or the dialog closes after success
- THEN focus moves to the first control, closes without mutation on Escape, and returns to the invoker

#### Scenario: APF-11 Narrow, light-only presentation
- GIVEN the viewport is narrow
- WHEN the dialog is opened
- THEN all controls remain operable without a dark-mode variant

## Product Form Slice Boundaries

This boundary applies only to the product-form slice: it MUST NOT add category CRUD, orders, backend/schema/auth changes, a detail endpoint, uploads, permanent deletion, bulk actions, search, pagination, or dependencies.

## ADDED Requirements

### Requirement: Protected Admin Categories Route and Navigation

The system MUST expose `/admin/categorias` as a real protected admin route inside the existing admin shell. The shell MUST provide an enabled Categories navigation link and MUST NOT retain a “coming soon” placeholder for it.

#### Scenario: AC-01 Authorized route and navigation
- GIVEN an authenticated admin opens the shell
- WHEN they select Categories or navigate to `/admin/categorias`
- THEN the category page MUST render within the admin shell without public Header or Footer

### Requirement: Category List States

The category page MUST load the authenticated admin category list and expose loading, retryable error, empty, and success states.

#### Scenario: AC-02 Loading and success
- GIVEN the category request is pending or succeeds with categories
- WHEN the page renders
- THEN it MUST announce loading, then render each returned category name

#### Scenario: AC-03 Retryable failure
- GIVEN category loading fails with a non-auth error
- WHEN the error state is shown
- THEN it MUST keep the admin session and provide a retry action

#### Scenario: AC-04 Empty list
- GIVEN category loading returns an empty list
- WHEN the page renders
- THEN it MUST show an explicit empty state and allow creation

### Requirement: Create and Edit Categories

The system MUST allow an admin to create or edit only a category name through the existing category endpoints. The UI MUST NOT submit an activation field: `active` is read-only response data and the mutation DTO supports only `name`.

#### Scenario: AC-05 Create or edit success
- GIVEN a non-empty unique name and, for edit, an existing category
- WHEN the admin submits the form
- THEN it MUST create or update the name and refresh the displayed list

#### Scenario: AC-06 Duplicate name conflict
- GIVEN a create or edit request returns 409 for a duplicate name
- WHEN the response arrives
- THEN the form MUST remain open with its input and visible error preserved

#### Scenario: AC-07 Missing edit target
- GIVEN an edit request returns 404
- WHEN the response arrives
- THEN the form MUST preserve its input and show a visible not-found error

#### Scenario: AC-08 Pending submission
- GIVEN a category create or edit request is pending
- WHEN the admin submits again or tries to close the form
- THEN no second mutation MUST be sent and the pending state MUST be announced

### Requirement: Confirmed Category Deletion

The system MUST require explicit confirmation before deleting a category.

#### Scenario: AC-09 Deletion confirmation
- GIVEN an admin selects delete for a category
- WHEN confirmation has not been given
- THEN the system MUST NOT send a delete request

#### Scenario: AC-10 Product-referenced category blocked
- GIVEN deletion returns 409 because products reference the category
- WHEN the response arrives
- THEN the category MUST remain listed and the blocking error MUST be visible

#### Scenario: AC-11 Successful or missing deletion
- GIVEN a confirmed deletion returns 204 or 404
- WHEN the response arrives
- THEN a 204 MUST remove the category from the list and a 404 MUST show a visible not-found error without removing another category

### Requirement: Shared Session, Accessibility, and Presentation

The page MUST reuse central admin API authentication semantics: a genuine 401 MUST expire the session and redirect to login, while `Unable to verify account status` MUST remain a retryable local failure. It MUST be light-only, responsive, keyboard-operable, visibly focused, and expose labelled controls plus live status and error feedback.

#### Scenario: AC-12 Authentication classification
- GIVEN a category request receives a genuine 401 or the known transient verification 401
- WHEN the response is handled
- THEN the genuine response MUST clear and redirect, while the transient response MUST retain the session and offer retry

#### Scenario: AC-13 Accessible narrow viewport
- GIVEN a keyboard user or a narrow viewport
- WHEN they use category forms, confirmation, and retry controls
- THEN focus MUST move predictably, return to the invoking control on close, and all controls MUST remain usable without a dark variant

## Admin Categories UI Slice Boundaries

This slice MUST NOT change the product form, orders UI, backend routes, schema, auth model, dependencies, bulk actions, search, pagination, activation mutation, or permanent product deletion.

## Result Contract

- **status**: `success`
- **executive_summary**: Formal requirements AC-01 through AC-13 define the protected, accessible category-management UI while preserving the prior backend and product-form requirements.
- **artifacts**: `openspec/changes/2026-06-candyland-v2/specs/admin-productos/spec.md`; Engram `sdd/2026-06-candyland-v2/spec`
- **next_recommended**: `sdd-design`
- **risks**: Existing category `active` is derived response data only; mutation must remain `{ name }`.
- **skill_resolution**: `paths-injected` — frontend-design, playwright-best-practices, typescript-advanced-types, karpathy-guidelines, and ponytail; shared SDD/OpenSpec conventions.
