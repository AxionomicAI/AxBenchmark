"use strict";

const form = document.querySelector("#item-form");
const list = document.querySelector("#item-list");
const emptyState = document.querySelector("#empty-state");
const noResults = document.querySelector("#no-results");
const itemCount = document.querySelector("#item-count");
const searchInput = document.querySelector("#product-search");
const clearSearch = document.querySelector("#clear-search");
const cartList = document.querySelector("#cart-list");
const cartEmpty = document.querySelector("#cart-empty");
const cartCount = document.querySelector("#cart-count");
const cartTotal = document.querySelector("#cart-total");
const checkoutButton = document.querySelector("#checkout-button");
const checkoutMessage = document.querySelector("#checkout-message");
const orderList = document.querySelector("#order-list");
const ordersEmpty = document.querySelector("#orders-empty");
const orderCount = document.querySelector("#order-count");
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function priceCents(input) {
  const value = input.value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) return null;
  const cents = Math.round(Number(value) * 100);
  return Number.isSafeInteger(cents) ? cents : null;
}

function productValues(productForm) {
  const nameInput = productForm.elements.name;
  const name = nameInput.value.trim();
  const stockInput = productForm.elements.quantity;
  const stock = Number(stockInput.value);
  const priceInput = productForm.elements.price;
  const cents = priceCents(priceInput);

  nameInput.setCustomValidity(name ? "" : "Enter a product name.");
  stockInput.setCustomValidity(
    stockInput.value && (!Number.isSafeInteger(stock) || stock < 0)
      ? "Enter a nonnegative whole number." : ""
  );
  priceInput.setCustomValidity(cents === null ? "Enter a nonnegative price with at most two decimal places." : "");
  if (!productForm.reportValidity()) {
    return null;
  }
  return { name, stock, priceCents: cents };
}

function clearValidation(productForm) {
  for (const input of [productForm.elements.name, productForm.elements.quantity, productForm.elements.price]) {
    input.addEventListener("input", () => input.setCustomValidity(""));
  }
}

function renderItems(editingId = null) {
  const items = InventoryStore.getProducts();
  const cartQuantities = new Map(InventoryStore.getCart().map((entry) => [entry.id, entry.quantity]));
  const query = searchInput.value.trim().toLocaleLowerCase();
  const matchingItems = query
    ? items.filter((item) => item.name.toLocaleLowerCase().includes(query))
    : items;
  list.replaceChildren();
  emptyState.hidden = items.length > 0;
  noResults.hidden = !query || matchingItems.length > 0 || items.length === 0;
  clearSearch.hidden = searchInput.value.length === 0;
  itemCount.textContent = query
    ? `${matchingItems.length} of ${items.length} ${items.length === 1 ? "product" : "products"}`
    : `${items.length} ${items.length === 1 ? "product" : "products"}`;

  for (const item of matchingItems) {
    const row = document.createElement("li");
    row.className = "item-row";

    if (item.id === editingId) {
      const editForm = document.createElement("form");
      editForm.className = "edit-form";

      const nameLabel = document.createElement("label");
      nameLabel.textContent = "Name";
      const nameInput = document.createElement("input");
      nameInput.name = "name";
      nameInput.type = "text";
      nameInput.maxLength = 100;
      nameInput.required = true;
      nameInput.value = item.name;
      nameLabel.append(nameInput);

      const stockLabel = document.createElement("label");
      stockLabel.textContent = "Stock";
      const stockInput = document.createElement("input");
      stockInput.name = "quantity";
      stockInput.type = "number";
      stockInput.min = "0";
      stockInput.step = "1";
      stockInput.required = true;
      stockInput.value = item.stock;
      stockLabel.append(stockInput);

      const priceLabel = document.createElement("label");
      priceLabel.textContent = "Price (USD)";
      const priceInput = document.createElement("input");
      priceInput.name = "price";
      priceInput.type = "number";
      priceInput.min = "0";
      priceInput.step = "0.01";
      priceInput.required = true;
      priceInput.value = (item.priceCents / 100).toFixed(2);
      priceLabel.append(priceInput);

      const actions = document.createElement("div");
      actions.className = "item-actions";
      const save = document.createElement("button");
      save.type = "submit";
      save.textContent = "Save";
      const cancel = document.createElement("button");
      cancel.type = "button";
      cancel.className = "secondary-button";
      cancel.textContent = "Cancel";
      cancel.addEventListener("click", () => renderItems());
      actions.append(save, cancel);
      editForm.append(nameLabel, stockLabel, priceLabel, actions);
      clearValidation(editForm);
      editForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const values = productValues(editForm);
        if (!values) return;
        InventoryStore.updateProduct(item.id, values.name, values.stock, values.priceCents);
        renderAll();
      });
      row.append(editForm);
      list.append(row);
      nameInput.focus();
      continue;
    }

    const details = document.createElement("div");
    details.className = "item-details";
    const name = document.createElement("strong");
    name.textContent = item.name;
    const quantity = document.createElement("span");
    quantity.className = "item-quantity";
    quantity.textContent = `In stock: ${item.stock} · ${money.format(item.priceCents / 100)} each`;
    details.append(name, quantity);

    const actions = document.createElement("div");
    actions.className = "item-actions";
    const addToCart = document.createElement("button");
    addToCart.type = "button";
    addToCart.textContent = "Add to cart";
    addToCart.setAttribute("aria-label", `Add ${item.name} to cart`);
    addToCart.disabled = (cartQuantities.get(item.id) ?? 0) >= item.stock;
    addToCart.addEventListener("click", () => {
      InventoryStore.addToCart(item.id);
      renderAll();
    });
    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "secondary-button";
    edit.textContent = "Edit";
    edit.setAttribute("aria-label", `Edit ${item.name}`);
    edit.addEventListener("click", () => renderItems(item.id));

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "secondary-button";
    remove.textContent = "Delete";
    remove.setAttribute("aria-label", `Delete ${item.name}`);
    remove.addEventListener("click", () => {
      InventoryStore.removeProduct(item.id);
      renderAll();
    });

    actions.append(addToCart, edit, remove);
    row.append(details, actions);
    list.append(row);
  }
}

function renderCart() {
  const products = new Map(InventoryStore.getProducts().map((item) => [item.id, item]));
  const cart = InventoryStore.getCart();
  cartList.replaceChildren();
  cartEmpty.hidden = cart.length > 0;
  checkoutButton.disabled = cart.length === 0;
  const count = cart.reduce((sum, entry) => sum + entry.quantity, 0);
  cartCount.textContent = `${count} ${count === 1 ? "item" : "items"}`;
  const totalCents = cart.reduce((sum, entry) => sum + products.get(entry.id).priceCents * entry.quantity, 0);
  cartTotal.textContent = `Total: ${money.format(totalCents / 100)}`;

  for (const entry of cart) {
    const product = products.get(entry.id);
    const row = document.createElement("li");
    row.className = "item-row";
    const details = document.createElement("div");
    details.className = "item-details";
    const name = document.createElement("strong");
    name.textContent = product.name;
    const subtotal = document.createElement("span");
    subtotal.className = "item-quantity";
    subtotal.textContent = `${money.format(product.priceCents / 100)} each · ${money.format(product.priceCents * entry.quantity / 100)}`;
    details.append(name, subtotal);

    const actions = document.createElement("div");
    actions.className = "item-actions cart-actions";
    const label = document.createElement("label");
    label.textContent = "Quantity";
    const input = document.createElement("input");
    input.type = "number";
    input.min = "1";
    input.max = String(product.stock);
    input.step = "1";
    input.required = true;
    input.value = entry.quantity;
    input.setAttribute("aria-label", `Quantity for ${product.name}`);
    input.addEventListener("change", () => {
      const quantity = Number(input.value);
      if (!input.value || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > product.stock) {
        input.setCustomValidity(`Enter a whole number from 1 to ${product.stock}.`);
        input.reportValidity();
        input.setCustomValidity("");
        input.value = entry.quantity;
        return;
      }
      InventoryStore.setCartQuantity(entry.id, quantity);
      renderAll();
    });
    label.append(input);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "secondary-button";
    remove.textContent = "Remove";
    remove.setAttribute("aria-label", `Remove ${product.name} from cart`);
    remove.addEventListener("click", () => {
      InventoryStore.removeFromCart(entry.id);
      renderAll();
    });
    actions.append(label, remove);
    row.append(details, actions);
    cartList.append(row);
  }
}

function renderOrders() {
  const orders = InventoryStore.getOrders();
  orderList.replaceChildren();
  ordersEmpty.hidden = orders.length > 0;
  orderCount.textContent = `${orders.length} ${orders.length === 1 ? "order" : "orders"}`;

  for (const order of orders) {
    const row = document.createElement("li");
    row.className = "order-row";
    const heading = document.createElement("div");
    heading.className = "order-heading";
    const date = document.createElement("time");
    date.dateTime = order.placedAt;
    date.textContent = new Date(order.placedAt).toLocaleString();
    const total = document.createElement("strong");
    total.textContent = money.format(order.totalCents / 100);
    heading.append(date, total);
    const items = document.createElement("ul");
    items.className = "order-items";
    for (const item of order.items) {
      const line = document.createElement("li");
      line.textContent = `${item.name} × ${item.quantity} · ${money.format(item.priceCents / 100)} each · ${money.format(item.subtotalCents / 100)}`;
      items.append(line);
    }
    row.append(heading, items);
    orderList.append(row);
  }
}

function renderAll({ preserveCheckoutMessage = false } = {}) {
  if (!preserveCheckoutMessage) {
    checkoutMessage.hidden = true;
    checkoutMessage.textContent = "";
  }
  renderItems();
  renderCart();
  renderOrders();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const values = productValues(form);
  if (!values) return;

  InventoryStore.addProduct(values.name, values.stock, values.priceCents);
  renderAll();
  form.reset();
  form.elements.name.focus();
});

clearValidation(form);
checkoutButton.addEventListener("click", () => {
  try {
    const order = InventoryStore.checkout();
    checkoutMessage.textContent = `Purchase complete. Order total: ${money.format(order.totalCents / 100)}.`;
    checkoutMessage.classList.remove("error");
  } catch (error) {
    checkoutMessage.textContent = error.message || "Purchase could not be completed. Please try again.";
    checkoutMessage.classList.add("error");
  }
  checkoutMessage.hidden = false;
  renderAll({ preserveCheckoutMessage: true });
});
searchInput.addEventListener("input", () => renderItems());
clearSearch.addEventListener("click", () => {
  searchInput.value = "";
  renderItems();
  searchInput.focus();
});
renderAll();
