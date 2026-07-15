// Run with Playwright MCP's run_code_unsafe tool. No project dependency required.
async (page) => {
  const failures = [];
  const requests = [];
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const json = (route, body, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
  const validOrder = {
    orderId: 1, orderNumber: "CL-100", totalCents: 1250, paymentMethod: "transferencia", items: [{ productId: 2, quantity: 1, priceCents: 1250, subtotalCents: 1250 }],
    customer: { id: 1, nombre: "Ana", telefono: "11", direccion: "Calle 1", localidad: "CABA", provincia: "BA", codigoPostal: "1000" },
  };
  const state = { checkoutStatus: 200, paymentStatus: 200, paymentMethods: { methods: ["CASH", "TRANSFER"], bank: { alias: "candy.alias", cbu: "123", titular: "CandyLand" } }, confirmStatus: 200, confirmCalls: 0, cartMutationCalls: 0, delayConfirm: false, releaseConfirm: null };

  await page.unroute("**/api/**");
  page.on("console", (message) => {
    const text = message.text();
    if (message.type() === "error" && !/net::ERR_FAILED|status of (400|404|409|500)|No se pudo conectar al backend/.test(text)) failures.push(text);
  });
  page.on("requestfailed", (request) => { if (!request.url().includes("/api/orders/confirm")) failures.push(`request failed: ${request.url()}`); });
  await page.route("**/favicon.ico", (route) => route.fulfill({ status: 204 }));
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const path = request.url().replace(/^https?:\/\/[^/]+/, "");
    requests.push({ path, method: request.method(), body: request.postData(), idempotencyKey: request.headers()["idempotency-key"] });
    if (path.startsWith("/api/productos")) return json(route, [{ id: 3, title: "Caramelo", description: "Dulce", priceCents: 500, image: "/img/dulce1.jpg", category: "Caramelos" }]);
    if (path.startsWith("/api/carrito")) {
      if (request.method() !== "GET") state.cartMutationCalls += 1;
      return json(route, { cartId: "cart/a b", items: [{ id: 1, productId: 2, title: "Gomitas", priceCents: 1250, quantity: 1, subtotalCents: 1250 }], totalItems: 1, totalCents: 1250 });
    }
    if (path.startsWith("/api/checkout")) return json(route, state.checkoutStatus === 200 ? { cartId: "cart/a b" } : state.checkoutStatus === 400 ? { error: "Campos requeridos faltantes", missing: ["telefono"] } : { error: "Carrito no encontrado" }, state.checkoutStatus);
    if (path.startsWith("/api/payment-method")) return json(route, request.method() === "GET" ? state.paymentMethods : state.paymentStatus === 200 ? { cartId: "cart/a b", method: "transferencia", bank: state.paymentMethods.bank } : { error: "Carrito no encontrado" }, state.paymentStatus);
    if (path.startsWith("/api/orders/confirm")) {
      state.confirmCalls += 1;
      if (state.delayConfirm) await new Promise((resolve) => { state.releaseConfirm = resolve; });
      if (state.confirmStatus === "network") return route.abort("failed");
      return json(route, state.confirmStatus === 200 ? validOrder : state.confirmStatus === 400 ? { error: "Stock insuficiente", insufficientStock: [{ title: "Gomitas" }] } : { error: "Carrito no encontrado" }, state.confirmStatus);
    }
    return json(route, { error: "Unexpected route" }, 404);
  });

  const go = async (path, storage = {}) => {
    requests.length = 0;
    await page.goto("http://127.0.0.1:5173/");
    await page.evaluate((next) => { localStorage.clear(); Object.entries(next).forEach(([key, value]) => localStorage.setItem(key, value)); }, storage);
    await page.goto(`http://127.0.0.1:5173${path}`);
  };
  const storedAddress = JSON.stringify({ nombre: "Ana", telefono: "11", direccion: "Calle 1", ciudad: "CABA", provincia: "BA", codigoPostal: "1000" });

  // CH-01/04: migration, exact six-field payload, encoded cart id, and revisit retention.
  await go("/checkout/direccion", { cartId: "cart/a b", checkoutData: storedAddress });
  assert(await page.getByLabel("Localidad").inputValue() === "CABA", "CH-01 locality migration");
  await page.getByRole("button", { name: "Continuar al pago" }).click();
  await page.waitForURL("**/checkout/pago");
  const checkoutRequest = requests.find((request) => request.path.startsWith("/api/checkout"));
  assert(checkoutRequest?.path === "/api/checkout?cartId=cart%2Fa%20b", "CH-04 checkout URL");
  assert(JSON.stringify(JSON.parse(checkoutRequest.body)) === JSON.stringify({ nombre: "Ana", telefono: "11", direccion: "Calle 1", localidad: "CABA", provincia: "BA", codigoPostal: "1000" }), "CH-04 checkout body");
  await page.goto("http://127.0.0.1:5173/checkout/direccion");
  assert(await page.getByLabel("Localidad").inputValue() === "CABA", "CH-01 revisit retention");

  // CH-02: both manual methods and endpoint-provided transfer instructions.
  await page.evaluate(() => localStorage.setItem("paymentMethod", "efectivo"));
  await page.goto("http://127.0.0.1:5173/checkout/pago");
  assert((await page.locator("main section").textContent()).includes("Pagá en efectivo al recibir tu pedido."), "CH-02 cash instruction");
  await page.getByLabel("Transferencia").waitFor();
  await page.getByLabel("Transferencia").check();
  assert((await page.locator("main section").textContent()).includes("Verás los datos bancarios provistos por el checkout antes de confirmar."), "CH-02 transfer instruction");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForURL("**/checkout/confirmacion");
  assert(requests.some((request) => request.path === "/api/payment-method?cartId=cart%2Fa%20b" && request.body === '{"method":"transferencia"}'), "CH-04 payment contract");
  assert((await page.evaluate(() => localStorage.getItem("checkoutBank"))).includes("candy.alias"), "CH-02 endpoint bank details retained");
  state.paymentMethods = { methods: ["CASH"], bank: null };
  const availabilityRequest = page.waitForRequest((request) => request.url().includes("/api/payment-method") && request.method() === "GET");
  await go("/checkout/pago", { cartId: "cart/a b", checkoutData: storedAddress, paymentMethod: "transferencia" });
  await availabilityRequest;
  await page.evaluate(() => new Promise(requestAnimationFrame));
  assert(await page.getByLabel("Transferencia").count() === 0, "CH-02 cash-only hides transfer safely");
  state.paymentMethods = { methods: ["CASH", "TRANSFER"], bank: { alias: "candy.alias", cbu: "123", titular: "CandyLand" } };

  // CH-03: client validation focuses an inline alert and sends no request.
  await go("/checkout/direccion", { cartId: "cart/a b" });
  await page.getByRole("button", { name: "Continuar al pago" }).click();
  assert(requests.filter((request) => request.path.startsWith("/api/checkout")).length === 0, "CH-03 client validation blocks request");
  assert(await page.getByRole("alert").count() === 1, "CH-03 inline alert");
  await page.waitForFunction(() => document.activeElement?.getAttribute("role") === "alert");
  assert(await page.evaluate(() => document.activeElement?.getAttribute("role") === "alert"), "CH-03 focuses error summary");

  // CH-03: known rejections preserve address state.
  state.checkoutStatus = 400;
  await page.getByLabel("Nombre completo").fill("Ana");
  await page.getByLabel("Dirección").fill("Calle 1");
  await page.getByLabel("Localidad").fill("CABA");
  await page.getByLabel("Teléfono").fill("11");
  await page.getByLabel("Provincia").fill("BA");
  await page.getByLabel("Código postal").fill("1000");
  await page.getByRole("button", { name: "Continuar al pago" }).click();
  assert(await page.getByLabel("Nombre completo").inputValue() === "Ana", "CH-03 rejection retains form");
  for (const status of [404, 409, 500]) {
    state.checkoutStatus = status;
    await page.getByRole("button", { name: "Continuar al pago" }).click();
    assert(await page.getByLabel("Nombre completo").inputValue() === "Ana", `CH-03 ${status} retains form`);
  }
  state.checkoutStatus = 200;

  // CH-03/05: item rejection retains cart; a fast verified success keeps its action slot,
  // so the second click of a double click cannot land on the "Volver" button.
  await go("/checkout/confirmacion", { cartId: "cart/a b", checkoutData: JSON.stringify({ nombre: "Ana", telefono: "11", direccion: "Calle 1", localidad: "CABA", provincia: "BA", codigoPostal: "1000" }), paymentMethod: "transferencia", checkoutBank: JSON.stringify({ alias: "candy.alias", cbu: "123", titular: "CandyLand" }) });
  state.confirmStatus = 400;
  await page.getByRole("button", { name: "Confirmar pedido" }).click();
  await page.getByText("Stock insuficiente", { exact: true }).waitFor();
  assert(await page.evaluate(() => localStorage.getItem("cartId")) === "cart/a b", "CH-03 item rejection retains cart");
  state.confirmStatus = 200;
  state.confirmCalls = 0;
  await page.getByRole("button", { name: "Reintentar confirmación" }).dblclick();
  await page.getByText("Tu pedido fue confirmado.").waitFor();
  assert(state.confirmCalls === 1, "CH-05 fast success sends exactly one confirmation request");
  assert(page.url().endsWith("/checkout/confirmacion"), "CH-05 success remains on the confirmation route");
  assert(await page.evaluate(() => localStorage.getItem("cartId")) === null, "CH-05 success-only clear");
  assert(await page.getByRole("button", { name: "Pedido confirmado" }).isDisabled(), "CH-05 success consumes the former confirmation action slot");
  await page.reload();
  assert(await page.evaluate(() => localStorage.getItem("cartId")) === null, "CH-05 success revisit does not resurrect cart storage");
  assert(await page.getByRole("button", { name: "Confirmar pedido" }).count() === 0, "CH-05 success revisit does not allow another confirmation submit");
  assert(state.confirmCalls === 1, "CH-05 success revisit does not post again");

  // CH-08: known pre-dispatch failures retain one persisted key; recovery sends it once.
  state.confirmCalls = 0;
  await go("/checkout/confirmacion", { cartId: "cart/a b", checkoutData: storedAddress });
  await page.evaluate(() => Object.defineProperty(navigator, "onLine", { configurable: true, get: () => false }));
  await page.getByRole("button", { name: "Confirmar pedido" }).click();
  await page.getByRole("button", { name: "Reintentar confirmación" }).waitFor();
  const offlineKey = await page.evaluate(() => JSON.parse(localStorage.getItem("checkoutConfirmation")).key);
  assert(state.confirmCalls === 0 && offlineKey, "CH-08 offline is pre-dispatch with a retained key");
  await page.evaluate(() => Object.defineProperty(navigator, "onLine", { configurable: true, get: () => true }));
  await page.getByRole("button", { name: "Reintentar confirmación" }).click();
  await page.getByText("Tu pedido fue confirmado.").waitFor();
  assert(state.confirmCalls === 1 && requests.find((request) => request.path.startsWith("/api/orders/confirm"))?.idempotencyKey === offlineKey, "CH-08 recovery posts the retained key exactly once");

  state.confirmCalls = 0;
  await go("/checkout/confirmacion", { cartId: "cart/a b", checkoutData: storedAddress });
  await page.evaluate(() => { const fetch = window.fetch; window.fetch = (input, init) => String(input).includes("/api/orders/confirm") ? (() => { throw new TypeError("sync fetch failure"); })() : fetch(input, init); });
  await page.getByRole("button", { name: "Confirmar pedido" }).click();
  await page.getByRole("button", { name: "Reintentar confirmación" }).waitFor();
  assert(state.confirmCalls === 0 && await page.evaluate(() => JSON.parse(localStorage.getItem("checkoutConfirmation")).key), "CH-08 sync throw is pre-dispatch with retained retry state");

  // CH-05/08: rejected promise after invocation is retryable with the same key, including after refresh.
  state.confirmStatus = "network";
  state.confirmCalls = 0;
  await go("/checkout/confirmacion", { cartId: "cart/a b", checkoutData: storedAddress });
  await page.getByRole("button", { name: "Confirmar pedido" }).click();
  await page.getByRole("button", { name: "Reintentar confirmación" }).waitFor();
  const retryKey = await page.evaluate(() => JSON.parse(localStorage.getItem("checkoutConfirmation")).key);
  assert(state.confirmCalls === 1 && await page.evaluate(() => localStorage.getItem("cartId")) === "cart/a b", "CH-08 rejected promise retains cart and key");
  await page.reload();
  state.confirmStatus = 200;
  await page.getByRole("button", { name: "Confirmar pedido" }).click();
  await page.getByText("Tu pedido fue confirmado.").waitFor();
  const retryRequests = requests.filter((request) => request.path.startsWith("/api/orders/confirm"));
  assert(retryRequests.slice(-2).every((request) => request.idempotencyKey === retryKey), "CH-08 promise retry after refresh reuses exactly one key");
  assert(state.confirmCalls === 2, "CH-08 promise retry receives one replayable order response");

  // CH-08: an ambiguous dispatched confirmation locks same-cart mutations across navigation.
  state.confirmStatus = "network";
  state.confirmCalls = 0;
  state.cartMutationCalls = 0;
  await go("/checkout/confirmacion", { cartId: "cart/a b", checkoutData: storedAddress });
  await page.getByRole("button", { name: "Confirmar pedido" }).click();
  await page.getByRole("button", { name: "Reintentar confirmación" }).waitFor();
  const lockedKey = await page.evaluate(() => JSON.parse(localStorage.getItem("checkoutConfirmation")).key);
  await page.evaluate(() => Object.defineProperty(navigator, "onLine", { configurable: true, get: () => false }));
  await page.getByRole("button", { name: "Reintentar confirmación" }).click();
  assert(await page.evaluate(() => localStorage.getItem("checkoutMutationLock")) === null, "CH-08 pre-dispatch retry clears the current cart mutation lock");
  await page.evaluate(({ cartId, key }) => localStorage.setItem("checkoutMutationLock", JSON.stringify({ cartId, key })), { cartId: "cart/a b", key: lockedKey });
  await page.evaluate(() => Object.defineProperty(navigator, "onLine", { configurable: true, get: () => true }));
  await page.goto("http://127.0.0.1:5173/carrito");
  await page.getByRole("button", { name: "+" }).click();
  await page.getByRole("button", { name: "-" }).click();
  await page.getByRole("button", { name: "Eliminar" }).click();
  assert(await page.getByRole("alert").filter({ hasText: "confirmación pendiente" }).count() === 1, "CH-08 locked mutation exposes an accessible error");
  assert(state.cartMutationCalls === 0, "CH-08 locked cart sends no mutation requests");
  await page.goto("http://127.0.0.1:5173/catalogo");
  await page.getByRole("button", { name: "Agregar al carrito" }).first().click();
  assert(state.cartMutationCalls === 0, "CH-08 catalog navigation cannot bypass the lock");
  state.confirmStatus = 200;
  await page.goto("http://127.0.0.1:5173/checkout/confirmacion");
  await page.getByRole("button", { name: "Confirmar pedido" }).click();
  await page.getByText("Tu pedido fue confirmado.").waitFor();
  assert(requests.filter((request) => request.path.startsWith("/api/orders/confirm")).slice(-2).every((request) => request.idempotencyKey === lockedKey), "CH-08 locked retry reuses the same key");
  assert(await page.evaluate(() => localStorage.getItem("checkoutMutationLock")) === null, "CH-08 successful replay clears the mutation lock");
  assert(await page.evaluate(() => localStorage.getItem("cartId")) === null, "CH-08 successful replay clears the cart");

  // CH-06/07: forbidden paths absent and keyboard works at 390px with no overflow.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:5173/checkout/pago");
  assert(await page.locator("a[href*='wa.me'], [data-whatsapp]").count() === 0, "CH-06 no WhatsApp action");
  assert(await page.getByText(/tarjeta|mercado.?pago/i).count() === 0, "CH-02 no card/gateway");
  await page.keyboard.press("Tab");
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "CH-07 no horizontal overflow");
  assert(failures.length === 0, `clean console/network: ${failures.join(" | ")}`);
  return { scenarios: 16, requests: requests.length, errors: failures };
}
