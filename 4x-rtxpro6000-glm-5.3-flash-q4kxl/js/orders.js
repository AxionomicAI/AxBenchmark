/* =========================================================
   Inventory — checkout & order history data layer
   Completing a purchase (checkout) decreases the stock of
   every product in the cart, records an order as a snapshot
   (so later product edits or deletions never rewrite
   history), and empties the cart. Persisted in localStorage.
   Exposes window.InventoryOrders.
   ========================================================= */

(function () {
  'use strict';

  var store = window.InventoryStorage;
  var inventory = window.Inventory;
  var cart = window.InventoryCart;
  var ORDERS_KEY = 'orders.v1';
  var SEQ_KEY = 'orders.seq.v1';
  var CHANGE_EVENT = 'orders:changed';

  /** Oldest orders are dropped beyond this limit to bound storage. */
  var MAX_ORDERS = 100;

  var FIRST_ORDER_NUMBER = 1001;

  /** @type {Array<Object>} oldest first */
  var orders = [];

  /** Last assigned order number (kept across clears and reloads). */
  var lastNumber = FIRST_ORDER_NUMBER - 1;

  /** @type {boolean} false when localStorage is unavailable */
  var persistent = true;

  // ---------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------

  function round2(value) {
    return Math.round(value * 100) / 100;
  }

  function generateId() {
    return 'o_' + Date.now().toString(36) + '_' +
      Math.random().toString(36).slice(2, 8);
  }

  /** Human-friendly, monotonically increasing order number. */
  function nextOrderNumber() {
    return lastNumber + 1;
  }

  /**
   * Load the order-number counter. The counter survives history
   * clears, and it never moves backwards relative to orders that
   * are actually stored (protects against a lost/older counter key).
   */
  function loadSeq() {
    var stored = Number(store.get(SEQ_KEY, null));
    lastNumber = isFinite(stored) && stored >= FIRST_ORDER_NUMBER - 1
      ? Math.floor(stored)
      : FIRST_ORDER_NUMBER - 1;
    orders.forEach(function (order) {
      if (order.number > lastNumber) {
        lastNumber = order.number;
      }
    });
    if (persistent) {
      store.set(SEQ_KEY, lastNumber);
    }
  }

  // ---------------------------------------------------------------
  // Persistence
  // ---------------------------------------------------------------

  function persist() {
    if (!persistent) {
      return false; // memory-only mode
    }
    return store.set(ORDERS_KEY, orders);
  }

  function notify(reason) {
    persist();
    try {
      document.dispatchEvent(new CustomEvent(CHANGE_EVENT, {
        detail: { reason: reason }
      }));
    } catch (err) {
      console.warn('[orders] Could not dispatch change event:', err);
    }
  }

  /**
   * Coerce a stored order back into a valid record; returns null for
   * records too broken to keep.
   * @param {*} raw
   * @returns {Object|null}
   */
  function sanitizeOrder(raw) {
    if (!raw || typeof raw !== 'object') {
      return null;
    }
    if (typeof raw.id !== 'string' || raw.id === '') {
      return null;
    }
    var number = Number(raw.number);
    if (!isFinite(number) || number < 1 || number % 1 !== 0) {
      return null;
    }
    if (!Array.isArray(raw.items)) {
      return null;
    }
    var items = raw.items.map(function (item) {
      if (!item || typeof item !== 'object') {
        return null;
      }
      var quantity = Number(item.quantity);
      var unitPrice = Number(item.unitPrice);
      if (!isFinite(quantity) || quantity < 1 || quantity % 1 !== 0) {
        return null;
      }
      if (!isFinite(unitPrice) || unitPrice < 0) {
        return null;
      }
      var lineTotal = Number(item.lineTotal);
      return {
        productId: typeof item.productId === 'string' ? item.productId : '',
        sku: typeof item.sku === 'string' ? item.sku : '',
        name: typeof item.name === 'string' && item.name !== '' ? item.name : 'Unknown item',
        unitPrice: round2(unitPrice),
        quantity: quantity,
        lineTotal: isFinite(lineTotal) && lineTotal >= 0
          ? round2(lineTotal)
          : round2(unitPrice * quantity)
      };
    }).filter(Boolean);
    if (items.length === 0) {
      return null;
    }
    var totalUnits = 0;
    var total = 0;
    items.forEach(function (item) {
      totalUnits += item.quantity;
      total += item.lineTotal;
    });
    return {
      id: raw.id,
      number: number,
      date: typeof raw.date === 'string' ? raw.date : new Date().toISOString(),
      items: items,
      totalUnits: totalUnits,
      total: round2(total)
    };
  }

  // ---------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------

  /** Load the order history from localStorage. */
  function init() {
    persistent = store.available();
    if (!persistent) {
      console.warn('[orders] localStorage unavailable — order history will not persist.');
      orders = [];
      return;
    }
    var stored = store.get(ORDERS_KEY, null);
    orders = Array.isArray(stored)
      ? stored.map(sanitizeOrder).filter(Boolean)
      : [];
    loadSeq();
  }

  // ---------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------

  /** @returns {Array<Object>} orders, newest first */
  function getAll() {
    return orders.slice().reverse();
  }

  /** @returns {number} number of stored orders */
  function getCount() {
    return orders.length;
  }

  // ---------------------------------------------------------------
  // Checkout — the purchase transaction
  // ---------------------------------------------------------------

  /**
   * Complete the purchase:
   *   1. validate the cart against current stock,
   *   2. decrease the stock of every product by the cart quantity,
   *   3. record the order (a snapshot of names/prices at purchase time),
   *   4. empty the cart.
   * Returns {ok:true, order} or {ok:false, errors}.
   */
  function checkout() {
    var lines = cart.getLines();
    if (lines.length === 0) {
      return { ok: false, errors: ['The cart is empty.'] };
    }

    // 1. Validate every line against the current stock before
    //    touching anything (execution is synchronous, so this holds).
    for (var i = 0; i < lines.length; i += 1) {
      var product = inventory.getById(lines[i].product.id);
      if (!product || product.quantity < lines[i].quantity) {
        return {
          ok: false,
          errors: ['Stock has changed \u2014 please review your cart and try again.']
        };
      }
    }

    // 2. Snapshot the order before mutating anything.
    var items = lines.map(function (line) {
      return {
        productId: line.product.id,
        sku: line.product.sku,
        name: line.product.name,
        unitPrice: line.product.unitPrice,
        quantity: line.quantity,
        lineTotal: line.lineTotal
      };
    });
    var totalUnits = 0;
    var total = 0;
    items.forEach(function (item) {
      totalUnits += item.quantity;
      total += item.lineTotal;
    });

    // 3. Decrease the stock, line by line. Each call fires
    //    inventory:changed (the cart syncs itself mid-way; the cart is
    //    cleared below, so that is fine).
    for (var j = 0; j < lines.length; j += 1) {
      var result = inventory.adjustStock(lines[j].product.id, -lines[j].quantity);
      if (!result.ok) {
        // Defensive: cannot normally happen after the validation above.
        return { ok: false, errors: result.errors };
      }
    }

    // 4. Record the order and empty the cart.
    var order = {
      id: generateId(),
      number: nextOrderNumber(),
      date: new Date().toISOString(),
      items: items,
      totalUnits: totalUnits,
      total: round2(total)
    };
    orders.push(order);
    lastNumber = order.number;
    if (persistent) {
      store.set(SEQ_KEY, lastNumber);
    }
    if (orders.length > MAX_ORDERS) {
      orders = orders.slice(orders.length - MAX_ORDERS); // keep the newest
    }
    cart.clear();
    notify('checkout');
    return { ok: true, order: order };
  }

  /** Delete the entire order history. */
  function clearHistory() {
    if (orders.length === 0) {
      return { ok: true };
    }
    orders = [];
    notify('clear');
    return { ok: true };
  }

  // ---------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------

  window.InventoryOrders = {
    init: init,
    getAll: getAll,
    getCount: getCount,
    checkout: checkout,
    clearHistory: clearHistory,
    CHANGE_EVENT: CHANGE_EVENT
  };
})();
