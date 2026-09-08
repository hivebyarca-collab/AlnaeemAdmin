/**
 * Final API integration verification — run with Admin + API + Postgres up.
 * Usage: node scripts/verify-api-integration.mjs
 */
const API = 'http://localhost:4000/api/v1';
const ADMIN = 'http://localhost:3001';
const EMAIL = process.env.VERIFY_ADMIN_EMAIL ?? 'omarjananpng@gmail.com';
const PASSWORD = process.env.VERIFY_ADMIN_PASSWORD ?? '';

const results = {};

function pass(key) {
  results[key] = 'pass';
}
function fail(key, reason) {
  results[key] = `fail: ${reason}`;
}
function partial(key, reason) {
  results[key] = `partial: ${reason}`;
}

function extractToken(setCookie) {
  if (!setCookie) return null;
  const m = setCookie.match(/al-naeem-admin-session=([^;]+)/);
  return m?.[1] ? decodeURIComponent(m[1]) : null;
}

async function api(path, init = {}, cookie) {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (cookie) headers.set('Cookie', `al-naeem-admin-session=${cookie}`);
  const res = await fetch(`${API}${path}`, { ...init, headers, cache: 'no-store' });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { res, json, text };
}

async function adminPage(path, cookie, expectRedirect = false) {
  const res = await fetch(`${ADMIN}${path}`, {
    headers: cookie ? { Cookie: `al-naeem-admin-session=${cookie}` } : {},
    redirect: 'manual',
    cache: 'no-store',
  });
  return res;
}

async function main() {
  if (!PASSWORD) {
    console.error('Set VERIFY_ADMIN_PASSWORD for integration verification.');
    process.exit(1);
  }
  // 1. Login
  const login = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const token = extractToken(login.res.headers.get('set-cookie'));
  if (!login.res.ok || !token) {
    fail('AUTH', `login ${login.res.status}`);
    console.log(JSON.stringify(results, null, 2));
    process.exit(1);
  }
  pass('AUTH');

  // 2. Protected redirect
  const unauth = await adminPage('/', null);
  if (unauth.status !== 307 && unauth.status !== 302) fail('AUTH_REDIRECT', `status ${unauth.status}`);
  else pass('AUTH_REDIRECT');

  // 3. Dashboard after login
  const dash = await adminPage('/', token);
  if (dash.status !== 200) fail('DASHBOARD', `status ${dash.status}`);
  else {
    const html = await dash.text();
    if (html.includes('تعذر تحميل') && !html.includes('admin-shell')) fail('DASHBOARD', 'error state');
    else pass('DASHBOARD');
  }

  const suffix = Date.now().toString(36);

  // 4. Category CRUD
  let categoryId;
  {
    const create = await api('/categories', {
      method: 'POST',
      body: JSON.stringify({ name: `Verify Cat ${suffix}`, slug: `verify-cat-${suffix}` }),
    }, token);
    categoryId = create.json?.data?.id;
    if (!create.res.ok || !categoryId) fail('CATEGORY_CRUD', `create ${create.res.status}`);
    else {
      const update = await api(`/categories/${categoryId}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: `Verify Cat Edited ${suffix}` }),
      }, token);
      const del = await api(`/categories/${categoryId}`, { method: 'DELETE', emptyResponse: true }, token);
      if (!update.res.ok) fail('CATEGORY_CRUD', `update ${update.res.status}`);
      else if (del.res.status !== 204 && del.res.status !== 200) fail('CATEGORY_CRUD', `delete ${del.res.status}`);
      else pass('CATEGORY_CRUD');
    }
  }

  // 5. Brand CRUD
  let brandId;
  {
    const create = await api('/brands', {
      method: 'POST',
      body: JSON.stringify({ name: `Verify Brand ${suffix}`, slug: `verify-brand-${suffix}` }),
    }, token);
    brandId = create.json?.data?.id;
    if (!create.res.ok || !brandId) fail('BRAND_CRUD', `create ${create.res.status}`);
    else {
      const update = await api(`/brands/${brandId}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: `Verify Brand Edited ${suffix}` }),
      }, token);
      const del = await api(`/brands/${brandId}`, { method: 'DELETE' }, token);
      if (!update.res.ok) fail('BRAND_CRUD', `update ${update.res.status}`);
      else if (del.res.status !== 204 && del.res.status !== 200) fail('BRAND_CRUD', `delete ${del.res.status}`);
      else pass('BRAND_CRUD');
    }
  }

  // Recreate cat/brand for product
  const catRes = await api('/categories', {
    method: 'POST',
    body: JSON.stringify({ name: `Prod Cat ${suffix}`, slug: `prod-cat-${suffix}` }),
  }, token);
  const brandRes = await api('/brands', {
    method: 'POST',
    body: JSON.stringify({ name: `Prod Brand ${suffix}`, slug: `prod-brand-${suffix}` }),
  }, token);
  const catId = catRes.json?.data?.id;
  const brId = brandRes.json?.data?.id;

  // 6. Product CRUD + persistence
  let productId;
  {
    const sku = `VERIFY-${suffix}`.toUpperCase();
    const create = await api('/products', {
      method: 'POST',
      body: JSON.stringify({
        name: `Verify Product ${suffix}`,
        slug: `verify-product-${suffix}`,
        sku,
        priceMinor: 9999,
        currency: 'USD',
        status: 'ACTIVE',
        categoryId: catId,
        brandId: brId,
        inventory: { quantity: 7, lowStockThreshold: 2 },
      }),
    }, token);
    productId = create.json?.data?.id;
    if (!create.res.ok || !productId) fail('PRODUCT_CRUD', `create ${create.res.status} ${create.text?.slice(0, 120)}`);
    else {
      const get1 = await api(`/products/${productId}`, {}, token);
      const update = await api(`/products/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: `Verify Product Edited ${suffix}`, priceMinor: 10999 }),
      }, token);
      const get2 = await api(`/products/${productId}`, {}, token);
      if (!get1.res.ok || get1.json?.data?.name !== `Verify Product ${suffix}`) fail('PERSISTENCE', 'initial read');
      else if (!update.res.ok) fail('PRODUCT_CRUD', `update ${update.res.status}`);
      else if (get2.json?.data?.name !== `Verify Product Edited ${suffix}`) fail('PERSISTENCE', 'after edit');
      else {
        pass('PRODUCT_CRUD');
        pass('PERSISTENCE');
      }
      await api(`/products/${productId}`, { method: 'DELETE' }, token);
    }
  }

  // 7. Inventory
  {
    const sku = `INV-${suffix}`.toUpperCase();
    const prod = await api('/products', {
      method: 'POST',
      body: JSON.stringify({
        name: `Inv Product ${suffix}`, slug: `inv-product-${suffix}`, sku,
        priceMinor: 5000, status: 'ACTIVE', categoryId: catId, brandId: brId,
        inventory: { quantity: 3, lowStockThreshold: 1 },
      }),
    }, token);
    const pid = prod.json?.data?.id;
    const list = await api('/inventory', {}, token);
    const adj = await api('/inventory/adjustments', {
      method: 'POST',
      body: JSON.stringify({ productId: pid, type: 'RESTOCK', quantity: 2, reason: 'verify' }),
    }, token);
    if (!list.res.ok) fail('INVENTORY', `list ${list.res.status}`);
    else if (!adj.res.ok) fail('INVENTORY', `adjust ${adj.res.status}`);
    else pass('INVENTORY');
    if (pid) await api(`/products/${pid}`, { method: 'DELETE' }, token);
  }

  // 8. Orders
  {
    const orders = await api('/orders', {}, token);
    if (orders.res.ok) pass('ORDERS');
    else partial('ORDERS', `list ${orders.res.status}`);
  }

  // 9. Customers
  {
    const customers = await api('/customers', {}, token);
    if (customers.res.ok) pass('CUSTOMERS');
    else partial('CUSTOMERS', `list ${customers.res.status}`);
  }

  // Admin UI pages (authenticated)
  for (const [key, path] of [
    ['ADMIN_PRODUCTS', '/products'],
    ['ADMIN_ORDERS', '/orders'],
    ['ADMIN_CUSTOMERS', '/customers'],
    ['ADMIN_INVENTORY', '/inventory'],
  ]) {
    const page = await adminPage(path, token);
    if (page.status === 200) pass(key);
    else fail(key, `status ${page.status}`);
  }

  // Error state: products page HTML should not throw (empty/error UI ok)
  {
    const page = await adminPage('/products', token);
    const html = await page.text();
    if (html.includes('Internal Server Error') || html.includes('Unhandled')) fail('ERROR_HANDLING_UI', 'crash page');
    else pass('ERROR_HANDLING_UI');
  }

  {
    const me = await api('/auth/me', {});
    if (me.res.status === 401) pass('ERROR_HANDLING');
    else fail('ERROR_HANDLING', `expected 401 got ${me.res.status}`);
  }

  // cleanup cat/brand (before logout)
  if (catId) await api(`/categories/${catId}`, { method: 'DELETE' }, token);
  if (brId) await api(`/brands/${brId}`, { method: 'DELETE' }, token);

  // 11. Logout — cookie cleared client-side; unauthenticated requests must fail
  {
    const out = await api('/auth/logout', { method: 'POST' }, token);
    const meAfter = await api('/auth/me', {});
    const dashAfter = await adminPage('/', null);
    if ((out.res.ok || out.res.status === 204) && meAfter.res.status === 401 && (dashAfter.status === 307 || dashAfter.status === 302)) {
      pass('LOGOUT');
    } else {
      fail('LOGOUT', `logout ${out.res.status} me ${meAfter.res.status} dash ${dashAfter.status}`);
    }
  }

  console.log(JSON.stringify(results, null, 2));
  const failed = Object.values(results).some((v) => String(v).startsWith('fail'));
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
