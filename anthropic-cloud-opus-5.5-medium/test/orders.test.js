/*
 * Tests for js/orders.js (checkout and order history) and
 * Inventory.adjustStockMany.
 * Run with: node test/orders.test.js
 *
 * Like the other tests, the browser scripts are loaded into a fresh VM
 * context per test with an in-memory localStorage.
 */
'use strict';

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var vm = require('vm');

var root = path.join(__dirname, '..');
var sources = ['js/storage.js', 'js/inventory.js', 'js/cart.js', 'js/orders.js'].map(function (file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
});

/* In-memory localStorage; writes to keys listed in `failKeys` throw. */
function fakeLocalStorage(initial) {
  var data = Object.assign({}, initial);
  return {
    data: data,
    failKeys: {},
    getItem: function (k) {
      return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null;
    },
    setItem: function (k, v) {
      if (this.failKeys[k]) {
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
  context.Inventory.init();
  context.Cart.init();
  context.Orders.init();
  return context;
}

var KEY = 'inventory.products.v1';
var CART_KEY = 'inventory.cart.v1';
var ORDERS_KEY = 'inventory.orders.v1';
var tests = [];
function test(name, fn) {
  tests.push({ name: name, fn: fn });
}

function bySku(ctx, sku) {
  return ctx.Inventory.getAll().filter(function (p) { return p.sku === sku; })[0];
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

/* Snapshot of the three stored keys, to check nothing changed. */
function stored(storage) {
  return [storage.data[KEY], storage.data[CART_KEY], storage.data[ORDERS_KEY]];
}

test('the order history starts empty', function () {
  var ctx = load();
  assert.strictEqual(ctx.Orders.getAll().length, 0);
  assert.deepStrictEqual(plain(ctx.Orders.getSummary()), { orderCount: 0, unitCount: 0, total: 0 });
});

test('checkout records the order, reduces stock and empties the cart', function () {
  var ctx = load();
  var widget = bySku(ctx, 'WID-001'); // 120 at 2.50
  var cable = bySku(ctx, 'CAB-100'); // 260 at 4.49
  ctx.Cart.add(widget.id, 4);
  ctx.Cart.add(cable.id, 3);

  var res = ctx.Orders.checkout({ note: '  Acme Ltd  ' });
  assert.ok(res.ok);
  var order = res.order;
  assert.strictEqual(order.number, 1);
  assert.strictEqual(order.note, 'Acme Ltd');
  assert.strictEqual(order.unitCount, 7);
  assert.strictEqual(order.total, 23.47);
  assert.deepStrictEqual(plain(order.lines), [
    { productId: widget.id, sku: 'WID-001', name: 'Standard Widget', price: 2.5, quantity: 4, lineTotal: 10 },
    { productId: cable.id, sku: 'CAB-100', name: 'USB-C Cable (1 m)', price: 4.49, quantity: 3, lineTotal: 13.47 }
  ]);
  assert.ok(!isNaN(Date.parse(order.createdAt)));

  assert.strictEqual(bySku(ctx, 'WID-001').quantity, 116);
  assert.strictEqual(bySku(ctx, 'CAB-100').quantity, 257);
  assert.strictEqual(bySku(ctx, 'GAD-010').quantity, 42);
  assert.strictEqual(ctx.Cart.getItems().length, 0);
  assert.strictEqual(ctx.Orders.getAll().length, 1);
});

test('orders are numbered in sequence and listed newest first', function () {
  var ctx = load();
  var widget = bySku(ctx, 'WID-001');
  ctx.Cart.add(widget.id, 1);
  ctx.Orders.checkout();
  ctx.Cart.add(widget.id, 2);
  ctx.Orders.checkout();
  var all = ctx.Orders.getAll();
  assert.deepStrictEqual(plain(all.map(function (o) { return o.number; })), [2, 1]);
  assert.deepStrictEqual(plain(ctx.Orders.getSummary()), { orderCount: 2, unitCount: 3, total: 7.5 });
  assert.strictEqual(ctx.Orders.getById(all[1].id).number, 1);
  assert.strictEqual(ctx.Orders.getById('nope'), null);
});

test('buying the whole stock leaves it at zero', function () {
  var ctx = load();
  var caliper = bySku(ctx, 'TOL-201'); // 7 in stock
  ctx.Cart.add(caliper.id, 7);
  assert.ok(ctx.Orders.checkout().ok);
  assert.strictEqual(bySku(ctx, 'TOL-201').quantity, 0);
  assert.ok(ctx.Inventory.isOutOfStock(bySku(ctx, 'TOL-201')));
});

test('checkout of an empty cart fails', function () {
  var ctx = load();
  assert.ok(ctx.Orders.checkout().errors.cart);
  assert.strictEqual(ctx.Orders.getAll().length, 0);
});

test('checkout fails without changes when stock fell below the cart', function () {
  var storage = fakeLocalStorage();
  var ctx = load(storage);
  var widget = bySku(ctx, 'WID-001');
  var caliper = bySku(ctx, 'TOL-201');
  ctx.Cart.add(widget.id, 2);
  ctx.Cart.add(caliper.id, 5);
  ctx.Inventory.setStock(caliper.id, 3);
  var before = stored(storage);

  var res = ctx.Orders.checkout();
  assert.strictEqual(res.ok, false);
  assert.ok(/Only 3 of Digital Caliper/.test(res.errors.quantity));
  assert.deepStrictEqual(stored(storage), before);
  assert.strictEqual(bySku(ctx, 'WID-001').quantity, 120);
  assert.strictEqual(ctx.Cart.getItems().length, 2);
});

test('checkout fails when a product in the cart was deleted', function () {
  var ctx = load();
  var widget = bySku(ctx, 'WID-001');
  ctx.Cart.add(widget.id);
  ctx.Inventory.remove(widget.id);
  assert.ok(ctx.Orders.checkout().errors.product);
  assert.strictEqual(ctx.Orders.getAll().length, 0);
});

test('a note that is too long is rejected', function () {
  var ctx = load();
  ctx.Cart.add(bySku(ctx, 'WID-001').id);
  var long = new Array(ctx.Orders.NOTE_MAX_LENGTH + 2).join('x');
  assert.ok(ctx.Orders.checkout({ note: long }).errors.note);
  assert.strictEqual(ctx.Cart.getItems().length, 1);
});

test('orders keep the price and name at the time of purchase', function () {
  var ctx = load();
  var widget = bySku(ctx, 'WID-001');
  ctx.Cart.add(widget.id, 2);
  var id = ctx.Orders.checkout().order.id;
  ctx.Inventory.update(widget.id, { name: 'Renamed', price: 99 });
  ctx.Inventory.remove(widget.id);
  var order = ctx.Orders.getById(id);
  assert.strictEqual(order.lines[0].name, 'Standard Widget');
  assert.strictEqual(order.lines[0].price, 2.5);
  assert.strictEqual(order.total, 5);
});

test('if saving the order fails, nothing changes', function () {
  var storage = fakeLocalStorage();
  var ctx = load(storage);
  ctx.Cart.add(bySku(ctx, 'WID-001').id, 2);
  var before = stored(storage);
  storage.failKeys[ORDERS_KEY] = true;
  assert.ok(ctx.Orders.checkout().errors.storage);
  assert.deepStrictEqual(stored(storage), before);
  assert.strictEqual(ctx.Orders.getAll().length, 0);
  assert.strictEqual(ctx.Cart.getQuantity(bySku(ctx, 'WID-001').id), 2);
});

test('if saving the stock fails, the order is undone', function () {
  var storage = fakeLocalStorage();
  var ctx = load(storage);
  ctx.Cart.add(bySku(ctx, 'WID-001').id, 2);
  var before = stored(storage);
  storage.failKeys[KEY] = true;
  assert.ok(ctx.Orders.checkout().errors.storage);
  assert.deepStrictEqual(JSON.parse(storage.data[ORDERS_KEY] || '[]'), []);
  assert.strictEqual(storage.data[KEY], before[0]);
  assert.strictEqual(storage.data[CART_KEY], before[1]);
  assert.strictEqual(ctx.Orders.getAll().length, 0);
  assert.strictEqual(bySku(ctx, 'WID-001').quantity, 120);
});

test('if emptying the cart fails, the stock and order are undone', function () {
  var storage = fakeLocalStorage();
  var ctx = load(storage);
  var widget = bySku(ctx, 'WID-001');
  ctx.Cart.add(widget.id, 2);
  var cartBefore = storage.data[CART_KEY];
  storage.failKeys[CART_KEY] = true;
  assert.ok(ctx.Orders.checkout().errors.storage);
  assert.deepStrictEqual(JSON.parse(storage.data[ORDERS_KEY] || '[]'), []);
  assert.strictEqual(bySku(ctx, 'WID-001').quantity, 120);
  assert.strictEqual(JSON.parse(storage.data[KEY]).filter(function (p) {
    return p.id === widget.id;
  })[0].quantity, 120);
  assert.strictEqual(storage.data[CART_KEY], cartBefore);
  assert.strictEqual(ctx.Orders.getAll().length, 0);
});

test('orders survive a reload', function () {
  var storage = fakeLocalStorage();
  var ctx = load(storage);
  ctx.Cart.add(bySku(ctx, 'CAB-101').id, 3);
  var order = ctx.Orders.checkout({ note: 'Walk-in' }).order;
  var reloaded = load(storage);
  assert.deepStrictEqual(plain(reloaded.Orders.getAll()), [plain(order)]);
  assert.strictEqual(bySku(reloaded, 'CAB-101').quantity, 32);
  // Numbering continues after a reload.
  reloaded.Cart.add(bySku(reloaded, 'CAB-101').id);
  assert.strictEqual(reloaded.Orders.checkout().order.number, 2);
});

test('invalid stored orders are dropped and totals recomputed', function () {
  var initial = {};
  initial[ORDERS_KEY] = JSON.stringify([
    { id: 'a', number: 1, createdAt: '2026-01-01T00:00:00.000Z', note: 'ok', total: 999,
      lines: [{ productId: 'p', sku: 'X', name: 'Thing', price: 1.25, quantity: 2 },
              { productId: 'q', sku: 'Y', name: 'Bad', price: 1, quantity: 0 }] },
    { id: 'a', number: 2, lines: [{ price: 1, quantity: 1 }] },
    { id: 'b', number: 3, lines: [] },
    { number: 4, lines: [{ price: 1, quantity: 1 }] },
    null
  ]);
  var ctx = load(fakeLocalStorage(initial));
  var all = ctx.Orders.getAll();
  assert.strictEqual(all.length, 1);
  assert.strictEqual(all[0].lines.length, 1);
  assert.strictEqual(all[0].total, 2.5);
  assert.strictEqual(all[0].unitCount, 2);
});

test('a corrupt order history is backed up', function () {
  var initial = {};
  initial[ORDERS_KEY] = '{oops';
  var storage = fakeLocalStorage(initial);
  var ctx = load(storage);
  assert.strictEqual(ctx.Orders.getAll().length, 0);
  assert.strictEqual(storage.getItem(ORDERS_KEY + '.corrupt'), '{oops');
});

test('adjustStockMany is all or nothing', function () {
  var ctx = load();
  var a = bySku(ctx, 'WID-001'); // 120
  var b = bySku(ctx, 'TOL-201'); // 7
  var res = ctx.Inventory.adjustStockMany([{ id: a.id, delta: -10 }, { id: b.id, delta: -8 }]);
  assert.ok(res.errors.quantity);
  assert.strictEqual(bySku(ctx, 'WID-001').quantity, 120);
  assert.ok(ctx.Inventory.adjustStockMany([{ id: a.id, delta: 1.5 }]).errors.quantity);
  assert.ok(ctx.Inventory.adjustStockMany([{ id: 'nope', delta: 1 }]).errors.id);

  res = ctx.Inventory.adjustStockMany([{ id: a.id, delta: -10 }, { id: b.id, delta: 3 }]);
  assert.ok(res.ok);
  assert.strictEqual(res.products.length, 2);
  assert.strictEqual(bySku(ctx, 'WID-001').quantity, 110);
  assert.strictEqual(bySku(ctx, 'TOL-201').quantity, 10);
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
