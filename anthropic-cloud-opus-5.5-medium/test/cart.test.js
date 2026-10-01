/*
 * Tests for js/cart.js.
 * Run with: node test/cart.test.js
 *
 * Like inventory.test.js, the browser scripts are loaded into a fresh VM
 * context per test with an in-memory localStorage.
 */
'use strict';

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var vm = require('vm');

var root = path.join(__dirname, '..');
var sources = ['js/storage.js', 'js/inventory.js', 'js/cart.js'].map(function (file) {
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

/* Loads the scripts and initializes the inventory and cart. */
function load(storage) {
  var context = {
    localStorage: storage || fakeLocalStorage(),
    console: { error: function () {}, warn: function () {}, log: console.log }
  };
  vm.createContext(context);
  sources.forEach(function (src) {
    vm.runInContext(src, context);
  });
  context.Inventory.init();
  context.Cart.init();
  return context;
}

var CART_KEY = 'inventory.cart.v1';
var tests = [];
function test(name, fn) {
  tests.push({ name: name, fn: fn });
}

function bySku(ctx, sku) {
  return ctx.Inventory.getAll().filter(function (p) { return p.sku === sku; })[0];
}

test('the cart starts empty', function () {
  var ctx = load();
  assert.strictEqual(ctx.Cart.getItems().length, 0);
  assert.deepStrictEqual(Object.assign({}, ctx.Cart.getTotals()),
    { lineCount: 0, unitCount: 0, total: 0, overStockCount: 0 });
});

test('add increases the quantity of an existing line', function () {
  var ctx = load();
  var widget = bySku(ctx, 'WID-001');
  assert.ok(ctx.Cart.add(widget.id).ok);
  var res = ctx.Cart.add(widget.id, 2);
  assert.ok(res.ok);
  assert.strictEqual(res.item.quantity, 3);
  assert.strictEqual(ctx.Cart.getItems().length, 1);
  assert.strictEqual(ctx.Cart.getQuantity(widget.id), 3);
});

test('add rejects bad quantities and unknown products', function () {
  var ctx = load();
  var widget = bySku(ctx, 'WID-001');
  assert.ok(ctx.Cart.add(widget.id, 0).errors.quantity);
  assert.ok(ctx.Cart.add(widget.id, 1.5).errors.quantity);
  assert.ok(ctx.Cart.add(widget.id, 'x').errors.quantity);
  assert.ok(ctx.Cart.add('nope').errors.product);
  assert.strictEqual(ctx.Cart.getItems().length, 0);
});

test('the cart cannot hold more than is in stock', function () {
  var ctx = load();
  var caliper = bySku(ctx, 'TOL-201'); // 7 in stock
  var outOfStock = bySku(ctx, 'GAD-011');
  assert.ok(ctx.Cart.add(outOfStock.id).errors.quantity);
  assert.ok(ctx.Cart.add(caliper.id, 7).ok);
  assert.ok(ctx.Cart.add(caliper.id).errors.quantity);
  assert.ok(ctx.Cart.setQuantity(caliper.id, 8).errors.quantity);
  assert.strictEqual(ctx.Cart.getQuantity(caliper.id), 7);
});

test('setQuantity changes a line and 0 removes it', function () {
  var ctx = load();
  var widget = bySku(ctx, 'WID-001');
  ctx.Cart.add(widget.id);
  assert.strictEqual(ctx.Cart.setQuantity(widget.id, '4').item.quantity, 4);
  assert.ok(ctx.Cart.setQuantity(widget.id, -1).errors.quantity);
  assert.ok(ctx.Cart.setQuantity(widget.id, '').errors.quantity);
  assert.strictEqual(ctx.Cart.getQuantity(widget.id), 4);
  assert.ok(ctx.Cart.setQuantity(widget.id, 0).ok);
  assert.strictEqual(ctx.Cart.getItems().length, 0);
});

test('remove and clear', function () {
  var ctx = load();
  var a = bySku(ctx, 'WID-001');
  var b = bySku(ctx, 'CAB-100');
  ctx.Cart.add(a.id);
  ctx.Cart.add(b.id);
  assert.ok(ctx.Cart.remove(a.id).ok);
  assert.strictEqual(ctx.Cart.remove(a.id).ok, false);
  assert.deepStrictEqual(Array.from(ctx.Cart.getItems(), function (i) { return i.productId; }), [b.id]);
  assert.ok(ctx.Cart.clear().ok);
  assert.strictEqual(ctx.Cart.getItems().length, 0);
});

test('lines and totals use current prices, in cents', function () {
  var ctx = load();
  ctx.Cart.add(bySku(ctx, 'WID-001').id, 3); // 2.50
  var cable = bySku(ctx, 'CAB-100');
  ctx.Cart.add(cable.id, 3); // 4.49
  var lines = ctx.Cart.getLines();
  assert.strictEqual(lines[0].lineTotal, 7.5);
  assert.strictEqual(lines[1].lineTotal, 13.47);
  var totals = ctx.Cart.getTotals();
  assert.strictEqual(totals.total, 20.97);
  assert.strictEqual(totals.unitCount, 6);
  assert.strictEqual(totals.lineCount, 2);

  ctx.Inventory.update(cable.id, { price: 0.1 });
  assert.strictEqual(ctx.Cart.getTotals().total, 7.8);
});

test('lines flag quantities above current stock', function () {
  var ctx = load();
  var caliper = bySku(ctx, 'TOL-201');
  ctx.Cart.add(caliper.id, 5);
  ctx.Inventory.setStock(caliper.id, 2);
  var line = ctx.Cart.getLines()[0];
  assert.strictEqual(line.overStock, true);
  assert.strictEqual(line.inStock, 2);
  assert.strictEqual(ctx.Cart.getTotals().overStockCount, 1);
  // Lowering to the available stock is allowed.
  assert.ok(ctx.Cart.setQuantity(caliper.id, 2).ok);
  assert.strictEqual(ctx.Cart.getLines()[0].overStock, false);
});

test('prune drops products deleted from the inventory', function () {
  var ctx = load();
  var a = bySku(ctx, 'WID-001');
  var b = bySku(ctx, 'CAB-100');
  ctx.Cart.add(a.id);
  ctx.Cart.add(b.id);
  ctx.Inventory.remove(a.id);
  assert.strictEqual(ctx.Cart.getLines().length, 1);
  assert.strictEqual(ctx.Cart.prune(), 1);
  assert.strictEqual(ctx.Cart.prune(), 0);
  assert.strictEqual(JSON.parse(ctx.localStorage.getItem(CART_KEY)).length, 1);
});

test('the cart survives a reload', function () {
  var storage = fakeLocalStorage();
  var ctx = load(storage);
  var widget = bySku(ctx, 'WID-001');
  ctx.Cart.add(widget.id, 4);
  var reloaded = load(storage);
  assert.strictEqual(reloaded.Cart.getQuantity(widget.id), 4);
  assert.strictEqual(reloaded.Cart.getTotals().total, 10);
});

test('a failed save leaves the cart unchanged', function () {
  var storage = fakeLocalStorage();
  var ctx = load(storage);
  var widget = bySku(ctx, 'WID-001');
  ctx.Cart.add(widget.id);
  storage.failWrites = true;
  assert.ok(ctx.Cart.add(widget.id).errors.storage);
  assert.ok(ctx.Cart.clear().errors.storage);
  assert.strictEqual(ctx.Cart.getQuantity(widget.id), 1);
});

test('invalid stored records are dropped and duplicates merged', function () {
  var storage = fakeLocalStorage();
  var id = bySku(load(storage), 'WID-001').id;
  storage.data[CART_KEY] = JSON.stringify([
    { productId: id, quantity: 2 },
    { productId: id, quantity: '3' },
    { productId: id, quantity: 0 },
    { productId: '', quantity: 1 },
    { quantity: 1 },
    null
  ]);
  var ctx = load(storage);
  assert.deepStrictEqual(Array.from(ctx.Cart.getItems(), function (i) { return Object.assign({}, i); }),
    [{ productId: id, quantity: 5 }]);
});

test('a corrupt cart is backed up', function () {
  var initial = {};
  initial[CART_KEY] = 'oops';
  var storage = fakeLocalStorage(initial);
  var ctx = load(storage);
  assert.strictEqual(ctx.Cart.getItems().length, 0);
  assert.strictEqual(storage.getItem(CART_KEY + '.corrupt'), 'oops');
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
