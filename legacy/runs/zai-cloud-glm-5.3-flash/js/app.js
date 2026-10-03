/* Inventory site entry point.
 *
 * The data layer lives in js/store.js (`InventoryStore`); this file renders
 * it: a summary line, a lookup bar (search + category filter), a product
 * table, dialogs for adding, editing and deleting products, the shopping
 * cart with its checkout dialog, and the order history. All markup is built
 * here so index.html stays a shell. No server, no libraries.
 */
(function () {
  "use strict";

  /* Stock at or below this count is flagged as low. */
  var LOW_STOCK_THRESHOLD = 10;

  var money = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" });

  /* Long-lived nodes and dialog state, filled in by buildUi(). */
  var ui = { editingId: null, pendingDeleteId: null, cart: {}, orders: {} };

  /* ---- small helpers ----------------------------------------------------*/

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) {
      node.className = className;
    }
    if (text !== undefined && text !== null) {
      node.textContent = text;
    }
    return node;
  }

  function newButton(label, className) {
    var node = el("button", className, label);
    node.type = "button";
    return node;
  }

  /* Announce an outcome via the polite live region. */
  function say(message) {
    ui.status.textContent = message;
  }

  function formatDate(iso) {
    var date = new Date(iso);
    return isNaN(date.getTime()) ? iso : date.toLocaleString();
  }

  function totalValue(products) {
    return products.reduce(function (sum, product) {
      return sum + product.quantity * product.unitPrice;
    }, 0);
  }

  /* ---- form field errors -------------------------------------------------*/

  function clearFieldErrors() {
    Object.keys(ui.fields).forEach(function (key) {
      var field = ui.fields[key];
      field.error.textContent = "";
      field.error.hidden = true;
      field.input.removeAttribute("aria-invalid");
      field.input.removeAttribute("aria-describedby");
    });
  }

  /* Map store validation errors onto the matching inputs. */
  function showFieldErrors(errors) {
    errors = errors || {};
    var firstInvalid = null;
    Object.keys(ui.fields).forEach(function (key) {
      var field = ui.fields[key];
      var message = errors[key];
      if (message) {
        field.error.textContent = message;
        field.error.hidden = false;
        field.input.setAttribute("aria-invalid", "true");
        field.input.setAttribute("aria-describedby", field.error.id);
        if (!firstInvalid) {
          firstInvalid = field.input;
        }
      }
    });
    if (errors.id) {
      say(errors.id); // e.g. the product was deleted in another tab
    }
    if (firstInvalid) {
      firstInvalid.focus();
    }
  }

  /* ---- product form dialog -----------------------------------------------*/

  function makeField(key, labelText, attrs) {
    var id = "product-" + key;
    var wrapper = el("div", "field");
    var label = el("label", null, labelText);
    label.htmlFor = id;
    var input = document.createElement("input");
    input.id = id;
    input.name = key;
    input.autocomplete = "off";
    if (attrs) {
      for (var attr in attrs) {
        if (Object.prototype.hasOwnProperty.call(attrs, attr)) {
          input.setAttribute(attr, attrs[attr]);
        }
      }
    }
    var error = el("p", "field-error");
    error.id = "error-" + key;
    error.hidden = true;
    wrapper.appendChild(label);
    wrapper.appendChild(input);
    wrapper.appendChild(error);
    return { wrapper: wrapper, input: input, error: error };
  }

  function buildFormDialog() {
    var dialog = el("dialog", "dialog");
    var form = el("form", "product-form");
    form.noValidate = true; // validation messages come from the store

    ui.formTitle = el("h2", "dialog-title");
    form.appendChild(ui.formTitle);

    ui.meta = el("p", "dialog-meta");
    form.appendChild(ui.meta);

    /* Keys are in visual order, so error focus walks the form top-down. */
    ui.fields = {
      name: makeField("name", "Name"),
      sku: makeField("sku", "SKU"),
      category: makeField("category", "Category"),
      quantity: makeField("quantity", "Stock quantity", { type: "number", min: "0", step: "1" }),
      unitPrice: makeField("unitPrice", "Unit price", { type: "number", min: "0", step: "0.01" })
    };
    Object.keys(ui.fields).forEach(function (key) {
      form.appendChild(ui.fields[key].wrapper);
    });
    ui.fields.category.input.setAttribute("list", "category-options");

    var actions = el("div", "dialog-actions");
    var cancel = newButton("Cancel", "btn");
    cancel.addEventListener("click", function () {
      dialog.close();
    });
    ui.submitBtn = el("button", "btn btn-primary", "Add product");
    ui.submitBtn.type = "submit";
    actions.appendChild(cancel);
    actions.appendChild(ui.submitBtn);
    form.appendChild(actions);

    form.addEventListener("submit", onFormSubmit);
    dialog.appendChild(form);
    dialog.addEventListener("close", function () {
      ui.editingId = null;
    });
    ui.formDialog = dialog;
    return dialog;
  }

  function openFormDialog(product) {
    ui.editingId = product ? product.id : null;
    clearFieldErrors();
    ui.fields.name.input.value = product ? product.name : "";
    ui.fields.sku.input.value = product ? product.sku : "";
    ui.fields.category.input.value = product ? product.category : "";
    ui.fields.quantity.input.value = product ? String(product.quantity) : "";
    ui.fields.unitPrice.input.value = product ? String(product.unitPrice) : "";
    ui.formTitle.textContent = product ? "Edit product" : "Add product";
    ui.submitBtn.textContent = product ? "Save changes" : "Add product";
    if (product) {
      ui.meta.textContent = "Created " + formatDate(product.createdAt) +
        " · Last updated " + formatDate(product.updatedAt);
      ui.meta.hidden = false;
    } else {
      ui.meta.textContent = "";
      ui.meta.hidden = true;
    }
    ui.formDialog.showModal();
    ui.fields.name.input.focus();
  }

  function onFormSubmit(event) {
    event.preventDefault();
    clearFieldErrors();
    var wasEditing = Boolean(ui.editingId);
    var input = {
      name: ui.fields.name.input.value,
      sku: ui.fields.sku.input.value,
      category: ui.fields.category.input.value,
      quantity: ui.fields.quantity.input.value,
      unitPrice: ui.fields.unitPrice.input.value
    };
    var result = wasEditing
      ? InventoryStore.updateProduct(ui.editingId, input)
      : InventoryStore.addProduct(input);
    if (!result.ok) {
      showFieldErrors(result.errors);
      return;
    }
    ui.formDialog.close();
    render();
    say((wasEditing ? "Updated “" : "Added “") + result.product.name + "”.");
  }

  /* ---- delete confirmation dialog ------------------------------------------*/

  function buildConfirmDialog() {
    var dialog = el("dialog", "dialog dialog-confirm");
    dialog.appendChild(el("h2", "dialog-title", "Delete product"));
    ui.confirmText = el("p", "dialog-text");
    dialog.appendChild(ui.confirmText);
    var actions = el("div", "dialog-actions");
    var cancel = newButton("Cancel", "btn");
    cancel.addEventListener("click", function () {
      dialog.close();
    });
    var deleteBtn = newButton("Delete", "btn btn-danger");
    deleteBtn.addEventListener("click", onConfirmDelete);
    actions.appendChild(cancel);
    actions.appendChild(deleteBtn);
    dialog.appendChild(actions);
    dialog.addEventListener("close", function () {
      ui.pendingDeleteId = null;
    });
    ui.confirmDialog = dialog;
    return dialog;
  }

  function openConfirmDialog(product) {
    ui.pendingDeleteId = product.id;
    ui.confirmText.textContent =
      "Delete “" + product.name + "”? This cannot be undone.";
    ui.confirmDialog.showModal();
  }

  function onConfirmDelete() {
    var id = ui.pendingDeleteId;
    ui.confirmDialog.close();
    if (!id) {
      return;
    }
    var inCart = Boolean(InventoryStore.getCartItem(id));
    var result = InventoryStore.deleteProduct(id);
    render();
    if (!result.ok) {
      say(result.errors.id || "Could not delete the product.");
      return;
    }
    say("Deleted “" + result.product.name + "”" +
      (inCart ? " and removed it from the cart." : "."));
  }

  /* ---- lookup bar -----------------------------------------------------------*/

  function buildLookupBar() {
    var bar = el("div", "lookup");

    ui.search = document.createElement("input");
    ui.search.type = "search";
    ui.search.id = "product-search";
    ui.search.className = "lookup-input";
    ui.search.placeholder = "Search name, SKU or category";
    ui.search.autocomplete = "off";
    ui.search.setAttribute("aria-label", "Search products");
    ui.search.addEventListener("input", render);
    ui.search.addEventListener("keydown", onSearchKeydown);
    bar.appendChild(ui.search);

    ui.categorySelect = document.createElement("select");
    ui.categorySelect.id = "category-filter";
    ui.categorySelect.className = "lookup-select";
    ui.categorySelect.setAttribute("aria-label", "Filter by category");
    ui.categorySelect.addEventListener("change", render);
    bar.appendChild(ui.categorySelect);

    ui.clearBtn = newButton("Clear", "btn btn-small lookup-clear");
    ui.clearBtn.hidden = true;
    ui.clearBtn.addEventListener("click", onClearLookup);
    bar.appendChild(ui.clearBtn);

    return bar;
  }

  /* True while either lookup control is narrowing the table. */
  function lookupActive() {
    return ui.search.value.trim() !== "" || ui.categorySelect.value !== "";
  }

  function onSearchKeydown(event) {
    if (event.key === "Escape" && ui.search.value) {
      event.preventDefault();
      ui.search.value = "";
      render();
    }
  }

  function onClearLookup() {
    ui.search.value = "";
    ui.categorySelect.value = "";
    render();
    ui.search.focus();
  }

  /* ---- table ----------------------------------------------------------------*/

  function stockBadge(quantity) {
    if (quantity === 0) {
      return el("span", "badge badge-out", "Out of stock");
    }
    if (quantity <= LOW_STOCK_THRESHOLD) {
      return el("span", "badge badge-low", "Low stock");
    }
    return null;
  }

  function buildRow(product, inCart) {
    var row = el("tr");

    row.appendChild(el("td", "cell-name", product.name));

    var skuCell = el("td", "cell-sku", product.sku || "—");
    row.appendChild(skuCell);

    row.appendChild(el("td", "cell-category", product.category));

    var stockCell = el("td", "num cell-stock");
    stockCell.appendChild(el("span", "stock-count", String(product.quantity)));
    var badge = stockBadge(product.quantity);
    if (badge) {
      stockCell.appendChild(badge);
    }
    row.appendChild(stockCell);

    row.appendChild(el("td", "num", money.format(product.unitPrice)));

    var actionsCell = el("td", "actions");
    var addCartBtn = newButton("Add to cart", "btn btn-small");
    addCartBtn.setAttribute("data-action", "add-cart");
    addCartBtn.setAttribute("data-id", product.id);
    addCartBtn.setAttribute("aria-label", "Add " + product.name + " to the cart");
    if (product.quantity < 1) {
      addCartBtn.disabled = true;
      addCartBtn.title = "Out of stock";
    } else if (inCart[product.id] >= product.quantity) {
      addCartBtn.disabled = true;
      addCartBtn.title = "Every unit is already in the cart";
    }
    actionsCell.appendChild(addCartBtn);
    var editBtn = newButton("Edit", "btn btn-small");
    editBtn.setAttribute("data-action", "edit");
    editBtn.setAttribute("data-id", product.id);
    editBtn.setAttribute("aria-label", "Edit " + product.name);
    var deleteBtn = newButton("Delete", "btn btn-small btn-quiet-danger");
    deleteBtn.setAttribute("data-action", "delete");
    deleteBtn.setAttribute("data-id", product.id);
    deleteBtn.setAttribute("aria-label", "Delete " + product.name);
    actionsCell.appendChild(editBtn);
    actionsCell.appendChild(deleteBtn);
    row.appendChild(actionsCell);

    return row;
  }

  /* One delegated listener serves every row, so re-rendering the body
   * never re-binds handlers. */
  function onTableClick(event) {
    var btn = event.target.closest("button[data-action]");
    if (!btn || btn.disabled) {
      return;
    }
    var action = btn.getAttribute("data-action");
    var product = InventoryStore.getProduct(btn.getAttribute("data-id"));
    if (!product) {
      render(); // stale row: the product is gone
      return;
    }
    if (action === "add-cart") {
      onAddToCart(product);
    } else if (action === "edit") {
      openFormDialog(product);
    } else {
      openConfirmDialog(product);
    }
  }

  function onAddToCart(product) {
    var result = InventoryStore.addToCart(product.id, 1);
    render(); // the row's button state and the cart both follow the stock
    if (!result.ok) {
      say(result.errors.quantity || result.errors.id || "Could not add to the cart.");
      return;
    }
    say(result.clamped
      ? "Only " + result.item.quantity + " in stock — the cart holds that many."
      : "Added “" + product.name + "” to the cart.");
  }

  /* `all` is the full catalogue (drives the empty state), `shown` the
   * lookup result (drives the rows and totals), `cart` the current cart
   * (drives the add-to-cart buttons). */
  function renderTable(all, shown, cart) {
    ui.tbody.textContent = "";
    var inCart = {};
    cart.forEach(function (item) {
      inCart[item.id] = item.quantity;
    });
    shown.forEach(function (product) {
      ui.tbody.appendChild(buildRow(product, inCart));
    });
    var isEmpty = all.length === 0;
    ui.empty.hidden = !isEmpty;
    ui.noResults.hidden = isEmpty || shown.length > 0;
    ui.tableWrap.hidden = isEmpty || shown.length === 0;
    ui.totalCell.textContent = money.format(totalValue(shown));
    ui.footLabel.textContent = lookupActive()
      ? "Total value of shown products"
      : "Total inventory value";
  }

  function renderSummary(all, shown) {
    var units = 0;
    var outOfStock = 0;
    shown.forEach(function (product) {
      units += product.quantity;
      if (product.quantity === 0) {
        outOfStock += 1;
      }
    });
    var unitsText = units + (units === 1 ? " unit" : " units") + " in stock";
    var outText = outOfStock > 0 ? ", " + outOfStock + " out of stock." : ".";
    if (lookupActive()) {
      ui.summary.textContent =
        "Showing " + shown.length + " of " + all.length +
        (all.length === 1 ? " product" : " products") + ", " + unitsText + outText;
    } else {
      ui.summary.textContent =
        all.length + (all.length === 1 ? " product" : " products") + " tracked, " +
        unitsText + outText;
    }
  }

  /* Feed existing categories into the form's datalist so entries stay
   * consistent without a rigid dropdown. */
  function renderCategoryOptions(products) {
    var seen = {};
    ui.categoryOptions.textContent = "";
    products.forEach(function (product) {
      if (product.category && !seen[product.category]) {
        seen[product.category] = true;
        var option = document.createElement("option");
        option.value = product.category;
        ui.categoryOptions.appendChild(option);
      }
    });
  }

  /* Keep the filter's options in step with the catalogue, preserving the
   * current choice while that category still exists. */
  function renderCategoryFilter(products) {
    var seen = {};
    var categories = [];
    products.forEach(function (product) {
      if (product.category && !seen[product.category]) {
        seen[product.category] = true;
        categories.push(product.category);
      }
    });
    categories.sort();

    var current = ui.categorySelect.value;
    ui.categorySelect.textContent = "";
    ui.categorySelect.appendChild(newOption("", "All categories"));
    categories.forEach(function (category) {
      ui.categorySelect.appendChild(newOption(category, category));
    });
    if (current && categories.indexOf(current) !== -1) {
      ui.categorySelect.value = current;
    }
  }

  function newOption(value, label) {
    var option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    return option;
  }

  function render() {
    var products = InventoryStore.getProducts();
    /* Normalize the filter before using it: if the selected category just
     * fell out of the catalogue, the select resets to "All categories" and
     * everything below must follow suit rather than show a stale view. */
    renderCategoryFilter(products);
    var shown = InventoryStore.searchProducts(ui.search.value, { category: ui.categorySelect.value });
    var cart = InventoryStore.getCart();
    renderSummary(products, shown);
    renderTable(products, shown, cart);
    renderCategoryOptions(products);
    ui.clearBtn.hidden = !lookupActive();
    renderCart(cart);
    renderOrderHistory();
  }

  /* ---- cart ----------------------------------------------------------------*/

  function buildCart(root) {
    var toolbar = el("div", "toolbar cart-toolbar");
    toolbar.appendChild(el("h2", "toolbar-title", "Cart"));
    ui.cart.checkoutBtn = newButton("Checkout", "btn btn-primary cart-checkout");
    ui.cart.checkoutBtn.hidden = true;
    ui.cart.checkoutBtn.addEventListener("click", openCheckoutDialog);
    toolbar.appendChild(ui.cart.checkoutBtn);
    ui.cart.clearBtn = newButton("Clear cart", "btn btn-small btn-quiet-danger cart-clear");
    ui.cart.clearBtn.hidden = true;
    ui.cart.clearBtn.addEventListener("click", onClearCart);
    toolbar.appendChild(ui.cart.clearBtn);
    root.appendChild(toolbar);

    var card = el("div", "card");
    ui.cart.empty = el("p", "empty-state cart-empty",
      "Your cart is empty. Add products from the inventory above.");
    ui.cart.empty.hidden = true;
    card.appendChild(ui.cart.empty);

    var wrap = el("div", "table-wrap cart-wrap");
    var table = el("table", "product-table cart-table");
    table.setAttribute("aria-label", "Shopping cart");
    var thead = el("thead");
    var headRow = el("tr");
    var columns = [
      { label: "Product" },
      { label: "Unit price", className: "num" },
      { label: "Quantity" },
      { label: "Total", className: "num" },
      { label: "Actions", className: "actions" }
    ];
    columns.forEach(function (column) {
      var th = el("th", column.className, column.label);
      th.scope = "col";
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    ui.cart.tbody = el("tbody");
    ui.cart.tbody.addEventListener("click", onCartTableClick);
    table.appendChild(ui.cart.tbody);

    var tfoot = el("tfoot");
    var footRow = el("tr");
    ui.cart.footLabel = el("td", "tfoot-label cart-foot-label", "Total");
    ui.cart.footLabel.colSpan = 3;
    ui.cart.totalCell = el("td", "num tfoot-value cart-total");
    footRow.appendChild(ui.cart.footLabel);
    footRow.appendChild(ui.cart.totalCell);
    footRow.appendChild(el("td"));
    tfoot.appendChild(footRow);
    table.appendChild(tfoot);

    wrap.appendChild(table);
    card.appendChild(wrap);
    root.appendChild(card);

    ui.cart.wrap = wrap;
  }

  function buildCartRow(item) {
    var row = el("tr");

    row.appendChild(el("td", "cell-name", item.name));
    row.appendChild(el("td", "num", money.format(item.unitPrice)));

    var qtyCell = el("td", "cart-qty");
    var decBtn = newButton("−", "btn btn-small qty-btn");
    decBtn.setAttribute("data-action", "cart-dec");
    decBtn.setAttribute("data-id", item.id);
    decBtn.setAttribute("aria-label", "Decrease the quantity of " + item.name);
    var input = document.createElement("input");
    input.type = "number";
    input.className = "qty-input";
    input.value = String(item.quantity);
    input.min = "0";
    input.step = "1";
    input.autocomplete = "off";
    input.setAttribute("aria-label", "Quantity of " + item.name);
    input.setAttribute("data-id", item.id);
    input.addEventListener("change", function () {
      onQtyInputChanged(input);
    });
    var incBtn = newButton("+", "btn btn-small qty-btn");
    incBtn.setAttribute("data-action", "cart-inc");
    incBtn.setAttribute("data-id", item.id);
    incBtn.setAttribute("aria-label", "Increase the quantity of " + item.name);
    qtyCell.appendChild(decBtn);
    qtyCell.appendChild(input);
    qtyCell.appendChild(incBtn);
    row.appendChild(qtyCell);

    row.appendChild(el("td", "num cart-line-total", money.format(item.lineTotal)));

    var actionsCell = el("td", "actions");
    var removeBtn = newButton("Remove", "btn btn-small btn-quiet-danger");
    removeBtn.setAttribute("data-action", "cart-remove");
    removeBtn.setAttribute("data-id", item.id);
    removeBtn.setAttribute("aria-label", "Remove " + item.name + " from the cart");
    actionsCell.appendChild(removeBtn);
    row.appendChild(actionsCell);

    return row;
  }

  /* One delegated listener serves every cart row's buttons. */
  function onCartTableClick(event) {
    var btn = event.target.closest("button[data-action]");
    if (!btn || btn.disabled) {
      return;
    }
    var action = btn.getAttribute("data-action");
    var id = btn.getAttribute("data-id");
    if (action === "cart-remove") {
      onRemoveFromCart(id);
      return;
    }
    var item = InventoryStore.getCartItem(id);
    if (!item) {
      renderCart(); // stale row: the item is gone
      return;
    }
    stepCartQuantity(item, action === "cart-inc" ? 1 : -1);
  }

  /* Apply a ± delta; dropping to zero removes the line. */
  function stepCartQuantity(item, delta) {
    var result = InventoryStore.setCartQuantity(item.id, item.quantity + delta);
    renderCart();
    if (!result.ok) {
      say(result.errors.quantity || result.errors.id);
      return;
    }
    if (result.removed) {
      say("Removed “" + item.name + "” from the cart.");
    } else if (result.clamped) {
      say("Only " + result.item.quantity + " in stock — the cart holds that many.");
    }
  }

  function onQtyInputChanged(input) {
    var id = input.getAttribute("data-id");
    var result = InventoryStore.setCartQuantity(id, input.value);
    renderCart(); // re-renders with the canonical value, restoring bad input
    if (!result.ok) {
      say(result.errors.quantity || result.errors.id || "Could not update the quantity.");
      return;
    }
    if (result.removed) {
      var product = InventoryStore.getProduct(id);
      say("Removed “" + (product ? product.name : "item") + "” from the cart.");
    } else if (result.clamped) {
      say("Only " + result.item.quantity + " in stock — the cart holds that many.");
    }
  }

  function onRemoveFromCart(id) {
    var product = InventoryStore.getProduct(id);
    var result = InventoryStore.removeFromCart(id);
    renderCart();
    if (!result.ok) {
      say(result.errors.id || "Could not remove that item.");
      return;
    }
    say("Removed “" + (product ? product.name : "item") + "” from the cart.");
  }

  function onClearCart() {
    InventoryStore.clearCart();
    renderCart();
    say("Cart cleared.");
  }

  function renderCart(cart) {
    if (!cart) {
      cart = InventoryStore.getCart();
    }
    ui.cart.tbody.textContent = "";
    cart.forEach(function (item) {
      ui.cart.tbody.appendChild(buildCartRow(item));
    });
    var isEmpty = cart.length === 0;
    ui.cart.empty.hidden = !isEmpty;
    ui.cart.wrap.hidden = isEmpty;
    ui.cart.checkoutBtn.hidden = isEmpty;
    ui.cart.clearBtn.hidden = isEmpty;
    var totals = InventoryStore.cartTotals();
    ui.cart.footLabel.textContent =
      "Total (" + totals.units + (totals.units === 1 ? " unit" : " units") + ")";
    ui.cart.totalCell.textContent = money.format(totals.total);
  }

  /* ---- checkout ------------------------------------------------------------*/

  function buildCheckoutDialog() {
    var dialog = el("dialog", "dialog dialog-confirm");
    dialog.appendChild(el("h2", "dialog-title", "Checkout"));
    ui.checkoutText = el("p", "dialog-text checkout-text");
    dialog.appendChild(ui.checkoutText);
    var actions = el("div", "dialog-actions");
    var cancel = newButton("Cancel", "btn");
    cancel.addEventListener("click", function () {
      dialog.close();
    });
    var placeBtn = newButton("Place order", "btn btn-primary");
    placeBtn.addEventListener("click", onConfirmCheckout);
    actions.appendChild(cancel);
    actions.appendChild(placeBtn);
    dialog.appendChild(actions);
    ui.checkoutDialog = dialog;
    return dialog;
  }

  function openCheckoutDialog() {
    var totals = InventoryStore.cartTotals();
    ui.checkoutText.textContent =
      "Place an order for " + totals.units + (totals.units === 1 ? " unit" : " units") +
      " across " + totals.items + (totals.items === 1 ? " product" : " products") +
      ", totalling " + money.format(totals.total) +
      "? The stock is reduced and this cannot be undone.";
    ui.checkoutDialog.showModal();
  }

  function onConfirmCheckout() {
    ui.checkoutDialog.close();
    var result = InventoryStore.checkout();
    render(); // stock, cart and history all move together
    if (!result.ok) {
      say(result.errors.cart || "Could not place the order.");
      return;
    }
    var order = result.order;
    say("Order #" + order.number + " placed: " +
      order.units + (order.units === 1 ? " unit" : " units") + ", " +
      money.format(order.total) + ". Stock updated.");
  }

  /* ---- order history ----------------------------------------------------------*/

  function buildOrderHistory(root) {
    var toolbar = el("div", "toolbar order-toolbar");
    toolbar.appendChild(el("h2", "toolbar-title", "Order history"));
    root.appendChild(toolbar);

    var card = el("div", "card");
    ui.orders.empty = el("p", "empty-state orders-empty",
      "No orders yet. Completed checkouts will appear here.");
    ui.orders.empty.hidden = true;
    card.appendChild(ui.orders.empty);

    var wrap = el("div", "table-wrap orders-wrap");
    var table = el("table", "product-table orders-table");
    table.setAttribute("aria-label", "Order history");
    var thead = el("thead");
    var headRow = el("tr");
    [
      { label: "Order" },
      { label: "Placed" },
      { label: "Items" },
      { label: "Units", className: "num" },
      { label: "Total", className: "num" }
    ].forEach(function (column) {
      var th = el("th", column.className, column.label);
      th.scope = "col";
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    ui.orders.tbody = el("tbody");
    table.appendChild(ui.orders.tbody);

    wrap.appendChild(table);
    card.appendChild(wrap);
    root.appendChild(card);

    ui.orders.wrap = wrap;
  }

  function buildOrderRow(order) {
    var row = el("tr");
    row.appendChild(el("td", "cell-sku order-id", "#" + order.number));
    row.appendChild(el("td", "order-date", formatDate(order.placedAt)));
    row.appendChild(el("td", "order-items", order.items.map(function (item) {
      return item.quantity + " × " + item.name;
    }).join(", ")));
    row.appendChild(el("td", "num", String(order.units)));
    row.appendChild(el("td", "num", money.format(order.total)));
    return row;
  }

  function renderOrderHistory() {
    var orders = InventoryStore.getOrders();
    ui.orders.tbody.textContent = "";
    /* Newest first: the store keeps the history chronological. */
    orders.slice().reverse().forEach(function (order) {
      ui.orders.tbody.appendChild(buildOrderRow(order));
    });
    var isEmpty = orders.length === 0;
    ui.orders.empty.hidden = !isEmpty;
    ui.orders.wrap.hidden = isEmpty;
  }

  /* ---- setup ----------------------------------------------------------------*/

  function buildUi(root) {
    if (!InventoryStore.isAvailable()) {
      root.appendChild(el("p", "notice",
        "localStorage is not available in this browser, so changes will not be saved."));
    }

    ui.status = el("p", "status");
    ui.status.setAttribute("role", "status");
    root.appendChild(ui.status);

    ui.summary = el("p", "summary");
    root.appendChild(ui.summary);

    var toolbar = el("div", "toolbar");
    toolbar.appendChild(el("h2", "toolbar-title", "Products"));
    toolbar.appendChild(buildLookupBar());
    var addBtn = newButton("Add product", "btn btn-primary");
    addBtn.addEventListener("click", function () {
      openFormDialog(null);
    });
    toolbar.appendChild(addBtn);
    root.appendChild(toolbar);

    var card = el("div", "card");
    ui.empty = el("p", "empty-state",
      "No products yet. Add your first one to get started.");
    ui.empty.hidden = true;
    card.appendChild(ui.empty);

    ui.noResults = el("p", "no-results",
      "No products match your search. Try different keywords or clear the filter.");
    ui.noResults.hidden = true;
    card.appendChild(ui.noResults);

    var wrap = el("div", "table-wrap");
    var table = el("table", "product-table");
    var thead = el("thead");
    var headRow = el("tr");
    var columns = [
      { label: "Name" },
      { label: "SKU" },
      { label: "Category" },
      { label: "Stock", className: "num" },
      { label: "Unit price", className: "num" },
      { label: "Actions", className: "actions" }
    ];
    columns.forEach(function (column) {
      var th = el("th", column.className, column.label);
      th.scope = "col";
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    ui.tbody = el("tbody");
    ui.tbody.addEventListener("click", onTableClick);
    table.appendChild(ui.tbody);

    var tfoot = el("tfoot");
    var footRow = el("tr");
    var footLabel = el("td", "tfoot-label", "Total inventory value");
    footLabel.colSpan = 4;
    ui.footLabel = footLabel;
    ui.totalCell = el("td", "num tfoot-value");
    footRow.appendChild(footLabel);
    footRow.appendChild(ui.totalCell);
    footRow.appendChild(el("td"));
    tfoot.appendChild(footRow);
    table.appendChild(tfoot);

    wrap.appendChild(table);
    card.appendChild(wrap);
    root.appendChild(card);

    ui.tableWrap = wrap;

    buildCart(root);
    buildOrderHistory(root);

    root.appendChild(buildFormDialog());
    root.appendChild(buildConfirmDialog());
    root.appendChild(buildCheckoutDialog());

    ui.categoryOptions = document.createElement("datalist");
    ui.categoryOptions.id = "category-options";
    root.appendChild(ui.categoryOptions);
  }

  function init() {
    var root = document.getElementById("inventory-root");
    if (!root) {
      return;
    }

    if (typeof window.InventoryStore === "undefined") {
      root.textContent = "Inventory data layer failed to load.";
      return;
    }

    buildUi(root);
    render();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
