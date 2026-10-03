/*
 * UI smoke test for the inventory website (view / add / edit / delete).
 *
 * Loads the real index.html into jsdom, runs the real scripts, and
 * simulates user interaction. Requires the dev-only dependency jsdom:
 *
 *     npm install jsdom@24
 *     node tests/ui.test.js
 *
 * The website itself does NOT need jsdom — it runs in any browser.
 */
'use strict';

const fs = require('fs');
const path = require('path');

let JSDOM;
try {
  ({ JSDOM } = require('jsdom'));
} catch (err) {
  console.log('jsdom is not installed — skipping UI test.');
  console.log('(Run `npm install jsdom@24` to enable it. The site itself does not need it.)');
  process.exit(0);
}

const ROOT = path.join(__dirname, '..');
const HTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const KEY = 'inventory.data.v1';
const SCRIPTS = ['js/storage.js', 'js/data.js', 'js/cart.js', 'js/orders.js', 'js/app.js'];

let passed = 0;
let failed = 0;

function assert(cond, label) {
  if (cond) {
    passed += 1;
    console.log('  ok  ' + label);
  } else {
    failed += 1;
    console.log('FAIL  ' + label);
  }
}

function assertEq(actual, expected, label) {
  const ok = actual === expected;
  assert(ok, label + (ok ? '' : ' — got ' + JSON.stringify(actual) + ', want ' + JSON.stringify(expected)));
}

/** Build a fresh "page": real HTML + real scripts, optional pre-seeded storage. */
function makePage(seedJson, cartJson, ordersJson) {
  const dom = new JSDOM(HTML, { runScripts: 'outside-only', url: 'https://inventory.local/' });
  const window = dom.window;
  if (seedJson !== undefined) {
    window.localStorage.setItem(KEY, seedJson);
  }
  if (cartJson !== undefined) {
    window.localStorage.setItem('inventory.cart.v1', cartJson);
  }
  if (ordersJson !== undefined) {
    window.localStorage.setItem('inventory.orders.v1', ordersJson);
  }
  for (const file of SCRIPTS) {
    window.eval(fs.readFileSync(path.join(ROOT, file), 'utf8'));
  }
  // Scripts were evaluated after parsing, so fire DOMContentLoaded manually.
  window.document.dispatchEvent(new window.Event('DOMContentLoaded', { bubbles: true }));
  return window;
}

function submitForm(window) {
  window.document.getElementById('product-form').dispatchEvent(
    new window.Event('submit', { bubbles: true, cancelable: true }));
}

function storedProducts(window) {
  return JSON.parse(window.localStorage.getItem(KEY));
}

function rowCount(window) {
  return window.document.querySelectorAll('#product-tbody tr').length;
}

function rowFor(window, id) {
  return window.document.querySelector('#product-tbody tr[data-id="' + id + '"]');
}

// ================================================================
console.log('[1] Initial view');
const savedJson = makePage().localStorage.getItem(KEY); // raw persisted JSON
let w = makePage(savedJson); // fresh page with the seeded storage
let doc = w.document;
assertEq(rowCount(w), 10, 'renders 10 product rows');
assert(!doc.getElementById('table-wrap').hidden, 'table is visible');
assert(doc.getElementById('empty-state').hidden, 'empty state is hidden');
let summary = doc.getElementById('inventory-summary').textContent;
assert(summary.indexOf('10 products') !== -1, 'summary shows product count');
assert(summary.indexOf('554 units') !== -1, 'summary shows total units');
assert(summary.indexOf('3,653.68') !== -1, 'summary shows stock value');
assert(summary.indexOf('1 out of stock') !== -1, 'summary flags out-of-stock items');
assertEq(storedProducts(w).length, 10, 'sample data persisted to localStorage');
assert(doc.querySelectorAll('#category-list option').length >= 4, 'category datalist filled');

// Status badges
const cable = storedProducts(w).find((p) => p.sku === 'ELEC-0003'); // 8 / reorder 20
const sticky = storedProducts(w).find((p) => p.sku === 'OFFI-0003'); // 0 stock
let badge = rowFor(w, cable.id).querySelector('.badge');
assert(badge.textContent === 'Low stock' && badge.classList.contains('status--low'), 'low-stock badge');
badge = rowFor(w, sticky.id).querySelector('.badge');
assert(badge.textContent === 'Out of stock' && badge.classList.contains('status--out'), 'out-of-stock badge');
assert(rowFor(w, sticky.id).querySelector('button[data-action="dec"]').disabled, 'minus disabled at zero stock');

// ================================================================
console.log('[2] Add product');
doc.getElementById('add-product-btn').click();
assert(!doc.getElementById('product-modal').hidden, 'add modal opens');
assertEq(doc.getElementById('product-modal-title').textContent, 'Add product', 'modal title is "Add product"');
assertEq(doc.getElementById('f-quantity').value, '0', 'quantity defaults to 0');
doc.getElementById('f-name').value = 'Test Gadget';
doc.getElementById('f-sku').value = 'test-1';
doc.getElementById('f-category').value = 'Gadgets';
doc.getElementById('f-quantity').value = '5';
doc.getElementById('f-unitPrice').value = '9.99';
doc.getElementById('f-reorderLevel').value = '6'; // qty 5 <= 6 -> low stock
doc.getElementById('f-location').value = 'Bin Z';
submitForm(w);
assert(doc.getElementById('product-modal').hidden, 'modal closes after save');
assertEq(rowCount(w), 11, 'new row rendered');
const added = storedProducts(w).find((p) => p.sku === 'TEST-1');
assert(!!added, 'product persisted with normalized SKU');
assertEq(added.quantity, 5, 'persisted quantity');
assertEq(added.unitPrice, 9.99, 'persisted unit price');
let row = rowFor(w, added.id);
assert(row.textContent.indexOf('Test Gadget') !== -1, 'row shows name');
assert(row.textContent.indexOf('TEST-1') !== -1, 'row shows SKU');
assert(row.textContent.indexOf('Bin Z') !== -1, 'row shows location');
assert(row.textContent.indexOf('9.99') !== -1, 'row shows unit price');
assert(row.querySelector('.badge').textContent === 'Low stock', 'qty 5 / reorder 6 shows low-stock badge');
assertEq(row.querySelector('.qty').textContent, '5', 'row shows quantity');

// ================================================================
console.log('[3] Form validation');
doc.getElementById('add-product-btn').click();
submitForm(w); // empty form
let errors = doc.getElementById('form-errors');
assert(!errors.hidden, 'error box shown for empty form');
assert(errors.textContent.indexOf('Name is required') !== -1, 'name error listed');
assert(errors.textContent.indexOf('SKU is required') !== -1, 'sku error listed');
assert(errors.textContent.indexOf('Category is required') !== -1, 'category error listed');
assert(!doc.getElementById('product-modal').hidden, 'modal stays open with errors');
doc.getElementById('f-name').value = 'Dup';
doc.getElementById('f-sku').value = 'test-1'; // duplicate of TEST-1
doc.getElementById('f-category').value = 'X';
doc.getElementById('f-quantity').value = '1';
submitForm(w);
assert(doc.getElementById('form-errors').textContent.indexOf('unique') !== -1, 'duplicate SKU rejected in form');
doc.getElementById('f-sku').value = 'test-2';
doc.getElementById('f-quantity').value = 'abc';
submitForm(w);
assert(doc.getElementById('form-errors').textContent.indexOf('whole number') !== -1, 'bad quantity rejected in form');
doc.querySelector('#product-modal [data-close]').click();
assert(doc.getElementById('product-modal').hidden, 'cancel closes the modal');
assertEq(rowCount(w), 11, 'no product added by failed submissions');
assertEq(storedProducts(w).length, 11, 'storage unchanged by failed submissions');

// ================================================================
console.log('[4] Edit product');
row = rowFor(w, added.id);
row.querySelector('button[data-action="edit"]').click();
assert(!doc.getElementById('product-modal').hidden, 'edit modal opens');
assertEq(doc.getElementById('product-modal-title').textContent, 'Edit product', 'modal title is "Edit product"');
assertEq(doc.getElementById('f-name').value, 'Test Gadget', 'name prefilled');
assertEq(doc.getElementById('f-sku').value, 'TEST-1', 'sku prefilled');
assertEq(doc.getElementById('f-quantity').value, '5', 'quantity prefilled');
assertEq(doc.getElementById('f-unitPrice').value, '9.99', 'price prefilled');
doc.getElementById('f-name').value = 'Test Gadget Pro';
doc.getElementById('f-quantity').value = '8';
submitForm(w);
const updated = storedProducts(w).find((p) => p.id === added.id);
assertEq(updated.name, 'Test Gadget Pro', 'name updated in storage');
assertEq(updated.quantity, 8, 'quantity updated in storage');
assertEq(updated.sku, 'TEST-1', 'sku untouched by partial edit');
row = rowFor(w, added.id);
assert(row.textContent.indexOf('Test Gadget Pro') !== -1, 'row shows updated name');
assertEq(row.querySelector('.qty').textContent, '8', 'row shows updated quantity');

// ================================================================
console.log('[5] Quick stock adjust (+/-)');
row.querySelector('button[data-action="inc"]').click();
assertEq(storedProducts(w).find((p) => p.id === added.id).quantity, 9, '+1 persisted');
assertEq(rowFor(w, added.id).querySelector('.qty').textContent, '9', '+1 rendered');
rowFor(w, added.id).querySelector('button[data-action="dec"]').click();
assertEq(storedProducts(w).find((p) => p.id === added.id).quantity, 8, '-1 persisted');

// ================================================================
console.log('[6] Delete product');
row = rowFor(w, added.id);
row.querySelector('button[data-action="delete"]').click();
let confirmModal = doc.getElementById('confirm-modal');
assert(!confirmModal.hidden, 'confirm modal opens');
assert(doc.getElementById('confirm-text').textContent.indexOf('Test Gadget Pro') !== -1, 'confirm names the product');
confirmModal.querySelector('[data-close]').click(); // cancel
assert(confirmModal.hidden, 'cancel aborts deletion');
assertEq(rowCount(w), 11, 'product still there after cancel');
rowFor(w, added.id).querySelector('button[data-action="delete"]').click();
doc.getElementById('confirm-delete-btn').click();
assert(doc.getElementById('confirm-modal').hidden, 'confirm modal closes after delete');
assertEq(rowCount(w), 10, 'row removed from table');
assert(!storedProducts(w).some((p) => p.id === added.id), 'product removed from storage');

// ================================================================
console.log('[7] Escape closes the topmost modal');
doc.getElementById('add-product-btn').click();
assert(!doc.getElementById('product-modal').hidden, 'modal open');
doc.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
assert(doc.getElementById('product-modal').hidden, 'Escape closes add/edit modal');
rowFor(w, cable.id).querySelector('button[data-action="delete"]').click();
doc.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
assert(doc.getElementById('confirm-modal').hidden, 'Escape closes confirm modal');
assertEq(rowCount(w), 10, 'escape-cancelled delete removed nothing');

// ================================================================
console.log('[8] Product data is rendered as text (no HTML injection)');
const xss = w.Inventory.addProduct({
  name: '<img src=x onerror=alert(1)>', sku: 'XSS-1', category: ' & <b>', quantity: 1
});
assert(xss.ok, 'product with markup-looking name accepted');
row = rowFor(w, xss.product.id);
assert(row.querySelector('img') === null, 'name rendered as text, not HTML');
assert(row.textContent.indexOf('<img src=x onerror=alert(1)>') !== -1, 'name text preserved verbatim');
w.Inventory.deleteProduct(xss.product.id);

// ================================================================
console.log('[9] Empty state after deleting everything');
w.Inventory.getAll().forEach((p) => w.Inventory.deleteProduct(p.id));
assertEq(rowCount(w), 0, 'table emptied');
assert(!doc.getElementById('empty-state').hidden, 'empty state visible');
assert(doc.getElementById('table-wrap').hidden, 'table hidden when empty');
assertEq(doc.getElementById('inventory-summary').textContent, 'No products in inventory yet.', 'empty summary');

// ================================================================
console.log('[10] State survives a page reload');
w = makePage(w.localStorage.getItem(KEY)); // reload with the emptied storage
doc = w.document;
assertEq(rowCount(w), 0, 'emptied inventory persists across reload (no reseed)');
w = makePage(savedJson); // reload with the original 10-product snapshot
doc = w.document;
assertEq(rowCount(w), 10, 'seeded inventory restored on reload');
assert(rowFor(w, cable.id) !== null, 'same product ids after reload');

// ================================================================
console.log('[11] Lookup: search, category filter, highlighting');

function setSearch(value) {
  doc.getElementById('search-input').value = value;
  doc.getElementById('search-input').dispatchEvent(new w.Event('input', { bubbles: true }));
}

function setCategory(value) {
  doc.getElementById('category-filter').value = value;
  doc.getElementById('category-filter').dispatchEvent(new w.Event('change', { bubbles: true }));
}

setSearch('usb');
assertEq(rowCount(w), 1, 'search "usb" matches 1 product');
row = rowFor(w, cable.id);
assert(row !== null, 'search finds the USB-C cable');
let mark = row.querySelector('.product-name mark');
assert(mark !== null && mark.textContent.toLowerCase() === 'usb', 'name match highlighted with <mark>');
assert(doc.getElementById('inventory-summary').textContent.indexOf('showing 1 of 10') !== -1,
  'summary shows "showing 1 of 10"');

setSearch('MOUSE');
assertEq(rowCount(w), 1, 'search is case-insensitive');

setSearch('elec-0002');
assertEq(rowCount(w), 1, 'search matches SKU');
assert(doc.querySelector('#product-tbody tr').textContent.indexOf('Mechanical Keyboard') !== -1,
  'SKU search finds the right product');

setSearch('shelf b');
assertEq(rowCount(w), 3, 'search matches location');

setSearch('zzz-nothing');
assertEq(rowCount(w), 0, 'no rows for an unmatched query');
assert(!doc.getElementById('no-results').hidden, 'no-results notice visible');
assert(doc.getElementById('table-wrap').hidden, 'table hidden when nothing matches');
assert(doc.getElementById('inventory-summary').textContent.indexOf('showing 0 of 10') !== -1,
  'summary shows "showing 0 of 10"');

doc.getElementById('clear-filters-btn').click();
assertEq(rowCount(w), 10, 'clear-filters restores all rows');
assert(doc.getElementById('no-results').hidden, 'no-results hidden after clearing');

setCategory('Kitchen');
assertEq(rowCount(w), 2, 'category filter narrows the list');
setSearch('mug');
assertEq(rowCount(w), 1, 'search and category combine');
setCategory('Electronics');
assertEq(rowCount(w), 0, 'combined search + category can exclude everything');
assert(!doc.getElementById('no-results').hidden, 'no-results shown for combined filters');
doc.getElementById('clear-filters-btn').click();
assertEq(rowCount(w), 10, 'clear-filters resets category and search');

// The active filter survives data-driven re-renders
setCategory('Kitchen');
w.Inventory.addProduct({ name: 'Espresso Cups', sku: 'KITC-0003', category: 'Kitchen', quantity: 4, reorderLevel: 6 });
assertEq(rowCount(w), 3, 'filter still active after a data change re-render');
w.Inventory.deleteProduct(w.Inventory.getAll().find((p) => p.sku === 'KITC-0003').id);
setCategory('');
assertEq(rowCount(w), 10, 'filter cleared manually');

// A category that disappears resets the dropdown instead of hiding everything
setCategory('Kitchen');
w.Inventory.getAll().filter((p) => p.category === 'Kitchen').forEach((p) => w.Inventory.deleteProduct(p.id));
assertEq(doc.getElementById('category-filter').value, '', 'category filter resets when category disappears');
assertEq(rowCount(w), 8, 'remaining products are shown');

// "/" focuses the search box for quick lookup
doc.getElementById('search-input').blur();
doc.body.focus();
doc.dispatchEvent(new w.KeyboardEvent('keydown', { key: '/', bubbles: true }));
assertEq(doc.activeElement, doc.getElementById('search-input'), '/ focuses the search box');

// Escape clears an active search
setSearch('mug');
doc.getElementById('search-input').dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
assertEq(doc.getElementById('search-input').value, '', 'Escape clears the search');
assertEq(rowCount(w), 8, 'rows restored after Escape-clear');

// Highlighting stays text-only for markup-looking data
const xss2 = w.Inventory.addProduct({ name: '<b>bold</b> thing', sku: 'XSS-2', category: 'T', quantity: 1 });
setSearch('<b>');
row = rowFor(w, xss2.product.id);
assert(row.querySelector('b') === null, 'highlighting never injects real elements');
assert(row.querySelector('mark').textContent === '<b>', 'matched text is wrapped in <mark> as plain text');
w.Inventory.deleteProduct(xss2.product.id);
setSearch('');

// ================================================================
console.log('[12] Shopping cart');

const CART_KEY = 'inventory.cart.v1';

function cartStored() {
  return JSON.parse(w.localStorage.getItem(CART_KEY) || '[]');
}

function productBySku(sku) {
  return w.Inventory.getAll().find((p) => p.sku === sku);
}

function cartRowFor(id) {
  return doc.querySelector('#cart-tbody tr[data-id="' + id + '"]');
}

function cartAddBtn(id) {
  return rowFor(w, id).querySelector('button[data-action="cart-add"]');
}

const cartMouse = productBySku('ELEC-0001');
const cartKeyboard = productBySku('ELEC-0002');
const cartNotebook = productBySku('OFFI-0001');
const cartMonitor = productBySku('FURN-0002');
const cartSticky = productBySku('OFFI-0003');

assert(!doc.getElementById('cart-empty').hidden, 'cart starts empty with a notice');
assert(doc.getElementById('cart-table-wrap').hidden, 'cart table hidden when empty');
assert(doc.getElementById('clear-cart-btn').hidden, 'clear button hidden when empty');
assert(doc.getElementById('cart-indicator-count').hidden, 'header badge hidden when empty');

cartAddBtn(cartMouse.id).click();
assert(doc.getElementById('cart-empty').hidden, 'cart notice hidden after first add');
assert(!doc.getElementById('cart-table-wrap').hidden, 'cart table visible after first add');
assertEq(doc.querySelectorAll('#cart-tbody tr').length, 1, 'one cart line');
assertEq(doc.getElementById('cart-total-price').textContent, '19.99', 'cart total after 1 unit');
assertEq(doc.getElementById('cart-total-units').textContent, '1', 'cart unit count');
assert(!doc.getElementById('cart-indicator-count').hidden, 'header badge visible');
assertEq(doc.getElementById('cart-indicator-count').textContent, '1', 'header badge count');
assertEq(cartStored().length, 1, 'cart persisted to localStorage');
assertEq(w.InventoryCart.quantityOf(cartMouse.id), 1, 'cart API reflects the add');

cartAddBtn(cartMouse.id).click();
assertEq(cartRowFor(cartMouse.id).querySelector('.qty').textContent, '2', 'cart quantity incremented');
assertEq(doc.getElementById('cart-total-price').textContent, '39.98', 'total after 2 units');
assert(!cartAddBtn(cartMouse.id).disabled, 'add-to-cart stays enabled below stock');

cartRowFor(cartMouse.id).querySelector('button[data-action="cart-inc"]').click();
assertEq(cartRowFor(cartMouse.id).querySelector('.qty').textContent, '3', '+ in cart works');
assertEq(doc.getElementById('cart-total-price').textContent, '59.97', 'total after +');
cartRowFor(cartMouse.id).querySelector('button[data-action="cart-dec"]').click();
cartRowFor(cartMouse.id).querySelector('button[data-action="cart-dec"]').click();
assertEq(cartRowFor(cartMouse.id).querySelector('.qty').textContent, '1', '- in cart works');
assert(cartRowFor(cartMouse.id).querySelector('button[data-action="cart-dec"]').disabled,
  'cart minus disabled at quantity 1');

cartAddBtn(cartKeyboard.id).click();
cartAddBtn(cartNotebook.id).click();
assertEq(doc.querySelectorAll('#cart-tbody tr').length, 3, 'three cart lines');
assertEq(doc.getElementById('cart-total-price').textContent, '102.69',
  'combined total (19.99 + 79.5 + 3.2)');
assertEq(doc.getElementById('cart-total-units').textContent, '3', 'combined units');
assert(!doc.getElementById('cart-count-badge').hidden, 'cart section badge visible');
assertEq(doc.getElementById('cart-count-badge').textContent, '3', 'cart section badge count');

cartRowFor(cartKeyboard.id).querySelector('button[data-action="cart-remove"]').click();
assertEq(doc.querySelectorAll('#cart-tbody tr').length, 2, 'line removed');
assertEq(doc.getElementById('cart-total-price').textContent, '23.19',
  'total after removal (19.99 + 3.2)');

assert(cartAddBtn(cartSticky.id).disabled, 'add-to-cart disabled for out-of-stock product');

cartAddBtn(cartMonitor.id).click();
cartAddBtn(cartMonitor.id).click();
cartAddBtn(cartMonitor.id).click();
assert(cartAddBtn(cartMonitor.id).disabled, 'add-to-cart disabled when all stock is in the cart');
assertEq(doc.getElementById('cart-indicator-count').textContent, '5',
  'badge counts all units (1 + 1 + 3)');
assert(cartRowFor(cartMonitor.id).querySelector('button[data-action="cart-inc"]').disabled,
  'cart + disabled at the stock cap');

w.Inventory.adjustStock(cartMonitor.id, -1);
assertEq(w.InventoryCart.quantityOf(cartMonitor.id), 2, 'cart clamped when stock shrinks');
w.Inventory.deleteProduct(cartMonitor.id);
assertEq(w.InventoryCart.quantityOf(cartMonitor.id), 0, 'deleted product leaves the cart');
assertEq(doc.querySelectorAll('#cart-tbody tr').length, 2, 'cart re-rendered without the line');

const productJson = w.localStorage.getItem(KEY);
const cartJson = w.localStorage.getItem(CART_KEY);
w = makePage(productJson, cartJson);
doc = w.document;
assertEq(doc.querySelectorAll('#cart-tbody tr').length, 2, 'cart restored after reload');
assertEq(doc.getElementById('cart-total-price').textContent, '23.19', 'total restored after reload');
assertEq(doc.getElementById('cart-indicator-count').textContent, '2', 'header badge restored');
assert(!doc.getElementById('cart-table-wrap').hidden, 'cart table visible after reload');

doc.getElementById('clear-cart-btn').click();
assert(!doc.getElementById('confirm-modal').hidden, 'clear-cart opens the confirm modal');
assertEq(doc.getElementById('confirm-title').textContent, 'Clear cart', 'confirm title');
assert(doc.getElementById('confirm-text').textContent.indexOf('2 item') !== -1,
  'confirm mentions the item count');
doc.getElementById('confirm-delete-btn').click();
assert(doc.getElementById('confirm-modal').hidden, 'confirm closes after clearing');
assert(!doc.getElementById('cart-empty').hidden, 'cart empty notice after clearing');
assert(doc.getElementById('cart-table-wrap').hidden, 'cart table hidden after clearing');
assert(doc.getElementById('cart-indicator-count').hidden, 'badge hidden after clearing');
assertEq(cartStored().length, 0, 'cleared cart persisted');

cartAddBtn(cartMouse.id).click();
assertEq(w.InventoryCart.quantityOf(cartMouse.id), 1, 'cart usable again after clearing');

// ================================================================
console.log('[13] Checkout & order history');

const ORDERS_KEY = 'inventory.orders.v1';

function ordersStored() {
  return JSON.parse(w.localStorage.getItem(ORDERS_KEY) || '[]');
}

const checkoutMouse = productBySku('ELEC-0001');
const checkoutNotebook = productBySku('OFFI-0001');
const checkoutKeyboard = productBySku('ELEC-0002');
const mouseStockBefore = w.Inventory.getById(checkoutMouse.id).quantity;
const notebookStockBefore = w.Inventory.getById(checkoutNotebook.id).quantity;

// Cart currently holds 1 x Wireless Mouse (19.99) from section [12].
assertEq(doc.getElementById('cart-total-price').textContent, '19.99', 'cart ready for checkout');
assert(!doc.getElementById('checkout-btn').disabled, 'checkout enabled with a full cart');

cartAddBtn(checkoutNotebook.id).click();
assertEq(doc.getElementById('cart-total-price').textContent, '23.19', 'cart total before checkout');

doc.getElementById('checkout-btn').click();
let toast = doc.querySelector('.toast');
assert(toast !== null && toast.textContent.indexOf('#1001') !== -1,
  'success toast announces order #1001');
assert(toast.textContent.indexOf('23.19') !== -1, 'toast shows the paid total');
assert(!doc.getElementById('cart-empty').hidden, 'cart emptied by checkout');
assert(doc.getElementById('checkout-btn').disabled, 'checkout disabled while cart is empty');
assert(doc.getElementById('cart-indicator-count').hidden, 'header badge hidden after checkout');
assertEq(rowFor(w, checkoutMouse.id).querySelector('.qty').textContent,
  String(mouseStockBefore - 1), 'stock decremented in the table (mouse)');
assertEq(rowFor(w, checkoutNotebook.id).querySelector('.qty').textContent,
  String(notebookStockBefore - 1), 'stock decremented in the table (notebook)');
assertEq(w.Inventory.getById(checkoutMouse.id).quantity, mouseStockBefore - 1,
  'stock decremented in storage');
assertEq(cartStored().length, 0, 'cart storage emptied');

// Order history
assert(doc.getElementById('orders-empty').hidden, 'history empty notice hidden after purchase');
assertEq(doc.querySelectorAll('#orders-list .order').length, 1, 'one order in history');
let orderEl = doc.querySelector('#orders-list .order');
let summaryText = orderEl.querySelector('summary').textContent;
assert(summaryText.indexOf('#1001') !== -1, 'summary shows order number');
assert(summaryText.indexOf('23.19') !== -1, 'summary shows order total');
assert(summaryText.indexOf('2 units') !== -1, 'summary shows unit count');
assert(orderEl.open === false, 'order details collapsed by default');
assertEq(orderEl.querySelectorAll('.order-items li').length, 2, 'order lists both items');
assert(orderEl.textContent.indexOf('Wireless Mouse') !== -1, 'order item shows product name');
assertEq(doc.getElementById('orders-count').textContent, '1 order', 'history count label');
assert(!doc.getElementById('clear-orders-btn').hidden, 'clear-history button visible');
assertEq(ordersStored().length, 1, 'order persisted to localStorage');

// Orders are snapshots: editing the product afterwards changes nothing
w.Inventory.updateProduct(checkoutMouse.id, { unitPrice: 99.99 });
orderEl = doc.querySelector('#orders-list .order');
assertEq(orderEl.querySelector('.order-total').textContent, '23.19',
  'order total unchanged after a later price edit');
assertEq(ordersStored()[0].total, 23.19, 'snapshot persisted independently');

// Second purchase
cartAddBtn(checkoutKeyboard.id).click();
doc.getElementById('checkout-btn').click();
assertEq(doc.querySelectorAll('#orders-list .order').length, 2, 'second order recorded');
orderEl = doc.querySelector('#orders-list .order'); // newest first
assert(orderEl.querySelector('summary').textContent.indexOf('#1002') !== -1,
  'newest order shown first');
assertEq(doc.getElementById('orders-count').textContent, '2 orders', 'history count updated');
assertEq(ordersStored().length, 2, 'both orders persisted');

// History survives a reload
w = makePage(w.localStorage.getItem(KEY), w.localStorage.getItem(CART_KEY),
  w.localStorage.getItem(ORDERS_KEY));
doc = w.document;
assertEq(doc.querySelectorAll('#orders-list .order').length, 2, 'orders restored after reload');
assert(doc.querySelector('#orders-list .order summary').textContent.indexOf('#1002') !== -1,
  'newest order first after reload');
assert(doc.getElementById('checkout-btn').disabled, 'checkout still disabled after reload (empty cart)');

// Clearing the history (confirm flow), numbering keeps increasing
doc.getElementById('clear-orders-btn').click();
assert(!doc.getElementById('confirm-modal').hidden, 'clear-history opens the confirm modal');
assertEq(doc.getElementById('confirm-title').textContent, 'Clear order history', 'confirm title');
assert(doc.getElementById('confirm-text').textContent.indexOf('2 order') !== -1,
  'confirm mentions the order count');
doc.getElementById('confirm-delete-btn').click();
assert(doc.getElementById('confirm-modal').hidden, 'confirm closes');
assert(!doc.getElementById('orders-empty').hidden, 'history empty after clearing');
assertEq(ordersStored().length, 0, 'cleared history persisted');

w.InventoryCart.add(w.Inventory.getAll().find((p) => p.sku === 'ELEC-0001').id, 1);
doc.getElementById('checkout-btn').click();
orderEl = doc.querySelector('#orders-list .order');
assert(orderEl !== null && orderEl.querySelector('summary').textContent.indexOf('#1003') !== -1,
  'order numbering continues after clearing (#1003)');

// ================================================================
console.log('');
console.log('passed: ' + passed + ', failed: ' + failed);
process.exit(failed === 0 ? 0 : 1);
