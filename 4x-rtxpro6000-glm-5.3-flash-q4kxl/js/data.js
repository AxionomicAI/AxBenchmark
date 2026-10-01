/* =========================================================
   Inventory — data layer
   Products with their stock, persisted in localStorage.
   Seeds sample data on first run. Exposes window.Inventory.
   ========================================================= */

(function () {
  'use strict';

  var store = window.InventoryStorage;
  var DATA_KEY = 'data.v1';
  var CHANGE_EVENT = 'inventory:changed';

  /** @type {Array<Object>} in-memory copy of the products */
  var items = [];

  /** @type {boolean} false when localStorage is unavailable (memory-only mode) */
  var persistent = true;

  // ---------------------------------------------------------------
  // Sample data — inserted on first run (empty/corrupt storage)
  // ---------------------------------------------------------------

  var SAMPLE_PRODUCTS = [
    { name: 'Wireless Mouse',         sku: 'ELEC-0001', category: 'Electronics',     quantity: 42,  unitPrice: 19.99, reorderLevel: 10, location: 'Shelf A1' },
    { name: 'Mechanical Keyboard',    sku: 'ELEC-0002', category: 'Electronics',     quantity: 15,  unitPrice: 79.5,  reorderLevel: 5,  location: 'Shelf A2' },
    { name: 'USB-C Cable (1 m)',      sku: 'ELEC-0003', category: 'Electronics',     quantity: 8,   unitPrice: 6.5,   reorderLevel: 20, location: 'Shelf A3' },
    { name: 'Notebook A5, dotted',    sku: 'OFFI-0001', category: 'Office Supplies', quantity: 120, unitPrice: 3.2,   reorderLevel: 25, location: 'Shelf B1' },
    { name: 'Ballpoint Pen (blue)',   sku: 'OFFI-0002', category: 'Office Supplies', quantity: 300, unitPrice: 0.6,   reorderLevel: 50, location: 'Shelf B2' },
    { name: 'Sticky Notes 76x76 mm',  sku: 'OFFI-0003', category: 'Office Supplies', quantity: 0,   unitPrice: 1.1,   reorderLevel: 30, location: 'Shelf B3' },
    { name: 'Desk Lamp',              sku: 'FURN-0001', category: 'Furniture',       quantity: 9,   unitPrice: 34.9,  reorderLevel: 4,  location: 'Shelf C1' },
    { name: 'Monitor Stand',          sku: 'FURN-0002', category: 'Furniture',       quantity: 3,   unitPrice: 24,    reorderLevel: 5,  location: 'Shelf C2' },
    { name: 'Coffee Mug 350 ml',      sku: 'KITC-0001', category: 'Kitchen',         quantity: 36,  unitPrice: 8.75,  reorderLevel: 12, location: 'Shelf D1' },
    { name: 'Insulated Bottle 0.5 l', sku: 'KITC-0002', category: 'Kitchen',         quantity: 21,  unitPrice: 14.5,  reorderLevel: 8,  location: 'Shelf D2' }
  ];

  // ---------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------

  function round2(value) {
    return Math.round(value * 100) / 100;
  }

  function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
  }

  function isNonNegativeInt(value) {
    return typeof value === 'number' &&
      isFinite(value) && value >= 0 && value % 1 === 0;
  }

  function isNonNegativeNumber(value) {
    return typeof value === 'number' && isFinite(value) && value >= 0;
  }

  /**
   * Coerce arbitrary input into a non-negative integer stock count,
   * or null when the value is not a whole number ≥ 0 (fractional
   * input is rejected rather than silently rounded).
   * @param {*} value
   * @returns {number|null}
   */
  function toQuantity(value) {
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

  function generateId(existing) {
    var id;
    do {
      id = 'p_' + Date.now().toString(36) + '_' +
        Math.random().toString(36).slice(2, 8);
    } while (existing && existing.some(function (p) { return p.id === id; }));
    return id;
  }

  // ---------------------------------------------------------------
  // Validation / sanitizing
  // ---------------------------------------------------------------

  /**
   * Validate user input for a product.
   * @param {Object} input raw fields
   * @param {Array<Object>} others other products (for SKU uniqueness)
   * @returns {Array<string>} list of error messages (empty = valid)
   */
  function validateProduct(input, others) {
    var errors = [];

    if (!isNonEmptyString(input.name)) {
      errors.push('Name is required.');
    }

    if (!isNonEmptyString(input.sku)) {
      errors.push('SKU is required.');
    } else if (others && others.some(function (p) {
      return p.sku.toUpperCase() === String(input.sku).trim().toUpperCase();
    })) {
      errors.push('SKU must be unique ("' + String(input.sku).trim() + '" is already used).');
    }

    if (!isNonEmptyString(input.category)) {
      errors.push('Category is required.');
    }

    var quantity = toQuantity(input.quantity);
    if (quantity === null) {
      errors.push('Stock quantity must be a whole number ≥ 0.');
    }

    if (input.unitPrice !== undefined && input.unitPrice !== null && input.unitPrice !== '') {
      var price = Number(input.unitPrice);
      if (!isNonNegativeNumber(price)) {
        errors.push('Unit price must be a number ≥ 0.');
      }
    }

    if (input.reorderLevel !== undefined && input.reorderLevel !== null && input.reorderLevel !== '') {
      var reorder = Number(input.reorderLevel);
      if (!isNonNegativeInt(reorder)) {
        errors.push('Reorder level must be a whole number ≥ 0.');
      }
    }

    return errors;
  }

  /**
   * Build a normalized, storable product object from raw fields.
   * Assumes validateProduct() passed.
   * @param {Object} input raw fields
   * @param {string} [id] existing id (updates)
   * @returns {Object} product
   */
  function buildProduct(input, id) {
    var now = new Date().toISOString();
    return {
      id: id || generateId(items),
      name: String(input.name).trim(),
      sku: String(input.sku).trim().toUpperCase(),
      category: String(input.category).trim(),
      quantity: toQuantity(input.quantity),
      unitPrice: input.unitPrice === undefined || input.unitPrice === null || input.unitPrice === ''
        ? 0
        : round2(Number(input.unitPrice)),
      reorderLevel: input.reorderLevel === undefined || input.reorderLevel === null || input.reorderLevel === ''
        ? 0
        : Math.floor(Number(input.reorderLevel)),
      location: isNonEmptyString(input.location) ? String(input.location).trim() : '',
      createdAt: now,
      updatedAt: now
    };
  }

  /**
   * Coerce a stored record back into a valid product; returns null
   * for records that are too broken to keep.
   * @param {*} raw stored value
   * @returns {Object|null}
   */
  function sanitizeProduct(raw) {
    if (!raw || typeof raw !== 'object') {
      return null;
    }
    var quantity = toQuantity(raw.quantity);
    if (!isNonEmptyString(raw.name) || quantity === null) {
      return null;
    }
    var unitPrice = isNonNegativeNumber(Number(raw.unitPrice)) ? round2(Number(raw.unitPrice)) : 0;
    var reorderLevel = isNonNegativeInt(Number(raw.reorderLevel)) ? Math.floor(Number(raw.reorderLevel)) : 0;
    return {
      id: isNonEmptyString(raw.id) ? raw.id : generateId(items),
      name: String(raw.name).trim(),
      sku: isNonEmptyString(raw.sku) ? String(raw.sku).trim().toUpperCase() : '',
      category: isNonEmptyString(raw.category) ? String(raw.category).trim() : 'Uncategorized',
      quantity: quantity,
      unitPrice: unitPrice,
      reorderLevel: reorderLevel,
      location: isNonEmptyString(raw.location) ? String(raw.location).trim() : '',
      createdAt: isNonEmptyString(raw.createdAt) ? raw.createdAt : new Date().toISOString(),
      updatedAt: isNonEmptyString(raw.updatedAt) ? raw.updatedAt : new Date().toISOString()
    };
  }

  // ---------------------------------------------------------------
  // Persistence
  // ---------------------------------------------------------------

  function persist() {
    if (!persistent) {
      return false; // memory-only mode; nothing to write to
    }
    return store.set(DATA_KEY, items);
  }

  /**
   * Persist and notify listeners (the UI re-renders on this event).
   * @param {string} reason short description of what changed
   */
  function notify(reason) {
    persist();
    try {
      document.dispatchEvent(new CustomEvent(CHANGE_EVENT, {
        detail: { reason: reason }
      }));
    } catch (err) {
      // Very old browsers without CustomEvent: persistence still worked.
      console.warn('[data] Could not dispatch change event:', err);
    }
  }

  // ---------------------------------------------------------------
  // Init / seeding
  // ---------------------------------------------------------------

  function seedItems() {
    var now = new Date().toISOString();
    return SAMPLE_PRODUCTS.map(function (sample) {
      var product = buildProduct(sample);
      product.createdAt = now;
      product.updatedAt = now;
      return product;
    });
  }

  /**
   * Initialize the data layer. Loads products from localStorage;
   * seeds sample data on first run (or after storage was cleared /
   * corrupted). Falls back to in-memory-only operation when
   * localStorage is unavailable.
   * @returns {Array<Object>} the current products
   */
  function init() {
    persistent = store.available();
    if (!persistent) {
      console.warn('[data] localStorage unavailable — running in memory only. ' +
        'Changes will be lost when the page closes.');
      items = seedItems();
      return items.slice();
    }

    var stored = store.get(DATA_KEY, null);
    if (Array.isArray(stored)) {
      var seen = {};
      items = stored
        .map(sanitizeProduct)
        .filter(function (product) {
          // Drop duplicates / unusable records defensively.
          if (!product || seen[product.id]) {
            return false;
          }
          seen[product.id] = true;
          return true;
        });
      if (items.length === 0 && stored.length > 0) {
        console.warn('[data] Stored inventory was unreadable — reseeding sample data.');
        items = seedItems();
        notify('reseed');
      } else {
        persist(); // rewrite sanitized form once
      }
    } else {
      // First run (or cleared storage): seed sample data.
      items = seedItems();
      notify('seed');
    }
    return items.slice();
  }

  /**
   * Delete everything and reseed the sample data.
   * @returns {Array<Object>} the fresh sample products
   */
  function resetToSample() {
    items = seedItems();
    notify('reset');
    return items.slice();
  }

  // ---------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------

  /** @returns {Array<Object>} copy of all products */
  function getAll() {
    return items.slice();
  }

  /**
   * @param {string} id product id
   * @returns {Object|null} the product, or null when not found
   */
  function getById(id) {
    var found = null;
    items.some(function (product) {
      if (product.id === id) {
        found = product;
        return true;
      }
      return false;
    });
    return found;
  }

  /** @returns {Array<string>} sorted unique category names */
  function getCategories() {
    var names = {};
    items.forEach(function (product) {
      if (product.category) {
        names[product.category] = true;
      }
    });
    return Object.keys(names).sort();
  }

  /**
   * A product is "low stock" when its quantity has reached its
   * reorder level while still being above zero — out-of-stock
   * products are reported separately (see getStats()).
   * @param {Object} product
   * @returns {boolean}
   */
  function isLowStock(product) {
    return product.reorderLevel > 0 &&
      product.quantity > 0 &&
      product.quantity <= product.reorderLevel;
  }

  /** @returns {{products:number, units:number, lowStock:number, outOfStock:number, stockValue:number}} */
  function getStats() {
    var units = 0;
    var low = 0;
    var out = 0;
    var value = 0;
    items.forEach(function (product) {
      units += product.quantity;
      value += product.quantity * product.unitPrice;
      if (product.quantity === 0) {
        out += 1;
      } else if (isLowStock(product)) {
        low += 1;
      }
    });
    return {
      products: items.length,
      units: units,
      lowStock: low,
      outOfStock: out,
      stockValue: round2(value)
    };
  }

  // ---------------------------------------------------------------
  // Mutations — each returns {ok:true, product?} or {ok:false, errors?}
  // ---------------------------------------------------------------

  function othersWithSku(id) {
    return items.filter(function (p) { return p.id !== id; });
  }

  function addProduct(input) {
    var errors = validateProduct(input, othersWithSku(null));
    if (errors.length > 0) {
      return { ok: false, errors: errors };
    }
    var product = buildProduct(input);
    items.push(product);
    notify('add');
    return { ok: true, product: product };
  }

  function updateProduct(id, patch) {
    var product = getById(id);
    if (!product) {
      return { ok: false, errors: ['Product not found.'] };
    }
    var merged = {
      name: patch.name !== undefined ? patch.name : product.name,
      sku: patch.sku !== undefined ? patch.sku : product.sku,
      category: patch.category !== undefined ? patch.category : product.category,
      quantity: patch.quantity !== undefined ? patch.quantity : product.quantity,
      unitPrice: patch.unitPrice !== undefined ? patch.unitPrice : product.unitPrice,
      reorderLevel: patch.reorderLevel !== undefined ? patch.reorderLevel : product.reorderLevel,
      location: patch.location !== undefined ? patch.location : product.location
    };
    var errors = validateProduct(merged, othersWithSku(id));
    if (errors.length > 0) {
      return { ok: false, errors: errors };
    }
    var updated = buildProduct(merged, product.id);
    updated.createdAt = product.createdAt;
    items = items.map(function (p) {
      return p.id === id ? updated : p;
    });
    notify('update');
    return { ok: true, product: updated };
  }

  function deleteProduct(id) {
    var product = getById(id);
    if (!product) {
      return { ok: false, errors: ['Product not found.'] };
    }
    items = items.filter(function (p) { return p.id !== id; });
    notify('delete');
    return { ok: true, product: product };
  }

  /**
   * Set the stock of a product to an exact amount.
   * @param {string} id
   * @param {number|string} quantity
   */
  function setStock(id, quantity) {
    var parsed = toQuantity(quantity);
    if (parsed === null) {
      return { ok: false, errors: ['Stock quantity must be a whole number ≥ 0.'] };
    }
    return updateProduct(id, { quantity: parsed });
  }

  /**
   * Add (or, with a negative delta, remove) stock for a product.
   * @param {string} id
   * @param {number} delta signed amount
   */
  function adjustStock(id, delta) {
    var product = getById(id);
    if (!product) {
      return { ok: false, errors: ['Product not found.'] };
    }
    var step = Number(delta);
    if (!isFinite(step) || step % 1 !== 0) {
      return { ok: false, errors: ['Adjustment must be a whole number.'] };
    }
    var next = product.quantity + step;
    if (next < 0) {
      return { ok: false, errors: ['Stock cannot go below 0 (current: ' + product.quantity + ').'] };
    }
    return setStock(id, next);
  }

  // ---------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------

  window.Inventory = {
    init: init,
    getAll: getAll,
    getById: getById,
    getCategories: getCategories,
    getStats: getStats,
    isLowStock: isLowStock,
    addProduct: addProduct,
    updateProduct: updateProduct,
    deleteProduct: deleteProduct,
    setStock: setStock,
    adjustStock: adjustStock,
    resetToSample: resetToSample,
    CHANGE_EVENT: CHANGE_EVENT
  };
})();
