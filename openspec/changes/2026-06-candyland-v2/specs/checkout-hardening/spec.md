# Checkout Hardening Specification

## Purpose

Harden the existing public checkout UI and its confirmation boundary. This approved remediation adds backend/database idempotency only for order confirmation; it does not add payment gateways, WhatsApp, product detail, admin features, dependencies, or real-DB work.

## Requirements

### Requirement: CH-01 Canonical address and step state

The checkout MUST use `localidad` as its sole locality field. It MUST NOT render, persist, or submit `ciudad`. Address, selected payment method, and cart identity MUST survive Address → Payment → Confirmation navigation and revisits until successful confirmation.

#### Scenario: Address continues to payment
- GIVEN a shopper completes all required address fields
- WHEN they continue from Address
- THEN the saved address and request contain `localidad` and no `ciudad`
- AND Payment shows the preserved checkout state

#### Scenario: Step revisit
- GIVEN saved checkout state exists before confirmation
- WHEN the shopper returns to an earlier step or refreshes
- THEN previously valid address and payment values remain available

### Requirement: CH-02 Manual payment choices and instructions

The UI MUST offer only `efectivo` and `transferencia`, mapped to the existing backend payment contract. It MUST show instructions appropriate to the selected manual method and MUST NOT offer cards, gateways, or WhatsApp instructions.

#### Scenario: Transfer selection
- GIVEN the shopper selects `transferencia`
- WHEN the payment step renders
- THEN only transfer instructions are shown before continuation

#### Scenario: Cash selection
- GIVEN the shopper selects `efectivo`
- WHEN the payment step renders
- THEN only cash-at-delivery instructions are shown

### Requirement: CH-03 Accessible validation and known failures

The UI MUST validate required address and payment input inline. It MUST NOT use `alert`. Errors and pending/success messages MUST be announced with appropriate live status semantics, retain valid form values and cart contents, and move focus to the actionable error summary or field.

#### Scenario: Client validation
- GIVEN a required address value is missing
- WHEN the shopper submits the step
- THEN the field exposes an inline accessible error and no request is sent

#### Scenario: Rejected or unavailable state
- GIVEN checkout/payment/confirmation returns a network error, 400, 404, 409, insufficient-stock, or inactive-product response
- WHEN the UI handles it
- THEN it shows a specific inline recovery message without clearing form state or cart

### Requirement: CH-04 Exact existing API contract

The frontend MUST send JSON `POST /api/checkout?cartId=` with exactly `nombre`, `telefono`, `direccion`, `localidad`, `provincia`, and `codigoPostal`; JSON `POST /api/payment-method?cartId=` with `{ "method": "efectivo" | "transferencia" }`; and bodyless `POST /api/orders/confirm?cartId=`. A present `cartId` MUST be URI encoded.

#### Scenario: Contract submission
- GIVEN valid state and a cart identifier
- WHEN each checkout step submits
- THEN its path, query, body, and accepted method match this contract exactly

### Requirement: CH-05 Safe confirmation completion

The confirmation action MUST block duplicate in-flight submission. Only a successful response (`orderId`, `orderNumber`, `totalCents`, `paymentMethod`, `items`, `customer`) MAY clear the client cart and present the success summary.

#### Scenario: Successful confirmation
- GIVEN a valid cart and saved checkout state
- WHEN confirmation succeeds
- THEN the order summary and manual-payment instructions render and the client cart clears

#### Scenario: Retryable confirmation outcome
- GIVEN the confirmation request fails at the transport boundary after dispatch
- WHEN the client cannot determine whether the backend created an order
- THEN it MUST preserve the cart and confirmation key, present a retry action, and MUST NOT claim success
- AND the retry MUST reuse the same key so the backend returns the original order without a second stock decrement or email

### Requirement: CH-08 Idempotent confirmation

The frontend MUST create one cryptographically strong confirmation key per cart/checkout attempt, persist it until verified success, and send it in the `Idempotency-Key` header on every confirmation request. The backend MUST validate the key, bind it to the cart that created the order, persist it under a unique PostgreSQL constraint, and return the original public confirmation DTO for an exact replay. Before replay/cart/stock work it MUST acquire a parameterized key-derived PostgreSQL advisory lock; rollback MUST release it. Concurrent exact-stock replays MUST create at most one order, decrement stock once, and send at most one email. Production MUST apply the forward migration before serving this contract.

#### Scenario: Replay after response loss
- GIVEN a confirmation request commits but its response is lost
- WHEN the shopper refreshes or retries with the persisted key and cart
- THEN the response is the original order DTO and the frontend clears state only after receiving it

#### Scenario: Key isolation
- GIVEN a confirmation key belonging to one cart
- WHEN it is submitted with another cart identifier
- THEN the backend MUST NOT return the unrelated order

### Requirement: CH-06 Remove WhatsApp checkout paths

Checkout MUST NOT contain a WhatsApp number, `wa.me` URL, message copy, link, button, or copy-to-clipboard action.

#### Scenario: Checkout inspection
- GIVEN any checkout step or success view renders
- WHEN a shopper inspects its available actions
- THEN no WhatsApp action or destination is present

### Requirement: CH-07 Responsive light accessible checkout

Checkout MUST remain mobile-first and light-only, with semantic controls, labels, visible focus, and live pending/error/success states.

#### Scenario: Keyboard narrow viewport
- GIVEN a 390px-wide viewport and keyboard navigation
- WHEN the shopper traverses checkout controls
- THEN controls remain usable without horizontal overflow and focus is visible
