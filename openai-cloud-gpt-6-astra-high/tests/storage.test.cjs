const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const vm = require("node:vm");

const source = readFileSync(`${__dirname}/../js/storage.js`, "utf8");
const key = "inventory.items.v1";
const product = { id: "test-1", name: "Test product", sku: "TEST-1", stock: 12 };

function openInventory(data = new Map(), failures = {}) {
  const context = vm.createContext({
    window: {},
    localStorage: {
      getItem(name) {
        if (failures.read) throw new Error("Storage unavailable");
        return data.has(name) ? data.get(name) : null;
      },
      setItem(name, value) {
        if (failures.write) throw new Error("Storage full");
        data.set(name, value);
      }
    }
  });
  vm.runInContext(source, context);
  return context.window.InventoryStorage;
}

test("first run persists samples once and reloads independent objects", () => {
  const data = new Map();
  const store = openInventory(data);
  assert.equal(store.loadItems().length, 0);
  assert.equal(data.has(key), false);
  const items = store.initializeItems();
  assert.ok(items.length > 0);
  assert.ok(items.some(item => item.stock === 0));
  const saved = data.get(key);
  items[0].stock = 999;
  assert.equal(JSON.stringify(store.loadItems()), saved);
  assert.equal(JSON.stringify(openInventory(data).initializeItems()), saved);
});

const stateKey = "inventory.state.v2";

function purchase(store) {
  return store.checkout(store.loadItems(), store.loadCart());
}

test("checkout commits stock, cleared cart, and immutable receipts across reloads", () => {
  const data = new Map();
  const store = openInventory(data);
  const second = { id: "second", name: "Another product", sku: "SECOND", stock: 2, priceCents: 20 };
  store.saveItems([{ ...product, priceCents: 10 }, second]);
  store.saveCart([{ productId: product.id, quantity: 3 }, { productId: second.id, quantity: 2 }]);
  const legacy = new Map(data);
  assert.equal(store.loadOrders().length, 0);
  const result = purchase(store);
  assert.equal(result.order.totalCents, "70");
  assert.equal(result.order.currency, "USD");
  assert.equal(result.order.lines[0].subtotalCents, "30");
  assert.equal(result.order.lines[0].quantity, 3);
  assert.ok(Number.isFinite(Date.parse(result.order.createdAt)));
  assert.deepEqual(Array.from(data.keys()), [...legacy.keys(), stateKey]);
  for (const [key, value] of legacy) assert.equal(data.get(key), value);

  const reopened = openInventory(data);
  assert.equal(reopened.initializeItems()[0].stock, 9);
  assert.equal(reopened.loadItems()[1].stock, 0);
  assert.equal(reopened.loadCart().length, 0);
  const receipt = JSON.stringify(reopened.loadOrders());
  result.order.lines[0].name = "Mutated returned object";
  reopened.saveItems([{ ...product, name: "Renamed", sku: "NEW", priceCents: 999 }]);
  reopened.saveCart([{ productId: product.id, quantity: 1 }]);
  assert.equal(JSON.stringify(reopened.loadOrders()), receipt);
  const next = purchase(reopened);
  assert.equal(next.order.totalCents, "999");
  assert.notEqual(next.order.id, reopened.loadOrders()[0].id);
  assert.equal(openInventory(data).loadOrders().length, 2);
  reopened.saveItems([]);
  assert.equal(openInventory(data).initializeItems().length, 0);
  assert.equal(openInventory(data).loadOrders()[0].lines[0].name, product.name);
});

test("empty, deleted, and overstock carts cannot change inventory or history", () => {
  for (const cart of [[], [{ productId: "missing", quantity: 1 }], [{ productId: product.id, quantity: 13 }]]) {
    const data = new Map();
    const store = openInventory(data);
    store.saveItems([product]);
    store.saveCart(cart);
    const before = new Map(data);
    assert.throws(() => purchase(store), /empty|deleted|Insufficient stock/);
    assert.deepEqual(data, before);
  }
});

test("checkout rejects stale quantities, prices, stock, and repeated submissions", () => {
  const data = new Map();
  const store = openInventory(data);
  store.saveItems([product]);
  store.saveCart([{ productId: product.id, quantity: 1 }]);
  const items = store.loadItems();
  const cart = store.loadCart();
  for (const changed of [{ ...product, priceCents: 50 }, { ...product, stock: 5 }]) {
    store.saveItems([changed]);
    const before = new Map(data);
    assert.throws(() => store.checkout(items, cart), /Reload and review/);
    assert.deepEqual(data, before);
  }
  store.saveItems(items);
  store.saveCart([{ productId: product.id, quantity: 2 }]);
  assert.throws(() => store.checkout(items, cart), /Reload and review/);
  store.saveCart(cart);
  purchase(store);
  const before = new Map(data);
  assert.throws(() => store.checkout(items, cart), /Reload and review/);
  assert.throws(() => purchase(store), /empty/);
  assert.deepEqual(data, before);
});

test("failed checkout writes preserve every saved value before and after migration", () => {
  const data = new Map();
  const failures = {};
  const store = openInventory(data, failures);
  store.saveItems([product]);
  store.saveCart([{ productId: product.id, quantity: 2 }]);
  for (let attempt = 0; attempt < 2; attempt++) {
    const before = new Map(data);
    failures.write = true;
    assert.throws(() => purchase(store), /full/);
    assert.deepEqual(data, before);
    failures.write = false;
    purchase(store);
    assert.equal(store.loadOrders().length, attempt + 1);
    store.saveCart([{ productId: product.id, quantity: 2 }]);
  }
  failures.write = true;
  const before = new Map(data);
  assert.throws(() => store.saveItems([]), /full/);
  assert.throws(() => store.saveCart([]), /full/);
  assert.deepEqual(data, before);
});

test("checkout handles free products and totals above the safe integer range exactly", () => {
  const store = openInventory();
  store.saveItems([product]);
  store.saveCart([{ productId: product.id, quantity: product.stock }]);
  const free = purchase(store);
  assert.equal(free.order.totalCents, "0");
  assert.equal(free.items[0].stock, 0);
  store.saveItems([{ ...product, stock: Number.MAX_SAFE_INTEGER, priceCents: 999999999 }]);
  store.saveCart([{ productId: product.id, quantity: Number.MAX_SAFE_INTEGER }]);
  const large = purchase(store);
  assert.equal(large.order.totalCents, String(BigInt(Number.MAX_SAFE_INTEGER) * 999999999n));
  assert.equal(large.items[0].stock, 0);
});

test("invalid consolidated data blocks writes without reverting to legacy data", () => {
  const validData = new Map();
  const store = openInventory(validData);
  store.saveItems([product]);
  store.saveCart([{ productId: product.id, quantity: 1 }]);
  purchase(store);
  const saved = validData.get(stateKey);
  const mutations = [
    state => { state.version = 3; },
    state => { state.items[0].stock = -1; },
    state => { state.cart = [{}]; },
    state => { state.orders = {}; },
    state => { state.orders.push(state.orders[0]); },
    state => { state.orders[0].createdAt = "invalid"; },
    state => { state.orders[0].currency = "EUR"; },
    state => { state.orders[0].totalCents = "1"; },
    state => { state.orders[0].lines = []; },
    state => { state.orders[0].lines[0].quantity = 0; },
    state => { state.orders[0].lines[0].subtotalCents = "1"; },
    state => { state.orders[0].lines[0].unitPriceCents = -1; }
  ];
  const invalid = ["", "bad json", "null", "{}", ...mutations.map(mutate => {
    const state = JSON.parse(saved);
    mutate(state);
    return JSON.stringify(state);
  })];
  for (const value of invalid) {
    const data = new Map(validData);
    data.set(stateKey, value);
    const before = new Map(data);
    const corrupt = openInventory(data);
    for (const action of [() => corrupt.initializeItems(), () => corrupt.loadOrders(),
      () => corrupt.saveItems([]), () => corrupt.saveCart([]), () => purchase(corrupt)]) {
      assert.throws(action);
      assert.deepEqual(data, before);
    }
  }
});

test("product changes persist across sessions without reseeding", () => {
  const data = new Map();
  const store = openInventory(data);
  store.initializeItems();
  store.saveItems([product]);
  const reopened = openInventory(data);
  const items = reopened.initializeItems();
  assert.equal(JSON.stringify(items), JSON.stringify([product]));
  items[0].stock = 0;
  reopened.saveItems(items);
  assert.equal(openInventory(data).initializeItems()[0].stock, 0);
});

test("a saved empty inventory stays empty", () => {
  const data = new Map();
  openInventory(data).saveItems([]);
  assert.equal(openInventory(data).initializeItems().length, 0);
  assert.equal(data.get(key), "[]");
});

test("invalid product writes leave previously saved inventory intact", () => {
  const data = new Map();
  const store = openInventory(data);
  store.saveItems([product]);
  const saved = data.get(key);
  const invalid = [
    null, {}, [null], [[]], [{}],
    ...["", "  ", " test ", 123].flatMap(value =>
      ["id", "name", "sku"].map(field => [{ ...product, [field]: value }])
    ),
    ...[-1, 1.5, "12", null, undefined, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]
      .map(stock => [{ ...product, stock }]),
    [product, { ...product, sku: "DIFFERENT" }],
    [product, { ...product, id: "different", sku: "test-1" }]
  ];
  for (const items of invalid) {
    assert.throws(() => store.saveItems(items));
    assert.equal(data.get(key), saved);
  }
});

test("malformed saved data is reported and never replaced by samples", () => {
  for (const saved of ["", "not json", "null", "{}", "[null]", '[{"name":"Old item"}]',
    JSON.stringify([{ ...product, stock: -1 }]), JSON.stringify([product, product])]) {
    const data = new Map([[key, saved]]);
    const store = openInventory(data);
    assert.throws(() => store.initializeItems());
    assert.throws(() => store.loadItems());
    assert.equal(data.get(key), saved);
  }
});

test("read and write failures reach callers without losing saved data", () => {
  assert.throws(() => openInventory(new Map(), { read: true }).initializeItems(), /unavailable/);
  const empty = new Map();
  assert.throws(() => openInventory(empty, { write: true }).initializeItems(), /full/);
  assert.equal(empty.has(key), false);
  const saved = JSON.stringify([product]);
  const data = new Map([[key, saved]]);
  const store = openInventory(data, { write: true });
  assert.equal(store.initializeItems()[0].stock, 12);
  assert.throws(() => store.saveItems([]), /full/);
  assert.equal(data.get(key), saved);
});

test("prices are optional for older inventory and validated as whole cents", () => {
  const data = new Map([[key, JSON.stringify([product])]]);
  const store = openInventory(data);
  assert.equal(store.initializeItems()[0].priceCents, undefined);
  store.saveItems([{ ...product, priceCents: 1234 }]);
  assert.equal(openInventory(data).loadItems()[0].priceCents, 1234);
  const saved = data.get(key);
  for (const priceCents of [-1, 1.5, "100", null, NaN, Infinity, 1000000000]) {
    assert.throws(() => store.saveItems([{ ...product, priceCents }]));
    assert.equal(data.get(key), saved);
  }
});

test("cart persists quantities and removals independently of inventory", () => {
  const data = new Map();
  const store = openInventory(data);
  const cartKey = "inventory.cart.v1";
  store.saveItems([product]);
  const inventory = data.get(key);
  assert.equal(store.loadCart().length, 0);
  assert.equal(data.has(cartKey), false);
  store.saveCart([{ productId: product.id, quantity: 2 }]);
  const reopened = openInventory(data);
  const cart = reopened.loadCart();
  cart[0].quantity = 4;
  assert.equal(reopened.loadCart()[0].quantity, 2);
  reopened.saveCart(cart);
  assert.equal(openInventory(data).loadCart()[0].quantity, 4);
  store.saveCart([]);
  assert.equal(openInventory(data).loadCart().length, 0);
  assert.equal(data.get(key), inventory);
});

test("invalid cart writes and storage failures preserve saved cart", () => {
  const data = new Map();
  const store = openInventory(data);
  const line = { productId: product.id, quantity: 2 };
  const cartKey = "inventory.cart.v1";
  store.saveCart([line]);
  const saved = data.get(cartKey);
  for (const cart of [null, {}, [null], [[]], [{}], [line, line],
    ...["", " ", " id ", 123].map(productId => [{ ...line, productId }]),
    ...[0, -1, 1.5, "2", null, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]
      .map(quantity => [{ ...line, quantity }])]) {
    assert.throws(() => store.saveCart(cart));
    assert.equal(data.get(cartKey), saved);
  }
  assert.throws(() => openInventory(data, { read: true }).loadCart(), /unavailable/);
  assert.throws(() => openInventory(data, { write: true }).saveCart([]), /full/);
  assert.equal(data.get(cartKey), saved);
  for (const invalid of ["not json", "null", "{}", "[null]", JSON.stringify([line, line])]) {
    const corruptData = new Map([[cartKey, invalid]]);
    assert.throws(() => openInventory(corruptData).loadCart());
    assert.equal(corruptData.get(cartKey), invalid);
  }
});

test("guarded product and cart writes reject stale data before and after checkout migration", () => {
  const data = new Map();
  const store = openInventory(data);
  store.saveItems([product]);
  store.saveCart([{ productId: product.id, quantity: 1 }]);
  for (let migrated = 0; migrated < 2; migrated++) {
    const oldItems = store.loadItems();
    const oldCart = store.loadCart();
    store.saveItems([{ ...product, stock: 20 }]);
    let before = new Map(data);
    assert.throws(() => store.saveItems([], oldItems), /Reload and review/);
    assert.throws(() => store.saveCart([], oldCart, oldItems), /Reload and review/);
    assert.deepEqual(data, before);
    store.saveCart([{ productId: product.id, quantity: 2 }]);
    before = new Map(data);
    assert.throws(() => store.saveCart([], oldCart, store.loadItems()), /Reload and review/);
    assert.deepEqual(data, before);
    store.saveItems([{ ...product, stock: 5 }], store.loadItems());
    store.saveCart([{ productId: product.id, quantity: 1 }], store.loadCart(), store.loadItems());
    purchase(store);
    store.saveCart([{ productId: product.id, quantity: 1 }]);
  }
});

test("an older tab cannot restore stock or the cart after another tab purchases", () => {
  const data = new Map();
  const store = openInventory(data);
  store.saveItems([product]);
  store.saveCart([{ productId: product.id, quantity: 2 }]);
  const oldItems = store.loadItems();
  const oldCart = store.loadCart();
  purchase(openInventory(data));
  const before = new Map(data);
  assert.throws(() => store.saveItems(oldItems, oldItems), /Reload and review/);
  assert.throws(() => store.saveCart(oldCart, oldCart, oldItems), /Reload and review/);
  assert.deepEqual(data, before);
});
