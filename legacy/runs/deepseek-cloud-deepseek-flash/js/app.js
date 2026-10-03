/*
 * app.js — bootstrap, rendering, and the add / edit / delete / cart / checkout
 * flows.
 *
 * Nothing here changes a list directly. Every edit goes through
 * `Inventory.items`, `Inventory.cart` or `Inventory.orders`, which save before
 * they return and then redraw the page through the subscriptions set up in
 * init(). So the handlers below only have to gather input and say what went
 * wrong.
 *
 * Classic script (no ES module syntax) so the page works over file://.
 */
(function (global) {
  'use strict';

  var store = global.Inventory.items;
  var cartStore = global.Inventory.cart;
  var ordersStore = global.Inventory.orders;
  var storage = global.Inventory.storage;

  var els = {};

  /*
   * The product the open form is editing, or null when it is adding a new one.
   * The same dialog serves both, and this is what tells them apart on submit.
   */
  var editingId = null;

  /*
   * What the confirmation dialog will do if it is answered yes, or null. The
   * wording was written into the dialog when it opened; this is the act itself.
   * Deleting a product and emptying the cart both throw away a lot at once, and
   * one dialog asks for both rather than two that would drift apart.
   */
  var pendingConfirm = null;

  /*
   * Every cart change redraws the whole page, which takes the caret with it.
   * The control that was used registers itself under a key while it is drawn,
   * and `focusKey` names the one to put the caret back on — a stepper that
   * loses focus after each click cannot be used from the keyboard at all.
   * Both are cleared by the render that consumes them.
   *
   * `focusKey` is a list rather than a single key: the control that was used
   * comes first, then wherever the caret should go when the redraw has drawn
   * that control away or disabled it. Removing a cart line, and deleting the
   * product a row was drawn for, both destroy the button that was pressed.
   */
  var focusKey = null;
  var focusTargets = Object.create(null);

  /*
   * Where the caret goes when a key's own control has gone. It is registered
   * after every redraw precisely because it outlives all of them, so the caret
   * is never dropped on the body — which would send the next Tab back to the
   * top of the page, past everything the user was working on.
   */
  var HOME_KEY = 'landmark:add-item';

  var STORAGE_UNAVAILABLE =
    'Storage is unavailable in this browser, so changes will not be saved. ' +
    'If you opened this file directly, try a normal (non-private) window.';

  var WRITE_FAILED =
    'The browser refused to save that change, so it is only in this window. ' +
    'Storage may be full or blocked.';

  function cacheElements() {
    els.addButton = document.getElementById('add-item');
    els.itemCount = document.getElementById('item-count');
    els.itemList = document.getElementById('item-list');
    els.emptyState = document.getElementById('empty-state');
    els.saveWarning = document.getElementById('save-warning');

    els.searchInput = document.getElementById('search-input');
    els.categoryFilter = document.getElementById('category-filter');
    els.clearFilters = document.getElementById('clear-filters');
    els.searchSummary = document.getElementById('search-summary');
    els.noMatches = document.getElementById('no-matches');

    els.cartList = document.getElementById('cart-list');
    els.cartCount = document.getElementById('cart-count');
    els.cartEmpty = document.getElementById('cart-empty');
    els.cartClear = document.getElementById('cart-clear');
    els.cartStale = document.getElementById('cart-stale');
    els.cartNote = document.getElementById('cart-note');
    els.cartTotal = document.getElementById('cart-total');
    els.cartTotalRow = document.getElementById('cart-total-row');
    els.cartCheckout = document.getElementById('cart-checkout');

    els.orderList = document.getElementById('order-list');
    els.ordersCount = document.getElementById('orders-count');
    els.ordersEmpty = document.getElementById('orders-empty');

    els.itemDialog = document.getElementById('item-dialog');
    els.form = document.getElementById('item-form');
    els.formTitle = document.getElementById('item-dialog-title');
    els.formError = document.getElementById('form-error');
    els.formCancel = document.getElementById('form-cancel');
    els.formSubmit = document.getElementById('form-submit');
    els.fieldName = document.getElementById('field-name');
    els.fieldCategory = document.getElementById('field-category');
    els.fieldQuantity = document.getElementById('field-quantity');
    els.fieldPrice = document.getElementById('field-price');
    els.fieldNotes = document.getElementById('field-notes');

    els.confirmDialog = document.getElementById('confirm-dialog');
    els.confirmTitle = document.getElementById('confirm-dialog-title');
    els.confirmMessage = document.getElementById('confirm-message');
    els.confirmCancel = document.getElementById('confirm-cancel');
    /* The id says "delete" because that is all this button used to do; one
       dialog now asks three questions and the caller labels the button. */
    els.confirmAction = document.getElementById('confirm-delete');
  }

  /* -------------------------------------------------------- formatting */

  /* "1 item" / "2 items" — counts are read aloud, so they must not say "1 items". */
  function plural(n, noun) {
    return n + ' ' + noun + (n === 1 ? '' : 's');
  }

  function formatStock(quantity) {
    return quantity === 0 ? 'Out of stock' : quantity + ' in stock';
  }

  /* "Showing 3 of 12 items" — the first half is a count of rows, not of
     products, so it does not go through plural(). */
  function formatShowing(shown, total) {
    return 'Showing ' + shown + ' of ' + plural(total, 'item');
  }

  function formatPrice(price) {
    return '$' + price.toFixed(2);
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  /* -------------------------------------------------------------- lookup */

  var ALL_CATEGORIES = 'All categories';

  /*
   * The lookup as it stands, read back from the controls themselves. Keeping a
   * copy in a variable would be one more thing that could drift from what the
   * user sees on screen.
   */
  function currentQuery() {
    return {
      text: els.searchInput.value,
      category: els.categoryFilter.value
    };
  }

  function isFiltered(query) {
    return query.text.trim() !== '' || query.category !== '';
  }

  /* Why the list is empty, in the words the user just used. */
  function noMatchesMessage(query) {
    var text = query.text.trim();
    if (text && query.category) {
      return 'No products match "' + text + '" in ' + query.category + '.';
    }
    if (text) return 'No products match "' + text + '".';
    return 'No products in ' + query.category + '.';
  }

  /*
   * Redraw from the store without a write report: changing the lookup is not a
   * change to the inventory, so the save warning is left as it is.
   */
  function redraw() {
    render(store.all());
  }

  function clearFilters() {
    els.searchInput.value = '';
    els.categoryFilter.value = '';
    redraw();
  }

  /* ---------------------------------------------------------- rendering */

  /* What a row can do, and how each action looks. */
  var ROW_ACTIONS = {
    cart: { label: 'Add to cart', className: 'btn btn-small' },
    edit: { label: 'Edit', className: 'btn btn-small' },
    delete: { label: 'Delete', className: 'btn btn-small btn-quiet-danger' }
  };

  /*
   * A row action. The visible label stays short, with the product name in a
   * visually hidden span: a screen reader listing the page's buttons reads
   * "Edit Wireless Mouse" rather than a column of identical "Edit"s.
   *
   * "Add to cart" is the exception. "Add to cart Wireless Mouse" is not a
   * sentence anyone would say, so its name goes in an aria-label instead — and
   * unlike a hidden span, that still names the product once the button is
   * disabled for having nothing left to add.
   *
   * `inCart` is how much of this product the cart already holds, which is what
   * decides whether there is any left to add.
   */
  function actionButton(item, action, inCart) {
    var button = el('button', ROW_ACTIONS[action].className, ROW_ACTIONS[action].label);
    button.type = 'button';
    button.dataset.action = action;

    if (action === 'cart') {
      button.setAttribute('aria-label', 'Add ' + item.name + ' to cart');
      button.disabled = inCart >= item.quantity;
      if (button.disabled) button.title = 'No more in stock to add';
      focusTargets['row:' + item.id + ':cart'] = button;
    } else {
      button.appendChild(el('span', 'visually-hidden', ' ' + item.name));
    }

    button.addEventListener('click', function () {
      if (action === 'cart') {
        /*
         * Adding redraws the row, so the button names itself as the place to
         * put the caret back — unless that add was the one that filled the
         * cart, which disables the button and sends the caret to the number
         * under it in the cart, since a disabled control cannot take it.
         *
         * Edit and delete are the other way round: they open a dialog, which
         * takes the caret itself, so neither needs a key.
         */
        withFocus(
          ['row:' + item.id + ':cart', 'cart:' + item.id + ':quantity', HOME_KEY],
          function () { addToCart(item.id); }
        );
      } else if (action === 'edit') {
        openEdit(item.id);
      } else {
        askToDelete(item.id);
      }
    });
    return button;
  }

  function renderItem(item, inCart) {
    var li = el('li', 'item');
    li.dataset.id = item.id;

    var details = el('div', 'item-details');

    var head = el('div', 'item-head');
    head.appendChild(el('span', 'item-name', item.name));
    if (item.category) head.appendChild(el('span', 'item-category', item.category));
    details.appendChild(head);

    if (item.notes) details.appendChild(el('p', 'item-notes', item.notes));

    var meta = el('p', 'item-meta');
    meta.appendChild(el(
      'span',
      item.quantity === 0 ? 'item-stock is-out' : 'item-stock',
      formatStock(item.quantity)
    ));
    meta.appendChild(el('span', 'item-price', formatPrice(item.price)));
    details.appendChild(meta);

    li.appendChild(details);

    var actions = el('div', 'item-actions');
    actions.appendChild(actionButton(item, 'cart', inCart));
    actions.appendChild(actionButton(item, 'edit'));
    actions.appendChild(actionButton(item, 'delete'));
    li.appendChild(actions);

    return li;
  }

  function categoryOption(value, label) {
    var option = el('option', null, label);
    option.value = value;
    return option;
  }

  /*
   * Fill the picker with the categories the list actually contains, keeping
   * the choice already made: one that is still there stays selected, and one
   * that has gone — its last product deleted, or renamed to another category —
   * falls back to "All categories". A filter on a value the picker no longer
   * offers would hide products with nothing on screen to explain why.
   *
   * The options come from the whole list rather than from the current matches,
   * so typing in the search box cannot make the chosen category disappear from
   * under the picker.
   */
  function syncCategoryFilter(items) {
    var chosen = els.categoryFilter.value;
    var names = store.categories(items);

    els.categoryFilter.replaceChildren();
    els.categoryFilter.appendChild(categoryOption('', ALL_CATEGORIES));
    names.forEach(function (name) {
      els.categoryFilter.appendChild(categoryOption(name, name));
    });

    els.categoryFilter.value = names.indexOf(chosen) === -1 ? '' : chosen;
  }

  /*
   * `info` is the write report the store sends alongside the list. A redraw
   * without one is the first paint, or a change to the lookup, rather than a
   * write, and leaves the warning alone.
   */
  function render(items, info) {
    /*
     * The picker is brought up to date first, because doing so can drop a
     * selection whose category is no longer in the list. Reading the query
     * before that would filter this paint by a value the picker has already
     * stopped showing.
     */
    syncCategoryFilter(items);

    var query = currentQuery();
    var filtered = isFiltered(query);
    var visible = store.search(items, query);

    /*
     * The cart is joined against the whole inventory rather than the lookup's
     * matches: hiding a row with a search does not take the product out of the
     * cart, so its line must still find its name and price.
     */
    var cart = cartStore.detail(cartStore.all(), items);

    focusTargets = Object.create(null);
    /* The last resort for a key whose control this redraw has drawn away. */
    focusTargets[HOME_KEY] = els.addButton;

    els.itemCount.textContent = plural(items.length, 'item');

    els.itemList.replaceChildren();
    visible.forEach(function (item) {
      els.itemList.appendChild(renderItem(item, cartQuantityIn(cart, item.id)));
    });

    /*
     * Two empty pages, and they mean different things: nothing recorded yet,
     * and nothing matching a lookup. Telling someone who has a search on that
     * they have "no items yet" would be a lie about their own inventory.
     */
    els.emptyState.hidden = items.length > 0;
    els.noMatches.hidden = !(items.length > 0 && visible.length === 0);
    if (!els.noMatches.hidden) els.noMatches.textContent = noMatchesMessage(query);

    els.clearFilters.hidden = !filtered;
    els.searchSummary.textContent = filtered ? formatShowing(visible.length, items.length) : '';

    renderCart(cart);
    /* The history does not depend on the lookup or on the cart, but the page is
       drawn from the stores in one go, so it is redrawn with everything else
       rather than kept in step by hand. */
    renderOrders();
    restoreFocus();

    if (info) {
      if (info.saved) setWarning(null);
      else setWarning(storage.isAvailable() ? WRITE_FAILED : STORAGE_UNAVAILABLE);
    }
  }

  function setWarning(message) {
    els.saveWarning.hidden = !message;
    els.saveWarning.textContent = message || '';
  }

  /* -------------------------------------------------------------- focus */

  /*
   * Put the caret back on the control that caused the redraw. A render replaces
   * every node it draws, so without this a stepper would drop focus on each
   * click and a quantity field would lose it on every commit.
   *
   * The keys are tried in order and the first that is still usable wins. One
   * that is no longer on the page — filtered out of the list, or the line it
   * belonged to removed — is passed over, as is one the redraw disabled, since
   * a disabled control cannot take the caret at all. `HOME_KEY` is on the end
   * of every list, so something always takes it.
   */
  function restoreFocus() {
    var keys = focusKey;
    focusKey = null;
    if (keys === null) return;

    for (var i = 0; i < keys.length; i++) {
      var target = focusTargets[keys[i]];
      if (target && target.isConnected && !target.disabled) {
        target.focus();
        return;
      }
    }
  }

  /*
   * Run a change with the caret pinned to `keys` across the redraw it causes. A
   * change that turns out not to redraw — a quantity set to the number it
   * already had — leaves the key behind, so it is dropped here rather than
   * being picked up by some later, unrelated render.
   */
  function withFocus(keys, change) {
    focusKey = [].concat(keys);
    var result = change();
    focusKey = null;
    return result;
  }

  /* ---------------------------------------------------------------- cart */

  /* How much of `itemId` the cart holds, for the row button that adds more. */
  function cartQuantityIn(detail, itemId) {
    for (var i = 0; i < detail.entries.length; i++) {
      if (detail.entries[i].itemId === itemId) return detail.entries[i].quantity;
    }
    return 0;
  }

  /*
   * A line of feedback about the cart, for what the controls cannot show by
   * themselves: a number the stock capped, an add that had nothing left to
   * take. The next change that works clears it.
   */
  function setCartNote(message) {
    els.cartNote.hidden = !message;
    els.cartNote.textContent = message || '';
  }

  function stepButton(entry, delta) {
    var label = delta > 0 ? '+' : '−';
    var button = el('button', 'btn btn-small btn-step', label);
    button.type = 'button';
    button.dataset.action = delta > 0 ? 'increase' : 'decrease';
    button.setAttribute('aria-label',
      (delta > 0 ? 'Add one more ' : 'Take one ') + entry.item.name);
    /* At the stock on hand there is nothing left to add. Minus has no floor:
       taking the last one out is how a line leaves the cart. */
    button.disabled = delta > 0 && entry.quantity >= entry.item.quantity;
    button.addEventListener('click', function () {
      stepQuantity(entry, delta);
    });
    return button;
  }

  function quantityInput(entry) {
    var input = document.createElement('input');
    input.type = 'number';
    input.className = 'cart-quantity';
    input.min = '1';
    input.step = '1';
    input.value = String(entry.quantity);
    input.setAttribute('aria-label', 'Quantity of ' + entry.item.name);
    /*
     * `change` rather than `input`: the field is capped at the stock on hand,
     * and capping on every keystroke would fight the user halfway through
     * typing "12". `change` waits until the field is committed.
     */
    input.addEventListener('change', function () {
      setTypedQuantity(entry, input.value);
    });
    return input;
  }

  function removeLineButton(entry) {
    var button = el('button', 'btn btn-small btn-quiet-danger', 'Remove');
    button.type = 'button';
    button.dataset.action = 'remove';
    if (entry.item) {
      button.appendChild(el('span', 'visually-hidden', ' ' + entry.item.name));
    }

    /*
     * Taking the line out destroys this button, so the caret falls back to the
     * product's own row — where the button that puts it back in the cart is,
     * which makes the fallback an undo as well as a landing place.
     */
    var key = 'cart:' + entry.itemId + ':remove';
    focusTargets[key] = button;

    button.addEventListener('click', function () {
      withFocus([key, 'row:' + entry.itemId + ':cart', HOME_KEY], function () {
        cartStore.remove(entry.itemId);
      });
    });
    return button;
  }

  /*
   * One cart line. A product that is no longer in the inventory has no name,
   * price or stock to draw, so its line says what happened and offers the one
   * thing left to do with it.
   */
  function renderCartLine(entry) {
    var li = el('li', 'cart-line');
    li.dataset.id = entry.itemId;

    var details = el('div', 'cart-details');
    details.appendChild(el('span',
      entry.item ? 'cart-name' : 'cart-name is-gone',
      entry.item ? entry.item.name : 'No longer in your inventory'));
    if (entry.item) {
      details.appendChild(el('span', 'cart-unit', formatPrice(entry.item.price) + ' each'));
    }
    /* The cart can hold more than there is: a product edited down to less stock
       after it was put in. Worth saying rather than silently renumbering. */
    if (entry.overStock) {
      details.appendChild(el('p', 'cart-meta', entry.item.quantity === 0
        ? 'Out of stock'
        : 'Only ' + entry.item.quantity + ' in stock'));
    }
    li.appendChild(details);

    if (entry.item) {
      var stepper = el('div', 'cart-stepper');
      var minus = stepButton(entry, -1);
      var input = quantityInput(entry);
      var plus = stepButton(entry, 1);

      stepper.appendChild(minus);
      stepper.appendChild(input);
      stepper.appendChild(plus);
      li.appendChild(stepper);
      li.appendChild(el('span', 'cart-subtotal', formatPrice(entry.subtotal)));

      focusTargets['cart:' + entry.itemId + ':decrease'] = minus;
      focusTargets['cart:' + entry.itemId + ':quantity'] = input;
      /* The "+" that reached the stock on hand disables itself, and a disabled
         button cannot take the caret — so that key lands on the number it just
         changed, which is where the user was looking anyway. */
      focusTargets['cart:' + entry.itemId + ':increase'] = plus.disabled ? input : plus;
    }

    li.appendChild(removeLineButton(entry));
    return li;
  }

  function renderCart(detail) {
    els.cartList.replaceChildren();
    detail.entries.forEach(function (entry) {
      els.cartList.appendChild(renderCartLine(entry));
    });

    var empty = detail.entries.length === 0;
    els.cartEmpty.hidden = !empty;
    els.cartTotalRow.hidden = empty;
    els.cartClear.hidden = empty;
    els.cartCheckout.hidden = empty;

    els.cartCount.textContent = plural(detail.count, 'item');
    els.cartTotal.textContent = formatPrice(detail.total);

    els.cartStale.hidden = detail.missing === 0;
    if (detail.missing > 0) {
      els.cartStale.textContent = detail.missing === 1
        ? '1 item in your cart is no longer in your inventory.'
        : detail.missing + ' items in your cart are no longer in your inventory.';
    }
  }

  /* --------------------------------------------------------------- orders */

  /*
   * A stored timestamp, in the reader's own locale and time zone. The ISO value
   * is what the element carries for anything that wants to read it back.
   */
  function formatWhen(iso) {
    var date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  }

  /*
   * One past sale. The lines are the ones recorded at the time — names, prices
   * and all — because a receipt that changed when the product was renamed would
   * not be a record of anything.
   */
  function renderOrder(order) {
    var detail = ordersStore.detail(order);

    var li = el('li', 'order');
    li.dataset.id = order.id;

    var head = el('div', 'order-head');
    var when = el('time', 'order-when', formatWhen(order.at));
    when.dateTime = order.at;
    head.appendChild(when);
    head.appendChild(el('span', 'order-count', plural(detail.count, 'item')));
    head.appendChild(el('span', 'order-total', formatPrice(detail.total)));
    li.appendChild(head);

    var lines = el('ul', 'order-lines');
    detail.entries.forEach(function (entry) {
      var line = el('li', 'order-line');
      line.appendChild(el('span', 'order-line-name', entry.name));
      line.appendChild(el('span', 'order-line-price',
        entry.quantity + ' × ' + formatPrice(entry.price)));
      line.appendChild(el('span', 'order-line-subtotal', formatPrice(entry.subtotal)));
      lines.appendChild(line);
    });
    li.appendChild(lines);

    return li;
  }

  /*
   * The history reads newest first: the sale just made is the one worth seeing,
   * and the one the user goes looking for after checking out. The records are
   * stored in the order they happened and turned round here, so the stored blob
   * stays a plain append-only log. `all()` hands back an array of its own, so
   * turning that round cannot disturb the store.
   */
  function renderOrders() {
    var list = ordersStore.all().reverse();

    els.ordersCount.textContent = plural(list.length, 'order');
    els.ordersEmpty.hidden = list.length > 0;

    els.orderList.replaceChildren();
    list.forEach(function (order) {
      els.orderList.appendChild(renderOrder(order));
    });
  }

  /*
   * Put one more of a product in the cart, from its row. The button is disabled
   * when there is nothing left to take, so a refusal here means the page is a
   * step behind — say which of the reasons it was rather than doing nothing.
   */
  function addToCart(itemId) {
    if (cartStore.add(itemId, 1)) return;

    var item = store.get(itemId);
    if (!item) setCartNote('That product is no longer in your inventory.');
    else if (item.quantity === 0) setCartNote('"' + item.name + '" is out of stock.');
    else setCartNote('Your cart already has all ' + item.quantity + ' of "' + item.name + '".');
  }

  /* The stepper. Both ends go through the same cap a typed number does. */
  function stepQuantity(entry, delta) {
    withFocus(
      'cart:' + entry.itemId + (delta > 0 ? ':increase' : ':decrease'),
      function () {
        return cartStore.setQuantity(entry.itemId, entry.quantity + delta);
      }
    );
  }

  function setTypedQuantity(entry, value) {
    var wanted = Math.trunc(Number(value));
    var key = 'cart:' + entry.itemId + ':quantity';

    /*
     * An empty or unreadable field is not a request for zero — it is a field
     * the user cleared and left. Redraw so the stored number goes back in the
     * box, rather than taking the line out over a slip of the keyboard.
     */
    if (!Number.isFinite(wanted) || wanted < 1) {
      focusKey = [key];
      redraw();
      focusKey = null;
      return;
    }

    var line = withFocus(key, function () {
      return cartStore.setQuantity(entry.itemId, wanted);
    });

    /* Capped at the stock on hand. Say so, or the number would come back
       changed with nothing on screen to explain why. */
    if (line && line.quantity !== wanted) {
      setCartNote('Only ' + line.quantity + ' of "' + entry.item.name + '" in stock.');
    }
  }

  /* ------------------------------------------------------------ checkout */

  /*
   * What has to change before a cart can be checked out. The line itself
   * already says how much of the product there is; this is the instruction,
   * which is what a note is for.
   *
   * A single problem is named. Several are counted rather than listed, because
   * three product names read out in a note is worse than being told there are
   * three and where to look for them.
   */
  function checkoutBlockedMessage(blocked) {
    if (blocked.length !== 1) {
      return plural(blocked.length, 'item') +
        ' in your cart cannot be checked out as they are. Fix them to check out.';
    }

    var only = blocked[0];
    if (only.problem === 'missing') {
      return 'A line in your cart is no longer in your inventory. Remove it to check out.';
    }
    if (only.available === 0) {
      return '"' + only.name + '" is out of stock. Take it out of your cart to check out.';
    }
    return 'Only ' + only.available + ' of "' + only.name +
      '" in stock. Lower the quantity to check out.';
  }

  /*
   * Checking out changes the stock, empties the cart and files a receipt, so it
   * asks first — the same dialog deleting a product and emptying the cart use.
   *
   * When the cart cannot be fulfilled, nothing is asked: the note says what is
   * in the way. That covers the two lines the cart can hold but cannot sell —
   * one whose product has been deleted, and one holding more than there is —
   * and it refuses rather than rounding the sale down to what happens to be on
   * the shelf.
   */
  function askToCheckout() {
    var plan = ordersStore.plan(cartStore.all(), store.all());

    if (!plan.ok) {
      if (plan.reason === 'blocked') setCartNote(checkoutBlockedMessage(plan.blocked));
      return;
    }

    askToConfirm(
      'Check out',
      'Take ' + plural(plan.detail.count, 'item') + ' out of your inventory and record the ' +
        'order? Total ' + formatPrice(plan.detail.total) + '.',
      'Check out',
      checkOut,
      /* Nothing is thrown away here that a stock edit cannot put back, so the
         confirm button is not the red one. */
      { danger: false }
    );
  }

  function checkOut() {
    /* The sale empties the cart, so the button that asked is drawn away with
       it and the caret needs somewhere to land. */
    var result = withFocus([HOME_KEY], function () {
      return ordersStore.checkout();
    });

    /*
     * The dialog is modal, so the cart cannot have moved between the question
     * and the answer; this only covers the plan having gone stale some other
     * way. Say what is in the way rather than let a sale through that the data
     * layer refused.
     */
    if (!result.ok) {
      if (result.reason === 'blocked') setCartNote(checkoutBlockedMessage(result.blocked));
      return;
    }

    setCartNote('Checked out ' + plural(result.detail.count, 'item') + ' for ' +
      formatPrice(result.detail.total) + '.');
  }

  /* --------------------------------------------------------- add / edit */

  function openEdit(id) {
    var item = store.get(id);
    /* Nothing to edit if it went away between the redraw and the click. */
    if (item) openForm(item);
  }

  /*
   * One dialog for both flows: `item` is null when adding. The fields are
   * filled from the record rather than from the row that was clicked, so what
   * the form shows is exactly what would be saved.
   */
  function openForm(item) {
    editingId = item ? item.id : null;
    els.formTitle.textContent = item ? 'Edit item' : 'Add item';
    els.formSubmit.textContent = item ? 'Save changes' : 'Add item';

    els.fieldName.value = item ? item.name : '';
    els.fieldCategory.value = item ? item.category : '';
    els.fieldQuantity.value = item ? String(item.quantity) : '0';
    els.fieldPrice.value = item ? String(item.price) : '0';
    els.fieldNotes.value = item ? item.notes : '';

    clearFormError();
    els.itemDialog.showModal();
    els.fieldName.focus();
  }

  function closeForm() {
    editingId = null;
    clearFormError();
    els.itemDialog.close();
  }

  function showFormError(message) {
    els.formError.textContent = message;
    els.formError.hidden = false;
    els.fieldName.setAttribute('aria-invalid', 'true');
    els.fieldName.focus();
  }

  function clearFormError() {
    els.formError.textContent = '';
    els.formError.hidden = true;
    els.fieldName.removeAttribute('aria-invalid');
  }

  function onSubmit(event) {
    event.preventDefault();

    /*
     * Raw strings: the data layer trims, clamps, and rounds every field, and a
     * second copy of those rules here would be one more place for them to
     * drift.
     */
    var fields = {
      name: els.fieldName.value,
      category: els.fieldCategory.value,
      quantity: els.fieldQuantity.value,
      price: els.fieldPrice.value,
      notes: els.fieldNotes.value
    };

    var saved = editingId === null
      ? store.add(fields)
      : store.update(editingId, fields);

    /*
     * The store refuses a product with no name. `required` on the field stops
     * an empty submit before this runs, but a name of only spaces passes that
     * check and still trims to nothing, so this is a reachable path.
     */
    if (!saved) {
      showFormError('Give the product a name.');
      return;
    }

    closeForm();
  }

  /* --------------------------------------------------------- lookup keys */

  /*
   * Escape clears the search. Chrome and Safari do that themselves for
   * `type="search"`; Firefox does not, and a lookup that cannot be undone from
   * the keyboard alone is a small trap.
   */
  function onSearchKeydown(event) {
    if (event.key !== 'Escape' || els.searchInput.value === '') return;
    els.searchInput.value = '';
    redraw();
  }

  /* Where a keystroke is text being typed rather than a shortcut. */
  function isTextEntry(node) {
    if (!node || typeof node.tagName !== 'string') return false;
    var tag = node.tagName.toUpperCase();
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
  }

  /*
   * "/" jumps to the search box. It is only taken as a shortcut where a "/"
   * could not have been text: not while typing in a field, and not while a
   * dialog is open, where it would pull the caret out of a form mid-word.
   */
  function onDocumentKeydown(event) {
    if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
    if (els.itemDialog.open || els.confirmDialog.open) return;
    if (isTextEntry(event.target)) return;

    event.preventDefault();
    els.searchInput.focus();
  }

  /* ---------------------------------------------------------- confirming */

  /*
   * Ask, then do. `onConfirm` runs only if the user says yes, and the dialog is
   * filled in from the caller so one dialog can put several different
   * questions.
   *
   * `options.danger` picks the confirm button's colour and defaults to true:
   * most of what this asks about throws something away, and the one that does
   * not says so.
   */
  function askToConfirm(title, message, confirmLabel, onConfirm, options) {
    pendingConfirm = onConfirm;
    els.confirmTitle.textContent = title;
    els.confirmMessage.textContent = message;
    els.confirmAction.textContent = confirmLabel;
    els.confirmAction.className = (!options || options.danger !== false)
      ? 'btn btn-danger'
      : 'btn btn-primary';
    els.confirmDialog.showModal();
  }

  function closeConfirm() {
    pendingConfirm = null;
    els.confirmDialog.close();
  }

  /*
   * Take the question down before acting on it, so the page is never left with
   * a modal open over a redraw it did not ask for. Escape and Cancel both go
   * through closeConfirm() too, which is what leaves `pendingConfirm` empty for
   * the next dialog rather than a stale act waiting to be run.
   */
  function onConfirm() {
    var act = pendingConfirm;
    closeConfirm();
    if (act) act();
  }

  /* ------------------------------------------------------------- delete */

  function askToDelete(id) {
    var item = store.get(id);
    if (!item) return;

    askToConfirm(
      'Delete item',
      'Delete "' + item.name + '"? This cannot be undone.',
      'Delete',
      /* The row goes with the product, so the caret has to go somewhere the
         redraw has left standing. */
      function () { withFocus([HOME_KEY], function () { store.remove(id); }); }
    );
  }

  /* -------------------------------------------------------------- wiring */

  function wireEvents() {
    els.addButton.addEventListener('click', function () {
      openForm(null);
    });

    els.form.addEventListener('submit', onSubmit);
    els.formCancel.addEventListener('click', closeForm);
    els.confirmCancel.addEventListener('click', closeConfirm);
    els.confirmAction.addEventListener('click', onConfirm);
    els.cartCheckout.addEventListener('click', askToCheckout);

    /*
     * Emptying the cart throws away every line at once and there is no undo, so
     * it asks first — the same dialog deleting a product uses. Taking one line
     * out does not ask: putting it back is one click, and a confirmation on
     * every adjustment would be noise.
     */
    els.cartClear.addEventListener('click', function () {
      askToConfirm(
        'Clear cart',
        'Remove everything in your cart?',
        'Clear cart',
        /* Every line goes, taking the cart's own controls with them. */
        function () { withFocus([HOME_KEY], function () { cartStore.clear(); }); }
      );
    });

    /* The lookup redraws the page but never writes to it, so these go straight
     * to render rather than through the store. */
    els.searchInput.addEventListener('input', redraw);
    els.searchInput.addEventListener('keydown', onSearchKeydown);
    els.categoryFilter.addEventListener('change', redraw);
    els.clearFilters.addEventListener('click', clearFilters);
    document.addEventListener('keydown', onDocumentKeydown);

    /*
     * Deliberately nothing on the `close` event. Browsers queue it rather than
     * firing it inline, so it can arrive after the dialog has already been
     * reopened — clearing state that belongs to the new session, which for
     * `editingId` would quietly turn a save into a second product. Escape needs
     * no handling either: openForm(), closeForm() and closeConfirm() write this
     * state on the paths in and out, so a dismissed dialog leaves nothing
     * behind that the next one would read.
     */
  }

  /*
   * A change to the cart is a change to the page: the rows' "Add to cart"
   * buttons depend on what the cart already holds, and one of them may have
   * just run out of stock to add. It carries its own write report, so a cart
   * the browser refused to save gets the same warning an unsaved product does.
   */
  function onCartChange(lines, info) {
    setCartNote(null);
    render(store.all(), info);
  }

  /*
   * A new order is the last thing a checkout does, so it is the notification
   * the page is left holding — and it carries whether every write that checkout
   * made was accepted, not just the write of the order itself. Drawing from it
   * is what stops a checkout whose stock change was refused from being reported
   * as saved.
   *
   * Unlike the cart, it leaves the note alone: the "checked out" note is set
   * after the checkout that caused this has finished, so there is nothing here
   * to clear away.
   */
  function onOrdersChange(orders, info) {
    render(store.all(), info);
  }

  function init() {
    cacheElements();
    /* All three stores redraw the page after every change, so no call site has
     * to remember to re-render. The cart is read first because the first render
     * prices it against the inventory, and the history because it is drawn in
     * that same first render. */
    cartStore.load();
    ordersStore.load();
    store.subscribe(render);
    cartStore.subscribe(onCartChange);
    ordersStore.subscribe(onOrdersChange);
    render(store.load());
    wireEvents();

    if (!storage.isAvailable()) setWarning(STORAGE_UNAVAILABLE);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
