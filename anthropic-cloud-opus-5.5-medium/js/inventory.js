/*
 * Inventory data layer (global `Inventory`): products and their stock.
 *
 * Product shape:
 *   {
 *     id:           string   unique, generated
 *     sku:          string   unique (case-insensitive), e.g. "WID-001"
 *     name:         string
 *     category:     string   may be empty
 *     quantity:     integer  units in stock, >= 0
 *     reorderLevel: integer  low-stock threshold, >= 0
 *     price:        number   unit price, >= 0, rounded to cents
 *     createdAt:    string   ISO timestamp
 *     updatedAt:    string   ISO timestamp
 *   }
 *
 * Mutating functions return { ok: true, product } on success or
 * { ok: false, errors: { field: message } } on failure. Nothing is changed
 * in memory unless the change was also saved to localStorage.
 * Products handed out are copies, so callers cannot modify state directly.
 */
var Inventory = (function () {
  'use strict';

  var products = [];

  // Upper limits, so values stay exact and cannot overflow when stored as JSON.
  var MAX_QUANTITY = 1000000000;
  var MAX_PRICE = 1000000000;

  var SAMPLE_PRODUCTS = [
    { sku: 'WID-001', name: 'Standard Widget', category: 'Widgets', quantity: 120, reorderLevel: 25, price: 2.5 },
    { sku: 'WID-002', name: 'Deluxe Widget', category: 'Widgets', quantity: 18, reorderLevel: 20, price: 7.95 },
    { sku: 'GAD-010', name: 'Pocket Gadget', category: 'Gadgets', quantity: 42, reorderLevel: 10, price: 14.99 },
    { sku: 'GAD-011', name: 'Desk Gadget', category: 'Gadgets', quantity: 0, reorderLevel: 5, price: 29 },
    { sku: 'CAB-100', name: 'USB-C Cable (1 m)', category: 'Cables', quantity: 260, reorderLevel: 50, price: 4.49 },
    { sku: 'CAB-101', name: 'HDMI Cable (2 m)', category: 'Cables', quantity: 35, reorderLevel: 40, price: 8.75 },
    { sku: 'TOL-200', name: 'Precision Screwdriver Set', category: 'Tools', quantity: 15, reorderLevel: 5, price: 19.5 },
    { sku: 'TOL-201', name: 'Digital Caliper', category: 'Tools', quantity: 7, reorderLevel: 3, price: 24.99 }
  ];

  // ---- helpers -----------------------------------------------------------

  function copy(product) {
    var out = {};
    for (var k in product) {
      if (Object.prototype.hasOwnProperty.call(product, k)) {
        out[k] = product[k];
      }
    }
    return out;
  }

  function now() {
    return new Date().toISOString();
  }

  function generateId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      try {
        return crypto.randomUUID();
      } catch (ignored) {
        // randomUUID can be unavailable outside secure contexts.
      }
    }
    return 'p-' + Date.now().toString(36) + '-' +
      Math.random().toString(36).slice(2, 10);
  }

  function indexOfId(id) {
    for (var i = 0; i < products.length; i++) {
      if (products[i].id === id) {
        return i;
      }
    }
    return -1;
  }

  function toText(value) {
    return value === undefined || value === null ? '' : String(value).trim();
  }

  function toNumber(value) {
    if (typeof value === 'string' && value.trim() === '') {
      return NaN;
    }
    return Number(value);
  }

  function isNonNegativeInteger(n) {
    return typeof n === 'number' && isFinite(n) && n >= 0 && Math.floor(n) === n;
  }

  function isValidQuantity(n) {
    return isNonNegativeInteger(n) && n <= MAX_QUANTITY;
  }

  function isValidPrice(n) {
    return typeof n === 'number' && isFinite(n) && n >= 0 && n <= MAX_PRICE;
  }

  /*
   * Validates and normalizes product fields. `excludeId` is the product being
   * edited, so its own SKU does not count as a duplicate.
   */
  function validate(data, excludeId) {
    var errors = {};
    var clean = {
      sku: toText(data.sku),
      name: toText(data.name),
      category: toText(data.category),
      quantity: toNumber(data.quantity),
      reorderLevel: toNumber(data.reorderLevel),
      price: toNumber(data.price)
    };

    if (!clean.sku) {
      errors.sku = 'SKU is required.';
    } else {
      var sku = clean.sku.toLowerCase();
      for (var i = 0; i < products.length; i++) {
        if (products[i].id !== excludeId && products[i].sku.toLowerCase() === sku) {
          errors.sku = 'SKU "' + clean.sku + '" is already used by ' +
            products[i].name + '.';
          break;
        }
      }
    }
    if (!clean.name) {
      errors.name = 'Name is required.';
    }
    if (!isNonNegativeInteger(clean.quantity)) {
      errors.quantity = 'Quantity must be a whole number of 0 or more.';
    } else if (clean.quantity > MAX_QUANTITY) {
      errors.quantity = 'Quantity cannot be more than ' + MAX_QUANTITY.toLocaleString() + '.';
    }
    if (!isNonNegativeInteger(clean.reorderLevel)) {
      errors.reorderLevel = 'Reorder level must be a whole number of 0 or more.';
    } else if (clean.reorderLevel > MAX_QUANTITY) {
      errors.reorderLevel = 'Reorder level cannot be more than ' + MAX_QUANTITY.toLocaleString() + '.';
    }
    if (!(isFinite(clean.price) && clean.price >= 0)) {
      errors.price = 'Price must be a number of 0 or more.';
    } else if (clean.price > MAX_PRICE) {
      errors.price = 'Price cannot be more than ' + MAX_PRICE.toLocaleString() + '.';
    } else {
      clean.price = Math.round(clean.price * 100) / 100;
    }

    for (var field in errors) {
      if (Object.prototype.hasOwnProperty.call(errors, field)) {
        return { ok: false, errors: errors };
      }
    }
    return { ok: true, value: clean };
  }

  /*
   * Saves `next` as the product list. State only changes if the save worked.
   */
  function commit(next) {
    if (!InventoryStore.saveProducts(next)) {
      return false;
    }
    products = next;
    return true;
  }

  function saveFailed() {
    return {
      ok: false,
      errors: { storage: 'Could not save to browser storage. It may be full or disabled.' }
    };
  }

  function notFound(id) {
    return { ok: false, errors: { id: 'No product with id "' + id + '".' } };
  }

  function buildSampleProducts() {
    var timestamp = now();
    return SAMPLE_PRODUCTS.map(function (sample) {
      var product = copy(sample);
      product.id = generateId();
      product.createdAt = timestamp;
      product.updatedAt = timestamp;
      return product;
    });
  }

  /*
   * Normalizes a record read from storage; returns null if it is unusable.
   * Guards against hand-edited or partially written data.
   */
  function fromStored(record, seenIds) {
    if (!record || typeof record !== 'object' || typeof record.id !== 'string' ||
        !record.id || seenIds[record.id]) {
      return null;
    }
    var name = toText(record.name);
    var sku = toText(record.sku);
    if (!name || !sku) {
      return null;
    }
    var quantity = toNumber(record.quantity);
    var reorderLevel = toNumber(record.reorderLevel);
    var price = toNumber(record.price);
    seenIds[record.id] = true;
    return {
      id: record.id,
      sku: sku,
      name: name,
      category: toText(record.category),
      quantity: isValidQuantity(quantity) ? quantity : 0,
      reorderLevel: isValidQuantity(reorderLevel) ? reorderLevel : 0,
      price: isValidPrice(price) ? Math.round(price * 100) / 100 : 0,
      createdAt: typeof record.createdAt === 'string' ? record.createdAt : now(),
      updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : now()
    };
  }

  // ---- public API --------------------------------------------------------

  /*
   * Loads products from storage. On first run (nothing stored yet) the
   * sample data is stored and loaded. An inventory the user has emptied is
   * stored as [] and is not re-seeded.
   */
  function init() {
    var stored = InventoryStore.loadProducts();
    if (stored === null) {
      var samples = buildSampleProducts();
      if (!InventoryStore.saveProducts(samples)) {
        console.warn('Sample data could not be saved; changes will not persist.');
      }
      products = samples;
      return;
    }
    var seenIds = {};
    products = [];
    stored.forEach(function (record) {
      var product = fromStored(record, seenIds);
      if (product) {
        products.push(product);
      } else {
        console.warn('Skipping invalid product record:', record);
      }
    });
  }

  function getAll() {
    return products.map(copy);
  }

  function getById(id) {
    var i = indexOfId(id);
    return i === -1 ? null : copy(products[i]);
  }

  function add(data) {
    var result = validate(data || {}, null);
    if (!result.ok) {
      return result;
    }
    var product = result.value;
    product.id = generateId();
    product.createdAt = product.updatedAt = now();
    if (!commit(products.concat([product]))) {
      return saveFailed();
    }
    return { ok: true, product: copy(product) };
  }

  /*
   * Updates the given fields of a product; omitted fields keep their values.
   */
  function update(id, changes) {
    var i = indexOfId(id);
    if (i === -1) {
      return notFound(id);
    }
    var merged = copy(products[i]);
    changes = changes || {};
    ['sku', 'name', 'category', 'quantity', 'reorderLevel', 'price'].forEach(function (field) {
      if (Object.prototype.hasOwnProperty.call(changes, field)) {
        merged[field] = changes[field];
      }
    });
    var result = validate(merged, id);
    if (!result.ok) {
      return result;
    }
    var product = result.value;
    product.id = id;
    product.createdAt = products[i].createdAt;
    product.updatedAt = now();
    var next = products.slice();
    next[i] = product;
    if (!commit(next)) {
      return saveFailed();
    }
    return { ok: true, product: copy(product) };
  }

  function remove(id) {
    var i = indexOfId(id);
    if (i === -1) {
      return notFound(id);
    }
    var removed = products[i];
    var next = products.slice(0, i).concat(products.slice(i + 1));
    if (!commit(next)) {
      return saveFailed();
    }
    return { ok: true, product: copy(removed) };
  }

  /*
   * Changes stock by `delta` units (positive to receive, negative to remove).
   * Stock cannot go below zero.
   */
  function adjustStock(id, delta) {
    var i = indexOfId(id);
    if (i === -1) {
      return notFound(id);
    }
    var n = toNumber(delta);
    if (!(isFinite(n) && Math.floor(n) === n)) {
      return { ok: false, errors: { quantity: 'Adjustment must be a whole number.' } };
    }
    var quantity = products[i].quantity + n;
    if (quantity < 0) {
      return {
        ok: false,
        errors: { quantity: 'Only ' + products[i].quantity + ' in stock.' }
      };
    }
    return update(id, { quantity: quantity });
  }

  function setStock(id, quantity) {
    return update(id, { quantity: quantity });
  }

  /*
   * Applies several stock changes in one save: `changes` is an array of
   * { id, delta }. All or nothing: if any product is missing, any delta is
   * not a whole number, or any stock would go below zero, nothing changes.
   * Returns { ok: true, products } with the updated products.
   */
  function adjustStockMany(changes) {
    var next = products.slice();
    var changed = {};
    var timestamp = now();
    for (var c = 0; c < (changes || []).length; c++) {
      var id = changes[c].id;
      var i = indexOfId(id);
      if (i === -1) {
        return notFound(id);
      }
      var n = toNumber(changes[c].delta);
      if (!(isFinite(n) && Math.floor(n) === n)) {
        return { ok: false, errors: { quantity: 'Adjustment must be a whole number.' } };
      }
      var quantity = next[i].quantity + n;
      if (quantity < 0) {
        return {
          ok: false,
          errors: { quantity: 'Only ' + next[i].quantity + ' of ' + next[i].name + ' in stock.' }
        };
      }
      if (quantity > MAX_QUANTITY) {
        return {
          ok: false,
          errors: { quantity: 'Stock cannot be more than ' + MAX_QUANTITY.toLocaleString() + '.' }
        };
      }
      next[i] = copy(next[i]);
      next[i].quantity = quantity;
      next[i].updatedAt = timestamp;
      changed[id] = true;
    }
    if (!commit(next)) {
      return saveFailed();
    }
    return {
      ok: true,
      products: next.filter(function (p) {
        return changed[p.id];
      }).map(copy)
    };
  }

  /* True when stock is at or below the product's reorder level. */
  function isLowStock(product) {
    return product.quantity <= product.reorderLevel;
  }

  function isOutOfStock(product) {
    return product.quantity === 0;
  }

  function getCategories() {
    var seen = {};
    var categories = [];
    products.forEach(function (p) {
      if (p.category && !seen[p.category]) {
        seen[p.category] = true;
        categories.push(p.category);
      }
    });
    return categories.sort(function (a, b) {
      return a.localeCompare(b);
    });
  }

  function getSummary() {
    var summary = {
      productCount: products.length,
      totalUnits: 0,
      totalValue: 0,
      lowStockCount: 0,
      outOfStockCount: 0
    };
    products.forEach(function (p) {
      summary.totalUnits += p.quantity;
      summary.totalValue += p.quantity * p.price;
      if (isOutOfStock(p)) {
        summary.outOfStockCount++;
      }
      if (isLowStock(p)) {
        summary.lowStockCount++;
      }
    });
    summary.totalValue = Math.round(summary.totalValue * 100) / 100;
    return summary;
  }

  /* Splits a search query into lowercase terms. */
  function searchTerms(query) {
    return toText(query).toLowerCase().split(/\s+/).filter(Boolean);
  }

  function matchesStock(product, stock) {
    if (stock === 'low') {
      return isLowStock(product);
    }
    if (stock === 'out') {
      return isOutOfStock(product);
    }
    if (stock === 'in') {
      return !isLowStock(product);
    }
    return true;
  }

  /*
   * Finds products matching all of the given criteria:
   *   query:    text; every word must appear in the SKU, name or category
   *             (case-insensitive, any order)
   *   category: exact category name; '' or omitted for any
   *   stock:    'low' (at or below reorder level), 'out', 'in' (above
   *             reorder level) or '' / omitted for any
   * A product whose SKU equals the whole query is listed first; otherwise
   * inventory order is kept.
   */
  function search(criteria) {
    criteria = criteria || {};
    var terms = searchTerms(criteria.query);
    var category = toText(criteria.category);
    var stock = criteria.stock || '';
    var exactSku = toText(criteria.query).toLowerCase();

    var exact = [];
    var rest = [];
    products.forEach(function (p) {
      if (category && p.category !== category) {
        return;
      }
      if (!matchesStock(p, stock)) {
        return;
      }
      var haystack = (p.sku + ' ' + p.name + ' ' + p.category).toLowerCase();
      for (var i = 0; i < terms.length; i++) {
        if (haystack.indexOf(terms[i]) === -1) {
          return;
        }
      }
      (exactSku && p.sku.toLowerCase() === exactSku ? exact : rest).push(copy(p));
    });
    return exact.concat(rest);
  }

  /* Replaces all products with the sample data. */
  function resetToSampleData() {
    if (!commit(buildSampleProducts())) {
      return saveFailed();
    }
    return { ok: true };
  }

  return {
    MAX_QUANTITY: MAX_QUANTITY,
    MAX_PRICE: MAX_PRICE,
    init: init,
    getAll: getAll,
    getById: getById,
    search: search,
    searchTerms: searchTerms,
    add: add,
    update: update,
    remove: remove,
    adjustStock: adjustStock,
    setStock: setStock,
    adjustStockMany: adjustStockMany,
    isLowStock: isLowStock,
    isOutOfStock: isOutOfStock,
    getCategories: getCategories,
    getSummary: getSummary,
    resetToSampleData: resetToSampleData
  };
})();
