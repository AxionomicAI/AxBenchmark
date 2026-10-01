// UI layer: reads and writes data through Inventory (js/inventory.js), Cart
// (js/cart.js) and Orders (js/orders.js).
(function () {
  'use strict';

  var STATUS_DURATION_MS = 5000;
  var WHOLE_NUMBER_HINT = 'Enter a whole number, 0 or more.';

  // The inputs of the product form, in the order they appear. key is the
  // product field an input edits. An input with a parse function holds a
  // number: parse reads what was typed, toInput writes a stored value for
  // editing and format writes one for a message.
  var FORM_FIELDS = [
    { key: 'name', inputId: 'product-name', label: 'Name', required: true },
    { key: 'sku', inputId: 'product-sku', label: 'SKU', required: true },
    { key: 'category', inputId: 'product-category', label: 'Category', required: false },
    {
      key: 'priceCents', inputId: 'product-price', label: 'Price', required: true,
      parse: InventoryFormat.parsePrice, toInput: InventoryFormat.priceToInput,
      format: InventoryFormat.formatPrice,
      invalid: 'Enter a price of 0 or more with up to 2 decimal places, such as 19.99.'
    },
    {
      key: 'quantity', inputId: 'product-quantity', label: 'Quantity', required: true,
      parse: InventoryFormat.parseWholeNumber, toInput: String,
      format: InventoryFormat.formatNumber, invalid: WHOLE_NUMBER_HINT
    },
    {
      key: 'reorderLevel', inputId: 'product-reorder-level', label: 'Reorder level', required: true,
      parse: InventoryFormat.parseWholeNumber, toInput: String,
      format: InventoryFormat.formatNumber, invalid: WHOLE_NUMBER_HINT
    }
  ];

  // How each stock status (see Inventory.stockStatus) is shown, in the order
  // the status filter offers them.
  var STATUS_BADGES = {
    ok: { label: 'In stock', className: 'badge badge-ok' },
    low: { label: 'Low stock', className: 'badge badge-low' },
    out: { label: 'Out of stock', className: 'badge badge-out' }
  };

  var statusTimer = null;

  // What the lookup controls ask for, in the form InventorySearch.filter takes.
  var criteria = { text: '', category: null, status: null };

  // What each option of the category filter stands for, in the order of the
  // options: null for every category, a category, or '' for products without
  // one.
  var categoryChoices = [];

  // The product in the form as it was when the form opened, or null when the
  // form is adding a product.
  var editing = null;

  // The product the delete dialog is asking about.
  var deleting = null;

  // The row button ({ id, action }) to focus when a dialog closes, or null
  // for the Add product button.
  var focusReturn = null;

  // True when a quantity typed in the cart has been refused by the press that
  // is still going on: a press on a button first takes the focus from the
  // input, which is when the quantity is used.
  var quantityRefused = false;

  function byId(id) {
    return document.getElementById(id);
  }

  function quoted(name) {
    return '“' + name + '”';
  }

  function countOf(number, noun) {
    return InventoryFormat.formatNumber(number) + ' ' + noun + (number === 1 ? '' : 's');
  }

  // Briefly shows a message confirming what just happened, and announces it
  // to screen readers.
  function showStatus(message) {
    var status = byId('status-message');
    status.textContent = message;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(function () {
      status.textContent = '';
    }, STATUS_DURATION_MS);
  }

  // --- Product table ---

  function compareByName(a, b) {
    return a.name.localeCompare(b.name, 'en', { sensitivity: 'base', numeric: true });
  }

  // Product text is only ever put on the page as textContent, never as HTML.
  function element(tag, text, className) {
    var el = document.createElement(tag);
    el.textContent = text;
    if (className) {
      el.className = className;
    }
    return el;
  }

  function actionButton(action, label, className, product) {
    var button = element('button', label, className);
    button.type = 'button';
    button.setAttribute('aria-label', label + ' ' + product.name);
    button.dataset.action = action;
    button.dataset.id = product.id;
    return button;
  }

  // A cell under the column with the given heading. The heading is repeated
  // on the cell for the narrow-screen layout, which shows it beside the value.
  function dataCell(label, text, className) {
    var cell = element('td', text, className);
    cell.dataset.label = label;
    return cell;
  }

  function buildRow(product) {
    var row = document.createElement('tr');
    row.dataset.id = product.id;

    var name = element('th', product.name, 'product-name');
    name.scope = 'row';
    row.appendChild(name);
    row.appendChild(dataCell('SKU', product.sku, 'product-sku'));
    row.appendChild(product.category
      ? dataCell('Category', product.category, 'product-category')
      : dataCell('Category', '\u2014', 'empty-value'));
    row.appendChild(dataCell('Price', InventoryFormat.formatPrice(product.priceCents), 'numeric'));
    row.appendChild(dataCell('Quantity', InventoryFormat.formatNumber(product.quantity), 'numeric'));
    row.appendChild(dataCell('Reorder level', InventoryFormat.formatNumber(product.reorderLevel), 'numeric'));

    var status = STATUS_BADGES[Inventory.stockStatus(product)];
    var statusCell = dataCell('Status', '');
    statusCell.appendChild(element('span', status.label, status.className));
    row.appendChild(statusCell);

    var actions = element('td', '', 'row-actions');
    var add = actionButton('cart', 'Add to cart', 'button button-small', product);
    add.setAttribute('aria-label', 'Add ' + product.name + ' to cart');
    // Not disabled, so that pressing it can say why nothing was added.
    setUnavailable(add, product.quantity === 0);
    actions.appendChild(add);
    actions.appendChild(actionButton('edit', 'Edit', 'button button-small', product));
    actions.appendChild(actionButton('delete', 'Delete', 'button button-small button-danger', product));
    row.appendChild(actions);
    return row;
  }

  // Marks a button as one that will not do anything right now. It can still
  // be focused and pressed, unlike a disabled one.
  function setUnavailable(button, unavailable) {
    if (unavailable) {
      button.setAttribute('aria-disabled', 'true');
    } else {
      button.removeAttribute('aria-disabled');
    }
  }

  // Product ids come from storage and can hold any characters, so rows and
  // buttons are found by comparing ids rather than by building a selector.
  function findById(body, selector, id) {
    var candidates = body.querySelectorAll(selector);
    for (var i = 0; i < candidates.length; i++) {
      if (candidates[i].dataset.id === id) {
        return candidates[i];
      }
    }
    return null;
  }

  function findRow(id) {
    return findById(byId('products-body'), 'tr', id);
  }

  function findRowButton(id, action) {
    return findById(byId('products-body'), 'button[data-action="' + action + '"]', id);
  }

  function renderSummary(products) {
    var summary = byId('inventory-summary');
    if (products.length === 0) {
      summary.textContent = 'No products yet. Use “Add product” to create the first one.';
      return;
    }
    var units = products.reduce(function (total, product) {
      return total + product.quantity;
    }, 0);
    summary.textContent = countOf(products.length, 'product') + ', ' +
      countOf(units, 'unit') + ' in stock.';
  }

  function render() {
    var all = Inventory.getProducts();
    renderCategoryFilter(all);
    var products = InventorySearch.filter(all, criteria).sort(compareByName);
    var body = byId('products-body');

    // The rows are rebuilt, so remember which row button had the focus.
    var focused = document.activeElement;
    var keepFocus = body.contains(focused)
      ? { id: focused.dataset.id, action: focused.dataset.action }
      : null;

    renderSummary(all);
    renderLookupResults(products.length, all.length);
    body.textContent = '';
    products.forEach(function (product) {
      body.appendChild(buildRow(product));
    });
    byId('products-table-wrap').hidden = products.length === 0;

    if (keepFocus) {
      var button = findRowButton(keepFocus.id, keepFocus.action);
      if (button) {
        button.focus({ preventScroll: true });
      }
    }

    // The cart shows the names, prices and stock of its products.
    renderCart();
  }

  // Draws attention to a product that was just added or changed. Returns
  // false if the product is not in the table, which is when the lookup leaves
  // it out.
  function highlightRow(id) {
    var row = findRow(id);
    if (row) {
      row.classList.add('row-highlight');
      row.scrollIntoView({ block: 'nearest' });
    }
    return row !== null;
  }

  function onTableClick(event) {
    var button = event.target.closest('button[data-action]');
    if (!button) {
      return;
    }
    var product = Inventory.getProduct(button.dataset.id);
    if (!product) {
      render();
      showStatus('That product no longer exists.');
      return;
    }
    if (button.dataset.action === 'cart') {
      addToCart(product);
      return;
    }
    focusReturn = { id: product.id, action: button.dataset.action };
    if (button.dataset.action === 'edit') {
      openProductForm(product);
    } else {
      openDeleteDialog(product);
    }
  }

  // Rendering replaces the row buttons, so the browser cannot put the focus
  // back on the one that opened a dialog; this finds its replacement.
  function restoreFocus() {
    var button = focusReturn && findRowButton(focusReturn.id, focusReturn.action);
    (button || byId('add-product')).focus({ preventScroll: true });
  }

  // --- Lookup ---

  function addOption(select, label) {
    var option = element('option', label);
    select.appendChild(option);
    return option;
  }

  function fillStatusFilter() {
    var select = byId('lookup-status');
    addOption(select, 'Any status').value = '';
    Object.keys(STATUS_BADGES).forEach(function (key) {
      addOption(select, STATUS_BADGES[key].label).value = key;
    });
  }

  // Offers the categories the products are in. A category that no product is
  // in any more cannot be offered, so a lookup for it goes back to every
  // category.
  function renderCategoryFilter(products) {
    var choices = [null].concat(InventorySearch.categories(products));
    if (products.some(function (product) { return product.category === ''; })) {
      choices.push('');
    }

    var select = byId('lookup-category');
    // The options are left alone when they are still right, so that the list
    // does not change under a user who has it open.
    if (JSON.stringify(choices) !== JSON.stringify(categoryChoices)) {
      select.textContent = '';
      choices.forEach(function (choice) {
        addOption(select, choice === null ? 'All categories' : choice || 'No category');
      });
      categoryChoices = choices;
    }

    var wanted = criteria.category;
    var selected = 0;
    choices.forEach(function (choice, index) {
      if (wanted !== null && choice !== null && choice.toLowerCase() === wanted.toLowerCase()) {
        selected = index;
      }
    });
    select.selectedIndex = selected;
    criteria.category = choices[selected];
  }

  // Says how many of the products the lookup found, and offers a way back to
  // all of them.
  function renderLookupResults(found, total) {
    var filtering = total > 0 &&
      (criteria.text !== '' || criteria.category !== null || criteria.status !== null);
    var message = '';
    if (filtering) {
      message = found === 0
        ? 'No products match.'
        : 'Showing ' + InventoryFormat.formatNumber(found) + ' of ' + countOf(total, 'product') + '.';
    }
    // The count is announced to screen readers when it changes, so it is not
    // touched when it stays the same.
    var count = byId('lookup-count');
    if (count.textContent !== message) {
      count.textContent = message;
    }
    byId('lookup-clear').hidden = !filtering;
    byId('lookup').hidden = total === 0;
  }

  function onLookupChange() {
    criteria = {
      text: byId('lookup-text').value.trim(),
      category: categoryChoices[byId('lookup-category').selectedIndex],
      status: byId('lookup-status').value || null
    };
    render();
  }

  function clearLookup() {
    byId('lookup-text').value = '';
    byId('lookup-category').selectedIndex = 0;
    byId('lookup-status').selectedIndex = 0;
    onLookupChange();
    // The button that was pressed is hidden now.
    byId('lookup-text').focus();
  }

  // Escape empties the search box. Some browsers do this themselves, others
  // do not.
  function onLookupKeydown(event) {
    var input = byId('lookup-text');
    if (event.key === 'Escape' && input.value !== '') {
      event.preventDefault();
      input.value = '';
      onLookupChange();
    }
  }

  // --- Add and edit form ---

  function setFieldError(field, message) {
    var input = byId(field.inputId);
    var error = byId(field.inputId + '-error');
    error.textContent = message || '';
    error.hidden = !message;
    if (message) {
      input.setAttribute('aria-invalid', 'true');
    } else {
      input.removeAttribute('aria-invalid');
    }
  }

  function setNotice(id, message) {
    var notice = byId(id);
    notice.textContent = message || '';
    notice.hidden = !message;
  }

  // Shows the given errors (a map of product field to message, as returned
  // by Inventory) in the form, clearing any shown before. Returns true if
  // there was at least one.
  function showFormErrors(errors) {
    var firstInvalid = null;
    FORM_FIELDS.forEach(function (field) {
      setFieldError(field, errors[field.key]);
      if (errors[field.key] && !firstInvalid) {
        firstInvalid = byId(field.inputId);
      }
    });
    setNotice('product-form-error', errors.id
      ? 'This product no longer exists. It may have been deleted in another tab.'
      : errors.storage);
    if (firstInvalid) {
      firstInvalid.focus();
    }
    return Object.keys(errors).length > 0;
  }

  // Reads the form. Returns { values, errors }: values maps product fields
  // to what was entered, and errors maps the fields whose input cannot be
  // used to a message. Rules that need the other products are left to
  // Inventory.
  function readForm() {
    var values = {};
    var errors = {};
    FORM_FIELDS.forEach(function (field) {
      var text = byId(field.inputId).value.trim();
      if (text === '' && field.required) {
        errors[field.key] = field.label + ' is required.';
      } else if (!field.parse) {
        values[field.key] = text;
      } else {
        var number = field.parse(text);
        if (number === null) {
          errors[field.key] = field.invalid;
        } else if (number > Inventory.MAX_INTEGER) {
          errors[field.key] = field.label + ' must be at most ' +
            field.format(Inventory.MAX_INTEGER) + '.';
        } else {
          values[field.key] = number;
        }
      }
    });
    return { values: values, errors: errors };
  }

  // An error is about what the input held when the form was submitted, so it
  // goes when the input is changed.
  function onProductInput(event) {
    FORM_FIELDS.forEach(function (field) {
      if (field.inputId === event.target.id) {
        setFieldError(field, null);
      }
    });
  }

  // Suggests the categories already in use, so that they stay consistent.
  function fillCategoryOptions() {
    var options = byId('category-options');
    options.textContent = '';
    InventorySearch.categories(Inventory.getProducts()).forEach(function (category) {
      var option = document.createElement('option');
      option.value = category;
      options.appendChild(option);
    });
  }

  // Opens the form to edit the given product, or to add one if there is none.
  function openProductForm(product) {
    editing = product || null;
    byId('product-form').reset();
    showFormErrors({});
    if (editing) {
      FORM_FIELDS.forEach(function (field) {
        var value = editing[field.key];
        byId(field.inputId).value = field.toInput ? field.toInput(value) : value;
      });
    }
    byId('product-dialog-title').textContent = editing ? 'Edit product' : 'Add product';
    byId('product-submit').textContent = editing ? 'Save changes' : 'Add product';
    fillCategoryOptions();
    byId('product-dialog').showModal();
  }

  // The entered values that differ from the product being edited. Only these
  // are saved, so that a change made to another field in another tab while
  // the form was open is not undone.
  function changedValues(values) {
    var changes = {};
    Object.keys(values).forEach(function (key) {
      if (values[key] !== editing[key]) {
        changes[key] = values[key];
      }
    });
    return changes;
  }

  function onProductSubmit(event) {
    event.preventDefault();
    var input = readForm();
    if (showFormErrors(input.errors)) {
      return;
    }

    var result;
    if (editing) {
      var changes = changedValues(input.values);
      if (Object.keys(changes).length === 0) {
        byId('product-dialog').close();
        return;
      }
      result = Inventory.updateProduct(editing.id, changes);
    } else {
      result = Inventory.addProduct(input.values);
    }
    if (!result.ok) {
      showFormErrors(result.errors);
      return;
    }

    byId('product-dialog').close();
    var listed = highlightRow(result.product.id);
    showStatus((editing ? 'Saved changes to ' : 'Added ') + quoted(result.product.name) + '.' +
      (listed ? '' : ' The current search is hiding it.'));
  }

  // --- Delete confirmation ---

  function openDeleteDialog(product) {
    deleting = product;
    byId('delete-dialog-text').textContent = quoted(product.name) + ' (' + product.sku +
      ') will be removed from the inventory' +
      (Cart.quantityOf(product.id) > 0 ? ' and from the cart' : '') + '. This cannot be undone.';
    setNotice('delete-error', null);
    byId('delete-dialog').showModal();
  }

  function onDeleteSubmit(event) {
    event.preventDefault();

    // The row will be gone, so the focus moves to the one that takes its place.
    var row = findRow(deleting.id);
    var neighbour = row && (row.nextElementSibling || row.previousElementSibling);

    var result = Inventory.removeProduct(deleting.id);
    // A product that no longer exists was deleted in another tab, which is
    // what was asked for here too.
    if (!result.ok && !result.errors.id) {
      setNotice('delete-error', result.errors.storage);
      return;
    }

    focusReturn = neighbour ? { id: neighbour.dataset.id, action: 'delete' } : null;
    byId('delete-dialog').close();
    showStatus('Deleted ' + quoted(deleting.name) + '.');
  }

  // --- Cart ---

  // The message for a change to the cart that was refused.
  function cartError(errors) {
    return errors.quantity || errors.storage || 'That product is no longer in the cart.';
  }

  function addToCart(product) {
    var result = Cart.add(product.id);
    if (!result.ok) {
      showStatus(cartError(result.errors));
      return;
    }
    var inCart = result.line.quantity;
    showStatus('Added ' + quoted(product.name) + ' to the cart' +
      (inCart > 1 ? ' (now ' + InventoryFormat.formatNumber(inCart) + ').' : '.'));
  }

  function cartControl(row, action) {
    return row.querySelector('[data-action="' + action + '"]');
  }

  // The row for a product in the cart, with nothing filled in yet.
  function buildCartRow(id) {
    function control(tag, action, text, className) {
      var el = element(tag, text, className);
      el.type = tag === 'button' ? 'button' : 'text';
      el.dataset.action = action;
      el.dataset.id = id;
      return el;
    }

    var row = document.createElement('tr');
    row.dataset.id = id;

    var name = element('th', '', 'product-name');
    name.scope = 'row';
    row.appendChild(name);
    row.appendChild(dataCell('SKU', '', 'product-sku'));
    row.appendChild(dataCell('Price', '', 'numeric cart-price'));

    var stepper = element('div', '', 'stepper');
    stepper.appendChild(control('button', 'decrease', '\u2212', 'button button-small'));
    var input = control('input', 'quantity', '');
    input.name = 'cart-quantity';
    input.inputMode = 'numeric';
    input.autocomplete = 'off';
    stepper.appendChild(input);
    stepper.appendChild(control('button', 'increase', '+', 'button button-small'));
    var quantity = element('div', '', 'cart-quantity');
    quantity.appendChild(stepper);
    quantity.appendChild(element('p', '', 'cart-warning'));
    row.appendChild(dataCell('Quantity', '')).appendChild(quantity);

    row.appendChild(dataCell('Subtotal', '', 'numeric cart-subtotal'));
    var actions = element('td', '', 'row-actions');
    actions.appendChild(control('button', 'remove', 'Remove', 'button button-small button-danger'));
    row.appendChild(actions);
    return row;
  }

  // Fills in a cart row with a line from Cart.getCart().
  function updateCartRow(row, line) {
    var product = line.product;
    row.querySelector('.product-name').textContent = product.name;
    row.querySelector('.product-sku').textContent = product.sku;
    row.querySelector('.cart-price').textContent = InventoryFormat.formatPrice(product.priceCents);
    row.querySelector('.cart-subtotal').textContent = InventoryFormat.formatPrice(line.subtotalCents);

    var decrease = cartControl(row, 'decrease');
    decrease.setAttribute('aria-label', 'Decrease quantity of ' + product.name);
    setUnavailable(decrease, line.quantity <= 1);
    var increase = cartControl(row, 'increase');
    increase.setAttribute('aria-label', 'Increase quantity of ' + product.name);
    setUnavailable(increase, line.quantity >= product.quantity);
    cartControl(row, 'remove').setAttribute('aria-label', 'Remove ' + product.name + ' from cart');

    var input = cartControl(row, 'quantity');
    var quantity = String(line.quantity);
    input.setAttribute('aria-label', 'Quantity of ' + product.name);
    // Writing the value moves the caret, so it is only written when it is
    // wrong. What the user is typing is not wrong: it is left alone unless
    // the quantity itself has changed since it was last written.
    var typing = input === document.activeElement && input.dataset.quantity === quantity;
    if (!typing && input.value !== quantity) {
      input.value = quantity;
    }
    input.dataset.quantity = quantity;
    input.style.setProperty('--digits', quantity.length);

    // The stock can have gone down since the product was put in the cart.
    var warning = '';
    if (product.quantity === 0) {
      warning = 'Out of stock';
    } else if (line.quantity > product.quantity) {
      warning = 'Only ' + InventoryFormat.formatNumber(product.quantity) + ' in stock';
    }
    var warningText = row.querySelector('.cart-warning');
    warningText.textContent = warning;
    warningText.hidden = warning === '';
  }

  function renderCart() {
    var cart = Cart.getCart();
    var empty = cart.lines.length === 0;
    var total = InventoryFormat.formatPrice(cart.totalCents);
    var body = byId('cart-body');

    // Unlike the product table's, these rows are kept and filled in again.
    // Typing a quantity and then pressing a button changes the cart before
    // the press is over, and the press would be lost on a button that had
    // been replaced.
    cart.lines.forEach(function (line, index) {
      var row = findById(body, 'tr', line.product.id) || buildCartRow(line.product.id);
      updateCartRow(row, line);
      if (body.children[index] !== row) {
        body.insertBefore(row, body.children[index] || null);
      }
    });
    // The rows left after those of the lines are of products no longer in the cart.
    while (body.children.length > cart.lines.length) {
      body.lastElementChild.remove();
    }

    byId('cart-table-wrap').hidden = empty;
    byId('cart-actions').hidden = empty;
    byId('cart-total').textContent = total;
    byId('cart-link').textContent = 'Cart (' + InventoryFormat.formatNumber(cart.units) + ')';

    var message = empty
      ? 'The cart is empty. Use “Add to cart” on a product to put it here.'
      : countOf(cart.lines.length, 'product') + ', ' + countOf(cart.units, 'unit') +
        '. Total: ' + total + '.';
    // The summary is announced to screen readers when it changes, so it is
    // not touched when it stays the same.
    var summary = byId('cart-summary');
    if (summary.textContent !== message) {
      summary.textContent = message;
    }

    // Not disabled, so that pressing it can say why the cart cannot be
    // checked out.
    setUnavailable(byId('checkout'), Orders.checkCart(cart) !== null);
    // What the checkout dialog asks about, kept up to date in case the cart
    // is changed in another tab while the dialog is open.
    if (!empty) {
      byId('checkout-dialog-text').textContent = message + ' Placing the order takes these ' +
        'units out of the stock and adds the order to the order history. This cannot be undone.';
    }
  }

  // Returns false if the cart refused the quantity.
  function changeCartQuantity(id, quantity) {
    var result = Cart.setQuantity(id, quantity);
    if (result.ok) {
      // A message still showing may say that an earlier quantity was refused.
      showStatus('');
    } else {
      showStatus(cartError(result.errors));
      // Puts back the quantity that the cart holds.
      renderCart();
    }
    return result.ok;
  }

  function removeFromCart(id) {
    // The row will be gone, so the focus moves to the one that takes its place.
    var row = findById(byId('cart-body'), 'tr', id);
    var neighbour = row && (row.nextElementSibling || row.previousElementSibling);

    var result = Cart.remove(id);
    if (!result.ok) {
      showStatus(cartError(result.errors));
      renderCart();
      return;
    }
    (neighbour ? cartControl(neighbour, 'remove') : byId('cart-heading')).focus();
    showStatus('Removed ' + quoted(result.line.product.name) + ' from the cart.');
  }

  function onCartClick(event) {
    var button = event.target.closest('button[data-action]');
    if (!button) {
      return;
    }
    var id = button.dataset.id;
    var action = button.dataset.action;
    var quantity = Cart.quantityOf(id);
    if (action === 'remove') {
      removeFromCart(id);
    } else if (action === 'decrease' && quantity === 1) {
      showStatus('Use Remove to take a product out of the cart.');
    } else {
      changeCartQuantity(id, quantity + (action === 'increase' ? 1 : -1));
    }
  }

  // A quantity that was typed is used when the user leaves the input or
  // presses Enter.
  function onCartQuantityChange(event) {
    var input = event.target;
    // What was typed is used or refused now, so the input goes back to
    // showing the quantity that the cart holds.
    delete input.dataset.quantity;
    quantityRefused = !changeCartQuantity(input.dataset.id, InventoryFormat.parseWholeNumber(input.value));
  }

  // --- Checkout and order history ---

  // The message for a checkout that was refused.
  function checkoutError(errors) {
    return errors.cart || errors.stock || errors.total || errors.storage;
  }

  function openCheckoutDialog() {
    // The user has not seen yet that the cart does not hold what was typed;
    // the message that says so is showing. The next press checks out.
    if (quantityRefused) {
      quantityRefused = false;
      return;
    }
    var errors = Orders.checkCart(Cart.getCart());
    if (errors) {
      showStatus(checkoutError(errors));
      return;
    }
    setNotice('checkout-error', null);
    byId('checkout-dialog').showModal();
  }

  function onCheckoutSubmit(event) {
    event.preventDefault();
    var result = Orders.checkout();
    if (!result.ok) {
      setNotice('checkout-error', checkoutError(result.errors));
      return;
    }

    var order = result.order;
    byId('checkout-dialog').close();
    showStatus('Placed order #' + order.number + ': ' + countOf(order.units, 'unit') + ' for ' +
      InventoryFormat.formatPrice(order.totalCents) + '.' +
      (result.cartCleared ? '' : ' The cart could not be emptied; empty it before checking out again.'));

    // The Check out button is gone with the cart's contents, so the focus
    // moves to the new order, opened to show what was bought.
    var item = findById(byId('orders-list'), 'li', orderKey(order));
    if (item) {
      item.classList.add('row-highlight');
      item.querySelector('details').open = true;
      item.querySelector('summary').focus();
    }
  }

  // Tells an order from every other, including one with the same number in a
  // history that was started again after the browser's storage was cleared.
  function orderKey(order) {
    return order.number + ' ' + order.placedAt;
  }

  // The list item for an order from Orders.getOrders(): a summary line that
  // opens to show the order's lines.
  function buildOrder(order) {
    var title = 'Order #' + order.number;
    var item = document.createElement('li');
    item.className = 'order';
    item.dataset.id = orderKey(order);

    var time = element('time', InventoryFormat.formatDate(order.placedAt));
    time.dateTime = order.placedAt;
    var summary = document.createElement('summary');
    summary.append(
      element('span', title, 'order-number'), ' \u00b7 ', time, ' \u00b7 ',
      countOf(order.units, 'unit'), ' \u00b7 ',
      element('span', InventoryFormat.formatPrice(order.totalCents), 'order-total')
    );

    var table = element('table', '', 'data-table');
    table.setAttribute('aria-label', title);
    var headings = table.createTHead().insertRow();
    [['Name'], ['SKU'], ['Price', 'numeric'], ['Quantity', 'numeric'], ['Subtotal', 'numeric']]
      .forEach(function (column) {
        headings.appendChild(element('th', column[0], column[1])).scope = 'col';
      });
    var body = table.createTBody();
    order.lines.forEach(function (line) {
      var row = body.insertRow();
      row.appendChild(element('th', line.name, 'product-name')).scope = 'row';
      row.appendChild(dataCell('SKU', line.sku, 'product-sku'));
      row.appendChild(dataCell('Price', InventoryFormat.formatPrice(line.priceCents), 'numeric'));
      row.appendChild(dataCell('Quantity', InventoryFormat.formatNumber(line.quantity), 'numeric'));
      row.appendChild(dataCell('Subtotal', InventoryFormat.formatPrice(line.subtotalCents), 'numeric'));
    });

    var details = document.createElement('details');
    details.appendChild(summary);
    details.appendChild(element('div', '', 'table-scroll')).appendChild(table);
    item.appendChild(details);
    return item;
  }

  function renderOrders() {
    // Newest first.
    var orders = Orders.getOrders().reverse();
    var list = byId('orders-list');

    // An order never changes, so the item of one that is listed already is
    // kept as it is: open or closed, and with the focus if it has it.
    var listed = new Map();
    Array.prototype.forEach.call(list.children, function (item) {
      listed.set(item.dataset.id, item);
    });
    orders.forEach(function (order, index) {
      var item = listed.get(orderKey(order)) || buildOrder(order);
      if (list.children[index] !== item) {
        list.insertBefore(item, list.children[index] || null);
      }
    });
    // The items left after those of the orders are of orders no longer stored.
    while (list.children.length > orders.length) {
      list.lastElementChild.remove();
    }

    list.hidden = orders.length === 0;
    byId('orders-summary').textContent = orders.length === 0
      ? 'No orders yet. Checking out the cart places one.'
      : countOf(orders.length, 'order') + ', newest first.';
  }

  function init() {
    var status = Inventory.init();
    var orderStatus = Orders.init();
    byId('storage-warning').hidden = status.persistent;
    byId('recovery-warning').hidden = !status.recovered && !orderStatus.recovered;
    byId('sample-notice').hidden = !status.seeded;

    byId('add-product').addEventListener('click', function () {
      focusReturn = null;
      openProductForm(null);
    });
    byId('products-body').addEventListener('click', onTableClick);

    fillStatusFilter();
    byId('lookup-text').addEventListener('input', onLookupChange);
    byId('lookup-text').addEventListener('keydown', onLookupKeydown);
    byId('lookup-category').addEventListener('change', onLookupChange);
    byId('lookup-status').addEventListener('change', onLookupChange);
    byId('lookup-clear').addEventListener('click', clearLookup);

    byId('product-form').addEventListener('submit', onProductSubmit);
    byId('product-form').addEventListener('input', onProductInput);
    byId('product-cancel').addEventListener('click', function () {
      byId('product-dialog').close();
    });
    byId('product-dialog').addEventListener('close', restoreFocus);

    byId('delete-form').addEventListener('submit', onDeleteSubmit);
    byId('delete-cancel').addEventListener('click', function () {
      byId('delete-dialog').close();
    });
    byId('delete-dialog').addEventListener('close', restoreFocus);

    byId('cart-body').addEventListener('click', onCartClick);
    byId('cart-body').addEventListener('change', onCartQuantityChange);
    // A new press starts: the last one's refused quantity is in the past.
    ['pointerdown', 'keydown'].forEach(function (type) {
      document.addEventListener(type, function () {
        quantityRefused = false;
      }, true);
    });

    byId('checkout').addEventListener('click', openCheckoutDialog);
    byId('checkout-form').addEventListener('submit', onCheckoutSubmit);
    byId('checkout-cancel').addEventListener('click', function () {
      byId('checkout-dialog').close();
    });

    Inventory.subscribe(render);
    Cart.subscribe(renderCart);
    Orders.subscribe(renderOrders);
    render();
    renderOrders();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
