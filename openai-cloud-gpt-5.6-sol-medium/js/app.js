"use strict";

const STORAGE_KEY = "inventory.items";
const CART_STORAGE_KEY = "inventory.cart";
const ORDER_STORAGE_KEY = "inventory.orders";
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const SAMPLE_PRODUCTS = Object.freeze([
  Object.freeze({
    id: "product-001",
    name: "Wireless Mouse",
    sku: "ELEC-001",
    category: "Electronics",
    stock: 24,
    price: 19.99,
  }),
  Object.freeze({
    id: "product-002",
    name: "Mechanical Keyboard",
    sku: "ELEC-002",
    category: "Electronics",
    stock: 12,
    price: 79.99,
  }),
  Object.freeze({
    id: "product-003",
    name: "USB-C Cable",
    sku: "ELEC-003",
    category: "Accessories",
    stock: 48,
    price: 9.99,
  }),
  Object.freeze({
    id: "product-004",
    name: "Notebook",
    sku: "STAT-001",
    category: "Stationery",
    stock: 35,
    price: 4.5,
  }),
  Object.freeze({
    id: "product-005",
    name: "Desk Lamp",
    sku: "HOME-001",
    category: "Office",
    stock: 9,
    price: 34.99,
  }),
]);

function copyProducts(products) {
  return products.map((product) => ({ ...product }));
}

function saveInventory(products) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    return true;
  } catch (error) {
    console.warn("Inventory data could not be saved.", error);
    return false;
  }
}

function loadInventory() {
  try {
    const storedItems = localStorage.getItem(STORAGE_KEY);

    if (storedItems === null) {
      const sampleProducts = copyProducts(SAMPLE_PRODUCTS);
      saveInventory(sampleProducts);
      return sampleProducts;
    }

    const products = JSON.parse(storedItems);
    if (!Array.isArray(products)) {
      throw new TypeError("Stored inventory must be an array.");
    }

    let wasMigrated = false;
    const migratedProducts = products.map((product) => {
      if (product.price !== undefined && product.price !== null) {
        return { ...product };
      }

      wasMigrated = true;
      const sampleProduct = SAMPLE_PRODUCTS.find((sample) => sample.id === product.id);
      return { ...product, price: sampleProduct?.price ?? 0 };
    });

    if (wasMigrated) {
      saveInventory(migratedProducts);
    }

    return migratedProducts;
  } catch (error) {
    console.warn("Inventory data could not be loaded.", error);
    return [];
  }
}

function createId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `product-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeProduct(product, id = product.id || createId()) {
  const name = String(product.name || "").trim();
  const sku = String(product.sku || "").trim();
  const category = String(product.category || "").trim() || "Uncategorized";
  const stock = Number(product.stock);
  const price = Number(product.price ?? 0);

  if (!name) {
    throw new TypeError("A product name is required.");
  }

  if (!Number.isInteger(stock) || stock < 0) {
    throw new TypeError("Product stock must be a non-negative whole number.");
  }

  if (!Number.isFinite(price) || price < 0) {
    throw new TypeError("Product price must be a non-negative number.");
  }

  return { id, name, sku, category, stock, price: Math.round(price * 100) / 100 };
}

function persistOrThrow(products) {
  if (!saveInventory(products)) {
    throw new Error("The inventory could not be persisted.");
  }

  return copyProducts(products);
}

const InventoryStore = Object.freeze({
  getAll() {
    return loadInventory();
  },

  saveAll(products) {
    if (!Array.isArray(products)) {
      throw new TypeError("Inventory must be an array of products.");
    }

    const normalizedProducts = products.map((product) => normalizeProduct(product));
    const ids = new Set(normalizedProducts.map((product) => product.id));
    if (ids.size !== normalizedProducts.length) {
      throw new TypeError("Each product must have a unique id.");
    }

    return persistOrThrow(normalizedProducts);
  },

  add(product) {
    const products = loadInventory();
    const newProduct = normalizeProduct(product);
    products.push(newProduct);
    persistOrThrow(products);
    return { ...newProduct };
  },

  update(id, changes) {
    const products = loadInventory();
    const productIndex = products.findIndex((product) => product.id === id);

    if (productIndex === -1) {
      return null;
    }

    const updatedProduct = normalizeProduct(
      { ...products[productIndex], ...changes },
      id,
    );
    products[productIndex] = updatedProduct;
    persistOrThrow(products);
    return { ...updatedProduct };
  },

  remove(id) {
    const products = loadInventory();
    const remainingProducts = products.filter((product) => product.id !== id);

    if (remainingProducts.length === products.length) {
      return false;
    }

    persistOrThrow(remainingProducts);
    return true;
  },

  setStock(id, stock) {
    return this.update(id, { stock });
  },

  resetToSamples() {
    return persistOrThrow(copyProducts(SAMPLE_PRODUCTS));
  },
});

globalThis.InventoryStore = InventoryStore;

function saveCart(items) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    return true;
  } catch (error) {
    console.warn("Cart data could not be saved.", error);
    return false;
  }
}

function normalizeCartItem(item) {
  const productId = String(item.productId || "");
  const quantity = Number(item.quantity);

  if (!productId || !Number.isInteger(quantity) || quantity < 1) {
    throw new TypeError("Cart items require a product and a positive whole-number quantity.");
  }

  return { productId, quantity };
}

function loadCart() {
  try {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (storedCart === null) {
      return [];
    }

    const items = JSON.parse(storedCart);
    if (!Array.isArray(items)) {
      throw new TypeError("Stored cart must be an array.");
    }

    return items.map(normalizeCartItem);
  } catch (error) {
    console.warn("Cart data could not be loaded.", error);
    return [];
  }
}

function persistCartOrThrow(items) {
  if (!saveCart(items)) {
    throw new Error("The cart could not be persisted.");
  }

  return items.map((item) => ({ ...item }));
}

const CartStore = Object.freeze({
  getAll() {
    return loadCart();
  },

  add(productId, maximumQuantity) {
    const items = loadCart();
    const item = items.find((cartItem) => cartItem.productId === productId);

    if (item) {
      if (item.quantity >= maximumQuantity) {
        return null;
      }
      item.quantity += 1;
    } else {
      if (maximumQuantity < 1) {
        return null;
      }
      items.push({ productId, quantity: 1 });
    }

    persistCartOrThrow(items);
    return { ...(item || items.at(-1)) };
  },

  setQuantity(productId, quantity) {
    const items = loadCart();
    const item = items.find((cartItem) => cartItem.productId === productId);
    if (!item) {
      return null;
    }

    item.quantity = quantity;
    persistCartOrThrow(items.map(normalizeCartItem));
    return { ...item };
  },

  remove(productId) {
    const items = loadCart();
    const remainingItems = items.filter((item) => item.productId !== productId);
    if (remainingItems.length === items.length) {
      return false;
    }

    persistCartOrThrow(remainingItems);
    return true;
  },
});

globalThis.CartStore = CartStore;

function saveOrders(orders) {
  try {
    localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orders));
    return true;
  } catch (error) {
    console.warn("Order history could not be saved.", error);
    return false;
  }
}

function normalizeOrderItem(item) {
  const productId = String(item.productId || "");
  const name = String(item.name || "").trim();
  const sku = String(item.sku || "").trim();
  const price = Number(item.price);
  const quantity = Number(item.quantity);

  if (!productId || !name || !Number.isFinite(price) || price < 0
      || !Number.isInteger(quantity) || quantity < 1) {
    throw new TypeError("An order contains an invalid item.");
  }

  const roundedPrice = Math.round(price * 100) / 100;
  return {
    productId,
    name,
    sku,
    price: roundedPrice,
    quantity,
    lineTotal: Math.round(roundedPrice * quantity * 100) / 100,
  };
}

function normalizeOrder(order) {
  const id = String(order.id || "");
  const completedAt = String(order.completedAt || "");
  const items = Array.isArray(order.items) ? order.items.map(normalizeOrderItem) : [];
  const timestamp = Date.parse(completedAt);

  if (!id || !Number.isFinite(timestamp) || items.length === 0) {
    throw new TypeError("Stored order data is invalid.");
  }

  return {
    id,
    completedAt: new Date(timestamp).toISOString(),
    items,
    total: Math.round(items.reduce((sum, item) => sum + item.lineTotal, 0) * 100) / 100,
  };
}

function copyOrders(orders) {
  return orders.map((order) => ({
    ...order,
    items: order.items.map((item) => ({ ...item })),
  }));
}

function loadOrders() {
  try {
    const storedOrders = localStorage.getItem(ORDER_STORAGE_KEY);
    if (storedOrders === null) {
      return [];
    }

    const orders = JSON.parse(storedOrders);
    if (!Array.isArray(orders)) {
      throw new TypeError("Stored order history must be an array.");
    }

    return orders.map(normalizeOrder);
  } catch (error) {
    console.warn("Order history could not be loaded.", error);
    return [];
  }
}

function restoreStorageValue(key, value) {
  try {
    if (value === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
    }
  } catch (error) {
    console.warn(`Could not restore ${key} after checkout failed.`, error);
  }
}

const OrderStore = Object.freeze({
  getAll() {
    return copyOrders(loadOrders());
  },

  checkout() {
    const products = loadInventory();
    const cartItems = loadCart();

    if (cartItems.length === 0) {
      throw new Error("Add at least one product before checking out.");
    }

    const productsById = new Map(products.map((product) => [product.id, product]));
    const orderItems = cartItems.map((cartItem) => {
      const product = productsById.get(cartItem.productId);
      if (!product) {
        throw new Error("A product in the cart is no longer available.");
      }
      if (cartItem.quantity > product.stock) {
        throw new Error(`Only ${product.stock} ${product.name} ${product.stock === 1 ? "unit is" : "units are"} available.`);
      }

      return normalizeOrderItem({
        productId: product.id,
        name: product.name,
        sku: product.sku,
        price: product.price ?? 0,
        quantity: cartItem.quantity,
      });
    });
    const quantitiesById = new Map(cartItems.map((item) => [item.productId, item.quantity]));
    const updatedProducts = products.map((product) => ({
      ...product,
      stock: product.stock - (quantitiesById.get(product.id) || 0),
    }));
    const order = normalizeOrder({
      id: `order-${createId()}`,
      completedAt: new Date().toISOString(),
      items: orderItems,
    });
    const updatedOrders = [...loadOrders(), order];
    const previousValues = new Map([
      [STORAGE_KEY, localStorage.getItem(STORAGE_KEY)],
      [CART_STORAGE_KEY, localStorage.getItem(CART_STORAGE_KEY)],
      [ORDER_STORAGE_KEY, localStorage.getItem(ORDER_STORAGE_KEY)],
    ]);

    try {
      if (!saveInventory(updatedProducts) || !saveOrders(updatedOrders) || !saveCart([])) {
        throw new Error("The purchase could not be saved. No stock was changed.");
      }
    } catch (error) {
      previousValues.forEach((value, key) => restoreStorageValue(key, value));
      throw error;
    }

    return copyOrders([order])[0];
  },
});

globalThis.OrderStore = OrderStore;

let inventoryQuery = "";

function findProducts(products, query) {
  const searchTerms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);

  if (searchTerms.length === 0) {
    return products;
  }

  return products.filter((product) => {
    const searchableProduct = [product.name, product.sku, product.category]
      .join(" ")
      .toLocaleLowerCase();
    return searchTerms.every((term) => searchableProduct.includes(term));
  });
}

function updateSummary(products, totalProductCount = products.length) {
  const summary = document.querySelector("#inventory-summary");
  const totalStock = products.reduce((total, product) => total + product.stock, 0);
  const productLabel = products.length === 1 ? "product" : "products";
  const unitLabel = totalStock === 1 ? "unit" : "units";
  const resultCount = totalProductCount === products.length
    ? `${products.length} ${productLabel}`
    : `${products.length} of ${totalProductCount} products`;
  summary.textContent = `${resultCount} · ${totalStock} ${unitLabel} in stock`;
}

function renderInventory(products, isSearching = false) {
  const inventoryList = document.querySelector("#inventory-list");
  inventoryList.replaceChildren();

  if (products.length === 0) {
    inventoryList.className = "empty-state";
    inventoryList.removeAttribute("role");

    const title = document.createElement("p");
    title.textContent = isSearching ? "No matching products." : "No inventory items yet.";

    const message = document.createElement("p");
    message.className = "muted";
    message.textContent = isSearching
      ? "Try a different name, SKU, or category."
      : "Your items will appear here.";

    inventoryList.append(title, message);
    return;
  }

  inventoryList.className = "inventory-list";
  inventoryList.setAttribute("role", "list");

  products.forEach((product) => {
    const item = document.createElement("div");
    item.className = "inventory-item";
    item.setAttribute("role", "listitem");

    const details = document.createElement("div");
    const name = document.createElement("h3");
    name.textContent = product.name;

    const metadata = document.createElement("p");
    metadata.className = "muted product-metadata";
    metadata.textContent = [product.sku, product.category].filter(Boolean).join(" · ");
    details.append(name, metadata);

    const stock = document.createElement("p");
    stock.className = "stock-count";
    stock.textContent = `${product.stock} ${product.stock === 1 ? "unit" : "units"}`;

    const price = document.createElement("p");
    price.className = "product-price";
    price.textContent = currencyFormatter.format(product.price ?? 0);

    const actions = document.createElement("div");
    actions.className = "item-actions";

    const editButton = document.createElement("button");
    editButton.className = "button button-small button-secondary";
    editButton.type = "button";
    editButton.dataset.action = "edit";
    editButton.dataset.id = product.id;
    editButton.setAttribute("aria-label", `Edit ${product.name}`);
    editButton.textContent = "Edit";

    const addToCartButton = document.createElement("button");
    addToCartButton.className = "button button-small button-primary";
    addToCartButton.type = "button";
    addToCartButton.dataset.action = "add-to-cart";
    addToCartButton.dataset.id = product.id;
    addToCartButton.disabled = product.stock === 0;
    addToCartButton.setAttribute("aria-label", `Add ${product.name} to cart`);
    addToCartButton.textContent = product.stock === 0 ? "Out of stock" : "Add to cart";

    const deleteButton = document.createElement("button");
    deleteButton.className = "button button-small button-danger";
    deleteButton.type = "button";
    deleteButton.dataset.action = "delete";
    deleteButton.dataset.id = product.id;
    deleteButton.setAttribute("aria-label", `Delete ${product.name}`);
    deleteButton.textContent = "Delete";

    actions.append(addToCartButton, editButton, deleteButton);
    item.append(details, price, stock, actions);
    inventoryList.append(item);
  });
}

function getAvailableCartItems(products = InventoryStore.getAll()) {
  const productsById = new Map(products.map((product) => [product.id, product]));
  const storedItems = CartStore.getAll();
  const availableItems = [];

  storedItems.forEach((item) => {
    const product = productsById.get(item.productId);
    if (product && product.stock > 0) {
      availableItems.push({
        product,
        quantity: Math.min(item.quantity, product.stock),
      });
    }
  });

  const reconciled = availableItems.map(({ product, quantity }) => ({
    productId: product.id,
    quantity,
  }));
  if (JSON.stringify(reconciled) !== JSON.stringify(storedItems)) {
    persistCartOrThrow(reconciled);
  }

  return availableItems;
}

function renderCart(products = InventoryStore.getAll()) {
  const cartList = document.querySelector("#cart-list");
  const cartCount = document.querySelector("#cart-count");
  const cartTotal = document.querySelector("#cart-total");
  const checkoutButton = document.querySelector("#checkout-button");
  let cartItems = [];

  try {
    cartItems = getAvailableCartItems(products);
  } catch (error) {
    setStatus(error.message || "The cart could not be updated.");
  }

  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const total = cartItems.reduce(
    (sum, item) => sum + (item.product.price ?? 0) * item.quantity,
    0,
  );
  cartCount.textContent = `${itemCount} ${itemCount === 1 ? "item" : "items"}`;
  cartTotal.textContent = currencyFormatter.format(total);
  checkoutButton.disabled = cartItems.length === 0;
  cartList.replaceChildren();

  if (cartItems.length === 0) {
    cartList.className = "empty-state cart-empty";
    const title = document.createElement("p");
    title.textContent = "Your cart is empty.";
    const message = document.createElement("p");
    message.className = "muted";
    message.textContent = "Add an in-stock product to get started.";
    cartList.append(title, message);
    return;
  }

  cartList.className = "cart-list";
  cartItems.forEach(({ product, quantity }) => {
    const item = document.createElement("article");
    item.className = "cart-item";

    const details = document.createElement("div");
    details.className = "cart-item-details";
    const name = document.createElement("h3");
    name.textContent = product.name;
    const lineTotal = document.createElement("p");
    lineTotal.className = "muted";
    const unitPrice = currencyFormatter.format(product.price ?? 0);
    const subtotal = currencyFormatter.format((product.price ?? 0) * quantity);
    lineTotal.textContent = `${unitPrice} each · ${subtotal}`;
    details.append(name, lineTotal);

    const controls = document.createElement("div");
    controls.className = "cart-item-controls";
    const quantityLabel = document.createElement("label");
    quantityLabel.htmlFor = `cart-quantity-${product.id}`;
    quantityLabel.className = "visually-hidden";
    quantityLabel.textContent = `Quantity for ${product.name}`;
    const quantityInput = document.createElement("input");
    quantityInput.id = `cart-quantity-${product.id}`;
    quantityInput.className = "quantity-input";
    quantityInput.type = "number";
    quantityInput.min = "1";
    quantityInput.max = String(product.stock);
    quantityInput.step = "1";
    quantityInput.value = String(quantity);
    quantityInput.dataset.productId = product.id;
    const removeButton = document.createElement("button");
    removeButton.className = "remove-cart-button";
    removeButton.type = "button";
    removeButton.dataset.removeProductId = product.id;
    removeButton.setAttribute("aria-label", `Remove ${product.name} from cart`);
    removeButton.textContent = "Remove";
    controls.append(quantityLabel, quantityInput, removeButton);
    item.append(details, controls);
    cartList.append(item);
  });
}

function renderOrders(orders = OrderStore.getAll()) {
  const orderList = document.querySelector("#order-list");
  const orderSummary = document.querySelector("#order-summary");
  const orderCount = orders.length;
  orderSummary.textContent = `${orderCount} completed ${orderCount === 1 ? "order" : "orders"}`;
  orderList.replaceChildren();

  if (orderCount === 0) {
    orderList.className = "empty-state order-empty";
    const title = document.createElement("p");
    title.textContent = "No completed orders yet.";
    const message = document.createElement("p");
    message.className = "muted";
    message.textContent = "Completed purchases will appear here.";
    orderList.append(title, message);
    return;
  }

  orderList.className = "order-list";
  [...orders].reverse().forEach((order) => {
    const article = document.createElement("article");
    article.className = "order";

    const heading = document.createElement("div");
    heading.className = "order-heading";
    const details = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = `Order ${order.id.slice(-8)}`;
    const date = document.createElement("time");
    date.className = "muted order-date";
    date.dateTime = order.completedAt;
    date.textContent = new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(order.completedAt));
    details.append(title, date);
    const total = document.createElement("strong");
    total.className = "order-total";
    total.textContent = currencyFormatter.format(order.total);
    heading.append(details, total);

    const itemList = document.createElement("ul");
    itemList.className = "order-items";
    order.items.forEach((item) => {
      const listItem = document.createElement("li");
      const itemName = document.createElement("span");
      itemName.textContent = `${item.quantity} × ${item.name}`;
      const lineTotal = document.createElement("span");
      lineTotal.textContent = currencyFormatter.format(item.lineTotal);
      listItem.append(itemName, lineTotal);
      itemList.append(listItem);
    });

    article.append(heading, itemList);
    orderList.append(article);
  });
}

function refreshInventory() {
  const products = InventoryStore.getAll();
  const matchingProducts = findProducts(products, inventoryQuery);
  updateSummary(matchingProducts, products.length);
  renderInventory(matchingProducts, inventoryQuery.trim().length > 0);
  renderCart(products);
  renderOrders();
  return products;
}

function handleInventorySearch(event) {
  inventoryQuery = event.currentTarget.value;
  document.querySelector("#clear-search-button").hidden = inventoryQuery.trim().length === 0;
  refreshInventory();
}

function clearInventorySearch() {
  const searchInput = document.querySelector("#inventory-search");
  searchInput.value = "";
  inventoryQuery = "";
  document.querySelector("#clear-search-button").hidden = true;
  refreshInventory();
  searchInput.focus();
}

function setStatus(message) {
  const status = document.querySelector("#app-status");
  status.textContent = "";
  window.setTimeout(() => {
    status.textContent = message;
  }, 0);
}

function openProductDialog(product = null) {
  const dialog = document.querySelector("#product-dialog");
  const form = document.querySelector("#product-form");
  const title = document.querySelector("#product-dialog-title");
  const error = document.querySelector("#form-error");

  form.reset();
  error.hidden = true;
  error.textContent = "";

  if (product) {
    title.textContent = "Edit product";
    form.elements.id.value = product.id;
    form.elements.name.value = product.name;
    form.elements.sku.value = product.sku;
    form.elements.category.value = product.category;
    form.elements.price.value = product.price ?? 0;
    form.elements.stock.value = product.stock;
  } else {
    title.textContent = "Add product";
    form.elements.id.value = "";
    form.elements.price.value = "0.00";
    form.elements.stock.value = 0;
  }

  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  } else {
    dialog.setAttribute("open", "");
  }

  form.elements.name.focus();
}

function closeProductDialog() {
  const dialog = document.querySelector("#product-dialog");
  if (typeof dialog.close === "function") {
    dialog.close();
  } else {
    dialog.removeAttribute("open");
  }
}

function handleProductSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const error = document.querySelector("#form-error");

  if (!form.reportValidity()) {
    return;
  }

  const formData = new FormData(form);
  const id = formData.get("id");
  const product = {
    name: formData.get("name"),
    sku: formData.get("sku"),
    category: formData.get("category"),
    price: Number(formData.get("price")),
    stock: Number(formData.get("stock")),
  };

  try {
    if (id) {
      const updatedProduct = InventoryStore.update(id, product);
      if (!updatedProduct) {
        throw new Error("This product no longer exists.");
      }
      setStatus(`${updatedProduct.name} was updated.`);
    } else {
      const newProduct = InventoryStore.add(product);
      setStatus(`${newProduct.name} was added.`);
    }

    refreshInventory();
    closeProductDialog();
  } catch (saveError) {
    error.textContent = saveError.message || "The product could not be saved.";
    error.hidden = false;
  }
}

function handleInventoryAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }

  const products = InventoryStore.getAll();
  const product = products.find((item) => item.id === button.dataset.id);
  if (!product) {
    refreshInventory();
    setStatus("That product no longer exists.");
    return;
  }

  if (button.dataset.action === "edit") {
    openProductDialog(product);
    return;
  }

  if (button.dataset.action === "add-to-cart") {
    try {
      const cartItem = CartStore.add(product.id, product.stock);
      if (!cartItem) {
        setStatus(`All available ${product.name} units are already in the cart.`);
        return;
      }
      renderCart(products);
      setStatus(`${product.name} was added to the cart.`);
    } catch (cartError) {
      window.alert(cartError.message || "The product could not be added to the cart.");
    }
    return;
  }

  if (button.dataset.action === "delete") {
    const confirmed = window.confirm(`Delete “${product.name}”? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    try {
      if (InventoryStore.remove(product.id)) {
        refreshInventory();
        setStatus(`${product.name} was deleted.`);
      }
    } catch (deleteError) {
      window.alert(deleteError.message || "The product could not be deleted.");
    }
  }
}

function handleCartQuantityChange(event) {
  const input = event.target.closest("input[data-product-id]");
  if (!input) {
    return;
  }

  const products = InventoryStore.getAll();
  const product = products.find((item) => item.id === input.dataset.productId);
  const quantity = Number(input.value);

  if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > product.stock) {
    renderCart(products);
    setStatus(product
      ? `Choose a quantity between 1 and ${product.stock} for ${product.name}.`
      : "That product is no longer available.");
    return;
  }

  try {
    CartStore.setQuantity(product.id, quantity);
    renderCart(products);
    setStatus(`${product.name} quantity changed to ${quantity}.`);
  } catch (error) {
    renderCart(products);
    setStatus(error.message || "The cart quantity could not be changed.");
  }
}

function handleCartRemove(event) {
  const button = event.target.closest("button[data-remove-product-id]");
  if (!button) {
    return;
  }

  const product = InventoryStore.getAll().find((item) => item.id === button.dataset.removeProductId);
  try {
    CartStore.remove(button.dataset.removeProductId);
    renderCart();
    setStatus(`${product ? product.name : "Product"} was removed from the cart.`);
  } catch (error) {
    setStatus(error.message || "The product could not be removed from the cart.");
  }
}

function handleCheckout() {
  const checkoutButton = document.querySelector("#checkout-button");
  const checkoutError = document.querySelector("#checkout-error");
  checkoutError.hidden = true;
  checkoutError.textContent = "";
  checkoutButton.disabled = true;

  try {
    const order = OrderStore.checkout();
    refreshInventory();
    setStatus(`Purchase completed for ${currencyFormatter.format(order.total)}.`);
  } catch (error) {
    checkoutError.textContent = error.message || "The purchase could not be completed.";
    checkoutError.hidden = false;
    refreshInventory();
  }
}

function initializeApp() {
  refreshInventory();

  document.querySelector("#add-product-button").addEventListener("click", () => openProductDialog());
  document.querySelector("#close-dialog-button").addEventListener("click", closeProductDialog);
  document.querySelector("#cancel-product-button").addEventListener("click", closeProductDialog);
  document.querySelector("#product-form").addEventListener("submit", handleProductSubmit);
  document.querySelector("#inventory-list").addEventListener("click", handleInventoryAction);
  document.querySelector("#inventory-search").addEventListener("input", handleInventorySearch);
  document.querySelector("#clear-search-button").addEventListener("click", clearInventorySearch);
  document.querySelector("#cart-list").addEventListener("change", handleCartQuantityChange);
  document.querySelector("#cart-list").addEventListener("click", handleCartRemove);
  document.querySelector("#checkout-button").addEventListener("click", handleCheckout);
}

document.addEventListener("DOMContentLoaded", initializeApp);
