/* =========================================================
   Inventory — shopping cart data layer
   Cart lines reference products by id and are resolved
   against the live inventory, so price/name edits are
   reflected automatically, deleted products drop out, and
   quantities can never exceed the available stock.
   Persisted in localStorage. Exposes window.InventoryCart.
   ========================================================= */

(function () {
  'use strict';

  var store = window.InventoryStorage;
  var inventory = window.Inventory;
  var CART_KEY = 'cart.v1';
  var CHANGE_EVENT = 'cart:changed';

  /** @type {Array<{productId:string, quantity:number}>} */
  var lines = [];

  /** @type {boolean} false when localStorage is unavailable */
  var persistent = true;

  // ---------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------

  function round2(value) {
    return Math.round(value * 100) / 100;
  }

  function toCount(value) {
    var num = null;
    if (typeof value === 'number' && isFinite(value)) {
      num = value;
    } else if (typeof value === 'string' && value.trim() !== '') {
      num = Number(value);
    }
    if (num === null || !isFinite(num) || num < 0 || num % 1 !== 0) {
      return null;
    }
    return num;
  }

  function findLine(productId) {
    var found = null;
    lines.some(function (line) {
      if (line.productId === productId) {
        found = line;
        return true;
      }
      return false;
    });
    return found;
  }

  // ---------------------------------------------------------------
  // Persistence
  // ---------------------------------------------------------------

  function persist() {
    if (!persistent) {
      return false; // memory-only mode
    }
    return store.set(CART_KEY, lines);
  }

  function notify(reason) {
    persist();
    try {
      document.dispatchEvent(new CustomEvent(CHANGE_EVENT, {
        detail: { reason: reason }
      }));
    } catch (err) {
      console.warn('[cart] Could not dispatch change event:', err);
    }
  }

  function sanitizeLine(raw) {
    if (!raw || typeof raw !== 'object') {
      return null;
    }
    var productId = typeof raw.productId === 'string' ? raw.productId : null;
    var quantity = toCount(raw.quantity);
    if (!productId || quantity === null || quantity < 1) {
      return null;
    }
    return { productId: productId, quantity: quantity };
  }

  // ---------------------------------------------------------------
  // Inventory coherence
  // ---------------------------------------------------------------

  /**
   * Resolve cart lines against the live inventory: drop lines whose
   * product no longer exists (or has no stock) and clamp quantities
   * to the available stock. Returns true when anything changed.
   * @returns {boolean}
   */
  function syncWithInventory() {
    var changed = false;
    var next = [];
    lines.forEach(function (line) {
      var product = inventory.getById(line.productId);
      if (!product || product.quantity === 0) {
        changed = true;
        return;
      }
      if (line.quantity > product.quantity) {
        line.quantity = product.quantity;
        changed = true;
      }
      next.push(line);
    });
    if (changed) {
      lines = next;
      notify('sync');
    }
    return changed;
  }

  // Keep the cart coherent whenever the inventory changes.
  document.addEventListener(inventory.CHANGE_EVENT, function () {
    syncWithInventory();
  });

  // ---------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------

  /**
   * Load the cart from localStorage. Stale or malformed lines are
   * dropped; surviving lines are synced against the inventory.
   */
  function init() {
    persistent = store.available();
    if (!persistent) {
      console.warn('[cart] localStorage unavailable — the cart will not persist.');
      lines = [];
      return;
    }
    var stored = store.get(CART_KEY, null);
    var loaded = Array.isArray(stored)
      ? stored.map(sanitizeLine).filter(Boolean)
      : [];
    // De-duplicate by productId (last entry wins).
    var byId = {};
    loaded.forEach(function (line) {
      byId[line.productId] = line;
    });
    lines = Object.keys(byId).map(function (key) {
      return byId[key];
    });
    syncWithInventory();
  }

  // ---------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------

  /** Units of a product currently in the cart (0 when absent). */
  function quantityOf(productId) {
    var line = findLine(productId);
    return line ? line.quantity : 0;
  }

  /**
   * Resolved cart lines: `{ product, quantity, lineTotal }`,
   * sorted by product name. Deleted products never appear.
   * @returns {Array<Object>}
   */
  function getLines() {
    return lines.map(function (line) {
      var product = inventory.getById(line.productId);
      if (!product) {
        return null;
      }
      return {
        product: product,
        quantity: line.quantity,
        lineTotal: round2(product.unitPrice * line.quantity)
      };
    }).filter(Boolean).sort(function (a, b) {
      return a.product.name.localeCompare(b.product.name, undefined, { sensitivity: 'base' });
    });
  }

  /** Total number of units across all lines. */
  function getCount() {
    return lines.reduce(function (sum, line) {
      return sum + line.quantity;
    }, 0);
  }

  /** Sum of all line totals. */
  function getTotal() {
    return round2(getLines().reduce(function (sum, line) {
      return sum + line.lineTotal;
    }, 0));
  }

  // ---------------------------------------------------------------
  // Mutations — each returns {ok:true, ...} or {ok:false, errors}
  // ---------------------------------------------------------------

  /**
   * Add units of a product to the cart. Fails when the product is
   * unknown or out of stock, or when the addition would exceed the
   * available stock.
   * @param {string} productId
   * @param {number|string} [quantity=1]
   */
  function add(productId, quantity) {
    var product = inventory.getById(productId);
    if (!product) {
      return { ok: false, errors: ['Product not found.'] };
    }
    var wanted = (quantity === undefined || quantity === null) ? 1 : toCount(quantity);
    if (wanted === null || wanted < 1) {
      return { ok: false, errors: ['Quantity must be a whole number ≥ 1.'] };
    }
    if (product.quantity === 0) {
      return { ok: false, errors: ['\u201c' + product.name + '\u201d is out of stock.'] };
    }
    var current = quantityOf(productId);
    if (current + wanted > product.quantity) {
      return {
        ok: false,
        errors: ['Only ' + product.quantity + ' unit(s) of \u201c' + product.name +
          '\u201d in stock' + (current > 0 ? ' (' + current + ' already in the cart)' : '') + '.']
      };
    }
    if (current === 0) {
      lines.push({ productId: productId, quantity: wanted });
    } else {
      findLine(productId).quantity = current + wanted;
    }
    notify('add');
    return { ok: true, quantity: current + wanted };
  }

  /**
   * Set the quantity of a cart line (0 removes the line).
   * @param {string} productId
   * @param {number|string} quantity
   */
  function setQuantity(productId, quantity) {
    var product = inventory.getById(productId);
    if (!product) {
      return { ok: false, errors: ['Product not found.'] };
    }
    if (!findLine(productId)) {
      return { ok: false, errors: ['Product is not in the cart.'] };
    }
    var wanted = toCount(quantity);
    if (wanted === null) {
      return { ok: false, errors: ['Quantity must be a whole number.'] };
    }
    if (wanted === 0) {
      return remove(productId);
    }
    if (wanted > product.quantity) {
      return { ok: false, errors: ['Only ' + product.quantity + ' unit(s) of \u201c' +
        product.name + '\u201d in stock.'] };
    }
    findLine(productId).quantity = wanted;
    notify('set');
    return { ok: true, quantity: wanted };
  }

  /** Remove a product's line from the cart. */
  function remove(productId) {
    var before = lines.length;
    lines = lines.filter(function (line) {
      return line.productId !== productId;
    });
    if (lines.length === before) {
      return { ok: false, errors: ['Product is not in the cart.'] };
    }
    notify('remove');
    return { ok: true };
  }

  /** Empty the cart. */
  function clear() {
    if (lines.length === 0) {
      return { ok: true };
    }
    lines = [];
    notify('clear');
    return { ok: true };
  }

  // ---------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------

  window.InventoryCart = {
    init: init,
    add: add,
    setQuantity: setQuantity,
    remove: remove,
    clear: clear,
    getLines: getLines,
    getCount: getCount,
    getTotal: getTotal,
    quantityOf: quantityOf,
    syncWithInventory: syncWithInventory,
    CHANGE_EVENT: CHANGE_EVENT
  };
})();
