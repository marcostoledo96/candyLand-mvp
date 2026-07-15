import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");
const paths = [
  "src/pages/Checkout/AddressForm.tsx",
  "src/pages/Checkout/PaymentMethod.tsx",
  "src/pages/Checkout/Confirmation.tsx",
  "src/pages/Checkout/Checkout.module.css",
  "src/lib/api.ts",
];

const current = Object.fromEntries(paths.map((path) => [path, readFileSync(resolve(root, path), "utf8")]));
const baseline = Object.fromEntries(paths.map((path) => [path, execFileSync("git", ["show", `origin/main:${path}`], { cwd: root, encoding: "utf8" })]));
const join = (source) => paths.map((path) => source[path]).join("\n");

function violations(source) {
  const all = join(source);
  const address = source[paths[0]];
  const payment = source[paths[1]];
  const confirmation = source[paths[2]];
  const css = source[paths[3]];
  const api = source[paths[4]];
  return [
    ["CH-01-A canonical localidad", /ciudad/.test(address) || !/localidad/.test(address)],
    ["CH-01-B revisit persistence", !/normalizeCheckoutData\(localStorage\.getItem\("checkoutData"\)\)/.test(address)],
    ["CH-02-A transfer endpoint data", /candyland\.tienda\.mp|0000003100000000000000/.test(payment)],
    ["CH-02-B cash/transfer only", /tarjeta|mercado.?pago|whatsapp/i.test(payment)],
    ["CH-03-A inline validation and focus", /\balert\s*\(/.test(address) || !/role="alert"/.test(address)],
    ["CH-03-B HTTP failure classification", !/CheckoutApiError|kind: 'http'/.test(api)],
    ["CH-04-A exact status-aware API contract", !/checkoutRequest<|encodeURIComponent\(cartId\)/.test(api)],
    ["CH-05-A pending duplicate guard", !/state === "pending"|confirmationTransition/.test(confirmation)],
    ["CH-08 retryable idempotency", !/Idempotency-Key/.test(api) || !/checkoutConfirmation/.test(confirmation) || /No hay una acción de reenvío disponible/.test(confirmation)],
    ["CH-06-A no WhatsApp checkout action", /wa\.me|whatsapp|5491133190247/i.test(all)],
    ["CH-07-A visible keyboard focus/light mobile", !/:focus-visible/.test(css) || /prefers-color-scheme\s*:\s*dark/.test(css)],
  ].filter(([, failed]) => failed).map(([scenario]) => scenario);
}

test("checkout-hardening differential RED: origin/main fails every changed browser/static contract", () => {
  const failures = violations(baseline);
  assert.deepEqual(failures, [
    "CH-01-A canonical localidad",
    "CH-01-B revisit persistence",
    "CH-02-A transfer endpoint data",
    "CH-02-B cash/transfer only",
    "CH-03-A inline validation and focus",
    "CH-03-B HTTP failure classification",
    "CH-05-A pending duplicate guard",
    "CH-08 retryable idempotency",
    "CH-06-A no WhatsApp checkout action",
    "CH-07-A visible keyboard focus/light mobile",
  ]);
  console.log(`RED origin/main (10 changed contracts; CH-04 request shape is unchanged): ${failures.join(" | ")}`);
});

test("checkout-hardening differential GREEN: candidate passes all 11 browser/static contracts", () => {
  assert.deepEqual(violations(current), []);
  console.log("GREEN candidate: all 11 browser/static contracts pass");
});
