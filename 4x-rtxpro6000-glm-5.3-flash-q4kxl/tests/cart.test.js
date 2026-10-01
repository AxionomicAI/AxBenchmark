/*
 * Smoke test for the shopping cart data layer (js/cart.js).
 *
 * Loads storage.js + data.js + cart.js into a simulated browser
 * environment with a working event bus, so the automatic cart/inventory
 * synchronization is exercised too. Run with Node:
 *
 *     node tests/cart.test.js
 */
'use strict';

const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SCRIPTS = ['js/storage.js', 'js/data.js', 'js/cart.js'];
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

/**
 * Simulate a page load. Returns the API objects; `backing` is the shared
 * localStorage store, so a second page continues from the first's data.
 */
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
    console: console,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout
  };
  vm.createContext(sandbox);
  for (const file of SCRIPTS) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), sandbox, { filename: file });
  }
  return {
    Inventory: sandbox.window.Inventory,
    InventoryCart: sandbox.window.InventoryCart,
    backing: backing
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
console.log('[1] Empty cart on first run');
let backing = new Map();
let page = loadPage(backing);
page.Inventory.init();
page.InventoryCart.init();
assertEq(page.InventoryCart.getCount(), 0, 'cart starts empty');
assertEq(page.InventoryCart.getTotal(), 0, 'total starts at 0');
assertEq(page.InventoryCart.getLines().length, 0, 'no lines');

// ----------------------------------------------------------------
console.log('[2] Adding products, totals');
const mouseId = skuId(page, 'ELEC-0001');   // 19.99, stock 42
const keyboardId = skuId(page, 'ELEC-0002'); // 79.50, stock 15
const cableId = skuId(page, 'ELEC-0003');   // 6.50, stock 8
const stickyId = skuId(page, 'OFFI-0003');  // stock 0

let res = page.InventoryCart.add(mouseId, 2);
assert(res.ok === true, 'add 2 mice succeeds');
assertEq(page.InventoryCart.getCount(), 2, 'count after add');
assertEq(page.InventoryCart.getTotal(), 39.98, 'total = 2 x 19.99');
let line = page.InventoryCart.getLines()[0];
assertEq(line.quantity, 2, 'line quantity');
assertEq(line.lineTotal, 39.98, 'line total');
assertEq(line.product.id, mouseId, 'line references the product');

res = page.InventoryCart.add(mouseId); // default quantity 1
assert(res.ok === true && res.quantity === 3, 'repeated add increments (3)');
res = page.InventoryCart.add(keyboardId);
assert(res.ok === true, 'add keyboard succeeds');
assertEq(page.InventoryCart.getCount(), 4, 'count across two products');
assertEq(page.InventoryCart.getTotal(), 139.47, 'total across lines (3 x 19.99 + 79.5)');
assertEq(page.InventoryCart.getLines().length, 2, 'two distinct lines');
assertEq(page.InventoryCart.getLines()[0].product.name, 'Mechanical Keyboard',
  'lines sorted by product name');
assertEq(page.InventoryCart.quantityOf(mouseId), 3, 'quantityOf');

// ----------------------------------------------------------------
console.log('[3] Stock limits');
res = page.InventoryCart.add(mouseId, 40); // 3 + 40 > 42
assert(res.ok === false && /Only 42/.test(res.errors[0]), 'add beyond stock rejected');
res = page.InventoryCart.add(cableId, 8);
assert(res.ok === true, 'add exactly the full stock succeeds');
res = page.InventoryCart.add(cableId, 1);
assert(res.ok === false && /already in the cart/.test(res.errors[0]), 'add past full stock mentions the cart');
res = page.InventoryCart.add(stickyId, 1);
assert(res.ok === false && /out of stock/.test(res.errors[0]), 'out-of-stock product rejected');
res = page.InventoryCart.add('p_missing', 1);
assert(res.ok === false, 'unknown product rejected');
res = page.InventoryCart.add(mouseId, 0);
assert(res.ok === false, 'quantity 0 rejected');
res = page.InventoryCart.add(mouseId, -2);
assert(res.ok === false, 'negative quantity rejected');
res = page.InventoryCart.add(mouseId, 'abc');
assert(res.ok === false, 'non-numeric quantity rejected');
res = page.InventoryCart.add(mouseId, 1.5);
assert(res.ok === false, 'fractional quantity rejected');

// ----------------------------------------------------------------
console.log('[4] setQuantity / remove / clear');
res = page.InventoryCart.setQuantity(mouseId, 2);
assert(res.ok === true && res.quantity === 2, 'setQuantity works');
res = page.InventoryCart.setQuantity(mouseId, 100);
assert(res.ok === false && /Only 42/.test(res.errors[0]), 'setQuantity beyond stock rejected');
res = page.InventoryCart.setQuantity('p_missing', 1);
assert(res.ok === false, 'setQuantity for unknown product rejected');
res = page.InventoryCart.setQuantity(keyboardId, 1); // keyboard not in cart? it is (added in [2])
assert(res.ok === true, 'setQuantity for a cart line works');
res = page.InventoryCart.setQuantity(stickyId, 1);
assert(res.ok === false, 'setQuantity for non-cart product rejected');

res = page.InventoryCart.setQuantity(mouseId, 0);
assert(res.ok === true, 'setQuantity 0 removes the line');
assertEq(page.InventoryCart.quantityOf(mouseId), 0, 'mouse gone from cart');
res = page.InventoryCart.remove(keyboardId);
assert(res.ok === true, 'remove works');
res = page.InventoryCart.remove(keyboardId);
assert(res.ok === false, 'removing twice fails cleanly');
assertEq(page.InventoryCart.getCount(), 8, 'only the cable (8) remains');
res = page.InventoryCart.clear();
assert(res.ok === true, 'clear works');
assertEq(page.InventoryCart.getCount(), 0, 'cart empty after clear');
assertEq(backing.get(CART_KEY), '[]', 'cleared cart persisted');

// ----------------------------------------------------------------
console.log('[5] Persistence across page loads');
page.InventoryCart.add(mouseId, 2);
page.InventoryCart.add(cableId, 1);
const storedCart = JSON.parse(backing.get(CART_KEY));
assertEq(storedCart.length, 2, 'cart lines persisted as {productId, quantity}');
assert(storedCart.every((l) => typeof l.productId === 'string' && l.quantity >= 1),
  'stored lines are minimal (no product copies)');

page = loadPage(backing); // second "page load", same storage
page.Inventory.init();
page.InventoryCart.init();
assertEq(page.InventoryCart.getCount(), 3, 'cart restored after reload');
assertEq(page.InventoryCart.getTotal(), 46.48, 'total restored (2 x 19.99 + 6.5)');
assertEq(page.InventoryCart.getLines().length, 2, 'lines restored');

// ----------------------------------------------------------------
console.log('[6] Cart stays coherent with the inventory (event-driven sync)');
res = page.Inventory.setStock(cableId, 5); // stock 8 -> 5, cart still 1
assert(res.ok === true, 'stock reduced');
assertEq(page.InventoryCart.quantityOf(cableId), 1, 'cart unchanged while stock stays above cart qty');
res = page.InventoryCart.add(cableId, 2); // cart cable 1 -> 3
assert(res.ok === true && res.quantity === 3, 'cable raised to 3 in cart');
res = page.Inventory.setStock(cableId, 2); // stock 5 -> 2 < cart qty 3
assertEq(page.InventoryCart.quantityOf(cableId), 2, 'cart clamped to new stock');
res = page.Inventory.setStock(mouseId, 1); // cart had 2
assertEq(page.InventoryCart.quantityOf(mouseId), 1, 'other line clamped too');
res = page.Inventory.setStock(mouseId, 0);
assertEq(page.InventoryCart.quantityOf(mouseId), 0, 'line dropped when stock hits 0');
assertEq(JSON.parse(backing.get(CART_KEY)).some((l) => l.productId === mouseId), false,
  'dropped line removed from storage');

res = page.Inventory.deleteProduct(cableId);
assert(res.ok === true, 'product deleted');
assertEq(page.InventoryCart.quantityOf(cableId), 0, 'deleted product leaves the cart');
assertEq(page.InventoryCart.getLines().length, 0, 'cart empty after deleting last product');

// ----------------------------------------------------------------
console.log('[7] Stale carts are cleaned up on load');
backing.set(CART_KEY, JSON.stringify([
  { productId: 'p_ghost', quantity: 3 },
  { productId: keyboardId, quantity: 2 },
  { productId: cableId, quantity: 1 } // product was deleted in [6]
]));
page = loadPage(backing);
page.Inventory.init();
page.InventoryCart.init();
assertEq(page.InventoryCart.getLines().length, 1, 'only lines with live products survive load');
assertEq(page.InventoryCart.quantityOf(keyboardId), 2, 'valid line restored');
assertEq(JSON.parse(backing.get(CART_KEY)).length, 1, 'stale lines pruned from storage');

backing.set(CART_KEY, 'not json at all');
page = loadPage(backing);
page.Inventory.init();
page.InventoryCart.init();
assertEq(page.InventoryCart.getCount(), 0, 'corrupt cart storage -> empty cart');

backing.set(CART_KEY, JSON.stringify([
  { productId: keyboardId, quantity: 2 },
  { productId: keyboardId, quantity: 5 }, // duplicate line
  { garbage: true },
  null
]));
page = loadPage(backing);
page.Inventory.init();
page.InventoryCart.init();
assertEq(page.InventoryCart.quantityOf(keyboardId), 5, 'duplicate lines de-duplicated (last wins)');
assertEq(page.InventoryCart.getLines().length, 1, 'malformed lines dropped');

// ----------------------------------------------------------------
console.log('[8] Memory-only fallback (no localStorage)');
page = loadPage(new Map(), false);
page.Inventory.init();
page.InventoryCart.init();
res = page.InventoryCart.add(skuId(page, 'ELEC-0001'), 2);
assert(res.ok === true, 'cart works in memory without localStorage');
assertEq(page.InventoryCart.getCount(), 2, 'count in memory-only mode');

// ----------------------------------------------------------------
console.log('');
console.log('passed: ' + passed + ', failed: ' + failed);
process.exit(failed === 0 ? 0 : 1);
