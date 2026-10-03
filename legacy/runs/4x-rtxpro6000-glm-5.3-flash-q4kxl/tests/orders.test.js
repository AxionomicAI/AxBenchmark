/*
 * Smoke test for the checkout & order history data layer (js/orders.js).
 *
 * Loads storage.js + data.js + cart.js + orders.js into a simulated
 * browser environment with a working event bus. Run with Node:
 *
 *     node tests/orders.test.js
 */
'use strict';

const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SCRIPTS = ['js/storage.js', 'js/data.js', 'js/cart.js', 'js/orders.js'];
const ORDERS_KEY = 'inventory.orders.v1';
const CART_KEY = 'inventory.cart.v1';

let passed = 0;
let failed = 0;

function assert(cond, label) {
  if (cond) {
    passed += 1;
    console.log('  ok  ' + label);
  } else {
    failed += 1;
    console.log('FAIL  ' + label);
  }
}

function assertEq(actual, expected, label) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  assert(ok, label + (ok ? '' : ' — got ' + JSON.stringify(actual) + ', want ' + JSON.stringify(expected)));
}

function loadPage(backing, withStorage) {
  const listeners = {};
  const documentObj = {
    addEventListener: (type, fn) => {
      (listeners[type] = listeners[type] || []).push(fn);
    },
    dispatchEvent: (evt) => {
      (listeners[evt.type] || []).forEach((fn) => fn(evt));
    }
  };
  const windowObj = withStorage === false ? {} : {
    localStorage: {
      setItem: (k, v) => backing.set(k, String(v)),
      getItem: (k) => (backing.has(k) ? backing.get(k) : null),
      removeItem: (k) => backing.delete(k)
    }
  };
  const sandbox = {
    window: windowObj,
    document: documentObj,
    CustomEvent: function (type, params) {
      this.type = type;
      this.detail = params && params.detail;
    },
    console: console
  };
  vm.createContext(sandbox);
  for (const file of SCRIPTS) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), sandbox, { filename: file });
  }
  return {
    Inventory: sandbox.window.Inventory,
    InventoryCart: sandbox.window.InventoryCart,
    InventoryOrders: sandbox.window.InventoryOrders
  };
}

function skuId(page, sku) {
  const product = page.Inventory.getAll().find((p) => p.sku === sku);
  if (!product) {
    throw new Error('test setup: no product with SKU ' + sku);
  }
  return product.id;
}

// ----------------------------------------------------------------
console.log('[1] Empty history on first run; checkout needs a cart');
let backing = new Map();
let page = loadPage(backing);
page.Inventory.init();
page.InventoryCart.init();
page.InventoryOrders.init();
assertEq(page.InventoryOrders.getCount(), 0, 'no orders initially');
assertEq(page.InventoryOrders.getAll().length, 0, 'getAll is empty');
let res = page.InventoryOrders.checkout();
assert(res.ok === false && /empty/i.test(res.errors[0]), 'checkout with empty cart rejected');

// ----------------------------------------------------------------
console.log('[2] A successful checkout');
const mouseId = skuId(page, 'ELEC-0001');    // 19.99, stock 42
const keyboardId = skuId(page, 'ELEC-0002'); // 79.50, stock 15
page.InventoryCart.add(mouseId, 2);
page.InventoryCart.add(keyboardId, 1);
const mouseStockBefore = page.Inventory.getById(mouseId).quantity;   // 42
const keyboardStockBefore = page.Inventory.getById(keyboardId).quantity; // 15

res = page.InventoryOrders.checkout();
assert(res.ok === true, 'checkout succeeds');
const order = res.order;
assertEq(order.number, 1001, 'first order number is #1001');
assertEq(order.totalUnits, 3, 'order totalUnits');
assertEq(order.total, 119.48, 'order total (2 x 19.99 + 79.5)');
assertEq(order.items.length, 2, 'order has 2 item snapshots');
assertEq(order.items[0].name, 'Mechanical Keyboard', 'items sorted like the cart');
assertEq(order.items[0].quantity, 1, 'item quantity snapshotted');
assertEq(order.items[1].lineTotal, 39.98, 'item line total snapshotted');
assert(typeof order.date === 'string' && !isNaN(new Date(order.date).getTime()),
  'order has a valid date');

assertEq(page.Inventory.getById(mouseId).quantity, mouseStockBefore - 2,
  'stock decremented by purchased units (mouse)');
assertEq(page.Inventory.getById(keyboardId).quantity, keyboardStockBefore - 1,
  'stock decremented by purchased units (keyboard)');
assertEq(page.InventoryCart.getCount(), 0, 'cart emptied by checkout');
assertEq(page.InventoryOrders.getCount(), 1, 'order recorded');
assert(JSON.parse(backing.get(ORDERS_KEY)).length === 1, 'order persisted');
assertEq(backing.get(CART_KEY), '[]', 'emptied cart persisted');
assertEq(page.InventoryOrders.getAll()[0].number, 1001, 'getAll is newest-first');

// ----------------------------------------------------------------
console.log('[3] Numbers increase; history survives reloads');
page.InventoryCart.add(mouseId, 1);
res = page.InventoryOrders.checkout();
assert(res.ok === true && res.order.number === 1002, 'second order is #1002');

page = loadPage(backing); // fresh page, same storage
page.Inventory.init();
page.InventoryCart.init();
page.InventoryOrders.init();
assertEq(page.InventoryOrders.getCount(), 2, 'orders restored after reload');
assertEq(page.InventoryOrders.getAll()[0].number, 1002, 'newest first after reload');
assertEq(page.InventoryOrders.getAll()[0].total, 19.99, 'restored total');
res = page.InventoryOrders.checkout();
assert(res.ok === false, 'still refuses to check out an empty cart after reload');

// ----------------------------------------------------------------
console.log('[4] Orders are snapshots (later edits do not rewrite history)');
const before = JSON.stringify(page.InventoryOrders.getAll());
page.Inventory.updateProduct(mouseId, { name: 'Renamed Mouse', unitPrice: 99.99 });
assertEq(JSON.stringify(page.InventoryOrders.getAll()), before,
  'product edits leave order history untouched');
page.Inventory.deleteProduct(keyboardId);
assertEq(JSON.stringify(page.InventoryOrders.getAll()), before,
  'deleting a purchased product leaves order history untouched');
assertEq(page.InventoryOrders.getAll()[1].items.some((i) => i.name === 'Renamed Mouse'), false,
  'old order keeps the name from purchase time');

// ----------------------------------------------------------------
console.log('[5] Clearing the history');
res = page.InventoryOrders.clearHistory();
assert(res.ok === true && page.InventoryOrders.getCount() === 0, 'clearHistory empties the list');
assertEq(backing.get(ORDERS_KEY), '[]', 'cleared history persisted');
res = page.InventoryOrders.clearHistory();
assert(res.ok === true, 'clearing an empty history is a harmless no-op');

// ----------------------------------------------------------------
console.log('[6] Order numbers keep increasing after a clear');
page.InventoryCart.add(mouseId, 1);
res = page.InventoryOrders.checkout();
assert(res.ok === true && res.order.number === 1003, 'next number continues the sequence');

// ----------------------------------------------------------------
console.log('[7] Sanitizing stored orders');
const mouseProduct = page.Inventory.getAll().find((p) => p.id === mouseId);
backing.set(ORDERS_KEY, JSON.stringify([
  'not an order',
  null,
  { id: 'o_1', number: 'abc', items: [{ name: 'X', quantity: 1, unitPrice: 1 }] },
  { id: 'o_2', number: 5, items: [] },
  { id: 'o_3', number: 1002, items: [{ name: 'Bad qty', quantity: 1.5, unitPrice: 1 }] },
  {
    id: 'o_4', number: 1003, date: '2025-01-15T10:00:00.000Z',
    items: [
      { productId: 'p_x', sku: 'X-1', name: 'Thing', unitPrice: 4, quantity: 2, lineTotal: 8 },
      { productId: 'p_y', sku: 'Y-1', name: 'Other', unitPrice: '2.5', quantity: '1' }
    ]
  }
]));
page = loadPage(backing);
page.Inventory.init();
page.InventoryCart.init();
page.InventoryOrders.init();
assertEq(page.InventoryOrders.getCount(), 1, 'only well-formed orders survive');
const restored = page.InventoryOrders.getAll()[0];
assertEq(restored.number, 1003, 'valid order restored');
assertEq(restored.total, 10.5, 'total recomputed from items (8 + 2.5)');
assertEq(restored.totalUnits, 3, 'totalUnits recomputed');
assertEq(restored.items[1].lineTotal, 2.5, 'missing lineTotal derived from price x qty');

// ----------------------------------------------------------------
console.log('[8] History is capped at 100 orders');
const seeded = [];
for (let i = 0; i < 100; i += 1) {
  seeded.push({
    id: 'o_seed_' + i,
    number: 2000 + i,
    date: '2025-01-01T00:00:00.000Z',
    items: [{ productId: 'p_old', sku: 'OLD-1', name: 'Old item', unitPrice: 1, quantity: 1, lineTotal: 1 }],
    totalUnits: 1,
    total: 1
  });
}
backing.set(ORDERS_KEY, JSON.stringify(seeded));
page = loadPage(backing);
page.Inventory.init();
page.InventoryCart.init();
page.InventoryOrders.init();
assertEq(page.InventoryOrders.getCount(), 100, '100 seeded orders loaded');
page.InventoryCart.add(mouseProduct.id, 1);
res = page.InventoryOrders.checkout();
assert(res.ok === true, 'checkout with a full history still works');
assertEq(page.InventoryOrders.getCount(), 100, 'history capped at 100');
assertEq(page.InventoryOrders.getAll()[0].number, 2100, 'newest order kept');
assertEq(page.InventoryOrders.getAll()[99].number, 2001, 'oldest order dropped');

// ----------------------------------------------------------------
console.log('[9] Corrupt storage and memory-only fallback');
backing.set(ORDERS_KEY, '{broken');
page = loadPage(backing);
page.Inventory.init();
page.InventoryCart.init();
page.InventoryOrders.init();
assertEq(page.InventoryOrders.getCount(), 0, 'corrupt orders storage -> empty history');

page = loadPage(new Map(), false);
page.Inventory.init();
page.InventoryCart.init();
page.InventoryOrders.init();
page.InventoryCart.add(skuId(page, 'ELEC-0001'), 1);
res = page.InventoryOrders.checkout();
assert(res.ok === true, 'checkout works in memory without localStorage');
assertEq(page.InventoryOrders.getCount(), 1, 'order kept in memory');

// ----------------------------------------------------------------
console.log('');
console.log('passed: ' + passed + ', failed: ' + failed);
process.exit(failed === 0 ? 0 : 1);
