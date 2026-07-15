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
    categoriesPageMode: false,
    categoryListStatus: 200,
    delayCategoryList: false,
    releaseCategoryList: null,
    categoryMutationStatus: 200,
    delayCategoryMutation: false,
    releaseCategoryMutation: null,
    categoryMutations: 0,
    ordersStatus: 200,
    delayOrders: false,
    releaseOrders: null,
    orderMutationStatus: 200,
    delayOrderMutation: false,
    releaseOrderMutation: null,
    orderMutationResolvers: [],
    orderMutations: 0,
    lastOrderMutation: null,
    orderDetailStatus: 200,
    orderDetailGets: 0,
    orderListRequests: [],
    delayedOrderFilters: new Set(),
    liveDelayedOrderFilters: new Set(),
    orderListResolvers: [],
    orders: [
      { id: 11, orderNumber: 'CL-101', status: 'PENDING', totalCents: 1250, paymentMethod: 'CASH', paymentStatus: 'PENDING', contact: { id: 1, name: 'Ana', phone: '11-1111', address: 'Calle 1', city: 'CABA', province: 'Buenos Aires', postalCode: '1000' }, items: [{ productId: 1, productTitle: 'Gomitas', quantity: 2, priceCents: 625, subtotalCents: 1250 }] },
      { id: 12, orderNumber: 'CL-102', status: 'SHIPPED', totalCents: 2400, paymentMethod: 'TRANSFER', paymentStatus: 'PENDING', contact: null, items: [] },
    ],
    categories: [{ id: 1, name: 'Gomitas', slug: 'gomitas', active: true }],
    products: [
      { id: 1, title: 'Gomitas Dulces', priceCents: 1250, stock: 10, active: true, categoryId: 1, category: 'Gomitas' },
      { id: 2, title: 'Caramelos Surtidos', priceCents: 800, stock: 5, active: true, categoryId: 2, category: 'Caramelos' },
      { id: 3, title: 'Chocolates Premium', priceCents: 3500, stock: 0, active: false, categoryId: 3, category: 'Chocolates' },
    ],
  };
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  // Each original runtime scenario belongs to exactly one deterministic batch.
  // Set globalThis.__CANDYLAND_RUNTIME_BATCH__ before invoking this function.
  const RUNTIME_BATCHES = Object.freeze({
    'auth-products': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
    categories: [15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29],
    'product-form': [30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48],
    'orders-foundation': [49, 50, 51, 52, 53, 54, 55, 56],
    'orders-races-failures': [57, 58, 59, 60, 61, 62, 63, 64, 65],
  });
  const runtimeBatch = globalThis.__CANDYLAND_RUNTIME_BATCH__ ?? page.url().match(/[?&]runtimeBatch=([^&]+)/)?.[1] ?? 'all';
  assert(runtimeBatch === 'all' || Object.hasOwn(RUNTIME_BATCHES, runtimeBatch), `unknown runtime batch: ${runtimeBatch}`);
  const shouldRun = (batch) => runtimeBatch === 'all' || runtimeBatch === batch;
  const json = (route, body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

  await page.unroute('**/api/**');
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    // The explicit login/auth, category-error, and mutation-error scenarios
    // intentionally exercise these HTTP failures; every other console error fails.
    if (text.includes('401 (Unauthorized)') || msg.location().url.endsWith('/api/admin/me')) return;
    if (msg.location().url.includes('/api/admin/categories') || msg.location().url.includes('/api/admin/orders')) return;
    if (msg.location().url.includes('/api/admin/products')) return;
    errors.push(`${text} @ ${msg.location().url}`);
  });
  page.on('requestfailed', (request) => {
    if (!request.url().endsWith('/api/admin/me') && !request.url().includes('/api/admin/categories') && !request.url().includes('/api/admin/orders')) errors.push(`request failed: ${request.url()}`);
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
    if (url.includes('/api/admin/orders')) {
      const match = url.match(/\/api\/admin\/orders\/(\d+)$/);
      if (request.method() === 'GET' && match) {
        state.orderDetailGets += 1;
        const order = state.orders.find((item) => item.id === Number(match[1]));
        return json(route, state.orderDetailStatus === 200 ? (order ?? { error: 'Order not found' }) : { error: 'Detail unavailable' }, state.orderDetailStatus === 200 && order ? 200 : state.orderDetailStatus);
      }
      if (request.method() === 'GET') {
        const status = /[?&]status=([^&]+)/.exec(url)?.[1] ?? '';
        state.orderListRequests.push(status);
        let orders = state.ordersStatus === 'empty' ? [] : state.orders.filter((item) => !status || item.status === status).map((item) => ({ ...item }));
        if (state.delayOrders || state.delayedOrderFilters.has(status)) await new Promise((resolve) => {
          state.releaseOrders = resolve;
          state.orderListResolvers.push({ status, resolve });
        });
        if (state.liveDelayedOrderFilters.has(status)) orders = state.orders.filter((item) => !status || item.status === status).map((item) => ({ ...item }));
        if (state.ordersStatus !== 200 && state.ordersStatus !== 'empty') {
          const transient = state.ordersStatus === 'transient401';
          return json(route, { error: transient ? 'Unable to verify account status' : 'Orders unavailable' }, transient ? 401 : state.ordersStatus);
        }
        return json(route, orders);
      }
      if (request.method() === 'PATCH' && match) {
        state.orderMutations += 1;
        if (state.delayOrderMutation) await new Promise((resolve) => {
          state.releaseOrderMutation = resolve;
          state.orderMutationResolvers.push(resolve);
        });
        if (state.orderMutationStatus === 'network') return route.abort('failed');
        if (state.orderMutationStatus !== 200) {
          const transient = state.orderMutationStatus === 'transient401';
          return json(route, { error: transient ? 'Unable to verify account status' : state.orderMutationStatus === 404 ? 'Order not found' : state.orderMutationStatus === 400 ? 'Validation failed' : 'expired' }, transient ? 401 : state.orderMutationStatus);
        }
        const order = state.orders.find((item) => item.id === Number(match[1]));
        state.lastOrderMutation = request.postDataJSON();
        Object.assign(order, state.lastOrderMutation);
        return json(route, order);
      }
    }
    if (url.includes('/api/admin/categories')) {
      if (state.categoriesPageMode) {
        if (request.method() === 'GET') {
          if (state.delayCategoryList) await new Promise((resolve) => { state.releaseCategoryList = resolve; });
          const transient = state.categoryListStatus === 'transient401';
          return json(route, state.categoryListStatus === 200 || state.categoryListStatus === 'empty' ? (state.categoryListStatus === 'empty' ? [] : state.categories) : { error: transient ? 'Unable to verify account status' : 'Categories unavailable' }, transient ? 401 : state.categoryListStatus === 'empty' ? 200 : state.categoryListStatus);
        }
        state.categoryMutations += 1;
        if (state.delayCategoryMutation) await new Promise((resolve) => { state.releaseCategoryMutation = resolve; });
        if (state.categoryMutationStatus !== 200 && state.categoryMutationStatus !== 201 && state.categoryMutationStatus !== 204) return json(route, { error: state.categoryMutationStatus === 409 ? 'Ya existe una categoría con ese nombre' : state.categoryMutationStatus === 404 ? 'Categoría no encontrada' : 'Validation failed', errors: state.categoryMutationStatus === 400 ? ['name: is required'] : undefined }, state.categoryMutationStatus);
        const match = url.match(/\/api\/admin\/categories\/(\d+)$/);
        if (request.method() === 'POST') {
          const item = { id: Math.max(0, ...state.categories.map((category) => category.id)) + 1, name: request.postDataJSON().name, slug: request.postDataJSON().name.toLowerCase(), active: true };
          state.categories.push(item);
          return json(route, item, 201);
        }
        if (request.method() === 'PATCH' && match) {
          const item = state.categories.find((category) => category.id === Number(match[1]));
          Object.assign(item, { name: request.postDataJSON().name });
          return json(route, item);
        }
        if (request.method() === 'DELETE' && match) {
          state.categories = state.categories.filter((category) => category.id !== Number(match[1]));
          return route.fulfill({ status: 204 });
        }
      }
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
  const signIn = async () => {
    await page.goto('http://127.0.0.1:4182/admin/login');
    await page.getByLabel('Email').fill('admin@candy');
    await page.getByLabel('Contraseña').fill('secret');
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await page.waitForURL('**/admin/productos');
  };
  await page.setViewportSize({ width: 1280, height: 800 });
  if (shouldRun('auth-products')) {
  await page.goto('http://127.0.0.1:4182/contacto');
  await page.evaluate(() => sessionStorage.clear());
  await page.getByRole('heading', { name: 'COMUNICATE CON NOSOTROS' }).waitFor();
  assert(await page.locator('header').isVisible(), 'public Header missing');
  assert(await page.locator('footer').isVisible(), 'public Footer missing');

  for (const path of ['pedidos']) {
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
  await page.waitForURL('**/admin/pedidos');
  await page.goto('http://127.0.0.1:4182/admin/productos');
  await page.getByText('Gomitas Dulces', { exact: true }).waitFor();
  } else {
    await signIn();
  }

  // AC-01..13: protected category route, list states, CRUD outcomes, shared
  // auth semantics, native dialog lifecycle, and narrow light-only layout.
  if (shouldRun('categories')) {
  state.categoriesPageMode = true;
  state.delayCategoryList = true;
  const categoryLoad = page.goto('http://127.0.0.1:4182/admin/categorias');
  await page.getByText('Cargando categorías…').waitFor();
  const categoryLoadingStatus = page.locator('[role="status"][aria-busy="true"]');
  assert(await categoryLoadingStatus.isVisible(), 'category loading is not an announced status');
  assert(await categoryLoadingStatus.getAttribute('aria-live') === 'polite', 'category loading status is not live');
  assert(await page.getByText('CandyLand Admin').isVisible(), 'category route did not render inside the admin shell');
  assert(await page.locator('footer').count() === 0 && await page.getByRole('link', { name: 'Tienda' }).count() === 0, 'category route rendered public chrome');
  state.delayCategoryList = false;
  state.releaseCategoryList?.();
  await categoryLoad;
  await page.getByText('Gomitas', { exact: true }).waitFor();
  await page.getByRole('link', { name: 'Categorías' }).waitFor();

  state.categoryListStatus = 500;
  await page.reload();
  await page.getByRole('alert').waitFor();
  assert(page.url().endsWith('/admin/categorias'), 'retryable category failure redirected to login');
  state.categoryListStatus = 200;
  await page.getByRole('button', { name: 'Reintentar' }).click();
  await page.getByText('Gomitas', { exact: true }).waitFor();
  state.categoryListStatus = 'empty';
  await page.reload();
  await page.getByText('No hay categorías').waitFor();
  assert(await page.getByRole('button', { name: 'Crear categoría' }).isVisible(), 'empty categories did not allow creation');
  state.categoryListStatus = 200;
  await page.getByRole('button', { name: 'Crear categoría' }).click();
  const categoryDialog = page.locator('dialog[open]');
  await page.waitForFunction(() => document.activeElement?.getAttribute('name') === 'name');
  await categoryDialog.getByLabel('Nombre').fill('Caramelos');
  await categoryDialog.getByRole('button', { name: 'Crear', exact: true }).click();
  await categoryDialog.waitFor({ state: 'hidden' });
  await page.getByText('Caramelos', { exact: true }).waitFor();

  const caramelosRow = page.getByRole('row').filter({ hasText: 'Caramelos' });
  const editCategory = caramelosRow.getByRole('button', { name: 'Editar' });
  await editCategory.click();
  await categoryDialog.getByLabel('Nombre').fill('Dulces');
  await categoryDialog.getByRole('button', { name: 'Guardar cambios' }).click();
  await categoryDialog.waitFor({ state: 'hidden' });
  await page.getByText('Dulces', { exact: true }).waitFor();

  await page.getByRole('button', { name: 'Crear categoría' }).click();
  await categoryDialog.getByLabel('Nombre').fill('Gomitas');
  state.categoryMutationStatus = 409;
  await categoryDialog.getByRole('button', { name: 'Crear', exact: true }).click();
  assert((await categoryDialog.getByRole('alert').textContent()).includes('Ya existe'), 'duplicate category error missing');
  assert(await categoryDialog.getByLabel('Nombre').inputValue() === 'Gomitas', 'duplicate category cleared input');
  await page.keyboard.press('Escape');
  state.categoryMutationStatus = 404;
  await page.getByRole('row').filter({ hasText: 'Dulces' }).getByRole('button', { name: 'Editar' }).click();
  await categoryDialog.getByLabel('Nombre').fill('Conservado');
  await categoryDialog.getByRole('button', { name: 'Guardar cambios' }).click();
  assert((await categoryDialog.getByRole('alert').textContent()).includes('no encontrada'), 'missing edit error missing');
  assert(await categoryDialog.getByLabel('Nombre').inputValue() === 'Conservado', 'missing edit cleared input');
  await page.keyboard.press('Escape');
  state.categoryMutationStatus = 201;
  state.delayCategoryMutation = true;
  await page.getByRole('button', { name: 'Crear categoría' }).click();
  await categoryDialog.getByLabel('Nombre').fill('Pendiente');
  const pendingBefore = state.categoryMutations;
  await categoryDialog.getByRole('button', { name: 'Crear', exact: true }).click();
  await categoryDialog.getByRole('button', { name: 'Guardando…' }).waitFor();
  await page.keyboard.press('Escape');
  assert(await categoryDialog.isVisible() && state.categoryMutations === pendingBefore + 1, 'pending category save closed or duplicated');
  state.delayCategoryMutation = false;
  state.releaseCategoryMutation?.();
  await categoryDialog.waitFor({ state: 'hidden' });

  const deleteCategory = page.getByRole('row').filter({ hasText: 'Pendiente' }).getByRole('button', { name: 'Eliminar' });
  const deleteBefore = state.categoryMutations;
  await deleteCategory.click();
  const deleteDialog = page.locator('dialog[open]');
  assert(state.categoryMutations === deleteBefore, 'delete was sent before confirmation');
  await page.keyboard.press('Escape');
  await deleteDialog.waitFor({ state: 'hidden' });
  assert(await deleteCategory.evaluate((node) => document.activeElement === node), 'delete Escape did not restore invoker focus');
  await deleteCategory.click();
  state.categoryMutationStatus = 409;
  await deleteDialog.getByRole('button', { name: 'Eliminar', exact: true }).click();
  assert((await deleteDialog.getByRole('alert').textContent()).includes('Ya existe') || (await deleteDialog.getByRole('alert').textContent()).includes('Validation'), 'blocked delete error missing');
  assert(await page.getByText('Pendiente', { exact: true }).count() > 0, 'blocked delete removed row');
  state.categoryMutationStatus = 404;
  await deleteDialog.getByRole('button', { name: 'Eliminar', exact: true }).click();
  assert((await deleteDialog.getByRole('alert').textContent()).includes('no encontrada'), 'missing delete error missing');
  state.categoryMutationStatus = 204;
   await deleteDialog.getByRole('button', { name: 'Eliminar', exact: true }).click();
   await deleteDialog.waitFor({ state: 'hidden' });
   assert(await page.getByText('Pendiente', { exact: true }).count() === 0, '204 delete did not remove exact row');
   const categoriesHeading = page.getByRole('heading', { name: 'Categorías' });
   await page.waitForFunction(() => document.activeElement?.textContent === 'Categorías');
   assert(await categoriesHeading.evaluate((node) => document.activeElement === node), '204 delete did not restore focus to the Categories heading');
  assert(await page.evaluate(() => document.activeElement !== document.body), '204 delete left focus on document body');
  await page.setViewportSize({ width: 390, height: 844 });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), '390px categories page has horizontal overflow');
  state.categoryListStatus = 'transient401';
  await page.reload();
  await page.getByRole('alert').waitFor();
  assert(await page.evaluate(() => sessionStorage.getItem('admin_token') !== null), 'transient category 401 cleared session');
  state.categoryListStatus = 401;
  await page.reload();
  await page.waitForURL('**/admin/login');
  assert(await page.evaluate(() => sessionStorage.getItem('admin_token') === null), 'genuine category 401 retained session');
  state.categoryListStatus = 200;
  await page.getByLabel('Email').fill('admin@candy');
  await page.getByLabel('Contraseña').fill('secret');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await page.waitForURL('**/admin/categorias');
  state.categoriesPageMode = false;
  await page.goto('http://127.0.0.1:4182/admin/productos');
  }

  // Scope every form interaction to the open dialog: a just-closed native dialog
  // can remain mounted until React commits its parent state update.
  if (shouldRun('product-form')) {
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
  await productDialog.locator('input[name="price"]').fill('12.6');
  await productDialog.getByRole('button', { name: 'Guardar cambios' }).click();
  assert(state.productMutations === mutationsBeforeInvalid + 1, 'changed fractional price sent a mutation');
  await page.keyboard.press('Escape');
  await productDialog.waitFor({ state: 'hidden' });
  assert(await edit.evaluate((node) => document.activeElement === node), 'Escape did not restore invoker focus');
  const detailGetsBefore = state.productGets;
  await edit.click();
  await productDialog.locator('input[name="price"]').fill('15');
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
  await productDialog.locator('input[name="price"]').fill('20');
  assert(await productDialog.getByLabel('Título').inputValue() === 'Nuevas gomitas', 'title locator did not target the title field');
  assert(await productDialog.locator('input[name="price"]').inputValue() === '20', 'price input did not receive its value');
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
  await productDialog.locator('input[name="price"]').fill('10');
  await productDialog.getByLabel('Categoría').selectOption('1');
  await productDialog.getByRole('button', { name: 'Crear', exact: true }).click();
  assert((await productDialog.getByRole('alert').textContent()).includes('stock: must be >= 0'), '400 summary did not retain backend errors');
  assert(await productDialog.getByLabel('Título').inputValue() === 'Error product', '400 cleared form values');
  assert(await page.locator('dialog[open] input[name="stock"]').getAttribute('aria-invalid') === 'true', '400 did not flag stock');
  assert(await productDialog.locator('input[name="price"]').getAttribute('aria-invalid') === 'true', '400 did not flag price');
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
  await productDialog.locator('input[name="price"]').fill('10');
  await productDialog.getByLabel('Categoría').selectOption('1');
  const beforePending = state.productMutations;
  await productDialog.getByRole('button', { name: 'Crear', exact: true }).click();
  assert(await productDialog.getByRole('button', { name: 'Guardando…' }).isDisabled(), 'saving state was not announced/disabled');
  assert(await productDialog.getByRole('button', { name: 'Cerrar' }).isDisabled(), 'header close remained enabled while saving');
  await page.keyboard.press('Escape');
  await productDialog.getByRole('button', { name: 'Cerrar' }).click({ force: true });
  assert(await productDialog.isVisible(), 'pending dialog closed through Escape or header close');
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
  await productDialog.locator('input[name="price"]').fill('10');
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
  await page.getByText('admin@candy', { exact: true }).waitFor();
  assert(await page.getByText('admin@candy', { exact: true }).isVisible(), 'AdminLayout did not display authenticated email');
  }
  // AO-01..10: protected orders route, list states, detail, status updates,
  // failure retention, central expiry, and narrow presentation.
  let filterSelect;
  let orderSelect;
  let orderSave;
  if (shouldRun('orders-foundation')) {
  state.delayOrders = true;
  const ordersLoad = page.goto('http://127.0.0.1:4182/admin/pedidos');
  await page.getByText('Cargando pedidos…').waitFor();
  assert(await page.getByRole('status').getAttribute('aria-live') === 'polite', 'orders loading is not announced');
  assert(await page.getByRole('link', { name: 'Pedidos' }).isVisible(), 'orders navigation is not enabled');
  assert(await page.locator('footer').count() === 0, 'orders route rendered public chrome');
  state.delayOrders = false;
  state.releaseOrders?.();
  await ordersLoad;
  await page.getByText('CL-101', { exact: true }).waitFor();
  assert(await page.getByText('Efectivo', { exact: true }).isVisible(), 'cash payment was not formatted');
  assert(await page.getByText('Transferencia', { exact: true }).isVisible(), 'transfer payment was not formatted');

   filterSelect = page.locator('select').first();
  await filterSelect.selectOption('SHIPPED');
  await page.getByText('CL-102', { exact: true }).waitFor();
  assert(await page.getByText('CL-101', { exact: true }).count() === 0, 'status filter did not constrain list');
  state.ordersStatus = 500;
  await filterSelect.selectOption('PENDING');
  await page.getByRole('alert').waitFor();
  state.ordersStatus = 200;
  await page.getByRole('button', { name: 'Reintentar' }).click();
  await page.getByText('CL-101', { exact: true }).waitFor();
  assert(await page.getByText('CL-102', { exact: true }).count() === 0, 'retry did not retain selected status filter');
  state.ordersStatus = 'empty';
  await page.reload();
  await page.getByText('No hay pedidos').waitFor();
  state.ordersStatus = 200;
   await page.reload();
   state.orderDetailStatus = 500;
   const detailGetsBeforeRetry = state.orderDetailGets;
   await page.getByText('CL-101', { exact: true }).click();
   await page.getByRole('button', { name: 'Reintentar detalle' }).waitFor();
   state.orderDetailStatus = 200;
   await page.getByRole('button', { name: 'Reintentar detalle' }).click();
   await page.getByText('Calle 1, CABA, Buenos Aires, 1000').waitFor();
   assert(state.orderDetailGets === detailGetsBeforeRetry + 2, 'detail retry did not issue a second GET');
   assert(await page.getByText('Gomitas × 2').isVisible(), 'order detail did not render item content');

    orderSelect = page.getByLabel('Estado del pedido CL-101');
   await filterSelect.selectOption('');
   await page.getByText('CL-102', { exact: true }).waitFor();
   await page.getByText('CL-102', { exact: true }).click();
   const orderSelectTwo = page.getByLabel('Estado del pedido CL-102');
    orderSave = orderSelect.locator('xpath=ancestor::div[1]').getByRole('button');
   const orderSaveTwo = orderSelectTwo.locator('xpath=ancestor::div[1]').getByRole('button');
   await orderSelect.selectOption('DELIVERED');
   await orderSelectTwo.selectOption('DELIVERED');
   state.delayOrderMutation = true;
   const mutationBefore = state.orderMutations;
   await orderSave.click();
   await page.getByRole('button', { name: 'Guardando…' }).waitFor();
   assert(await orderSelect.isDisabled(), 'first pending order select was not disabled');
   assert(await orderSave.isDisabled(), 'first pending order submit was not disabled');
   await orderSave.click({ force: true });
   assert(state.orderMutations === mutationBefore + 1, 'same order pending update sent a duplicate request');
   await orderSaveTwo.click();
   await page.waitForFunction(() => [...document.querySelectorAll('button')].filter((button) => button.textContent === 'Guardando…').length === 2);
   assert(state.orderMutations === mutationBefore + 2, 'second order update did not start while first was pending');
   assert(await orderSelect.isDisabled() && await orderSelectTwo.isDisabled(), 'overlapping updates did not keep both orders disabled');
   state.orderMutationResolvers.shift()?.();
   await page.getByRole('button', { name: 'Guardar estado' }).waitFor();
   assert(await orderSelectTwo.isDisabled(), 'first completion cleared the other order pending state');
   state.orderMutationResolvers.shift()?.();
   state.delayOrderMutation = false;
    await page.locator('summary').filter({ hasText: 'Entregado' }).waitFor();
    assert(state.lastOrderMutation?.status === 'DELIVERED', 'order update did not send canonical status');
  }

  if (shouldRun('orders-races-failures')) {
    if (runtimeBatch === 'orders-races-failures') {
      await page.goto('http://127.0.0.1:4182/admin/pedidos');
      await page.getByText('CL-101', { exact: true }).waitFor();
      filterSelect = page.locator('select').first();
      await page.locator('details').filter({ hasText: 'CL-101' }).evaluate((detail) => { detail.open = true; });
      orderSelect = page.getByLabel('Estado del pedido CL-101');
      orderSave = orderSelect.locator('xpath=ancestor::div[1]').getByRole('button');
    }

    state.orders[0].status = 'PENDING';
   state.orders[1].status = 'SHIPPED';

   state.delayedOrderFilters.add('PENDING');
   await filterSelect.selectOption('PENDING');
   await page.waitForFunction(() => document.querySelector('select')?.value === 'PENDING');
   await filterSelect.selectOption('SHIPPED');
   await page.getByText('CL-102', { exact: true }).waitFor();
   state.orderListResolvers.find((item) => item.status === 'PENDING')?.resolve();
   state.delayedOrderFilters.delete('PENDING');
   await page.waitForTimeout(20);
   assert(await page.getByText('CL-101', { exact: true }).count() === 0, 'stale filtered response replaced the newer filter result');

   await filterSelect.selectOption('PENDING');
   await page.getByText('CL-101', { exact: true }).waitFor();
   await page.locator('details').filter({ hasText: 'CL-101' }).evaluate((detail) => { detail.open = true; });
   await orderSelect.waitFor({ state: 'attached' });
   await orderSelect.selectOption('DELIVERED');
   await page.getByRole('button', { name: 'Guardar estado' }).click();
    await page.getByText('No hay pedidos').waitFor();
    assert(await page.getByText('CL-101', { exact: true }).count() === 0, 'updated order remained visible outside the active filter');

    // AO-03 ordering: PATCH completion must reconcile against the latest filter,
    // even when that filter changed while the request was pending.
    const orderingErrors = [];
    state.orders[0].status = 'PENDING';
    state.delayOrderMutation = true;
    await filterSelect.selectOption('SHIPPED');
    await page.getByText('CL-102', { exact: true }).waitFor();
    await filterSelect.selectOption('PENDING');
    await page.getByText('CL-101', { exact: true }).waitFor();
    await page.getByText('CL-101', { exact: true }).click();
    await orderSelect.selectOption('DELIVERED');
    await orderSave.click();
    await page.getByRole('button', { name: 'Guardando…' }).waitFor();
    await filterSelect.selectOption('DELIVERED');
    await page.getByText('No hay pedidos').waitFor();
    state.releaseOrderMutation?.();
    state.delayOrderMutation = false;
    await page.waitForTimeout(20);
    if (await page.locator('summary').filter({ hasText: 'Entregado' }).count() !== 1) orderingErrors.push('matching filter change during PATCH omitted the updated order');

    // AO-03 ordering: a list snapshot captured before PATCH must never restore
    // the status that PATCH has already replaced.
    state.orders[0].status = 'PENDING';
    await filterSelect.selectOption('PENDING');
    await page.getByText('CL-101', { exact: true }).waitFor();
    await page.getByText('CL-101', { exact: true }).click();
    await orderSelect.selectOption('DELIVERED');
    const pendingLists = state.orderListResolvers.length;
    state.delayedOrderFilters.add('');
    await filterSelect.selectOption('');
    await page.waitForTimeout(20);
    assert(state.orderListResolvers.length === pendingLists + 1, 'pre-mutation list request did not start');
    await orderSave.click();
    await page.locator('summary').filter({ hasText: 'Entregado' }).waitFor();
    state.orderListResolvers.at(-1)?.resolve();
    state.delayedOrderFilters.delete('');
    await page.waitForTimeout(20);
     if (await page.locator('summary').filter({ hasText: 'Pendiente' }).count() !== 0) orderingErrors.push('pre-mutation list snapshot restored the stale order');

     // A list started after PATCH must remain valid when PATCH completes first.
     state.orders[0].status = 'PENDING';
     state.orders[1].status = 'DELIVERED';
     await filterSelect.selectOption('PENDING');
     await page.getByText('CL-101', { exact: true }).waitFor();
     await page.locator('details').filter({ hasText: 'CL-101' }).evaluate((detail) => { detail.open = true; });
     await orderSelect.waitFor({ state: 'attached' });
     await orderSelect.selectOption('DELIVERED');
     state.delayOrderMutation = true;
     await orderSave.click();
     await page.getByRole('button', { name: 'Guardando…' }).waitFor();
     state.delayedOrderFilters.add('DELIVERED');
     state.liveDelayedOrderFilters.add('DELIVERED');
     const newerLists = state.orderListResolvers.length;
     await filterSelect.selectOption('DELIVERED');
     await page.waitForTimeout(20);
     assert(state.orderListResolvers.length === newerLists + 1, 'newer filter request did not start while PATCH was pending');
     state.releaseOrderMutation?.();
     state.delayOrderMutation = false;
     await page.getByRole('button', { name: 'Guardar estado' }).waitFor();
     state.orderListResolvers.at(-1)?.resolve();
     state.delayedOrderFilters.delete('DELIVERED');
     await page.getByText('CL-102', { exact: true }).waitFor();
     await page.getByText('CL-101', { exact: true }).waitFor();
     state.liveDelayedOrderFilters.delete('DELIVERED');
     if (orderingErrors.length) throw new Error(orderingErrors.join(' | '));

   state.orders[0].status = 'DELIVERED';
   state.orders[1].status = 'SHIPPED';
   await filterSelect.selectOption('');
   await page.getByText('CL-101', { exact: true }).waitFor();
   await page.locator('details').filter({ hasText: 'CL-101' }).evaluate((detail) => { detail.open = true; });
   await orderSelect.waitFor({ state: 'attached' });

   for (const status of [400, 404, 'network', 'transient401']) {
     state.orderMutationStatus = status;
     await orderSelect.selectOption('PENDING');
     await orderSave.click();
    await page.getByRole('alert').waitFor();
    assert(await orderSelect.inputValue() === 'PENDING', `${status} did not preserve draft`);
    assert(await page.locator('summary').filter({ hasText: 'Entregado' }).count() > 0, `${status} changed returned order before success`);
  }
  state.orderMutationStatus = 200;
  await page.setViewportSize({ width: 390, height: 844 });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), '390px orders page has horizontal overflow');
   state.orderMutationStatus = 401;
   await orderSave.click();
  await page.waitForURL('**/admin/login');
  assert(await page.evaluate(() => sessionStorage.getItem('admin_token') === null), 'genuine order 401 retained session');
  state.orderMutationStatus = 200;
  await page.getByLabel('Email').fill('admin@candy');
  await page.getByLabel('Contraseña').fill('secret');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await page.waitForURL('**/admin/pedidos');
  await page.goto('http://127.0.0.1:4182/admin/productos');
  }

  if (shouldRun('auth-products')) {
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
  await page.getByRole('alert').waitFor();
  assert(await page.getByRole('alert').isVisible(), 'products error state missing');
  state.productsStatus = 200;

  state.products = [];
  await page.reload();
  await page.getByText('No hay productos').waitFor();
  assert(await page.getByText('No hay productos').isVisible(), 'products empty state missing');
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
  }
  assert(errors.length === 0, `console/network errors: ${errors.join(' | ')}`);
  const executedBatches = runtimeBatch === 'all' ? Object.keys(RUNTIME_BATCHES) : [runtimeBatch];
  return {
    batch: runtimeBatch,
    batches: Object.fromEntries(executedBatches.map((name) => [name, RUNTIME_BATCHES[name].length])),
    scenarios: executedBatches.reduce((total, name) => total + RUNTIME_BATCHES[name].length, 0),
    consoleErrors: errors.length,
  };
}
