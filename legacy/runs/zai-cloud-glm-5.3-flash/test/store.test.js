/* Checks for the inventory data layer. Run by hand: node test/store.test.js
 *
 * Each loadStore() call runs js/store.js in a fresh sandbox, standing in for
 * a page load, against a shared fake localStorage.
 */
"use strict";

var assert = require("assert");
var fs = require("fs");
var path = require("path");
var vm = require("vm");

var STORE_PATH = path.join(__dirname, "..", "js", "store.js");
var STORAGE_KEY = "inventory.data.v1";
var SAMPLE_COUNT = 10;

function fakeStorage() {
  var data = {};
  return {
    setItem: function (key, value) {
      data[key] = String(value);
    },
    getItem: function (key) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
    },
    removeItem: function (key) {
      delete data[key];
    }
  };
}

/* A localStorage whose every method throws, like a blocked/quotad store. */
function blockedStorage() {
  function reject() {
    throw new Error("storage blocked");
  }
  return { setItem: reject, getItem: reject, removeItem: reject };
}

function loadStore(storage) {
  var sandbox = { window: { localStorage: storage } };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(STORE_PATH, "utf8"), sandbox, {
    filename: STORE_PATH
  });
  return sandbox.window.InventoryStore;
}

var failures = 0;
function test(name, fn) {
  try {
    fn();
    console.log("ok - " + name);
  } catch (err) {
    failures += 1;
    console.log("FAIL - " + name);
    console.log(String((err && err.stack) || err));
  }
}

/* ---- seeding and persistence -----------------------------------------*/

test("first run seeds the sample catalogue and saves it", function () {
  var storage = fakeStorage();
  var store = loadStore(storage);

  assert.strictEqual(store.isAvailable(), true);
  var products = store.getProducts();
  assert.strictEqual(products.length, SAMPLE_COUNT);
  assert.strictEqual(products[0].name, "Wireless Mouse");
  assert.strictEqual(typeof products[0].quantity, "number");
  assert.ok(products[0].id, "seeded products have ids");

  var raw = JSON.parse(storage.getItem(STORAGE_KEY));
  assert.strictEqual(raw.version, 1);
  assert.strictEqual(raw.products.length, SAMPLE_COUNT);
});

test("changes persist across page loads", function () {
  var storage = fakeStorage();
  var first = loadStore(storage);
  var added = first.addProduct({ name: "Test Item", sku: "TST-001", quantity: 3 });
  assert.strictEqual(added.ok, true);

  var second = loadStore(storage);
  var found = second.getProduct(added.product.id);
  assert.ok(found, "added product survives a reload");
  assert.strictEqual(found.name, "Test Item");
  assert.strictEqual(found.quantity, 3);
  assert.strictEqual(second.getProducts().length, SAMPLE_COUNT + 1);
});

test("getProducts returns copies, not live state", function () {
  var store = loadStore(fakeStorage());
  var products = store.getProducts();
  products[0].quantity = 9999;
  assert.notStrictEqual(store.getProducts()[0].quantity, 9999);
});

/* ---- validation --------------------------------------------------------*/

test("addProduct rejects a blank name", function () {
  var store = loadStore(fakeStorage());
  var result = store.addProduct({ name: "   " });
  assert.strictEqual(result.ok, false);
  assert.ok(result.errors.name);
});

test("addProduct rejects duplicate SKUs, case-insensitively", function () {
  var store = loadStore(fakeStorage());
  var clash = store.addProduct({ name: "Clone", sku: "elc-wm-001" });
  assert.strictEqual(clash.ok, false);
  assert.ok(clash.errors.sku);
  assert.strictEqual(store.getProducts().length, SAMPLE_COUNT);
});

test("addProduct rejects negative or fractional stock", function () {
  var store = loadStore(fakeStorage());
  assert.ok(store.addProduct({ name: "A", quantity: -1 }).errors.quantity);
  assert.ok(store.addProduct({ name: "B", quantity: 2.5 }).errors.quantity);
  assert.ok(store.addProduct({ name: "C", quantity: "many" }).errors.quantity);
});

test("addProduct accepts blank stock and price as zero", function () {
  var store = loadStore(fakeStorage());
  var result = store.addProduct({ name: "Mystery Box" });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.product.quantity, 0);
  assert.strictEqual(result.product.unitPrice, 0);
  assert.strictEqual(result.product.category, "Uncategorized");
});

/* ---- updates ------------------------------------------------------------*/

test("updateProduct edits fields and refreshes updatedAt", function () {
  var store = loadStore(fakeStorage());
  var original = store.getProducts()[0];
  var result = store.updateProduct(original.id, { quantity: original.quantity + 5 });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.product.quantity, original.quantity + 5);
  assert.ok(Date.parse(result.product.updatedAt) >= Date.parse(original.createdAt));
});

test("updateProduct ignores its own SKU in duplicate checks", function () {
  var store = loadStore(fakeStorage());
  var product = store.getProducts()[0];
  var result = store.updateProduct(product.id, { quantity: 1, sku: product.sku });
  assert.strictEqual(result.ok, true);
});

test("updateProduct rejects invalid input and changes nothing", function () {
  var storage = fakeStorage();
  var store = loadStore(storage);
  var product = store.getProducts()[0];
  var before = storage.getItem(STORAGE_KEY);
  var result = store.updateProduct(product.id, { name: "", quantity: -3 });
  assert.strictEqual(result.ok, false);
  assert.ok(result.errors.name && result.errors.quantity);
  assert.strictEqual(storage.getItem(STORAGE_KEY), before);
});

test("updateProduct and deleteProduct reject unknown ids", function () {
  var store = loadStore(fakeStorage());
  assert.strictEqual(store.updateProduct("nope", { name: "X" }).ok, false);
  assert.strictEqual(store.deleteProduct("nope").ok, false);
  assert.strictEqual(store.getProduct("nope"), null);
});

test("deleteProduct removes the product", function () {
  var storage = fakeStorage();
  var store = loadStore(storage);
  var product = store.getProducts()[3];
  var result = store.deleteProduct(product.id);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.product.id, product.id);
  assert.strictEqual(store.getProducts().length, SAMPLE_COUNT - 1);
  assert.strictEqual(JSON.parse(storage.getItem(STORAGE_KEY)).products.length, SAMPLE_COUNT - 1);
});

test("adjustStock applies deltas and clamps at zero", function () {
  var store = loadStore(fakeStorage());
  var product = store.getProducts()[0];

  var up = store.adjustStock(product.id, 8);
  assert.strictEqual(up.ok, true);
  assert.strictEqual(up.product.quantity, product.quantity + 8);

  var down = store.adjustStock(product.id, -1000);
  assert.strictEqual(down.ok, true);
  assert.strictEqual(down.product.quantity, 0);

  assert.strictEqual(store.adjustStock(product.id, "lots").ok, false);
});

/* ---- lookup --------------------------------------------------------------*/

test("searchProducts with a blank query returns everything", function () {
  var store = loadStore(fakeStorage());
  assert.strictEqual(store.searchProducts("").length, SAMPLE_COUNT);
  assert.strictEqual(store.searchProducts("   ").length, SAMPLE_COUNT);
});

test("searchProducts matches name, SKU and category, case-insensitively", function () {
  var store = loadStore(fakeStorage());
  assert.strictEqual(store.searchProducts("wireless").length, 1);
  assert.strictEqual(store.searchProducts("WIRELESS").length, 1);
  assert.strictEqual(store.searchProducts("elc-cb-201").length, 1, "by SKU");
  assert.strictEqual(store.searchProducts("elc").length, 4, "SKU prefix");
  assert.strictEqual(store.searchProducts("stationery").length, 3, "by category");
});

test("searchProducts requires every whitespace-separated term", function () {
  var store = loadStore(fakeStorage());
  assert.strictEqual(store.searchProducts("  desk   lamp  ").length, 1);
  assert.strictEqual(store.searchProducts("usb cable").length, 1);
  assert.strictEqual(store.searchProducts("usb lamp").length, 0);
});

test("searchProducts narrows by category", function () {
  var store = loadStore(fakeStorage());
  assert.strictEqual(store.searchProducts("", { category: "Furniture" }).length, 3);
  assert.strictEqual(store.searchProducts("", { category: "furniture" }).length, 3);
  assert.strictEqual(store.searchProducts("mouse", { category: "Furniture" }).length, 0);
  assert.strictEqual(store.searchProducts("desk", { category: "Furniture" }).length, 2);
});

test("searchProducts returns copies, not live state", function () {
  var store = loadStore(fakeStorage());
  var results = store.searchProducts("wireless");
  results[0].quantity = 9999;
  assert.notStrictEqual(store.getProducts()[0].quantity, 9999);
});

/* ---- recovery and degraded mode -----------------------------------------*/

test("corrupt stored data is replaced with a fresh seed", function () {
  var storage = fakeStorage();
  storage.setItem(STORAGE_KEY, "{not json at all");
  var store = loadStore(storage);
  assert.strictEqual(store.getProducts().length, SAMPLE_COUNT);
  assert.strictEqual(JSON.parse(storage.getItem(STORAGE_KEY)).products.length, SAMPLE_COUNT);
});

test("unavailable storage falls back to an in-memory store", function () {
  var store = loadStore(blockedStorage());
  assert.strictEqual(store.isAvailable(), false);
  assert.strictEqual(store.getProducts().length, SAMPLE_COUNT);

  var added = store.addProduct({ name: "Session Only", quantity: 1 });
  assert.strictEqual(added.ok, true);
  assert.strictEqual(store.getProducts().length, SAMPLE_COUNT + 1);
});

test("resetToSamples restores the sample catalogue", function () {
  var storage = fakeStorage();
  var store = loadStore(storage);
  store.deleteProduct(store.getProducts()[0].id);
  var products = store.resetToSamples();
  assert.strictEqual(products.length, SAMPLE_COUNT);
  assert.strictEqual(JSON.parse(storage.getItem(STORAGE_KEY)).products.length, SAMPLE_COUNT);
});

/* ---- cart ----------------------------------------------------------------*/

var CART_KEY = "inventory.cart.v1";

test("addToCart adds a product and persists the cart", function () {
  var storage = fakeStorage();
  var store = loadStore(storage);
  var id = store.getProducts()[0].id;
  var result = store.addToCart(id, 2);

  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.clamped, false);
  assert.strictEqual(result.item.name, "Wireless Mouse");
  assert.strictEqual(result.item.quantity, 2);
  assert.strictEqual(result.item.unitPrice, 24.99);
  assert.strictEqual(result.item.lineTotal, 49.98);

  assert.deepStrictEqual(JSON.parse(storage.getItem(CART_KEY)), {
    version: 1,
    items: [{ id: id, quantity: 2 }]
  });

  var reloaded = loadStore(storage);
  var cart = reloaded.getCart();
  assert.strictEqual(cart.length, 1);
  assert.strictEqual(cart[0].id, id);
  assert.strictEqual(cart[0].quantity, 2);
});

test("addToCart stacks repeated adds", function () {
  var store = loadStore(fakeStorage());
  var id = store.getProducts()[0].id;
  store.addToCart(id);
  store.addToCart(id, 1);
  assert.strictEqual(store.getCart()[0].quantity, 2);
  assert.strictEqual(store.cartTotals().items, 1, "one line, not two");
});

test("addToCart clamps at the stock on hand and reports it", function () {
  var store = loadStore(fakeStorage());
  var id = store.getProducts()[0].id; // 42 in stock
  var first = store.addToCart(id, 50);
  assert.strictEqual(first.ok, true);
  assert.strictEqual(first.clamped, true);
  assert.strictEqual(first.item.quantity, 42);

  var second = store.addToCart(id, 5);
  assert.strictEqual(second.clamped, true);
  assert.strictEqual(second.item.quantity, 42);
});

test("addToCart rejects unknown products and bad quantities", function () {
  var store = loadStore(fakeStorage());
  var id = store.getProducts()[0].id;
  assert.ok(store.addToCart("nope", 1).errors.id);
  assert.ok(store.addToCart(id, 0).errors.quantity);
  assert.ok(store.addToCart(id, -2).errors.quantity);
  assert.ok(store.addToCart(id, 1.5).errors.quantity);
  assert.ok(store.addToCart(id, "two").errors.quantity);
  assert.strictEqual(store.getCart().length, 0);
});

test("out-of-stock products cannot be added", function () {
  var store = loadStore(fakeStorage());
  var id = store.getProducts()[6].id; // seeded with 0 on hand
  var result = store.addToCart(id, 1);
  assert.strictEqual(result.ok, false);
  assert.ok(/out of stock/.test(result.errors.quantity));
  assert.strictEqual(store.getCart().length, 0);
});

test("setCartQuantity sets an exact amount and clamps past the stock", function () {
  var store = loadStore(fakeStorage());
  var id = store.getProducts()[0].id; // 42 in stock
  store.addToCart(id, 1);

  var set = store.setCartQuantity(id, 5);
  assert.strictEqual(set.ok, true);
  assert.strictEqual(set.removed, false);
  assert.strictEqual(set.clamped, false);
  assert.strictEqual(set.item.quantity, 5);

  var clamped = store.setCartQuantity(id, 100);
  assert.strictEqual(clamped.clamped, true);
  assert.strictEqual(clamped.item.quantity, 42);
});

test("setCartQuantity removes at zero and rejects bad input", function () {
  var store = loadStore(fakeStorage());
  var id = store.getProducts()[0].id;
  store.addToCart(id, 3);

  var removed = store.setCartQuantity(id, 0);
  assert.strictEqual(removed.ok, true);
  assert.strictEqual(removed.removed, true);
  assert.strictEqual(store.getCart().length, 0);

  store.addToCart(id, 3);
  assert.ok(store.setCartQuantity(id, -1).errors.quantity);
  assert.ok(store.setCartQuantity(id, 2.5).errors.quantity);
  assert.ok(store.setCartQuantity(id, "").errors.quantity);
  assert.strictEqual(store.getCart()[0].quantity, 3, "failed sets change nothing");
});

test("removeFromCart and clearCart empty the cart", function () {
  var storage = fakeStorage();
  var store = loadStore(storage);
  var first = store.getProducts()[0].id;
  var second = store.getProducts()[1].id;
  store.addToCart(first, 1);
  store.addToCart(second, 1);

  assert.strictEqual(store.removeFromCart(first).ok, true);
  assert.strictEqual(store.getCart().length, 1);
  assert.strictEqual(store.getCart()[0].id, second);
  assert.strictEqual(store.removeFromCart(first).ok, false, "already gone");

  assert.strictEqual(store.clearCart().ok, true);
  assert.strictEqual(store.getCart().length, 0);
  assert.deepStrictEqual(JSON.parse(storage.getItem(CART_KEY)).items, []);
});

test("cartTotals adds up across lines", function () {
  var store = loadStore(fakeStorage());
  store.addToCart(store.getProducts()[0].id, 2); // 2 × 24.99
  store.addToCart(store.getProducts()[2].id, 1); // 1 × 9.99
  var totals = store.cartTotals();
  assert.strictEqual(totals.items, 2);
  assert.strictEqual(totals.units, 3);
  assert.strictEqual(totals.total, 59.97);
});

test("cart entries are priced live and clamped to edited stock", function () {
  var storage = fakeStorage();
  var store = loadStore(storage);
  var monitor = store.getProducts()[3].id; // 7 in stock
  var chair = store.getProducts()[5].id;   // 3 in stock
  store.addToCart(monitor, 6);
  store.addToCart(chair, 3);

  store.deleteProduct(monitor);
  store.updateProduct(chair, { quantity: 1 });

  var cart = store.getCart();
  assert.strictEqual(cart.length, 1, "the deleted monitor fell out");
  assert.strictEqual(cart[0].id, chair);
  assert.strictEqual(cart[0].quantity, 1, "clamped to the new stock");
  assert.strictEqual(JSON.parse(storage.getItem(CART_KEY)).items.length, 1,
    "the tidied cart is persisted");
});

test("cart lines reprice when a product's price changes", function () {
  var store = loadStore(fakeStorage());
  var id = store.getProducts()[0].id;
  store.addToCart(id, 2);
  store.updateProduct(id, { unitPrice: 30 });
  assert.strictEqual(store.getCart()[0].unitPrice, 30);
  assert.strictEqual(store.getCart()[0].lineTotal, 60);
});

test("a corrupt cart record is discarded, not fatal", function () {
  var storage = fakeStorage();
  storage.setItem(CART_KEY, "{not json");
  var store = loadStore(storage);
  assert.strictEqual(store.getCart().length, 0);

  var id = store.getProducts()[0].id;
  assert.strictEqual(store.addToCart(id, 1).ok, true);
  assert.strictEqual(store.getCart().length, 1);
});

test("the cart falls back to memory when storage is blocked", function () {
  var store = loadStore(blockedStorage());
  assert.strictEqual(store.isAvailable(), false);
  var id = store.getProducts()[0].id;
  assert.strictEqual(store.addToCart(id, 2).ok, true);
  assert.strictEqual(store.cartTotals().units, 2);
  assert.strictEqual(store.cartTotals().total, 49.98);
});

test("resetToSamples leaves the cart alone", function () {
  var store = loadStore(fakeStorage());
  var id = store.getProducts()[0].id;
  store.addToCart(id, 2);
  store.resetToSamples();
  var cart = store.getCart();
  assert.strictEqual(cart.length, 1);
  assert.strictEqual(cart[0].id, id);
  assert.strictEqual(cart[0].quantity, 2);
});

/* ---- checkout and order history -------------------------------------------*/

var ORDERS_KEY = "inventory.orders.v1";

test("checkout refuses an empty cart and changes nothing", function () {
  var storage = fakeStorage();
  var store = loadStore(storage);
  var result = store.checkout();
  assert.strictEqual(result.ok, false);
  assert.ok(result.errors.cart);
  assert.strictEqual(store.getProducts().length, SAMPLE_COUNT);
  assert.strictEqual(storage.getItem(ORDERS_KEY), null, "no order recorded");
});

test("checkout reduces stock, empties the cart and records the order", function () {
  var storage = fakeStorage();
  var store = loadStore(storage);
  var mouse = store.getProducts()[0].id; // 42 in stock at $24.99
  var cable = store.getProducts()[2].id; // 120 in stock at $9.99
  store.addToCart(mouse, 2);
  store.addToCart(cable, 1);

  var result = store.checkout();
  assert.strictEqual(result.ok, true);
  assert.ok(result.order.id, "the order has an id");
  assert.strictEqual(result.order.number, 1001);
  assert.ok(Date.parse(result.order.placedAt) > 0, "the order is timestamped");
  assert.strictEqual(result.order.units, 3);
  assert.strictEqual(result.order.total, 59.97);
  assert.strictEqual(result.order.items.length, 2);

  assert.strictEqual(store.getProduct(mouse).quantity, 40);
  assert.strictEqual(store.getProduct(cable).quantity, 119);
  assert.strictEqual(store.getCart().length, 0);
  assert.deepStrictEqual(JSON.parse(storage.getItem(CART_KEY)).items, []);

  var stored = JSON.parse(storage.getItem(ORDERS_KEY));
  assert.strictEqual(stored.version, 1);
  assert.strictEqual(stored.orders.length, 1);
  assert.strictEqual(stored.orders[0].number, 1001);
  assert.deepStrictEqual(stored.orders[0].items, [
    { id: mouse, name: "Wireless Mouse", sku: "ELC-WM-001", category: "Electronics",
      unitPrice: 24.99, quantity: 2, lineTotal: 49.98 },
    { id: cable, name: "USB-C Cable (2 m)", sku: "ELC-CB-201", category: "Electronics",
      unitPrice: 9.99, quantity: 1, lineTotal: 9.99 }
  ]);
});

test("order history persists across page loads and hands out copies", function () {
  var storage = fakeStorage();
  var store = loadStore(storage);
  store.addToCart(store.getProducts()[0].id, 1);
  store.checkout();

  var reloaded = loadStore(storage);
  var orders = reloaded.getOrders();
  assert.strictEqual(orders.length, 1);
  assert.strictEqual(orders[0].number, 1001);
  assert.strictEqual(orders[0].units, 1);
  assert.strictEqual(orders[0].total, 24.99);

  orders[0].number = 9999;
  orders[0].items[0].quantity = 9999;
  assert.strictEqual(reloaded.getOrders()[0].number, 1001, "copies, not live state");
  assert.strictEqual(reloaded.getOrders()[0].items[0].quantity, 1);
});

test("order numbers count up and history is stored chronologically", function () {
  var store = loadStore(fakeStorage());
  store.addToCart(store.getProducts()[0].id, 1);
  assert.strictEqual(store.checkout().order.number, 1001);
  store.addToCart(store.getProducts()[1].id, 1);
  assert.strictEqual(store.checkout().order.number, 1002);
  /* Array.from copies across the sandbox realm so deepStrictEqual can compare. */
  assert.deepStrictEqual(Array.from(store.getOrders().map(function (order) {
    return order.number;
  })), [1001, 1002]);
});

test("order lines are snapshotted at purchase time", function () {
  var storage = fakeStorage();
  var store = loadStore(storage);
  var mouse = store.getProducts()[0].id;
  store.addToCart(mouse, 2);
  store.checkout();

  store.updateProduct(mouse, { name: "Renamed Mouse", unitPrice: 99, quantity: 0 });
  store.deleteProduct(store.getProducts()[1].id); // an unrelated deletion

  var line = loadStore(storage).getOrders()[0].items[0];
  assert.strictEqual(line.name, "Wireless Mouse", "the name is frozen at purchase");
  assert.strictEqual(line.unitPrice, 24.99);
  assert.strictEqual(line.quantity, 2);
  assert.strictEqual(line.lineTotal, 49.98);
});

test("a corrupt order record starts over empty", function () {
  var storage = fakeStorage();
  storage.setItem(ORDERS_KEY, "{not json");
  var store = loadStore(storage);
  assert.strictEqual(store.getOrders().length, 0);

  store.addToCart(store.getProducts()[0].id, 1);
  assert.strictEqual(store.checkout().order.number, 1001, "numbering starts fresh");
});

test("orders fall back to memory when storage is blocked", function () {
  var store = loadStore(blockedStorage());
  assert.strictEqual(store.isAvailable(), false);
  store.addToCart(store.getProducts()[0].id, 2);
  assert.strictEqual(store.checkout().ok, true);
  assert.strictEqual(store.getOrders().length, 1);
  assert.strictEqual(store.getOrders()[0].total, 49.98);
});

test("clearOrders empties the history and restarts the numbering", function () {
  var storage = fakeStorage();
  var store = loadStore(storage);
  store.addToCart(store.getProducts()[0].id, 1);
  store.checkout();
  assert.strictEqual(store.clearOrders().ok, true);
  assert.strictEqual(store.getOrders().length, 0);
  assert.deepStrictEqual(JSON.parse(storage.getItem(ORDERS_KEY)).orders, []);

  store.addToCart(store.getProducts()[0].id, 1);
  assert.strictEqual(store.checkout().order.number, 1001);
});

test("resetToSamples leaves the order history alone", function () {
  var store = loadStore(fakeStorage());
  store.addToCart(store.getProducts()[0].id, 1);
  store.checkout();
  store.resetToSamples();
  assert.strictEqual(store.getOrders().length, 1);
});

if (failures > 0) {
  console.log(failures + " test(s) failed");
  process.exit(1);
}
console.log("All tests passed.");
