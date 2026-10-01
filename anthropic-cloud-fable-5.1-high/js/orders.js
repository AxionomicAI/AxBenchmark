// Orders: checkout, and the history of the orders it has placed. Checkout
// buys what is in Cart (js/cart.js), takes it out of the stock through
// Inventory (js/inventory.js) and persists the order through InventoryStore
// (js/storage.js). Exposes a single global, Orders.
//
// What is stored is a list of orders, in the order they were placed:
//   [{
//     number: 1,                           1 for the first order, then 2, ...
//     placedAt: '2026-10-01T09:30:00.000Z',
//     lines: [{ productId: 'mf3k2a9x1q7c', name: 'Wireless Mouse',
//               sku: 'ELC-MSE-210', priceCents: 1999, quantity: 2 }]
//   }]
// Unlike the cart, an order keeps the name, SKU and price of its products as
// they were at checkout: it does not follow later changes to the inventory,
// and outlives products that are deleted.
(function () {
  'use strict';

  var STORAGE_FAILURE = 'Could not save. Browser storage may be full or disabled.';

  var persistent = InventoryStore.isAvailable();
  var recovered = false;
  var listeners = [];

  // The stored orders as last read or written. When storage is unavailable
  // this is the only copy, so the history is kept until the page is closed.
  var cache = [];

  function isObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  function isTimestamp(value) {
    return typeof value === 'string' && !isNaN(Date.parse(value));
  }

  function isIntegerBetween(value, min, max) {
    return Number.isInteger(value) && value >= min && value <= max;
  }

  // Returns the record as a line with only the stored fields, or null if it
  // is not a valid line.
  function toLine(record) {
    if (!isObject(record) || typeof record.productId !== 'string' ||
        typeof record.name !== 'string' || typeof record.sku !== 'string' ||
        !isIntegerBetween(record.priceCents, 0, Inventory.MAX_INTEGER) ||
        !isIntegerBetween(record.quantity, 1, Inventory.MAX_INTEGER)) {
      return null;
    }
    return {
      productId: record.productId,
      name: record.name,
      sku: record.sku,
      priceCents: record.priceCents,
      quantity: record.quantity
    };
  }

  // Returns the stored records that are valid orders. An order with a line
  // that is not valid is not valid: what is left of it would have another
  // total.
  function keepValid(records) {
    var orders = [];
    var numbers = new Set();
    records.forEach(function (record) {
      if (!isObject(record) || !Number.isSafeInteger(record.number) || record.number < 1 ||
          numbers.has(record.number) || !isTimestamp(record.placedAt) ||
          !Array.isArray(record.lines) || record.lines.length === 0) {
        return;
      }
      var lines = record.lines.map(toLine);
      if (lines.indexOf(null) === -1) {
        numbers.add(record.number);
        orders.push({ number: record.number, placedAt: record.placedAt, lines: lines });
      }
    });
    return orders;
  }

  // Continues with the given orders after finding stored data that is
  // damaged. A history cannot be made again, so the damaged data is only
  // overwritten once a copy has been set aside.
  function recover(orders) {
    console.warn('Stored order data was damaged; continuing with what could be read.');
    if (InventoryStore.backupOrders()) {
      InventoryStore.saveOrders(orders);
    }
    cache = orders;
    recovered = true;
  }

  // Returns the stored orders. Storage is read every time rather than
  // trusting the cache, so that orders placed in another tab are never
  // overwritten.
  function readOrders() {
    var result = persistent ? InventoryStore.loadOrders() : { status: 'unavailable' };
    if (result.status === 'ok') {
      var valid = keepValid(result.orders);
      if (valid.length === result.orders.length) {
        cache = valid;
      } else {
        recover(valid);
      }
    } else if (result.status === 'corrupt') {
      recover(cache);
    } else if (result.status === 'empty') {
      cache = [];
    }
    return cache;
  }

  function writeOrders(orders) {
    if (persistent && !InventoryStore.saveOrders(orders)) {
      return false;
    }
    cache = orders;
    return true;
  }

  // An order as the API returns it: a copy, with the subtotals and totals
  // worked out.
  function describe(order) {
    var described = { number: order.number, placedAt: order.placedAt, lines: [], units: 0, totalCents: 0 };
    order.lines.forEach(function (line) {
      var subtotalCents = line.priceCents * line.quantity;
      described.lines.push({
        productId: line.productId,
        name: line.name,
        sku: line.sku,
        priceCents: line.priceCents,
        quantity: line.quantity,
        subtotalCents: subtotalCents
      });
      described.units += line.quantity;
      described.totalCents += subtotalCents;
    });
    return described;
  }

  function notify() {
    listeners.slice().forEach(function (listener) {
      listener();
    });
  }

  function fail(errors) {
    return { ok: false, errors: errors };
  }

  // Says which products the stock cannot cover. short holds their cart lines.
  function notEnough(short) {
    if (short.length > 1) {
      return short.length + ' products in the cart have less in stock than the cart holds.';
    }
    var product = short[0].product;
    if (product.quantity === 0) {
      return '“' + product.name + '” is out of stock.';
    }
    return 'Only ' + product.quantity + ' of “' + product.name + '” in stock, and the cart has ' +
      short[0].quantity + '.';
  }

  // Checks whether a cart (from Cart.getCart()) can be checked out. Returns
  // what stops it as a map with one key and its message, or null:
  //   cart   the cart is empty
  //   stock  a product has less in stock than the cart holds
  //   total  the total is too large to be exact
  function checkCart(cart) {
    if (cart.lines.length === 0) {
      return { cart: 'The cart is empty.' };
    }
    var short = cart.lines.filter(function (line) {
      return line.quantity > line.product.quantity;
    });
    if (short.length > 0) {
      return { stock: notEnough(short) };
    }
    // An order is a record, so it is not placed with a total that has been
    // rounded.
    if (!Number.isSafeInteger(cart.totalCents)) {
      return { total: 'The total is too large for one order.' };
    }
    return null;
  }

  function nextNumber(orders) {
    return orders.reduce(function (highest, order) {
      return Math.max(highest, order.number);
    }, 0) + 1;
  }

  // Buys everything in the cart: records it as an order, takes it out of the
  // stock and empties the cart. Returns { ok: true, order, cartCleared } or
  // { ok: false, errors }, with the keys of checkCart or storage. Nothing is
  // changed when the result is not ok.
  function checkout() {
    var cart = Cart.getCart();
    var errors = checkCart(cart);
    if (errors) {
      return fail(errors);
    }

    var orders = readOrders();
    var order = {
      number: nextNumber(orders),
      placedAt: new Date().toISOString(),
      lines: cart.lines.map(function (line) {
        return {
          productId: line.product.id,
          name: line.product.name,
          sku: line.product.sku,
          priceCents: line.product.priceCents,
          quantity: line.quantity
        };
      })
    };

    // The order is saved first. The history is the only thing here that
    // grows, so this is the save that fails when storage is full, and
    // nothing else has been changed yet.
    if (!writeOrders(orders.concat([order]))) {
      return fail({ storage: STORAGE_FAILURE });
    }

    var removal = Inventory.removeStock(order.lines.map(function (line) {
      return { id: line.productId, quantity: line.quantity };
    }));
    if (!removal.ok) {
      // Nothing was taken out of the stock, so the order is taken back.
      if (!writeOrders(orders)) {
        console.error('Could not take back order ' + order.number + ', which was not completed.');
      }
      return fail(removal.errors.storage
        ? { storage: STORAGE_FAILURE }
        // The stock was changed in another tab since the cart was checked.
        : { stock: removal.errors.quantity || removal.errors.id });
    }

    // The purchase is complete, and stays so if the cart cannot be emptied;
    // the caller is told, because checking out again would buy it twice.
    var cartCleared = Cart.clear().ok;
    notify();
    return { ok: true, order: describe(order), cartCleared: cartCleared };
  }

  // Loads the order history. Returns
  //   recovered   true if damaged stored data had to be set aside
  function init() {
    readOrders();
    return { recovered: recovered };
  }

  // Returns the orders, in the order they were placed. Each is
  //   number      1 for the first order, then 2, and so on
  //   placedAt    ISO 8601 timestamp of the checkout
  //   lines       { productId, name, sku, priceCents, quantity, subtotalCents }
  //               for each product, as they were at checkout
  //   units       the quantities added up
  //   totalCents  the subtotals added up
  function getOrders() {
    return readOrders().map(describe);
  }

  // Calls listener after every order placed, whether here or in another tab.
  // Returns a function that stops the calls.
  function subscribe(listener) {
    listeners.push(listener);
    return function () {
      var index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    };
  }

  InventoryStore.onExternalOrdersChange(notify);

  window.Orders = {
    init: init,
    getOrders: getOrders,
    checkCart: checkCart,
    checkout: checkout,
    subscribe: subscribe
  };
})();
