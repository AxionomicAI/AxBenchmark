// Tests for the data layer (js/storage.js, js/sample-data.js, js/inventory.js).
// Run with: node tests/inventory.test.js
// The scripts are loaded unmodified into a fake browser global with an
// in-memory localStorage.
'use strict';

var assert = require('assert');
var harness = require('./harness');

var test = harness.test;

var PRODUCTS_KEY = 'inventory.products';
var BACKUP_KEY = 'inventory.products.backup';

var SCRIPTS = harness.loadScripts(['storage.js', 'sample-data.js', 'inventory.js']);

var makeStorage = harness.makeStorage;

function openPage(storage) {
  return harness.openPage(SCRIPTS, storage);
}

function stored(storage) {
  return JSON.parse(storage.data[PRODUCTS_KEY]);
}

// Objects made inside the vm have another realm's prototypes, which
// deepStrictEqual treats as different; compare plain copies instead.
function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function record(overrides) {
  return Object.assign({
    id: 'a1',
    name: 'Widget',
    sku: 'W-1',
    category: 'Parts',
    quantity: 5,
    priceCents: 250,
    reorderLevel: 2,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  }, overrides);
}

function storageWith(records) {
  var initial = {};
  initial[PRODUCTS_KEY] = JSON.stringify(records);
  return makeStorage(initial);
}

// --- First run and loading ---

test('first run creates the sample products and saves them', function () {
  var storage = makeStorage();
  var page = openPage(storage);
  var status = page.Inventory.init();
  assert.deepStrictEqual(plain(status), { persistent: true, seeded: true, recovered: false });

  var products = page.Inventory.getProducts();
  assert.strictEqual(products.length, 12);
  assert.deepStrictEqual(stored(storage), plain(products));
  products.forEach(function (product) {
    assert.deepStrictEqual(Object.keys(product), [
      'id', 'name', 'sku', 'category', 'quantity', 'priceCents', 'reorderLevel',
      'createdAt', 'updatedAt'
    ]);
  });
  var ids = products.map(function (product) { return product.id; });
  assert.strictEqual(new Set(ids).size, ids.length);
});

test('later runs load what was saved instead of the samples', function () {
  var storage = makeStorage();
  var first = openPage(storage);
  first.Inventory.init();
  var added = first.Inventory.addProduct({ name: 'Extra', sku: 'X-1' }).product;

  var second = openPage(storage);
  assert.deepStrictEqual(plain(second.Inventory.init()), { persistent: true, seeded: false, recovered: false });
  assert.deepStrictEqual(plain(second.Inventory.getProducts()), plain(first.Inventory.getProducts()));
  assert.strictEqual(second.Inventory.getProduct(added.id).name, 'Extra');
});

test('an inventory emptied by the user stays empty', function () {
  var storage = makeStorage();
  var first = openPage(storage);
  first.Inventory.getProducts().forEach(function (product) {
    assert.strictEqual(first.Inventory.removeProduct(product.id).ok, true);
  });

  var second = openPage(storage);
  assert.strictEqual(second.Inventory.init().seeded, false);
  assert.strictEqual(second.Inventory.getProducts().length, 0);
});

test('stored records missing optional fields get defaults', function () {
  var old = record();
  delete old.category;
  delete old.reorderLevel;
  var page = openPage(storageWith([old]));
  assert.strictEqual(page.Inventory.init().recovered, false);
  var product = page.Inventory.getProduct('a1');
  assert.strictEqual(product.category, '');
  assert.strictEqual(product.reorderLevel, 0);
});

test('unreadable stored data is set aside, not overwritten or replaced by samples', function () {
  var initial = {};
  initial[PRODUCTS_KEY] = '{not json';
  var storage = makeStorage(initial);
  var page = openPage(storage);
  assert.deepStrictEqual(plain(page.Inventory.init()), { persistent: true, seeded: false, recovered: true });
  assert.strictEqual(page.Inventory.getProducts().length, 0);
  assert.strictEqual(storage.data[BACKUP_KEY], '{not json');
  assert.deepStrictEqual(stored(storage), []);

  assert.strictEqual(openPage(storage).Inventory.init().recovered, false);
});

test('stored data that is not an array is treated as unreadable', function () {
  var initial = {};
  initial[PRODUCTS_KEY] = '{"a":1}';
  var storage = makeStorage(initial);
  var page = openPage(storage);
  assert.strictEqual(page.Inventory.init().recovered, true);
  assert.strictEqual(storage.data[BACKUP_KEY], '{"a":1}');
});

test('invalid stored records are dropped, with the original kept as a backup', function () {
  var records = [
    record(),
    record({ id: 'a2', sku: 'W-2', quantity: -4 }),
    record({ id: 'a3', sku: 'W-3', quantity: '7' }),
    record({ id: 'a1', sku: 'W-4' }),
    record({ id: 'a5', sku: 'w-1' }),
    record({ id: 'a6', sku: 'W-6', createdAt: 'yesterday' }),
    record({ id: 'a7', sku: 'W-7', name: '' }),
    record({ id: 7, sku: 'W-8' }),
    'junk',
    null,
    record({ id: 'a9', sku: 'W-9' })
  ];
  var storage = storageWith(records);
  var raw = storage.data[PRODUCTS_KEY];
  var page = openPage(storage);
  assert.strictEqual(page.Inventory.init().recovered, true);
  var ids = page.Inventory.getProducts().map(function (product) { return product.id; });
  assert.deepStrictEqual(plain(ids), ['a1', 'a9']);
  assert.strictEqual(storage.data[BACKUP_KEY], raw);
  assert.strictEqual(stored(storage).length, 2);
});

test('damaged data is left in place when it cannot be backed up', function () {
  var storage = storageWith([record(), 'junk']);
  var raw = storage.data[PRODUCTS_KEY];
  var page = openPage(storage);
  storage.failWrites = true;
  assert.strictEqual(page.Inventory.init().recovered, true);
  assert.strictEqual(page.Inventory.getProducts().length, 1);
  assert.strictEqual(storage.data[PRODUCTS_KEY], raw);
});

// --- Adding ---

test('addProduct stores a product with defaults, trimmed text and timestamps', function () {
  var storage = storageWith([]);
  var page = openPage(storage);
  var result = page.Inventory.addProduct({ name: '  Widget ', sku: ' W-1 ', bogus: true });
  assert.strictEqual(result.ok, true);
  var product = result.product;
  assert.strictEqual(product.name, 'Widget');
  assert.strictEqual(product.sku, 'W-1');
  assert.strictEqual(product.category, '');
  assert.strictEqual(product.quantity, 0);
  assert.strictEqual(product.priceCents, 0);
  assert.strictEqual(product.reorderLevel, 0);
  assert.strictEqual(product.bogus, undefined);
  assert.ok(typeof product.id === 'string' && product.id.length > 0);
  assert.ok(!isNaN(Date.parse(product.createdAt)));
  assert.strictEqual(product.updatedAt, product.createdAt);
  assert.deepStrictEqual(stored(storage), [plain(product)]);
});

test('addProduct keeps the given stock, price and reorder level', function () {
  var page = openPage(storageWith([]));
  var product = page.Inventory.addProduct({
    name: 'Widget', sku: 'W-1', category: 'Parts', quantity: 12, priceCents: 1999, reorderLevel: 4
  }).product;
  assert.strictEqual(product.category, 'Parts');
  assert.strictEqual(product.quantity, 12);
  assert.strictEqual(product.priceCents, 1999);
  assert.strictEqual(product.reorderLevel, 4);
});

test('addProduct rejects invalid input and stores nothing', function () {
  var storage = storageWith([record()]);
  var page = openPage(storage);
  var before = storage.data[PRODUCTS_KEY];

  function errorsFor(input) {
    var result = page.Inventory.addProduct(input);
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.product, undefined);
    return Object.keys(result.errors).sort();
  }

  assert.deepStrictEqual(errorsFor({}), ['name', 'sku']);
  assert.deepStrictEqual(errorsFor(undefined), ['name', 'sku']);
  assert.deepStrictEqual(errorsFor(null), ['name', 'sku']);
  assert.deepStrictEqual(errorsFor('Widget'), ['name', 'sku']);
  assert.deepStrictEqual(errorsFor({ name: '   ', sku: 'N-1' }), ['name']);
  assert.deepStrictEqual(errorsFor({ name: 42, sku: 'N-1' }), ['name']);
  assert.deepStrictEqual(errorsFor({ name: 'x'.repeat(101), sku: 'N-1' }), ['name']);
  assert.deepStrictEqual(errorsFor({ name: 'New', sku: 'x'.repeat(41) }), ['sku']);
  assert.deepStrictEqual(errorsFor({ name: 'New', sku: 'N-1', category: 'x'.repeat(51) }), ['category']);
  assert.deepStrictEqual(errorsFor({ name: 'New', sku: 'N-1', category: 5 }), ['category']);
  assert.deepStrictEqual(errorsFor({ name: 'New', sku: 'w-1' }), ['sku']);
  assert.deepStrictEqual(errorsFor({ name: 'New', sku: 'N-1', quantity: -1 }), ['quantity']);
  assert.deepStrictEqual(errorsFor({ name: 'New', sku: 'N-1', quantity: 1.5 }), ['quantity']);
  assert.deepStrictEqual(errorsFor({ name: 'New', sku: 'N-1', quantity: '3' }), ['quantity']);
  assert.deepStrictEqual(errorsFor({ name: 'New', sku: 'N-1', quantity: NaN }), ['quantity']);
  assert.deepStrictEqual(errorsFor({ name: 'New', sku: 'N-1', quantity: Infinity }), ['quantity']);
  assert.deepStrictEqual(errorsFor({ name: 'New', sku: 'N-1', quantity: 1000000001 }), ['quantity']);
  assert.deepStrictEqual(errorsFor({ name: 'New', sku: 'N-1', priceCents: 9.99 }), ['priceCents']);
  assert.deepStrictEqual(errorsFor({ name: 'New', sku: 'N-1', reorderLevel: -2 }), ['reorderLevel']);
  assert.deepStrictEqual(
    errorsFor({ name: '', sku: '', quantity: -1, priceCents: -1, reorderLevel: -1 }),
    ['name', 'priceCents', 'quantity', 'reorderLevel', 'sku']
  );

  assert.strictEqual(storage.data[PRODUCTS_KEY], before);
});

test('addProduct accepts values at the limits', function () {
  var page = openPage(storageWith([]));
  var result = page.Inventory.addProduct({
    name: 'x'.repeat(100), sku: 'x'.repeat(40), category: 'x'.repeat(50),
    quantity: 1000000000, priceCents: 1000000000, reorderLevel: 1000000000
  });
  assert.strictEqual(result.ok, true);
});

test('MAX_INTEGER is the largest number a numeric field accepts', function () {
  var page = openPage(storageWith([]));
  var max = page.Inventory.MAX_INTEGER;
  assert.strictEqual(page.Inventory.addProduct({ name: 'At', sku: 'M-1', quantity: max, priceCents: max, reorderLevel: max }).ok, true);
  ['quantity', 'priceCents', 'reorderLevel'].forEach(function (key) {
    var input = { name: 'Over', sku: 'M-2' };
    input[key] = max + 1;
    assert.deepStrictEqual(Object.keys(page.Inventory.addProduct(input).errors), [key]);
  });
});

// --- Reading ---

test('getProduct returns null for an unknown id', function () {
  var page = openPage(storageWith([record()]));
  assert.strictEqual(page.Inventory.getProduct('nope'), null);
  assert.strictEqual(page.Inventory.getProduct(undefined), null);
});

test('returned products are copies; changing them does not change the inventory', function () {
  var page = openPage(makeStorage({}));
  page.Inventory.init();
  // Also with storage off, where the in-memory list is the only copy.
  var storage = makeStorage();
  storage.disabled = true;
  [page, openPage(storage)].forEach(function (p) {
    var list = p.Inventory.getProducts();
    var id = list[0].id;
    var quantity = list[0].quantity;
    list[0].quantity = 99999;
    list.pop();
    p.Inventory.getProduct(id).quantity = 99999;
    var added = p.Inventory.addProduct({ name: 'Copy', sku: 'COPY-1', quantity: 1 }).product;
    added.quantity = 99999;
    assert.strictEqual(p.Inventory.getProduct(id).quantity, quantity);
    assert.strictEqual(p.Inventory.getProduct(added.id).quantity, 1);
    assert.strictEqual(p.Inventory.getProducts().length, 13);
  });
});

// --- Updating ---

test('updateProduct changes only the given fields', function () {
  var storage = storageWith([record()]);
  var page = openPage(storage);
  var result = page.Inventory.updateProduct('a1', {
    name: ' Gadget ', priceCents: 300, id: 'hacked', createdAt: 'never', category: undefined
  });
  assert.strictEqual(result.ok, true);
  var product = result.product;
  assert.strictEqual(product.id, 'a1');
  assert.strictEqual(product.name, 'Gadget');
  assert.strictEqual(product.priceCents, 300);
  assert.strictEqual(product.sku, 'W-1');
  assert.strictEqual(product.category, 'Parts');
  assert.strictEqual(product.quantity, 5);
  assert.strictEqual(product.reorderLevel, 2);
  assert.strictEqual(product.createdAt, '2026-01-01T00:00:00.000Z');
  assert.ok(Date.parse(product.updatedAt) > Date.parse(product.createdAt));
  assert.deepStrictEqual(stored(storage), [plain(product)]);
});

test('updateProduct can clear the category', function () {
  var page = openPage(storageWith([record()]));
  assert.strictEqual(page.Inventory.updateProduct('a1', { category: '' }).product.category, '');
});

test('updateProduct validates the result and keeps SKUs unique', function () {
  var storage = storageWith([record(), record({ id: 'a2', sku: 'W-2' })]);
  var page = openPage(storage);
  var before = storage.data[PRODUCTS_KEY];

  assert.deepStrictEqual(Object.keys(page.Inventory.updateProduct('a1', { sku: 'w-2' }).errors), ['sku']);
  assert.deepStrictEqual(Object.keys(page.Inventory.updateProduct('a1', { name: '' }).errors), ['name']);
  assert.deepStrictEqual(Object.keys(page.Inventory.updateProduct('a1', { quantity: -1 }).errors), ['quantity']);
  assert.deepStrictEqual(Object.keys(page.Inventory.updateProduct('nope', { name: 'X' }).errors), ['id']);
  assert.strictEqual(storage.data[PRODUCTS_KEY], before);

  // A product may keep, or re-case, its own SKU.
  assert.strictEqual(page.Inventory.updateProduct('a1', { sku: 'w-1', name: 'Renamed' }).ok, true);
  assert.strictEqual(page.Inventory.updateProduct('a1', undefined).ok, true);
});

test('updateProduct keeps the order of products', function () {
  var page = openPage(storageWith([record(), record({ id: 'a2', sku: 'W-2' }), record({ id: 'a3', sku: 'W-3' })]));
  page.Inventory.updateProduct('a2', { name: 'Middle' });
  var ids = page.Inventory.getProducts().map(function (product) { return product.id; });
  assert.deepStrictEqual(plain(ids), ['a1', 'a2', 'a3']);
});

// --- Stock ---

test('adjustStock adds and removes units', function () {
  var storage = storageWith([record()]);
  var page = openPage(storage);
  assert.strictEqual(page.Inventory.adjustStock('a1', 10).product.quantity, 15);
  assert.strictEqual(page.Inventory.adjustStock('a1', -15).product.quantity, 0);
  assert.strictEqual(stored(storage)[0].quantity, 0);
  assert.ok(stored(storage)[0].updatedAt > '2026-01-01T00:00:00.000Z');
});

test('adjustStock refuses to go below zero or take a bad amount', function () {
  var storage = storageWith([record()]);
  var page = openPage(storage);
  var before = storage.data[PRODUCTS_KEY];

  var result = page.Inventory.adjustStock('a1', -6);
  assert.strictEqual(result.ok, false);
  assert.strictEqual(result.errors.quantity, 'Cannot remove 6; only 5 in stock.');
  assert.deepStrictEqual(Object.keys(page.Inventory.adjustStock('a1', 1.5).errors), ['quantity']);
  assert.deepStrictEqual(Object.keys(page.Inventory.adjustStock('a1', '1').errors), ['quantity']);
  assert.deepStrictEqual(Object.keys(page.Inventory.adjustStock('a1', undefined).errors), ['quantity']);
  assert.deepStrictEqual(Object.keys(page.Inventory.adjustStock('a1', 1000000000).errors), ['quantity']);
  assert.deepStrictEqual(Object.keys(page.Inventory.adjustStock('nope', 1).errors), ['id']);
  assert.strictEqual(storage.data[PRODUCTS_KEY], before);
});

test('removeStock takes units of several products in one change', function () {
  var storage = storageWith([record(), record({ id: 'a2', sku: 'W-2', quantity: 9 }), record({ id: 'a3', sku: 'W-3' })]);
  var page = openPage(storage);
  var calls = 0;
  page.Inventory.subscribe(function () { calls++; });

  var result = page.Inventory.removeStock([{ id: 'a2', quantity: 4 }, { id: 'a1', quantity: 5 }]);
  assert.strictEqual(result.ok, true);
  assert.deepStrictEqual(plain(result.products.map(function (p) { return [p.id, p.quantity]; })),
    [['a2', 5], ['a1', 0]]);
  assert.strictEqual(calls, 1);

  var saved = stored(storage);
  assert.deepStrictEqual(saved.map(function (p) { return p.quantity; }), [0, 5, 5]);
  assert.ok(saved[0].updatedAt > '2026-01-01T00:00:00.000Z');
  assert.strictEqual(saved[0].updatedAt, saved[1].updatedAt);
  assert.strictEqual(saved[2].updatedAt, '2026-01-01T00:00:00.000Z');
});

test('removeStock counts a product that is listed twice both times', function () {
  var page = openPage(storageWith([record()]));
  var result = page.Inventory.removeStock([{ id: 'a1', quantity: 2 }, { id: 'a1', quantity: 3 }]);
  assert.strictEqual(result.products.length, 1);
  assert.strictEqual(result.products[0].quantity, 0);

  page.Inventory.updateProduct('a1', { quantity: 5 });
  assert.strictEqual(page.Inventory.removeStock([{ id: 'a1', quantity: 3 }, { id: 'a1', quantity: 3 }]).errors.quantity,
    'Cannot remove 3 of Widget; only 2 in stock.');
  assert.strictEqual(page.Inventory.getProduct('a1').quantity, 5);
});

test('removeStock takes nothing when any of it cannot be taken', function () {
  var storage = storageWith([record(), record({ id: 'a2', sku: 'W-2', quantity: 9 })]);
  var page = openPage(storage);
  var calls = 0;
  page.Inventory.subscribe(function () { calls++; });
  var before = storage.data[PRODUCTS_KEY];
  var good = { id: 'a2', quantity: 1 };

  assert.deepStrictEqual(plain(page.Inventory.removeStock([good, { id: 'a1', quantity: 6 }])),
    { ok: false, errors: { quantity: 'Cannot remove 6 of Widget; only 5 in stock.' } });
  assert.deepStrictEqual(plain(page.Inventory.removeStock([good, { id: 'nope', quantity: 1 }])),
    { ok: false, errors: { id: 'Product not found.' } });
  [0, -1, 1.5, '1', undefined].forEach(function (quantity) {
    assert.deepStrictEqual(plain(page.Inventory.removeStock([good, { id: 'a1', quantity: quantity }])),
      { ok: false, errors: { quantity: 'Quantity must be a whole number, 1 or more.' } });
  });
  [[good, null], [], undefined, 'a2'].forEach(function (items) {
    assert.deepStrictEqual(Object.keys(page.Inventory.removeStock(items).errors), ['quantity']);
  });
  assert.strictEqual(storage.data[PRODUCTS_KEY], before);
  assert.strictEqual(calls, 0);
});

test('isLowStock is true at or below the reorder level', function () {
  var page = openPage(storageWith([]));
  assert.strictEqual(page.Inventory.isLowStock(record({ quantity: 3, reorderLevel: 2 })), false);
  assert.strictEqual(page.Inventory.isLowStock(record({ quantity: 2, reorderLevel: 2 })), true);
  assert.strictEqual(page.Inventory.isLowStock(record({ quantity: 0, reorderLevel: 0 })), true);
  assert.strictEqual(page.Inventory.isLowStock(record({ quantity: 1, reorderLevel: 0 })), false);
});

test('stockStatus is out at zero, low at or below the reorder level, ok above it', function () {
  var page = openPage(storageWith([]));
  assert.strictEqual(page.Inventory.stockStatus(record({ quantity: 3, reorderLevel: 2 })), 'ok');
  assert.strictEqual(page.Inventory.stockStatus(record({ quantity: 1, reorderLevel: 0 })), 'ok');
  assert.strictEqual(page.Inventory.stockStatus(record({ quantity: 2, reorderLevel: 2 })), 'low');
  assert.strictEqual(page.Inventory.stockStatus(record({ quantity: 1, reorderLevel: 2 })), 'low');
  assert.strictEqual(page.Inventory.stockStatus(record({ quantity: 0, reorderLevel: 2 })), 'out');
  assert.strictEqual(page.Inventory.stockStatus(record({ quantity: 0, reorderLevel: 0 })), 'out');
});

// --- Removing ---

test('removeProduct deletes the product and frees its SKU', function () {
  var storage = storageWith([record(), record({ id: 'a2', sku: 'W-2' })]);
  var page = openPage(storage);
  var result = page.Inventory.removeProduct('a1');
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.product.id, 'a1');
  assert.strictEqual(page.Inventory.getProduct('a1'), null);
  assert.strictEqual(stored(storage).length, 1);
  assert.deepStrictEqual(Object.keys(page.Inventory.removeProduct('a1').errors), ['id']);
  assert.strictEqual(page.Inventory.addProduct({ name: 'Again', sku: 'W-1' }).ok, true);
});

// --- Change notifications ---

test('subscribers are told about successful changes only', function () {
  var page = openPage(storageWith([record()]));
  var calls = 0;
  var unsubscribe = page.Inventory.subscribe(function () { calls++; });

  page.Inventory.addProduct({ name: 'New', sku: 'N-1' });
  page.Inventory.updateProduct('a1', { name: 'Changed' });
  page.Inventory.adjustStock('a1', 1);
  page.Inventory.removeProduct('a1');
  assert.strictEqual(calls, 4);

  page.Inventory.addProduct({});
  page.Inventory.updateProduct('nope', {});
  page.Inventory.adjustStock('nope', 1);
  page.Inventory.removeProduct('nope');
  page.Inventory.getProducts();
  assert.strictEqual(calls, 4);

  unsubscribe();
  unsubscribe();
  page.Inventory.addProduct({ name: 'Newer', sku: 'N-2' });
  assert.strictEqual(calls, 4);
});

test('subscribers see the change that triggered them', function () {
  var page = openPage(storageWith([]));
  var seen = null;
  page.Inventory.subscribe(function () { seen = page.Inventory.getProducts().length; });
  page.Inventory.addProduct({ name: 'New', sku: 'N-1' });
  assert.strictEqual(seen, 1);
});

test('subscribers are told about changes made in another tab', function () {
  var storage = storageWith([record()]);
  var tabA = openPage(storage);
  var tabB = openPage(storage);
  tabB.Inventory.init();
  var seen = [];
  tabB.Inventory.subscribe(function () { seen.push(tabB.Inventory.getProduct('a1').quantity); });

  tabA.Inventory.adjustStock('a1', 5);
  tabB.fireStorageEvent(PRODUCTS_KEY);
  tabB.fireStorageEvent('some.other.key');
  assert.deepStrictEqual(seen, [10]);
  tabB.fireStorageEvent(null);
  assert.deepStrictEqual(seen, [10, 10]);
});

// --- Several tabs ---

test('a tab never overwrites changes made in another tab', function () {
  var storage = storageWith([record()]);
  var tabA = openPage(storage);
  var tabB = openPage(storage);
  tabA.Inventory.init();
  tabB.Inventory.init();

  tabA.Inventory.adjustStock('a1', 5);
  var added = tabA.Inventory.addProduct({ name: 'From A', sku: 'A-1' }).product;

  // Tab B has not been told, and now makes its own changes.
  assert.strictEqual(tabB.Inventory.adjustStock('a1', -3).product.quantity, 7);
  assert.strictEqual(tabB.Inventory.addProduct({ name: 'Clash', sku: 'a-1' }).ok, false);
  tabB.Inventory.addProduct({ name: 'From B', sku: 'B-1' });

  var names = tabA.Inventory.getProducts().map(function (product) { return product.name; });
  assert.deepStrictEqual(plain(names), ['Widget', 'From A', 'From B']);
  assert.strictEqual(tabA.Inventory.getProduct('a1').quantity, 7);
  assert.strictEqual(tabB.Inventory.getProduct(added.id).name, 'From A');
});

test('a product removed in another tab cannot be changed', function () {
  var storage = storageWith([record()]);
  var tabA = openPage(storage);
  var tabB = openPage(storage);
  tabB.Inventory.init();
  tabA.Inventory.removeProduct('a1');
  assert.deepStrictEqual(Object.keys(tabB.Inventory.adjustStock('a1', 1).errors), ['id']);
  assert.deepStrictEqual(stored(storage), []);
});

// --- Storage problems ---

test('with storage unavailable the inventory works in memory', function () {
  var storage = makeStorage();
  storage.disabled = true;
  var page = openPage(storage);
  assert.deepStrictEqual(plain(page.Inventory.init()), { persistent: false, seeded: true, recovered: false });
  assert.strictEqual(page.Inventory.getProducts().length, 12);

  var calls = 0;
  page.Inventory.subscribe(function () { calls++; });
  var added = page.Inventory.addProduct({ name: 'New', sku: 'N-1', quantity: 2 });
  assert.strictEqual(added.ok, true);
  assert.strictEqual(page.Inventory.adjustStock(added.product.id, 3).product.quantity, 5);
  assert.strictEqual(page.Inventory.getProducts().length, 13);
  assert.strictEqual(page.Inventory.removeProduct(added.product.id).ok, true);
  assert.strictEqual(page.Inventory.getProducts().length, 12);
  assert.strictEqual(calls, 3);
  assert.deepStrictEqual(storage.data, {});
});

test('a failed save reports an error and changes nothing', function () {
  var storage = storageWith([record()]);
  var page = openPage(storage);
  page.Inventory.init();
  var calls = 0;
  page.Inventory.subscribe(function () { calls++; });
  var before = storage.data[PRODUCTS_KEY];
  storage.failWrites = true;

  [
    page.Inventory.addProduct({ name: 'New', sku: 'N-1' }),
    page.Inventory.updateProduct('a1', { name: 'Changed' }),
    page.Inventory.adjustStock('a1', 1),
    page.Inventory.removeStock([{ id: 'a1', quantity: 1 }]),
    page.Inventory.removeProduct('a1')
  ].forEach(function (result) {
    assert.strictEqual(result.ok, false);
    assert.deepStrictEqual(Object.keys(result.errors), ['storage']);
  });
  assert.strictEqual(calls, 0);
  assert.strictEqual(storage.data[PRODUCTS_KEY], before);
  assert.deepStrictEqual(plain(page.Inventory.getProducts()), [record()]);

  storage.failWrites = false;
  assert.strictEqual(page.Inventory.adjustStock('a1', 1).product.quantity, 6);
});

test('sample products stay put when the first save fails', function () {
  var storage = makeStorage();
  var page = openPage(storage);
  storage.failWrites = true;
  assert.strictEqual(page.Inventory.init().seeded, true);
  var first = page.Inventory.getProducts();
  assert.strictEqual(first.length, 12);
  assert.deepStrictEqual(plain(page.Inventory.getProducts()), plain(first));

  storage.failWrites = false;
  assert.strictEqual(page.Inventory.adjustStock(first[0].id, 1).ok, true);
  assert.strictEqual(stored(storage).length, 12);
});

test('storage cleared while the page is open is restored by the next change', function () {
  var storage = storageWith([record()]);
  var page = openPage(storage);
  page.Inventory.init();
  delete storage.data[PRODUCTS_KEY];
  assert.strictEqual(page.Inventory.getProducts().length, 1);
  page.Inventory.adjustStock('a1', 1);
  assert.strictEqual(stored(storage)[0].quantity, 6);
});

harness.run();
