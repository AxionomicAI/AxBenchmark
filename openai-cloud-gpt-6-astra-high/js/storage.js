"use strict";

// Classic scripts keep the app compatible with opening index.html via file://.
window.InventoryStorage = (() => {
  const key = "inventory.items.v1";
  const cartKey = "inventory.cart.v1";
  // After the first checkout this envelope is authoritative. One setItem commits
  // stock, cart, and history atomically; legacy keys remain untouched as backups.
  const stateKey = "inventory.state.v2";
  const sampleItems = [
    { id: "sample-notebook", name: "Notebook", sku: "NB-001", stock: 24 },
    { id: "sample-pen", name: "Ballpoint pen", sku: "PN-001", stock: 60 },
    { id: "sample-folder", name: "Document folder", sku: "FL-001", stock: 8 },
    { id: "sample-tape", name: "Packing tape", sku: "TP-001", stock: 0 }
  ];

  function validateItems(items) {
    if (!Array.isArray(items)) {
      throw new TypeError("Inventory must be an array.");
    }

    const ids = new Set();
    const skus = new Set();
    for (const item of items) {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        throw new TypeError("Each product must be an object.");
      }
      for (const field of ["id", "name", "sku"]) {
        if (typeof item[field] !== "string" || !item[field].trim() ||
            item[field] !== item[field].trim()) {
          throw new TypeError(`Product ${field} must be a non-empty, trimmed string.`);
        }
      }
      if (!Number.isSafeInteger(item.stock) || item.stock < 0) {
        throw new TypeError("Product stock must be a non-negative safe integer.");
      }
      // Products saved before prices were introduced are treated as $0.00.
      if (item.priceCents !== undefined &&
          (!Number.isSafeInteger(item.priceCents) || item.priceCents < 0 || item.priceCents > 999999999)) {
        throw new TypeError("Product price must be whole cents between 0 and 999999999.");
      }
      const sku = item.sku.toLowerCase();
      if (ids.has(item.id) || skus.has(sku)) {
        throw new TypeError("Product IDs and SKUs must be unique.");
      }
      ids.add(item.id);
      skus.add(sku);
    }
  }

  function loadItems() {
    const state = loadState();
    if (state) return state.items;
    const stored = localStorage.getItem(key);
    if (stored === null) return [];

    const items = JSON.parse(stored);
    validateItems(items);
    return items;
  }

  function checkExpected(actual, expected) {
    if (expected !== undefined && JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error("Inventory or cart changed in another window. Reload and review before saving.");
    }
  }

  function saveItems(items, expectedItems) {
    validateItems(items);
    const state = loadState();
    checkExpected(state ? state.items : loadItems(), expectedItems);
    if (state) {
      saveState({ ...state, items });
      return;
    }
    localStorage.setItem(key, JSON.stringify(items));
  }

  function initializeItems() {
    const state = loadState();
    if (state) return state.items;
    // An existing empty array is intentional; never replace it with samples.
    if (localStorage.getItem(key) === null) {
      saveItems(sampleItems);
    }
    return loadItems();
  }

  function validateCart(cart) {
    if (!Array.isArray(cart)) throw new TypeError("Cart must be an array.");
    const ids = new Set();
    for (const line of cart) {
      if (!line || typeof line !== "object" || Array.isArray(line) ||
          typeof line.productId !== "string" || !line.productId.trim() ||
          line.productId !== line.productId.trim() || ids.has(line.productId) ||
          !Number.isSafeInteger(line.quantity) || line.quantity < 1) {
        throw new TypeError("Cart entries need a unique product ID and a positive whole quantity.");
      }
      ids.add(line.productId);
    }
  }

  function loadCart() {
    const state = loadState();
    if (state) return state.cart;
    const stored = localStorage.getItem(cartKey);
    const cart = stored === null ? [] : JSON.parse(stored);
    validateCart(cart);
    return cart;
  }

  function saveCart(cart, expectedCart, expectedItems) {
    validateCart(cart);
    const state = loadState();
    checkExpected(state ? state.cart : loadCart(), expectedCart);
    if (expectedItems !== undefined) checkExpected(state ? state.items : loadItems(), expectedItems);
    if (state) {
      saveState({ ...state, cart });
      return;
    }
    localStorage.setItem(cartKey, JSON.stringify(cart));
  }

  function validateOrders(orders) {
    if (!Array.isArray(orders)) throw new TypeError("Orders must be an array.");
    const ids = new Set();
    const validText = value => typeof value === "string" && value.trim() && value === value.trim();
    const validCents = value => typeof value === "string" && /^(0|[1-9]\d*)$/.test(value);
    for (const order of orders) {
      if (!order || !validText(order.id) || ids.has(order.id) || order.currency !== "USD" ||
          typeof order.createdAt !== "string" || !Number.isFinite(Date.parse(order.createdAt)) ||
          new Date(order.createdAt).toISOString() !== order.createdAt ||
          !Array.isArray(order.lines) || !order.lines.length || !validCents(order.totalCents)) {
        throw new TypeError("Invalid saved order.");
      }
      ids.add(order.id);
      const products = new Set();
      let total = 0n;
      for (const line of order.lines) {
        if (!line || ![line.productId, line.name, line.sku].every(validText) ||
            products.has(line.productId) || !Number.isSafeInteger(line.quantity) || line.quantity < 1 ||
            !Number.isSafeInteger(line.unitPriceCents) || line.unitPriceCents < 0 || line.unitPriceCents > 999999999 ||
            !validCents(line.subtotalCents) ||
            BigInt(line.subtotalCents) !== BigInt(line.quantity) * BigInt(line.unitPriceCents)) {
          throw new TypeError("Invalid saved order line.");
        }
        products.add(line.productId);
        total += BigInt(line.subtotalCents);
      }
      if (total !== BigInt(order.totalCents)) throw new TypeError("Invalid saved order total.");
    }
  }

  function validateState(state) {
    if (!state || state.version !== 2) throw new TypeError("Invalid saved inventory state.");
    validateItems(state.items);
    validateCart(state.cart);
    validateOrders(state.orders);
  }

  function loadState() {
    const stored = localStorage.getItem(stateKey);
    if (stored === null) return null;
    const state = JSON.parse(stored);
    validateState(state);
    return state;
  }

  function saveState(state) {
    validateState(state);
    localStorage.setItem(stateKey, JSON.stringify(state));
  }

  function loadOrders() {
    return loadState()?.orders ?? [];
  }

  function checkout(expectedItems, expectedCart) {
    const state = loadState() ?? { version: 2, items: loadItems(), cart: loadCart(), orders: [] };
    // Reject a stale screen instead of silently purchasing changed quantities/prices.
    if (JSON.stringify(state.items) !== JSON.stringify(expectedItems) ||
        JSON.stringify(state.cart) !== JSON.stringify(expectedCart)) {
      throw new Error("Inventory or cart changed in another window. Reload and review your cart before purchasing.");
    }
    if (!state.cart.length) throw new Error("Your cart is empty. Add products before purchasing.");
    const lines = state.cart.map(line => {
      const item = state.items.find(product => product.id === line.productId);
      if (!item) throw new Error("A cart product was deleted. Remove it before purchasing.");
      if (line.quantity > item.stock) {
        throw new Error(`Insufficient stock for ${item.name}. Reduce its quantity or remove it before purchasing.`);
      }
      const unitPriceCents = item.priceCents ?? 0;
      return {
        productId: item.id, name: item.name, sku: item.sku, quantity: line.quantity,
        unitPriceCents, subtotalCents: String(BigInt(unitPriceCents) * BigInt(line.quantity))
      };
    });
    let id;
    do {
      id = `order-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    } while (state.orders.some(order => order.id === id));
    const order = {
      id, createdAt: new Date().toISOString(), currency: "USD", lines,
      totalCents: String(lines.reduce((total, line) => total + BigInt(line.subtotalCents), 0n))
    };
    const quantities = new Map(lines.map(line => [line.productId, line.quantity]));
    const nextState = {
      version: 2,
      items: state.items.map(item => ({ ...item, stock: item.stock - (quantities.get(item.id) ?? 0) })),
      cart: [], orders: [...state.orders, order]
    };
    // No earlier writes, rollback, or cleanup: a failed commit changes nothing.
    saveState(nextState);
    return { ...nextState, order };
  }

  return Object.freeze({ initializeItems, loadItems, saveItems, loadCart, saveCart, loadOrders, checkout });
})();
