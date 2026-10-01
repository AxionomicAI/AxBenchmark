/* ── State ── */
let items = [];
let cart = [];
let editingId = null;
let sortField = 'name';
let sortAsc = true;

/* ── DOM refs ── */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const form        = $('#item-form');
const itemId      = $('#item-id');
const itemName    = $('#item-name');
const itemQty     = $('#item-quantity');
const itemPrice   = $('#item-price');
const itemCat     = $('#item-category');
const itemDesc    = $('#item-description');
const submitBtn   = $('#form-submit-btn');
const cancelBtn   = $('#form-cancel-btn');
const formTitle   = $('#form-title');
const tbody       = $('#inventory-body');
const emptyState  = $('#empty-state');
const itemCount   = $('#item-count');
const searchInput = $('#search-input');
const filterCat   = $('#filter-category');
const exportBtn   = $('#export-btn');
const clearSearch = $('#clear-search-btn');
const thead       = $('#inventory-table thead');
const detailSec   = $('#detail-section');
const detailCont  = $('#detail-content');
const detailClose = $('#detail-close-btn');

/* ── Cart DOM refs ── */
const cartBody     = $('#cart-body');
const cartCount    = $('#cart-count');
const cartTotalVal = $('#cart-total-value');
const cartEmpty    = $('#cart-empty-state');
const clearCartBtn = $('#clear-cart-btn');
const checkoutBtn  = $('#checkout-btn');

/* ── Order DOM refs ── */
const orderList      = $('#order-list');
const orderCount     = $('#order-count');
const orderEmpty     = $('#order-empty-state');

/* ── Helpers ── */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function formatCurrency(n) {
  return '$' + Number(n).toFixed(2);
}

/* ── Toast ── */
function showToast(message, type = 'info') {
  const container = $('#toast-container') || (() => {
    const el = document.createElement('div');
    el.id = 'toast-container';
    document.body.appendChild(el);
    return el;
  })();

  const el = document.createElement('div');
  el.className = 'toast toast-' + type;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => { el.remove(); }, 3000);
}

/* ── localStorage ── */
function save() {
  localStorage.setItem('inventory_items', JSON.stringify(items));
}

function load() {
  try {
    const raw = localStorage.getItem('inventory_items');
    if (raw) {
      items = JSON.parse(raw);
    } else {
      seedSampleData();
    }
  } catch {
    seedSampleData();
  }
}

function seedSampleData() {
  items = [
    { id: generateId(), name: 'Office Desk Chair', quantity: 12, price: 189.99, category: 'Furniture', description: 'Ergonomic mesh back chair with adjustable armrests', createdAt: Date.now() - 86400000 * 7, updatedAt: Date.now() - 86400000 * 7 },
    { id: generateId(), name: 'Wireless Bluetooth Mouse', quantity: 45, price: 29.99, category: 'Electronics', description: 'Rechargeable, silent click, compatible with all OS', createdAt: Date.now() - 86400000 * 6, updatedAt: Date.now() - 86400000 * 6 },
    { id: generateId(), name: 'A4 Premium Copy Paper', quantity: 200, price: 8.49, category: 'Office Supplies', description: '500-sheet ream, 80gsm, sustainable sourced', createdAt: Date.now() - 86400000 * 5, updatedAt: Date.now() - 86400000 * 5 },
    { id: generateId(), name: 'Stainless Steel Water Bottle', quantity: 30, price: 24.95, category: 'Other', description: '750ml double-wall insulated, keeps drinks cold 24h', createdAt: Date.now() - 86400000 * 4, updatedAt: Date.now() - 86400000 * 4 },
    { id: generateId(), name: 'USB-C Hub 7-in-1', quantity: 18, price: 34.50, category: 'Electronics', description: 'HDMI 4K, SD/TF card reader, 3x USB 3.0, PD 100W', createdAt: Date.now() - 86400000 * 3, updatedAt: Date.now() - 86400000 * 3 },
    { id: generateId(), name: 'Standing Desk Converter', quantity: 8, price: 279.00, category: 'Furniture', description: 'Height-adjustable, fits monitors up to 32 inches', createdAt: Date.now() - 86400000 * 2, updatedAt: Date.now() - 86400000 * 2 },
    { id: generateId(), name: 'Premium Ballpoint Pen Set', quantity: 60, price: 12.99, category: 'Office Supplies', description: '12-pack, 1.0mm medium tip, black ink, retractable', createdAt: Date.now() - 86400000, updatedAt: Date.now() - 86400000 },
    { id: generateId(), name: 'Cotton Crew Neck T-Shirt', quantity: 25, price: 19.99, category: 'Clothing', description: 'Ring-spun cotton, preshrunk, available in 6 colors', createdAt: Date.now(), updatedAt: Date.now() },
  ];
  save();
}

/* ── Cart localStorage ── */
function saveCart() {
  localStorage.setItem('cart_items', JSON.stringify(cart));
}

function loadCart() {
  try {
    const raw = localStorage.getItem('cart_items');
    if (raw) {
      cart = JSON.parse(raw);
    }
  } catch {
    cart = [];
  }
}

/* ── Order History ── */
let orders = [];

function saveOrders() {
  localStorage.setItem('order_history', JSON.stringify(orders));
}

function loadOrders() {
  try {
    const raw = localStorage.getItem('order_history');
    if (raw) {
      orders = JSON.parse(raw);
    }
  } catch {
    orders = [];
  }
}

/* ── Cart CRUD ── */
function addToCart(productId) {
  const item = items.find((i) => i.id === productId);
  if (!item) return;

  const existing = cart.find((c) => c.productId === productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      productId: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      addedAt: Date.now(),
    });
  }
  saveCart();
  renderCart();
  showToast('Added to cart.', 'success');
}

function updateCartQty(productId, delta) {
  const entry = cart.find((c) => c.productId === productId);
  if (!entry) return;
  entry.quantity += delta;
  if (entry.quantity <= 0) {
    cart = cart.filter((c) => c.productId !== productId);
  }
  saveCart();
  renderCart();
}

function setCartQty(productId, qty) {
  const entry = cart.find((c) => c.productId === productId);
  if (!entry) return;
  qty = Math.max(1, Math.floor(qty));
  entry.quantity = qty;
  saveCart();
  renderCart();
}

function removeFromCart(productId) {
  cart = cart.filter((c) => c.productId !== productId);
  saveCart();
  renderCart();
  showToast('Removed from cart.', 'info');
}

function clearCart() {
  if (cart.length === 0) return;
  if (!confirm('Clear the entire cart?')) return;
  cart = [];
  saveCart();
  renderCart();
  showToast('Cart cleared.', 'info');
}

/* ── Checkout ── */
function checkout() {
  if (cart.length === 0) {
    showToast('Cart is empty. Add items before checking out.', 'error');
    return;
  }

  // Validate stock for every cart item
  for (const entry of cart) {
    const inv = items.find((i) => i.id === entry.productId);
    if (!inv) {
      showToast(`"${entry.name}" no longer exists in inventory. Remove it to continue.`, 'error');
      return;
    }
    if (entry.quantity > inv.quantity) {
      showToast(`Insufficient stock for "${entry.name}". Available: ${inv.quantity}, requested: ${entry.quantity}.`, 'error');
      return;
    }
  }

  // Deduct stock and create order
  const orderItems = [];
  for (const entry of cart) {
    const inv = items.find((i) => i.id === entry.productId);
    inv.quantity -= entry.quantity;
    inv.updatedAt = Date.now();
    orderItems.push({
      productId: entry.productId,
      name: entry.name,
      price: entry.price,
      quantity: entry.quantity,
      subtotal: entry.price * entry.quantity,
    });
  }

  const total = orderItems.reduce((sum, oi) => sum + oi.subtotal, 0);
  const itemCount = orderItems.reduce((sum, oi) => sum + oi.quantity, 0);

  orders.push({
    id: generateId(),
    items: orderItems,
    total: total,
    itemCount: itemCount,
    createdAt: Date.now(),
  });

  save();
  saveOrders();
  cart = [];
  saveCart();
  render();
  renderCart();
  renderOrders();
  showToast('Purchase completed! Stock updated.', 'success');
}

/* ── Render Cart ── */
function renderCart() {
  const hasItems = cart.length > 0;
  cartEmpty.hidden = hasItems;

  const totalCount = cart.reduce((sum, c) => sum + c.quantity, 0);
  cartCount.textContent = totalCount + ' item' + (totalCount !== 1 ? 's' : '');

  if (!hasItems) {
    cartBody.innerHTML = '';
    cartTotalVal.textContent = '$0.00';
    return;
  }

  const totalPrice = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  cartTotalVal.textContent = formatCurrency(totalPrice);

  cartBody.innerHTML = cart.map((entry) => {
    const sub = entry.price * entry.quantity;
    return `<tr>
      <td><strong>${escHtml(entry.name)}</strong></td>
      <td>${formatCurrency(entry.price)}</td>
      <td>
        <button class="btn-icon cart-qty-btn" data-cart-dec="${entry.productId}" title="Decrease quantity" aria-label="Decrease quantity of ${escHtml(entry.name)}">−</button>
        <input type="number" class="cart-qty-input" value="${entry.quantity}" min="1" data-cart-set="${entry.productId}" aria-label="Quantity of ${escHtml(entry.name)}">
        <button class="btn-icon cart-qty-btn" data-cart-inc="${entry.productId}" title="Increase quantity" aria-label="Increase quantity of ${escHtml(entry.name)}">+</button>
      </td>
      <td>${formatCurrency(sub)}</td>
      <td>
        <button class="btn-icon danger" data-cart-remove="${entry.productId}" title="Remove from cart" aria-label="Remove ${escHtml(entry.name)} from cart">✕</button>
      </td>
    </tr>`;
  }).join('');
}

/* ── Render Orders ── */
function renderOrders() {
  const hasOrders = orders.length > 0;
  orderEmpty.hidden = hasOrders;

  orderCount.textContent = orders.length + ' order' + (orders.length !== 1 ? 's' : '');

  if (!hasOrders) {
    orderList.innerHTML = '';
    return;
  }

  // Show most recent orders first
  const sorted = [...orders].sort((a, b) => b.createdAt - a.createdAt);

  orderList.innerHTML = sorted.map((order) => {
    const dateStr = new Date(order.createdAt).toLocaleString();
    const itemsHtml = order.items.map((oi) => `
      <tr>
        <td><strong>${escHtml(oi.name)}</strong></td>
        <td>${formatCurrency(oi.price)}</td>
        <td>${oi.quantity}</td>
        <td>${formatCurrency(oi.subtotal)}</td>
      </tr>
    `).join('');

    return `
      <div class="order-card" data-order-id="${order.id}">
        <div class="order-summary" data-order-toggle="${order.id}">
          <span class="order-date">${dateStr}</span>
          <span class="order-meta">${order.itemCount} item${order.itemCount !== 1 ? 's' : ''}</span>
          <span class="order-total">${formatCurrency(order.total)}</span>
          <span class="order-expand-icon">▶</span>
        </div>
        <div class="order-details" hidden>
          <table class="order-items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
        </div>
      </div>`;
  }).join('');
}

/* ── CRUD ── */
function addItem(data) {
  items.push({
    id: generateId(),
    name: data.name.trim(),
    quantity: Number(data.quantity),
    price: Number(data.price),
    category: data.category || 'Other',
    description: data.description ? data.description.trim() : '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  save();
  render();
  showToast('Item added.', 'success');
}

function updateItem(id, data) {
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return;
  items[idx] = {
    ...items[idx],
    name: data.name.trim(),
    quantity: Number(data.quantity),
    price: Number(data.price),
    category: data.category || 'Other',
    description: data.description ? data.description.trim() : '',
    updatedAt: Date.now(),
  };
  save();
  render();
  showToast('Item updated.', 'success');
}

function deleteItem(id) {
  if (!confirm('Delete this item permanently?')) return;
  items = items.filter((i) => i.id !== id);
  save();
  if (editingId === id) cancelEdit();
  render();
  showToast('Item deleted.', 'info');
}

/* ── Form ── */
function resetForm() {
  form.reset();
  itemId.value = '';
  editingId = null;
  submitBtn.textContent = 'Add Item';
  formTitle.textContent = 'Add New Item';
  cancelBtn.hidden = true;
}

function startEdit(id) {
  const item = items.find((i) => i.id === id);
  if (!item) return;
  editingId = id;
  itemId.value = id;
  itemName.value = item.name;
  itemQty.value = item.quantity;
  itemPrice.value = item.price;
  itemCat.value = item.category;
  itemDesc.value = item.description || '';
  submitBtn.textContent = 'Save Changes';
  formTitle.textContent = 'Edit Item';
  cancelBtn.hidden = false;
  form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  itemName.focus();
}

function cancelEdit() {
  resetForm();
}

function handleSubmit(e) {
  e.preventDefault();

  const name = itemName.value.trim();
  if (!name) { showToast('Name is required.', 'error'); itemName.focus(); return; }

  const quantity = parseInt(itemQty.value, 10);
  if (isNaN(quantity) || quantity < 0) { showToast('Enter a valid quantity (≥ 0).', 'error'); itemQty.focus(); return; }

  const price = parseFloat(itemPrice.value);
  if (isNaN(price) || price < 0) { showToast('Enter a valid price (≥ 0).', 'error'); itemPrice.focus(); return; }

  const data = { name, quantity, price, category: itemCat.value, description: itemDesc.value };

  if (editingId) {
    updateItem(editingId, data);
  } else {
    addItem(data);
  }
  resetForm();
}

/* ── Render Table ── */
function render() {
  const query = searchInput.value.toLowerCase().trim();
  const catFilter = filterCat.value;

  let filtered = items.filter((item) => {
    if (catFilter && item.category !== catFilter) return false;
    if (query) {
      const inName = item.name.toLowerCase().includes(query);
      const inDesc = (item.description || '').toLowerCase().includes(query);
      const inCat  = item.category.toLowerCase().includes(query);
      if (!inName && !inDesc && !inCat) return false;
    }
    return true;
  });

  // Sort
  filtered.sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    if (aVal < bVal) return sortAsc ? -1 : 1;
    if (aVal > bVal) return sortAsc ? 1 : -1;
    return 0;
  });

  // Update sort indicators
  $$('thead th[data-sort]').forEach((th) => {
    const field = th.dataset.sort;
    th.classList.remove('sorted-asc', 'sorted-desc');
    if (field === sortField) {
      th.classList.add(sortAsc ? 'sorted-asc' : 'sorted-desc');
    }
  });

  // Render rows
  if (filtered.length === 0) {
    tbody.innerHTML = '';
    emptyState.hidden = false;
    itemCount.textContent = items.length === 0 ? '0 items' : 'No matching items';
    return;
  }

  emptyState.hidden = true;
  itemCount.textContent = filtered.length + ' item' + (filtered.length !== 1 ? 's' : '');

  const rawQuery = searchInput.value.trim();
  const searchTerm = rawQuery.toLowerCase();

  tbody.innerHTML = filtered.map((item) => {
    const value = item.quantity * item.price;
    return `<tr class="clickable-row" data-view="${item.id}">
      <td><strong>${highlightText(item.name, searchTerm)}</strong></td>
      <td>${highlightText(item.category, searchTerm)}</td>
      <td>${item.quantity}</td>
      <td>${formatCurrency(item.price)}</td>
      <td>${formatCurrency(value)}</td>
      <td>
        <button class="btn-icon" data-edit="${item.id}" title="Edit" aria-label="Edit ${escHtml(item.name)}">✎</button>
        <button class="btn-icon danger" data-delete="${item.id}" title="Delete" aria-label="Delete ${escHtml(item.name)}">✕</button>
        <button class="btn-icon" data-view="${item.id}" title="View details" aria-label="View details for ${escHtml(item.name)}">ℹ</button>
        <button class="btn-icon" data-add-cart="${item.id}" title="Add to cart" aria-label="Add ${escHtml(item.name)} to cart">🛒</button>
      </td>
    </tr>`;
  }).join('');
}

function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function highlightText(text, query) {
  if (!query) return escHtml(text);
  const escaped = escHtml(text);
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp('(' + escapedQuery + ')', 'gi');
  return escaped.replace(re, '<mark class="search-hit">$1</mark>');
}

/* ── Sort ── */
function handleSort(e) {
  const th = e.target.closest('th[data-sort]');
  if (!th) return;
  const field = th.dataset.sort;
  if (field === sortField) {
    sortAsc = !sortAsc;
  } else {
    sortField = field;
    sortAsc = true;
  }
  render();
}

/* ── Export ── */
function exportData() {
  if (items.length === 0) {
    showToast('Nothing to export.', 'info');
    return;
  }
  const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'inventory-export.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Exported as JSON.', 'success');
}

/* ── Detail View ── */
function showDetail(id) {
  const item = items.find((i) => i.id === id);
  if (!item) return;

  const value = item.quantity * item.price;
  const created = new Date(item.createdAt).toLocaleString();
  const updated = new Date(item.updatedAt).toLocaleString();

  detailCont.innerHTML = `
    <div class="detail-grid">
      <div class="detail-field">
        <span class="detail-label">Name</span>
        <span class="detail-value">${escHtml(item.name)}</span>
      </div>
      <div class="detail-field">
        <span class="detail-label">Category</span>
        <span class="detail-value">${escHtml(item.category)}</span>
      </div>
      <div class="detail-field">
        <span class="detail-label">Quantity</span>
        <span class="detail-value">${item.quantity}</span>
      </div>
      <div class="detail-field">
        <span class="detail-label">Unit Price</span>
        <span class="detail-value">${formatCurrency(item.price)}</span>
      </div>
      <div class="detail-field">
        <span class="detail-label">Total Value</span>
        <span class="detail-value detail-value-highlight">${formatCurrency(value)}</span>
      </div>
      <div class="detail-field">
        <span class="detail-label">Created</span>
        <span class="detail-value">${created}</span>
      </div>
      <div class="detail-field">
        <span class="detail-label">Last Updated</span>
        <span class="detail-value">${updated}</span>
      </div>
    </div>
    ${item.description ? `
    <div class="detail-description">
      <span class="detail-label">Description</span>
      <p>${escHtml(item.description)}</p>
    </div>` : ''}
    <div class="detail-actions">
      <button class="btn btn-primary" data-quick-edit="${item.id}">Edit This Item</button>
      <button class="btn btn-danger" data-quick-delete="${item.id}">Delete This Item</button>
    </div>
  `;
  detailSec.hidden = false;
  detailSec.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function closeDetail() {
  detailSec.hidden = true;
}

/* ── Event Delegation ── */
tbody.addEventListener('click', (e) => {
  const editBtn = e.target.closest('[data-edit]');
  if (editBtn) { closeDetail(); startEdit(editBtn.dataset.edit); return; }

  const delBtn = e.target.closest('[data-delete]');
  if (delBtn) { closeDetail(); deleteItem(delBtn.dataset.delete); return; }

  const viewBtn = e.target.closest('[data-view]');
  if (viewBtn) { showDetail(viewBtn.dataset.view); return; }

  // Click on row itself (but not on buttons) opens detail
  const row = e.target.closest('tr.clickable-row');
  if (row && !e.target.closest('button')) {
    showDetail(row.dataset.view);
  }
});

// Detail panel delegation (content is dynamic)
detailSec.addEventListener('click', (e) => {
  const editBtn = e.target.closest('[data-quick-edit]');
  if (editBtn) { closeDetail(); startEdit(editBtn.dataset.quickEdit); return; }

  const delBtn = e.target.closest('[data-quick-delete]');
  if (delBtn) { closeDetail(); deleteItem(delBtn.dataset.quickDelete); return; }
});

detailClose.addEventListener('click', closeDetail);

/* ── Cart Event Delegation ── */
// Inventory table: add to cart button
tbody.addEventListener('click', (e) => {
  const addBtn = e.target.closest('[data-add-cart]');
  if (addBtn) { addToCart(addBtn.dataset.addCart); return; }
});

// Cart table: decrement / increment / remove
cartBody.addEventListener('click', (e) => {
  const decBtn = e.target.closest('[data-cart-dec]');
  if (decBtn) { updateCartQty(decBtn.dataset.cartDec, -1); return; }

  const incBtn = e.target.closest('[data-cart-inc]');
  if (incBtn) { updateCartQty(incBtn.dataset.cartInc, 1); return; }

  const rmBtn = e.target.closest('[data-cart-remove]');
  if (rmBtn) { removeFromCart(rmBtn.dataset.cartRemove); return; }
});

// Cart table: quantity input change
cartBody.addEventListener('change', (e) => {
  const input = e.target.closest('[data-cart-set]');
  if (!input) return;
  const qty = parseInt(input.value, 10);
  if (isNaN(qty) || qty < 1) {
    input.value = 1;
    setCartQty(input.dataset.cartSet, 1);
  } else {
    setCartQty(input.dataset.cartSet, qty);
  }
});

// Clear cart
clearCartBtn.addEventListener('click', clearCart);

// Checkout
checkoutBtn.addEventListener('click', checkout);

// Order toggle (expand/collapse)
orderList.addEventListener('click', (e) => {
  const toggle = e.target.closest('[data-order-toggle]');
  if (!toggle) return;
  const card = toggle.closest('.order-card');
  if (!card) return;
  const details = card.querySelector('.order-details');
  const icon = card.querySelector('.order-expand-icon');
  if (!details) return;
  const isOpen = !details.hidden;
  details.hidden = isOpen;
  if (icon) icon.textContent = isOpen ? '▶' : '▼';
});

/* ── Clear Search ── */
function doClearSearch() {
  searchInput.value = '';
  filterCat.value = '';
  clearSearch.hidden = true;
  render();
}

searchInput.addEventListener('input', () => {
  clearSearch.hidden = searchInput.value === '' && filterCat.value === '';
  render();
});

filterCat.addEventListener('change', () => {
  clearSearch.hidden = searchInput.value === '' && filterCat.value === '';
  render();
});

clearSearch.addEventListener('click', doClearSearch);

/* ── Keyboard Shortcuts ── */
document.addEventListener('keydown', (e) => {
  // '/' to focus search (but not when typing in input/textarea)
  if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
    const tag = e.target.tagName;
    if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
      e.preventDefault();
      searchInput.focus();
    }
  }

  // Escape to close detail panel
  if (e.key === 'Escape') {
    closeDetail();
  }
});

/* ── Init ── */
load();
loadCart();
loadOrders();
render();
renderCart();
renderOrders();

// Event listeners
form.addEventListener('submit', handleSubmit);
cancelBtn.addEventListener('click', cancelEdit);
thead.addEventListener('click', handleSort);
exportBtn.addEventListener('click', exportData);
