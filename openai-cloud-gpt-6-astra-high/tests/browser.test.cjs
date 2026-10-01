// Development-only browser tests. The website itself has no dependencies.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { resolve } = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const url = pathToFileURL(resolve(__dirname, '../index.html')).href;
let browser;
before(async () => {
  browser = await chromium.launch({ channel: 'chrome', headless: !process.env.HEADED });
  console.log(`Testing file:// in Chrome ${browser.version()}`);
});
after(async () => { await browser?.close(); });

async function fixture(t, options = {}) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  t.after(async () => { await context.close(); assert.deepEqual(errors, [], 'browser console errors'); });
  await page.goto(url);
  return page;
}
const inventoryRow = (page, sku) => page.locator('#inventory-rows tr').filter({ has: page.getByRole('cell', { name: sku, exact: true }) });
const cartRow = (page, sku) => page.locator('#cart-rows tr').filter({ has: page.getByRole('cell', { name: new RegExp(`\\(${sku}\\)`) }) });
const saved = page => page.evaluate(() => ({ items: InventoryStorage.loadItems(), cart: InventoryStorage.loadCart(), orders: InventoryStorage.loadOrders() }));
const raw = page => page.evaluate(() => Object.fromEntries(Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)])));
async function fields(page, values) {
  for (const [field, value] of Object.entries(values)) await page.locator(`#product-${field}`).fill(String(value));
}
async function add(page, values = {}) {
  await page.locator('#add-product').click();
  await fields(page, { name: 'Test product', sku: 'TEST', stock: 10, price: '1.25', ...values });
  await page.locator('#save-product').click();
  assert.equal(await page.locator('#product-dialog').isVisible(), false);
}
async function edit(page, sku, values) {
  await inventoryRow(page, sku).getByRole('button', { name: /^Edit / }).click();
  await fields(page, values);
  await page.locator('#save-product').click();
}
async function addCart(page, sku) {
  await inventoryRow(page, sku).getByRole('button', { name: /^Add to cart / }).click();
}
async function quantity(page, sku, value) {
  const input = cartRow(page, sku).getByRole('spinbutton');
  await input.fill(String(value));
  await input.press('Enter');
}
async function removeProduct(page, sku) {
  await inventoryRow(page, sku).getByRole('button', { name: /^Delete / }).click();
  await page.locator('#confirm-delete').click();
}
async function failWrites(page, fail) {
  await page.evaluate(fail => {
    window.originalSetItem ??= Storage.prototype.setItem;
    Storage.prototype.setItem = fail ? function () { throw new DOMException('Storage full', 'QuotaExceededError'); } : window.originalSetItem;
  }, fail);
}

test('first run, offline assets, search, empty results and reload', async t => {
  const page = await fixture(t, { offline: true });
  assert.equal(await page.locator('#inventory-rows tr').count(), 4);
  assert.equal(await inventoryRow(page, 'TP-001').getByRole('button', { name: /^Add to cart / }).isDisabled(), true);
  for (const [query, count] of [['  nOtE  ', 1], ['nb-', 1], ['TP-001', 1], ['missing', 0], ['   ', 4]]) {
    await page.locator('#inventory-search').fill(query);
    assert.equal(await page.locator('#inventory-rows tr').count(), count);
    if (!count) assert.match(await page.locator('#inventory-status').innerText(), /No products match/);
  }
  await page.locator('#clear-search').click();
  assert.equal(await page.locator('#inventory-search').evaluate(el => el === document.activeElement), true);
  const before = await raw(page);
  await page.reload();
  assert.deepEqual(await raw(page), before);
  assert.equal(await page.locator('#inventory-rows tr').count(), 4);
});

test('create, edit, trim, cancel, Escape, delete and preserve empty inventory', async t => {
  const page = await fixture(t);
  await add(page, { name: '  New product  ', sku: '  NEW  ', stock: 0, price: '.50' });
  assert.equal((await saved(page)).items.at(-1).priceCents, 50);
  assert.equal((await saved(page)).items.at(-1).name, 'New product');
  await edit(page, 'NEW', { name: 'Edited', sku: 'EDITED', stock: 12, price: '2.30' });
  await page.reload();
  assert.match(await inventoryRow(page, 'EDITED').innerText(), /Edited[\s\S]*12[\s\S]*\$2.30/);
  const before = await raw(page);
  await inventoryRow(page, 'EDITED').getByRole('button', { name: /^Edit / }).click();
  await fields(page, { name: 'Unsaved' });
  await page.keyboard.press('Escape');
  assert.equal(await inventoryRow(page, 'EDITED').getByRole('button', { name: /^Edit / }).evaluate(el => el === document.activeElement), true);
  await page.locator('#add-product').click();
  await fields(page, { name: 'Canceled' });
  await page.locator('#cancel-product').click();
  await inventoryRow(page, 'EDITED').getByRole('button', { name: /^Delete / }).click();
  assert.equal(await page.locator('#cancel-delete').evaluate(el => el === document.activeElement), true);
  await page.keyboard.press('Escape');
  await inventoryRow(page, 'EDITED').getByRole('button', { name: /^Delete / }).click();
  await page.locator('#cancel-delete').click();
  assert.deepEqual(await raw(page), before);
  for (const item of (await saved(page)).items) await removeProduct(page, item.sku);
  await page.reload();
  assert.equal((await saved(page)).items.length, 0);
  assert.match(await page.locator('#inventory-status').innerText(), /No inventory items/);
  await add(page);
  assert.equal((await saved(page)).items.length, 1);
});

test('required fields, unique SKUs and numeric boundaries prevent invalid saves', async t => {
  const page = await fixture(t);
  const before = await raw(page);
  const invalid = [
    { name: '' }, { name: '   ' }, { sku: '' }, { sku: '   ' }, { sku: 'nb-001' },
    ...['', '-1', '1.5', '9007199254740992'].map(stock => ({ stock })),
    ...['', '-1', '0.001', '10000000'].map(price => ({ price }))
  ];
  for (const values of invalid) {
    await page.locator('#add-product').click();
    await fields(page, { name: 'Valid', sku: 'VALID', stock: 10, price: '1.25', ...values });
    await page.locator('#save-product').click();
    assert.equal(await page.locator('#product-dialog').isVisible(), true, JSON.stringify(values));
    assert.equal(await page.locator('#product-form').evaluate(el => el.checkValidity()), false);
    assert.deepEqual(await raw(page), before);
    await page.locator('#cancel-product').click();
  }
  await add(page, { stock: '9007199254740991', price: '9999999.99' });
  await edit(page, 'TEST', { sku: 'test' });
  assert.equal(await page.locator('#product-dialog').isVisible(), false);
});

test('search stays active through create/edit/delete and preserves hidden products', async t => {
  const page = await fixture(t);
  await page.locator('#inventory-search').fill('match');
  await add(page, { name: 'Match one', sku: 'MATCH' });
  await add(page, { name: 'Hidden', sku: 'HIDDEN' });
  assert.equal(await page.locator('#inventory-rows tr').count(), 1);
  await edit(page, 'MATCH', { name: 'Renamed', sku: 'OTHER' });
  assert.equal(await page.locator('#inventory-rows tr').count(), 0);
  assert.equal(await page.locator('#inventory-search').evaluate(el => el === document.activeElement), true);
  await add(page, { name: 'Match two', sku: 'MATCH2' });
  await removeProduct(page, 'MATCH2');
  await page.locator('#clear-search').click();
  assert.equal(await page.locator('#inventory-rows tr').count(), 6);
  await page.reload();
  assert.equal((await saved(page)).items.length, 6);
});

test('cart totals, Enter updates, quantity validation, stock limits, remove and reload', async t => {
  const page = await fixture(t);
  await edit(page, 'NB-001', { price: '.10', stock: 3 });
  await edit(page, 'PN-001', { price: '.20' });
  await addCart(page, 'NB-001'); await addCart(page, 'NB-001'); await addCart(page, 'PN-001');
  assert.equal(await page.locator('#cart-rows tr').count(), 2);
  assert.equal(await page.locator('#cart-total').innerText(), 'Total (USD): $0.40');
  const before = await raw(page);
  for (const invalid of ['', '0', '-1', '1.5', '4', '9007199254740992']) {
    await quantity(page, 'NB-001', invalid);
    assert.deepEqual(await raw(page), before, invalid);
  }
  await quantity(page, 'NB-001', 3);
  assert.equal(await page.locator('#cart-total').innerText(), 'Total (USD): $0.50');
  assert.equal(await inventoryRow(page, 'NB-001').getByRole('button', { name: /^Add to cart / }).isDisabled(), true);
  await page.reload();
  assert.equal(await cartRow(page, 'NB-001').getByRole('spinbutton').inputValue(), '3');
  await quantity(page, 'NB-001', 1);
  assert.equal(await inventoryRow(page, 'NB-001').getByRole('button', { name: /^Add to cart / }).isEnabled(), true);
  await page.locator('#inventory-search').fill('missing');
  assert.equal(await page.locator('#cart-rows tr').count(), 2);
  while (await page.locator('#cart-rows tr').count()) await page.locator('#cart-rows').getByRole('button', { name: /^Remove / }).first().click();
  assert.equal(await page.locator('#cart-heading').evaluate(el => el === document.activeElement), true);
  await page.reload();
  assert.equal(await page.locator('#cart-table').isVisible(), false);
  assert.equal(await page.locator('#cart-total').innerText(), 'Total (USD): $0.00');
});

test('quantity drafts survive unrelated actions and failed saves until explicitly updated', async t => {
  const page = await fixture(t);
  await addCart(page, 'NB-001');
  await cartRow(page, 'NB-001').getByRole('spinbutton').fill('5');
  await addCart(page, 'PN-001');
  assert.equal(await cartRow(page, 'NB-001').getByRole('spinbutton').inputValue(), '5');
  await quantity(page, 'PN-001', 2);
  await edit(page, 'NB-001', { name: 'Renamed notebook' });
  await cartRow(page, 'PN-001').getByRole('button', { name: /^Remove / }).click();
  assert.equal(await cartRow(page, 'NB-001').getByRole('spinbutton').inputValue(), '5');
  assert.equal((await saved(page)).cart[0].quantity, 1);
  await page.locator('#checkout').click();
  assert.match(await page.locator('#cart-error').innerText(), /Select Update/);
  assert.equal((await saved(page)).orders.length, 0);
  await failWrites(page, true);
  await quantity(page, 'NB-001', 5);
  assert.equal(await cartRow(page, 'NB-001').getByRole('spinbutton').inputValue(), '5');
  await failWrites(page, false);
  await cartRow(page, 'NB-001').getByRole('spinbutton').fill('');
  await addCart(page, 'PN-001');
  assert.equal(await cartRow(page, 'NB-001').getByRole('spinbutton').inputValue(), '');
  await quantity(page, 'NB-001', 5);
  assert.equal((await saved(page)).cart[0].quantity, 5);
  await addCart(page, 'PN-001');
  assert.equal(await cartRow(page, 'NB-001').getByRole('spinbutton').inputValue(), '5');
});

test('inventory changes update the cart and block checkout for unavailable stock', async t => {
  const page = await fixture(t);
  await addCart(page, 'NB-001'); await quantity(page, 'NB-001', 3);
  await edit(page, 'NB-001', { name: 'New name', price: '2.50', stock: 2 });
  assert.match(await cartRow(page, 'NB-001').innerText(), /New name[\s\S]*Only 2 in stock/);
  assert.equal(await page.locator('#cart-total').innerText(), 'Total (USD): $7.50');
  assert.equal(await page.locator('#checkout').isDisabled(), true);
  await quantity(page, 'NB-001', 2);
  assert.equal(await page.locator('#checkout').isEnabled(), true);
  await edit(page, 'NB-001', { stock: 0 });
  assert.equal(await cartRow(page, 'NB-001').getByRole('spinbutton').isDisabled(), true);
  await removeProduct(page, 'NB-001');
  assert.match(await page.locator('#cart-rows').innerText(), /No longer in inventory/);
  assert.equal(await page.locator('#cart-total').innerText(), 'Total (USD): $0.00');
  assert.equal(await page.locator('#checkout').isDisabled(), true);
  await page.locator('#cart-rows').getByRole('button', { name: /^Remove / }).click();
  assert.equal((await saved(page)).cart.length, 0);
});

test('checkout, receipt snapshots, history order and persistence', async t => {
  const page = await fixture(t);
  await edit(page, 'NB-001', { price: '0.10' }); await edit(page, 'PN-001', { price: '0.20' });
  await addCart(page, 'NB-001'); await quantity(page, 'NB-001', 3);
  await addCart(page, 'PN-001'); await quantity(page, 'PN-001', 2);
  await page.locator('#checkout').click();
  const state = await saved(page);
  assert.equal(state.orders.length, 1);
  assert.equal(state.orders[0].totalCents, '70');
  assert.equal(state.items[0].stock, 21); assert.equal(state.items[1].stock, 58);
  assert.deepEqual(state.cart, []);
  assert.equal(await page.locator('#orders-list details').getAttribute('open'), '');
  assert.equal(await page.locator('#orders-list summary').evaluate(el => el === document.activeElement), true);
  await page.keyboard.press('Enter'); assert.equal(await page.locator('#orders-list details').getAttribute('open'), null);
  await page.keyboard.press('Space'); assert.equal(await page.locator('#orders-list details').getAttribute('open'), '');
  await page.reload(); assert.deepEqual(await saved(page), state);
  await edit(page, 'NB-001', { name: 'Changed later', sku: 'NEW', price: '10' });
  await removeProduct(page, 'NEW');
  assert.deepEqual((await saved(page)).orders, state.orders);
  await addCart(page, 'PN-001'); await page.locator('#checkout').click();
  const next = await saved(page);
  assert.equal(next.orders.length, 2); assert.notEqual(next.orders[0].id, next.orders[1].id);
  assert.match(await page.locator('#orders-list summary').first().innerText(), new RegExp(next.orders[1].id));
});

test('double-clicking checkout saves one purchase and deducts stock once', async t => {
  const page = await fixture(t);
  await addCart(page, 'NB-001');
  await page.locator('#checkout').dblclick();
  const state = await saved(page);
  assert.equal(state.orders.length, 1);
  assert.equal(state.items[0].stock, 23);
  assert.equal(state.orders[0].totalCents, '0');
  assert.deepEqual(state.cart, []);
  assert.equal(await page.locator('#checkout').isDisabled(), true);
});

test('storage write failures preserve data, forms and cart; retries save once', async t => {
  const page = await fixture(t);
  await addCart(page, 'NB-001');
  let before = await raw(page);
  await failWrites(page, true);
  await page.locator('#add-product').click(); await fields(page, { name: 'Retry', sku: 'RETRY' });
  await page.locator('#save-product').click();
  assert.match(await page.locator('#product-error').innerText(), /could not be saved/);
  assert.equal(await page.locator('#product-name').inputValue(), 'Retry');
  assert.deepEqual(await raw(page), before);
  await page.locator('#cancel-product').click();
  await edit(page, 'NB-001', { name: 'Failed edit' });
  assert.equal(await page.locator('#product-dialog').isVisible(), true);
  assert.deepEqual(await raw(page), before);
  await page.locator('#cancel-product').click();
  await removeProduct(page, 'NB-001');
  assert.equal(await page.locator('#delete-dialog').isVisible(), true);
  assert.match(await page.locator('#delete-error').innerText(), /could not be saved/);
  assert.deepEqual(await raw(page), before); await page.locator('#cancel-delete').click();
  await addCart(page, 'PN-001'); assert.deepEqual(await raw(page), before);
  await quantity(page, 'NB-001', 2); assert.deepEqual(await raw(page), before);
  await cartRow(page, 'NB-001').getByRole('button', { name: /^Remove / }).click(); assert.deepEqual(await raw(page), before);
  await failWrites(page, false); await quantity(page, 'NB-001', 2);
  for (let round = 0; round < 2; round++) {
    before = await raw(page); await failWrites(page, true);
    await page.locator('#checkout').click();
    assert.match(await page.locator('#cart-error').innerText(), /No purchase was saved/);
    assert.deepEqual(await raw(page), before);
    await failWrites(page, false); await page.locator('#checkout').click();
    assert.equal((await saved(page)).orders.length, round + 1);
    await addCart(page, 'NB-001');
  }
});

test('corrupt saved data and unavailable storage are preserved and clearly reported', async t => {
  const page = await fixture(t);
  for (const key of ['inventory.items.v1', 'inventory.cart.v1', 'inventory.state.v2']) {
    await page.evaluate(key => { localStorage.clear(); localStorage.setItem(key, 'invalid JSON'); }, key);
    await page.reload();
    assert.equal(await page.evaluate(key => localStorage.getItem(key), key), 'invalid JSON');
    assert.equal(await page.locator('#checkout').isDisabled(), true);
    assert.equal(await page.locator('#add-product').isDisabled(), key !== 'inventory.cart.v1');
    assert.match(await page.locator(key === 'inventory.cart.v1' ? '#cart-status' : '#inventory-status').innerText(), /could not be loaded/);
    if (key === 'inventory.cart.v1') await add(page);
  }
  await page.evaluate(() => localStorage.clear());
  await page.addInitScript(() => { Storage.prototype.getItem = () => { throw new Error('Storage blocked'); }; });
  await page.reload();
  assert.equal(await page.locator('#add-product').isDisabled(), true);
  assert.match(await page.locator('#inventory-status').innerText(), /could not be loaded/);
});

test('stale tabs cannot overwrite newer product/cart changes or completed purchases', async t => {
  const page = await fixture(t);
  await addCart(page, 'NB-001');
  const other = await page.context().newPage(); await other.goto(url);
  await edit(other, 'NB-001', { stock: 30 });
  const before = await raw(page);
  await edit(page, 'PN-001', { name: 'Stale pen' });
  assert.equal(await page.locator('#product-dialog').isVisible(), true);
  assert.match(await page.locator('#product-error').innerText(), /Reload and review/);
  assert.deepEqual(await raw(page), before); await page.locator('#cancel-product').click();
  await addCart(page, 'PN-001');
  assert.match(await page.locator('#cart-error').innerText(), /Reload and review/);
  assert.deepEqual(await raw(page), before);
  await page.locator('#checkout').click();
  assert.match(await page.locator('#cart-error').innerText(), /Reload and review/);
  assert.deepEqual(await raw(page), before);
  await page.reload();
  await quantity(other, 'NB-001', 3);
  const updated = await raw(page);
  await cartRow(page, 'NB-001').getByRole('button', { name: /^Remove / }).click();
  assert.deepEqual(await raw(page), updated);
  await page.reload();
  await other.locator('#checkout').click();
  const purchased = await raw(page);
  await edit(page, 'PN-001', { name: 'Would restore purchased stock' });
  assert.deepEqual(await raw(page), purchased);
});

test('markup is plain text; large exact totals and narrow layouts remain usable', async t => {
  const page = await fixture(t);
  const name = '<img src=x onerror=alert(1)> ' + 'LongName'.repeat(30);
  await add(page, { name, sku: 'LONG', stock: '9007199254740991', price: '9999999.99' });
  await addCart(page, 'LONG'); await quantity(page, 'LONG', '9007199254740991');
  assert.equal(await page.locator('img').count(), 0);
  assert.equal(await page.locator('#cart-total').innerText(), 'Total (USD): $90,071,992,457,337,917,452,590.09');
  await page.setViewportSize({ width: 320, height: 720 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'large cart total must wrap');
  await page.locator('#checkout').click();
  assert.equal((await saved(page)).orders[0].totalCents, String(9007199254740991n * 999999999n));
  assert.equal((await saved(page)).orders[0].lines[0].name, name);
  for (const width of [320, 375, 768, 1280]) {
    await page.setViewportSize({ width, height: 720 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `page overflow at ${width}px`);
    await page.locator('#add-product').click();
    assert.equal(await page.locator('#product-dialog').evaluate(el => el.scrollWidth <= el.clientWidth), true, `dialog overflow at ${width}px`);
    await page.locator('#cancel-product').click();
  }
});

test('keyboard-only product creation, dialog navigation and mobile table access', async t => {
  const page = await fixture(t, { viewport: { width: 320, height: 480 } });
  await page.locator('#add-product').focus(); await page.keyboard.press('Enter');
  assert.equal(await page.locator('#product-dialog').evaluate(el => el.matches(':modal')), true);
  assert.equal(await page.locator('#product-name').evaluate(el => el === document.activeElement), true);
  await page.keyboard.type('Keyboard product'); await page.keyboard.press('Tab');
  await page.keyboard.type('KEYBOARD'); await page.keyboard.press('Tab');
  await page.keyboard.press('ControlOrMeta+A'); await page.keyboard.type('2'); await page.keyboard.press('Tab');
  await page.keyboard.press('ControlOrMeta+A'); await page.keyboard.type('.25'); await page.keyboard.press('Tab');
  assert.equal(await page.locator('#cancel-product').evaluate(el => el === document.activeElement), true);
  await page.keyboard.press('Shift+Tab');
  assert.equal(await page.locator('#product-price').evaluate(el => el === document.activeElement), true);
  await page.keyboard.press('Tab'); await page.keyboard.press('Tab');
  assert.equal(await page.locator('#save-product').evaluate(el => el === document.activeElement), true);
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#product-dialog').isVisible(), false);
  assert.equal((await saved(page)).items.at(-1).priceCents, 25);
  assert.equal(await inventoryRow(page, 'KEYBOARD').getByRole('button', { name: /^Edit / }).evaluate(el => el === document.activeElement), true);
  assert.equal(await page.locator('#inventory-table').evaluate(el => el.parentElement.scrollLeft > 0), true);
  await page.keyboard.press('Tab'); await page.keyboard.press('Enter');
  assert.equal(await page.locator('#cancel-delete').evaluate(el => el === document.activeElement), true);
  await page.keyboard.press('Tab');
  assert.equal(await page.locator('#confirm-delete').evaluate(el => el === document.activeElement), true);
  await page.keyboard.press('Shift+Tab');
  assert.equal(await page.locator('#cancel-delete').evaluate(el => el === document.activeElement), true);
  await page.keyboard.press('Escape');
  assert.equal(await inventoryRow(page, 'KEYBOARD').getByRole('button', { name: /^Delete / }).evaluate(el => el === document.activeElement), true);
});
