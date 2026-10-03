/*
 * Shopping cart (global `Cart`): products picked from the inventory.
 *
 * Stored item shape:
 *   {
 *     productId: string   id of an inventory product
 *     quantity:  integer  units in the cart, >= 1
 *   }
 *
 * Only the product id and quantity are stored; name and price are read from
 * the inventory, so the cart always shows current prices. The cart does not
 * change stock. A product cannot be added beyond the units in stock.
 *
 * Mutating functions return { ok: true, item } on success or
 * { ok: false, errors: { field: message } } on failure, like `Inventory`.
 * Nothing changes in memory unless the save to localStorage succeeded.
 */
var Cart = (function () {
  'use strict';

  var items = [];

  // ---- helpers -----------------------------------------------------------

  function copy(item) {
    return { productId: item.productId, quantity: item.quantity };
  }

  function indexOfProduct(productId) {
    for (var i = 0; i < items.length; i++) {
      if (items[i].productId === productId) {
        return i;
      }
    }
    return -1;
  }

  function toQuantity(value) {
    if (typeof value === 'string' && value.trim() === '') {
      return NaN;
    }
    return Number(value);
  }

  function isWholeNumber(n) {
    return typeof n === 'number' && isFinite(n) && Math.floor(n) === n;
  }

  function toCents(amount) {
    return Math.round(amount * 100);
  }

  function commit(next) {
    if (!InventoryStore.saveCart(next)) {
      return false;
    }
    items = next;
    return true;
  }

  function saveFailed() {
    return {
      ok: false,
      errors: { storage: 'Could not save the cart to browser storage. It may be full or disabled.' }
    };
  }

  function notFound() {
    return { ok: false, errors: { product: 'That product no longer exists.' } };
  }

  function stockError(product) {
    var message = product.quantity === 0
      ? product.name + ' is out of stock.'
      : 'Only ' + product.quantity + ' of ' + product.name + ' in stock.';
    return { ok: false, errors: { quantity: message } };
  }

  /*
   * Stores `quantity` units of `product` (0 removes the item). Checks the
   * quantity against the stock.
   */
  function store(product, quantity) {
    if (!isWholeNumber(quantity) || quantity < 0) {
      return { ok: false, errors: { quantity: 'Quantity must be a whole number of 0 or more.' } };
    }
    var i = indexOfProduct(product.id);
    var next = items.slice();
    if (quantity === 0) {
      if (i !== -1) {
        next.splice(i, 1);
      }
    } else {
      if (quantity > product.quantity) {
        return stockError(product);
      }
      var item = { productId: product.id, quantity: quantity };
      if (i === -1) {
        next.push(item);
      } else {
        next[i] = item;
      }
    }
    if (!commit(next)) {
      return saveFailed();
    }
    return { ok: true, item: { productId: product.id, quantity: quantity } };
  }

  // ---- public API --------------------------------------------------------

  /*
   * Loads the cart from storage. Invalid records are dropped and duplicate
   * products merged. Items for products that no longer exist are kept until
   * prune() is called, so load order against Inventory does not matter.
   */
  function init() {
    var stored = InventoryStore.loadCart() || [];
    items = [];
    stored.forEach(function (record) {
      var quantity = record ? toQuantity(record.quantity) : NaN;
      if (!record || typeof record.productId !== 'string' || !record.productId ||
          !isWholeNumber(quantity) || quantity < 1) {
        console.warn('Skipping invalid cart record:', record);
        return;
      }
      var i = indexOfProduct(record.productId);
      if (i === -1) {
        items.push({ productId: record.productId, quantity: quantity });
      } else {
        items[i].quantity += quantity;
      }
    });
  }

  function getItems() {
    return items.map(copy);
  }

  /* Units of a product in the cart; 0 if it is not in the cart. */
  function getQuantity(productId) {
    var i = indexOfProduct(productId);
    return i === -1 ? 0 : items[i].quantity;
  }

  /* Adds `quantity` units (default 1) of a product. */
  function add(productId, quantity) {
    var product = Inventory.getById(productId);
    if (!product) {
      return notFound();
    }
    var n = quantity === undefined ? 1 : toQuantity(quantity);
    if (!isWholeNumber(n) || n < 1) {
      return { ok: false, errors: { quantity: 'Quantity must be a whole number of 1 or more.' } };
    }
    return store(product, getQuantity(productId) + n);
  }

  /* Sets the units of a product in the cart; 0 removes it. */
  function setQuantity(productId, quantity) {
    var product = Inventory.getById(productId);
    if (!product) {
      return notFound();
    }
    return store(product, toQuantity(quantity));
  }

  function remove(productId) {
    var i = indexOfProduct(productId);
    if (i === -1) {
      return { ok: false, errors: { product: 'That product is not in the cart.' } };
    }
    var removed = items[i];
    if (!commit(items.slice(0, i).concat(items.slice(i + 1)))) {
      return saveFailed();
    }
    return { ok: true, item: copy(removed) };
  }

  function clear() {
    if (!commit([])) {
      return saveFailed();
    }
    return { ok: true };
  }

  /*
   * Removes items whose product was deleted from the inventory. Returns the
   * number removed (0 if the save failed).
   */
  function prune() {
    var next = items.filter(function (item) {
      return Inventory.getById(item.productId) !== null;
    });
    var removed = items.length - next.length;
    if (removed === 0 || !commit(next)) {
      return 0;
    }
    return removed;
  }

  /*
   * Cart lines joined with current product data, in the order added:
   *   { productId, sku, name, price, quantity, inStock, lineTotal, overStock }
   * `overStock` is true when the stock fell below the cart quantity after the
   * item was added. Items whose product no longer exists are left out.
   */
  function getLines() {
    var lines = [];
    items.forEach(function (item) {
      var product = Inventory.getById(item.productId);
      if (!product) {
        return;
      }
      lines.push({
        productId: product.id,
        sku: product.sku,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        inStock: product.quantity,
        lineTotal: toCents(product.price) * item.quantity / 100,
        overStock: item.quantity > product.quantity
      });
    });
    return lines;
  }

  /* { lineCount, unitCount, total, overStockCount } for the current lines. */
  function getTotals() {
    var totals = { lineCount: 0, unitCount: 0, total: 0, overStockCount: 0 };
    var cents = 0;
    getLines().forEach(function (line) {
      totals.lineCount++;
      totals.unitCount += line.quantity;
      cents += toCents(line.price) * line.quantity;
      if (line.overStock) {
        totals.overStockCount++;
      }
    });
    totals.total = cents / 100;
    return totals;
  }

  return {
    init: init,
    getItems: getItems,
    getQuantity: getQuantity,
    getLines: getLines,
    getTotals: getTotals,
    add: add,
    setQuantity: setQuantity,
    remove: remove,
    clear: clear,
    prune: prune
  };
})();
