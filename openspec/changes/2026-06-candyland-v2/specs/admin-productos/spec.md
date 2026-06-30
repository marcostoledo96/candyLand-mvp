# Delta — Admin categorías y pedidos CRUD

## Scope

Backend-only admin endpoints for categories and orders on branch `backend/admin-categories-orders-crud`. Protected by admin JWT. No admin UI, no public form endpoints, no payment/stock/email checkout changes, no public product detail page.

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

## Out of scope

- Public form/checkout endpoints.
- Admin UI screens.
- Payment integrations.
- Stock or email checkout changes.
- Public product detail page `/producto/:id`.