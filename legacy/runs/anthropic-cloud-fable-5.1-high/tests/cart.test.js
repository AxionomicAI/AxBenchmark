// Tests for the cart (js/cart.js) on top of the data layer.
// Run with: node tests/cart.test.js
// The scripts are loaded unmodified into a fake browser global with an
// in-memory localStorage.
'use strict';

var assert = require('assert');
var harness = require('./harness');

var test = harness.test;
var makeStorage = harness.makeStorage;

var PRODUCTS_KEY = 'inventory.products';
var CART_KEY = 'inventory.cart';

var SCRIPTS = harness.loadScripts(['storage.js', 'sample-data.js', 'inventory.js', 'cart.js']);

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
// no cables at $8.50. cartLines, if given, is what the cart already holds.
function makeShop(cartLines) {
  var initial = {};
  initial[PRODUCTS_KEY] = JSON.stringify([
    product(),
    product({ id: 'desk', name: 'Standing Desk', sku: 'FUR-DSK-160', quantity: 3, priceCents: 39900 }),
    product({ id: 'cable', name: 'USB-C Cable', sku: 'ELC-CBL-100', quantity: 0, priceCents: 850 })
  ]);
  if (cartLines !== undefined) {
    initial[CART_KEY] = typeof cartLines === 'string' ? cartLines : JSON.stringify(cartLines);
  }
  return makeStorage(initial);
}

function openPage(storage) {
  return harness.openPage(SCRIPTS, storage);
}

function stored(storage) {
  return JSON.parse(storage.data[CART_KEY]);
}

// Objects made inside the vm have another realm's prototypes, which
// deepStrictEqual treats as different; compare plain copies instead.
function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

// The cart as [product id, quantity] pairs.
function contents(page) {
  return plain(page.Cart.getCart().lines.map(function (line) {
    return [line.product.id, line.quantity];
  }));
}

// --- Reading ---

test('the cart starts empty', function () {
  var storage = makeShop();
  var page = openPage(storage);
  assert.deepStrictEqual(plain(page.Cart.getCart()), { lines: [], units: 0, totalCents: 0 });
  assert.strictEqual(page.Cart.quantityOf('mouse'), 0);
  assert.strictEqual(storage.data[CART_KEY], undefined);
});

test('getCart gives each line its product and subtotal, and adds them up', function () {
  var page = openPage(makeShop());
  page.Cart.add('mouse', 3);
  page.Cart.add('desk', 2);

  var cart = page.Cart.getCart();
  assert.strictEqual(cart.lines.length, 2);
  assert.deepStrictEqual(plain(cart.lines[0].product), plain(page.Inventory.getProduct('mouse')));
  assert.strictEqual(cart.lines[0].quantity, 3);
  assert.strictEqual(cart.lines[0].subtotalCents, 5997);
  assert.strictEqual(cart.lines[1].product.id, 'desk');
  assert.strictEqual(cart.lines[1].subtotalCents, 79800);
  assert.strictEqual(cart.units, 5);
  assert.strictEqual(cart.totalCents, 85797);
});

test('the cart follows changes to its products', function () {
  var page = openPage(makeShop());
  page.Cart.add('mouse', 2);
  page.Inventory.updateProduct('mouse', { name: 'Mouse', priceCents: 1500 });

  var cart = page.Cart.getCart();
  assert.strictEqual(cart.lines[0].product.name, 'Mouse');
  assert.strictEqual(cart.lines[0].subtotalCents, 3000);
  assert.strictEqual(cart.totalCents, 3000);
});

test('returned lines are copies; changing them does not change the cart', function () {
  var page = openPage(makeShop());
  page.Cart.add('mouse', 2).line.quantity = 30;
  page.Cart.getCart().lines[0].quantity = 30;
  assert.deepStrictEqual(contents(page), [['mouse', 2]]);
});

// --- Adding ---

test('add puts one unit in the cart unless told how many', function () {
  var storage = makeShop();
  var page = openPage(storage);
  var result = page.Cart.add('mouse');
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.line.product.id, 'mouse');
  assert.strictEqual(result.line.quantity, 1);
  assert.strictEqual(result.line.subtotalCents, 1999);
  assert.deepStrictEqual(stored(storage), [{ productId: 'mouse', quantity: 1 }]);

  assert.strictEqual(page.Cart.add('desk', 3).line.quantity, 3);
  assert.strictEqual(page.Cart.quantityOf('desk'), 3);
});

test('adding a product that is already in the cart raises its quantity', function () {
  var page = openPage(makeShop());
  page.Cart.add('mouse', 2);
  page.Cart.add('desk');
  var result = page.Cart.add('mouse', 3);
  assert.strictEqual(result.line.quantity, 5);
  assert.strictEqual(result.line.subtotalCents, 9995);
  assert.deepStrictEqual(contents(page), [['mouse', 5], ['desk', 1]]);
});

test('add refuses more than is in stock', function () {
  var page = openPage(makeShop());
  assert.deepStrictEqual(plain(page.Cart.add('desk', 4)),
    { ok: false, errors: { quantity: 'Only 3 in stock.' } });
  assert.deepStrictEqual(plain(page.Cart.add('cable')),
    { ok: false, errors: { quantity: 'This product is out of stock.' } });
  assert.deepStrictEqual(contents(page), []);

  assert.strictEqual(page.Cart.add('desk', 2).ok, true);
  assert.strictEqual(page.Cart.add('desk', 1).ok, true);
  assert.deepStrictEqual(plain(page.Cart.add('desk', 1)),
    { ok: false, errors: { quantity: 'Only 3 in stock, and the cart already has 3.' } });
  assert.deepStrictEqual(contents(page), [['desk', 3]]);
});

test('add rejects a bad quantity and an unknown product', function () {
  var page = openPage(makeShop());
  [0, -1, 1.5, '2', null, NaN, Infinity].forEach(function (quantity) {
    assert.deepStrictEqual(plain(page.Cart.add('mouse', quantity)),
      { ok: false, errors: { quantity: 'Quantity must be a whole number, 1 or more.' } });
  });
  assert.deepStrictEqual(plain(page.Cart.add('nothing')),
    { ok: false, errors: { id: 'Product not found.' } });
  assert.deepStrictEqual(contents(page), []);
});

// --- Changing quantities and removing ---

test('setQuantity replaces the quantity and keeps the order of the lines', function () {
  var storage = makeShop();
  var page = openPage(storage);
  page.Cart.add('mouse', 2);
  page.Cart.add('desk');

  var result = page.Cart.setQuantity('mouse', 35);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.line.quantity, 35);
  assert.strictEqual(result.line.subtotalCents, 69965);
  assert.strictEqual(page.Cart.setQuantity('mouse', 1).ok, true);
  assert.deepStrictEqual(contents(page), [['mouse', 1], ['desk', 1]]);
  assert.deepStrictEqual(stored(storage), [
    { productId: 'mouse', quantity: 1 },
    { productId: 'desk', quantity: 1 }
  ]);
});

test('setQuantity rejects bad quantities and products that are not in the cart', function () {
  var page = openPage(makeShop());
  page.Cart.add('desk', 2);
  [0, -1, 1.5, '2', null, undefined].forEach(function (quantity) {
    assert.deepStrictEqual(plain(page.Cart.setQuantity('desk', quantity)),
      { ok: false, errors: { quantity: 'Quantity must be a whole number, 1 or more.' } });
  });
  assert.deepStrictEqual(plain(page.Cart.setQuantity('desk', 4)),
    { ok: false, errors: { quantity: 'Only 3 in stock.' } });
  assert.deepStrictEqual(plain(page.Cart.setQuantity('mouse', 1)),
    { ok: false, errors: { id: 'Product is not in the cart.' } });
  assert.deepStrictEqual(contents(page), [['desk', 2]]);
});

test('a cart that holds more than the stock can be lowered but not raised', function () {
  var page = openPage(makeShop());
  page.Cart.add('mouse', 10);
  page.Inventory.updateProduct('mouse', { quantity: 4 });

  // The line is kept as it is; it is up to the user to change it.
  var line = page.Cart.getCart().lines[0];
  assert.strictEqual(line.quantity, 10);
  assert.strictEqual(line.product.quantity, 4);
  assert.strictEqual(line.subtotalCents, 19990);

  assert.deepStrictEqual(plain(page.Cart.setQuantity('mouse', 11)),
    { ok: false, errors: { quantity: 'Only 4 in stock.' } });
  assert.deepStrictEqual(plain(page.Cart.add('mouse')),
    { ok: false, errors: { quantity: 'Only 4 in stock, and the cart already has 10.' } });
  assert.strictEqual(page.Cart.setQuantity('mouse', 9).ok, true);
  assert.strictEqual(page.Cart.setQuantity('mouse', 4).ok, true);
  assert.strictEqual(page.Cart.setQuantity('mouse', 5).ok, false);

  page.Inventory.updateProduct('mouse', { quantity: 0 });
  assert.deepStrictEqual(plain(page.Cart.setQuantity('mouse', 5)),
    { ok: false, errors: { quantity: 'This product is out of stock.' } });
  assert.strictEqual(page.Cart.setQuantity('mouse', 1).ok, true);
});

test('remove takes a product out of the cart', function () {
  var storage = makeShop();
  var page = openPage(storage);
  page.Cart.add('mouse', 2);
  page.Cart.add('desk');

  var result = page.Cart.remove('mouse');
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.line.product.id, 'mouse');
  assert.strictEqual(result.line.quantity, 2);
  assert.deepStrictEqual(contents(page), [['desk', 1]]);
  assert.deepStrictEqual(stored(storage), [{ productId: 'desk', quantity: 1 }]);

  assert.deepStrictEqual(plain(page.Cart.remove('mouse')),
    { ok: false, errors: { id: 'Product is not in the cart.' } });
  assert.strictEqual(page.Cart.remove('desk').ok, true);
  assert.deepStrictEqual(plain(page.Cart.getCart()), { lines: [], units: 0, totalCents: 0 });
});

test('clear takes everything out of the cart', function () {
  var storage = makeShop();
  var page = openPage(storage);
  page.Cart.add('mouse', 2);
  page.Cart.add('desk');
  var calls = 0;
  page.Cart.subscribe(function () { calls++; });

  assert.deepStrictEqual(plain(page.Cart.clear()), { ok: true });
  assert.deepStrictEqual(plain(page.Cart.getCart()), { lines: [], units: 0, totalCents: 0 });
  assert.deepStrictEqual(stored(storage), []);
  assert.strictEqual(calls, 1);

  // Clearing an empty cart is not an error.
  assert.strictEqual(page.Cart.clear().ok, true);
  assert.strictEqual(page.Cart.add('desk').line.quantity, 1);
});

test('a deleted product leaves the cart', function () {
  var storage = makeShop();
  var page = openPage(storage);
  page.Cart.add('mouse', 2);
  page.Cart.add('desk');
  page.Inventory.removeProduct('mouse');

  assert.deepStrictEqual(contents(page), [['desk', 1]]);
  assert.strictEqual(page.Cart.getCart().totalCents, 39900);
  assert.strictEqual(page.Cart.quantityOf('mouse'), 0);
  assert.strictEqual(page.Cart.setQuantity('mouse', 1).errors.id, 'Product is not in the cart.');
  assert.strictEqual(page.Cart.remove('mouse').errors.id, 'Product is not in the cart.');

  // Its line is dropped from storage by the next change.
  page.Cart.setQuantity('desk', 2);
  assert.deepStrictEqual(stored(storage), [{ productId: 'desk', quantity: 2 }]);
});

// --- Persistence ---

test('the cart is still there when the page is opened again', function () {
  var storage = makeShop();
  var first = openPage(storage);
  first.Cart.add('mouse', 2);
  first.Cart.add('desk', 3);
  first.Cart.setQuantity('desk', 1);

  var second = openPage(storage);
  assert.deepStrictEqual(contents(second), [['mouse', 2], ['desk', 1]]);
  assert.strictEqual(second.Cart.getCart().totalCents, 43898);
});

test('stored lines that are not valid are ignored', function () {
  var page = openPage(makeShop([
    { productId: 'mouse', quantity: 2 },
    { productId: 'desk', quantity: 0 },
    { productId: 'desk', quantity: '1' },
    { productId: 'desk', quantity: 1.5 },
    { productId: 'desk', quantity: 1e300 },
    { productId: 7, quantity: 1 },
    { productId: 'mouse', quantity: 9 },
    { productId: 'gone', quantity: 1 },
    'junk',
    null,
    { productId: 'cable', quantity: 1 }
  ]));
  assert.deepStrictEqual(contents(page), [['mouse', 2], ['cable', 1]]);
});

test('a stored cart that cannot be read is an empty cart', function () {
  ['{not json', '{"a":1}', 'null'].forEach(function (raw) {
    var storage = makeShop(raw);
    var page = openPage(storage);
    assert.deepStrictEqual(contents(page), []);
    assert.strictEqual(page.Cart.add('mouse').ok, true);
    assert.deepStrictEqual(stored(storage), [{ productId: 'mouse', quantity: 1 }]);
  });
});

test('a failed save reports an error and changes nothing', function () {
  var storage = makeShop();
  var page = openPage(storage);
  page.Cart.add('mouse', 2);
  var calls = 0;
  page.Cart.subscribe(function () { calls++; });

  storage.failWrites = true;
  var expected = { ok: false, errors: { storage: 'Could not save. Browser storage may be full or disabled.' } };
  assert.deepStrictEqual(plain(page.Cart.add('desk')), expected);
  assert.deepStrictEqual(plain(page.Cart.setQuantity('mouse', 5)), expected);
  assert.deepStrictEqual(plain(page.Cart.remove('mouse')), expected);
  assert.deepStrictEqual(plain(page.Cart.clear()), expected);
  assert.strictEqual(calls, 0);
  assert.deepStrictEqual(contents(page), [['mouse', 2]]);

  storage.failWrites = false;
  assert.strictEqual(page.Cart.add('desk').ok, true);
  assert.deepStrictEqual(contents(page), [['mouse', 2], ['desk', 1]]);
});

test('with storage unavailable the cart works in memory', function () {
  var storage = makeStorage();
  storage.disabled = true;
  var page = openPage(storage);
  var id = page.Inventory.getProducts()[0].id;
  assert.strictEqual(page.Cart.add(id, 2).ok, true);
  assert.strictEqual(page.Cart.setQuantity(id, 3).ok, true);
  assert.strictEqual(page.Cart.quantityOf(id), 3);
  assert.strictEqual(page.Cart.remove(id).ok, true);
  assert.strictEqual(page.Cart.getCart().lines.length, 0);
  page.Cart.add(id);
  assert.strictEqual(page.Cart.clear().ok, true);
  assert.strictEqual(page.Cart.getCart().lines.length, 0);
});

// --- Subscribers and other tabs ---

test('subscribers are told about successful changes only', function () {
  var page = openPage(makeShop());
  var calls = 0;
  var unsubscribe = page.Cart.subscribe(function () { calls++; });

  page.Cart.add('mouse');
  page.Cart.setQuantity('mouse', 4);
  page.Cart.remove('mouse');
  assert.strictEqual(calls, 3);

  page.Cart.add('cable');
  page.Cart.setQuantity('mouse', 1);
  page.Cart.remove('mouse');
  assert.strictEqual(calls, 3);

  unsubscribe();
  page.Cart.add('mouse');
  assert.strictEqual(calls, 3);
});

test('subscribers see the change that triggered them', function () {
  var page = openPage(makeShop());
  var seen = null;
  page.Cart.subscribe(function () { seen = page.Cart.quantityOf('mouse'); });
  page.Cart.add('mouse', 2);
  assert.strictEqual(seen, 2);
});

test('subscribers are told about changes made in another tab', function () {
  var storage = makeShop();
  var first = openPage(storage);
  var second = openPage(storage);
  var calls = 0;
  second.Cart.subscribe(function () { calls++; });

  first.Cart.add('mouse');
  second.fireStorageEvent(CART_KEY);
  assert.strictEqual(calls, 1);
  assert.deepStrictEqual(contents(second), [['mouse', 1]]);

  second.fireStorageEvent(PRODUCTS_KEY);
  second.fireStorageEvent('something.else');
  assert.strictEqual(calls, 1);

  // A null key means the whole storage area was cleared.
  second.fireStorageEvent(null);
  assert.strictEqual(calls, 2);
});

test('a tab never overwrites changes made in another tab', function () {
  var storage = makeShop();
  var first = openPage(storage);
  var second = openPage(storage);
  first.Cart.getCart();
  second.Cart.getCart();

  first.Cart.add('mouse', 2);
  second.Cart.add('desk');
  second.Cart.add('mouse');
  assert.deepStrictEqual(contents(first), [['mouse', 3], ['desk', 1]]);

  first.Cart.remove('desk');
  assert.strictEqual(second.Cart.setQuantity('desk', 2).errors.id, 'Product is not in the cart.');
  assert.deepStrictEqual(contents(second), [['mouse', 3]]);
});

test('a cart cleared from storage while the page is open is empty', function () {
  var storage = makeShop();
  var page = openPage(storage);
  page.Cart.add('mouse', 2);
  delete storage.data[CART_KEY];
  assert.deepStrictEqual(contents(page), []);
});

harness.run();
