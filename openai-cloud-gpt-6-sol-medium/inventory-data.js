"use strict";

// Keep storage behind one API so the page and future inventory features use
// the same product shape: { id, name, stock, priceCents }.
const InventoryStore = (() => {
  const STORAGE_KEY = "inventory-products";
  const LEGACY_KEY = "inventory-items";
  const CART_KEY = "inventory-cart";
  const ORDERS_KEY = "inventory-orders";
  const SAMPLE_PRODUCTS = [
    { id: "sample-notebook", name: "Notebook", stock: 24, priceCents: 350 },
    { id: "sample-pen", name: "Ballpoint pen", stock: 48, priceCents: 125 },
    { id: "sample-folder", name: "File folder", stock: 12, priceCents: 500 },
  ];

  function validPrice(value) {
    return Number.isSafeInteger(value) && value >= 0;
  }

  function isProduct(value) {
    return value && typeof value.id === "string" && value.id.length > 0 &&
      typeof value.name === "string" && value.name.trim().length > 0 &&
      Number.isSafeInteger(value.stock) && value.stock >= 0 && validPrice(value.priceCents);
  }

  function withPrice(value) {
    return { ...value, priceCents: value.priceCents ?? 0 };
  }

  function readProducts(raw) {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((item) => item && typeof item === "object").map(withPrice).filter(isProduct) : [];
    } catch {
      return [];
    }
  }

  function readLegacyItems(raw) {
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((item) => ({
        id: item?.id,
        name: item?.name,
        stock: item?.quantity,
        priceCents: 0,
      })).filter(isProduct);
    } catch {
      return [];
    }
  }

  function saveProducts(products) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  }

  function getProducts() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) return readProducts(saved);

    const legacy = localStorage.getItem(LEGACY_KEY);
    const products = legacy === null
      ? SAMPLE_PRODUCTS.map((product) => ({ ...product }))
      : readLegacyItems(legacy);
    saveProducts(products);
    return products;
  }

  function addProduct(name, stock, priceCents = 0) {
    const product = {
      id: `${Date.now()}-${Math.random()}`,
      name: typeof name === "string" ? name.trim() : "",
      stock,
      priceCents,
    };
    if (!isProduct(product)) throw new TypeError("Enter a name, stock, and a nonnegative price.");
    saveProducts([...getProducts(), product]);
    return product;
  }

  function updateStock(id, stock) {
    if (!Number.isSafeInteger(stock) || stock < 0) {
      throw new TypeError("Stock must be a nonnegative whole number.");
    }
    const products = getProducts();
    const product = products.find((entry) => entry.id === id);
    if (!product) return false;
    product.stock = stock;
    saveProducts(products);
    return true;
  }

  function updateProduct(id, name, stock, priceCents) {
    const trimmedName = typeof name === "string" ? name.trim() : "";
    const products = getProducts();
    const product = products.find((entry) => entry.id === id);
    if (!product) return false;
    const nextPrice = priceCents === undefined ? product.priceCents : priceCents;
    if (!trimmedName || !Number.isSafeInteger(stock) || stock < 0 || !validPrice(nextPrice)) {
      throw new TypeError("Enter a name, stock, and a nonnegative price.");
    }
    product.name = trimmedName;
    product.stock = stock;
    product.priceCents = nextPrice;
    saveProducts(products);
    return true;
  }

  function removeProduct(id) {
    const products = getProducts();
    const remaining = products.filter((product) => product.id !== id);
    if (remaining.length === products.length) return false;
    saveProducts(remaining);
    removeFromCart(id);
    return true;
  }

  function getCart() {
    let saved;
    try {
      saved = JSON.parse(localStorage.getItem(CART_KEY));
    } catch {
      saved = [];
    }
    const products = new Map(getProducts().map((product) => [product.id, product]));
    const seen = new Set();
    const cart = (Array.isArray(saved) ? saved : []).flatMap((entry) => {
      const product = products.get(entry?.id);
      if (!product || seen.has(entry.id) || !Number.isSafeInteger(entry.quantity) || entry.quantity < 1) return [];
      seen.add(entry.id);
      const quantity = Math.min(entry.quantity, product.stock);
      return quantity ? [{ id: entry.id, quantity }] : [];
    });
    if (JSON.stringify(cart) !== localStorage.getItem(CART_KEY)) saveCart(cart);
    return cart;
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  function setCartQuantity(id, quantity) {
    if (!Number.isSafeInteger(quantity) || quantity < 0) throw new TypeError("Quantity must be a nonnegative whole number.");
    const product = getProducts().find((entry) => entry.id === id);
    if (!product || quantity > product.stock) return false;
    const cart = getCart().filter((entry) => entry.id !== id);
    if (quantity) cart.push({ id, quantity });
    saveCart(cart);
    return true;
  }

  function addToCart(id) {
    const current = getCart().find((entry) => entry.id === id)?.quantity ?? 0;
    return setCartQuantity(id, current + 1);
  }

  function removeFromCart(id) {
    saveCart(getCart().filter((entry) => entry.id !== id));
  }

  function getOrders() {
    try {
      const orders = JSON.parse(localStorage.getItem(ORDERS_KEY));
      if (!Array.isArray(orders)) return [];
      return orders.filter((order) => order && typeof order.id === "string" &&
        typeof order.placedAt === "string" && Number.isFinite(Date.parse(order.placedAt)) &&
        Array.isArray(order.items) && order.items.length > 0 &&
        order.items.every((item) => item && typeof item.productId === "string" &&
          typeof item.name === "string" && Number.isSafeInteger(item.quantity) && item.quantity > 0 &&
          validPrice(item.priceCents) && validPrice(item.subtotalCents)) &&
        validPrice(order.totalCents));
    } catch {
      return [];
    }
  }

  function checkout() {
    const products = getProducts();
    const cart = getCart();
    if (!cart.length) throw new Error("Add products to the cart before checking out.");

    const byId = new Map(products.map((product) => [product.id, product]));
    const items = cart.map(({ id, quantity }) => {
      const product = byId.get(id);
      if (!product || quantity > product.stock) throw new Error("Cart stock has changed. Review your cart and try again.");
      const subtotalCents = product.priceCents * quantity;
      if (!Number.isSafeInteger(subtotalCents)) throw new Error("Order total is too large.");
      return { productId: id, name: product.name, quantity, priceCents: product.priceCents, subtotalCents };
    });
    const totalCents = items.reduce((total, item) => total + item.subtotalCents, 0);
    if (!Number.isSafeInteger(totalCents)) throw new Error("Order total is too large.");

    const order = {
      id: `${Date.now()}-${Math.random()}`,
      placedAt: new Date().toISOString(),
      items,
      totalCents,
    };
    const orders = getOrders();
    const previousOrders = localStorage.getItem(ORDERS_KEY);
    const previousProducts = localStorage.getItem(STORAGE_KEY);
    try {
      localStorage.setItem(ORDERS_KEY, JSON.stringify([order, ...orders]));
      for (const item of items) byId.get(item.productId).stock -= item.quantity;
      saveProducts(products);
      saveCart([]);
    } catch (error) {
      // Restore the previous state if a storage write fails partway through checkout.
      if (previousOrders === null) localStorage.removeItem(ORDERS_KEY);
      else localStorage.setItem(ORDERS_KEY, previousOrders);
      if (previousProducts === null) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, previousProducts);
      throw error;
    }
    return order;
  }

  return { getProducts, addProduct, updateProduct, updateStock, removeProduct,
    getCart, setCartQuantity, addToCart, removeFromCart, getOrders, checkout };
})();
