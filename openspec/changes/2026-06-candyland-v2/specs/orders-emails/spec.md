# Delta for Orders, manual payments and emails

Change: `backend/orders-stock-emails` (branch `backend/orders-stock-emails`).

This delta modifies the existing `orders-emails` capability. The current main
spec (`openspec/specs/orders-emails/spec.md`) is a flat scenario list; the
MODIFIED blocks below supersede those scenarios as full requirement blocks
so the archive step does not lose coverage.

## ADDED Requirements

### Requirement: Atomic stock validation on order confirmation

The system MUST validate that every cart item has enough active product stock
before creating the order, and MUST decrement stock atomically within the same
database transaction that persists the order. Stock MUST NOT become negative
under concurrent confirmations.

#### Scenario: Sufficient stock happy path

- GIVEN a cart with items whose `Product.stock` covers the requested quantities and all products are `active`
- WHEN the client calls `POST /api/orders/confirm`
- THEN the system MUST create Order, OrderItem, and Payment, decrement each product stock, and clear the cart items in a single transaction
- AND the API MUST return the successful `ConfirmOrderResponse`

#### Scenario: Insufficient stock rejection

- GIVEN a cart item whose requested quantity exceeds `Product.stock`
- WHEN the client calls `POST /api/orders/confirm`
- THEN the API MUST return 400 without creating Order, OrderItem, or Payment, without decrementing stock, and without clearing cart items

#### Scenario: Concurrent overselling prevention

- GIVEN two confirmations targeting the same product with combined quantities exceeding stock
- WHEN both calls execute concurrently
- THEN exactly one MUST succeed and the other MUST receive 400; the product stock MUST NOT go negative

#### Scenario: Inactive product still rejected

- GIVEN a cart item whose `Product.active` is false
- WHEN the client calls `POST /api/orders/confirm`
- THEN the API MUST return 400 and MUST NOT create the order or decrement stock

## MODIFIED Requirements

### Requirement: Manual payment methods

The system MUST accept only `transferencia` or `efectivo` as payment methods.
The system MUST NOT accept MercadoPago, cards, or WhatsApp-based payment flows.
(Previously: only listed transfer/efectivo as allowed; restates the closed decision.)

#### Scenario: Allowed methods

- GIVEN checkout data is submitted
- WHEN the user selects a payment method
- THEN the only accepted values MUST be `transferencia` or `efectivo`

#### Scenario: Rejected methods

- GIVEN a request proposes MercadoPago, card, or WhatsApp payment
- WHEN the confirmation is processed
- THEN the system MUST NOT accept it and MUST NOT persist a Payment for it

### Requirement: Email notification after successful confirmation

The system MUST attempt to send an order email only after the order
transaction commits. Email sending MUST run outside the database transaction
and inside `try/catch`. Email provider failure or missing configuration MUST
NOT fail order confirmation; the failure SHOULD be logged. No schema migration
is required to track email status in this slice.
(Previously: email was a SHOULD attempt with no placement or failure semantics.)

#### Scenario: Email attempted after commit

- GIVEN an order transaction has committed and an email provider is configured
- WHEN confirmation finishes
- THEN the system SHOULD attempt to send the new-order email after the commit
- AND the API MUST return the successful order response regardless of the email result

#### Scenario: Email provider failure is non-blocking

- GIVEN an order transaction has committed and the email provider throws
- WHEN confirmation finishes
- THEN the API MUST still return successful order creation and SHOULD log the email failure without exposing stack traces

#### Scenario: No email on failed confirmation

- GIVEN stock validation or inactive-product rejection returns 400
- WHEN confirmation finishes
- THEN the system MUST NOT attempt any order email

#### Scenario: Noop provider when unconfigured

- GIVEN no email provider is configured (noop/disabled)
- WHEN an order is confirmed
- THEN the system MUST log the noop attempt and MUST still return the successful order

### Requirement: No WhatsApp notifications

The system MUST NOT send WhatsApp messages as part of order confirmation in
this stage.
(Previously: same intent, restated as a requirement block for archival safety.)

#### Scenario: WhatsApp excluded

- GIVEN an order is confirmed
- WHEN notifications are processed
- THEN the system MUST NOT send any WhatsApp message