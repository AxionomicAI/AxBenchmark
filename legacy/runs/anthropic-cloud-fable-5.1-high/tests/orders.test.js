// Tests for checkout and the order history (js/orders.js) on top of the data
// layer and the cart.
// Run with: node tests/orders.test.js
// The scripts are loaded unmodified into a fake browser global with an
// in-memory localStorage.
'use strict';

var assert = require('assert');
var harness = require('./harness');

var test = harness.test;
var makeStorage = harness.makeStorage;

var PRODUCTS_KEY = 'inventory.products';
var CART_KEY = 'inventory.cart';
var ORDERS_KEY = 'inventory.orders';
var ORDERS_BACKUP_KEY = 'inventory.orders.backup';

var STORAGE_FAILURE = { ok: false, errors: { storage: 'Could not save. Browser storage may be full or disabled.' } };

var SCRIPTS = harness.loadScripts(['storage.js', 'sample-data.js', 'inventory.js', 'cart.js', 'orders.js']);

function product(overrides) {
  return Object.assign({
    id: 'mouse',
    name: 'Wireless Mouse',
    sku: 'ELC-MSE-210',
    category: 'Electronics',
    quantity: 35,
    priceCents: 1999,
    reorderLevel: 10,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  }, overrides);
}

// An inventory of three products: 35 mice at $19.99, 3 desks at $399.00 and
// 8 cables at $8.50. orders, if given, is the stored order history.
function makeShop(orders) {
  var initial = {};
  initial[PRODUCTS_KEY] = JSON.stringify([
    product(),
    product({ id: 'desk', name: 'Standing Desk', sku: 'FUR-DSK-160', quantity: 3, priceCents: 39900 }),
    product({ id: 'cable', name: 'USB-C Cable', sku: 'ELC-CBL-100', quantity: 8, priceCents: 850 })
  ]);
  if (orders !== undefined) {
    initial[ORDERS_KEY] = typeof orders === 'string' ? orders : JSON.stringify(orders);
  }
  return makeStorage(initial);
}

function openPage(storage) {
  return harness.openPage(SCRIPTS, storage);
}

// A stored order, as checkout writes it.
function order(number, overrides) {
  return Object.assign({
    number: number,
    placedAt: '2026-02-0' + number + 'T10:00:00.000Z',
    lines: [{ productId: 'mouse', name: 'Wireless Mouse', sku: 'ELC-MSE-210', priceCents: 1999, quantity: 2 }]
  }, overrides);
}

function storedOrders(storage) {
  return JSON.parse(storage.data[ORDERS_KEY]);
}

// Objects made inside the vm have another realm's prototypes, which
// deepStrictEqual treats as different; compare plain copies instead.
function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

// The stock as { product id: quantity }.
function stock(page) {
  var quantities = {};
  page.Inventory.getProducts().forEach(function (p) { quantities[p.id] = p.quantity; });
  return quantities;
}

// The cart as [product id, quantity] pairs.
function cartContents(page) {
  return plain(page.Cart.getCart().lines.map(function (line) {
    return [line.product.id, line.quantity];
  }));
}

function orderNumbers(page) {
  return plain(page.Orders.getOrders().map(function (o) { return o.number; }));
}

// Makes every write to the given key fail, as when the quota is used up by
// the value being written.
function failWritesTo(storage, key) {
  var setItem = storage.setItem;
  storage.setItem = function (name, value) {
    if (name === key) { throw new Error('QuotaExceededError'); }
    setItem(name, value);
  };
  return function restore() { storage.setItem = setItem; };
}

// --- Checkout ---

test('the order history starts empty', function () {
  var storage = makeShop();
  var page = openPage(storage);
  assert.deepStrictEqual(plain(page.Orders.init()), { recovered: false });
  assert.deepStrictEqual(plain(page.Orders.getOrders()), []);
  assert.strictEqual(storage.data[ORDERS_KEY], undefined);
});

test('checkout records the order, takes it out of the stock and empties the cart', function () {
  var storage = makeShop();
  var page = openPage(storage);
  page.Cart.add('mouse', 2);
  page.Cart.add('desk', 3);

  var before = Date.now();
  var result = page.Orders.checkout();
  var after = Date.now();

  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.cartCleared, true);
  var placed = result.order;
  assert.strictEqual(placed.number, 1);
  assert.ok(Date.parse(placed.placedAt) >= before && Date.parse(placed.placedAt) <= after);
  assert.strictEqual(placed.placedAt, new Date(placed.placedAt).toISOString());
  assert.deepStrictEqual(plain(placed.lines), [
    { productId: 'mouse', name: 'Wireless Mouse', sku: 'ELC-MSE-210', priceCents: 1999, quantity: 2, subtotalCents: 3998 },
    { productId: 'desk', name: 'Standing Desk', sku: 'FUR-DSK-160', priceCents: 39900, quantity: 3, subtotalCents: 119700 }
  ]);
  assert.strictEqual(placed.units, 5);
  assert.strictEqual(placed.totalCents, 123698);

  assert.deepStrictEqual(stock(page), { mouse: 33, desk: 0, cable: 8 });
  assert.deepStrictEqual(cartContents(page), []);
  assert.deepStrictEqual(JSON.parse(storage.data[CART_KEY]), []);
  assert.deepStrictEqual(plain(page.Orders.getOrders()), [plain(placed)]);

  // Only what cannot be worked out is stored.
  assert.deepStrictEqual(storedOrders(storage), [{
    number: 1,
    placedAt: placed.placedAt,
    lines: [
      { productId: 'mouse', name: 'Wireless Mouse', sku: 'ELC-MSE-210', priceCents: 1999, quantity: 2 },
      { productId: 'desk', name: 'Standing Desk', sku: 'FUR-DSK-160', priceCents: 39900, quantity: 3 }
    ]
  }]);
});

test('checkout marks the products it took from as changed, and no others', function () {
  var page = openPage(makeShop());
  page.Cart.add('mouse', 2);
  var placedAt = page.Orders.checkout().order.placedAt;
  assert.ok(page.Inventory.getProduct('mouse').updatedAt >= placedAt);
  assert.strictEqual(page.Inventory.getProduct('desk').updatedAt, '2026-01-01T00:00:00.000Z');
});

test('orders are numbered from 1 and returned in the order they were placed', function () {
  var page = openPage(makeShop());
  ['mouse', 'cable', 'mouse'].forEach(function (id, index) {
    page.Cart.add(id);
    assert.strictEqual(page.Orders.checkout().order.number, index + 1);
  });
  assert.deepStrictEqual(orderNumbers(page), [1, 2, 3]);
  assert.deepStrictEqual(plain(page.Orders.getOrders().map(function (o) { return o.lines[0].productId; })),
    ['mouse', 'cable', 'mouse']);
});

test('an order keeps its products as they were at checkout', function () {
  var page = openPage(makeShop());
  page.Cart.add('mouse', 2);
  page.Cart.add('cable', 1);
  page.Orders.checkout();

  page.Inventory.updateProduct('mouse', { name: 'Mouse', sku: 'M-1', priceCents: 5, quantity: 0 });
  page.Inventory.removeProduct('cable');

  var placed = page.Orders.getOrders()[0];
  assert.deepStrictEqual(plain(placed.lines), [
    { productId: 'mouse', name: 'Wireless Mouse', sku: 'ELC-MSE-210', priceCents: 1999, quantity: 2, subtotalCents: 3998 },
    { productId: 'cable', name: 'USB-C Cable', sku: 'ELC-CBL-100', priceCents: 850, quantity: 1, subtotalCents: 850 }
  ]);
  assert.strictEqual(placed.totalCents, 4848);
});

test('checkout buys at the current price, not the one when the product was put in the cart', function () {
  var page = openPage(makeShop());
  page.Cart.add('mouse', 2);
  page.Inventory.updateProduct('mouse', { priceCents: 1500 });
  assert.strictEqual(page.Orders.checkout().order.totalCents, 3000);
});

test('a product deleted while it was in the cart is not bought', function () {
  var page = openPage(makeShop());
  page.Cart.add('mouse', 2);
  page.Cart.add('cable', 1);
  page.Inventory.removeProduct('mouse');

  var result = page.Orders.checkout();
  assert.strictEqual(result.ok, true);
  assert.deepStrictEqual(plain(result.order.lines.map(function (line) { return line.productId; })), ['cable']);
  assert.deepStrictEqual(cartContents(page), []);
});

test('checkout can take the last of the stock', function () {
  var page = openPage(makeShop());
  page.Cart.add('desk', 3);
  assert.strictEqual(page.Orders.checkout().ok, true);
  assert.strictEqual(page.Inventory.getProduct('desk').quantity, 0);
  assert.strictEqual(page.Inventory.stockStatus(page.Inventory.getProduct('desk')), 'out');
});

test('returned orders are copies; changing them does not change the history', function () {
  var page = openPage(makeShop());
  page.Cart.add('mouse', 2);
  var placed = page.Orders.checkout().order;
  placed.number = 9;
  placed.lines[0].quantity = 30;
  page.Orders.getOrders()[0].lines.pop();

  var kept = page.Orders.getOrders()[0];
  assert.strictEqual(kept.number, 1);
  assert.strictEqual(kept.lines.length, 1);
  assert.strictEqual(kept.lines[0].quantity, 2);
});

// --- Carts that cannot be checked out ---

// Checks that the cart is refused with the given errors, by checkCart and by
// checkout, and that checkout changes nothing.
function assertRefused(page, storage, errors) {
  var before = plain(storage.data);
  assert.deepStrictEqual(plain(page.Orders.checkCart(page.Cart.getCart())), errors);
  assert.deepStrictEqual(plain(page.Orders.checkout()), { ok: false, errors: errors });
  assert.deepStrictEqual(plain(storage.data), before);
}

test('checkCart accepts a cart that the stock covers', function () {
  var page = openPage(makeShop());
  page.Cart.add('mouse', 35);
  page.Cart.add('desk', 1);
  assert.strictEqual(page.Orders.checkCart(page.Cart.getCart()), null);
});

test('an empty cart cannot be checked out', function () {
  var storage = makeShop();
  var page = openPage(storage);
  assertRefused(page, storage, { cart: 'The cart is empty.' });
  assert.deepStrictEqual(orderNumbers(page), []);
});

test('a cart that holds more than is in stock cannot be checked out', function () {
  var storage = makeShop();
  var page = openPage(storage);
  page.Cart.add('mouse', 10);
  page.Cart.add('desk', 2);
  page.Cart.add('cable', 1);

  page.Inventory.updateProduct('mouse', { quantity: 4 });
  assertRefused(page, storage, { stock: 'Only 4 of “Wireless Mouse” in stock, and the cart has 10.' });

  page.Inventory.updateProduct('mouse', { quantity: 0 });
  assertRefused(page, storage, { stock: '“Wireless Mouse” is out of stock.' });

  page.Inventory.updateProduct('desk', { quantity: 1 });
  assertRefused(page, storage, { stock: '2 products in the cart have less in stock than the cart holds.' });

  assert.deepStrictEqual(orderNumbers(page), []);
  assert.deepStrictEqual(stock(page), { mouse: 0, desk: 1, cable: 8 });
  assert.deepStrictEqual(cartContents(page), [['mouse', 10], ['desk', 2], ['cable', 1]]);

  // Once the cart is put right it can be checked out.
  page.Cart.remove('mouse');
  page.Cart.setQuantity('desk', 1);
  assert.strictEqual(page.Orders.checkout().ok, true);
  assert.deepStrictEqual(stock(page), { mouse: 0, desk: 0, cable: 7 });
});

test('a cart whose total is too large to be exact cannot be checked out', function () {
  var storage = makeShop();
  var page = openPage(storage);
  var max = page.Inventory.MAX_INTEGER;
  page.Inventory.updateProduct('mouse', { quantity: max, priceCents: max });
  page.Cart.add('mouse', max);
  assertRefused(page, storage, { total: 'The total is too large for one order.' });

  // 9,007,199 units at $10,000,000.00 is the most that is still exact.
  page.Cart.setQuantity('mouse', 9007199);
  var result = page.Orders.checkout();
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.order.totalCents, 9007199000000000);
});

// --- Persistence ---

test('the order history is still there when the page is opened again', function () {
  var storage = makeShop();
  var first = openPage(storage);
  first.Cart.add('mouse', 2);
  first.Orders.checkout();
  first.Cart.add('desk');
  first.Orders.checkout();

  var second = openPage(storage);
  assert.deepStrictEqual(plain(second.Orders.getOrders()), plain(first.Orders.getOrders()));
  assert.deepStrictEqual(orderNumbers(second), [1, 2]);
  second.Cart.add('cable');
  assert.strictEqual(second.Orders.checkout().order.number, 3);
});

test('stored orders are loaded with their totals worked out', function () {
  var page = openPage(makeShop([order(1), order(2, {
    lines: [
      { productId: 'gone', name: 'Old Lamp', sku: 'OLD-1', priceCents: 0, quantity: 4 },
      { productId: 'desk', name: 'Standing Desk', sku: 'FUR-DSK-160', priceCents: 39900, quantity: 1 }
    ]
  })]));
  assert.deepStrictEqual(plain(page.Orders.init()), { recovered: false });

  var orders = page.Orders.getOrders();
  assert.strictEqual(orders[0].units, 2);
  assert.strictEqual(orders[0].totalCents, 3998);
  assert.strictEqual(orders[1].placedAt, '2026-02-02T10:00:00.000Z');
  assert.strictEqual(orders[1].lines[0].subtotalCents, 0);
  assert.strictEqual(orders[1].units, 5);
  assert.strictEqual(orders[1].totalCents, 39900);
});

test('the next order number follows the highest one stored', function () {
  var page = openPage(makeShop([order(7), order(3)]));
  page.Cart.add('mouse');
  assert.strictEqual(page.Orders.checkout().order.number, 8);
  assert.deepStrictEqual(orderNumbers(page), [7, 3, 8]);
});

test('invalid stored orders are dropped, with the original kept as a backup', function () {
  var line = order(1).lines[0];
  var records = [
    order(1),
    order(1),
    order(0),
    order(2.5),
    order('3'),
    order(4, { placedAt: 'yesterday' }),
    order(5, { lines: [] }),
    order(6, { lines: 'none' }),
    order(7, { lines: [line, Object.assign({}, line, { quantity: 0 })] }),
    order(8, { lines: [Object.assign({}, line, { priceCents: -1 })] }),
    order(9, { lines: [Object.assign({}, line, { priceCents: 1.5 })] }),
    order(9, { lines: [Object.assign({}, line, { quantity: 1e300 })] }),
    order(9, { lines: [Object.assign({}, line, { name: null })] }),
    order(9, { lines: [Object.assign({}, line, { sku: 7 })] }),
    order(9, { lines: [Object.assign({}, line, { productId: undefined })] }),
    order(9, { lines: [null] }),
    'junk',
    null,
    order(2, { extra: 'dropped', lines: [Object.assign({ extra: 'dropped' }, line)] })
  ];
  var raw = JSON.stringify(records);
  var storage = makeShop(raw);
  var page = openPage(storage);

  assert.deepStrictEqual(plain(page.Orders.init()), { recovered: true });
  assert.deepStrictEqual(orderNumbers(page), [1, 2]);
  assert.strictEqual(storage.data[ORDERS_BACKUP_KEY], raw);
  assert.deepStrictEqual(storedOrders(storage), [order(1), order(2)]);
});

test('an order history that cannot be read is set aside, not overwritten', function () {
  ['{not json', '{"a":1}', 'null'].forEach(function (raw) {
    var storage = makeShop(raw);
    var page = openPage(storage);
    assert.deepStrictEqual(plain(page.Orders.init()), { recovered: true });
    assert.deepStrictEqual(orderNumbers(page), []);
    assert.strictEqual(storage.data[ORDERS_BACKUP_KEY], raw);

    page.Cart.add('mouse');
    assert.strictEqual(page.Orders.checkout().order.number, 1);
    assert.strictEqual(storage.data[ORDERS_BACKUP_KEY], raw);
  });
});

test('a damaged order history is left in place when it cannot be backed up', function () {
  var raw = JSON.stringify([order(1), 'junk']);
  var storage = makeShop(raw);
  var page = openPage(storage);
  storage.failWrites = true;
  assert.deepStrictEqual(plain(page.Orders.init()), { recovered: true });
  assert.deepStrictEqual(orderNumbers(page), [1]);
  assert.strictEqual(storage.data[ORDERS_KEY], raw);
  assert.strictEqual(storage.data[ORDERS_BACKUP_KEY], undefined);
});

// --- Storage problems ---

test('a checkout whose order cannot be saved changes nothing', function () {
  var storage = makeShop([order(1)]);
  var page = openPage(storage);
  page.Cart.add('mouse', 2);
  var calls = 0;
  [page.Orders, page.Inventory, page.Cart].forEach(function (api) {
    api.subscribe(function () { calls++; });
  });

  var before = plain(storage.data);
  var restore = failWritesTo(storage, ORDERS_KEY);
  assert.deepStrictEqual(plain(page.Orders.checkout()), STORAGE_FAILURE);
  assert.deepStrictEqual(plain(storage.data), before);
  assert.deepStrictEqual(orderNumbers(page), [1]);
  assert.strictEqual(calls, 0);

  restore();
  assert.strictEqual(page.Orders.checkout().order.number, 2);
});

test('a checkout whose stock change cannot be saved takes the order back', function () {
  var storage = makeShop([order(1)]);
  var page = openPage(storage);
  page.Cart.add('mouse', 2);
  var calls = 0;
  page.Orders.subscribe(function () { calls++; });

  var before = plain(storage.data);
  var restore = failWritesTo(storage, PRODUCTS_KEY);
  assert.deepStrictEqual(plain(page.Orders.checkout()), STORAGE_FAILURE);
  assert.deepStrictEqual(plain(storage.data), before);
  assert.deepStrictEqual(orderNumbers(page), [1]);
  assert.deepStrictEqual(cartContents(page), [['mouse', 2]]);
  assert.strictEqual(calls, 0);

  restore();
  assert.strictEqual(page.Orders.checkout().order.number, 2);
  assert.strictEqual(page.Inventory.getProduct('mouse').quantity, 33);
});

test('a checkout takes the order back when another tab has just taken the stock', function () {
  var storage = makeShop();
  var page = openPage(storage);
  var other = openPage(storage);
  page.Cart.add('desk', 3);

  // The other tab's change lands after the cart was checked.
  var removeStock = page.Inventory.removeStock;
  page.Inventory.removeStock = function (items) {
    other.Inventory.updateProduct('desk', { quantity: 2 });
    return removeStock(items);
  };

  assert.deepStrictEqual(plain(page.Orders.checkout()),
    { ok: false, errors: { stock: 'Cannot remove 3 of Standing Desk; only 2 in stock.' } });
  assert.deepStrictEqual(storedOrders(storage), []);
  assert.deepStrictEqual(stock(page), { mouse: 35, desk: 2, cable: 8 });
  assert.deepStrictEqual(cartContents(page), [['desk', 3]]);
});

test('a checkout that cannot empty the cart is still complete, and says so', function () {
  var storage = makeShop();
  var page = openPage(storage);
  page.Cart.add('mouse', 2);

  failWritesTo(storage, CART_KEY);
  var result = page.Orders.checkout();
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.cartCleared, false);
  assert.deepStrictEqual(orderNumbers(page), [1]);
  assert.strictEqual(page.Inventory.getProduct('mouse').quantity, 33);
  assert.deepStrictEqual(cartContents(page), [['mouse', 2]]);
});

test('with storage unavailable checkout and the history work in memory', function () {
  var storage = makeStorage();
  storage.disabled = true;
  var page = openPage(storage);
  var first = page.Inventory.getProducts()[0];
  page.Cart.add(first.id, 2);

  var result = page.Orders.checkout();
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.cartCleared, true);
  assert.strictEqual(page.Inventory.getProduct(first.id).quantity, first.quantity - 2);
  assert.strictEqual(page.Cart.getCart().lines.length, 0);
  assert.deepStrictEqual(orderNumbers(page), [1]);
  assert.strictEqual(page.Orders.getOrders()[0].totalCents, first.priceCents * 2);
});

// --- Subscribers and other tabs ---

test('subscribers are told about each order once, when it is complete', function () {
  var page = openPage(makeShop());
  var seen = [];
  var unsubscribe = page.Orders.subscribe(function () {
    seen.push({
      orders: page.Orders.getOrders().length,
      inStock: page.Inventory.getProduct('mouse').quantity,
      inCart: page.Cart.getCart().units
    });
  });

  page.Orders.checkout();
  assert.deepStrictEqual(seen, []);

  page.Cart.add('mouse', 2);
  page.Orders.checkout();
  assert.deepStrictEqual(seen, [{ orders: 1, inStock: 33, inCart: 0 }]);

  unsubscribe();
  page.Cart.add('mouse');
  page.Orders.checkout();
  assert.strictEqual(seen.length, 1);
});

test('checkout tells the subscribers of the inventory and of the cart once each', function () {
  var page = openPage(makeShop());
  page.Cart.add('mouse', 2);
  page.Cart.add('desk', 1);
  var calls = { inventory: 0, cart: 0 };
  page.Inventory.subscribe(function () { calls.inventory++; });
  page.Cart.subscribe(function () { calls.cart++; });

  page.Orders.checkout();
  assert.deepStrictEqual(calls, { inventory: 1, cart: 1 });
});

test('subscribers are told about orders placed in another tab', function () {
  var storage = makeShop();
  var first = openPage(storage);
  var second = openPage(storage);
  var calls = 0;
  second.Orders.subscribe(function () { calls++; });

  first.Cart.add('mouse');
  first.Orders.checkout();
  second.fireStorageEvent(ORDERS_KEY);
  assert.strictEqual(calls, 1);
  assert.deepStrictEqual(orderNumbers(second), [1]);

  second.fireStorageEvent(PRODUCTS_KEY);
  second.fireStorageEvent(CART_KEY);
  assert.strictEqual(calls, 1);

  // A null key means the whole storage area was cleared.
  second.fireStorageEvent(null);
  assert.strictEqual(calls, 2);
});

test('a tab never overwrites orders placed in another tab', function () {
  var storage = makeShop();
  var first = openPage(storage);
  var second = openPage(storage);
  first.Orders.getOrders();
  second.Orders.getOrders();

  first.Cart.add('mouse', 2);
  assert.strictEqual(first.Orders.checkout().order.number, 1);
  // The cart is shared, so the other tab has nothing left to buy.
  assert.deepStrictEqual(plain(second.Orders.checkout().errors), { cart: 'The cart is empty.' });

  second.Cart.add('desk');
  assert.strictEqual(second.Orders.checkout().order.number, 2);
  first.Cart.add('cable');
  assert.strictEqual(first.Orders.checkout().order.number, 3);

  assert.deepStrictEqual(orderNumbers(first), [1, 2, 3]);
  assert.deepStrictEqual(orderNumbers(second), [1, 2, 3]);
  assert.deepStrictEqual(stock(second), { mouse: 33, desk: 2, cable: 7 });
});

test('an order history cleared from storage while the page is open is empty', function () {
  var storage = makeShop();
  var page = openPage(storage);
  page.Cart.add('mouse');
  page.Orders.checkout();
  delete storage.data[ORDERS_KEY];
  assert.deepStrictEqual(orderNumbers(page), []);
});

harness.run();
