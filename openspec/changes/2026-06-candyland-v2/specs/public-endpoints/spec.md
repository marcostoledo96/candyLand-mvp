# Delta — Public backend endpoints (categories + forms)

## Scope

Public, unauthenticated backend endpoints on branch `backend/formularios-publicos-y-categorias` that the future public frontend will consume: category listing for menu/navigation, and submission endpoints for contact, job applications, and franchise leads. No admin UI, no public pages/forms frontend, no email sending, no payments/stock/checkout changes, no WhatsApp/MercadoPago/cards, no product detail page.

Persisted models `ContactMessage`, `JobApplication`, `FranchiseLead` already exist in `backend/prisma/schema.prisma` (PR-3).

## ADDED Requirements

### Requirement: Public Category Listing

The system MUST expose `GET /api/categories` as a public endpoint that does NOT require an admin token. It MUST return only categories usable in the public menu/navigation, exposing `id`, `name` and `slug`. It MUST NOT expose inactive products as available. It MAY include a per-category active product count only when cheap to compute.

#### Scenario: Public list returns category fields
- GIVEN categories exist in the database
- WHEN `GET /api/categories` with no token
- THEN the system MUST return 200 with an array of objects containing `id`, `name` and `slug`.

#### Scenario: No admin token required
- GIVEN no `Authorization` header is sent
- WHEN `GET /api/categories`
- THEN the system MUST NOT return 401 and MUST return the public list.

#### Scenario: Inactive products not surfaced as available
- GIVEN a category has only inactive products
- WHEN `GET /api/categories`
- THEN the system MUST NOT represent those products as available in the response.

#### Scenario: Optional product count
- GIVEN categories with active products exist
- WHEN `GET /api/categories`
- THEN the system MAY include an `activeProductCount` per category computed from active products only.

#### Scenario: Empty catalog
- GIVEN no categories exist
- WHEN `GET /api/categories`
- THEN the system MUST return 200 with an empty array.

### Requirement: Contact Message Submission

The system MUST expose `POST /api/contact` as a public endpoint that persists a contact message. It MUST validate required fields `name`, `email` and `message`. It MUST return a success response on persistence. It MUST NOT send email in this slice.

#### Scenario: Valid contact submission
- GIVEN a valid payload `{ name, email, message }`
- WHEN `POST /api/contact`
- THEN the system MUST persist a `ContactMessage` and return 201 with a success body.

#### Scenario: Missing required fields
- GIVEN a payload missing `name`, `email` or `message`
- WHEN `POST /api/contact`
- THEN the system MUST return 400 and MUST NOT persist anything.

#### Scenario: Optional phone accepted
- GIVEN a valid payload including optional `phone`
- WHEN `POST /api/contact`
- THEN the system MUST persist the message with `phone` and return 201.

### Requirement: Job Application Submission

The system MUST expose `POST /api/jobs/applications` as a public endpoint that persists a job application. It MUST validate required fields `fullName`, `email` and `position`. It MUST accept optional `phone`, `message` and `cvUrl`.

#### Scenario: Valid application
- GIVEN a valid payload `{ fullName, email, position }`
- WHEN `POST /api/jobs/applications`
- THEN the system MUST persist a `JobApplication` and return 201.

#### Scenario: Missing required fields
- GIVEN a payload missing `fullName`, `email` or `position`
- WHEN `POST /api/jobs/applications`
- THEN the system MUST return 400 and MUST NOT persist anything.

#### Scenario: Optional fields accepted
- GIVEN a valid payload plus optional `phone`, `message`, `cvUrl`
- WHEN `POST /api/jobs/applications`
- THEN the system MUST persist all provided optional fields and return 201.

### Requirement: Franchise Lead Submission

The system MUST expose `POST /api/franchise/leads` as a public endpoint that persists a franchise lead. It MUST validate required fields `fullName`, `email` and `city`. It MUST accept optional `phone` and `message`.

#### Scenario: Valid lead
- GIVEN a valid payload `{ fullName, email, city }`
- WHEN `POST /api/franchise/leads`
- THEN the system MUST persist a `FranchiseLead` and return 201.

#### Scenario: Missing required fields
- GIVEN a payload missing `fullName`, `email` or `city`
- WHEN `POST /api/franchise/leads`
- THEN the system MUST return 400 and MUST NOT persist anything.

#### Scenario: Optional fields accepted
- GIVEN a valid payload plus optional `phone` and `message`
- WHEN `POST /api/franchise/leads`
- THEN the system MUST persist the optional fields and return 201.

### Requirement: Public Input Validation and Safe Errors

Public submission endpoints MUST validate input at the trust boundary and reject malformed payloads with 400. The system MUST NOT expose stack traces to the client. Error responses SHOULD use a consistent error shape.

#### Scenario: Malformed JSON body
- GIVEN a request with invalid JSON body
- WHEN any public submission endpoint is called
- THEN the system MUST return 400 and MUST NOT expose a stack trace.

#### Scenario: Oversized payload rejected
- GIVEN a payload exceeding a reasonable size limit
- WHEN any public submission endpoint is called
- THEN the system SHOULD return 400 and MUST NOT persist the payload.

#### Scenario: Consistent error shape
- GIVEN any validation failure on a public endpoint
- WHEN the error response is returned
- THEN it SHOULD follow the same error shape used across the public API.

## Out of scope

- Admin UI screens.
- Public pages/forms frontend implementation.
- Email sending/provider integration.
- Payments, stock, or checkout changes.
- WhatsApp / Mercado Pago / cards.
- Public product detail page `/producto/:id`.