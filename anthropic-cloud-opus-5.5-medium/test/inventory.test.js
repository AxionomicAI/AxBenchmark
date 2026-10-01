/*
 * Tests for js/storage.js and js/inventory.js.
 * Run with: node test/inventory.test.js
 *
 * The browser scripts are loaded into a fresh VM context per test with an
 * in-memory localStorage, so each test starts from a clean browser.
 */
'use strict';

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var vm = require('vm');

var root = path.join(__dirname, '..');
var sources = ['js/storage.js', 'js/inventory.js'].map(function (file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
});

function fakeLocalStorage(initial) {
  var data = Object.assign({}, initial);
  return {
    data: data,
    failWrites: false,
    getItem: function (k) {
      return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null;
    },
    setItem: function (k, v) {
      if (this.failWrites) {
        throw new Error('QuotaExceededError');
      }
      data[k] = String(v);
    },
    removeItem: function (k) {
      delete data[k];
    }
  };
}

function load(storage) {
  var context = {
    localStorage: storage || fakeLocalStorage(),
    console: { error: function () {}, warn: function () {}, log: console.log }
  };
  vm.createContext(context);
  sources.forEach(function (src) {
    vm.runInContext(src, context);
  });
  // Top-level `var` declarations become properties of the context.
  return context;
}

var KEY = 'inventory.products.v1';
var tests = [];
function test(name, fn) {
  tests.push({ name: name, fn: fn });
}

function validProduct(overrides) {
  return Object.assign({
    sku: 'NEW-1', name: 'New thing', category: 'Misc',
    quantity: 3, reorderLevel: 1, price: 9.99
  }, overrides);
}

test('first run seeds and persists sample data', function () {
  var ctx = load();
  ctx.Inventory.init();
  var all = ctx.Inventory.getAll();
  assert.ok(all.length > 0);
  var stored = JSON.parse(ctx.localStorage.getItem(KEY));
  assert.strictEqual(stored.length, all.length);
  assert.ok(all.every(function (p) { return p.id && p.createdAt; }));
});

test('an emptied inventory is not re-seeded', function () {
  var storage = fakeLocalStorage();
  var ctx = load(storage);
  ctx.Inventory.init();
  ctx.Inventory.getAll().forEach(function (p) {
    assert.ok(ctx.Inventory.remove(p.id).ok);
  });
  var reloaded = load(storage);
  reloaded.Inventory.init();
  assert.strictEqual(reloaded.Inventory.getAll().length, 0);
});

test('changes survive a reload', function () {
  var storage = fakeLocalStorage();
  var ctx = load(storage);
  ctx.Inventory.init();
  var added = ctx.Inventory.add(validProduct());
  assert.ok(added.ok);
  ctx.Inventory.adjustStock(added.product.id, 5);

  var reloaded = load(storage);
  reloaded.Inventory.init();
  var p = reloaded.Inventory.getById(added.product.id);
  assert.strictEqual(p.name, 'New thing');
  assert.strictEqual(p.quantity, 8);
});

test('add validates fields and normalizes values', function () {
  var ctx = load();
  ctx.Inventory.init();
  var bad = ctx.Inventory.add({ sku: ' ', name: '', quantity: -1, reorderLevel: 1.5, price: 'abc' });
  assert.strictEqual(bad.ok, false);
  assert.deepStrictEqual(Object.keys(bad.errors).sort(),
    ['name', 'price', 'quantity', 'reorderLevel', 'sku']);

  var good = ctx.Inventory.add(validProduct({ name: '  Padded  ', quantity: '4', price: '1.005' }));
  assert.ok(good.ok);
  assert.strictEqual(good.product.name, 'Padded');
  assert.strictEqual(good.product.quantity, 4);
  assert.strictEqual(typeof good.product.price, 'number');
});

test('SKUs must be unique, case-insensitively', function () {
  var ctx = load();
  ctx.Inventory.init();
  var existing = ctx.Inventory.getAll()[0];
  var dup = ctx.Inventory.add(validProduct({ sku: existing.sku.toLowerCase() }));
  assert.strictEqual(dup.ok, false);
  assert.ok(dup.errors.sku);
  // A product may keep its own SKU when edited.
  assert.ok(ctx.Inventory.update(existing.id, { sku: existing.sku, name: 'Renamed' }).ok);
});

test('update changes only the given fields', function () {
  var ctx = load();
  ctx.Inventory.init();
  var before = ctx.Inventory.getAll()[0];
  var res = ctx.Inventory.update(before.id, { price: 1 });
  assert.ok(res.ok);
  assert.strictEqual(res.product.price, 1);
  assert.strictEqual(res.product.name, before.name);
  assert.strictEqual(res.product.createdAt, before.createdAt);
  assert.strictEqual(ctx.Inventory.update('nope', {}).ok, false);
});

test('stock cannot go negative', function () {
  var ctx = load();
  ctx.Inventory.init();
  var p = ctx.Inventory.add(validProduct({ quantity: 2 })).product;
  assert.strictEqual(ctx.Inventory.adjustStock(p.id, -3).ok, false);
  assert.strictEqual(ctx.Inventory.adjustStock(p.id, 0.5).ok, false);
  assert.strictEqual(ctx.Inventory.adjustStock(p.id, -2).product.quantity, 0);
  assert.strictEqual(ctx.Inventory.setStock(p.id, 10).product.quantity, 10);
  assert.strictEqual(ctx.Inventory.setStock(p.id, -1).ok, false);
});

test('returned products are copies', function () {
  var ctx = load();
  ctx.Inventory.init();
  var p = ctx.Inventory.getAll()[0];
  p.quantity = 999;
  assert.notStrictEqual(ctx.Inventory.getById(p.id).quantity, 999);
});

test('a failed save leaves state unchanged', function () {
  var storage = fakeLocalStorage();
  var ctx = load(storage);
  ctx.Inventory.init();
  var count = ctx.Inventory.getAll().length;
  storage.failWrites = true;
  var res = ctx.Inventory.add(validProduct());
  assert.strictEqual(res.ok, false);
  assert.ok(res.errors.storage);
  assert.strictEqual(ctx.Inventory.getAll().length, count);
});

test('corrupt data is backed up and not replaced by samples', function () {
  var initial = {};
  initial[KEY] = '{not json';
  var storage = fakeLocalStorage(initial);
  var ctx = load(storage);
  ctx.Inventory.init();
  assert.strictEqual(ctx.Inventory.getAll().length, 0);
  assert.strictEqual(storage.getItem(KEY + '.corrupt'), '{not json');
});

test('invalid stored records are skipped or repaired', function () {
  var initial = {};
  initial[KEY] = JSON.stringify([
    { id: 'a', sku: 'A', name: 'Ok', quantity: 'x', price: -5 },
    { id: 'a', sku: 'B', name: 'Duplicate id' },
    { sku: 'C', name: 'No id' },
    null
  ]);
  var ctx = load(fakeLocalStorage(initial));
  ctx.Inventory.init();
  var all = ctx.Inventory.getAll();
  assert.strictEqual(all.length, 1);
  assert.strictEqual(all[0].quantity, 0);
  assert.strictEqual(all[0].price, 0);
});

test('summary and categories', function () {
  var ctx = load();
  ctx.Inventory.init();
  ctx.Inventory.getAll().forEach(function (p) { ctx.Inventory.remove(p.id); });
  ctx.Inventory.add(validProduct({ sku: 'X', category: 'B', quantity: 2, reorderLevel: 5, price: 1.5 }));
  ctx.Inventory.add(validProduct({ sku: 'Y', category: 'A', quantity: 0, reorderLevel: 0, price: 3 }));
  ctx.Inventory.add(validProduct({ sku: 'Z', category: 'A', quantity: 10, reorderLevel: 1, price: 0.1 }));
  var s = ctx.Inventory.getSummary();
  assert.strictEqual(s.productCount, 3);
  assert.strictEqual(s.totalUnits, 12);
  assert.strictEqual(s.totalValue, 4);
  assert.strictEqual(s.lowStockCount, 2);
  assert.strictEqual(s.outOfStockCount, 1);
  assert.deepStrictEqual(Array.from(ctx.Inventory.getCategories()), ['A', 'B']);
});

test('resetToSampleData restores the samples', function () {
  var ctx = load();
  ctx.Inventory.init();
  var sampleCount = ctx.Inventory.getAll().length;
  ctx.Inventory.remove(ctx.Inventory.getAll()[0].id);
  assert.ok(ctx.Inventory.resetToSampleData().ok);
  assert.strictEqual(ctx.Inventory.getAll().length, sampleCount);
});

function skus(products) {
  return Array.from(products).map(function (p) { return p.sku; });
}

test('search matches SKU, name and category words in any order', function () {
  var ctx = load();
  ctx.Inventory.init();
  var all = ctx.Inventory.getAll();
  assert.strictEqual(ctx.Inventory.search().length, all.length);
  assert.strictEqual(ctx.Inventory.search({ query: '   ' }).length, all.length);
  assert.deepStrictEqual(skus(ctx.Inventory.search({ query: 'wid-00' })), ['WID-001', 'WID-002']);
  assert.deepStrictEqual(skus(ctx.Inventory.search({ query: 'WIDGET deluxe' })), ['WID-002']);
  assert.deepStrictEqual(skus(ctx.Inventory.search({ query: 'cables hdmi' })), ['CAB-101']);
  assert.deepStrictEqual(skus(ctx.Inventory.search({ query: 'nothing-like-this' })), []);
  // A word must not match across two fields.
  assert.deepStrictEqual(skus(ctx.Inventory.search({ query: '001standard' })), []);
});

test('search lists an exact SKU match first', function () {
  var ctx = load();
  ctx.Inventory.init();
  ctx.Inventory.add(validProduct({ sku: 'X-1', name: 'Part for x-10' }));
  ctx.Inventory.add(validProduct({ sku: 'X-10', name: 'Other' }));
  assert.deepStrictEqual(skus(ctx.Inventory.search({ query: 'x-10' })), ['X-10', 'X-1']);
});

test('search filters by category and stock level', function () {
  var ctx = load();
  ctx.Inventory.init();
  assert.deepStrictEqual(skus(ctx.Inventory.search({ category: 'Gadgets' })), ['GAD-010', 'GAD-011']);
  assert.deepStrictEqual(skus(ctx.Inventory.search({ stock: 'out' })), ['GAD-011']);
  assert.deepStrictEqual(skus(ctx.Inventory.search({ stock: 'low' })), ['WID-002', 'GAD-011', 'CAB-101']);
  assert.strictEqual(ctx.Inventory.search({ stock: 'in' }).length, 5);
  assert.deepStrictEqual(skus(ctx.Inventory.search({ category: 'Widgets', stock: 'low', query: 'widget' })),
    ['WID-002']);
});

test('search results are copies', function () {
  var ctx = load();
  ctx.Inventory.init();
  var p = ctx.Inventory.search({ query: 'WID-001' })[0];
  p.quantity = 999;
  assert.notStrictEqual(ctx.Inventory.getById(p.id).quantity, 999);
});

test('quantities and prices too large to store exactly are rejected', function () {
  var ctx = load();
  ctx.Inventory.init();
  var base = { sku: 'BIG-1', name: 'Big', quantity: 1, reorderLevel: 0, price: 1 };
  function errorsFor(changes) {
    var data = Object.assign({}, base, changes);
    return ctx.Inventory.add(data).errors || {};
  }
  assert.ok(errorsFor({ quantity: '1e21' }).quantity);
  assert.ok(errorsFor({ reorderLevel: 1e10 }).reorderLevel);
  assert.ok(errorsFor({ price: '1e307' }).price);
  var added = ctx.Inventory.add(Object.assign({}, base, { quantity: 1e9, price: 1e9 }));
  assert.ok(added.ok);
  assert.strictEqual(ctx.Inventory.adjustStock(added.product.id, 1).ok, false);
  assert.strictEqual(ctx.Inventory.adjustStockMany([{ id: added.product.id, delta: 1 }]).ok, false);
});

test('out-of-range stored values are reset on load', function () {
  var ctx = load();
  ctx.localStorage.setItem('inventory.products.v1', JSON.stringify([
    { id: 'a', sku: 'A', name: 'A', quantity: 1e21, reorderLevel: 2, price: null }
  ]));
  ctx.Inventory.init();
  var p = ctx.Inventory.getById('a');
  assert.strictEqual(p.quantity, 0);
  assert.strictEqual(p.price, 0);
});

var failed = 0;
tests.forEach(function (t) {
  try {
    t.fn();
    console.log('ok   ' + t.name);
  } catch (err) {
    failed++;
    console.log('FAIL ' + t.name + '\n     ' + err.message);
  }
});
console.log('\n' + (tests.length - failed) + '/' + tests.length + ' passed');
process.exit(failed ? 1 : 0);
