// Cart: the products the user has picked and how many of each. Looks the
// products up in Inventory (js/inventory.js) and persists through
// InventoryStore (js/storage.js). Exposes a single global, Cart.
//
// What is stored is a list of lines, in the order the products were added:
//   [{ productId: 'mf3k2a9x1q7c', quantity: 2 }]
// Names, prices and stock are not stored. They are read from the inventory
// every time, so the cart always shows the current ones.
(function () {
  'use strict';

  var persistent = InventoryStore.isAvailable();
  var listeners = [];

  // The stored lines as last read or written. When storage is unavailable
  // this is the only copy, so the cart still works until the page is closed.
  var cache = [];

  function isObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  function isQuantity(value) {
    return Number.isInteger(value) && value >= 1;
  }

  function indexOfProduct(lines, productId) {
    for (var i = 0; i < lines.length; i++) {
      if (lines[i].productId === productId) {
        return i;
      }
    }
    return -1;
  }

  // Returns the stored records that are valid lines. A cart is cheap to fill
  // again, so anything else is dropped without keeping a copy.
  function keepValid(records) {
    var lines = [];
    records.forEach(function (record) {
      if (isObject(record) && typeof record.productId === 'string' &&
          isQuantity(record.quantity) && record.quantity <= Inventory.MAX_INTEGER &&
          indexOfProduct(lines, record.productId) === -1) {
        lines.push({ productId: record.productId, quantity: record.quantity });
      }
    });
    return lines;
  }

  // Returns the stored lines. Storage is read every time rather than trusting
  // the cache, so that changes made in another tab are never overwritten.
  function readLines() {
    var result = persistent ? InventoryStore.loadCart() : { status: 'unavailable' };
    if (result.status === 'ok') {
      cache = keepValid(result.lines);
    } else if (result.status !== 'unavailable') {
      // Nothing is stored, or nothing that can be read: the cart is empty.
      cache = [];
    }
    return cache;
  }

  // Returns the stored lines whose products still exist, and the products by
  // id. A line whose product has been deleted is left out here, and so is
  // gone from storage the next time the cart is saved.
  function current() {
    var products = new Map();
    Inventory.getProducts().forEach(function (product) {
      products.set(product.id, product);
    });
    var lines = readLines().filter(function (line) {
      return products.has(line.productId);
    });
    return { lines: lines, products: products };
  }

  // A line as the API returns it: with its product instead of the id.
  function describe(line, product) {
    return {
      product: product,
      quantity: line.quantity,
      subtotalCents: product.priceCents * line.quantity
    };
  }

  function notify() {
    listeners.slice().forEach(function (listener) {
      listener();
    });
  }

  function fail(errors) {
    return { ok: false, errors: errors };
  }

  function badQuantity() {
    return fail({ quantity: 'Quantity must be a whole number, 1 or more.' });
  }

  // Why the cart cannot hold more of a product. inCart is how many it holds
  // already, when that is part of the reason.
  function notEnough(product, inCart) {
    if (product.quantity === 0) {
      return fail({ quantity: 'This product is out of stock.' });
    }
    return fail({
      quantity: 'Only ' + product.quantity + ' in stock' +
        (inCart ? ', and the cart already has ' + inCart + '.' : '.')
    });
  }

  // Saves the new lines and tells the subscribers. Returns the failure to
  // report when they could not be saved, or null.
  function save(lines) {
    if (persistent && !InventoryStore.saveCart(lines)) {
      return fail({ storage: 'Could not save. Browser storage may be full or disabled.' });
    }
    cache = lines;
    notify();
    return null;
  }

  // Saves the new lines and reports the line the change was about.
  function commit(lines, line, product) {
    return save(lines) || { ok: true, line: describe(line, product) };
  }

  // Returns what is in the cart:
  //   lines       { product, quantity, subtotalCents } for each product, in the
  //               order they were added. quantity is how many are in the cart;
  //               product.quantity is how many are in stock
  //   units       the quantities added up
  //   totalCents  the subtotals added up
  function getCart() {
    var state = current();
    var cart = { lines: [], units: 0, totalCents: 0 };
    state.lines.forEach(function (stored) {
      var line = describe(stored, state.products.get(stored.productId));
      cart.lines.push(line);
      cart.units += line.quantity;
      cart.totalCents += line.subtotalCents;
    });
    return cart;
  }

  // How many of a product are in the cart; 0 if it is not in it.
  function quantityOf(productId) {
    var lines = current().lines;
    var index = indexOfProduct(lines, productId);
    return index === -1 ? 0 : lines[index].quantity;
  }

  // Puts quantity more units of a product (1 if left out) in the cart. The
  // cart cannot hold more than is in stock.
  function add(productId, quantity) {
    if (quantity === undefined) {
      quantity = 1;
    }
    if (!isQuantity(quantity)) {
      return badQuantity();
    }
    var state = current();
    var product = state.products.get(productId);
    if (!product) {
      return fail({ id: 'Product not found.' });
    }
    var lines = state.lines.slice();
    var index = indexOfProduct(lines, productId);
    var inCart = index === -1 ? 0 : lines[index].quantity;
    if (inCart + quantity > product.quantity) {
      return notEnough(product, inCart);
    }
    var line = { productId: productId, quantity: inCart + quantity };
    if (index === -1) {
      lines.push(line);
    } else {
      lines[index] = line;
    }
    return commit(lines, line, product);
  }

  // Changes how many of a product are in the cart. The quantity cannot be
  // raised above the stock, but it can always be lowered: the cart may hold
  // more than the stock when the stock has gone down since.
  function setQuantity(productId, quantity) {
    if (!isQuantity(quantity)) {
      return badQuantity();
    }
    var state = current();
    var lines = state.lines.slice();
    var index = indexOfProduct(lines, productId);
    if (index === -1) {
      return fail({ id: 'Product is not in the cart.' });
    }
    var product = state.products.get(productId);
    if (quantity > product.quantity && quantity > lines[index].quantity) {
      return notEnough(product, 0);
    }
    var line = { productId: productId, quantity: quantity };
    lines[index] = line;
    return commit(lines, line, product);
  }

  // Takes a product out of the cart.
  function remove(productId) {
    var state = current();
    var lines = state.lines.slice();
    var index = indexOfProduct(lines, productId);
    if (index === -1) {
      return fail({ id: 'Product is not in the cart.' });
    }
    var removed = lines.splice(index, 1)[0];
    return commit(lines, removed, state.products.get(productId));
  }

  // Takes every product out of the cart.
  function clear() {
    return save([]) || { ok: true };
  }

  // Calls listener after every change to the lines, whether made here or in
  // another tab. A change to a product in the cart (its price, say) is a
  // change to the inventory: subscribe to Inventory for those. Returns a
  // function that stops the calls.
  function subscribe(listener) {
    listeners.push(listener);
    return function () {
      var index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    };
  }

  InventoryStore.onExternalCartChange(notify);

  window.Cart = {
    getCart: getCart,
    quantityOf: quantityOf,
    add: add,
    setQuantity: setQuantity,
    remove: remove,
    clear: clear,
    subscribe: subscribe
  };
})();
