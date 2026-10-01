// Data layer: the product model and every operation on it. Persists through
// InventoryStore (js/storage.js). Exposes a single global, Inventory.
//
// A product looks like this:
//   {
//     id: 'mf3k2a9x1q7c',          assigned on creation, never changes
//     name: 'Wireless Mouse',      required
//     sku: 'ELC-MSE-210',          required, unique (ignoring case)
//     category: 'Electronics',     may be ''
//     quantity: 35,                units in stock, whole number >= 0
//     priceCents: 1999,            unit price in cents, whole number >= 0
//     reorderLevel: 10,            stock is low at or below this, whole number >= 0
//     createdAt: '2026-10-01T09:30:00.000Z',
//     updatedAt: '2026-10-01T09:30:00.000Z'
//   }
(function () {
  'use strict';

  // The most that quantity, priceCents and reorderLevel can be.
  var MAX_INTEGER = 1000000000;

  var TEXT_FIELDS = [
    { key: 'name', label: 'Name', maxLength: 100, required: true },
    { key: 'sku', label: 'SKU', maxLength: 40, required: true },
    { key: 'category', label: 'Category', maxLength: 50, required: false }
  ];
  var INTEGER_FIELDS = [
    { key: 'quantity', label: 'Quantity' },
    { key: 'priceCents', label: 'Price in cents' },
    { key: 'reorderLevel', label: 'Reorder level' }
  ];
  var DEFAULTS = { category: '', quantity: 0, priceCents: 0, reorderLevel: 0 };

  var persistent = InventoryStore.isAvailable();
  var seeded = false;
  var recovered = false;
  var listeners = [];

  // The products as last read or written. When storage is unavailable this is
  // the only copy, so the site still works until the page is closed.
  var cache = null;

  function isObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  function isTimestamp(value) {
    return typeof value === 'string' && !isNaN(Date.parse(value));
  }

  function indexOfId(products, id) {
    for (var i = 0; i < products.length; i++) {
      if (products[i].id === id) {
        return i;
      }
    }
    return -1;
  }

  function newId(products) {
    var id;
    do {
      id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    } while (indexOfId(products, id) !== -1);
    return id;
  }

  // Builds the editable fields of a product from input, falling back to base
  // for anything input leaves out. Text is trimmed; unknown properties are
  // dropped.
  function pickFields(input, base) {
    var fields = {};
    TEXT_FIELDS.concat(INTEGER_FIELDS).forEach(function (field) {
      var value = input[field.key];
      if (value === undefined || value === null) {
        value = base[field.key];
      }
      fields[field.key] = typeof value === 'string' ? value.trim() : value;
    });
    return fields;
  }

  // Checks the editable fields of a product against the other products.
  // Returns a map of field name to message, or null if everything is valid.
  // ownId is the id of the product being checked, so that it does not clash
  // with its own SKU.
  function validate(fields, others, ownId) {
    var errors = {};

    TEXT_FIELDS.forEach(function (field) {
      var value = fields[field.key];
      if (value === undefined || value === '') {
        if (field.required) {
          errors[field.key] = field.label + ' is required.';
        }
      } else if (typeof value !== 'string') {
        errors[field.key] = field.label + ' must be text.';
      } else if (value.length > field.maxLength) {
        errors[field.key] = field.label + ' must be at most ' + field.maxLength + ' characters.';
      }
    });

    INTEGER_FIELDS.forEach(function (field) {
      var value = fields[field.key];
      if (!Number.isInteger(value) || value < 0) {
        errors[field.key] = field.label + ' must be a whole number, 0 or more.';
      } else if (value > MAX_INTEGER) {
        errors[field.key] = field.label + ' must be at most ' + MAX_INTEGER + '.';
      }
    });

    if (!errors.sku) {
      var sku = fields.sku.toLowerCase();
      var taken = others.some(function (other) {
        return other.id !== ownId && other.sku.toLowerCase() === sku;
      });
      if (taken) {
        errors.sku = 'Another product already uses this SKU.';
      }
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  function makeProduct(id, fields, createdAt, updatedAt) {
    return {
      id: id,
      name: fields.name,
      sku: fields.sku,
      category: fields.category,
      quantity: fields.quantity,
      priceCents: fields.priceCents,
      reorderLevel: fields.reorderLevel,
      createdAt: createdAt,
      updatedAt: updatedAt
    };
  }

  function copy(product) {
    return makeProduct(product.id, product, product.createdAt, product.updatedAt);
  }

  // Returns the stored records that are valid products. Fields missing from a
  // record get their defaults, so older data survives new optional fields.
  function keepValid(records) {
    var products = [];
    records.forEach(function (record) {
      if (!isObject(record) || typeof record.id !== 'string' || record.id === '' ||
          indexOfId(products, record.id) !== -1 ||
          !isTimestamp(record.createdAt) || !isTimestamp(record.updatedAt)) {
        return;
      }
      var fields = pickFields(record, DEFAULTS);
      if (!validate(fields, products, record.id)) {
        products.push(makeProduct(record.id, fields, record.createdAt, record.updatedAt));
      }
    });
    return products;
  }

  function buildSamples() {
    var now = new Date().toISOString();
    var products = [];
    InventorySampleData.forEach(function (sample) {
      products.push(makeProduct(newId(products), pickFields(sample, DEFAULTS), now, now));
    });
    return products;
  }

  // Continues with the given products after finding stored data that is
  // damaged. The damaged data is only overwritten once a copy has been set
  // aside.
  function recover(products) {
    console.warn('Stored inventory data was damaged; continuing with what could be read.');
    if (InventoryStore.backupProducts()) {
      InventoryStore.saveProducts(products);
    }
    cache = products;
    recovered = true;
  }

  // Returns the current products. Storage is read every time rather than
  // trusting the cache, so that changes made in another tab are never
  // overwritten with stale data.
  function readAll() {
    var result = persistent ? InventoryStore.loadProducts() : { status: 'unavailable' };
    if (result.status === 'ok') {
      var valid = keepValid(result.products);
      if (valid.length === result.products.length) {
        cache = valid;
      } else {
        recover(valid);
      }
    } else if (result.status === 'corrupt') {
      recover(cache || []);
    } else if (cache === null) {
      // Nothing stored and nothing loaded yet: this is the first run.
      cache = buildSamples();
      seeded = true;
      if (persistent) {
        InventoryStore.saveProducts(cache);
      }
    }
    return cache;
  }

  function writeAll(products) {
    if (persistent && !InventoryStore.saveProducts(products)) {
      return false;
    }
    cache = products;
    return true;
  }

  function notify() {
    listeners.slice().forEach(function (listener) {
      listener();
    });
  }

  function fail(errors) {
    return { ok: false, errors: errors };
  }

  function notFound() {
    return fail({ id: 'Product not found.' });
  }

  // Saves the new product list and reports the products the change was about.
  function commitAll(products, changed) {
    if (!writeAll(products)) {
      return fail({ storage: 'Could not save. Browser storage may be full or disabled.' });
    }
    notify();
    return { ok: true, products: changed.map(copy) };
  }

  // The same for a change that was about one product.
  function commit(products, product) {
    var result = commitAll(products, [product]);
    return result.ok ? { ok: true, product: result.products[0] } : result;
  }

  // Loads the inventory, creating the sample products on first run. Returns
  //   persistent  false if storage is unavailable and changes will be lost
  //   seeded      true if the sample products were just created
  //   recovered   true if damaged stored data had to be set aside
  function init() {
    readAll();
    return { persistent: persistent, seeded: seeded, recovered: recovered };
  }

  function getProducts() {
    return readAll().map(copy);
  }

  function getProduct(id) {
    var products = readAll();
    var index = indexOfId(products, id);
    return index === -1 ? null : copy(products[index]);
  }

  function addProduct(input) {
    var products = readAll();
    var fields = pickFields(isObject(input) ? input : {}, DEFAULTS);
    var errors = validate(fields, products, null);
    if (errors) {
      return fail(errors);
    }
    var now = new Date().toISOString();
    var product = makeProduct(newId(products), fields, now, now);
    return commit(products.concat([product]), product);
  }

  function updateAt(products, index, changes) {
    var existing = products[index];
    var fields = pickFields(changes, existing);
    var errors = validate(fields, products, existing.id);
    if (errors) {
      return fail(errors);
    }
    var product = makeProduct(existing.id, fields, existing.createdAt, new Date().toISOString());
    var updated = products.slice();
    updated[index] = product;
    return commit(updated, product);
  }

  // Changes the given fields of a product and leaves the rest as they are.
  function updateProduct(id, changes) {
    var products = readAll();
    var index = indexOfId(products, id);
    if (index === -1) {
      return notFound();
    }
    return updateAt(products, index, isObject(changes) ? changes : {});
  }

  // Adds delta units to a product's stock (negative to remove). Stock cannot
  // go below zero.
  function adjustStock(id, delta) {
    if (!Number.isInteger(delta)) {
      return fail({ quantity: 'Adjustment must be a whole number.' });
    }
    var products = readAll();
    var index = indexOfId(products, id);
    if (index === -1) {
      return notFound();
    }
    var inStock = products[index].quantity;
    if (inStock + delta < 0) {
      return fail({ quantity: 'Cannot remove ' + -delta + '; only ' + inStock + ' in stock.' });
    }
    return updateAt(products, index, { quantity: inStock + delta });
  }

  // Takes units of several products out of the stock in one change: all of
  // them, or none when any of them cannot be taken. items is a list of
  // { id, quantity }.
  function removeStock(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return fail({ quantity: 'There is nothing to remove.' });
    }
    var products = readAll().slice();
    // Where the products that were taken from are in the list.
    var changed = [];
    var now = new Date().toISOString();
    for (var i = 0; i < items.length; i++) {
      var item = isObject(items[i]) ? items[i] : {};
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        return fail({ quantity: 'Quantity must be a whole number, 1 or more.' });
      }
      var index = indexOfId(products, item.id);
      if (index === -1) {
        return notFound();
      }
      // An earlier item may have taken some of this product already.
      var existing = products[index];
      if (item.quantity > existing.quantity) {
        return fail({
          quantity: 'Cannot remove ' + item.quantity + ' of ' + existing.name +
            '; only ' + existing.quantity + ' in stock.'
        });
      }
      var product = copy(existing);
      product.quantity -= item.quantity;
      product.updatedAt = now;
      products[index] = product;
      if (changed.indexOf(index) === -1) {
        changed.push(index);
      }
    }
    return commitAll(products, changed.map(function (index) {
      return products[index];
    }));
  }

  function removeProduct(id) {
    var products = readAll();
    var index = indexOfId(products, id);
    if (index === -1) {
      return notFound();
    }
    var remaining = products.slice();
    var removed = remaining.splice(index, 1)[0];
    return commit(remaining, removed);
  }

  function isLowStock(product) {
    return product.quantity <= product.reorderLevel;
  }

  // Returns 'out' when there is no stock, 'low' when the stock is low, and
  // 'ok' otherwise.
  function stockStatus(product) {
    if (product.quantity === 0) {
      return 'out';
    }
    return isLowStock(product) ? 'low' : 'ok';
  }

  // Calls listener after every change to the products, whether made here or
  // in another tab. Returns a function that stops the calls.
  function subscribe(listener) {
    listeners.push(listener);
    return function () {
      var index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    };
  }

  InventoryStore.onExternalChange(notify);

  window.Inventory = {
    MAX_INTEGER: MAX_INTEGER,
    init: init,
    getProducts: getProducts,
    getProduct: getProduct,
    addProduct: addProduct,
    updateProduct: updateProduct,
    adjustStock: adjustStock,
    removeStock: removeStock,
    removeProduct: removeProduct,
    isLowStock: isLowStock,
    stockStatus: stockStatus,
    subscribe: subscribe
  };
})();
