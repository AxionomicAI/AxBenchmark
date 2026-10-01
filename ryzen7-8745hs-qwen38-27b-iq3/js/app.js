// Inventory data layer — products with stock, persisted in localStorage.

const STORAGE_KEY = "inventory.products";
const CART_KEY = "inventory.cart";

// Sample data seeded on first run.
const SEED_PRODUCTS = [
  { id: 1, name: "Wireless Mouse", stock: 42, price: 24.99 },
  { id: 2, name: "Mechanical Keyboard", stock: 17, price: 89.99 },
  { id: 3, name: "USB-C Cable (2 m)", stock: 120, price: 9.99 },
  { id: 4, name: "Laptop Stand", stock: 8, price: 34.5 },
  { id: 5, name: "HDMI Adapter", stock: 0, price: 12 },
];

function saveProducts(products) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

// Ensure a product has a valid numeric price (migrates data saved
// before prices existed).
function normalizeProduct(product) {
  if (!Number.isFinite(product.price)) product.price = 0;
  return product;
}

// Load products from localStorage. Seeds sample data on first run
// (or if the stored data is missing/corrupt) and persists it.
function getProducts() {
  let products = null;
  try {
    products = JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    products = null;
  }
  if (!Array.isArray(products)) {
    products = SEED_PRODUCTS.map((p) => ({ ...p }));
    saveProducts(products);
  }
  products.forEach(normalizeProduct);
  return products;
}

function getProduct(id) {
  return getProducts().find((p) => p.id === id) || null;
}

function nextId(products) {
  return products.reduce((max, p) => Math.max(max, p.id), 0) + 1;
}

function addProduct(name, stock, price) {
  const products = getProducts();
  const product = { id: nextId(products), name, stock, price };
  products.push(product);
  saveProducts(products);
  return product;
}

// --- Cart data layer — array of { id, quantity }, persisted in localStorage.

function getCart() {
  let cart = null;
  try {
    cart = JSON.parse(localStorage.getItem(CART_KEY));
  } catch {
    cart = null;
  }
  if (!Array.isArray(cart)) return [];
  return cart.filter(
    (e) => e && typeof e.id === "number" && Number.isFinite(e.quantity) && e.quantity > 0
  );
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

// Add qty units of a product to the cart (or increase its quantity).
function addToCart(id, qty = 1) {
  const cart = getCart();
  const entry = cart.find((e) => e.id === id);
  if (entry) {
    entry.quantity += qty;
  } else {
    cart.push({ id, quantity: qty });
  }
  saveCart(cart);
}

// Set the quantity of a cart entry. Quantities below 1 remove the entry.
function setCartQuantity(id, qty) {
  const cart = getCart();
  const entry = cart.find((e) => e.id === id);
  if (!entry) return;
  if (!Number.isFinite(qty) || qty < 1) {
    removeFromCart(id);
    return;
  }
  entry.quantity = Math.round(qty);
  saveCart(cart);
}

function removeFromCart(id) {
  const cart = getCart().filter((e) => e.id !== id);
  saveCart(cart);
}

function clearCart() {
  saveCart([]);
}

// --- Orders data layer — array of { id, date, items, total }, persisted in localStorage.

const ORDERS_KEY = "inventory.orders";

function getOrders() {
  let orders = null;
  try {
    orders = JSON.parse(localStorage.getItem(ORDERS_KEY));
  } catch {
    orders = null;
  }
  if (!Array.isArray(orders)) return [];
  return orders.filter((o) => o && typeof o.id === "number");
}

function saveOrders(orders) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

function nextOrderId() {
  const orders = getOrders();
  return orders.length === 0 ? 1 : Math.max(...orders.map((o) => o.id)) + 1;
}

/**
 * Attempt to place an order for the current cart.
 * Returns { order } on success, { error } if any item lacks stock
 * (the cart is clamped to available quantities), or null for an empty cart.
 */
function placeOrder() {
  const items = getCartItems();
  if (items.length === 0) return null;

  const short = [];
  for (const { product, quantity } of items) {
    if (product.stock < quantity) {
      short.push({ name: product.name, available: product.stock });
    }
  }
  if (short.length > 0) {
    const clamped = items
      .map(({ product, quantity }) => ({
        id: product.id,
        quantity: Math.min(quantity, product.stock),
      }))
      .filter((e) => e.quantity > 0);
    saveCart(clamped);
    return { error: short };
  }

  for (const { product, quantity } of items) {
    adjustStock(product.id, -quantity);
  }

  const orderItems = items.map(({ product, quantity }) => ({
    id: product.id,
    name: product.name,
    price: product.price,
    quantity,
  }));
  const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const order = {
    id: nextOrderId(),
    date: new Date().toISOString(),
    items: orderItems,
    total,
  };
  const orders = getOrders();
  orders.push(order);
  saveOrders(orders);
  saveCart([]);
  return { order };
}

// Join cart entries with their products. Entries whose product no longer
// exists are dropped (and the cart is cleaned up).
function getCartItems() {
  const cart = getCart();
  const items = cart
    .map((e) => {
      const product = getProduct(e.id);
      return product ? { product, quantity: e.quantity } : null;
    })
    .filter(Boolean);
  if (items.length !== cart.length) {
    saveCart(items.map((i) => ({ id: i.product.id, quantity: i.quantity })));
  }
  return items;
}

function formatMoney(value) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

// Merge the given changes into the product with the given id.
// Returns the updated product, or null if the id was not found.
function updateProduct(id, changes) {
  const products = getProducts();
  const product = products.find((p) => p.id === id);
  if (!product) return null;
  Object.assign(product, changes);
  saveProducts(products);
  return product;
}

function setStock(id, stock) {
  return updateProduct(id, { stock });
}

// Change a product's stock by a delta. Returns the updated product,
// or null if the id was not found.
function adjustStock(id, delta) {
  const product = getProduct(id);
  if (!product) return null;
  return setStock(id, product.stock + delta);
}

// Case-insensitive substring search of product names.
// Returns all products when the query is empty.
function searchProducts(query) {
  const q = (query || "").trim().toLowerCase();
  if (!q) return getProducts();
  return getProducts().filter((p) => p.name.toLowerCase().includes(q));
}

function removeProduct(id) {
  const products = getProducts();
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) return false;
  products.splice(index, 1);
  saveProducts(products);
  return true;
}

// --- UI ---

const table = document.getElementById("items-table");
const emptyMessage = document.getElementById("empty-message");
const noResultsMessage = document.getElementById("no-results-message");
const tbody = table.querySelector("tbody");
const searchInput = document.getElementById("search-input");
const searchClear = document.getElementById("search-clear");
const form = document.getElementById("product-form");
const formHeading = document.getElementById("form-heading");
const nameInput = form.elements.name;
const stockInput = form.elements.stock;
const priceInput = form.elements.price;
const submitButton = document.getElementById("form-submit");
const cancelButton = document.getElementById("form-cancel");

const cartTable = document.getElementById("cart-table");
const cartTbody = cartTable.querySelector("tbody");
const cartEmptyMessage = document.getElementById("cart-empty-message");
const cartTotalCell = document.getElementById("cart-total");
const cartCount = document.getElementById("cart-count");
const cartClearButton = document.getElementById("cart-clear");
const checkoutButton = document.getElementById("checkout-button");

// The product currently being edited, or null when adding a new one.
let editingId = null;

function resetForm() {
  editingId = null;
  form.reset();
  formHeading.textContent = "Add product";
  submitButton.textContent = "Add product";
  cancelButton.hidden = true;
}

// Fill the form with the product's values and switch it to edit mode.
function startEditing(id) {
  const product = getProduct(id);
  if (!product) return;
  editingId = id;
  nameInput.value = product.name;
  stockInput.value = product.stock;
  priceInput.value = product.price;
  formHeading.textContent = `Edit: ${product.name}`;
  submitButton.textContent = "Save changes";
  cancelButton.hidden = false;
  nameInput.focus();
}

function handleFormSubmit(event) {
  event.preventDefault();
  const name = nameInput.value.trim();
  const stock = Math.round(Number(stockInput.value));
  const price = Number(priceInput.value);
  if (!name || !Number.isFinite(stock) || stock < 0 || !Number.isFinite(price) || price < 0) return;

  if (editingId === null) {
    addProduct(name, stock, price);
  } else {
    updateProduct(editingId, { name, stock, price });
  }
  resetForm();
  render();
}

function handleDelete(id) {
  const product = getProduct(id);
  if (!product) return;
  if (!confirm(`Delete "${product.name}"?`)) return;
  removeProduct(id);
  // If the deleted product was being edited, drop out of edit mode.
  if (editingId === id) resetForm();
  render();
}

function renderProducts() {
  const query = searchInput.value;
  const products = searchProducts(query);
  const hasAnyProducts = getProducts().length > 0;

  table.hidden = products.length === 0;
  emptyMessage.hidden = hasAnyProducts;
  noResultsMessage.hidden = !(hasAnyProducts && query.trim() !== "" && products.length === 0);
  searchClear.hidden = query === "";

  tbody.innerHTML = "";
  for (const product of products) {
    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    nameCell.textContent = product.name;

    const stockCell = document.createElement("td");
    stockCell.textContent = product.stock;

    const priceCell = document.createElement("td");
    priceCell.textContent = formatMoney(product.price);

    const actionsCell = document.createElement("td");
    const cartButton = document.createElement("button");
    cartButton.type = "button";
    cartButton.textContent = "Add to cart";
    cartButton.addEventListener("click", () => {
      addToCart(product.id);
      renderCart();
    });
    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = "Edit";
    editButton.addEventListener("click", () => startEditing(product.id));
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => handleDelete(product.id));
    actionsCell.append(cartButton, editButton, deleteButton);

    row.append(nameCell, stockCell, priceCell, actionsCell);
    tbody.appendChild(row);
  }
}

function renderCart() {
  const items = getCartItems();

  cartTable.hidden = items.length === 0;
  cartEmptyMessage.hidden = items.length > 0;
  cartClearButton.hidden = items.length === 0;

  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
  cartCount.textContent = totalQuantity > 0 ? `(${totalQuantity})` : "";

  cartTbody.innerHTML = "";
  let total = 0;
  for (const { product, quantity } of items) {
    const lineTotal = product.price * quantity;
    total += lineTotal;

    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    nameCell.textContent = product.name;

    const priceCell = document.createElement("td");
    priceCell.textContent = formatMoney(product.price);

    const quantityCell = document.createElement("td");
    const quantityInput = document.createElement("input");
    quantityInput.type = "number";
    quantityInput.min = "1";
    quantityInput.step = "1";
    quantityInput.value = String(quantity);
    quantityInput.setAttribute("aria-label", `Quantity of ${product.name}`);
    quantityInput.addEventListener("change", () => {
      setCartQuantity(product.id, Number(quantityInput.value));
      renderCart();
    });
    quantityCell.appendChild(quantityInput);

    const lineTotalCell = document.createElement("td");
    lineTotalCell.textContent = formatMoney(lineTotal);

    const actionsCell = document.createElement("td");
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.textContent = "Remove";
    removeButton.addEventListener("click", () => {
      removeFromCart(product.id);
      renderCart();
    });
    actionsCell.appendChild(removeButton);

    row.append(nameCell, priceCell, quantityCell, lineTotalCell, actionsCell);
    cartTbody.appendChild(row);
  }

  cartTotalCell.textContent = formatMoney(total);
}

function renderOrders() {
  const orders = getOrders();
  const ordersTable = document.getElementById("orders-table");
  const ordersEmptyMessage = document.getElementById("orders-empty-message");
  const ordersTbody = ordersTable.querySelector("tbody");

  ordersTable.hidden = orders.length === 0;
  ordersEmptyMessage.hidden = orders.length > 0;

  ordersTbody.innerHTML = "";
  for (const order of [...orders].reverse()) {
    const row = document.createElement("tr");

    const idCell = document.createElement("td");
    idCell.textContent = `#${order.id}`;

    const dateCell = document.createElement("td");
    dateCell.textContent = new Date(order.date).toLocaleString();

    const itemsCell = document.createElement("td");
    itemsCell.textContent = order.items
      .map((item) => `${item.quantity}× ${item.name}`)
      .join(", ");

    const totalCell = document.createElement("td");
    totalCell.className = "subtotal-cell";
    totalCell.textContent = formatMoney(order.total);

    row.append(idCell, dateCell, itemsCell, totalCell);
    ordersTbody.appendChild(row);
  }
}

function render() {
  renderProducts();
  renderCart();
  renderOrders();
}

form.addEventListener("submit", handleFormSubmit);
cancelButton.addEventListener("click", resetForm);
searchInput.addEventListener("input", render);
searchClear.addEventListener("click", () => {
  searchInput.value = "";
  searchInput.focus();
  render();
});
cartClearButton.addEventListener("click", () => {
  clearCart();
  renderCart();
});
checkoutButton.addEventListener("click", () => {
  const result = placeOrder();
  if (result === null) {
    renderCart();
  } else if (result.error) {
    const names = result.error
      .map((s) => `${s.name} (only ${s.available} left)`)
      .join(", ");
    alert(
      `Not enough stock to complete the order: ${names}. ` +
      `The cart has been adjusted to the available quantities.`
    );
    render();
  } else {
    alert(`Order #${result.order.id} placed! Total ${formatMoney(result.order.total)}.`);
    render();
  }
});

document.addEventListener("DOMContentLoaded", render);
