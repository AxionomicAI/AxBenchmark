// Persistence layer: the only file that touches localStorage.
// Exposes a single global, InventoryStore.
(function () {
  'use strict';

  var PRODUCTS_KEY = 'inventory.products';
  var BACKUP_KEY = 'inventory.products.backup';
  var CART_KEY = 'inventory.cart';
  var ORDERS_KEY = 'inventory.orders';
  var ORDERS_BACKUP_KEY = 'inventory.orders.backup';

  function isAvailable() {
    var probe = 'inventory.__probe__';
    try {
      window.localStorage.setItem(probe, '1');
      window.localStorage.removeItem(probe);
      return true;
    } catch (err) {
      return false;
    }
  }

  // Reads the array stored under key. Returns { status, items }, where status
  // is:
  //   'ok'          items is the stored array (its records are not checked here)
  //   'empty'       nothing has been stored yet
  //   'corrupt'     something is stored, but it is not a JSON array
  //   'unavailable' localStorage could not be read
  function load(key) {
    var raw;
    try {
      raw = window.localStorage.getItem(key);
    } catch (err) {
      return { status: 'unavailable' };
    }
    if (raw === null) {
      return { status: 'empty' };
    }
    try {
      var items = JSON.parse(raw);
      if (Array.isArray(items)) {
        return { status: 'ok', items: items };
      }
    } catch (err) {
      // Not JSON; reported as corrupt below.
    }
    return { status: 'corrupt' };
  }

  // Replaces the array stored under key. Returns false if the write failed
  // (storage disabled or quota exceeded).
  function save(key, items) {
    try {
      window.localStorage.setItem(key, JSON.stringify(items));
      return true;
    } catch (err) {
      console.error('Could not save ' + key + '.', err);
      return false;
    }
  }

  // Reads the stored products. Returns { status, products }; see load.
  function loadProducts() {
    var result = load(PRODUCTS_KEY);
    return { status: result.status, products: result.items };
  }

  function saveProducts(products) {
    return save(PRODUCTS_KEY, products);
  }

  // Reads the stored cart lines. Returns { status, lines }; see load.
  function loadCart() {
    var result = load(CART_KEY);
    return { status: result.status, lines: result.items };
  }

  function saveCart(lines) {
    return save(CART_KEY, lines);
  }

  // Reads the stored orders. Returns { status, orders }; see load.
  function loadOrders() {
    var result = load(ORDERS_KEY);
    return { status: result.status, orders: result.items };
  }

  function saveOrders(orders) {
    return save(ORDERS_KEY, orders);
  }

  // Copies whatever is stored under key right now, unparsed, to backupKey, so
  // that damaged data can be set aside before it is overwritten. Returns
  // false if the copy could not be made.
  function backup(key, backupKey) {
    try {
      var raw = window.localStorage.getItem(key);
      if (raw !== null) {
        window.localStorage.setItem(backupKey, raw);
      }
      return true;
    } catch (err) {
      console.error('Could not back up ' + key + '.', err);
      return false;
    }
  }

  function backupProducts() {
    return backup(PRODUCTS_KEY, BACKUP_KEY);
  }

  function backupOrders() {
    return backup(ORDERS_KEY, ORDERS_BACKUP_KEY);
  }

  function onChange(key, callback) {
    window.addEventListener('storage', function (event) {
      // A null key means the whole storage area was cleared.
      if (event.key === key || event.key === null) {
        callback();
      }
    });
  }

  // Calls callback whenever another tab or window changes the stored products.
  function onExternalChange(callback) {
    onChange(PRODUCTS_KEY, callback);
  }

  // Calls callback whenever another tab or window changes the stored cart.
  function onExternalCartChange(callback) {
    onChange(CART_KEY, callback);
  }

  // Calls callback whenever another tab or window changes the stored orders.
  function onExternalOrdersChange(callback) {
    onChange(ORDERS_KEY, callback);
  }

  window.InventoryStore = {
    isAvailable: isAvailable,
    loadProducts: loadProducts,
    saveProducts: saveProducts,
    backupProducts: backupProducts,
    onExternalChange: onExternalChange,
    loadCart: loadCart,
    saveCart: saveCart,
    onExternalCartChange: onExternalCartChange,
    loadOrders: loadOrders,
    saveOrders: saveOrders,
    backupOrders: backupOrders,
    onExternalOrdersChange: onExternalOrdersChange
  };
})();
