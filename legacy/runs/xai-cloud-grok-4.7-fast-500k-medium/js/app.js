/* Inventory page: list, find, and add, edit, or delete products, keep a cart, and check out. */
(function () {
  var form;
  var formError;
  var editorHeading;
  var nameInput;
  var skuInput;
  var stockInput;
  var submitButton;
  var cancelButton;
  var searchInput;
  var stockFilter;
  var statusNode;
  var table;
  var rows;
  var deleteDialog;
  var deleteCopy;
  var pendingDeleteId = "";
  var cartError;
  var cartStatus;
  var cartTable;
  var cartRows;
  var cartTotal;
  var cartFocus = null;
  var checkoutButton;
  var checkoutNote;
  var checkoutDialog;
  var checkoutCopy;
  var checkoutLines;
  var ordersStatus;
  var ordersTable;
  var orderRows;
  var refreshGeneration = 0;

  function unitsOnHand(products) {
    return products.reduce(function (sum, product) {
      return sum + product.stock;
    }, 0);
  }

  function editingId() {
    return form.getAttribute("data-editing") || "";
  }

  function showError(message) {
    if (!message) {
      formError.hidden = true;
      formError.textContent = "";
      return;
    }
    formError.hidden = false;
    formError.textContent = message;
  }

  function showCartError(message) {
    if (!message) {
      cartError.hidden = true;
      cartError.textContent = "";
      return;
    }
    cartError.hidden = false;
    cartError.textContent = message;
  }

  function showCheckoutNote(message) {
    if (!message) {
      checkoutNote.hidden = true;
      checkoutNote.textContent = "";
      return;
    }
    checkoutNote.hidden = false;
    checkoutNote.textContent = message;
  }

  function setEditor(product) {
    showError("");
    if (!product) {
      form.removeAttribute("data-editing");
      editorHeading.textContent = "Add product";
      submitButton.textContent = "Add product";
      cancelButton.hidden = true;
      form.reset();
      return;
    }
    form.setAttribute("data-editing", product.id);
    editorHeading.textContent = "Edit product";
    submitButton.textContent = "Save changes";
    cancelButton.hidden = false;
    nameInput.value = product.name;
    skuInput.value = product.sku;
    stockInput.value = String(product.stock);
  }

  function lookupTerms() {
    return Inventory.searchTerms(searchInput.value);
  }

  function stockMode() {
    return stockFilter.value || "all";
  }

  function lookupActive(terms) {
    return terms.length > 0 || stockMode() !== "all";
  }

  function visibleProducts(products, terms) {
    var matched = terms.length === 0 ? products : Inventory.find(searchInput.value);
    if (stockMode() === "in") {
      return matched.filter(function (product) {
        return product.stock > 0;
      });
    }
    if (stockMode() === "out") {
      return matched.filter(function (product) {
        return product.stock === 0;
      });
    }
    return matched;
  }

  function countLabel(shown, total, active) {
    if (!active) {
      return total === 1 ? "1 product" : total + " products";
    }
    var totalLabel = total === 1 ? "1 product" : total + " products";
    return shown + " of " + totalLabel;
  }

  function emptyLookupMessage() {
    var shownQuery = searchInput.value.trim().replace(/\s+/g, " ");
    var mode = stockMode();
    if (shownQuery && mode === "in") {
      return "No in-stock products match \"" + shownQuery + "\".";
    }
    if (shownQuery && mode === "out") {
      return "No out-of-stock products match \"" + shownQuery + "\".";
    }
    if (shownQuery) {
      return "No products match \"" + shownQuery + "\".";
    }
    if (mode === "in") {
      return "No products are in stock.";
    }
    if (mode === "out") {
      return "No products are out of stock.";
    }
    return "No products match.";
  }

  function clampText(content, sku) {
    var span = document.createElement("span");
    span.className = sku ? "clamp-text clamp-sku" : "clamp-text";
    span.appendChild(content);
    return span;
  }

  function highlight(text, terms) {
    var fragment = document.createDocumentFragment();
    if (!text || terms.length === 0) {
      fragment.appendChild(document.createTextNode(text || ""));
      return fragment;
    }
    var lower = text.toLowerCase();
    var index = 0;
    while (index < text.length) {
      var matchAt = -1;
      var matchLen = 0;
      for (var i = 0; i < terms.length; i += 1) {
        var at = lower.indexOf(terms[i], index);
        if (at !== -1 && (matchAt === -1 || at < matchAt || (at === matchAt && terms[i].length > matchLen))) {
          matchAt = at;
          matchLen = terms[i].length;
        }
      }
      if (matchAt === -1) {
        fragment.appendChild(document.createTextNode(text.slice(index)));
        break;
      }
      if (matchAt > index) {
        fragment.appendChild(document.createTextNode(text.slice(index, matchAt)));
      }
      var mark = document.createElement("mark");
      mark.textContent = text.slice(matchAt, matchAt + matchLen);
      fragment.appendChild(mark);
      index = matchAt + matchLen;
    }
    return fragment;
  }

  function render(products) {
    var terms = lookupTerms();
    var active = lookupActive(terms);
    var visible = visibleProducts(products, terms);
    var activeId = editingId();
    rows.replaceChildren();
    if (products.length === 0) {
      statusNode.textContent = "No products yet.";
      table.hidden = true;
      return;
    }
    if (visible.length === 0) {
      statusNode.textContent = emptyLookupMessage();
      table.hidden = true;
      return;
    }

    table.hidden = false;
    var units = unitsOnHand(active ? visible : products);
    var unitLabel;
    if (active) {
      unitLabel = units === 1 ? "1 unit shown" : units + " units shown";
    } else {
      unitLabel = units === 1 ? "1 unit on hand" : units + " units on hand";
    }
    statusNode.textContent = countLabel(visible.length, products.length, active) + " · " + unitLabel;

    visible.forEach(function (product) {
      var row = document.createElement("tr");
      row.setAttribute("data-product-id", product.id);
      if (product.stock === 0) {
        row.classList.add("is-out");
      }
      if (product.id === activeId) {
        row.classList.add("is-editing");
      }

      var nameCell = document.createElement("td");
      nameCell.appendChild(clampText(highlight(product.name, terms), false));

      var skuCell = document.createElement("td");
      skuCell.className = "sku";
      skuCell.appendChild(clampText(product.sku ? highlight(product.sku, terms) : document.createTextNode("—"), true));

      var stockCell = document.createElement("td");
      stockCell.className = "num";
      stockCell.textContent = String(product.stock);

      var actionsCell = document.createElement("td");
      actionsCell.className = "actions";
      var actionGroup = document.createElement("div");
      actionGroup.className = "row-actions";

      var editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "ghost";
      editButton.setAttribute("data-product-action", "edit");
      editButton.textContent = "Edit";
      editButton.setAttribute("aria-label", "Edit " + product.name);
      editButton.addEventListener("click", function () {
        beginEdit(product.id);
      });

      var addButton = document.createElement("button");
      addButton.type = "button";
      addButton.className = "ghost";
      addButton.setAttribute("data-product-action", "add");
      addButton.textContent = "Add to cart";
      addButton.disabled = product.stock === 0;
      addButton.setAttribute(
        "aria-label",
        product.stock === 0 ? product.name + " is out of stock" : "Add " + product.name + " to cart"
      );
      addButton.addEventListener("click", function () {
        addToCart(product.id);
      });

      var deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "danger";
      deleteButton.setAttribute("data-product-action", "delete");
      deleteButton.textContent = "Delete";
      deleteButton.setAttribute("aria-label", "Delete " + product.name);
      deleteButton.addEventListener("click", function () {
        askDelete(product.id);
      });

      actionGroup.appendChild(addButton);
      actionGroup.appendChild(editButton);
      actionGroup.appendChild(deleteButton);
      actionsCell.appendChild(actionGroup);
      row.appendChild(nameCell);
      row.appendChild(skuCell);
      row.appendChild(stockCell);
      row.appendChild(actionsCell);
      rows.appendChild(row);
    });
  }

  function formatPlaced(iso) {
    var date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return iso;
    }
    try {
      return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
    } catch (_) {
      return date.toLocaleString();
    }
  }

  function lineLabel(line) {
    var name = line.sku ? line.name + " (" + line.sku + ")" : line.name;
    return name + " × " + line.quantity;
  }

  function renderCart(items) {
    cartRows.replaceChildren();
    checkoutButton.disabled = items.length === 0;
    if (items.length === 0) {
      cartStatus.textContent = "Cart is empty.";
      cartTable.hidden = true;
      cartTotal.textContent = "0";
      return;
    }

    cartTable.hidden = false;
    var total = Cart.totalQuantity(items);
    var productLabel = items.length === 1 ? "1 product" : items.length + " products";
    var unitLabel = total === 1 ? "1 unit" : total + " units";
    cartStatus.textContent = productLabel + " · Total: " + unitLabel;
    cartTotal.textContent = String(total);

    items.forEach(function (item) {
      var row = document.createElement("tr");
      row.setAttribute("data-product-id", item.productId);

      var nameCell = document.createElement("td");
      nameCell.textContent = item.name;

      var skuCell = document.createElement("td");
      skuCell.className = "sku";
      skuCell.textContent = item.sku || "—";

      var qtyCell = document.createElement("td");
      qtyCell.className = "num";
      var qty = document.createElement("div");
      qty.className = "qty";

      var down = document.createElement("button");
      down.type = "button";
      down.className = "ghost qty-btn";
      down.textContent = "-";
      down.disabled = item.quantity <= 1;
      down.setAttribute("data-cart-part", "down");
      down.setAttribute("aria-label", "Decrease quantity of " + item.name);
      down.addEventListener("click", function () {
        cartFocus = { productId: item.productId, part: "down" };
        var current = storedQuantity(item.productId);
        if (current == null) {
          refresh();
          return;
        }
        changeQuantity(item.productId, current - 1);
      });

      var qtyInput = document.createElement("input");
      qtyInput.type = "number";
      qtyInput.min = "0";
      qtyInput.max = String(item.stock);
      qtyInput.step = "1";
      qtyInput.inputMode = "numeric";
      qtyInput.value = String(item.quantity);
      qtyInput.setAttribute("data-cart-part", "input");
      qtyInput.setAttribute("aria-label", "Quantity of " + item.name);
      qtyInput.addEventListener("change", function () {
        // Commit before the click that blurred this field, but redraw after that click lands.
        var value = qtyInput.value;
        var result;
        try {
          result = Cart.setQuantity(item.productId, value);
        } catch (_) {
          result = { ok: false, error: "Could not save the cart in this browser." };
        }
        applyCartResult(result);
        scheduleCartRefresh();
      });

      var up = document.createElement("button");
      up.type = "button";
      up.className = "ghost qty-btn";
      up.textContent = "+";
      up.disabled = item.quantity >= item.stock;
      up.setAttribute("data-cart-part", "up");
      up.setAttribute("aria-label", "Increase quantity of " + item.name);
      up.addEventListener("click", function () {
        cartFocus = { productId: item.productId, part: "up" };
        var current = storedQuantity(item.productId);
        if (current == null) {
          refresh();
          return;
        }
        changeQuantity(item.productId, current + 1);
      });

      qty.appendChild(down);
      qty.appendChild(qtyInput);
      qty.appendChild(up);
      qtyCell.appendChild(qty);

      var actionsCell = document.createElement("td");
      actionsCell.className = "actions";
      var removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "danger";
      removeButton.setAttribute("data-cart-part", "remove");
      removeButton.textContent = "Remove";
      removeButton.setAttribute("aria-label", "Remove " + item.name + " from cart");
      removeButton.addEventListener("click", function () {
        removeFromCart(item.productId);
      });
      actionsCell.appendChild(removeButton);

      row.appendChild(nameCell);
      row.appendChild(skuCell);
      row.appendChild(qtyCell);
      row.appendChild(actionsCell);
      cartRows.appendChild(row);
    });

    if (cartFocus) {
      var focus = cartFocus;
      cartFocus = null;
      var row = cartRows.querySelector('[data-product-id="' + CSS.escape(focus.productId) + '"]');
      var target = row ? row.querySelector('[data-cart-part="' + focus.part + '"]') : null;
      if (target && !target.disabled) {
        target.focus();
      } else if (row) {
        var fallback = row.querySelector('[data-cart-part="input"]');
        if (fallback) {
          fallback.focus();
        }
      }
    }
  }

  function renderOrders(orders) {
    orderRows.replaceChildren();
    if (orders.length === 0) {
      ordersStatus.textContent = "No orders yet.";
      ordersTable.hidden = true;
      return;
    }

    ordersTable.hidden = false;
    var units = orders.reduce(function (sum, order) {
      return sum + order.units;
    }, 0);
    var orderLabel = orders.length === 1 ? "1 order" : orders.length + " orders";
    var unitLabel = units === 1 ? "1 unit" : units + " units";
    ordersStatus.textContent = orderLabel + " · " + unitLabel;

    orders.forEach(function (order) {
      var row = document.createElement("tr");

      var numberCell = document.createElement("td");
      numberCell.textContent = order.number ? String(order.number) : order.id;

      var placedCell = document.createElement("td");
      var time = document.createElement("time");
      time.dateTime = order.placedAt;
      time.textContent = formatPlaced(order.placedAt);
      placedCell.appendChild(time);

      var itemsCell = document.createElement("td");
      itemsCell.className = "items";
      var lineList = document.createElement("ul");
      lineList.className = "order-lines";
      order.lines.forEach(function (line) {
        var item = document.createElement("li");
        item.textContent = lineLabel(line);
        lineList.appendChild(item);
      });
      itemsCell.appendChild(lineList);

      var unitsCell = document.createElement("td");
      unitsCell.className = "num";
      unitsCell.textContent = String(order.units);

      row.appendChild(numberCell);
      row.appendChild(placedCell);
      row.appendChild(itemsCell);
      row.appendChild(unitsCell);
      orderRows.appendChild(row);
    });
  }

  function refresh() {
    refreshGeneration += 1;
    try {
      render(Inventory.list());
    } catch (_) {
      statusNode.textContent = "Could not load inventory stored in this browser.";
      table.hidden = true;
    }
    try {
      renderCart(Cart.list());
    } catch (_) {
      cartStatus.textContent = "Could not load the cart stored in this browser.";
      cartTable.hidden = true;
      checkoutButton.disabled = true;
    }
    try {
      renderOrders(Orders.list());
    } catch (_) {
      ordersStatus.textContent = "Could not load orders stored in this browser.";
      ordersTable.hidden = true;
    }
  }

  function addToCart(id) {
    var result;
    try {
      result = Cart.add(id);
    } catch (_) {
      result = { ok: false, error: "Could not save the cart in this browser." };
    }
    if (!result.ok) {
      showCartError(result.error);
      showCheckoutNote("");
      refresh();
      return;
    }
    showCartError("");
    showCheckoutNote("");
    refresh();
  }

  function storedQuantity(productId) {
    var lines;
    try {
      lines = Cart.contents();
    } catch (_) {
      return null;
    }
    for (var i = 0; i < lines.length; i += 1) {
      if (lines[i].productId === productId) {
        return lines[i].quantity;
      }
    }
    return null;
  }

  function cartResultMessage(result) {
    if (!result.ok) {
      return result.error;
    }
    if (result.clamped && result.item) {
      return "Only " + result.quantity + " " + result.item.name + " in stock.";
    }
    if (result.clamped) {
      return "Only " + result.quantity + " in stock.";
    }
    return "";
  }

  function applyCartResult(result) {
    showCartError(cartResultMessage(result));
    showCheckoutNote("");
  }

  function focusTarget(saved) {
    if (!saved) {
      return null;
    }
    if (saved.kind === "id") {
      return document.getElementById(saved.id);
    }
    if (saved.kind === "cart") {
      var cartRow = cartRows.querySelector('[data-product-id="' + CSS.escape(saved.productId) + '"]');
      if (!cartRow || !saved.part) {
        return null;
      }
      return cartRow.querySelector('[data-cart-part="' + CSS.escape(saved.part) + '"]');
    }
    if (saved.kind === "product") {
      var productRow = rows.querySelector('[data-product-id="' + CSS.escape(saved.productId) + '"]');
      if (!productRow || !saved.action) {
        return null;
      }
      return productRow.querySelector('[data-product-action="' + CSS.escape(saved.action) + '"]');
    }
    return null;
  }

  function captureFocus() {
    var el = document.activeElement;
    if (!el || el === document.body) {
      return null;
    }
    if (el.id) {
      return { kind: "id", id: el.id };
    }
    var cartRow = el.closest("#cart-rows tr");
    if (cartRow) {
      return {
        kind: "cart",
        productId: cartRow.getAttribute("data-product-id"),
        part: el.getAttribute("data-cart-part")
      };
    }
    var productRow = el.closest("#product-rows tr");
    if (productRow) {
      return {
        kind: "product",
        productId: productRow.getAttribute("data-product-id"),
        action: el.getAttribute("data-product-action")
      };
    }
    return null;
  }

  function restoreFocus(saved) {
    var el = focusTarget(saved);
    if (el && el.disabled && saved.kind === "cart") {
      var row = el.closest("tr");
      el = row ? row.querySelector('[data-cart-part="input"]') : null;
    }
    if (!el || el.disabled || el === document.activeElement) {
      return;
    }
    el.focus();
  }

  function scheduleCartRefresh() {
    var generation = refreshGeneration;
    setTimeout(function () {
      if (generation !== refreshGeneration) {
        return;
      }
      var savedFocus = captureFocus();
      refresh();
      restoreFocus(savedFocus);
    }, 0);
  }

  function changeQuantity(id, quantity) {
    var result;
    try {
      result = Cart.setQuantity(id, quantity);
    } catch (_) {
      result = { ok: false, error: "Could not save the cart in this browser." };
    }
    applyCartResult(result);
    refresh();
  }

  function removeFromCart(id) {
    var result;
    try {
      result = Cart.remove(id);
    } catch (_) {
      result = { ok: false, error: "Could not save the cart in this browser." };
    }
    if (!result.ok) {
      showCartError(result.error);
      showCheckoutNote("");
      refresh();
      return;
    }
    showCartError("");
    showCheckoutNote("");
    refresh();
  }

  function closeCheckout() {
    checkoutLines.replaceChildren();
    if (checkoutDialog.open) {
      checkoutDialog.close();
    }
  }

  function syncEditorStock(order) {
    var id = editingId();
    if (!id) {
      return;
    }
    var soldQty = 0;
    order.lines.forEach(function (line) {
      if (line.productId === id) {
        soldQty += line.quantity;
      }
    });
    if (!soldQty) {
      return;
    }
    var product = null;
    try {
      product = Inventory.get(id);
    } catch (_) {
      return;
    }
    if (!product) {
      setEditor(null);
      return;
    }
    // Only advance an untouched stock field. A value the user typed stays put.
    if (stockInput.value.trim() === String(product.stock + soldQty)) {
      stockInput.value = String(product.stock);
    }
  }

  function askCheckout() {
    showCheckoutNote("");
    var result;
    try {
      result = Orders.summary();
    } catch (_) {
      result = { ok: false, error: "Could not complete checkout in this browser." };
    }
    if (!result.ok) {
      showCartError(result.error);
      refresh();
      return;
    }
    showCartError("");
    var unitLabel = result.units === 1 ? "1 unit" : result.units + " units";
    checkoutCopy.textContent = "Place this order for " + unitLabel + "? Stock on hand is reduced, the cart is cleared, and the order is saved in this browser.";
    checkoutLines.replaceChildren();
    result.items.forEach(function (item) {
      var line = document.createElement("li");
      line.textContent = lineLabel(item);
      checkoutLines.appendChild(line);
    });
    checkoutDialog.showModal();
    checkoutDialog.scrollTop = 0;
    checkoutLines.scrollTop = 0;
  }

  function confirmCheckout() {
    closeCheckout();
    var result;
    try {
      result = Orders.checkout();
    } catch (_) {
      result = { ok: false, error: "Could not complete checkout in this browser." };
    }
    if (!result.ok) {
      showCartError(result.error);
      showCheckoutNote("");
      refresh();
      return;
    }
    showCartError("");
    syncEditorStock(result.order);
    showCheckoutNote("Order " + result.order.number + " placed. Stock on hand was updated.");
    refresh();
  }

  function formFields() {
    return {
      name: nameInput.value,
      sku: skuInput.value,
      stock: stockInput.value
    };
  }

  function beginEdit(id) {
    var product = null;
    try {
      product = Inventory.get(id);
    } catch (_) {
      statusNode.textContent = "Could not load inventory stored in this browser.";
      return;
    }
    if (!product) {
      setEditor(null);
      refresh();
      return;
    }
    setEditor(product);
    refresh();
    nameInput.focus();
    editorHeading.scrollIntoView({ block: "nearest" });
  }

  function askDelete(id) {
    var product = null;
    try {
      product = Inventory.get(id);
    } catch (_) {
      statusNode.textContent = "Could not load inventory stored in this browser.";
      return;
    }
    if (!product) {
      refresh();
      return;
    }
    pendingDeleteId = product.id;
    deleteCopy.textContent = "Delete " + product.name + "? This removes it from the inventory saved in this browser.";
    deleteDialog.showModal();
  }

  function closeDelete() {
    pendingDeleteId = "";
    if (deleteDialog.open) {
      deleteDialog.close();
    }
  }

  function confirmDelete() {
    var id = pendingDeleteId;
    closeDelete();
    if (!id) {
      return;
    }
    var result;
    try {
      result = Inventory.remove(id);
    } catch (_) {
      result = { ok: false, error: "Could not save inventory in this browser." };
    }
    if (!result.ok) {
      showError(result.error);
      refresh();
      return;
    }
    if (editingId() === id) {
      setEditor(null);
    }
    showCartError("");
    refresh();
  }

  function onSubmit(event) {
    event.preventDefault();
    var id = editingId();
    var result;
    try {
      result = id ? Inventory.update(id, formFields()) : Inventory.add(formFields());
    } catch (_) {
      result = { ok: false, error: "Could not save inventory in this browser." };
    }
    if (!result.ok) {
      showError(result.error);
      return;
    }
    var savedProduct = result.product;
    var wasEdit = !!id;
    setEditor(null);
    showCartError("");
    refresh();
    if (savedProduct && !rows.querySelector('[data-product-id="' + CSS.escape(savedProduct.id) + '"]')) {
      var verb = wasEdit ? "Saved " : "Added ";
      statusNode.textContent = verb + savedProduct.name + ". It is hidden by the current search or stock filter. " + statusNode.textContent;
    }
    nameInput.focus();
  }

  function init() {
    form = document.getElementById("product-form");
    formError = document.getElementById("product-form-error");
    editorHeading = document.getElementById("editor-heading");
    nameInput = document.getElementById("product-name");
    skuInput = document.getElementById("product-sku");
    stockInput = document.getElementById("product-stock");
    submitButton = document.getElementById("product-submit");
    cancelButton = document.getElementById("product-cancel");
    searchInput = document.getElementById("product-search");
    stockFilter = document.getElementById("stock-filter");
    statusNode = document.getElementById("inventory-status");
    table = document.getElementById("product-table");
    rows = document.getElementById("product-rows");
    deleteDialog = document.getElementById("delete-dialog");
    deleteCopy = document.getElementById("delete-copy");
    cartError = document.getElementById("cart-error");
    cartStatus = document.getElementById("cart-status");
    cartTable = document.getElementById("cart-table");
    cartRows = document.getElementById("cart-rows");
    cartTotal = document.getElementById("cart-total");
    checkoutButton = document.getElementById("checkout-open");
    checkoutNote = document.getElementById("checkout-note");
    checkoutDialog = document.getElementById("checkout-dialog");
    checkoutCopy = document.getElementById("checkout-copy");
    checkoutLines = document.getElementById("checkout-lines");
    ordersStatus = document.getElementById("orders-status");
    ordersTable = document.getElementById("orders-table");
    orderRows = document.getElementById("order-rows");

    form.addEventListener("submit", onSubmit);
    searchInput.addEventListener("input", refresh);
    searchInput.addEventListener("search", refresh);
    stockFilter.addEventListener("change", refresh);
    cancelButton.addEventListener("click", function () {
      setEditor(null);
      refresh();
      nameInput.focus();
    });
    document.getElementById("delete-cancel").addEventListener("click", closeDelete);
    document.getElementById("delete-confirm").addEventListener("click", confirmDelete);
    deleteDialog.addEventListener("cancel", function () {
      pendingDeleteId = "";
    });
    checkoutButton.addEventListener("click", askCheckout);
    document.getElementById("checkout-cancel").addEventListener("click", closeCheckout);
    document.getElementById("checkout-confirm").addEventListener("click", confirmCheckout);
    checkoutDialog.addEventListener("cancel", function () {
      checkoutLines.replaceChildren();
    });

    refresh();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
