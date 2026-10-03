// Application entry point: inventory list with add, edit, delete, shopping cart, checkout and order history.
document.addEventListener('DOMContentLoaded', () => {
  const $ = (id) => document.getElementById(id);
  const rows = $('rows');
  const dialog = $('dialog');
  const form = $('form');
  const FIELDS = ['sku', 'name', 'category', 'price', 'quantity', 'reorderLevel'];
  let editingId = null;
  let messageTimer = null;

  const money = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' });

  // Fill `el` with `text`, wrapping occurrences of any search term in <mark>.
  function highlight(el, text, terms) {
    text = String(text);
    const lower = text.toLowerCase();
    const spans = [];
    terms.forEach((t) => {
      for (let i = lower.indexOf(t); i !== -1; i = lower.indexOf(t, i + t.length)) spans.push([i, i + t.length]);
    });
    spans.sort((a, b) => a[0] - b[0]);
    let pos = 0;
    spans.forEach(([s, e]) => {
      if (e <= pos) return;
      if (s > pos) el.append(text.slice(pos, s));
      const m = document.createElement('mark');
      m.textContent = text.slice(Math.max(s, pos), e);
      el.append(m);
      pos = e;
    });
    if (pos < text.length) el.append(text.slice(pos));
  }

  // Lower is better: exact SKU, SKU prefix, name prefix, anything else.
  function rank(p, q) {
    const sku = p.sku.toLowerCase();
    const name = p.name.toLowerCase();
    if (sku === q) return 0;
    if (sku.startsWith(q)) return 1;
    if (name.startsWith(q)) return 2;
    return 3;
  }

  function cell(text, className, terms) {
    const td = document.createElement('td');
    if (terms && terms.length) highlight(td, text, terms);
    else td.textContent = text;
    if (className) td.className = className;
    return td;
  }

  function button(label, className, onClick) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    if (className) b.className = className;
    b.addEventListener('click', onClick);
    return b;
  }

  function showMessage(text) {
    const el = $('message');
    el.textContent = text;
    el.hidden = false;
    clearTimeout(messageTimer);
    messageTimer = setTimeout(() => { el.hidden = true; }, 4000);
  }

  function render() {
    const all = Storage.getAll();
    refreshCategoryFilter(all);
    const q = $('search').value.trim().toLowerCase();
    const terms = q.split(/\s+/).filter(Boolean);
    const category = $('category-filter').value;
    const lowOnly = $('low-filter').checked;
    const items = all
      .filter((p) => {
        const hay = [p.sku, p.name, p.category].join('\n').toLowerCase();
        return terms.every((t) => hay.includes(t))
          && (!category || p.category === category)
          && (!lowOnly || p.quantity <= p.reorderLevel);
      })
      .sort((a, b) => (q ? rank(a, q) - rank(b, q) : 0) || a.name.localeCompare(b.name));
    $('result-count').textContent = terms.length || category || lowOnly
      ? items.length + ' of ' + all.length + ' products'
      : all.length + ' products';

    rows.textContent = '';
    items.forEach((p) => {
      const tr = document.createElement('tr');
      if (p.quantity <= p.reorderLevel) tr.className = 'low';
      tr.append(
        cell(p.sku, '', terms), cell(p.name, '', terms), cell(p.category, '', terms),
        cell(money.format(p.price), 'num'),
        cell(p.quantity, 'num qty'),
        cell(p.reorderLevel, 'num')
      );
      const actions = cell('', 'actions');
      const inCart = Cart.quantityOf(p.id);
      const addBtn = button('Add to cart', '', () => addToCart(p));
      addBtn.disabled = p.quantity < 1 || inCart >= p.quantity;
      if (p.quantity < 1) addBtn.title = 'Out of stock';
      else if (inCart >= p.quantity) addBtn.title = 'All available stock is in your cart';
      actions.append(
        addBtn,
        ' ',
        button('Edit', '', () => openForm(p)),
        ' ',
        button('Delete', 'danger', () => del(p))
      );
      tr.append(actions);
      rows.append(tr);
    });

    $('table').hidden = items.length === 0;
    const empty = $('empty');
    empty.hidden = items.length > 0;
    empty.textContent = all.length === 0
      ? 'No products yet. Click "Add product" to create one.'
      : 'No products match your search or filters.';

    const cats = [...new Set(all.map((p) => p.category).filter(Boolean))].sort();
    $('categories').textContent = '';
    cats.forEach((c) => {
      const o = document.createElement('option');
      o.value = c;
      $('categories').append(o);
    });
  }

  function refreshCategoryFilter(all) {
    const select = $('category-filter');
    const current = select.value;
    const cats = [...new Set(all.map((p) => p.category).filter(Boolean))].sort();
    select.textContent = '';
    [['', 'All categories'], ...cats.map((c) => [c, c])].forEach(([value, label]) => {
      const o = document.createElement('option');
      o.value = value;
      o.textContent = label;
      select.append(o);
    });
    select.value = cats.includes(current) ? current : '';
  }

  function openForm(product) {
    editingId = product ? product.id : null;
    form.reset();
    $('form-error').hidden = true;
    $('dialog-title').textContent = product ? 'Edit product' : 'Add product';
    if (product) {
      FIELDS.forEach((k) => { form.elements[k].value = product[k]; });
    }
    dialog.showModal();
    form.elements.sku.focus();
  }

  function del(product) {
    if (!confirm('Delete "' + product.name + '" (' + product.sku + ')? This cannot be undone.')) return;
    Storage.remove(product.id);
    render();
    renderCart();
    showMessage('Deleted ' + product.name + '.');
  }

  function addToCart(product) {
    try {
      Cart.add(product.id);
      showMessage('Added ' + product.name + ' to the cart.');
    } catch (err) {
      showMessage(err.message);
    }
    render();
    renderCart();
  }

  const cartDialog = $('cart-dialog');

  function showCartError(text) {
    const el = $('cart-error');
    el.textContent = text || '';
    el.hidden = !text;
  }

  function renderCart() {
    const lines = Cart.items();
    $('cart-count').textContent = Cart.count();
    $('cart-empty').hidden = lines.length > 0;
    $('cart-table').hidden = lines.length === 0;
    $('cart-clear').hidden = lines.length === 0;
    $('checkout-btn').hidden = lines.length === 0;
    $('cart-total').textContent = money.format(Cart.total());
    const body = $('cart-rows');
    body.textContent = '';
    lines.forEach(({ product: p, quantity, subtotal }) => {
      const tr = document.createElement('tr');
      const qty = document.createElement('input');
      qty.type = 'number';
      qty.min = '1';
      qty.max = String(p.quantity);
      qty.step = '1';
      qty.value = quantity;
      qty.className = 'cart-qty';
      qty.setAttribute('aria-label', 'Quantity of ' + p.name);
      qty.addEventListener('change', () => {
        showCartError('');
        try {
          Cart.setQuantity(p.id, qty.value === '' ? quantity : qty.value);
        } catch (err) {
          showCartError(err.message);
        }
        render();
        renderCart();
      });
      const qtyCell = cell('', 'num');
      qtyCell.append(qty);
      const removeCell = cell('', 'actions');
      removeCell.append(button('Remove', 'danger', () => {
        showCartError('');
        Cart.remove(p.id);
        render();
        renderCart();
      }));
      tr.append(
        cell(p.name + ' (' + p.sku + ')'),
        cell(money.format(p.price), 'num'),
        qtyCell,
        cell(money.format(subtotal), 'num'),
        removeCell
      );
      body.append(tr);
    });
  }

  $('cart-btn').addEventListener('click', () => {
    showCartError('');
    renderCart();
    cartDialog.showModal();
  });
  $('cart-close').addEventListener('click', () => cartDialog.close());
  $('cart-clear').addEventListener('click', () => {
    Cart.clear();
    showCartError('');
    render();
    renderCart();
  });

  $('checkout-btn').addEventListener('click', () => {
    showCartError('');
    try {
      const order = Orders.checkout();
      cartDialog.close();
      showMessage('Order ' + order.id + ' placed: ' + money.format(order.total) + '.');
    } catch (err) {
      showCartError(err.message);
    }
    render();
    renderCart();
  });

  const ordersDialog = $('orders-dialog');

  function renderOrders() {
    const orders = Orders.all();
    $('orders-empty').hidden = orders.length > 0;
    const list = $('orders-list');
    list.textContent = '';
    orders.forEach((o) => {
      const box = document.createElement('div');
      box.className = 'order';
      const h = document.createElement('h3');
      const title = document.createElement('span');
      title.textContent = 'Order ' + o.id + ' – ' + new Date(o.createdAt).toLocaleString();
      const total = document.createElement('span');
      total.textContent = money.format(o.total);
      h.append(title, total);
      const table = document.createElement('table');
      table.className = 'order-lines';
      const tbody = document.createElement('tbody');
      o.lines.forEach((l) => {
        const tr = document.createElement('tr');
        tr.append(
          cell(l.name + ' (' + l.sku + ')'),
          cell(l.quantity + ' × ' + money.format(l.price), 'num'),
          cell(money.format(l.subtotal), 'num')
        );
        tbody.append(tr);
      });
      table.append(tbody);
      box.append(h, table);
      list.append(box);
    });
  }

  $('orders-btn').addEventListener('click', () => {
    renderOrders();
    ordersDialog.showModal();
  });
  $('orders-close').addEventListener('click', () => ordersDialog.close());

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fields = {};
    FIELDS.forEach((k) => { fields[k] = form.elements[k].value; });
    try {
      const saved = editingId ? Storage.update(editingId, fields) : Storage.add(fields);
      dialog.close();
      render();
      renderCart();
      showMessage((editingId ? 'Updated ' : 'Added ') + saved.name + '.');
    } catch (err) {
      const el = $('form-error');
      el.textContent = err.message;
      el.hidden = false;
    }
  });

  $('cancel-btn').addEventListener('click', () => dialog.close());
  $('add-btn').addEventListener('click', () => openForm(null));
  $('search').addEventListener('input', render);
  $('category-filter').addEventListener('change', render);
  $('low-filter').addEventListener('change', render);
  $('search').addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && $('search').value) {
      $('search').value = '';
      render();
    }
  });
  document.addEventListener('keydown', (e) => {
    const tag = document.activeElement && document.activeElement.tagName;
    if (e.key === '/' && !dialog.open && !cartDialog.open && !ordersDialog.open && !['INPUT', 'SELECT', 'TEXTAREA'].includes(tag)) {
      e.preventDefault();
      $('search').focus();
      $('search').select();
    }
  });

  // Keep this tab in sync when another tab changes the data.
  window.addEventListener('storage', () => {
    render();
    renderCart();
  });

  render();
  renderCart();
});
