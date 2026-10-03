/*
 * Application entry point: wires the UI to the inventory data layer.
 */
(function () {
  'use strict';

  var FIELDS = ['sku', 'name', 'category', 'quantity', 'reorderLevel', 'price'];

  var currency = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD'
  });

  var dateTime = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  // Id of the product being edited in the product dialog; null when adding.
  var editingId = null;
  // Id of the product awaiting delete confirmation.
  var deletingId = null;
  // Ids of orders expanded in the order history, kept across re-renders.
  var openOrders = {};

  function $(id) {
    return document.getElementById(id);
  }

  function cell(row, text, className) {
    var td = document.createElement('td');
    td.textContent = text;
    if (className) {
      td.className = className;
    }
    row.appendChild(td);
    return td;
  }

  /* Appends `text` to `parent`, wrapping occurrences of any term in <mark>. */
  function appendHighlighted(parent, text, terms) {
    var lower = text.toLowerCase();
    if (!terms.length || lower.length !== text.length) {
      parent.appendChild(document.createTextNode(text));
      return;
    }
    // Mark every character covered by a match, then emit runs.
    var marked = [];
    terms.forEach(function (term) {
      var at = lower.indexOf(term);
      while (at !== -1) {
        for (var i = at; i < at + term.length; i++) {
          marked[i] = true;
        }
        at = lower.indexOf(term, at + term.length);
      }
    });
    var start = 0;
    for (var end = 1; end <= text.length; end++) {
      if (end === text.length || !marked[end] !== !marked[start]) {
        var run = text.slice(start, end);
        if (marked[start]) {
          var mark = document.createElement('mark');
          mark.textContent = run;
          parent.appendChild(mark);
        } else {
          parent.appendChild(document.createTextNode(run));
        }
        start = end;
      }
    }
  }

  function highlightedCell(row, text, terms) {
    var td = document.createElement('td');
    appendHighlighted(td, text, terms);
    row.appendChild(td);
    return td;
  }

  function button(label, className, action, id, ariaLabel) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = className;
    b.textContent = label;
    b.dataset.action = action;
    b.dataset.id = id;
    b.setAttribute('aria-label', ariaLabel);
    return b;
  }

  function setStatus(message) {
    $('status').textContent = message;
  }

  // ---- rendering ---------------------------------------------------------

  function renderSummary(summary) {
    var count = $('item-count');
    var text = summary.productCount === 1
      ? '1 product'
      : summary.productCount + ' products';
    if (summary.productCount > 0) {
      text += ' · ' + summary.totalUnits + ' units · ' +
        currency.format(summary.totalValue) + ' total value · ' +
        summary.lowStockCount + ' low on stock';
    }
    count.textContent = text;
  }

  function renderTable(products, terms) {
    var table = document.createElement('table');
    table.className = 'product-table';

    var head = table.createTHead().insertRow();
    ['SKU', 'Name', 'Category', 'In stock', 'Reorder at', 'Unit price', 'Actions'].forEach(function (label, i) {
      var th = document.createElement('th');
      th.scope = 'col';
      th.textContent = label;
      if (i >= 3 && i <= 5) {
        th.className = 'num';
      } else if (i === 6) {
        th.className = 'actions';
      }
      head.appendChild(th);
    });

    var body = table.createTBody();
    products.forEach(function (p) {
      var row = body.insertRow();
      highlightedCell(row, p.sku, terms).className = 'sku';
      highlightedCell(row, p.name, terms);
      highlightedCell(row, p.category, terms);
      var stock = cell(row, String(p.quantity), 'num');
      if (Inventory.isOutOfStock(p)) {
        stock.classList.add('stock-out');
        stock.title = 'Out of stock';
      } else if (Inventory.isLowStock(p)) {
        stock.classList.add('stock-low');
        stock.title = 'Low stock';
      }
      cell(row, String(p.reorderLevel), 'num');
      cell(row, currency.format(p.price), 'num');

      var actions = cell(row, '', 'actions');
      var add = button('Add to cart', 'btn btn-small', 'add-to-cart', p.id, 'Add ' + p.name + ' to cart');
      var inCart = Cart.getQuantity(p.id);
      if (inCart >= p.quantity) {
        add.disabled = true;
        add.title = p.quantity === 0 ? 'Out of stock' : 'All ' + p.quantity + ' in stock are in the cart';
      } else if (inCart > 0) {
        add.title = inCart + ' in cart';
      }
      actions.appendChild(add);
      actions.appendChild(button('Edit', 'btn btn-small', 'edit', p.id, 'Edit ' + p.name));
      actions.appendChild(button('Delete', 'btn btn-small btn-danger-text', 'delete', p.id, 'Delete ' + p.name));
    });
    return table;
  }

  function renderEmpty(list) {
    var empty = document.createElement('p');
    empty.className = 'muted';
    empty.textContent = 'No products yet. Add one, or ';
    var restore = document.createElement('button');
    restore.type = 'button';
    restore.className = 'link-button';
    restore.dataset.action = 'restore-samples';
    restore.textContent = 'restore the sample products';
    empty.appendChild(restore);
    empty.appendChild(document.createTextNode('.'));
    list.appendChild(empty);
  }

  function renderNoMatches(list) {
    var empty = document.createElement('p');
    empty.className = 'muted';
    empty.textContent = 'No products match your search. ';
    var clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'link-button';
    clear.dataset.action = 'clear-lookup';
    clear.textContent = 'Clear the search';
    empty.appendChild(clear);
    empty.appendChild(document.createTextNode('.'));
    list.appendChild(empty);
  }

  // ---- lookup ------------------------------------------------------------

  function getCriteria() {
    return {
      query: $('lookup-query').value,
      category: $('lookup-category').value,
      stock: $('lookup-stock').value
    };
  }

  function isFiltering(criteria) {
    return Inventory.searchTerms(criteria.query).length > 0 ||
      criteria.category !== '' || criteria.stock !== '';
  }

  /* Refreshes the category filter options, keeping the selection if it still exists. */
  function fillLookupCategories() {
    var select = $('lookup-category');
    var selected = select.value;
    var categories = Inventory.getCategories();
    while (select.options.length > 1) {
      select.remove(1);
    }
    categories.forEach(function (category) {
      select.add(new Option(category, category));
    });
    select.value = categories.indexOf(selected) === -1 ? '' : selected;
  }

  function clearLookup() {
    $('lookup-query').value = '';
    $('lookup-category').value = '';
    $('lookup-stock').value = '';
    render();
  }

  /*
   * Enter in the search box opens the product whose SKU matches exactly, or
   * the only matching product (handy with a barcode scanner).
   */
  function onLookupSubmit(event) {
    event.preventDefault();
    var criteria = getCriteria();
    var matches = Inventory.search(criteria);
    // search() lists an exact SKU match first.
    var exactSku = matches.length > 0 &&
      matches[0].sku.toLowerCase() === criteria.query.trim().toLowerCase();
    if (exactSku || matches.length === 1) {
      openProductDialog(matches[0]);
    } else if (matches.length === 0) {
      setStatus('No products match your search.');
    } else {
      setStatus(matches.length + ' products match. Refine the search to open one.');
    }
  }

  function onLookupKeydown(event) {
    if (event.key === 'Escape' && $('lookup-query').value !== '') {
      event.preventDefault();
      $('lookup-query').value = '';
      render();
    }
  }

  /* "/" focuses the search box unless the user is typing somewhere else. */
  function onDocumentKeydown(event) {
    if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }
    var target = event.target;
    if (target.closest && target.closest('input, select, textarea, dialog, [contenteditable="true"]')) {
      return;
    }
    event.preventDefault();
    $('lookup-query').focus();
    $('lookup-query').select();
  }

  // ---- cart --------------------------------------------------------------

  function setCartStatus(message) {
    $('cart-status').textContent = message;
  }

  function unitsText(n) {
    return n === 1 ? '1 item' : n + ' items';
  }

  function quantityControl(line) {
    var wrap = document.createElement('div');
    wrap.className = 'qty-control';
    var dec = button('−', 'btn btn-small', 'cart-dec', line.productId, 'One fewer ' + line.name);
    dec.disabled = line.quantity <= 1;
    var input = document.createElement('input');
    input.type = 'number';
    input.min = '1';
    input.max = String(Math.max(line.inStock, line.quantity));
    input.step = '1';
    input.inputMode = 'numeric';
    input.value = String(line.quantity);
    input.dataset.id = line.productId;
    input.setAttribute('aria-label', 'Quantity of ' + line.name);
    var inc = button('+', 'btn btn-small', 'cart-inc', line.productId, 'One more ' + line.name);
    inc.disabled = line.quantity >= line.inStock;
    wrap.appendChild(dec);
    wrap.appendChild(input);
    wrap.appendChild(inc);
    return wrap;
  }

  function renderCartTable(lines, totals) {
    var table = document.createElement('table');
    table.className = 'product-table cart-table';

    var head = table.createTHead().insertRow();
    ['SKU', 'Name', 'Unit price', 'Quantity', 'Line total', 'Actions'].forEach(function (label, i) {
      var th = document.createElement('th');
      th.scope = 'col';
      th.textContent = label;
      if (i === 2 || i === 4) {
        th.className = 'num';
      } else if (i === 5) {
        th.className = 'actions';
      }
      head.appendChild(th);
    });

    var body = table.createTBody();
    lines.forEach(function (line) {
      var row = body.insertRow();
      cell(row, line.sku, 'sku');
      var name = cell(row, line.name);
      if (line.overStock) {
        var warning = document.createElement('span');
        warning.className = 'stock-out cart-warning';
        warning.textContent = line.inStock === 0
          ? 'Now out of stock'
          : 'Only ' + line.inStock + ' in stock';
        name.appendChild(document.createElement('br'));
        name.appendChild(warning);
      }
      cell(row, currency.format(line.price), 'num');
      cell(row, '', 'qty').appendChild(quantityControl(line));
      cell(row, currency.format(line.lineTotal), 'num');
      cell(row, '', 'actions').appendChild(
        button('Remove', 'btn btn-small btn-danger-text', 'cart-remove', line.productId, 'Remove ' + line.name + ' from cart'));
    });

    var foot = table.createTFoot().insertRow();
    var label = document.createElement('th');
    label.scope = 'row';
    label.colSpan = 4;
    label.className = 'num';
    label.textContent = 'Total';
    foot.appendChild(label);
    cell(foot, currency.format(totals.total), 'num cart-total');
    cell(foot, '');
    return table;
  }

  function renderCart() {
    var list = $('cart-list');
    var lines = Cart.getLines();
    var totals = Cart.getTotals();

    $('cart-count').textContent = String(totals.unitCount);
    $('cart-link').setAttribute('aria-label', 'Cart, ' + unitsText(totals.unitCount));
    $('cart-clear').disabled = lines.length === 0;
    $('checkout').disabled = lines.length === 0 || totals.overStockCount > 0;

    var summary = lines.length === 0
      ? 'Your cart is empty. Use Add to cart on a product to add it.'
      : unitsText(totals.unitCount) + ' · ' + currency.format(totals.total);
    if (totals.overStockCount > 0) {
      summary += ' · ' + totals.overStockCount + ' over available stock' +
        ' (lower the flagged quantities to check out)';
    }
    $('cart-summary').textContent = summary;

    list.textContent = '';
    if (lines.length > 0) {
      list.appendChild(renderCartTable(lines, totals));
    }
  }

  /*
   * Refocuses a cart control after a re-render, falling back to the heading.
   * A null selector leaves focus alone.
   */
  function focusCartControl(selector) {
    if (selector === null) {
      return;
    }
    var el = $('cart-list').querySelector(selector);
    if (el && !el.disabled) {
      el.focus();
    } else {
      $('cart-heading').setAttribute('tabindex', '-1');
      $('cart-heading').focus();
    }
  }

  function cartErrorText(result) {
    var errors = result.errors;
    return errors.quantity || errors.storage || errors.product || 'Could not update the cart.';
  }

  function changeCartQuantity(productId, quantity, focusSelector) {
    var line = Cart.getLines().filter(function (l) {
      return l.productId === productId;
    })[0];
    var result = Cart.setQuantity(productId, quantity);
    render();
    if (result.ok) {
      setCartStatus(result.item.quantity === 0
        ? 'Removed ' + (line ? line.name : 'item') + ' from the cart.'
        : (line ? line.name : 'Item') + ': ' + result.item.quantity + ' in cart.');
    } else {
      setCartStatus(cartErrorText(result));
    }
    focusCartControl(focusSelector);
  }

  function onCartClick(event) {
    var target = event.target.closest('button[data-action]');
    if (!target) {
      return;
    }
    var id = target.dataset.id;
    var action = target.dataset.action;
    var current = Cart.getQuantity(id);
    var selector = 'button[data-action="' + action + '"][data-id="' + CSS.escape(id) + '"]';

    if (action === 'cart-inc') {
      changeCartQuantity(id, current + 1, selector);
    } else if (action === 'cart-dec') {
      // If stock fell below the cart quantity, step straight down to what is available.
      var product = Inventory.getById(id);
      var available = product ? product.quantity : current - 1;
      changeCartQuantity(id, Math.min(current - 1, available), selector);
    } else if (action === 'cart-remove') {
      var line = Cart.getLines().filter(function (l) {
        return l.productId === id;
      })[0];
      var result = Cart.remove(id);
      render();
      setCartStatus(result.ok
        ? 'Removed ' + (line ? line.name : 'item') + ' from the cart.'
        : cartErrorText(result));
      focusCartControl('button[data-action="cart-remove"]');
    }
  }

  function onCartChange(event) {
    var input = event.target;
    if (!input.matches('input[data-id]')) {
      return;
    }
    // Only refocus the field if the change came from Enter/spinner, not from leaving it.
    changeCartQuantity(input.dataset.id, input.value,
      document.activeElement === input ? 'input[data-id="' + CSS.escape(input.dataset.id) + '"]' : null);
  }

  function onCartClear() {
    if (!window.confirm('Remove all items from the cart?')) {
      return;
    }
    var result = Cart.clear();
    render();
    setCartStatus(result.ok ? 'Cart emptied.' : cartErrorText(result));
  }

  function addToCart(product) {
    var result = Cart.add(product.id);
    render();
    if (result.ok) {
      setStatus('Added ' + product.name + ' to the cart (' + result.item.quantity + ' in cart).');
    } else {
      setStatus(cartErrorText(result));
    }
    focusRowButton('add-to-cart', product.id);
  }

  // ---- checkout ----------------------------------------------------------

  /* A read-only table of order or cart lines with a total row. */
  function renderLinesTable(lines, total) {
    var table = document.createElement('table');
    table.className = 'product-table lines-table';

    var head = table.createTHead().insertRow();
    ['SKU', 'Name', 'Unit price', 'Qty', 'Line total'].forEach(function (label, i) {
      var th = document.createElement('th');
      th.scope = 'col';
      th.textContent = label;
      if (i >= 2) {
        th.className = 'num';
      }
      head.appendChild(th);
    });

    var body = table.createTBody();
    lines.forEach(function (line) {
      var row = body.insertRow();
      cell(row, line.sku, 'sku');
      cell(row, line.name);
      cell(row, currency.format(line.price), 'num');
      cell(row, String(line.quantity), 'num');
      cell(row, currency.format(line.lineTotal), 'num');
    });

    var foot = table.createTFoot().insertRow();
    var label = document.createElement('th');
    label.scope = 'row';
    label.colSpan = 4;
    label.className = 'num';
    label.textContent = 'Total';
    foot.appendChild(label);
    cell(foot, currency.format(total), 'num');
    return table;
  }

  function fillCheckoutLines() {
    var list = $('checkout-lines');
    list.textContent = '';
    list.appendChild(renderLinesTable(Cart.getLines(), Cart.getTotals().total));
  }

  function openCheckoutDialog() {
    var totals = Cart.getTotals();
    if (totals.lineCount === 0 || totals.overStockCount > 0) {
      return;
    }
    fillCheckoutLines();
    $('checkout-note').value = '';
    showError($('checkout-error'), '');
    showError($('error-note'), '');
    $('checkout-note').removeAttribute('aria-invalid');
    $('checkout-dialog').showModal();
    $('checkout-submit').focus();
  }

  function onCheckoutSubmit(event) {
    event.preventDefault();
    showError($('checkout-error'), '');
    showError($('error-note'), '');
    $('checkout-note').removeAttribute('aria-invalid');

    var result = Orders.checkout({ note: $('checkout-note').value });
    if (!result.ok) {
      var errors = result.errors;
      if (errors.note) {
        showError($('error-note'), errors.note);
        $('checkout-note').setAttribute('aria-invalid', 'true');
        $('checkout-note').focus();
        return;
      }
      // Stock may have changed since the dialog opened; show the current cart.
      render();
      fillCheckoutLines();
      showError($('checkout-error'), errors.quantity || errors.product || errors.cart ||
        errors.storage || 'Could not place the order.');
      return;
    }

    var order = result.order;
    $('checkout-dialog').close();
    render();
    renderOrders();
    setCartStatus('Order #' + order.number + ' placed: ' + unitsText(order.unitCount) +
      ', ' + currency.format(order.total) + '. Stock updated.');
    $('cart-heading').setAttribute('tabindex', '-1');
    $('cart-heading').focus();
  }

  /*
   * Keeps an open checkout dialog in step with a cart changed in another tab,
   * so the order placed is the one shown.
   */
  function refreshCheckoutDialog() {
    if (!$('checkout-dialog').open) {
      return;
    }
    var totals = Cart.getTotals();
    if (totals.lineCount === 0) {
      $('checkout-dialog').close();
      setCartStatus('The cart was emptied in another tab.');
      return;
    }
    fillCheckoutLines();
    showError($('checkout-error'), totals.overStockCount > 0
      ? 'Stock changed in another tab. Lower the flagged quantities in the cart before checking out.'
      : 'The cart or stock changed in another tab. Check the order before placing it.');
  }

  // ---- order history -----------------------------------------------------

  function renderOrder(order) {
    var details = document.createElement('details');
    details.className = 'order';
    details.dataset.id = order.id;
    details.open = !!openOrders[order.id];

    var summary = document.createElement('summary');
    var title = document.createElement('strong');
    title.textContent = 'Order #' + order.number;
    summary.appendChild(title);
    var parts = [];
    if (order.createdAt) {
      var date = new Date(order.createdAt);
      if (!isNaN(date.getTime())) {
        parts.push(dateTime.format(date));
      }
    }
    parts.push(unitsText(order.unitCount), currency.format(order.total));
    summary.appendChild(document.createTextNode(' · ' + parts.join(' · ')));
    if (order.note) {
      var note = document.createElement('span');
      note.className = 'muted order-note';
      note.textContent = ' — ' + order.note;
      summary.appendChild(note);
    }
    details.appendChild(summary);
    details.appendChild(renderLinesTable(order.lines, order.total));
    return details;
  }

  function renderOrders() {
    var summary = Orders.getSummary();
    $('orders-summary').textContent = summary.orderCount === 0
      ? 'No orders yet. Orders placed with Checkout are listed here.'
      : (summary.orderCount === 1 ? '1 order' : summary.orderCount + ' orders') + ' · ' +
        unitsText(summary.unitCount) + ' · ' + currency.format(summary.total) + ' total';

    var list = $('orders-list');
    list.textContent = '';
    Orders.getAll().forEach(function (order) {
      list.appendChild(renderOrder(order));
    });
  }

  function render() {
    var removed = Cart.prune();
    if (removed > 0) {
      setCartStatus('Removed ' + (removed === 1 ? '1 product' : removed + ' products') +
        ' no longer in the inventory from the cart.');
    }
    renderCart();

    var list = $('item-list');
    var total = Inventory.getSummary();

    renderSummary(total);
    fillLookupCategories();

    var criteria = getCriteria();
    var filtering = isFiltering(criteria);
    var products = Inventory.search(criteria);

    $('result-count').textContent = filtering && total.productCount > 0
      ? 'Showing ' + products.length + ' of ' + total.productCount + ' products.'
      : '';

    list.textContent = '';
    if (total.productCount === 0) {
      renderEmpty(list);
      return;
    }
    if (products.length === 0) {
      renderNoMatches(list);
      return;
    }
    list.appendChild(renderTable(products, Inventory.searchTerms(criteria.query)));
  }

  /* Moves focus to a product's row button after a re-render, if it exists. */
  function focusRowButton(action, id) {
    var buttons = $('item-list').querySelectorAll('button[data-action="' + action + '"]');
    for (var i = 0; i < buttons.length; i++) {
      if (buttons[i].dataset.id === id) {
        if (buttons[i].disabled) {
          // e.g. Add to cart once all stock is in the cart.
          focusRowButton('edit', id);
        } else {
          buttons[i].focus();
        }
        return;
      }
    }
    $('add-product').focus();
  }

  // ---- product form (add / edit) -----------------------------------------

  function showError(el, message) {
    el.textContent = message || '';
    el.hidden = !message;
  }

  function clearFormErrors() {
    FIELDS.forEach(function (field) {
      showError($('error-' + field), '');
      $('field-' + field).removeAttribute('aria-invalid');
    });
    showError($('form-error'), '');
  }

  /* Shows validation errors; errors not tied to a field go at the top. */
  function showFormErrors(errors) {
    var firstInvalid = null;
    var general = [];
    Object.keys(errors).forEach(function (key) {
      if (FIELDS.indexOf(key) !== -1) {
        showError($('error-' + key), errors[key]);
        $('field-' + key).setAttribute('aria-invalid', 'true');
      } else {
        general.push(errors[key]);
      }
    });
    showError($('form-error'), general.join(' '));
    FIELDS.some(function (field) {
      if (errors[field]) {
        firstInvalid = $('field-' + field);
        return true;
      }
      return false;
    });
    if (firstInvalid) {
      firstInvalid.focus();
    }
  }

  function fillCategoryOptions() {
    var options = $('category-options');
    options.textContent = '';
    Inventory.getCategories().forEach(function (category) {
      var option = document.createElement('option');
      option.value = category;
      options.appendChild(option);
    });
  }

  function openProductDialog(product) {
    editingId = product ? product.id : null;
    var title = product ? 'Edit product' : 'Add product';
    $('product-dialog-title').textContent = title;
    $('product-save').textContent = product ? 'Save changes' : 'Add product';

    var values = product || { sku: '', name: '', category: '', quantity: 0, reorderLevel: 0, price: '' };
    FIELDS.forEach(function (field) {
      $('field-' + field).value = values[field];
    });
    clearFormErrors();
    fillCategoryOptions();
    $('product-dialog').showModal();
    $(product ? 'field-name' : 'field-sku').focus();
  }

  function readForm() {
    var data = {};
    FIELDS.forEach(function (field) {
      data[field] = $('field-' + field).value;
    });
    return data;
  }

  function onProductSubmit(event) {
    event.preventDefault();
    clearFormErrors();

    var data = readForm();
    var result = editingId === null
      ? Inventory.add(data)
      : Inventory.update(editingId, data);

    if (!result.ok) {
      if (result.errors.id) {
        closeRemovedProductDialogs();
        return;
      }
      showFormErrors(result.errors);
      return;
    }

    var wasEditing = editingId !== null;
    editingId = null;
    $('product-dialog').close();
    render();
    var hidden = !Inventory.search(getCriteria()).some(function (p) {
      return p.id === result.product.id;
    });
    setStatus((wasEditing ? 'Saved changes to ' : 'Added ') + result.product.name + '.' +
      (hidden ? ' It does not match the current search.' : ''));
    focusRowButton('edit', result.product.id);
  }

  // ---- delete ------------------------------------------------------------

  function openDeleteDialog(product) {
    deletingId = product.id;
    $('delete-message').textContent = 'Delete ' + product.name + ' (' + product.sku +
      ')? This cannot be undone.';
    showError($('delete-error'), '');
    $('delete-dialog').showModal();
    $('delete-cancel').focus();
  }

  function onDeleteSubmit(event) {
    event.preventDefault();
    var result = Inventory.remove(deletingId);
    if (!result.ok) {
      if (result.errors.id) {
        closeRemovedProductDialogs();
        return;
      }
      showError($('delete-error'), result.errors.storage);
      return;
    }
    deletingId = null;
    $('delete-dialog').close();
    render();
    setStatus('Deleted ' + result.product.name + '.');
    $('add-product').focus();
  }

  /*
   * Closes the edit or delete dialog if its product no longer exists (deleted
   * in another tab), and says so.
   */
  function closeRemovedProductDialogs() {
    var closed = false;
    if ($('product-dialog').open && editingId !== null && !Inventory.getById(editingId)) {
      editingId = null;
      $('product-dialog').close();
      closed = true;
    }
    if ($('delete-dialog').open && deletingId !== null && !Inventory.getById(deletingId)) {
      deletingId = null;
      $('delete-dialog').close();
      closed = true;
    }
    if (closed) {
      render();
      setStatus('That product was deleted in another tab.');
      $('add-product').focus();
    }
  }

  // ---- events ------------------------------------------------------------

  function onListClick(event) {
    var target = event.target.closest('button[data-action]');
    if (!target) {
      return;
    }
    var action = target.dataset.action;

    if (action === 'restore-samples') {
      var reset = Inventory.resetToSampleData();
      render();
      setStatus(reset.ok ? 'Sample products restored.' : reset.errors.storage);
      return;
    }
    if (action === 'clear-lookup') {
      clearLookup();
      $('lookup-query').focus();
      return;
    }

    var product = Inventory.getById(target.dataset.id);
    if (!product) {
      // Removed in another tab since the list was drawn.
      render();
      setStatus('That product no longer exists.');
      return;
    }
    if (action === 'add-to-cart') {
      addToCart(product);
    } else if (action === 'edit') {
      openProductDialog(product);
    } else if (action === 'delete') {
      openDeleteDialog(product);
    }
  }

  /* Keeps this tab in sync when another tab changes the inventory, cart or orders. */
  function onStorage(event) {
    var all = event.key === null;
    if (all || event.key === InventoryStore.KEY) {
      Inventory.init();
    }
    if (all || event.key === InventoryStore.CART_KEY) {
      Cart.init();
    }
    if (all || event.key === InventoryStore.KEY || event.key === InventoryStore.CART_KEY) {
      render();
      refreshCheckoutDialog();
      closeRemovedProductDialogs();
    }
    if (all || event.key === InventoryStore.ORDERS_KEY) {
      Orders.init();
      renderOrders();
    }
  }

  function init() {
    Inventory.init();
    Cart.init();
    Orders.init();
    render();
    renderOrders();

    $('cart-list').addEventListener('click', onCartClick);
    $('cart-list').addEventListener('change', onCartChange);
    $('cart-clear').addEventListener('click', onCartClear);

    $('checkout').addEventListener('click', openCheckoutDialog);
    $('checkout-form').addEventListener('submit', onCheckoutSubmit);
    $('checkout-cancel').addEventListener('click', function () {
      $('checkout-dialog').close();
      $('checkout').focus();
    });
    // 'toggle' does not bubble, so listen in the capture phase.
    $('orders-list').addEventListener('toggle', function (event) {
      var id = event.target.dataset && event.target.dataset.id;
      if (id) {
        if (event.target.open) {
          openOrders[id] = true;
        } else {
          delete openOrders[id];
        }
      }
    }, true);

    $('add-product').addEventListener('click', function () {
      openProductDialog(null);
    });
    $('item-list').addEventListener('click', onListClick);

    $('lookup').addEventListener('submit', onLookupSubmit);
    $('lookup').addEventListener('reset', function (event) {
      event.preventDefault();
      clearLookup();
      $('lookup-query').focus();
    });
    $('lookup-query').addEventListener('input', render);
    $('lookup-query').addEventListener('keydown', onLookupKeydown);
    $('lookup-category').addEventListener('change', render);
    $('lookup-stock').addEventListener('change', render);
    document.addEventListener('keydown', onDocumentKeydown);

    $('product-form').addEventListener('submit', onProductSubmit);
    $('product-cancel').addEventListener('click', function () {
      $('product-dialog').close();
    });

    $('delete-form').addEventListener('submit', onDeleteSubmit);
    $('delete-cancel').addEventListener('click', function () {
      $('delete-dialog').close();
    });

    window.addEventListener('storage', onStorage);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
