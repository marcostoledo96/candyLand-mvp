// Playwright MCP runtime smoke for narrowed slice 7f.
// Run with the configured Playwright MCP `run_code_unsafe` tool using this file.
// It needs no package dependency: the existing MCP browser runtime supplies page.
async (page) => {
  const errors = [];
  const state = {
    loginError: false,
    me401: false,
    meAccountStatusFailure: false,
    meNetworkFailure: false,
    meCalls: 0,
    productsStatus: 200,
    categoriesStatus: 200,
    delayCategories: false,
    mutationStatus: 200,
    delayMutation: false,
    releaseCategories: null,
    releaseMutation: null,
    releaseProducts: null,
    lastProductMutation: null,
    categoryCalls: 0,
    productMutations: 0,
    productGets: 0,
    detailProductGets: 0,
    delayProducts: false,
    products: [
      { id: 1, title: 'Gomitas Dulces', priceCents: 1250, stock: 10, active: true, categoryId: 1, category: 'Gomitas' },
      { id: 2, title: 'Caramelos Surtidos', priceCents: 800, stock: 5, active: true, categoryId: 2, category: 'Caramelos' },
      { id: 3, title: 'Chocolates Premium', priceCents: 3500, stock: 0, active: false, categoryId: 3, category: 'Chocolates' },
    ],
  };
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const json = (route, body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

  await page.unroute('**/api/**');
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    // The explicit login/auth, category-error, and mutation-error scenarios
    // intentionally exercise these HTTP failures; every other console error fails.
    if (text.includes('401 (Unauthorized)') || msg.location().url.endsWith('/api/admin/me')) return;
    if (state.categoriesStatus === 500 && msg.location().url.endsWith('/api/admin/categories')) return;
    if (state.mutationStatus === 400 && msg.location().url.includes('/api/admin/products')) return;
    errors.push(`${text} @ ${msg.location().url}`);
  });
  page.on('requestfailed', (request) => {
    if (!request.url().endsWith('/api/admin/me')) errors.push(`request failed: ${request.url()}`);
  });
  await page.route('**/favicon.ico', (route) => route.fulfill({ status: 204 }));
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = request.url();
    if (url.includes('/api/carrito')) return json(route, { cartId: 'smoke', items: [], totalItems: 0, totalCents: 0 });
    if (url.endsWith('/api/admin/login') && request.method() === 'POST') {
      return json(route, state.loginError ? { error: 'Credenciales inválidas' } : {
        token: 'header.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBjYW5keSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTAwMCwiZXhwIjo5OTk5OTk5OTk5fQ.sig',
        user: { id: 1, email: 'admin@candy', role: 'ADMIN' },
      }, state.loginError ? 401 : 200);
    }
    if (url.endsWith('/api/admin/me')) {
      state.meCalls += 1;
      if (state.meNetworkFailure) return route.abort('failed');
      if (state.meAccountStatusFailure) return json(route, { error: 'Unable to verify account status' }, 401);
      return json(route, state.me401 ? { error: 'Invalid token' } : { id: 1, email: 'admin@candy', role: 'ADMIN' }, state.me401 ? 401 : 200);
    }
    if (url.endsWith('/api/admin/products') && request.method() === 'GET') {
      state.productGets += 1;
      if (state.delayProducts) await new Promise((resolve) => { state.releaseProducts = resolve; });
      return json(route, state.productsStatus === 200 ? state.products : { error: 'Backend unavailable' }, state.productsStatus);
    }
    if (url.endsWith('/api/admin/categories')) {
      state.categoryCalls += 1;
      if (state.delayCategories) await new Promise((resolve) => { state.releaseCategories = resolve; });
      const categories = state.categoriesStatus === 'empty' ? [] : [{ id: 1, name: 'Gomitas', slug: 'gomitas', active: true }];
      return json(route, state.categoriesStatus === 200 || state.categoriesStatus === 'empty' ? categories : { error: 'Categories unavailable' }, state.categoriesStatus === 'empty' ? 200 : state.categoriesStatus);
    }
    if (url.endsWith('/api/admin/products') && request.method() === 'POST') {
      state.productMutations += 1;
      if (state.delayMutation) await new Promise((resolve) => { state.releaseMutation = resolve; });
      if (state.mutationStatus === 400) return json(route, { error: 'Validation failed', errors: ['stock: must be >= 0', 'priceCents: invalid'] }, 400);
      if (state.mutationStatus === 401) return json(route, { error: 'expired' }, 401);
      const body = request.postDataJSON();
      state.lastProductMutation = body;
      const created = { ...body, id: 9, category: 'Gomitas' };
      state.products.push(created);
      return json(route, created, 201);
    }
    const match = url.match(/\/api\/admin\/products\/(\d+)$/);
    if (match && request.method() === 'GET') {
      state.detailProductGets += 1;
      return json(route, { error: 'Unexpected detail request' }, 404);
    }
    if (match && request.method() === 'DELETE') {
      const product = state.products.find((item) => item.id === Number(match[1]));
      product.active = false;
      return json(route, { id: product.id, active: false, deleted: true });
    }
    if (match && request.method() === 'PATCH') {
      const product = state.products.find((item) => item.id === Number(match[1]));
      const body = request.postDataJSON();
      state.lastProductMutation = body;
      state.productMutations += 1;
      if (state.delayMutation) await new Promise((resolve) => { state.releaseMutation = resolve; });
      if (state.mutationStatus === 400) return json(route, { error: 'categoryId does not exist' }, 400);
      Object.assign(product, body);
      return json(route, product);
    }
    return json(route, { error: 'Unexpected mock route' }, 404);
  });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('http://127.0.0.1:4182/contacto');
  await page.evaluate(() => sessionStorage.clear());
  await page.getByRole('heading', { name: 'COMUNICATE CON NOSOTROS' }).waitFor();
  assert(await page.locator('header').isVisible(), 'public Header missing');
  assert(await page.locator('footer').isVisible(), 'public Footer missing');

  for (const path of ['categorias', 'pedidos']) {
    await page.goto(`http://127.0.0.1:4182/admin/${path}`);
    await page.waitForURL('**/admin/login');
  }

  const coldLogin = page.goto('http://127.0.0.1:4182/admin/login');
  await page.getByRole('status').waitFor();
  await coldLogin;
  await page.getByRole('heading', { name: 'Panel de administración' }).waitFor();
  state.loginError = true;
  await page.getByLabel('Email').fill('wrong@candy');
  await page.getByLabel('Contraseña').fill('badpass');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  assert((await page.getByRole('alert').textContent())?.includes('Credenciales inválidas'), 'login error not shown');

  state.loginError = false;
  await page.getByLabel('Email').fill('admin@candy');
  await page.getByLabel('Contraseña').fill('secret');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await page.waitForURL('**/admin/productos');

  // Scope every form interaction to the open dialog: a just-closed native dialog
  // can remain mounted until React commits its parent state update.
  const productDialog = page.locator('dialog[open]');

  // APF-04/05/06: category loading, empty, and retryable error states block saves.
  state.delayCategories = true;
  await page.getByRole('button', { name: 'Crear producto' }).click();
  await productDialog.getByText('Cargando categorías…').waitFor();
  assert(await productDialog.getByRole('button', { name: 'Crear', exact: true }).isDisabled(), 'category loading did not disable save');
  state.delayCategories = false;
  state.releaseCategories?.();
  await productDialog.getByLabel('Categoría').locator('option[value="1"]').waitFor({ state: 'attached' });
  await page.keyboard.press('Escape');
  state.categoriesStatus = 'empty';
  await page.getByRole('button', { name: 'Crear producto' }).click();
  await productDialog.getByText('No hay categorías.').waitFor();
  assert(await productDialog.getByRole('button', { name: 'Crear', exact: true }).isDisabled(), 'empty categories did not disable save');
  await page.keyboard.press('Escape');
  state.categoriesStatus = 500;
  await page.getByRole('button', { name: 'Crear producto' }).click();
  await productDialog.getByText('Error del servidor Reintentar').waitFor();
  assert(await productDialog.getByRole('button', { name: 'Crear', exact: true }).isDisabled(), 'category error did not disable save');
  state.categoriesStatus = 200;
  await productDialog.getByRole('button', { name: 'Reintentar' }).click();
  await productDialog.getByLabel('Categoría').locator('option[value="1"]').waitFor({ state: 'attached' });
  await page.keyboard.press('Escape');

  // APF runtime: the selected list DTO seeds edit, no detail GET is issued,
  // categories gate save, local invalid data sends no mutation, and Escape restores focus.
  const edit = page.getByRole('row').filter({ hasText: 'Gomitas Dulces' }).getByRole('button', { name: 'Editar' });
  await edit.click();
  await productDialog.waitFor();
  await productDialog.getByLabel('Categoría').locator('option[value="1"]').waitFor({ state: 'attached' });
  assert(await productDialog.getByLabel('Título').inputValue() === 'Gomitas Dulces', 'edit did not seed list DTO');
  assert(await productDialog.getByLabel('Categoría').inputValue() === '1', 'edit category was not selected');
  assert(await productDialog.getByLabel('Precio (pesos enteros)').inputValue() === '12.5', 'edit did not format fractional cents exactly');
  const mutationsBeforeInvalid = state.productMutations;
  await productDialog.getByRole('button', { name: 'Guardar cambios' }).click();
  await productDialog.waitFor({ state: 'hidden' });
  assert(state.productMutations === mutationsBeforeInvalid + 1, 'unchanged fractional price did not PATCH once');
  assert(state.lastProductMutation?.priceCents === 1250, 'unchanged fractional price was mutated');
  await edit.click();
  await page.locator('dialog[open] input[name="price"]').fill('12.6');
  await productDialog.getByRole('button', { name: 'Guardar cambios' }).click();
  assert(state.productMutations === mutationsBeforeInvalid + 1, 'changed fractional price sent a mutation');
  await page.keyboard.press('Escape');
  await productDialog.waitFor({ state: 'hidden' });
  assert(await edit.evaluate((node) => document.activeElement === node), 'Escape did not restore invoker focus');
  const detailGetsBefore = state.productGets;
  await edit.click();
  await page.locator('dialog[open] input[name="price"]').fill('15');
  await productDialog.getByRole('button', { name: 'Guardar cambios' }).click();
  await productDialog.waitFor({ state: 'hidden' });
  assert(state.productMutations === mutationsBeforeInvalid + 2, 'edit did not PATCH once');
  assert(state.lastProductMutation?.priceCents === 1500, 'edit request did not send pesos as cents');
  assert(state.productGets > detailGetsBefore, 'save did not refresh product list');
  assert(state.detailProductGets === 0, 'edit requested a product detail endpoint');
  await page.waitForFunction(() => [...document.querySelectorAll('button')].some((button) => button.textContent === 'Editar' && document.activeElement === button));
  assert(await edit.evaluate((node) => document.activeElement === node), 'save did not restore invoker focus');
  await page.getByRole('button', { name: 'Crear producto' }).click();
  await productDialog.waitFor();
  await productDialog.getByLabel('Título').fill('Nuevas gomitas');
  await page.locator('dialog[open] input[name="price"]').fill('20');
  assert(await productDialog.getByLabel('Título').inputValue() === 'Nuevas gomitas', 'title locator did not target the title field');
  assert(await page.locator('dialog[open] input[name="price"]').inputValue() === '20', 'price input did not receive its value');
  await productDialog.getByLabel('Categoría').selectOption('1');
  await productDialog.getByRole('button', { name: 'Crear', exact: true }).click();
  await productDialog.waitFor({ state: 'hidden' });
  assert(state.products.some((item) => item.title === 'Nuevas gomitas' && item.priceCents === 2000), 'create did not convert whole pesos to cents');
  assert(state.lastProductMutation?.priceCents === 2000, 'create request did not send pesos as cents');
  assert(state.categoryCalls > 0, 'form did not load categories');

  // APF-08/09/10/11: backend errors preserve fields, pending submit is single-shot, focus and mobile dialog work.
  state.mutationStatus = 400;
  await page.getByRole('button', { name: 'Crear producto' }).click();
  await productDialog.getByLabel('Categoría').locator('option[value="1"]').waitFor({ state: 'attached' });
  await productDialog.getByLabel('Título').fill('Error product');
  await page.locator('dialog[open] input[name="price"]').fill('10');
  await productDialog.getByLabel('Categoría').selectOption('1');
  await productDialog.getByRole('button', { name: 'Crear', exact: true }).click();
  assert((await productDialog.getByRole('alert').textContent()).includes('stock: must be >= 0'), '400 summary did not retain backend errors');
  assert(await productDialog.getByLabel('Título').inputValue() === 'Error product', '400 cleared form values');
  assert(await page.locator('dialog[open] input[name="stock"]').getAttribute('aria-invalid') === 'true', '400 did not flag stock');
  assert(await page.locator('dialog[open] input[name="price"]').getAttribute('aria-invalid') === 'true', '400 did not flag price');
  await page.keyboard.press('Escape');
  state.mutationStatus = 200;
  state.mutationStatus = 400;
  await edit.click();
  await productDialog.getByLabel('Categoría').locator('option[value="1"]').waitFor({ state: 'attached' });
  await productDialog.getByRole('button', { name: 'Guardar cambios' }).click();
  assert((await productDialog.getByRole('alert').textContent()).includes('categoryId does not exist'), 'PATCH 400 did not retain category error');
  assert(await productDialog.getByLabel('Categoría').getAttribute('aria-invalid') === 'true', 'PATCH 400 did not flag category');
  await page.keyboard.press('Escape');
  state.mutationStatus = 200;
  state.delayMutation = true;
  await page.getByRole('button', { name: 'Crear producto' }).click();
  await productDialog.getByLabel('Categoría').locator('option[value="1"]').waitFor({ state: 'attached' });
  await productDialog.getByLabel('Título').fill('Pending product');
  await page.locator('dialog[open] input[name="price"]').fill('10');
  await productDialog.getByLabel('Categoría').selectOption('1');
  const beforePending = state.productMutations;
  await productDialog.getByRole('button', { name: 'Crear', exact: true }).click();
  assert(await productDialog.getByRole('button', { name: 'Guardando…' }).isDisabled(), 'saving state was not announced/disabled');
  assert(state.productMutations === beforePending + 1, 'pending submit sent more than one request');
  state.releaseMutation?.();
  await productDialog.waitFor({ state: 'hidden' });
  state.delayMutation = false;
  // A completed mutation must not remain retryable when only its list refresh fails.
  state.delayProducts = true;
  state.productsStatus = 500;
  const mutationsBeforeRefreshFailure = state.productMutations;
  await page.getByRole('button', { name: 'Crear producto' }).click();
  await productDialog.getByLabel('Categoría').locator('option[value="1"]').waitFor({ state: 'attached' });
  await productDialog.getByLabel('Título').fill('Refresh failure product');
  await page.locator('dialog[open] input[name="price"]').fill('10');
  await productDialog.getByLabel('Categoría').selectOption('1');
  await productDialog.getByRole('button', { name: 'Crear', exact: true }).click();
  await productDialog.waitFor({ state: 'hidden' });
  await page.waitForFunction(() => document.activeElement?.getAttribute('data-product-form-invoker') === 'create');
  assert(state.productMutations === mutationsBeforeRefreshFailure + 1, 'successful POST was not sent exactly once');
  state.delayProducts = false;
  state.releaseProducts?.();
  await page.getByRole('heading', { name: 'No se pudieron cargar los productos' }).waitFor();
  assert(await page.getByRole('button', { name: 'Crear', exact: true }).count() === 0, 'failed refresh left a save retry available');
  state.productsStatus = 200;
  await page.getByRole('button', { name: 'Reintentar' }).click();
  await page.locator('[role="row"]').filter({ hasText: 'Gomitas Dulces' }).waitFor();
  assert(state.productMutations === mutationsBeforeRefreshFailure + 1, 'list retry repeated the completed POST');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Crear producto' }).click();
  await page.waitForFunction(() => document.activeElement?.getAttribute('name') === 'title');
  assert(await page.evaluate(() => document.activeElement?.getAttribute('name') === 'title'), 'dialog did not focus title first');
  await page.keyboard.press('Shift+Tab');
  assert(await productDialog.getByRole('button', { name: 'Cerrar' }).evaluate((node) => document.activeElement === node), 'Shift+Tab escaped the dialog');
  await page.keyboard.press('Tab');
  assert(await page.locator('dialog[open] input[name="title"]').evaluate((node) => document.activeElement === node), 'Tab did not return to the first dialog control');
  assert(await productDialog.evaluate((node) => node.scrollWidth <= node.clientWidth), '390px dialog has horizontal overflow');
  await page.keyboard.press('Escape');
  await assert(page.getByText('admin@candy', { exact: true }).isVisible(), 'AdminLayout did not display authenticated email');
  for (const path of ['categorias', 'pedidos']) {
    await page.goto(`http://127.0.0.1:4182/admin/${path}`);
    await page.waitForURL('**/admin/productos');
  }

  state.meNetworkFailure = true;
  await page.reload();
  await page.getByRole('button', { name: 'Reintentar' }).waitFor();
  const meCallsBeforeRetry = state.meCalls;
  state.meNetworkFailure = false;
  await page.getByRole('button', { name: 'Reintentar' }).click();
  await page.waitForSelector('text=Gomitas Dulces');
  assert(state.meCalls === meCallsBeforeRetry + 1, 'retry did not issue another /me request');

  state.meAccountStatusFailure = true;
  await page.reload();
  await page.getByRole('button', { name: 'Reintentar' }).waitFor();
  assert(page.url().endsWith('/admin/productos'), 'account-status failure redirected to login');
  assert(await page.evaluate(() => sessionStorage.getItem('admin_token') !== null), 'account-status failure cleared token');
  const meCallsBeforeAccountStatusRetry = state.meCalls;
  state.meAccountStatusFailure = false;
  await page.getByRole('button', { name: 'Reintentar' }).click();
  await page.waitForSelector('text=Gomitas Dulces');
  assert(state.meCalls === meCallsBeforeAccountStatusRetry + 1, 'account-status failure could not retry');

  state.delayProducts = true;
  await page.reload();
  await page.getByText('Cargando productos…').waitFor();
  state.delayProducts = false;
  state.releaseProducts?.();
  await page.waitForSelector('text=Gomitas Dulces');

  state.productsStatus = 500;
  await page.reload();
  await assert(page.getByRole('alert').isVisible(), 'products error state missing');
  state.productsStatus = 200;

  state.products = [];
  await page.reload();
  await assert(page.getByText('No hay productos').isVisible(), 'products empty state missing');
  state.products = [
    { id: 1, title: 'Gomitas Dulces', priceCents: 1250, stock: 10, active: true, categoryId: 1, category: 'Gomitas' },
    { id: 2, title: 'Caramelos Surtidos', priceCents: 800, stock: 5, active: true, categoryId: 2, category: 'Caramelos' },
    { id: 3, title: 'Chocolates Premium', priceCents: 3500, stock: 0, active: false, categoryId: 3, category: 'Chocolates' },
  ];
  await page.reload();
  await page.locator('[role="row"]').filter({ hasText: 'Gomitas Dulces' }).waitFor();
  await page.waitForFunction(() => document.querySelectorAll('[role="row"]').length === 4);
  assert((await page.locator('[role="row"]').count()) === 4, 'products list should render its header and three product rows');
  const firstProductRow = page.locator('[role="row"]').filter({ hasText: 'Gomitas Dulces' });
  await firstProductRow.getByRole('button', { name: 'Desactivar' }).click();
  await firstProductRow.getByRole('button', { name: 'Reactivar' }).waitFor();
  await firstProductRow.getByRole('button', { name: 'Reactivar' }).click();
  await firstProductRow.getByRole('button', { name: 'Desactivar' }).waitFor();

  state.productsStatus = 401;
  await page.reload();
  await page.waitForURL('**/admin/login');
  await assert(await page.evaluate(() => sessionStorage.getItem('admin_token') === null), 'product 401 did not clear token');
  state.productsStatus = 200;
  await page.getByLabel('Email').fill('admin@candy');
  await page.getByLabel('Contraseña').fill('secret');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await page.waitForURL('**/admin/productos');

  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await page.waitForURL('**/admin/login');
  await assert(await page.evaluate(() => sessionStorage.getItem('admin_token') === null), 'logout did not clear token');
  state.me401 = true;
  await page.evaluate(() => sessionStorage.setItem('admin_token', 'stale.token.value'));
  await page.goto('http://127.0.0.1:4182/admin/productos');
  await page.waitForURL('**/admin/login');
  await assert(await page.evaluate(() => sessionStorage.getItem('admin_token') === null), '401 did not clear token');

  await page.getByLabel('Email').focus();
  await page.keyboard.press('Tab');
  await assert(await page.evaluate(() => document.activeElement?.id === 'admin-password'), 'keyboard focus order broken');
  await page.setViewportSize({ width: 390, height: 844 });
  state.me401 = false;
  await page.getByLabel('Email').fill('admin@candy');
  await page.getByLabel('Contraseña').fill('secret');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await page.waitForURL('**/admin/productos');
  await assert(await page.locator('aside').evaluate((node) => getComputedStyle(node).flexDirection === 'row'), '390px sidebar did not collapse');
  assert(errors.length === 0, `console/network errors: ${errors.join(' | ')}`);
  return { scenarios: 36, consoleErrors: errors.length };
}
