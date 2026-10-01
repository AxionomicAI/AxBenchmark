/* Inventory data layer.
 *
 * Products and their stock levels are persisted in localStorage under a
 * single versioned key. On first run — or when the stored record is missing
 * or unreadable — the store is seeded with the sample catalogue below. When
 * localStorage is unavailable (private browsing, restrictive file://
 * settings), the store falls back to an in-memory copy for the session.
 *
 * The shopping cart and the order history are persisted the same way, each
 * under its own key, so they can be reset independently.
 *
 * Loaded as a plain script (so the site works from file://) and exposes the
 * global `InventoryStore`. No libraries, no build step.
 */
(function (root) {
  "use strict";

  var STORAGE_KEY = "inventory.data.v1";
  var CART_KEY = "inventory.cart.v1";
  var ORDERS_KEY = "inventory.orders.v1";
  var SCHEMA_VERSION = 1;

  /* Catalogue written on first run. A few items are deliberately low or out
   * of stock so stock-level UI has something to highlight. */
  var SAMPLE_PRODUCTS = [
    { id: "p-001", name: "Wireless Mouse", sku: "ELC-WM-001", category: "Electronics", quantity: 42, unitPrice: 24.99 },
    { id: "p-002", name: "Mechanical Keyboard", sku: "ELC-KB-014", category: "Electronics", quantity: 15, unitPrice: 89.5 },
    { id: "p-003", name: "USB-C Cable (2 m)", sku: "ELC-CB-201", category: "Electronics", quantity: 120, unitPrice: 9.99 },
    { id: "p-004", name: "27-inch 4K Monitor", sku: "ELC-MN-027", category: "Electronics", quantity: 7, unitPrice: 329 },
    { id: "p-005", name: "Desk Lamp", sku: "FUR-DL-007", category: "Furniture", quantity: 8, unitPrice: 45 },
    { id: "p-006", name: "Office Chair", sku: "FUR-OC-003", category: "Furniture", quantity: 3, unitPrice: 189.99 },
    { id: "p-007", name: "Anti-Fatigue Desk Mat", sku: "FUR-DM-002", category: "Furniture", quantity: 0, unitPrice: 59 },
    { id: "p-008", name: "Notebook (A5, dotted)", sku: "STA-NB-100", category: "Stationery", quantity: 260, unitPrice: 4.5 },
    { id: "p-009", name: "Gel Pens (pack of 12)", sku: "STA-GP-012", category: "Stationery", quantity: 0, unitPrice: 12.75 },
    { id: "p-010", name: "Whiteboard Markers (4 pack)", sku: "STA-WM-004", category: "Stationery", quantity: 5, unitPrice: 7.2 }
  ];

  var storageCache = null; // probed localStorage, or false when unavailable
  var memoryState = null; // fallback state when storage is unavailable
  var memoryCart = null; // fallback cart when storage is unavailable
  var memoryOrders = null; // fallback order history when storage is unavailable

  /* ---- storage --------------------------------------------------------*/

  /* Probe localStorage once and return it, or null when unusable. */
  function storage() {
    if (storageCache === null) {
      try {
        var candidate = root.localStorage;
        var probe = "__inventory_probe__";
        candidate.setItem(probe, probe);
        candidate.removeItem(probe);
        storageCache = candidate;
      } catch (err) {
        storageCache = false;
      }
    }
    return storageCache || null;
  }

  /* ---- helpers --------------------------------------------------------*/

  function nowIso() {
    return new Date().toISOString();
  }

  function toText(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function toQuantity(value) {
    var n = Math.round(Number(value));
    return isFinite(n) && n > 0 ? n : 0;
  }

  function toUnitPrice(value) {
    var n = Number(value);
    if (!isFinite(n) || n < 0) {
      return 0;
    }
    return Math.round(n * 100) / 100;
  }

  function shallowCopy(product) {
    var copy = {};
    for (var key in product) {
      if (Object.prototype.hasOwnProperty.call(product, key)) {
        copy[key] = product[key];
      }
    }
    return copy;
  }

  function findIndexById(products, id) {
    for (var i = 0; i < products.length; i++) {
      if (products[i].id === id) {
        return i;
      }
    }
    return -1;
  }

  function makeId(takenIds) {
    var id;
    do {
      id = "p-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
    } while (takenIds[id]);
    return id;
  }

  /* Coerce arbitrary stored or user-supplied data into a well-formed
   * product. Returns null when there is no usable name. */
  function normalizeProduct(raw, takenIds) {
    if (!raw || typeof raw !== "object") {
      return null;
    }
    var name = toText(raw.name);
    if (!name) {
      return null;
    }
    var id = toText(raw.id);
    if (id && takenIds && takenIds[id]) {
      id = ""; // duplicate id: issue a fresh one rather than collide
    }
    return {
      id: id || makeId(takenIds || {}),
      name: name,
      sku: toText(raw.sku),
      category: toText(raw.category) || "Uncategorized",
      quantity: toQuantity(raw.quantity),
      unitPrice: toUnitPrice(raw.unitPrice),
      createdAt: toText(raw.createdAt) || nowIso(),
      updatedAt: toText(raw.updatedAt) || toText(raw.createdAt) || nowIso()
    };
  }

  /* Validate user-supplied fields; returns a { field: message } map. Blank
   * stock and price default to zero rather than failing. */
  function validateInput(input, products, skipId) {
    var errors = {};
    if (!toText(input.name)) {
      errors.name = "Name is required.";
    }
    var sku = toText(input.sku);
    if (sku) {
      for (var i = 0; i < products.length; i++) {
        var other = products[i];
        if (other.id !== skipId && other.sku.toLowerCase() === sku.toLowerCase()) {
          errors.sku = "SKU is already used by another product.";
          break;
        }
      }
    }
    if (input.quantity !== undefined && input.quantity !== null && input.quantity !== "") {
      var quantity = Number(input.quantity);
      if (!isFinite(quantity) || quantity < 0 || quantity % 1 !== 0) {
        errors.quantity = "Stock must be a whole number, 0 or more.";
      }
    }
    if (input.unitPrice !== undefined && input.unitPrice !== null && input.unitPrice !== "") {
      var unitPrice = Number(input.unitPrice);
      if (!isFinite(unitPrice) || unitPrice < 0) {
        errors.unitPrice = "Unit price must be a number, 0 or more.";
      }
    }
    return errors;
  }

  /* ---- state: load, seed, persist -------------------------------------*/

  /* Parse a stored record into state; null when the record is unusable. */
  function parseState(raw) {
    var parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      return null;
    }
    var list = null;
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.products)) {
      list = parsed.products;
    } else if (Array.isArray(parsed)) {
      list = parsed; // tolerate a hand-edited bare array
    }
    if (!list) {
      return null;
    }
    var takenIds = {};
    var products = [];
    for (var i = 0; i < list.length; i++) {
      var product = normalizeProduct(list[i], takenIds);
      if (product) {
        takenIds[product.id] = true;
        products.push(product);
      }
    }
    return { version: SCHEMA_VERSION, products: products };
  }

  function seedState() {
    var takenIds = {};
    var products = [];
    for (var i = 0; i < SAMPLE_PRODUCTS.length; i++) {
      var product = normalizeProduct(SAMPLE_PRODUCTS[i], takenIds);
      if (product) {
        takenIds[product.id] = true;
        products.push(product);
      }
    }
    return { version: SCHEMA_VERSION, products: products };
  }

  /* Read state from storage, seeding (and saving) the sample catalogue on
   * first run or when the stored record is unreadable. */
  function loadState() {
    var s = storage();
    if (s) {
      try {
        var raw = s.getItem(STORAGE_KEY);
        if (raw) {
          var stored = parseState(raw);
          if (stored) {
            return stored;
          }
        }
      } catch (err) {
        // Unreadable storage: fall through and reseed.
      }
      var seeded = seedState();
      persist(seeded);
      return seeded;
    }
    if (!memoryState) {
      memoryState = seedState();
    }
    return memoryState;
  }

  /* Single write path: always updates the memory fallback, and localStorage
   * when it is usable. Returns false when the write could not be saved. */
  function persist(state) {
    memoryState = state;
    var s = storage();
    if (!s) {
      return false;
    }
    try {
      s.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (err) {
      return false;
    }
  }

  /* ---- public operations ----------------------------------------------*/

  function getProducts() {
    return loadState().products.map(shallowCopy);
  }

  function getProduct(id) {
    var index = findIndexById(loadState().products, id);
    return index === -1 ? null : shallowCopy(loadState().products[index]);
  }

  /* Case-insensitive lookup across name, SKU and category. Every
   * whitespace-separated term must match somewhere, so "usb cable" finds the
   * USB-C cable but "usb lamp" finds nothing; a blank query matches
   * everything. filters.category narrows the result to one exact category
   * (case-insensitive). */
  function searchProducts(query, filters) {
    filters = filters || {};
    var terms = toText(query).toLowerCase().split(/\s+/);
    var category = toText(filters.category).toLowerCase();
    return loadState().products.filter(function (product) {
      if (category && product.category.toLowerCase() !== category) {
        return false;
      }
      for (var i = 0; i < terms.length; i++) {
        var term = terms[i];
        if (!term) {
          continue;
        }
        if (product.name.toLowerCase().indexOf(term) === -1 &&
            product.sku.toLowerCase().indexOf(term) === -1 &&
            product.category.toLowerCase().indexOf(term) === -1) {
          return false;
        }
      }
      return true;
    }).map(shallowCopy);
  }

  function addProduct(input) {
    input = input || {};
    var state = loadState();
    var errors = validateInput(input, state.products, null);
    if (Object.keys(errors).length > 0) {
      return { ok: false, errors: errors };
    }
    var takenIds = {};
    state.products.forEach(function (product) {
      takenIds[product.id] = true;
    });
    var product = normalizeProduct(input, takenIds);
    state.products.push(product);
    persist(state);
    return { ok: true, product: shallowCopy(product) };
  }

  function updateProduct(id, changes) {
    changes = changes || {};
    var state = loadState();
    var index = findIndexById(state.products, id);
    if (index === -1) {
      return { ok: false, errors: { id: "Product not found." } };
    }
    var current = state.products[index];
    var merged = {
      name: changes.name !== undefined ? changes.name : current.name,
      sku: changes.sku !== undefined ? changes.sku : current.sku,
      category: changes.category !== undefined ? changes.category : current.category,
      quantity: changes.quantity !== undefined ? changes.quantity : current.quantity,
      unitPrice: changes.unitPrice !== undefined ? changes.unitPrice : current.unitPrice
    };
    var errors = validateInput(merged, state.products, id);
    if (Object.keys(errors).length > 0) {
      return { ok: false, errors: errors };
    }
    var updated = shallowCopy(current);
    updated.name = toText(merged.name);
    updated.sku = toText(merged.sku);
    updated.category = toText(merged.category) || "Uncategorized";
    updated.quantity = toQuantity(merged.quantity);
    updated.unitPrice = toUnitPrice(merged.unitPrice);
    updated.updatedAt = nowIso();
    state.products[index] = updated;
    persist(state);
    return { ok: true, product: shallowCopy(updated) };
  }

  function deleteProduct(id) {
    var state = loadState();
    var index = findIndexById(state.products, id);
    if (index === -1) {
      return { ok: false, errors: { id: "Product not found." } };
    }
    var removed = state.products.splice(index, 1)[0];
    persist(state);
    return { ok: true, product: shallowCopy(removed) };
  }

  /* Add a (possibly negative) delta to a product's stock, clamped at zero. */
  function adjustStock(id, delta) {
    var amount = Number(delta);
    if (!isFinite(amount)) {
      return { ok: false, errors: { quantity: "Stock change must be a number." } };
    }
    var state = loadState();
    var index = findIndexById(state.products, id);
    if (index === -1) {
      return { ok: false, errors: { id: "Product not found." } };
    }
    var product = state.products[index];
    product.quantity = Math.max(0, product.quantity + Math.round(amount));
    product.updatedAt = nowIso();
    persist(state);
    return { ok: true, product: shallowCopy(product) };
  }

  /* ---- cart -------------------------------------------------------------*/

  /* The cart lives under its own key so catalogue edits and cart edits stay
   * independent. Entries keep only the product id and a quantity; names and
   * prices are resolved from the live catalogue whenever the cart is read,
   * so price changes carry into the cart and entries whose product has been
   * deleted fall away. Quantities are capped at the stock on hand. */

  /* Quantity × unit price, rounded to cents. */
  function lineTotal(quantity, unitPrice) {
    return Math.round(quantity * unitPrice * 100) / 100;
  }

  /* Parse a stored cart record into plain {id, quantity} entries; null when
   * the record is unusable. */
  function parseCart(raw) {
    var parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      return null;
    }
    var list = null;
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.items)) {
      list = parsed.items;
    } else if (Array.isArray(parsed)) {
      list = parsed; // tolerate a hand-edited bare array
    }
    if (!list) {
      return null;
    }
    var taken = {};
    var items = [];
    for (var i = 0; i < list.length; i++) {
      var entry = list[i] && typeof list[i] === "object" ? list[i] : {};
      var id = toText(entry.id);
      var quantity = Math.round(Number(entry.quantity));
      if (id && !taken[id] && isFinite(quantity) && quantity > 0) {
        taken[id] = true;
        items.push({ id: id, quantity: quantity });
      }
    }
    return items;
  }

  function loadCartItems() {
    var s = storage();
    if (s) {
      try {
        var raw = s.getItem(CART_KEY);
        if (raw !== null && raw !== "") {
          var items = parseCart(raw);
          if (items) {
            return items;
          }
        }
      } catch (err) {
        // Unreadable cart: start from an empty one.
      }
      return [];
    }
    if (!memoryCart) {
      memoryCart = [];
    }
    return memoryCart;
  }

  function saveCartItems(items) {
    memoryCart = items;
    var s = storage();
    if (!s) {
      return false;
    }
    try {
      s.setItem(CART_KEY, JSON.stringify({ version: SCHEMA_VERSION, items: items }));
      return true;
    } catch (err) {
      return false;
    }
  }

  /* Strip enriched entries back down to their stored shape. */
  function stripCart(items) {
    return items.map(function (item) {
      return { id: item.id, quantity: item.quantity };
    });
  }

  /* Join stored entries against the catalogue, dropping products that are
   * gone and clamping quantities to the stock on hand. Re-saves when the
   * tidy-up changed something, so stored carts cannot drift from the
   * catalogue for long. */
  function resolveCart() {
    var items = loadCartItems();
    var byId = {};
    loadState().products.forEach(function (product) {
      byId[product.id] = product;
    });
    var resolved = [];
    var changed = false;
    for (var i = 0; i < items.length; i++) {
      var product = byId[items[i].id];
      var quantity = product ? Math.min(items[i].quantity, product.quantity) : 0;
      if (quantity < 1) {
        changed = true;
        continue;
      }
      if (quantity !== items[i].quantity) {
        changed = true;
      }
      resolved.push({
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        unitPrice: product.unitPrice,
        quantity: quantity,
        lineTotal: lineTotal(quantity, product.unitPrice)
      });
    }
    if (changed) {
      saveCartItems(stripCart(resolved));
    }
    return resolved;
  }

  function getCart() {
    return resolveCart().map(shallowCopy);
  }

  /* Enriched copy of one cart line, or null when it is not in the cart. */
  function getCartItem(id) {
    var items = resolveCart();
    var index = findIndexById(items, id);
    return index === -1 ? null : shallowCopy(items[index]);
  }

  /* Add `quantity` (default 1) of a product, stacking onto any existing
   * line and capping at the stock on hand. `clamped` reports the cap. */
  function addToCart(id, quantity) {
    var wanted = quantity === undefined || quantity === null || quantity === ""
      ? 1
      : Number(quantity);
    if (!isFinite(wanted) || wanted < 1 || wanted % 1 !== 0) {
      return { ok: false, errors: { quantity: "Quantity must be a whole number, 1 or more." } };
    }
    var state = loadState();
    var index = findIndexById(state.products, id);
    if (index === -1) {
      return { ok: false, errors: { id: "Product not found." } };
    }
    var product = state.products[index];
    if (product.quantity < 1) {
      return { ok: false, errors: { quantity: "“" + product.name + "” is out of stock." } };
    }
    var items = stripCart(resolveCart());
    var position = findIndexById(items, id);
    var current = position === -1 ? 0 : items[position].quantity;
    var updated = Math.min(current + wanted, product.quantity);
    if (position === -1) {
      items.push({ id: id, quantity: updated });
    } else {
      items[position] = { id: id, quantity: updated };
    }
    saveCartItems(items);
    return { ok: true, clamped: updated < current + wanted, item: getCartItem(id) };
  }

  /* Set a line to an exact quantity; zero removes it, and anything past the
   * stock on hand is clamped. Works on products not yet in the cart. */
  function setCartQuantity(id, quantity) {
    if (quantity === undefined || quantity === null || quantity === "") {
      return { ok: false, errors: { quantity: "Enter a quantity." } };
    }
    var wanted = Number(quantity);
    if (!isFinite(wanted) || wanted < 0 || wanted % 1 !== 0) {
      return { ok: false, errors: { quantity: "Quantity must be a whole number, 0 or more." } };
    }
    var state = loadState();
    var productIndex = findIndexById(state.products, id);
    var items = stripCart(resolveCart());
    var index = findIndexById(items, id);
    if (productIndex === -1) {
      if (index !== -1) {
        items.splice(index, 1);
        saveCartItems(items);
      }
      return { ok: false, errors: { id: "Product not found." } };
    }
    var stock = state.products[productIndex].quantity;
    if (wanted < 1 || stock < 1) {
      if (index !== -1) {
        items.splice(index, 1);
        saveCartItems(items);
      }
      return { ok: true, removed: true, item: null };
    }
    var updated = Math.min(wanted, stock);
    if (index === -1) {
      items.push({ id: id, quantity: updated });
    } else {
      items[index] = { id: id, quantity: updated };
    }
    saveCartItems(items);
    return { ok: true, removed: false, clamped: updated < wanted, item: getCartItem(id) };
  }

  function removeFromCart(id) {
    var items = stripCart(resolveCart());
    var index = findIndexById(items, id);
    if (index === -1) {
      return { ok: false, errors: { id: "That product is not in the cart." } };
    }
    items.splice(index, 1);
    saveCartItems(items);
    return { ok: true };
  }

  function clearCart() {
    saveCartItems([]);
    return { ok: true };
  }

  /* Units and money across lines that each carry a quantity and a
   * lineTotal. Shared by the cart footer and order records. */
  function sumLines(items) {
    var units = 0;
    var cents = 0;
    items.forEach(function (item) {
      units += item.quantity;
      cents += Math.round(item.lineTotal * 100);
    });
    return { units: units, total: cents / 100 };
  }

  /* Line count, unit count and summed line totals for the cart. */
  function cartTotals() {
    var items = resolveCart();
    var sums = sumLines(items);
    return { items: items.length, units: sums.units, total: sums.total };
  }

  /* ---- order history ------------------------------------------------------*/

  /* Completed checkouts are kept for good, in the order they were placed.
   * Each order snapshots its lines as they were bought — names and prices
   * are frozen at purchase, so later catalogue edits and deletions never
   * rewrite history. Records live under their own key, chronological oldest
   * first; the UI presents them newest first. */

  var FIRST_ORDER_NUMBER = 1001;

  function normalizeOrderLine(raw) {
    if (!raw || typeof raw !== "object") {
      return null;
    }
    var id = toText(raw.id);
    var quantity = Math.round(Number(raw.quantity));
    if (!id || !isFinite(quantity) || quantity < 1) {
      return null;
    }
    var unitPrice = toUnitPrice(raw.unitPrice);
    return {
      id: id,
      name: toText(raw.name) || "Unknown item",
      sku: toText(raw.sku),
      category: toText(raw.category) || "Uncategorized",
      unitPrice: unitPrice,
      quantity: quantity,
      lineTotal: lineTotal(quantity, unitPrice)
    };
  }

  /* Coerce stored data into a well-formed order; null when it has no items. */
  function normalizeOrder(raw, takenIds) {
    if (!raw || typeof raw !== "object" || !Array.isArray(raw.items)) {
      return null;
    }
    var items = [];
    for (var i = 0; i < raw.items.length; i++) {
      var line = normalizeOrderLine(raw.items[i]);
      if (line) {
        items.push(line);
      }
    }
    if (items.length === 0) {
      return null;
    }
    var id = toText(raw.id);
    if (id && takenIds && takenIds[id]) {
      id = ""; // duplicate id: issue a fresh one rather than collide
    }
    var number = Math.round(Number(raw.number));
    return {
      id: id || makeId(takenIds || {}),
      number: isFinite(number) && number > 0 ? number : FIRST_ORDER_NUMBER,
      placedAt: toText(raw.placedAt) || nowIso(),
      items: items
    };
  }

  /* Parse a stored order-history record; null when the record is unusable. */
  function parseOrders(raw) {
    var parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      return null;
    }
    var list = null;
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.orders)) {
      list = parsed.orders;
    } else if (Array.isArray(parsed)) {
      list = parsed; // tolerate a hand-edited bare array
    }
    if (!list) {
      return null;
    }
    var takenIds = {};
    var orders = [];
    for (var i = 0; i < list.length; i++) {
      var order = normalizeOrder(list[i], takenIds);
      if (order) {
        takenIds[order.id] = true;
        orders.push(order);
      }
    }
    return orders;
  }

  function loadOrders() {
    var s = storage();
    if (s) {
      try {
        var raw = s.getItem(ORDERS_KEY);
        if (raw !== null && raw !== "") {
          var orders = parseOrders(raw);
          if (orders) {
            return orders;
          }
        }
      } catch (err) {
        // Unreadable history: start from an empty one.
      }
      return [];
    }
    if (!memoryOrders) {
      memoryOrders = [];
    }
    return memoryOrders;
  }

  function saveOrders(orders) {
    memoryOrders = orders;
    var s = storage();
    if (!s) {
      return false;
    }
    try {
      s.setItem(ORDERS_KEY, JSON.stringify({ version: SCHEMA_VERSION, orders: orders }));
      return true;
    } catch (err) {
      return false;
    }
  }

  /* A copy safe to hand out, with units and total computed from the lines. */
  function copyOrder(order) {
    var copy = shallowCopy(order);
    copy.items = order.items.map(shallowCopy);
    var sums = sumLines(order.items);
    copy.units = sums.units;
    copy.total = sums.total;
    return copy;
  }

  /* Order numbers count up from 1001, continuing past the highest stored. */
  function nextOrderNumber(orders) {
    var highest = FIRST_ORDER_NUMBER - 1;
    orders.forEach(function (order) {
      if (order.number > highest) {
        highest = order.number;
      }
    });
    return highest + 1;
  }

  function getOrders() {
    return loadOrders().map(copyOrder);
  }

  /* Turn the cart into an order: snapshot the lines exactly as the cart
   * shows them (already clamped to stock and stripped of deleted products),
   * reduce the stock of each purchased product, record the order and empty
   * the cart. */
  function checkout() {
    var items = resolveCart();
    if (items.length === 0) {
      return { ok: false, errors: { cart: "Your cart is empty." } };
    }
    var state = loadState();
    var orders = loadOrders();
    var placedAt = nowIso();
    var order = {
      id: makeId({}),
      number: nextOrderNumber(orders),
      placedAt: placedAt,
      items: items.map(shallowCopy)
    };
    items.forEach(function (item) {
      var index = findIndexById(state.products, item.id);
      if (index !== -1) {
        var product = state.products[index];
        product.quantity = Math.max(0, product.quantity - item.quantity);
        product.updatedAt = placedAt;
      }
    });
    orders.push(order);
    persist(state);
    saveOrders(orders);
    saveCartItems([]);
    return { ok: true, order: copyOrder(order) };
  }

  /* Console helper for starting over; the UI never calls this. */
  function clearOrders() {
    saveOrders([]);
    return { ok: true };
  }

  /* Restore the sample catalogue; the cart and order history are left alone. */
  function resetToSamples() {
    persist(seedState());
    return getProducts();
  }

  root.InventoryStore = {
    STORAGE_KEY: STORAGE_KEY,
    CART_KEY: CART_KEY,
    isAvailable: function () {
      return storage() !== null;
    },
    getProducts: getProducts,
    getProduct: getProduct,
    searchProducts: searchProducts,
    addProduct: addProduct,
    updateProduct: updateProduct,
    deleteProduct: deleteProduct,
    adjustStock: adjustStock,
    getCart: getCart,
    getCartItem: getCartItem,
    addToCart: addToCart,
    setCartQuantity: setCartQuantity,
    removeFromCart: removeFromCart,
    clearCart: clearCart,
    cartTotals: cartTotals,
    getOrders: getOrders,
    checkout: checkout,
    clearOrders: clearOrders,
    resetToSamples: resetToSamples
  };
})(typeof window !== "undefined" ? window : globalThis);
