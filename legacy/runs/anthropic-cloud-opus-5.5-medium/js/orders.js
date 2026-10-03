/*
 * Checkout and order history (global `Orders`).
 *
 * Stored order shape:
 *   {
 *     id:        string   unique, generated
 *     number:    integer  1, 2, 3 ... in the order placed
 *     createdAt: string   ISO timestamp
 *     note:      string   optional, e.g. a customer name; may be empty
 *     lines: [{
 *       productId: string   the product at the time of the order
 *       sku:       string   \
 *       name:      string    } copied, so the order stays readable if the
 *       price:     number   /  product is later edited or deleted
 *       quantity:  integer  >= 1
 *       lineTotal: number
 *     }]
 *     unitCount: integer  sum of the line quantities
 *     total:     number   sum of the line totals
 *   }
 *
 * checkout() turns the cart into an order: it records the order, takes the
 * units out of stock and empties the cart. The three are saved under
 * separate localStorage keys, so if a later save fails the earlier ones are
 * undone. Like `Inventory` and `Cart`, it returns { ok: true, order } or
 * { ok: false, errors: { field: message } }.
 */
var Orders = (function () {
  'use strict';

  var NOTE_MAX_LENGTH = 200;

  // Oldest first, as stored.
  var orders = [];

  // ---- helpers -----------------------------------------------------------

  function copyLine(line) {
    return {
      productId: line.productId,
      sku: line.sku,
      name: line.name,
      price: line.price,
      quantity: line.quantity,
      lineTotal: line.lineTotal
    };
  }

  function copy(order) {
    return {
      id: order.id,
      number: order.number,
      createdAt: order.createdAt,
      note: order.note,
      lines: order.lines.map(copyLine),
      unitCount: order.unitCount,
      total: order.total
    };
  }

  function generateId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      try {
        return crypto.randomUUID();
      } catch (ignored) {
        // randomUUID can be unavailable outside secure contexts.
      }
    }
    return 'o-' + Date.now().toString(36) + '-' +
      Math.random().toString(36).slice(2, 10);
  }

  function toText(value) {
    return value === undefined || value === null ? '' : String(value).trim();
  }

  function toCents(amount) {
    return Math.round(amount * 100);
  }

  function isPositiveInteger(n) {
    return typeof n === 'number' && isFinite(n) && n >= 1 && Math.floor(n) === n;
  }

  function nextNumber() {
    var max = 0;
    orders.forEach(function (order) {
      max = Math.max(max, order.number);
    });
    return max + 1;
  }

  function saveFailed() {
    return {
      ok: false,
      errors: { storage: 'Could not save the order to browser storage. It may be full or disabled. Nothing was changed.' }
    };
  }

  /* Builds the order line and total from line data, in whole cents. */
  function buildTotals(lines) {
    var cents = 0;
    var units = 0;
    lines.forEach(function (line) {
      var lineCents = toCents(line.price) * line.quantity;
      line.lineTotal = lineCents / 100;
      cents += lineCents;
      units += line.quantity;
    });
    return { unitCount: units, total: cents / 100 };
  }

  /*
   * Normalizes an order read from storage; returns null if it is unusable.
   * Totals are recomputed from the lines.
   */
  function fromStored(record, seenIds) {
    if (!record || typeof record !== 'object' || typeof record.id !== 'string' ||
        !record.id || seenIds[record.id] || !Array.isArray(record.lines)) {
      return null;
    }
    var lines = [];
    record.lines.forEach(function (line) {
      if (!line || typeof line !== 'object') {
        return;
      }
      var quantity = Number(line.quantity);
      var price = Number(line.price);
      if (!isPositiveInteger(quantity) || !(isFinite(price) && price >= 0)) {
        return;
      }
      lines.push({
        productId: toText(line.productId),
        sku: toText(line.sku),
        name: toText(line.name) || '(unnamed product)',
        price: Math.round(price * 100) / 100,
        quantity: quantity
      });
    });
    if (lines.length === 0) {
      return null;
    }
    var number = Number(record.number);
    seenIds[record.id] = true;
    var totals = buildTotals(lines);
    return {
      id: record.id,
      number: isPositiveInteger(number) ? number : 0,
      createdAt: typeof record.createdAt === 'string' ? record.createdAt : '',
      note: toText(record.note).slice(0, NOTE_MAX_LENGTH),
      lines: lines,
      unitCount: totals.unitCount,
      total: totals.total
    };
  }

  /* Best-effort undo of an earlier save during checkout. */
  function undo(label, ok) {
    if (!ok) {
      console.error('Checkout: could not undo the ' + label + ' change; data may be inconsistent.');
    }
  }

  // ---- public API --------------------------------------------------------

  /* Loads the order history from storage, dropping invalid records. */
  function init() {
    var stored = InventoryStore.loadOrders() || [];
    var seenIds = {};
    orders = [];
    stored.forEach(function (record) {
      var order = fromStored(record, seenIds);
      if (order) {
        orders.push(order);
      } else {
        console.warn('Skipping invalid order record:', record);
      }
    });
  }

  /* All orders, newest first. */
  function getAll() {
    return orders.map(copy).reverse();
  }

  function getById(id) {
    for (var i = 0; i < orders.length; i++) {
      if (orders[i].id === id) {
        return copy(orders[i]);
      }
    }
    return null;
  }

  /* { orderCount, unitCount, total } across all orders. */
  function getSummary() {
    var cents = 0;
    var units = 0;
    orders.forEach(function (order) {
      cents += toCents(order.total);
      units += order.unitCount;
    });
    return { orderCount: orders.length, unitCount: units, total: cents / 100 };
  }

  /*
   * Places an order for everything in the cart at current prices.
   *   options.note: optional text stored with the order
   * Fails without changing anything if the cart is empty, a product no
   * longer exists, a quantity is above the stock, or a save fails.
   */
  function checkout(options) {
    options = options || {};
    var note = toText(options.note);
    if (note.length > NOTE_MAX_LENGTH) {
      return { ok: false, errors: { note: 'Note must be ' + NOTE_MAX_LENGTH + ' characters or fewer.' } };
    }

    var items = Cart.getItems();
    if (items.length === 0) {
      return { ok: false, errors: { cart: 'The cart is empty.' } };
    }

    var lines = [];
    for (var i = 0; i < items.length; i++) {
      var product = Inventory.getById(items[i].productId);
      if (!product) {
        return { ok: false, errors: { product: 'A product in the cart no longer exists.' } };
      }
      if (items[i].quantity > product.quantity) {
        return {
          ok: false,
          errors: {
            quantity: product.quantity === 0
              ? product.name + ' is out of stock.'
              : 'Only ' + product.quantity + ' of ' + product.name + ' in stock.'
          }
        };
      }
      lines.push({
        productId: product.id,
        sku: product.sku,
        name: product.name,
        price: product.price,
        quantity: items[i].quantity
      });
    }

    var totals = buildTotals(lines);
    var order = {
      id: generateId(),
      number: nextNumber(),
      createdAt: new Date().toISOString(),
      note: note,
      lines: lines,
      unitCount: totals.unitCount,
      total: totals.total
    };

    // 1. Record the order.
    var previous = orders;
    var next = orders.concat([order]);
    if (!InventoryStore.saveOrders(next)) {
      return saveFailed();
    }

    // 2. Take the units out of stock (one save for all products).
    var removal = lines.map(function (line) {
      return { id: line.productId, delta: -line.quantity };
    });
    var stock = Inventory.adjustStockMany(removal);
    if (!stock.ok) {
      undo('order history', InventoryStore.saveOrders(previous));
      return stock.errors.storage ? saveFailed() : stock;
    }

    // 3. Empty the cart.
    if (!Cart.clear().ok) {
      var restock = lines.map(function (line) {
        return { id: line.productId, delta: line.quantity };
      });
      undo('stock', Inventory.adjustStockMany(restock).ok);
      undo('order history', InventoryStore.saveOrders(previous));
      return saveFailed();
    }

    orders = next;
    return { ok: true, order: copy(order) };
  }

  return {
    NOTE_MAX_LENGTH: NOTE_MAX_LENGTH,
    init: init,
    getAll: getAll,
    getById: getById,
    getSummary: getSummary,
    checkout: checkout
  };
})();
