"use strict";

(() => {
  const status = document.getElementById("inventory-status");
  const table = document.getElementById("inventory-table");
  const rows = document.getElementById("inventory-rows");
  const addButton = document.getElementById("add-product");
  const searchInput = document.getElementById("inventory-search");
  const clearSearchButton = document.getElementById("clear-search");
  const productDialog = document.getElementById("product-dialog");
  const form = document.getElementById("product-form");
  const nameInput = document.getElementById("product-name");
  const skuInput = document.getElementById("product-sku");
  const stockInput = document.getElementById("product-stock");
  const priceInput = document.getElementById("product-price");
  const productError = document.getElementById("product-error");
  const deleteDialog = document.getElementById("delete-dialog");
  const deleteError = document.getElementById("delete-error");
  const cartRows = document.getElementById("cart-rows");
  const cartStatus = document.getElementById("cart-status");
  const cartError = document.getElementById("cart-error");
  const cartTotal = document.getElementById("cart-total");
  const checkoutButton = document.getElementById("checkout");
  const ordersStatus = document.getElementById("orders-status");
  const ordersList = document.getElementById("orders-list");
  let items = [];
  let cart = [];
  let orders = [];
  let ordersReady = false;
  let cartReady = false;
  let editingId = null;
  let deletingId = null;
  const quantityDrafts = new Map();

  // Whole cents and BigInt keep totals exact, even for very large stock counts.
  function money(cents) {
    const amount = BigInt(cents);
    return `$${(amount / 100n).toLocaleString("en-US")}.${String(amount % 100n).padStart(2, "0")}`;
  }

  function persistCart(nextCart) {
    try {
      window.InventoryStorage.saveCart(nextCart, cart, items);
      cart = nextCart;
      cartError.textContent = "";
      return true;
    } catch (error) {
      cartError.textContent = `Cart changes could not be saved. ${error.message} Your saved cart has not changed. Restore browser storage or reload and review before retrying.`;
      return false;
    }
  }

  function focusCartLine(id) {
    const target = Array.from(cartRows.querySelectorAll("input, button")).find(control =>
      control.dataset.id === id && !control.disabled);
    (target || document.getElementById("cart-heading")).focus();
  }

  function addToCart(item) {
    const line = cart.find(entry => entry.productId === item.id);
    const quantity = (line ? line.quantity : 0) + 1;
    if (!cartReady || !Number.isSafeInteger(quantity) || quantity > item.stock) return;
    const nextCart = line
      ? cart.map(entry => entry.productId === item.id ? { ...entry, quantity } : entry)
      : [...cart, { productId: item.id, quantity }];
    if (!persistCart(nextCart)) return;
    render();
    renderCart(`${item.name} added. `);
    const button = Array.from(rows.querySelectorAll("button")).find(control =>
      control.dataset.id === item.id && control.dataset.action === "Add to cart");
    if (button && !button.disabled) button.focus();
    else focusCartLine(item.id);
  }

  function renderCart(message = "") {
    if (!cartReady) return;
    for (const id of quantityDrafts.keys()) {
      if (!cart.some(line => line.productId === id)) quantityDrafts.delete(id);
    }
    cartRows.replaceChildren();
    let total = 0n;
    let count = 0n;
    for (const line of cart) {
      const item = items.find(product => product.id === line.productId);
      const row = document.createElement("tr");
      const nameCell = document.createElement("td");
      const label = item ? `${item.name} (${item.sku})` : `Deleted product (${line.productId})`;
      nameCell.textContent = label;
      if (!item || line.quantity > item.stock) {
        const warning = document.createElement("p");
        warning.className = "error field-hint";
        warning.textContent = !item
          ? "No longer in inventory. Remove this item; it is excluded from the total."
          : `Only ${item.stock} in stock. Reduce the quantity or remove this item.`;
        nameCell.appendChild(warning);
      }
      const priceCell = document.createElement("td");
      priceCell.className = "money";
      priceCell.textContent = item ? money(item.priceCents ?? 0) : "Unavailable";
      const quantityCell = document.createElement("td");
      const quantityForm = document.createElement("form");
      quantityForm.className = "quantity-controls";
      const input = document.createElement("input");
      input.type = "number";
      input.min = "1";
      input.max = String(item ? item.stock : 0);
      input.step = "1";
      input.required = true;
      input.value = quantityDrafts.get(line.productId) ?? String(line.quantity);
      input.disabled = !item || item.stock === 0;
      input.dataset.id = line.productId;
      input.setAttribute("aria-label", `Quantity for ${label}`);
      input.addEventListener("input", () => {
        input.setCustomValidity("");
        if (input.valueAsNumber === line.quantity) quantityDrafts.delete(line.productId);
        else quantityDrafts.set(line.productId, input.value);
      });
      const update = document.createElement("button");
      update.type = "submit";
      update.className = "secondary";
      update.textContent = "Update";
      update.disabled = input.disabled;
      update.setAttribute("aria-label", `Update quantity for ${label}`);
      quantityForm.append(input, update);
      quantityForm.addEventListener("submit", event => {
        event.preventDefault();
        const quantity = input.valueAsNumber;
        input.setCustomValidity(Number.isSafeInteger(quantity) && quantity >= 1 && quantity <= item.stock
          ? "" : `Enter a whole number from 1 to ${item.stock}.`);
        if (!quantityForm.reportValidity()) return;
        if (!persistCart(cart.map(entry => entry.productId === line.productId ? { ...entry, quantity } : entry))) return;
        quantityDrafts.delete(line.productId);
        render();
        renderCart("Quantity updated. ");
        focusCartLine(line.productId);
      });
      quantityCell.appendChild(quantityForm);
      const subtotal = item ? BigInt(item.priceCents ?? 0) * BigInt(line.quantity) : 0n;
      total += subtotal;
      count += BigInt(line.quantity);
      const subtotalCell = document.createElement("td");
      subtotalCell.className = "money";
      subtotalCell.textContent = item ? money(subtotal) : "—";
      const actionCell = document.createElement("td");
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "secondary danger-text";
      remove.textContent = "Remove";
      remove.dataset.id = line.productId;
      remove.setAttribute("aria-label", `Remove ${label} from cart`);
      remove.addEventListener("click", () => {
        if (!persistCart(cart.filter(entry => entry.productId !== line.productId))) return;
        render();
        renderCart("Item removed. ");
        focusCartLine(cart[0]?.productId);
      });
      actionCell.appendChild(remove);
      row.append(nameCell, priceCell, quantityCell, subtotalCell, actionCell);
      cartRows.appendChild(row);
    }
    cartStatus.textContent = message + (cart.length
      ? `${count.toLocaleString("en-US")} item${count === 1n ? "" : "s"} in your cart. Prices reflect the current inventory.`
      : "Your cart is empty. Add products from the inventory above.");
    document.getElementById("cart-table").hidden = cart.length === 0;
    cartTotal.textContent = `Total (USD): ${money(total)}`;
    checkoutButton.disabled = !ordersReady || !cart.length || cart.some(line => {
      const item = items.find(product => product.id === line.productId);
      return !item || line.quantity > item.stock;
    });
  }

  function renderOrders(message = "") {
    ordersList.replaceChildren();
    ordersStatus.textContent = message + (orders.length
      ? `${orders.length} completed order${orders.length === 1 ? "" : "s"}. Newest first; expand an order to view its receipt.`
      : "No purchases yet. Completed purchases will appear here.");
    for (const order of [...orders].reverse()) {
      const details = document.createElement("details");
      details.className = "order";
      const summary = document.createElement("summary");
      summary.textContent = `${new Date(order.createdAt).toLocaleString()} · ${money(order.totalCents)} USD · ${order.id}`;
      const scroll = document.createElement("div");
      scroll.className = "table-scroll";
      const receipt = document.createElement("table");
      const caption = document.createElement("caption");
      caption.textContent = "Product details and prices at purchase";
      const head = document.createElement("thead");
      const heading = document.createElement("tr");
      for (const label of ["Product", "SKU", "Quantity", "Unit price (USD)", "Subtotal (USD)"]) {
        const cell = document.createElement("th");
        cell.scope = "col";
        cell.textContent = label;
        heading.appendChild(cell);
      }
      head.appendChild(heading);
      const body = document.createElement("tbody");
      for (const line of order.lines) {
        const row = document.createElement("tr");
        for (const value of [line.name, line.sku, line.quantity.toLocaleString("en-US"), money(line.unitPriceCents), money(line.subtotalCents)]) {
          const cell = document.createElement("td");
          cell.textContent = value;
          row.appendChild(cell);
        }
        body.appendChild(row);
      }
      receipt.append(caption, head, body);
      scroll.appendChild(receipt);
      details.append(summary, scroll);
      ordersList.appendChild(details);
    }
  }

  checkoutButton.addEventListener("click", () => {
    if (!cartReady || !ordersReady || checkoutButton.disabled) return;
    const draft = Array.from(cartRows.querySelectorAll("input")).find(input =>
      input.valueAsNumber !== cart.find(line => line.productId === input.dataset.id)?.quantity);
    if (draft) {
      cartError.textContent = "Select Update for your changed quantity before completing the purchase.";
      draft.focus();
      return;
    }
    checkoutButton.disabled = true;
    try {
      const result = window.InventoryStorage.checkout(items, cart);
      items = result.items;
      cart = result.cart;
      orders = result.orders;
      cartError.textContent = "";
      render("Purchase completed. Stock updated. ");
      renderCart("Purchase completed. ");
      renderOrders(`Purchase completed: ${result.order.id}, ${money(result.order.totalCents)} USD. `);
      ordersList.firstElementChild.open = true;
      ordersList.querySelector("summary").focus();
    } catch (error) {
      cartError.textContent = `Purchase could not be completed. ${error.message} No purchase was saved. If browser storage is unavailable or full, restore it and try again.`;
      renderCart();
    }
  });

  function render(message = "") {
    const query = searchInput.value.trim().toLowerCase();
    const matches = items.filter(item =>
      item.name.toLowerCase().includes(query) || item.sku.toLowerCase().includes(query));
    clearSearchButton.disabled = searchInput.value.length === 0;
    status.textContent = message + (items.length === 0
      ? "No inventory items yet. Add a product to get started."
      : query
        ? matches.length === 0
          ? `No products match your search. 0 of ${items.length} products shown. Try another name or SKU, or clear the search.`
          : `${matches.length} of ${items.length} products shown.`
        : `${items.length} inventory item${items.length === 1 ? "" : "s"} stored in this browser.`);
    rows.replaceChildren();
    for (const item of matches) {
      const row = document.createElement("tr");
      for (const value of [item.name, item.sku, item.stock, money(item.priceCents ?? 0)]) {
        const cell = document.createElement("td");
        cell.textContent = String(value);
        row.appendChild(cell);
      }
      const actions = document.createElement("td");
      const group = document.createElement("div");
      group.className = "row-actions";
      for (const action of ["Add to cart", "Edit", "Delete"]) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = action === "Delete" ? "secondary danger-text" : "secondary";
        button.textContent = action;
        button.setAttribute("aria-label", `${action} ${item.name} (${item.sku})`);
        button.dataset.id = item.id;
        button.dataset.action = action;
        if (action === "Add to cart") {
          const quantity = cart.find(line => line.productId === item.id)?.quantity || 0;
          button.disabled = !cartReady || quantity >= item.stock;
          button.textContent = item.stock === 0 ? "Out of stock" : quantity >= item.stock ? "Stock limit reached" : action;
        }
        button.addEventListener("click", () => {
          if (action === "Edit") openProduct(item);
          else if (action === "Delete") openDelete(item);
          else addToCart(item);
        });
        group.appendChild(button);
      }
      actions.appendChild(group);
      row.appendChild(actions);
      rows.appendChild(row);
    }
    table.hidden = matches.length === 0;
  }

  function openProduct(item = null) {
    editingId = item ? item.id : null;
    form.reset();
    for (const input of [nameInput, skuInput, stockInput, priceInput]) input.setCustomValidity("");
    productError.textContent = "";
    document.getElementById("product-heading").textContent = item ? "Edit product" : "Add product";
    document.getElementById("save-product").textContent = item ? "Save changes" : "Add product";
    if (item) {
      nameInput.value = item.name;
      skuInput.value = item.sku;
      stockInput.value = item.stock;
      priceInput.value = ((item.priceCents ?? 0) / 100).toFixed(2);
    }
    productDialog.showModal();
    nameInput.focus();
  }

  function openDelete(item) {
    deletingId = item.id;
    document.getElementById("delete-description").textContent =
      `Delete “${item.name}” (${item.sku}) from your inventory? This cannot be undone.`;
    deleteError.textContent = "";
    deleteDialog.showModal();
  }

  // Update the displayed inventory only after the browser has saved the change.
  function persist(nextItems, errorElement) {
    try {
      window.InventoryStorage.saveItems(nextItems, items);
      items = nextItems;
      return true;
    } catch (error) {
      errorElement.textContent = `Changes could not be saved. ${error.message} Your inventory has not changed. Restore browser storage or reload and review before retrying.`;
      return false;
    }
  }

  function newId() {
    let id;
    do {
      id = `product-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    } while (items.some(item => item.id === id));
    return id;
  }

  for (const input of [nameInput, skuInput, stockInput, priceInput]) {
    input.addEventListener("input", () => {
      input.setCustomValidity("");
      productError.textContent = "";
    });
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    const name = nameInput.value.trim();
    const sku = skuInput.value.trim();
    const stock = stockInput.valueAsNumber;
    const price = priceInput.value;
    const priceCents = Math.round(Number(price) * 100);
    nameInput.setCustomValidity(name ? "" : "Enter a product name.");
    skuInput.setCustomValidity(!sku ? "Enter a SKU." :
      items.some(item => item.id !== editingId && item.sku.toLowerCase() === sku.toLowerCase())
        ? "This SKU is already used by another product." : "");
    stockInput.setCustomValidity(Number.isSafeInteger(stock) && stock >= 0
      ? "" : "Enter a whole number between 0 and 9007199254740991.");
    priceInput.setCustomValidity(/^(\d+(\.\d{1,2})?|\.\d{1,2})$/.test(price) && priceCents <= 999999999
      ? "" : "Enter a price between 0.00 and 9999999.99 with at most two decimal places.");
    if (!form.reportValidity()) return;

    const product = { id: editingId || newId(), name, sku, stock, priceCents };
    const nextItems = editingId
      ? items.map(item => item.id === editingId ? product : item)
      : [...items, product];
    if (!persist(nextItems, productError)) return;
    productDialog.close();
    render(editingId ? "Product updated. " : "Product added. ");
    renderCart();
    const editButton = Array.from(rows.querySelectorAll("button")).find(button =>
      button.dataset.id === product.id && button.dataset.action === "Edit");
    (editButton || searchInput).focus();
  });

  document.getElementById("confirm-delete").addEventListener("click", () => {
    if (!persist(items.filter(item => item.id !== deletingId), deleteError)) return;
    deleteDialog.close();
    render("Product deleted. ");
    renderCart();
    addButton.focus();
  });
  document.getElementById("cancel-product").addEventListener("click", () => productDialog.close());
  document.getElementById("cancel-delete").addEventListener("click", () => deleteDialog.close());
  addButton.addEventListener("click", () => openProduct());
  searchInput.addEventListener("input", () => render());
  clearSearchButton.addEventListener("click", () => {
    searchInput.value = "";
    render();
    searchInput.focus();
  });

  try {
    orders = window.InventoryStorage.loadOrders();
    ordersReady = true;
    renderOrders();
  } catch {
    ordersStatus.textContent = "Order history could not be loaded. Saved data has not been replaced. Checkout is unavailable; check browser storage and reload.";
  }

  try {
    items = window.InventoryStorage.initializeItems();
    try {
      cart = window.InventoryStorage.loadCart();
      cartReady = true;
      renderCart();
    } catch {
      cartStatus.textContent = "Cart could not be loaded. Browser storage may be unavailable or the saved cart may be invalid. Existing cart data has not been replaced.";
      cartTotal.textContent = "Total unavailable";
    }
    render();
    addButton.disabled = false;
    searchInput.disabled = false;
  } catch {
    table.hidden = true;
    status.textContent = "Inventory could not be loaded or initialized. Browser storage may be unavailable or full, or the saved data may be invalid. Existing saved data has not been replaced.";
    cartStatus.textContent = "Cart is unavailable because inventory could not be loaded.";
    cartTotal.textContent = "Total unavailable";
  }
})();
