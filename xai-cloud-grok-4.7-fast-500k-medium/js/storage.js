/* Persistence for inventory records, the shopping cart, and order history. Each is a JSON array under its own key. */
const InventoryStorage = (function () {
  const KEY = "inventory.items";
  const CART_KEY = "inventory.cart";
  const ORDERS_KEY = "inventory.orders";

  function hasStored() {
    return localStorage.getItem(KEY) !== null;
  }

  function read(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function write(key, items, label) {
    if (!Array.isArray(items)) {
      throw new Error(label + " data must be an array.");
    }
    localStorage.setItem(key, JSON.stringify(items));
  }

  function load() {
    return read(KEY);
  }

  function save(items) {
    write(KEY, items, "Inventory");
  }

  function loadCart() {
    return read(CART_KEY);
  }

  function saveCart(items) {
    write(CART_KEY, items, "Cart");
  }

  function hasOrders() {
    return localStorage.getItem(ORDERS_KEY) !== null;
  }

  function loadOrders() {
    return read(ORDERS_KEY);
  }

  function saveOrders(items) {
    write(ORDERS_KEY, items, "Orders");
  }

  function clearOrders() {
    localStorage.removeItem(ORDERS_KEY);
  }

  return {
    KEY,
    CART_KEY,
    ORDERS_KEY,
    hasStored,
    load,
    save,
    loadCart,
    saveCart,
    hasOrders,
    loadOrders,
    saveOrders,
    clearOrders
  };
})();
