/* =========================================================
   Inventory — application UI
   Renders the product table and the add / edit / delete
   flows on top of the data layer (js/data.js).
   The UI re-renders whenever the data layer fires its
   "inventory:changed" event.
   ========================================================= */

(function () {
  'use strict';

  var Inventory = window.Inventory;
  var InventoryCart = window.InventoryCart;
  var InventoryOrders = window.InventoryOrders;
  var InventoryStorage = window.InventoryStorage;

  /** @type {Object<string,Element>} cached element lookups by id */
  var el = {};

  /** pending destructive action in the confirm modal */
  var pendingConfirm = null;

  /** timer for the toast message */
  var toastTimer = null;

  /** id of the product being edited, or null when adding */
  var editingId = null;

  /** current lookup filters: free-text query and category selection */
  var searchQuery = '';
  var categoryFilter = '';

  // ---------------------------------------------------------------
  // Small helpers
  // ---------------------------------------------------------------

  function fmtMoney(value) {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function fmtInt(value) {
    return value.toLocaleString('en-US');
  }

  function statusOf(product) {
    if (product.quantity === 0) {
      return { label: 'Out of stock', cls: 'status--out' };
    }
    if (Inventory.isLowStock(product)) {
      return { label: 'Low stock', cls: 'status--low' };
    }
    return { label: 'In stock', cls: 'status--ok' };
  }

  function cacheElements() {
    [
      'inventory-summary', 'add-product-btn', 'table-wrap', 'product-tbody', 'empty-state',
      'product-modal', 'product-modal-title', 'product-form', 'form-errors', 'save-btn',
      'f-id', 'f-name', 'f-sku', 'f-category', 'f-quantity', 'f-unitPrice',
      'f-reorderLevel', 'f-location', 'category-list',
      'confirm-modal', 'confirm-title', 'confirm-text', 'confirm-delete-btn',
      'search-box', 'search-input', 'clear-search-btn', 'category-filter',
      'no-results', 'clear-filters-btn',
      'cart-section', 'cart-count-badge', 'clear-cart-btn', 'cart-table-wrap',
      'cart-tbody', 'cart-empty', 'cart-total-units', 'cart-total-price',
      'cart-indicator', 'cart-indicator-count', 'checkout-btn',
      'orders-count', 'clear-orders-btn', 'orders-list', 'orders-empty'
    ].forEach(function (id) {
      el[id] = document.getElementById(id);
    });
  }

  // ---------------------------------------------------------------
  // Lookup: free-text search + category filter
  // ---------------------------------------------------------------

  function normalizedQuery() {
    return searchQuery.trim();
  }

  function isFiltering() {
    return normalizedQuery() !== '' || categoryFilter !== '';
  }

  /**
   * Products that pass the current search text and category filter,
   * sorted by name.
   * @returns {Array<Object>}
   */
  function getVisibleProducts() {
    var query = normalizedQuery().toLowerCase();
    return Inventory.getAll().filter(function (product) {
      if (categoryFilter && product.category !== categoryFilter) {
        return false;
      }
      if (!query) {
        return true;
      }
      return [product.name, product.sku, product.category, product.location]
        .some(function (field) {
          return String(field || '').toLowerCase().indexOf(query) !== -1;
        });
    }).sort(function (a, b) {
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });
  }

  /**
   * Append text to `parent`, wrapping case-insensitive occurrences of
   * `query` in <mark> elements. Built purely from text nodes, so product
   * data is never interpreted as HTML.
   * @param {Element} parent
   * @param {string} text
   * @param {string} query the (trimmed, any-case) search text
   */
  function appendHighlighted(parent, text, query) {
    var value = text === null || text === undefined ? '' : String(text);
    var needle = query.toLowerCase();
    if (!needle) {
      parent.textContent = value;
      return;
    }
    var lower = value.toLowerCase();
    var from = 0;
    while (true) {
      var idx = lower.indexOf(needle, from);
      if (idx === -1) {
        parent.appendChild(document.createTextNode(value.slice(from)));
        return;
      }
      if (idx > from) {
        parent.appendChild(document.createTextNode(value.slice(from, idx)));
      }
      var mark = document.createElement('mark');
      mark.textContent = value.slice(idx, idx + needle.length);
      parent.appendChild(mark);
      from = idx + needle.length;
    }
  }

  /** Rebuild the category dropdown, keeping a still-valid selection. */
  function refreshCategoryOptions() {
    if (!el['category-filter']) {
      return;
    }
    var select = el['category-filter'];
    var categories = Inventory.getCategories();
    select.textContent = '';
    var allOption = document.createElement('option');
    allOption.value = '';
    allOption.textContent = 'All categories';
    select.appendChild(allOption);
    categories.forEach(function (name) {
      var option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      select.appendChild(option);
    });
    if (categoryFilter && categories.indexOf(categoryFilter) !== -1) {
      select.value = categoryFilter;
    } else {
      categoryFilter = '';
      select.value = '';
    }
  }

  /** Toggle the ✕ clear button / "/" hint according to the input value. */
  function updateSearchChrome() {
    if (!el['search-box'] || !el['clear-search-btn']) {
      return;
    }
    var hasValue = el['search-input'].value.length > 0;
    el['search-box'].classList.toggle('has-value', hasValue);
    el['clear-search-btn'].hidden = !hasValue;
  }

  function onSearchInput() {
    searchQuery = el['search-input'].value;
    updateSearchChrome();
    renderAll();
  }

  function onCategoryChange() {
    categoryFilter = el['category-filter'].value;
    renderAll();
  }

  function clearSearch() {
    el['search-input'].value = '';
    searchQuery = '';
    updateSearchChrome();
    renderAll();
    el['search-input'].focus();
  }

  function clearFilters() {
    if (el['search-input']) {
      el['search-input'].value = '';
    }
    searchQuery = '';
    categoryFilter = '';
    if (el['category-filter']) {
      el['category-filter'].value = '';
    }
    updateSearchChrome();
    renderAll();
  }

  // ---------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------

  function renderSummary(visibleCount) {
    if (!el['inventory-summary']) {
      return;
    }
    var stats = Inventory.getStats();
    if (stats.products === 0) {
      el['inventory-summary'].textContent = 'No products in inventory yet.';
      return;
    }
    var text = stats.products + ' product' + (stats.products === 1 ? '' : 's') +
      ' \u00b7 ' + fmtInt(stats.units) + ' unit' + (stats.units === 1 ? '' : 's') +
      ' in stock \u00b7 stock value ' + fmtMoney(stats.stockValue);
    var alerts = [];
    if (stats.lowStock > 0) {
      alerts.push(stats.lowStock + ' low');
    }
    if (stats.outOfStock > 0) {
      alerts.push(stats.outOfStock + ' out of stock');
    }
    if (alerts.length > 0) {
      text += ' \u00b7 ' + alerts.join(', ');
    }
    if (isFiltering()) {
      text += ' \u00b7 showing ' + fmtInt(visibleCount) + ' of ' + fmtInt(stats.products);
    }
    el['inventory-summary'].textContent = text + '.';
  }

  function makeTd(className, text) {
    var td = document.createElement('td');
    if (className) {
      td.className = className;
    }
    td.textContent = text;
    return td;
  }

  function makeActionButton(label, action, id, title, extraClass) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn--small' + (extraClass ? ' ' + extraClass : '');
    btn.textContent = label;
    btn.setAttribute('data-action', action);
    btn.setAttribute('data-id', id);
    btn.setAttribute('title', title);
    btn.setAttribute('aria-label', title);
    return btn;
  }

  function buildRow(product, query) {
    var tr = document.createElement('tr');
    tr.setAttribute('data-id', product.id);

    // Name (+ location)
    var nameTd = document.createElement('td');
    var nameDiv = document.createElement('div');
    nameDiv.className = 'product-name';
    appendHighlighted(nameDiv, product.name, query);
    nameTd.appendChild(nameDiv);
    if (product.location) {
      var locDiv = document.createElement('div');
      locDiv.className = 'product-location';
      appendHighlighted(locDiv, product.location, query);
      nameTd.appendChild(locDiv);
    }
    tr.appendChild(nameTd);

    var skuTd = document.createElement('td');
    skuTd.className = 'cell-sku';
    appendHighlighted(skuTd, product.sku || '\u2014', query);
    tr.appendChild(skuTd);

    var categoryTd = document.createElement('td');
    appendHighlighted(categoryTd, product.category, query);
    tr.appendChild(categoryTd);

    // Stock with quick +/- adjustment
    var stockTd = document.createElement('td');
    stockTd.className = 'num stock-cell';
    var dec = makeActionButton('\u2212', 'dec', product.id,
      'Remove one unit of ' + product.name, 'qty-btn');
    if (product.quantity === 0) {
      dec.disabled = true;
    }
    var qty = document.createElement('span');
    qty.className = 'qty';
    qty.textContent = fmtInt(product.quantity);
    var inc = makeActionButton('+', 'inc', product.id,
      'Add one unit of ' + product.name, 'qty-btn');
    stockTd.appendChild(dec);
    stockTd.appendChild(qty);
    stockTd.appendChild(inc);
    tr.appendChild(stockTd);

    tr.appendChild(makeTd('num', fmtMoney(product.unitPrice)));

    var status = statusOf(product);
    var statusTd = document.createElement('td');
    var badge = document.createElement('span');
    badge.className = 'badge ' + status.cls;
    badge.textContent = status.label;
    statusTd.appendChild(badge);
    tr.appendChild(statusTd);

    var actionsTd = document.createElement('td');
    actionsTd.className = 'row-actions';
    var cartBtn = makeActionButton('Add to cart', 'cart-add', product.id,
      'Add ' + product.name + ' to cart');
    if (product.quantity === 0) {
      cartBtn.disabled = true;
      cartBtn.title = product.name + ' is out of stock';
      cartBtn.setAttribute('aria-label', cartBtn.title);
    } else if (InventoryCart.quantityOf(product.id) >= product.quantity) {
      cartBtn.disabled = true;
      cartBtn.title = 'All available stock of ' + product.name + ' is already in the cart';
      cartBtn.setAttribute('aria-label', cartBtn.title);
    }
    actionsTd.appendChild(cartBtn);
    actionsTd.appendChild(makeActionButton('Edit', 'edit', product.id,
      'Edit ' + product.name));
    actionsTd.appendChild(makeActionButton('Delete', 'delete', product.id,
      'Delete ' + product.name, 'btn--danger-ghost'));
    tr.appendChild(actionsTd);

    return tr;
  }

  function renderTable(visible) {
    if (!el['product-tbody']) {
      return;
    }
    var query = normalizedQuery();
    var tbody = el['product-tbody'];
    tbody.textContent = ''; // drop previous rows (and their listeners)
    visible.forEach(function (product) {
      tbody.appendChild(buildRow(product, query));
    });

    var inventoryEmpty = Inventory.getStats().products === 0;
    if (el['table-wrap']) {
      el['table-wrap'].hidden = visible.length === 0;
    }
    if (el['empty-state']) {
      el['empty-state'].hidden = !inventoryEmpty;
    }
    if (el['no-results']) {
      // "No matches" only makes sense when there is something to filter.
      el['no-results'].hidden = inventoryEmpty || visible.length !== 0;
    }
  }

  function renderAll() {
    var visible = getVisibleProducts();
    renderTable(visible);
    renderSummary(visible.length);
  }

  // ---------------------------------------------------------------
  // Add / edit modal
  // ---------------------------------------------------------------

  function setField(id, value) {
    if (el[id]) {
      el[id].value = value;
    }
  }

  function clearErrors() {
    if (el['form-errors']) {
      el['form-errors'].hidden = true;
      el['form-errors'].textContent = '';
    }
  }

  function showErrors(errors) {
    if (!el['form-errors']) {
      return;
    }
    var box = el['form-errors'];
    box.textContent = '';
    var title = document.createElement('strong');
    title.textContent = 'Please fix the following:';
    box.appendChild(title);
    var list = document.createElement('ul');
    errors.forEach(function (message) {
      var li = document.createElement('li');
      li.textContent = message;
      list.appendChild(li);
    });
    box.appendChild(list);
    box.hidden = false;
  }

  function fillCategoryList() {
    if (!el['category-list']) {
      return;
    }
    var list = el['category-list'];
    list.textContent = '';
    Inventory.getCategories().forEach(function (name) {
      var option = document.createElement('option');
      option.value = name;
      list.appendChild(option);
    });
  }

  /**
   * Open the add/edit modal. Pass a product to edit it, or null to add.
   * @param {Object|null} product
   */
  function openProductModal(product) {
    editingId = product ? product.id : null;
    el['product-modal-title'].textContent = product ? 'Edit product' : 'Add product';
    el['save-btn'].textContent = product ? 'Save changes' : 'Add product';
    setField('f-id', product ? product.id : '');
    setField('f-name', product ? product.name : '');
    setField('f-sku', product ? product.sku : '');
    setField('f-category', product ? product.category : '');
    setField('f-quantity', product ? String(product.quantity) : '0');
    setField('f-unitPrice', product ? String(product.unitPrice) : '');
    setField('f-reorderLevel', product ? String(product.reorderLevel) : '0');
    setField('f-location', product ? product.location : '');
    clearErrors();
    fillCategoryList();
    el['product-modal'].hidden = false;
    if (el['f-name']) {
      el['f-name'].focus();
    }
  }

  function closeProductModal() {
    el['product-modal'].hidden = true;
    if (el['product-form']) {
      el['product-form'].reset();
    }
    editingId = null;
    clearErrors();
  }

  function readFormInput() {
    return {
      name: el['f-name'].value,
      sku: el['f-sku'].value,
      category: el['f-category'].value,
      quantity: el['f-quantity'].value,
      unitPrice: el['f-unitPrice'].value,
      reorderLevel: el['f-reorderLevel'].value,
      location: el['f-location'].value
    };
  }

  function onFormSubmit(evt) {
    evt.preventDefault();
    var input = readFormInput();
    var result = editingId
      ? Inventory.updateProduct(editingId, input)
      : Inventory.addProduct(input);
    if (result.ok) {
      closeProductModal(); // re-render happens via CHANGE_EVENT
    } else {
      showErrors(result.errors);
    }
  }

  // ---------------------------------------------------------------
  // Delete confirmation modal
  // ---------------------------------------------------------------

  /**
   * Show the confirmation modal for a destructive action.
   * @param {{type: string, id: string=}} spec
   */
  function askConfirm(spec) {
    if (spec.type === 'delete-product') {
      var product = Inventory.getById(spec.id);
      if (!product) {
        return;
      }
      el['confirm-title'].textContent = 'Delete product';
      el['confirm-text'].textContent = 'Delete \u201c' + product.name +
        '\u201d (SKU ' + (product.sku || 'n/a') + ')? This cannot be undone.';
      el['confirm-delete-btn'].textContent = 'Delete';
    } else if (spec.type === 'clear-cart') {
      el['confirm-title'].textContent = 'Clear cart';
      el['confirm-text'].textContent = 'Remove all ' + fmtInt(InventoryCart.getCount()) +
        ' item(s) from the cart?';
      el['confirm-delete-btn'].textContent = 'Clear cart';
    } else if (spec.type === 'clear-orders') {
      el['confirm-title'].textContent = 'Clear order history';
      el['confirm-text'].textContent = 'Delete all ' + fmtInt(InventoryOrders.getCount()) +
        ' order(s)? This cannot be undone.';
      el['confirm-delete-btn'].textContent = 'Clear history';
    } else {
      return;
    }
    pendingConfirm = spec;
    el['confirm-modal'].hidden = false;
    if (el['confirm-delete-btn']) {
      el['confirm-delete-btn'].focus();
    }
  }

  function askDelete(id) {
    askConfirm({ type: 'delete-product', id: id });
  }

  function askClearCart() {
    if (InventoryCart.getCount() === 0) {
      return;
    }
    askConfirm({ type: 'clear-cart' });
  }

  function closeConfirmModal() {
    el['confirm-modal'].hidden = true;
    pendingConfirm = null;
  }

  function askClearOrders() {
    if (InventoryOrders.getCount() === 0) {
      return;
    }
    askConfirm({ type: 'clear-orders' });
  }

  function onConfirmAction() {
    if (pendingConfirm) {
      if (pendingConfirm.type === 'delete-product') {
        Inventory.deleteProduct(pendingConfirm.id);
      } else if (pendingConfirm.type === 'clear-cart') {
        InventoryCart.clear();
      } else if (pendingConfirm.type === 'clear-orders') {
        InventoryOrders.clearHistory();
      }
    }
    closeConfirmModal();
  }

  // ---------------------------------------------------------------
  // Shopping cart UI
  // ---------------------------------------------------------------

  /**
   * Transient message (e.g. when the cart refuses an addition).
   * @param {string} message
   */
  function showToast(message) {
    var existing = document.querySelectorAll('.toast');
    for (var i = 0; i < existing.length; i += 1) {
      existing[i].parentNode.removeChild(existing[i]);
    }
    var toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.textContent = message;
    document.body.appendChild(toast);
    if (toastTimer) {
      clearTimeout(toastTimer);
    }
    toastTimer = setTimeout(function () {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }

  function buildCartRow(line) {
    var tr = document.createElement('tr');
    tr.setAttribute('data-id', line.product.id);

    var nameTd = document.createElement('td');
    var nameDiv = document.createElement('div');
    nameDiv.className = 'product-name';
    nameDiv.textContent = line.product.name;
    nameTd.appendChild(nameDiv);
    var skuDiv = document.createElement('div');
    skuDiv.className = 'product-location';
    skuDiv.textContent = line.product.sku || '\u2014';
    nameTd.appendChild(skuDiv);
    tr.appendChild(nameTd);

    tr.appendChild(makeTd('num', fmtMoney(line.product.unitPrice)));

    var qtyTd = document.createElement('td');
    qtyTd.className = 'num stock-cell';
    var dec = makeActionButton('\u2212', 'cart-dec', line.product.id,
      'Decrease quantity of ' + line.product.name, 'qty-btn');
    if (line.quantity <= 1) {
      dec.disabled = true;
    }
    var qty = document.createElement('span');
    qty.className = 'qty';
    qty.textContent = fmtInt(line.quantity);
    var inc = makeActionButton('+', 'cart-inc', line.product.id,
      'Increase quantity of ' + line.product.name, 'qty-btn');
    if (line.quantity >= line.product.quantity) {
      inc.disabled = true;
    }
    qtyTd.appendChild(dec);
    qtyTd.appendChild(qty);
    qtyTd.appendChild(inc);
    tr.appendChild(qtyTd);

    tr.appendChild(makeTd('num cart-line-total', fmtMoney(line.lineTotal)));

    var actionsTd = document.createElement('td');
    actionsTd.className = 'row-actions';
    actionsTd.appendChild(makeActionButton('Remove', 'cart-remove', line.product.id,
      'Remove ' + line.product.name + ' from cart', 'btn--danger-ghost'));
    tr.appendChild(actionsTd);

    return tr;
  }

  function renderCart() {
    var lines = InventoryCart.getLines();
    var count = InventoryCart.getCount();
    var total = InventoryCart.getTotal();

    if (el['cart-tbody']) {
      var tbody = el['cart-tbody'];
      tbody.textContent = '';
      lines.forEach(function (line) {
        tbody.appendChild(buildCartRow(line));
      });
    }
    if (el['cart-table-wrap']) {
      el['cart-table-wrap'].hidden = lines.length === 0;
    }
    if (el['cart-empty']) {
      el['cart-empty'].hidden = lines.length !== 0;
    }
    if (el['clear-cart-btn']) {
      el['clear-cart-btn'].hidden = lines.length === 0;
    }
    if (el['cart-count-badge']) {
      el['cart-count-badge'].hidden = count === 0;
      el['cart-count-badge'].textContent = fmtInt(count);
    }
    if (el['cart-total-units']) {
      el['cart-total-units'].textContent = fmtInt(count);
    }
    if (el['cart-total-price']) {
      el['cart-total-price'].textContent = fmtMoney(total);
    }
    if (el['cart-indicator-count']) {
      el['cart-indicator-count'].hidden = count === 0;
      el['cart-indicator-count'].textContent = fmtInt(count);
    }
    if (el['checkout-btn']) {
      el['checkout-btn'].disabled = lines.length === 0;
    }
  }

  function onCartClick(evt) {
    var target = evt.target;
    var btn = target && target.closest ? target.closest('button[data-action]') : null;
    if (!btn) {
      return;
    }
    var id = btn.getAttribute('data-id');
    var action = btn.getAttribute('data-action');
    var result = null;
    if (action === 'cart-inc') {
      result = InventoryCart.add(id, 1);
    } else if (action === 'cart-dec') {
      result = InventoryCart.setQuantity(id, InventoryCart.quantityOf(id) - 1);
    } else if (action === 'cart-remove') {
      result = InventoryCart.remove(id);
    }
    if (result && !result.ok) {
      showToast(result.errors.join(' '));
    }
  }

  // ---------------------------------------------------------------
  // Checkout & order history UI
  // ---------------------------------------------------------------

  function fmtDateTime(iso) {
    var date = new Date(iso);
    if (isNaN(date.getTime())) {
      return String(iso);
    }
    try {
      return date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    } catch (err) {
      return date.toLocaleString('en-US');
    }
  }

  /**
   * One order as an expandable <details> block: the summary shows
   * number, date, size and total; the body lists the purchased items.
   * @param {Object} order
   * @returns {Element}
   */
  function buildOrderElement(order) {
    var details = document.createElement('details');
    details.className = 'order';

    var summary = document.createElement('summary');
    var number = document.createElement('span');
    number.className = 'order-number';
    number.textContent = '#' + order.number;
    var date = document.createElement('span');
    date.className = 'order-date';
    date.textContent = fmtDateTime(order.date);
    var meta = document.createElement('span');
    meta.className = 'order-meta';
    meta.textContent = order.items.length + ' product' + (order.items.length === 1 ? '' : 's') +
      ' \u00b7 ' + fmtInt(order.totalUnits) + ' unit' + (order.totalUnits === 1 ? '' : 's');
    var total = document.createElement('span');
    total.className = 'order-total';
    total.textContent = fmtMoney(order.total);
    summary.appendChild(number);
    summary.appendChild(date);
    summary.appendChild(meta);
    summary.appendChild(total);
    details.appendChild(summary);

    var list = document.createElement('ul');
    list.className = 'order-items';
    order.items.forEach(function (item) {
      var li = document.createElement('li');
      var nameSpan = document.createElement('span');
      nameSpan.textContent = item.name +
        (item.sku ? ' (' + item.sku + ')' : '') +
        ' \u00d7 ' + fmtInt(item.quantity);
      var priceSpan = document.createElement('span');
      priceSpan.className = 'order-item-total';
      priceSpan.textContent = fmtMoney(item.lineTotal);
      li.appendChild(nameSpan);
      li.appendChild(priceSpan);
      list.appendChild(li);
    });
    details.appendChild(list);
    return details;
  }

  function renderOrders() {
    var all = InventoryOrders.getAll(); // newest first
    if (el['orders-list']) {
      var list = el['orders-list'];
      list.textContent = '';
      all.forEach(function (order) {
        list.appendChild(buildOrderElement(order));
      });
    }
    if (el['orders-empty']) {
      el['orders-empty'].hidden = all.length !== 0;
    }
    if (el['clear-orders-btn']) {
      el['clear-orders-btn'].hidden = all.length === 0;
    }
    if (el['orders-count']) {
      el['orders-count'].textContent = all.length === 0 ? '' :
        fmtInt(all.length) + ' order' + (all.length === 1 ? '' : 's');
    }
  }

  function onCheckout() {
    if (InventoryCart.getCount() === 0) {
      showToast('The cart is empty.');
      return;
    }
    var result = InventoryOrders.checkout();
    if (result.ok) {
      var order = result.order;
      showToast('Order #' + order.number + ' placed \u00b7 ' +
        fmtInt(order.totalUnits) + ' unit' + (order.totalUnits === 1 ? '' : 's') +
        ' \u00b7 ' + fmtMoney(order.total));
      // Re-renders happen via the inventory/cart/orders change events.
    } else {
      showToast(result.errors.join(' '));
    }
  }

  // ---------------------------------------------------------------
  // Event wiring
  // ---------------------------------------------------------------

  function onTableClick(evt) {
    var target = evt.target;
    var btn = target && target.closest ? target.closest('button[data-action]') : null;
    if (!btn) {
      return;
    }
    var id = btn.getAttribute('data-id');
    var action = btn.getAttribute('data-action');
    if (action === 'edit') {
      openProductModal(Inventory.getById(id));
    } else if (action === 'delete') {
      askDelete(id);
    } else if (action === 'inc') {
      Inventory.adjustStock(id, 1);
    } else if (action === 'dec') {
      Inventory.adjustStock(id, -1);
    } else if (action === 'cart-add') {
      var added = InventoryCart.add(id, 1);
      if (!added.ok) {
        showToast(added.errors.join(' '));
      }
    }
  }

  function wireEvents() {
    if (el['add-product-btn']) {
      el['add-product-btn'].addEventListener('click', function () {
        openProductModal(null);
      });
    }

    if (el['product-form']) {
      el['product-form'].addEventListener('submit', onFormSubmit);
    }

    // Close add/edit modal: backdrop click, Cancel button, Escape.
    if (el['product-modal']) {
      el['product-modal'].addEventListener('click', function (evt) {
        if (evt.target === el['product-modal'] ||
            (evt.target.closest && evt.target.closest('[data-close]'))) {
          closeProductModal();
        }
      });
    }

    if (el['confirm-modal']) {
      el['confirm-modal'].addEventListener('click', function (evt) {
        if (evt.target === el['confirm-modal'] ||
            (evt.target.closest && evt.target.closest('[data-close]'))) {
          closeConfirmModal();
        }
      });
    }

    if (el['confirm-delete-btn']) {
      el['confirm-delete-btn'].addEventListener('click', onConfirmAction);
    }

    if (el['cart-tbody']) {
      el['cart-tbody'].addEventListener('click', onCartClick);
    }

    if (el['clear-cart-btn']) {
      el['clear-cart-btn'].addEventListener('click', askClearCart);
    }

    if (el['checkout-btn']) {
      el['checkout-btn'].addEventListener('click', onCheckout);
    }

    if (el['clear-orders-btn']) {
      el['clear-orders-btn'].addEventListener('click', askClearOrders);
    }

    if (el['cart-indicator']) {
      el['cart-indicator'].addEventListener('click', function () {
        if (el['cart-section'] && typeof el['cart-section'].scrollIntoView === 'function') {
          el['cart-section'].scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }

    if (el['product-tbody']) {
      el['product-tbody'].addEventListener('click', onTableClick);
    }

    if (el['search-input']) {
      el['search-input'].addEventListener('input', onSearchInput);
      el['search-input'].addEventListener('keydown', function (evt) {
        if ((evt.key === 'Escape' || evt.key === 'Esc') && el['search-input'].value !== '') {
          evt.stopPropagation(); // clear the search, don't close any modal
          clearSearch();
        }
      });
    }

    if (el['clear-search-btn']) {
      el['clear-search-btn'].addEventListener('click', clearSearch);
    }

    if (el['category-filter']) {
      el['category-filter'].addEventListener('change', onCategoryChange);
    }

    if (el['clear-filters-btn']) {
      el['clear-filters-btn'].addEventListener('click', clearFilters);
    }

    document.addEventListener('keydown', function (evt) {
      var modalOpen = (el['product-modal'] && !el['product-modal'].hidden) ||
        (el['confirm-modal'] && !el['confirm-modal'].hidden);

      // "/" focuses the search box for quick lookup.
      if (evt.key === '/' && !modalOpen) {
        var active = document.activeElement;
        var typing = active && (active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' || active.tagName === 'SELECT' ||
          active.isContentEditable);
        if (!typing && el['search-input']) {
          evt.preventDefault();
          el['search-input'].focus();
          el['search-input'].select();
        }
        return;
      }

      if (evt.key !== 'Escape' && evt.key !== 'Esc') {
        return;
      }
      if (el['confirm-modal'] && !el['confirm-modal'].hidden) {
        closeConfirmModal();
      } else if (el['product-modal'] && !el['product-modal'].hidden) {
        closeProductModal();
      }
    });
  }

  // ---------------------------------------------------------------
  // Bootstrap
  // ---------------------------------------------------------------

  /**
   * Warn the user (once) when data cannot be persisted.
   */
  function warnIfNoPersistence() {
    if (InventoryStorage.available()) {
      return;
    }
    var section = document.getElementById('inventory-section');
    if (!section) {
      return;
    }
    var warning = document.createElement('p');
    warning.className = 'notice notice--warning';
    warning.setAttribute('role', 'alert');
    warning.textContent = 'Warning: localStorage is not available in this browser. ' +
      'The inventory below is sample data and changes will not be saved.';
    section.insertBefore(warning, section.firstChild);
  }

  /**
   * Full re-render: inventory table, summary, cart (button states
   * depend on both inventory stock and cart contents) and orders.
   */
  function renderEverything() {
    refreshCategoryOptions();
    renderAll();
    renderCart();
    renderOrders();
  }

  document.addEventListener('DOMContentLoaded', function () {
    Inventory.init();
    InventoryCart.init();
    InventoryOrders.init();
    cacheElements();
    warnIfNoPersistence();
    wireEvents();
    refreshCategoryOptions();
    fillCategoryList();
    updateSearchChrome();
    renderEverything();
    document.addEventListener(Inventory.CHANGE_EVENT, renderEverything);
    document.addEventListener(InventoryCart.CHANGE_EVENT, renderEverything);
    document.addEventListener(InventoryOrders.CHANGE_EVENT, renderEverything);
  });
})();
