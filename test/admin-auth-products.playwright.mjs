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
    // The login-error and bootstrap-401 scenarios intentionally exercise 401.
    if (!text.includes('401 (Unauthorized)') && !msg.location().url.endsWith('/api/admin/me')) errors.push(`${text} @ ${msg.location().url}`);
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
      if (state.delayProducts) await new Promise((resolve) => setTimeout(resolve, 300));
      return json(route, state.productsStatus === 200 ? state.products : { error: 'Backend unavailable' }, state.productsStatus);
    }
    const match = url.match(/\/api\/admin\/products\/(\d+)$/);
    if (match && request.method() === 'DELETE') {
      const product = state.products.find((item) => item.id === Number(match[1]));
      product.active = false;
      return json(route, { id: product.id, active: false, deleted: true });
    }
    if (match && request.method() === 'PATCH') {
      const product = state.products.find((item) => item.id === Number(match[1]));
      product.active = true;
      return json(route, product);
    }
    return json(route, { error: 'Unexpected mock route' }, 404);
  });
  await page.route('**/AdminLogin*', async (route) => {
    await page.waitForTimeout(300);
    await route.continue();
  });

  await page.setViewportSize({ width: 1280, height: 800 });
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
  await assert(page.getByText('admin@candy', { exact: true }).isVisible(), 'AdminLayout did not display authenticated email');

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
  await assert(page.getByText('Cargando productos…').isVisible(), 'loading state missing');
  state.delayProducts = false;
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
  await page.waitForSelector('text=Gomitas Dulces');
  assert((await page.getByRole('row').count()) === 4, 'products list should have header plus 3 rows');
  const firstProductRow = page.getByRole('row').filter({ hasText: 'Gomitas Dulces' });
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
  return { scenarios: 15, consoleErrors: errors.length };
}
