import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
const checkoutFiles = [
  "src/pages/Checkout/AddressForm.tsx",
  "src/pages/Checkout/PaymentMethod.tsx",
  "src/pages/Checkout/Confirmation.tsx",
  "src/pages/Checkout/Checkout.module.css",
];
const checkout = checkoutFiles.map(read).join("\n");
const api = read("src/lib/api.ts");
const cartContext = read("src/context/CartContext.tsx");
const app = read("src/App.tsx");
const backend = read("backend/app.js");
const pkg = JSON.parse(read("package.json"));

assert.equal(/wa\.me|whatsapp|5491133190247/i.test(checkout), false, "checkout must not expose a WhatsApp path");
assert.equal(/\balert\s*\(/.test(checkout), false, "checkout must use inline errors instead of alert");
assert.equal(/tarjeta|mercado.?pago/i.test(checkout), false, "checkout must offer only manual payment methods");
assert.equal(/prefers-color-scheme\s*:\s*dark/i.test(checkout), false, "checkout must remain light-only");
assert.match(app, /path="\/checkout"/);
assert.match(app, /path="\/checkout\/direccion"/);
assert.match(app, /path="\/checkout\/pago"/);
assert.match(app, /path="\/checkout\/confirmacion"/);
assert.match(api, /\/api\/checkout\$\{q\}/);
assert.match(api, /\/api\/payment-method\$\{q\}/);
assert.match(api, /getPaymentMethods/);
assert.match(checkout, /methods\.includes\("TRANSFER"\)/);
assert.equal(/candyland\.tienda\.mp|0000003100000000000000/.test(backend), false, "backend must not expose placeholder bank details");
assert.match(api, /\/api\/orders\/confirm\$\{q\}/);
assert.match(api, /"Idempotency-Key": confirmationKey/);
assert.match(checkout, /checkoutConfirmation/);
assert.match(checkout, /checkoutMutationLock/);
assert.match(cartContext, /isCartMutationLocked/);
assert.equal(/saved\.state === "ambiguous"|No hay una acción de reenvío disponible/.test(checkout), false, "checkout must not retain a permanent ambiguous lock");
assert.equal(pkg.scripts["test:checkout-hardening"], "node --test test/checkout-hardening.test.mjs");
assert.equal(pkg.scripts["assert:checkout-hardening"], "node scripts/assert-checkout-hardening.mjs");
assert.equal(Object.keys(pkg.dependencies).length, 9, "dependencies must remain unchanged");
assert.equal(Object.keys(pkg.devDependencies).length, 11, "devDependencies must remain unchanged");

console.log("OK: checkout hardening static contract passed.");
