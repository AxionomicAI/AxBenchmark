/*
 * Smoke test for the inventory data layer (js/storage.js + js/data.js).
 *
 * The site itself has no build step and runs in the browser, but this
 * test simulates a minimal browser environment (window, localStorage,
 * document, CustomEvent) so the data layer can be verified with Node:
 *
 *     node tests/data-layer.test.js
 */
'use strict';

const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.join(__dirname, '..');

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
 * Simulate a fresh page load: new globals, shared localStorage backing map.
 * @param {Map<string,string>} backing shared localStorage store
 */
function loadPage(backing) {
  const windowObj = {
    localStorage: {
      setItem: (k, v) => backing.set(k, String(v)),
      getItem: (k) => (backing.has(k) ? backing.get(k) : null),
      removeItem: (k) => backing.delete(k)
    }
  };
  const documentObj = { addEventListener: () => {}, dispatchEvent: () => {} };
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
  for (const file of ['js/storage.js', 'js/data.js']) {
    const code = fs.readFileSync(path.join(ROOT, file), 'utf8');
    vm.runInContext(code, sandbox, { filename: file });
  }
  return sandbox.window.Inventory;
}

/** Load scripts without any localStorage (blocked storage). */
function loadPageWithoutStorage() {
  const sandbox = {
    window: {},
    document: { addEventListener: () => {}, dispatchEvent: () => {} },
    CustomEvent: function () {},
    console: console
  };
  vm.createContext(sandbox);
  for (const file of ['js/storage.js', 'js/data.js']) {
    const code = fs.readFileSync(path.join(ROOT, file), 'utf8');
    vm.runInContext(code, sandbox, { filename: file });
  }
  return sandbox.window.Inventory;
}

const KEY = 'inventory.data.v1';

// ----------------------------------------------------------------
console.log('[1] First run: empty storage -> seeds sample data');
let backing = new Map();
let Inventory = loadPage(backing);
let seeded = Inventory.init();
assertEq(seeded.length, 10, 'seeds 10 sample products');
assert(backing.has(KEY), 'writes inventory.data.v1 to localStorage');
assertEq(Inventory.getCategories(), ['Electronics', 'Furniture', 'Kitchen', 'Office Supplies'], 'categories derived and sorted');
const stats = Inventory.getStats();
assertEq([stats.products, stats.units, stats.outOfStock], [10, 554, 1], 'stats: products/units/out-of-stock');
assert(stats.stockValue > 0, 'stats: stock value computed');
const sticky = seeded.find((p) => p.sku === 'OFFI-0003');
assert(sticky && sticky.quantity === 0, 'sample out-of-stock product present');
const cable = seeded.find((p) => p.sku === 'ELEC-0003');
assert(Inventory.isLowStock(cable) === true, '8/20-reorder product flagged low stock');
assert(Inventory.isLowStock(sticky) === false, 'out-of-stock product not double-counted as low');
assert(seeded.every((p) => p.id && p.createdAt && p.updatedAt), 'sample products get ids + timestamps');

// ----------------------------------------------------------------
console.log('[2] Second page load: data is loaded, not reseeded');
Inventory = loadPage(backing);
let items = Inventory.init();
assertEq(items.length, 10, 'loads the 10 persisted products');
assertEq(items[0].name, seeded[0].name, 'first product matches what was saved');

// ----------------------------------------------------------------
console.log('[3] Validation');
let res = Inventory.addProduct({ name: '  ', sku: 'X-1', category: 'Misc', quantity: 1 });
assert(res.ok === false && res.errors.length === 1, 'blank name rejected');
res = Inventory.addProduct({ name: 'Dup', sku: 'elec-0001', category: 'Misc', quantity: 1 });
assert(res.ok === false && /unique/i.test(res.errors.join(' ')), 'duplicate SKU rejected case-insensitively');
res = Inventory.addProduct({ name: 'Neg', sku: 'N-1', category: 'Misc', quantity: -3 });
assert(res.ok === false, 'negative quantity rejected');
res = Inventory.addProduct({ name: 'Frac', sku: 'F-1', category: 'Misc', quantity: 2.5 });
assert(res.ok === false, 'fractional quantity rejected');
res = Inventory.addProduct({ name: 'Bad price', sku: 'P-1', category: 'Misc', quantity: 1, unitPrice: -5 });
assert(res.ok === false, 'negative unit price rejected');
res = Inventory.addProduct({ name: 'No cat', sku: 'C-1', quantity: 1 });
assert(res.ok === false, 'missing category rejected');

// ----------------------------------------------------------------
console.log('[4] CRUD + stock operations');
res = Inventory.addProduct({ name: '  Widget  ', sku: 'w-100', category: ' Misc ', quantity: '7', unitPrice: '9.999', reorderLevel: '2', location: 'Bin 5' });
assert(res.ok === true, 'valid product accepted (string inputs coerced)');
const widget = res.product;
assertEq([widget.name, widget.sku, widget.category, widget.quantity, widget.unitPrice], ['Widget', 'W-100', 'Misc', 7, 10], 'fields normalized (trim, uppercase SKU, rounded price)');
assertEq(Inventory.getStats().products, 11, 'product count after add');
assert(Inventory.getById(widget.id) !== null, 'getById finds new product');

res = Inventory.adjustStock(widget.id, -2);
assert(res.ok === true && res.product.quantity === 5, 'adjustStock(-2) -> 5');
res = Inventory.adjustStock(widget.id, -10);
assert(res.ok === false, 'adjustStock below 0 rejected');
res = Inventory.setStock(widget.id, '12');
assert(res.ok === true && res.product.quantity === 12, 'setStock accepts numeric strings');
res = Inventory.setStock(widget.id, -1);
assert(res.ok === false, 'setStock rejects negatives');

res = Inventory.updateProduct(widget.id, { name: 'Widget Pro', sku: 'ELEC-0002' });
assert(res.ok === false && /unique/.test(res.errors[0]), 'update cannot take another product SKU');
res = Inventory.updateProduct(widget.id, { name: 'Widget Pro', unitPrice: 12.5 });
assert(res.ok === true && res.product.name === 'Widget Pro' && res.product.quantity === 12, 'partial update keeps other fields');
assert(res.product.updatedAt >= res.product.createdAt, 'updatedAt bumped on update');
res = Inventory.updateProduct('nope', { name: 'X' });
assert(res.ok === false, 'update of unknown id fails cleanly');

res = Inventory.deleteProduct(widget.id);
assert(res.ok === true && Inventory.getById(widget.id) === null, 'delete removes the product');
assertEq(Inventory.getStats().products, 10, 'product count after delete');
res = Inventory.deleteProduct(widget.id);
assert(res.ok === false, 'deleting twice fails cleanly');

// ----------------------------------------------------------------
console.log('[5] Mutations persist immediately');
Inventory = loadPage(backing);
Inventory.init();
res = Inventory.addProduct({ name: 'Evt', sku: 'E-1', category: 'T', quantity: 1 });
assert(res.ok === true, 'add succeeds');
assert(JSON.parse(backing.get(KEY)).some((p) => p.sku === 'E-1'), 'new product written to localStorage right away');

// ----------------------------------------------------------------
console.log('[6] Corruption handling');
backing.set(KEY, '{not json]');
Inventory = loadPage(backing);
items = Inventory.init();
assertEq(items.length, 10, 'corrupt JSON -> reseeds sample data');

backing.set(KEY, JSON.stringify([{ name: 'Only Good', sku: 'G-1', category: 'T', quantity: 3 }, null, { garbage: true }, { name: 'No qty', sku: 'G-2', category: 'T' }]));
Inventory = loadPage(backing);
items = Inventory.init();
assertEq(items.length, 1, 'sanitize keeps only well-formed records');
assertEq(items[0].sku, 'G-1', 'kept record is the good one');

// ----------------------------------------------------------------
console.log('[7] Empty-by-user inventory is preserved (no reseed)');
backing.set(KEY, '[]');
Inventory = loadPage(backing);
items = Inventory.init();
assertEq(items.length, 0, 'deliberately emptied inventory stays empty');

// ----------------------------------------------------------------
console.log('[8] resetToSample + no-localStorage fallback');
let reset = Inventory.resetToSample();
assertEq(reset.length, 10, 'resetToSample restores 10 products');

const memInventory = loadPageWithoutStorage();
const memItems = memInventory.init();
assertEq(memItems.length, 10, 'without localStorage: in-memory sample data');
assertEq(memInventory.addProduct({ name: 'Tmp', sku: 'T-1', category: 'T', quantity: 1 }).ok, true, 'without localStorage: mutations still work in memory');

// ----------------------------------------------------------------
console.log('');
console.log('passed: ' + passed + ', failed: ' + failed);
process.exit(failed === 0 ? 0 : 1);
