import assert from "node:assert/strict";
import test from "node:test";
import {
  CHECKOUT_FIELDS,
  buildCheckoutPayload,
  buildPaymentPayload,
  clearCartMutationLockForCart,
  checkoutUrl,
  classifyCheckoutFailure,
  confirmationTransition,
  createConfirmationKey,
  getConfirmationAttempt,
  getConfirmationLock,
  isCompleteConfirmResponse,
  isCartMutationLocked,
  lockConfirmationAttempt,
  normalizeCheckoutData,
  shouldClearCheckout,
  validateCheckout,
} from "../src/lib/checkout.js";

const address = {
  nombre: " Ana ",
  telefono: " 11 1234 5678 ",
  direccion: " Calle 1 ",
  localidad: " CABA ",
  provincia: " Buenos Aires ",
  codigoPostal: " 1000 ",
};

test("CH-01 migrates legacy ciudad and discards it from persisted checkout data", () => {
  assert.deepEqual(normalizeCheckoutData(JSON.stringify({ ...address, localidad: "", ciudad: " Rosario ", extra: "x" })), {
    ...buildCheckoutPayload(address),
    localidad: "Rosario",
  });
  assert.deepEqual(normalizeCheckoutData("not-json"), {
    nombre: "", telefono: "", direccion: "", localidad: "", provincia: "", codigoPostal: "",
  });
  assert.deepEqual(Object.keys(normalizeCheckoutData(JSON.stringify(address))), CHECKOUT_FIELDS);
});

test("CH-02 accepts only manual methods and produces exact encoded API contracts", () => {
  assert.deepEqual(validateCheckout(address), {});
  assert.deepEqual(buildCheckoutPayload({ ...address, ciudad: "ignored" }), {
    nombre: "Ana", telefono: "11 1234 5678", direccion: "Calle 1", localidad: "CABA", provincia: "Buenos Aires", codigoPostal: "1000",
  });
  assert.deepEqual(buildPaymentPayload("efectivo"), { method: "efectivo" });
  assert.deepEqual(buildPaymentPayload("transferencia"), { method: "transferencia" });
  assert.equal(buildPaymentPayload("tarjeta"), null);
  assert.equal(checkoutUrl("checkout", "cart/a b"), "/api/checkout?cartId=cart%2Fa%20b");
  assert.equal(checkoutUrl("payment", "cart/a b"), "/api/payment-method?cartId=cart%2Fa%20b");
  assert.equal(checkoutUrl("confirm", "cart/a b"), "/api/orders/confirm?cartId=cart%2Fa%20b");
});

test("CH-03 maps validation, HTTP item failures, and transport failures without losing recovery context", () => {
  assert.deepEqual(validateCheckout({ ...address, localidad: "" }), { localidad: "Ingresá tu localidad." });
  assert.deepEqual(classifyCheckoutFailure({ kind: "http", status: 400, body: { missing: ["telefono"] } }), {
    kind: "rejected", message: "Completá los campos requeridos.", fields: { telefono: "Ingresá tu teléfono." }, action: "address",
  });
  assert.equal(classifyCheckoutFailure({ kind: "http", status: 400, body: { insufficientStock: [{ title: "Gomitas" }] } }).action, "cart");
  assert.equal(classifyCheckoutFailure({ kind: "http", status: 404, body: {} }).action, "cart");
  assert.equal(classifyCheckoutFailure({ kind: "http", status: 500, body: {} }).kind, "rejected");
  assert.equal(classifyCheckoutFailure({ kind: "transport" }).kind, "transport");
  assert.deepEqual(classifyCheckoutFailure({ kind: "pre-dispatch" }), {
    kind: "preDispatch", message: "No se pudo iniciar la confirmación. Revisá tu conexión e intentá nuevamente.", fields: {}, action: "retry",
  });
});

test("CH-03/04 only complete confirmation DTOs can succeed and transport retries preserve the attempt", () => {
  const complete = {
    orderId: 1, orderNumber: "CL-1", totalCents: 100, paymentMethod: "efectivo", items: [],
    customer: { id: 1, nombre: "Ana", telefono: "11", direccion: "Calle", localidad: "CABA", provincia: "BA", codigoPostal: "1000" },
  };
  assert.equal(isCompleteConfirmResponse(complete), true);
  assert.equal(isCompleteConfirmResponse({ orderId: 1 }), false);
  assert.deepEqual(confirmationTransition({ state: "ready" }, { type: "submit" }), { state: "pending" });
  assert.deepEqual(confirmationTransition({ state: "pending" }, { type: "reject" }), { state: "rejected" });
  assert.deepEqual(confirmationTransition({ state: "pending" }, { type: "preDispatch" }), { state: "preDispatch" });
  assert.deepEqual(confirmationTransition({ state: "pending" }, { type: "ambiguous" }), { state: "rejected" });
  assert.deepEqual(confirmationTransition({ state: "rejected" }, { type: "submit" }), { state: "pending" });
  assert.deepEqual(confirmationTransition({ state: "pending" }, { type: "succeed", order: complete }), { state: "succeeded", order: complete });
  assert.equal(shouldClearCheckout({ state: "succeeded", order: complete }), true);
  assert.equal(shouldClearCheckout({ state: "ambiguous" }), false);
  assert.equal(shouldClearCheckout({ state: "rejected" }), false);
});

test("CH-08 creates a UUID-strength key once per cart attempt and replaces stale cart state", () => {
  const key = createConfirmationKey({ randomUUID: () => "4e2e0f2e-8e28-4e42-bf42-0d3fd2c6b3e1" });
  assert.equal(key, "4e2e0f2e-8e28-4e42-bf42-0d3fd2c6b3e1");
  assert.deepEqual(getConfirmationAttempt(JSON.stringify({ cartId: "cart-1", key }), "cart-1", { randomUUID: () => "unused" }), { cartId: "cart-1", key });
  assert.deepEqual(getConfirmationAttempt(JSON.stringify({ cartId: "cart-1", key }), "cart-2", { randomUUID: () => "7dc59647-78ec-4611-9dd0-65ff7f5ef4a4" }), { cartId: "cart-2", key: "7dc59647-78ec-4611-9dd0-65ff7f5ef4a4" });
});

test("CH-08 locks only the ambiguous cart/key and supports definitive recovery", () => {
  const attempt = { cartId: "cart-1", key: "4e2e0f2e-8e28-4e42-bf42-0d3fd2c6b3e1" };
  const locked = lockConfirmationAttempt(attempt);
  assert.deepEqual(getConfirmationLock(JSON.stringify(locked)), attempt);
  assert.equal(isCartMutationLocked(JSON.stringify(locked), "cart-1"), true);
  assert.equal(isCartMutationLocked(JSON.stringify(locked), "cart-2"), false);
  assert.equal(isCartMutationLocked("not-json", "cart-1"), false);
});

test("CH-08 clears only the current cart mutation lock", () => {
  const key = "4e2e0f2e-8e28-4e42-bf42-0d3fd2c6b3e1";
  const storage = {
    value: JSON.stringify({ cartId: "cart-a", key }),
    getItem() { return this.value; },
    removeItem() { this.value = null; },
  };

  clearCartMutationLockForCart(storage, "cart-b");
  assert.notEqual(storage.value, null, "cart A lock survives cart B outcome");
  clearCartMutationLockForCart(storage, "cart-a");
  assert.equal(storage.value, null, "cart A definitive outcome clears cart A lock");

  storage.value = "not-json";
  assert.doesNotThrow(() => clearCartMutationLockForCart(storage, "cart-a"));
  assert.equal(storage.value, "not-json", "malformed lock is left safely untouched");
  assert.doesNotThrow(() => clearCartMutationLockForCart({ getItem() { throw new Error("blocked"); }, removeItem() {} }, "cart-a"));
});
