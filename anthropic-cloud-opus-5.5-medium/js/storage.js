/*
 * Storage layer: all persistence goes through this object.
 * Data is kept in localStorage as JSON, one key per collection.
 * This layer only reads and writes raw records; validation and business
 * rules live in inventory.js, cart.js and orders.js.
 */
var InventoryStore = (function () {
  var KEY = 'inventory.products.v1';
  var CART_KEY = 'inventory.cart.v1';
  var ORDERS_KEY = 'inventory.orders.v1';

  /*
   * Returns the array stored under `key`, or null if nothing has been stored
   * yet (first run). Unreadable data is copied to `key + '.corrupt'` so it is
   * not lost when the next save overwrites it, and an empty array is returned.
   */
  function loadArray(key, label) {
    var raw;
    try {
      raw = localStorage.getItem(key);
    } catch (err) {
      console.error('Failed to read ' + label + ' from localStorage:', err);
      return [];
    }
    if (raw === null) {
      return null;
    }
    var corruptKey = key + '.corrupt';
    try {
      var records = JSON.parse(raw);
      if (Array.isArray(records)) {
        return records;
      }
      throw new Error('Stored ' + label + ' is not an array');
    } catch (err) {
      console.error('Stored ' + label + ' is unreadable; backed up to "' +
        corruptKey + '":', err);
      try {
        localStorage.setItem(corruptKey, raw);
      } catch (ignored) {
        // Nothing more we can do; the error is already logged.
      }
      return [];
    }
  }

  function saveArray(key, label, records) {
    try {
      localStorage.setItem(key, JSON.stringify(records));
      return true;
    } catch (err) {
      console.error('Failed to save ' + label + ' to localStorage:', err);
      return false;
    }
  }

  function loadProducts() {
    return loadArray(KEY, 'inventory');
  }

  function saveProducts(products) {
    return saveArray(KEY, 'inventory', products);
  }

  function loadCart() {
    return loadArray(CART_KEY, 'cart');
  }

  function saveCart(items) {
    return saveArray(CART_KEY, 'cart', items);
  }

  function loadOrders() {
    return loadArray(ORDERS_KEY, 'orders');
  }

  function saveOrders(orders) {
    return saveArray(ORDERS_KEY, 'orders', orders);
  }

  function clear() {
    try {
      localStorage.removeItem(KEY);
    } catch (err) {
      console.error('Failed to clear inventory from localStorage:', err);
    }
  }

  return {
    KEY: KEY,
    CART_KEY: CART_KEY,
    ORDERS_KEY: ORDERS_KEY,
    loadProducts: loadProducts,
    saveProducts: saveProducts,
    loadCart: loadCart,
    saveCart: saveCart,
    loadOrders: loadOrders,
    saveOrders: saveOrders,
    clear: clear
  };
})();
