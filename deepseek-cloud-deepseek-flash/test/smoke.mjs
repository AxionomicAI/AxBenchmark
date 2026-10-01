/*
 * smoke.mjs — run-by-hand checks for the app. No dependencies:
 *
 *     node test/smoke.mjs
 *
 * There is no browser here, so this stubs just enough DOM for the app's
 * bootstrap to run for real. The point is the wiring, not the visuals: it
 * catches ids in app.js that no longer match index.html, asset paths that point
 * at files which do not exist, and the storage edge cases (first run, corrupt
 * data, storage disabled) that are awkward to reproduce by hand.
 *
 * Each section is isolated: a crash inside one is reported as a failure and the
 * rest still run, so a single break does not hide everything after it.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let failures = 0;

function check(label, condition, detail) {
  if (condition) {
    console.log(`  ok   ${label}`);
  } else {
    failures++;
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

function section(name, fn) {
  console.log(`\n${name}`);
  try {
    fn();
  } catch (err) {
    failures++;
    console.log(`  FAIL section threw — ${err.message}`);
  }
}

/* ---------------------------------------------------------------- DOM stub */

/* A closing dialog's `close` event is queued by the browser, not fired inline,
 * so it can land after the dialog has been reopened. The stub keeps that
 * ordering available: close() queues the element and deliverCloseEvents()
 * hands the events over when the test is ready for them. */
const queuedCloses = [];

function deliverCloseEvents() {
  for (const el of queuedCloses.splice(0)) {
    (el.handlers.close || []).forEach((fn) => fn({}));
  }
}

function createElement(tagName) {
  return {
    tagName: String(tagName).toUpperCase(),
    id: '',
    className: '',
    children: [],
    dataset: {},
    attributes: {},
    hidden: false,
    disabled: false,
    open: false,
    value: '',
    focused: false,
    parentNode: null,
    handlers: {},
    _text: '',

    /* Walk up to the root, so a node the last render detached reports false the
     * way the real property does. This is what the caret restore checks before
     * putting focus back on a control that the redraw may have drawn away. */
    get isConnected() {
      let node = this;
      while (node.parentNode) node = node.parentNode;
      return node.tagName === 'BODY';
    },

    /* Own text plus the descendants', the way the real property reads: a button
     * holding "Edit" and a hidden product name is named by both. */
    get textContent() {
      return this._text + this.children.map((c) => c.textContent).join('');
    },
    set textContent(value) {
      this._text = String(value);
      this.children.length = 0;
    },

    appendChild(child) {
      child.parentNode = this;
      this.children.push(child);
      return child;
    },
    replaceChildren(...nodes) {
      this.children.forEach((c) => { c.parentNode = null; });
      this.children.length = 0;
      nodes.forEach((n) => this.appendChild(n));
    },
    after(node) {
      if (!this.parentNode) return;
      const siblings = this.parentNode.children;
      siblings.splice(siblings.indexOf(this) + 1, 0, node);
      node.parentNode = this.parentNode;
    },
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(this.attributes, name)
        ? this.attributes[name]
        : null;
    },
    removeAttribute(name) {
      delete this.attributes[name];
    },
    addEventListener(type, fn) {
      (this.handlers[type] ||= []).push(fn);
    },
    /* <dialog> and focus() are no-ops here beyond recording what happened —
     * enough to assert that the app opened the right dialog and put the caret
     * in the right field. */
    showModal() {
      this.open = true;
    },
    close() {
      this.open = false;
      queuedCloses.push(this);
    },
    focus() {
      this.focused = true;
    },
    /* Walk this element and its descendants. */
    find(predicate) {
      if (predicate(this)) return this;
      for (const child of this.children) {
        const hit = child.find(predicate);
        if (hit) return hit;
      }
      return null;
    }
  };
}

/* Build a document whose elements come from the real index.html ids, so a
 * mismatch between markup and script surfaces as a clean failure rather than a
 * null deref somewhere deep in the app. */
function createDocument(ids) {
  const rootEl = createElement('body');
  const byId = new Map();

  for (const id of ids) {
    const el = createElement('div');
    el.id = id;
    /* Start hidden if the markup says so: an element the page ships hidden
     * must not read as visible before the script has run. */
    const tag = html.match(new RegExp(`<[^>]*\\bid="${id}"[^>]*>`));
    if (tag && /\shidden[\s/>]/.test(tag[0])) el.hidden = true;
    byId.set(id, el);
    rootEl.appendChild(el);
  }

  return {
    readyState: 'complete',
    body: rootEl,
    handlers: {},
    getElementById: (id) => byId.get(id) || null,
    createElement,
    /* The page's keyboard shortcuts listen here, so the stub records them
     * rather than dropping them on the floor. */
    addEventListener(type, fn) {
      (this.handlers[type] ||= []).push(fn);
    }
  };
}

function createLocalStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k)
  };
}

/* Storage that works until it doesn't: flip `full` to make writes throw the
 * way a browser does when the quota runs out or access is withdrawn. Reads
 * keep working, so nothing can tell at boot that saving is about to fail. */
function createQuotaStorage() {
  const map = new Map();
  const api = {
    full: false,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => {
      if (api.full) throw new Error('quota exceeded');
      map.set(k, String(v));
    },
    removeItem: (k) => map.delete(k)
  };
  return api;
}

/* Storage that takes every write except one key's. A checkout writes to three
 * collections, and this is the browser that has room for the receipt but not
 * for the change to the stock underneath it — the case that tells a page
 * reporting the whole of a checkout apart from one reporting its last write. */
function createPickStorage() {
  const map = new Map();
  const api = {
    refuse: null, // the key whose writes throw, set by the test
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => {
      if (k === api.refuse) throw new Error('refused');
      map.set(k, String(v));
    },
    removeItem: (k) => map.delete(k)
  };
  return api;
}

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);

/* The scripts the page actually loads, in order, so these checks run exactly
 * what a browser runs — and a new file cannot be forgotten here. */
const scripts = [...html.matchAll(/<script\s+src="([^"]+)"/g)].map((m) => m[1]);

/* Load the page's scripts into a fresh realm and return the global, after
 * bootstrap has run. Pass `crypto: null` to play an old browser, or `scripts`
 * to run only part of the page. */
function boot({ localStorage, crypto = { randomUUID }, scripts: files = scripts }) {
  queuedCloses.length = 0; // a fresh page has no events in flight
  const sandbox = {
    console,
    document: createDocument(ids),
    localStorage,
    crypto
  };
  const context = vm.createContext(sandbox);
  sandbox.window = sandbox;

  for (const file of files) {
    const code = fs.readFileSync(path.join(root, file), 'utf8');
    vm.runInContext(code, context, { filename: file });
  }

  return sandbox;
}

/* Seed localStorage with a stored envelope. */
function seed(localStorage, items) {
  localStorage.setItem('inventory.items', JSON.stringify({
    version: 1,
    items
  }));
}

function stored(localStorage) {
  const raw = localStorage.getItem('inventory.items');
  return raw === null ? null : JSON.parse(raw);
}

const rowsIn = (doc) => doc.getElementById('item-list').children;
const countIn = (doc) => doc.getElementById('item-count').textContent;

/* Read the text of one labelled field within a rendered row. */
function field(row, className) {
  const el = row.find((n) => String(n.className).split(/\s+/).includes(className));
  return el ? el.textContent : null;
}

const rowNames = (doc) => rowsIn(doc).map((li) => field(li, 'item-name'));

const summaryIn = (doc) => doc.getElementById('search-summary').textContent;

/* The picker's options, minus the "all of them" one that always leads. */
const categoryOptions = (doc) => doc.getElementById('category-filter')
  .children.slice(1).map((option) => option.value);

const rowFor = (doc, id) => rowsIn(doc).find((li) => li.dataset.id === id);

/* The cart, reached the same way. A line is keyed by the product it points at,
 * not by a line id of its own. */
const cartRows = (doc) => doc.getElementById('cart-list').children;
const cartRowFor = (doc, id) => cartRows(doc).find((li) => li.dataset.id === id);
const cartNames = (doc) => cartRows(doc).map((li) => field(li, 'cart-name'));
const cartCountIn = (doc) => doc.getElementById('cart-count').textContent;
const cartTotalIn = (doc) => doc.getElementById('cart-total').textContent;
const cartNoteIn = (doc) => doc.getElementById('cart-note');

const quantityField = (doc, id) => {
  const row = cartRowFor(doc, id);
  return row
    ? row.find((n) => String(n.className).split(/\s+/).includes('cart-quantity'))
    : null;
};

const quantityIn = (doc, id) => (quantityField(doc, id) || {}).value;

/* The row's "Add to cart". Re-found on every click, because the one before it
 * was replaced by the redraw it caused. */
function addToCart(doc, id, times = 1) {
  for (let i = 0; i < times; i++) click(actionIn(rowFor(doc, id), 'cart'));
}

/* Commit a typed quantity: set the field, then fire the event the app waits
 * for. `change`, not `input` — the app deliberately waits for the field to be
 * committed before it caps what was typed. */
function typeQuantity(doc, id, value) {
  const input = quantityField(doc, id);
  input.value = String(value);
  (input.handlers.change || []).forEach((fn) => fn({ target: input }));
}

const storedCart = (localStorage) => {
  const raw = localStorage.getItem('inventory.cart');
  return raw === null ? null : JSON.parse(raw);
};

/* The history, reached the same way. An order is keyed by an id of its own:
 * its lines point at products that may since have been deleted, so they cannot
 * key it. */
const storedOrders = (localStorage) => {
  const raw = localStorage.getItem('inventory.orders');
  return raw === null ? null : JSON.parse(raw);
};

const orderRows = (doc) => doc.getElementById('order-list').children;
const orderCountIn = (doc) => doc.getElementById('orders-count').textContent;
const checkoutButton = (doc) => doc.getElementById('cart-checkout');

const orderLinesIn = (order) => (order
  ? order.find((n) => String(n.className).split(/\s+/).includes('order-lines')).children
  : []);

const orderNamesIn = (order) => orderLinesIn(order).map((li) => field(li, 'order-line-name'));

/* Check the cart out the way a user does: ask, then answer. */
function checkOut(doc) {
  click(checkoutButton(doc));
  click(doc.getElementById('confirm-delete'));
}

/* Drive the page the way a user does: fire the handlers the app registered.
 * A missing element fails loudly here rather than as a null deref deep in the
 * app, which would be reported against the wrong line. */
function click(element) {
  if (!element) throw new Error('nothing to click');
  (element.handlers.click || []).forEach((fn) => fn({ preventDefault() {} }));
}

function submit(form) {
  if (!form) throw new Error('no form to submit');
  (form.handlers.submit || []).forEach((fn) => fn({ preventDefault() {} }));
}

const actionIn = (row, action) => (row
  ? row.find((n) => n.dataset.action === action)
  : null);

function fillForm(doc, values) {
  for (const [id, value] of Object.entries(values)) {
    doc.getElementById(id).value = String(value);
  }
}

/* Type into a field: set the value, then fire the event the app listens for. */
function type(doc, id, value) {
  const el = doc.getElementById(id);
  el.value = String(value);
  (el.handlers.input || []).forEach((fn) => fn({ target: el }));
}

/* Pick an option. The stub has no options to validate against, so this stands
 * in for the browser's "the value must be one of the options" rule — the tests
 * only ever choose values the picker is offering. */
function choose(doc, value) {
  const el = doc.getElementById('category-filter');
  el.value = value;
  (el.handlers.change || []).forEach((fn) => fn({ target: el }));
}

/* Press a key at a target. Shortcuts are bound on the document, so the event
 * is delivered there too, the way bubbling would. Returns the event, so a
 * check can see whether the app took the key for itself. */
function press(doc, target, key) {
  const event = {
    key,
    target,
    defaultPrevented: false,
    preventDefault() { event.defaultPrevented = true; }
  };
  (target.handlers.keydown || []).forEach((fn) => fn(event));
  (doc.handlers.keydown || []).forEach((fn) => fn(event));
  return event;
}

/* What the app reaches for by id. If index.html renames one of these, app.js
 * silently gets null and the page breaks — so assert the contract here. */
const REQUIRED_IDS = [
  'add-item', 'item-count', 'item-list', 'empty-state', 'save-warning',
  'search-input', 'category-filter', 'clear-filters', 'search-summary',
  'no-matches',
  'item-dialog', 'item-form', 'item-dialog-title', 'form-error', 'form-cancel',
  'form-submit', 'field-name', 'field-category', 'field-quantity',
  'field-price', 'field-notes',
  'cart-list', 'cart-count', 'cart-empty', 'cart-clear', 'cart-checkout',
  'cart-stale', 'cart-note', 'cart-total', 'cart-total-row',
  'order-list', 'orders-count', 'orders-empty',
  'confirm-dialog', 'confirm-dialog-title', 'confirm-message', 'confirm-cancel',
  'confirm-delete'
];

/* ------------------------------------------------------------------- tests */

section('referenced assets exist', () => {
  const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
  check('index.html references at least one asset', refs.length > 0);
  for (const asset of refs) {
    if (/^(https?:)?\/\//.test(asset) || asset.startsWith('#')) continue;
    check(asset, fs.existsSync(path.join(root, asset)));
  }
});

section('ids app.js needs are present in index.html', () => {
  for (const id of REQUIRED_IDS) {
    check(id, ids.includes(id));
  }
});

section('scripts are classic, not modules', () => {
  /* `type="module"` is blocked over file://, which would break the whole
   * "just open index.html" requirement. */
  check('no type="module"', !/<script[^>]*type\s*=\s*"module"/.test(html));
});

section('the data layer is wired up', () => {
  const app = boot({ localStorage: createLocalStorage() });
  for (const fn of ['load', 'all', 'get', 'search', 'categories', 'add', 'update', 'remove', 'replaceAll', 'subscribe']) {
    check(`Inventory.items.${fn}`, typeof app.Inventory.items[fn] === 'function');
  }
  check('Inventory.storage.hasData', typeof app.Inventory.storage.hasData === 'function');
});

section('first run seeds sample stock', () => {
  const localStorage = createLocalStorage();
  const app = boot({ localStorage });
  const items = app.Inventory.items.all();

  check('a fresh browser gets sample products', items.length > 0, `got ${items.length}`);
  check('the count matches',
    countIn(app.document) === `${items.length} items`, countIn(app.document));
  check('one row per product',
    rowsIn(app.document).length === items.length, `got ${rowsIn(app.document).length}`);
  check('names render in list order',
    rowNames(app.document).join('|') === items.map((i) => i.name).join('|'),
    rowNames(app.document).join('|'));
  check('rows keep their id', rowsIn(app.document)[0].dataset.id === items[0].id);
  check('empty state hidden', app.document.getElementById('empty-state').hidden === true);

  check('the seed is written to storage',
    stored(localStorage) !== null && stored(localStorage).items.length === items.length);
  check('the stored envelope carries a schema version', stored(localStorage).version === 1);
  check('storage now reports data', app.Inventory.storage.hasData() === true);

  check('ids are unique',
    new Set(items.map((i) => i.id)).size === items.length);
  check('the sample set includes an out-of-stock product',
    items.some((i) => i.quantity === 0), 'nothing for the stock views to show');
  check('out-of-stock reads as words, not "0"',
    rowsIn(app.document).map((li) => field(li, 'item-stock'))
      .includes('Out of stock'));

  const reloaded = boot({ localStorage });
  check('reloading does not seed a second time',
    reloaded.Inventory.items.all().length === items.length,
    `got ${reloaded.Inventory.items.all().length}`);
});

section('products carry a full record', () => {
  const app = boot({ localStorage: createLocalStorage() });
  const items = app.Inventory.items.all();

  const fields = ['id', 'name', 'category', 'quantity', 'price', 'notes', 'createdAt', 'updatedAt'];
  const wrong = items.filter((item) => (
    fields.some((f) => !(f in item))
    || typeof item.id !== 'string' || item.id === ''
    || typeof item.name !== 'string' || item.name === ''
    || typeof item.category !== 'string'
    || !Number.isInteger(item.quantity) || item.quantity < 0
    || typeof item.price !== 'number' || !Number.isFinite(item.price) || item.price < 0
    || typeof item.notes !== 'string'
    || Number.isNaN(Date.parse(item.createdAt))
    || Number.isNaN(Date.parse(item.updatedAt))
  ));
  check('every product has the documented shape', wrong.length === 0,
    JSON.stringify(wrong[0]));

  const extra = items.filter((item) => Object.keys(item).length !== fields.length);
  check('no undocumented fields', extra.length === 0, Object.keys(extra[0] || {}).join(','));
});

section('stored items win over the sample set', () => {
  const localStorage = createLocalStorage();
  seed(localStorage, [
    { id: 'a', name: 'Widget', category: 'Parts', quantity: 2, price: 3.5 },
    { id: 'b', name: 'Sprocket', category: 'Parts', quantity: 0, price: 1 }
  ]);
  const app = boot({ localStorage });

  check('only the stored products render',
    rowNames(app.document).join('|') === 'Widget|Sprocket', rowNames(app.document).join('|'));
  check('count reads "2 items"', countIn(app.document) === '2 items', countIn(app.document));
  check('stock renders', field(rowsIn(app.document)[0], 'item-stock') === '2 in stock');
  check('price renders', field(rowsIn(app.document)[0], 'item-price') === '$3.50');
  check('category renders', field(rowsIn(app.document)[0], 'item-category') === 'Parts');
  check('nothing was written back on a read', stored(localStorage).items.length === 2);
});

section('an emptied list stays empty', () => {
  /* The point of hasData(): deleting everything is not a first run, and the
   * sample products must not come back. */
  const localStorage = createLocalStorage();
  seed(localStorage, []);
  const app = boot({ localStorage });

  check('count reads "0 items"', countIn(app.document) === '0 items', countIn(app.document));
  check('empty state visible', app.document.getElementById('empty-state').hidden === false);
  check('list is empty', rowsIn(app.document).length === 0);
  check('the sample set was not restored', app.Inventory.items.all().length === 0);
});

section('singular count', () => {
  const localStorage = createLocalStorage();
  seed(localStorage, [{ id: 'a', name: 'Widget' }]);
  const app = boot({ localStorage });
  check('count reads "1 item"', countIn(app.document) === '1 item', countIn(app.document));
});

section('reads repair junk instead of choking on it', () => {
  const localStorage = createLocalStorage();
  seed(localStorage, [
    { id: 'x', name: '  Bolt  ', category: 42, quantity: -5, price: 'abc' },
    { id: 'x', name: 'Duplicate id', quantity: 1.7 },
    { id: 'y', quantity: 3 },
    null,
    'nonsense',
    { id: 'z', name: 'Ok', price: -1, createdAt: 'not a date' }
  ]);
  const app = boot({ localStorage });
  const items = app.Inventory.items.all();
  const byName = (name) => items.find((i) => i.name === name);

  check('nameless records are dropped', items.length === 3, `got ${items.length}`);
  check('names are trimmed', byName('Bolt') !== undefined);
  check('a non-string category reads as empty', byName('Bolt').category === '');
  check('a negative stock count clamps to 0', byName('Bolt').quantity === 0);
  check('a non-numeric price reads as 0', byName('Bolt').price === 0);
  check('a fractional stock count truncates', byName('Duplicate id').quantity === 1);
  check('a negative price clamps to 0', byName('Ok').price === 0);
  check('a bad timestamp falls back to now',
    !Number.isNaN(Date.parse(byName('Ok').createdAt)));
  check('duplicate ids are separated',
    new Set(items.map((i) => i.id)).size === items.length);
  check('the page renders what survived', rowsIn(app.document).length === 3);
});

section('corrupt stored data degrades to empty, does not throw', () => {
  const cases = [
    ['not json', '}{'],
    ['json but not an object', '"hello"'],
    ['missing items array', '{"version":1}'],
    ['items is not an array', '{"version":1,"items":"nope"}'],
    ['null envelope', 'null']
  ];
  for (const [label, raw] of cases) {
    const localStorage = createLocalStorage();
    localStorage.setItem('inventory.items', raw);
    const app = boot({ localStorage });
    check(label, countIn(app.document) === '0 items', countIn(app.document));
    check(`${label}: the unreadable blob is left alone`,
      localStorage.getItem('inventory.items') === raw);
  }
});

section('mutations write through to storage', () => {
  const localStorage = createLocalStorage();
  const app = boot({ localStorage });
  const store = app.Inventory.items;
  const before = store.all().length;

  const created = store.add({ name: '  Tripod  ', category: 'Video', quantity: 4, price: 19.999 });
  check('add returns the new product', created !== null && created.name === 'Tripod');
  check('add trims the name', created.name === 'Tripod');
  check('add rounds the price to cents', created.price === 20, String(created.price));
  check('add stamps both timestamps',
    !Number.isNaN(Date.parse(created.createdAt)) && created.createdAt === created.updatedAt);
  check('add grows the list', store.all().length === before + 1);
  check('add persists',
    stored(localStorage).items.some((i) => i.id === created.id));
  check('the page redrew itself',
    rowsIn(app.document).length === before + 1, `got ${rowsIn(app.document).length}`);

  check('add without a name is refused', store.add({ quantity: 2 }) === null);
  check('a refused add changes nothing', store.all().length === before + 1);

  const updated = store.update(created.id, { quantity: 9 });
  check('update returns the new state', updated !== null && updated.quantity === 9);
  check('update keeps id and createdAt',
    updated.id === created.id && updated.createdAt === created.createdAt);
  check('update restamps updatedAt',
    Date.parse(updated.updatedAt) >= Date.parse(created.updatedAt));
  check('update persists',
    stored(localStorage).items.find((i) => i.id === created.id).quantity === 9);
  check('update rejects a blank name', store.update(created.id, { name: '   ' }) === null);
  check('a rejected update leaves the product alone', store.get(created.id).name === 'Tripod');
  check('update on an unknown id returns null', store.update('nope', { quantity: 1 }) === null);
  check('get returns a copy, not the live record',
    store.get(created.id) !== store.get(created.id));

  check('remove reports success', store.remove(created.id) === true);
  check('remove is gone from the list', store.get(created.id) === null);
  check('remove is gone from storage',
    !stored(localStorage).items.some((i) => i.id === created.id));
  check('remove on an unknown id returns false', store.remove('nope') === false);
});

section('a change before boot cannot wipe stored data', () => {
  /* Every mutation saves the whole list, so one that beats load() would write
   * the empty starting list straight over the user's products. Boot only the
   * data layer here — app.js is what normally calls load() first. */
  const localStorage = createLocalStorage();
  seed(localStorage, [{ id: 'keep', name: 'Keeper', quantity: 1 }]);
  const app = boot({ localStorage, scripts: ['js/storage.js', 'js/items.js'] });
  const store = app.Inventory.items;

  store.add({ name: 'Early' });
  const names = store.all().map((i) => i.name);
  check('the stored product survives', names.includes('Keeper'), names.join(','));
  check('the new product is there too', names.includes('Early'), names.join(','));
  check('both are persisted', stored(localStorage).items.length === 2,
    String(stored(localStorage).items.length));

  store.load();
  check('a second load() does not re-read or duplicate',
    store.all().length === 2, String(store.all().length));
});

section('subscribers see every change', () => {
  const app = boot({ localStorage: createLocalStorage() });
  const store = app.Inventory.items;
  const sizes = [];
  const writes = [];
  const unsubscribe = store.subscribe((items, info) => {
    sizes.push(items.length);
    writes.push(info.saved);
  });

  const created = store.add({ name: 'Cable Tidy', quantity: 1 });
  store.update(created.id, { quantity: 2 });
  store.remove(created.id);
  check('one notification per change', sizes.length === 3, `got ${sizes.length}`);
  check('subscribers get the current list',
    sizes[0] === sizes[1] && sizes[2] === sizes[0] - 1, sizes.join(','));
  check('and the write result with it',
    writes.length === 3 && writes.every((saved) => saved === true), writes.join(','));

  unsubscribe();
  store.add({ name: 'Ignored' });
  check('unsubscribing stops the notifications', sizes.length === 3, `got ${sizes.length}`);
});

section('ids stay unique without crypto.randomUUID', () => {
  /* Older browsers, and any context that is not secure, lack the method. */
  const app = boot({ localStorage: createLocalStorage(), crypto: null });
  const store = app.Inventory.items;
  const ids = [
    store.add({ name: 'One' }).id,
    store.add({ name: 'Two' }).id,
    store.add({ name: 'Three' }).id
  ];
  check('a product still gets an id', ids.every((id) => typeof id === 'string' && id !== ''));
  check('ids do not collide', new Set(ids).size === 3, ids.join(','));
});

section('storage disabled', () => {
  /* Safari private mode and some file:// contexts throw on every access. */
  const hostile = {
    getItem() { throw new Error('denied'); },
    setItem() { throw new Error('denied'); },
    removeItem() { throw new Error('denied'); }
  };
  const app = boot({ localStorage: hostile });
  const items = app.Inventory.items.all();

  check('isAvailable() is false', app.Inventory.storage.isAvailable() === false);
  check('hasData() is false', app.Inventory.storage.hasData() === false);
  check('load() returns []', app.Inventory.storage.load().length === 0);
  check('save() returns false', app.Inventory.storage.save([{ id: 'a' }]) === false);
  check('the page still renders sample stock from memory', items.length > 0);
  check('and the count matches it',
    countIn(app.document) === `${items.length} items`, countIn(app.document));
  check('mutations still work in memory', app.Inventory.items.remove(items[0].id) === true);

  /* The cart is a second collection behind the same probe, so it has to
   * degrade the same way: usable on the page, saved nowhere. */
  check('the cart still takes lines', app.Inventory.cart.add(items[1].id, 1) !== null);
  check('its line is drawn', cartRows(app.document).length === 1);
  check('and priced', cartTotalIn(app.document) === `$${items[1].price.toFixed(2)}`,
    cartTotalIn(app.document));
  const warning = app.document.getElementById('save-warning');
  check('the warning is visible', warning.hidden === false);
  check('it says why', /storage is unavailable/i.test(warning.textContent),
    warning.textContent);
});

section('save/load round trip', () => {
  const localStorage = createLocalStorage();
  const app = boot({ localStorage });
  const items = [{ id: 'x', name: 'Thing', quantity: 3 }];
  check('save() returns true', app.Inventory.storage.save(items) === true);
  check('load() returns what was saved',
    JSON.stringify(app.Inventory.storage.load()) === JSON.stringify(items));
  check('envelope carries a schema version',
    JSON.parse(localStorage.getItem('inventory.items')).version === 1);
  check('clear() empties it',
    app.Inventory.storage.clear() === true && app.Inventory.storage.load().length === 0);
  check('hasData() follows clear()', app.Inventory.storage.hasData() === false);
});

/* ------------------------------------------------- managing the inventory */

section('the markup carries what the flows need', () => {
  check('the add button is live, not disabled',
    !/<button[^>]*id="add-item"[^>]*\bdisabled\b/.test(html));
  check('the name field is required',
    /<input[^>]*id="field-name"[^>]*\brequired\b/.test(html));
  check('quantity cannot be entered as negative',
    /<input[^>]*id="field-quantity"[^>]*\bmin="0"/.test(html));
  check('price cannot be entered as negative',
    /<input[^>]*id="field-price"[^>]*\bmin="0"/.test(html));
  check('the form lives inside a dialog',
    /<dialog[^>]*id="item-dialog"[\s\S]*<form[^>]*id="item-form"/.test(html));
});

section('the add form creates a product', () => {
  const localStorage = createLocalStorage();
  const app = boot({ localStorage });
  const doc = app.document;
  const store = app.Inventory.items;
  const before = store.all().length;
  const dialog = doc.getElementById('item-dialog');

  check('the form starts closed', dialog.open === false);

  click(doc.getElementById('add-item'));
  check('the button opens the form', dialog.open === true);
  check('the form says what it is doing',
    doc.getElementById('item-dialog-title').textContent === 'Add item',
    doc.getElementById('item-dialog-title').textContent);
  check('the fields start blank', doc.getElementById('field-name').value === '');
  check('the caret starts in the name field', doc.getElementById('field-name').focused === true);

  fillForm(doc, {
    'field-name': '  Desk Lamp  ',
    'field-category': 'Lighting',
    'field-quantity': '7',
    'field-price': '42.5',
    'field-notes': 'Warm white'
  });
  submit(doc.getElementById('item-form'));

  check('the form closes on save', dialog.open === false);
  check('the list grew by one', store.all().length === before + 1);
  check('the count follows', countIn(doc) === `${before + 1} items`, countIn(doc));

  const created = store.all().find((i) => i.name === 'Desk Lamp') || {};
  check('the product is stored, with the name trimmed', created.name === 'Desk Lamp');
  check('the category is stored', created.category === 'Lighting');
  check('the quantity is stored as a number', created.quantity === 7);
  check('the price is stored as a number', created.price === 42.5);
  check('the notes are stored', created.notes === 'Warm white');
  check('it is persisted',
    stored(localStorage).items.some((i) => i.id === created.id));

  const row = rowFor(doc, created.id);
  check('a row was drawn for it', row !== undefined);
  check('the row shows the name', field(row, 'item-name') === 'Desk Lamp');
  check('the row shows the category', field(row, 'item-category') === 'Lighting');
  check('the row shows the stock', field(row, 'item-stock') === '7 in stock');
  check('the row shows the price', field(row, 'item-price') === '$42.50');
  check('the row shows the notes', field(row, 'item-notes') === 'Warm white');
});

section('the add form refuses a product with no name', () => {
  const localStorage = createLocalStorage();
  const app = boot({ localStorage });
  const doc = app.document;
  const store = app.Inventory.items;
  const before = store.all().length;
  const error = doc.getElementById('form-error');

  click(doc.getElementById('add-item'));
  /* Only spaces: `required` lets this through, and it still trims to nothing. */
  fillForm(doc, { 'field-name': '   ' });
  submit(doc.getElementById('item-form'));

  check('the form stays open', doc.getElementById('item-dialog').open === true);
  check('an error is shown', error.hidden === false);
  check('the message says what is wrong', /name/i.test(error.textContent), error.textContent);
  check('the field is marked invalid',
    doc.getElementById('field-name').getAttribute('aria-invalid') === 'true');
  check('nothing was added', store.all().length === before, `got ${store.all().length}`);

  fillForm(doc, { 'field-name': 'Clipboard' });
  submit(doc.getElementById('item-form'));
  check('a real name goes through', doc.getElementById('item-dialog').open === false);
  check('the product is stored', store.all().some((i) => i.name === 'Clipboard'));
  check('the error is cleared for next time', error.hidden === true);
  check('the invalid marker is cleared too',
    doc.getElementById('field-name').getAttribute('aria-invalid') === null);
});

section('the edit form opens on a product and saves in place', () => {
  const localStorage = createLocalStorage();
  const app = boot({ localStorage });
  const doc = app.document;
  const store = app.Inventory.items;
  const target = store.all()[1];
  const count = store.all().length;
  const dialog = doc.getElementById('item-dialog');

  click(actionIn(rowFor(doc, target.id), 'edit'));
  check('the form opens', dialog.open === true);
  check('the form says what it is doing',
    doc.getElementById('item-dialog-title').textContent === 'Edit item');
  check('the button offers to save',
    doc.getElementById('form-submit').textContent === 'Save changes');
  check('the name is filled in', doc.getElementById('field-name').value === target.name);
  check('the category is filled in',
    doc.getElementById('field-category').value === target.category);
  check('the quantity is filled in',
    doc.getElementById('field-quantity').value === String(target.quantity),
    doc.getElementById('field-quantity').value);
  check('the price is filled in',
    doc.getElementById('field-price').value === String(target.price),
    doc.getElementById('field-price').value);
  check('the notes are filled in',
    doc.getElementById('field-notes').value === target.notes);

  fillForm(doc, { 'field-name': 'Renamed', 'field-quantity': '12', 'field-price': '5' });
  submit(doc.getElementById('item-form'));

  const updated = store.get(target.id) || {};
  check('the form closes', dialog.open === false);
  check('the product keeps its id', updated.id === target.id);
  check('the name changed', updated.name === 'Renamed');
  check('the quantity changed', updated.quantity === 12);
  check('the price changed', updated.price === 5);
  check('the untouched fields are kept', updated.category === target.category);
  check('createdAt is untouched', updated.createdAt === target.createdAt);
  check('updatedAt moved on', Date.parse(updated.updatedAt) >= Date.parse(target.updatedAt));
  check('nothing was added', store.all().length === count, `got ${store.all().length}`);
  check('the change is persisted',
    stored(localStorage).items.find((i) => i.id === target.id).name === 'Renamed');
  check('the row was redrawn', field(rowFor(doc, target.id), 'item-name') === 'Renamed');
});

section('cancelling the form changes nothing', () => {
  const localStorage = createLocalStorage();
  const app = boot({ localStorage });
  const doc = app.document;
  const store = app.Inventory.items;
  const count = store.all().length;
  const target = store.all()[0];
  const dialog = doc.getElementById('item-dialog');

  click(actionIn(rowFor(doc, target.id), 'edit'));
  fillForm(doc, { 'field-name': 'Should not stick' });
  click(doc.getElementById('form-cancel'));

  check('the form closes', dialog.open === false);
  check('the product is untouched', store.get(target.id).name === target.name);
  check('nothing was added', store.all().length === count);
  check('nothing was written',
    stored(localStorage).items.find((i) => i.id === target.id).name === target.name);

  /* The dialog is shared by both flows, so a cancelled edit must not leave its
   * product behind for the next "Add" to overwrite. */
  click(doc.getElementById('add-item'));
  check('Add opens blank, not on the cancelled product',
    doc.getElementById('field-name').value === '');
  check('and it is adding again',
    doc.getElementById('item-dialog-title').textContent === 'Add item');

  fillForm(doc, { 'field-name': 'Fresh' });
  submit(doc.getElementById('item-form'));
  check('saving adds a product rather than editing the old one',
    store.all().length === count + 1 && store.get(target.id).name === target.name);
});

section('delete asks first and only removes on confirm', () => {
  const localStorage = createLocalStorage();
  const app = boot({ localStorage });
  const doc = app.document;
  const store = app.Inventory.items;
  const count = store.all().length;
  const doomed = store.all()[0];
  const other = store.all()[1];
  const confirmDialog = doc.getElementById('confirm-dialog');
  const message = doc.getElementById('confirm-message');

  click(actionIn(rowFor(doc, doomed.id), 'delete'));
  check('the confirmation opens', confirmDialog.open === true);
  check('it names the product', message.textContent.includes(doomed.name), message.textContent);
  check('nothing is removed yet', store.all().length === count);

  click(doc.getElementById('confirm-cancel'));
  check('cancelling closes it', confirmDialog.open === false);
  check('the product is still there', store.get(doomed.id) !== null);
  check('it is still in storage',
    stored(localStorage).items.some((i) => i.id === doomed.id));

  /* A cancelled delete must not leave the wrong product queued up either. */
  click(actionIn(rowFor(doc, other.id), 'delete'));
  check('the question follows the row that was clicked',
    message.textContent.includes(other.name), message.textContent);

  click(doc.getElementById('confirm-delete'));
  check('confirming closes it', confirmDialog.open === false);
  check('only that product is gone',
    store.get(other.id) === null && store.get(doomed.id) !== null);
  check('the list shrinks', store.all().length === count - 1);
  check('storage shrank with it', stored(localStorage).items.length === count - 1);
  check('its row is gone', rowFor(doc, other.id) === undefined);
  check('the count follows', countIn(doc) === `${count - 1} items`, countIn(doc));
});

section('deleting the last product shows the empty state again', () => {
  const localStorage = createLocalStorage();
  seed(localStorage, [{ id: 'only', name: 'Only One', quantity: 1, price: 2 }]);
  const app = boot({ localStorage });
  const doc = app.document;

  check('the empty state starts hidden', doc.getElementById('empty-state').hidden === true);
  click(actionIn(rowFor(doc, 'only'), 'delete'));
  click(doc.getElementById('confirm-delete'));

  check('the empty state comes back', doc.getElementById('empty-state').hidden === false);
  check('the count reads "0 items"', countIn(doc) === '0 items', countIn(doc));
  check('the product is gone from storage', stored(localStorage).items.length === 0);
});

section('a refused write is reported to the user', () => {
  const localStorage = createQuotaStorage();
  const app = boot({ localStorage });
  const doc = app.document;
  const store = app.Inventory.items;
  const warning = doc.getElementById('save-warning');
  const count = store.all().length;

  check('there is nothing to warn about yet', warning.hidden === true);
  check('storage still looks fine', app.Inventory.storage.isAvailable() === true);

  localStorage.full = true;
  click(doc.getElementById('add-item'));
  fillForm(doc, { 'field-name': 'Unsaved' });
  submit(doc.getElementById('item-form'));

  check('the dialog still closes', doc.getElementById('item-dialog').open === false);
  check('the product is on the page', store.all().length === count + 1);
  check('and its row is drawn', rowFor(doc, store.all()[count].id) !== undefined);
  check('the warning is shown', warning.hidden === false);
  check('it says the change was not saved', /refused to save/i.test(warning.textContent),
    warning.textContent);
  check('and that it is only in this window', /window/i.test(warning.textContent));

  /* A later write that works proves saving is fine again. */
  localStorage.full = false;
  click(doc.getElementById('add-item'));
  fillForm(doc, { 'field-name': 'Saved' });
  submit(doc.getElementById('item-form'));

  check('a successful save clears the warning', warning.hidden === true);
  check('the product reached storage',
    stored(localStorage).items.some((i) => i.name === 'Saved'));
});

section('the data layer reports refused writes to subscribers', () => {
  const localStorage = createQuotaStorage();
  const app = boot({ localStorage });
  const store = app.Inventory.items;
  const reports = [];
  store.subscribe((items, info) => reports.push(info.saved));

  store.add({ name: 'One' });
  check('a normal write reports success', reports[0] === true, String(reports[0]));

  localStorage.full = true;
  store.add({ name: 'Two' });
  check('a refused write reports failure', reports[1] === false, String(reports[1]));
  check('the product is still in the list',
    store.all().some((i) => i.name === 'Two'));
  check('but it did not reach storage',
    !stored(localStorage).items.some((i) => i.name === 'Two'));
});

section('row buttons say which product they act on', () => {
  const app = boot({ localStorage: createLocalStorage() });
  const doc = app.document;
  const item = app.Inventory.items.all()[0];
  const row = rowFor(doc, item.id);

  check('the edit button names the product',
    actionIn(row, 'edit').textContent === `Edit ${item.name}`,
    actionIn(row, 'edit').textContent);
  check('the delete button names the product',
    actionIn(row, 'delete').textContent === `Delete ${item.name}`,
    actionIn(row, 'delete').textContent);
  check('the visible label stays short',
    actionIn(row, 'edit').children[0].className === 'visually-hidden');
  check('the buttons are not submit buttons', actionIn(row, 'edit').type === 'button');
});

section('a late close event cannot undo a newer form session', () => {
  /* A dialog's `close` event is queued, so it can arrive after the dialog has
   * been reopened. The form state must not hang off it: an earlier version
   * cleared the error there, which erased the message for a save that had just
   * failed — and clearing the same state's editingId would have turned a save
   * into a second product. */
  const app = boot({ localStorage: createLocalStorage() });
  const doc = app.document;
  const store = app.Inventory.items;
  const item = store.all()[0];
  const error = doc.getElementById('form-error');

  click(actionIn(rowFor(doc, item.id), 'edit'));
  submit(doc.getElementById('item-form'));
  check('the edit closed the dialog', doc.getElementById('item-dialog').open === false);

  click(doc.getElementById('add-item'));
  fillForm(doc, { 'field-name': '   ' });
  submit(doc.getElementById('item-form'));
  check('the failed save explains itself', error.hidden === false, error.textContent);

  /* Now the close from the edit finally arrives, mid-session. */
  deliverCloseEvents();
  check('the late event does not erase the message', error.hidden === false, error.textContent);
  check('nor the invalid marker',
    doc.getElementById('field-name').getAttribute('aria-invalid') === 'true');
  check('and the session is still the add one',
    doc.getElementById('item-dialog-title').textContent === 'Add item');

  fillForm(doc, { 'field-name': 'Added After' });
  submit(doc.getElementById('item-form'));
  check('saving adds one product', store.all().length === 9, `got ${store.all().length}`);
  check('the earlier edit is unchanged', store.get(item.id).name === item.name);
});

section('editing is not offered for a product that is gone', () => {
  /* The store is shared, so a row can outlive its product. Acting on the row
   * must do nothing rather than throw or conjure the product back. */
  const app = boot({ localStorage: createLocalStorage() });
  const doc = app.document;
  const store = app.Inventory.items;
  const item = store.all()[0];
  const row = rowFor(doc, item.id);

  store.remove(item.id);
  click(actionIn(row, 'edit'));
  check('the stale edit opens nothing', doc.getElementById('item-dialog').open === false);
  click(actionIn(row, 'delete'));
  check('the stale delete opens nothing', doc.getElementById('confirm-dialog').open === false);
  check('the list still renders', rowsIn(doc).length === store.all().length);
});

/* --------------------------------------------------------- looking things up */

/* A small catalogue with the shapes a lookup has to cope with: a name that
 * shares a word with another product, a category with several products in it,
 * a word that appears only in the notes, and numbers that are not words. */
const CATALOGUE = [
  { id: 'mouse', name: 'Wireless Mouse', category: 'Accessories', quantity: 24, price: 29.99 },
  { id: 'keyboard', name: 'Mechanical Keyboard', category: 'Accessories', quantity: 6, price: 119, notes: 'Brown switches' },
  { id: 'usb', name: 'USB-C Cable (2 m)', category: 'Cables', quantity: 63, price: 12.5 },
  { id: 'hdmi', name: 'HDMI Cable (1 m)', category: 'Cables', quantity: 0, price: 9.75, notes: 'Out of stock' },
  { id: 'monitor', name: '27" Monitor', category: 'Displays', quantity: 5, price: 249 },
  { id: 'webcam', name: 'Webcam 1080p', category: 'Video', quantity: 0, price: 79.5, notes: 'Back order' }
];

/* The catalogue, and optionally a cart already stored against it. The app comes
 * back as the sandbox itself, so `app.localStorage` reaches what it wrote. */
function withCatalogue(cartLines) {
  const localStorage = createLocalStorage();
  seed(localStorage, CATALOGUE);
  if (cartLines) {
    localStorage.setItem('inventory.cart', JSON.stringify({ version: 1, lines: cartLines }));
  }
  return boot({ localStorage });
}

section('the lookup rules live in the data layer', () => {
  const app = boot({ localStorage: createLocalStorage() });
  const store = app.Inventory.items;
  const list = [
    { id: 'a', name: 'Café Grinder', category: 'Kitchen', quantity: 2, price: 10, notes: 'Burr' },
    { id: 'b', name: 'USB-C Cable', category: 'Cables', quantity: 5, price: 3, notes: '' },
    { id: 'c', name: 'Cable Tie', category: 'Cables', quantity: 5, price: 1, notes: 'Reusable' }
  ];

  check('an empty query keeps everything', store.search(list, {}).length === 3);
  check('a query of spaces keeps everything', store.search(list, { text: '   ' }).length === 3);
  check('the same products come back, in list order',
    store.search(list, { text: 'cable' }).map((i) => i.id).join(',') === 'b,c',
    store.search(list, { text: 'cable' }).map((i) => i.id).join(','));
  check('matching ignores case', store.search(list, { text: 'CABLE' }).length === 2);
  check('matching ignores accents',
    store.search(list, { text: 'cafe' }).map((i) => i.id).join(',') === 'a',
    store.search(list, { text: 'cafe' }).map((i) => i.id).join(','));
  check('the notes are searched too', store.search(list, { text: 'reusable' }).length === 1);
  check('every term has to match', store.search(list, { text: 'cable usb' }).length === 1);
  check('and in any order',
    store.search(list, { text: 'usb cable' }).map((i) => i.id).join(',') === 'b');
  check('a term nothing matches finds nothing',
    store.search(list, { text: 'cable zzz' }).length === 0);
  check('the category narrows the list', store.search(list, { category: 'Cables' }).length === 2);
  check('a category is matched whole, not as a prefix',
    store.search(list, { category: 'Cabl' }).length === 0);
  check('both filters together', store.search(list, { text: 'tie', category: 'Cables' }).length === 1);
  check('the numbers are not searched',
    store.search(list, { text: '5' }).length === 0);

  check('nonsense in place of a list is not a crash', store.search(null, { text: 'x' }).length === 0);
  check('nonsense in place of a query is not a crash', store.search(list, null).length === 3);

  check('the categories on offer are the ones in the list',
    store.categories(list).join(',') === 'Cables,Kitchen', store.categories(list).join(','));
  check('each category appears once',
    store.categories(list.concat(list)).length === 2);
  check('an empty list offers no categories', store.categories([]).length === 0);
  check('products with no category offer none',
    store.categories([{ id: 'x', name: 'Nameless', category: '' }]).length === 0);
});

section('the search box narrows the list', () => {
  const app = withCatalogue();
  const doc = app.document;

  check('the whole catalogue starts out',
    rowNames(doc).length === CATALOGUE.length, `got ${rowNames(doc).length}`);
  check('nothing is filtered, so there is no summary',
    summaryIn(doc) === '', summaryIn(doc));
  check('and nothing to clear', doc.getElementById('clear-filters').hidden === true);

  type(doc, 'search-input', 'cable');
  check('a word from the name matches',
    rowNames(doc).join('|') === 'USB-C Cable (2 m)|HDMI Cable (1 m)', rowNames(doc).join('|'));
  check('the count keeps reporting the inventory, not the view',
    countIn(doc) === '6 items', countIn(doc));
  check('the summary says how much of it is showing',
    summaryIn(doc) === 'Showing 2 of 6 items', summaryIn(doc));
  check('there is now something to clear',
    doc.getElementById('clear-filters').hidden === false);

  type(doc, 'search-input', 'CABLE');
  check('case does not matter', rowNames(doc).length === 2, rowNames(doc).join('|'));

  type(doc, 'search-input', '  mouse  ');
  check('surrounding spaces are ignored',
    rowNames(doc).join('|') === 'Wireless Mouse', rowNames(doc).join('|'));

  type(doc, 'search-input', 'brown');
  check('a word from the notes matches',
    rowNames(doc).join('|') === 'Mechanical Keyboard', rowNames(doc).join('|'));

  type(doc, 'search-input', 'accessories');
  check('a word from the category matches',
    rowNames(doc).length === 2, rowNames(doc).join('|'));

  type(doc, 'search-input', 'usb cable');
  check('terms may be typed in any order',
    rowNames(doc).join('|') === 'USB-C Cable (2 m)', rowNames(doc).join('|'));

  type(doc, 'search-input', '');
  check('emptying the box restores the list',
    rowNames(doc).length === CATALOGUE.length, `got ${rowNames(doc).length}`);
  check('and the summary goes away', summaryIn(doc) === '', summaryIn(doc));

  click(doc.getElementById('clear-filters'));
  check('clearing an empty lookup is harmless',
    rowNames(doc).length === CATALOGUE.length);
});

section('a lookup with no matches is not an empty inventory', () => {
  const app = withCatalogue();
  const doc = app.document;

  type(doc, 'search-input', 'zzz');
  check('no rows are drawn', rowsIn(doc).length === 0);
  check('the search is what is empty, and it says so',
    doc.getElementById('no-matches').hidden === false);
  check('in the words that were typed',
    doc.getElementById('no-matches').textContent.includes('zzz'),
    doc.getElementById('no-matches').textContent);
  check('"no items yet" is not shown', doc.getElementById('empty-state').hidden === true);
  check('the inventory still counts its products', countIn(doc) === '6 items', countIn(doc));
  check('the summary reads zero of six',
    summaryIn(doc) === 'Showing 0 of 6 items', summaryIn(doc));

  click(doc.getElementById('clear-filters'));
  check('clearing brings the list back', rowNames(doc).length === CATALOGUE.length);
  check('the message goes away', doc.getElementById('no-matches').hidden === true);
  check('and so does the button', doc.getElementById('clear-filters').hidden === true);

  /* The other empty page: no products at all, lookup or not. */
  const empty = createLocalStorage();
  seed(empty, []);
  const blank = boot({ localStorage: empty });
  check('an empty inventory shows the first-run message',
    blank.document.getElementById('empty-state').hidden === false);
  check('and not the no-matches one',
    blank.document.getElementById('no-matches').hidden === true);
});

section('the category picker filters, and keeps up with the list', () => {
  const app = withCatalogue();
  const doc = app.document;
  const select = doc.getElementById('category-filter');

  check('the picker offers the categories in the list, A to Z',
    categoryOptions(doc).join('|') === 'Accessories|Cables|Displays|Video',
    categoryOptions(doc).join('|'));
  check('led by the option that filters nothing',
    select.children[0].value === '' && /all categories/i.test(select.children[0].textContent));

  choose(doc, 'Cables');
  check('picking a category narrows the list',
    rowNames(doc).join('|') === 'USB-C Cable (2 m)|HDMI Cable (1 m)', rowNames(doc).join('|'));
  check('the summary follows', summaryIn(doc) === 'Showing 2 of 6 items', summaryIn(doc));

  type(doc, 'search-input', 'hdmi');
  check('the two filters combine', rowNames(doc).join('|') === 'HDMI Cable (1 m)',
    rowNames(doc).join('|'));
  check('typing does not disturb the picker', select.value === 'Cables', select.value);
  check('and the picker still offers every category',
    categoryOptions(doc).length === 4, categoryOptions(doc).join('|'));

  choose(doc, '');
  check('going back to all categories restores the search matches',
    rowNames(doc).length === 1, rowNames(doc).join('|'));
  check('the search itself is untouched by the picker',
    doc.getElementById('search-input').value === 'hdmi');

  type(doc, 'search-input', 'zzz');
  check('a filter can match nothing at all', rowsIn(doc).length === 0);
  check('and says which category it looked in',
    doc.getElementById('no-matches').textContent.includes('zzz'),
    doc.getElementById('no-matches').textContent);
});

section('a category that is gone cannot stay selected', () => {
  const localStorage = createLocalStorage();
  seed(localStorage, [
    { id: 'only', name: 'Widget', category: 'Parts', quantity: 1, price: 2 }
  ]);
  const app = boot({ localStorage });
  const doc = app.document;
  const select = doc.getElementById('category-filter');

  choose(doc, 'Parts');
  check('the category filters', rowNames(doc).length === 1);

  /* The last product leaves the category: the filter is now pointing at
   * something the picker no longer offers. */
  app.Inventory.items.update('only', { category: 'Kits' });

  check('the picker drops the category that went away',
    categoryOptions(doc).join('|') === 'Kits', categoryOptions(doc).join('|'));
  check('and falls back to filtering nothing', select.value === '', select.value);
  check('so the list is not left mysteriously empty',
    rowNames(doc).join('|') === 'Widget', rowNames(doc).join('|'));
  check('nor is anything reported as hidden',
    summaryIn(doc) === '' && doc.getElementById('clear-filters').hidden === true);
});

section('a lookup survives edits and deletes', () => {
  const app = withCatalogue();
  const doc = app.document;
  const store = app.Inventory.items;

  type(doc, 'search-input', 'cable');
  check('two products match to start with', rowNames(doc).length === 2);

  store.update('usb', { name: 'USB-C Cable (3 m)' });
  check('an edit that still matches keeps its row',
    rowNames(doc).length === 2, rowNames(doc).join('|'));

  /* Out of both the name and the category: "cable" is a word in the category
   * too, so renaming alone would leave it matching. */
  store.update('usb', { name: 'Charger', category: 'Power' });
  check('an edit that no longer matches drops out',
    rowNames(doc).join('|') === 'HDMI Cable (1 m)', rowNames(doc).join('|'));
  check('the search itself is still there',
    doc.getElementById('search-input').value === 'cable');

  store.remove('hdmi');
  check('deleting the last match leaves none', rowsIn(doc).length === 0);
  check('which is explained, not just blank',
    doc.getElementById('no-matches').hidden === false);
  check('and the inventory count follows',
    countIn(doc) === `${store.all().length} items`, countIn(doc));
});

section('adding a product while a lookup is on', () => {
  const app = withCatalogue();
  const doc = app.document;
  const store = app.Inventory.items;

  type(doc, 'search-input', 'cable');

  click(doc.getElementById('add-item'));
  fillForm(doc, { 'field-name': 'Cable Tie', 'field-category': 'Cables' });
  submit(doc.getElementById('item-form'));

  check('a new product that matches shows up',
    rowNames(doc).includes('Cable Tie'), rowNames(doc).join('|'));
  check('the lookup the user set is not thrown away',
    doc.getElementById('search-input').value === 'cable');
  check('the summary counts it', summaryIn(doc) === 'Showing 3 of 7 items', summaryIn(doc));

  click(doc.getElementById('add-item'));
  fillForm(doc, { 'field-name': 'Stapler', 'field-category': 'Office' });
  submit(doc.getElementById('item-form'));

  check('one that does not match stays hidden',
    rowNames(doc).includes('Stapler') === false, rowNames(doc).join('|'));
  check('but is counted, so the add is not invisible',
    countIn(doc) === '8 items' && summaryIn(doc) === 'Showing 3 of 8 items',
    `${countIn(doc)} / ${summaryIn(doc)}`);
  check('it is in the inventory all the same',
    store.all().some((i) => i.name === 'Stapler'));
  check('and its new category joins the picker',
    categoryOptions(doc).includes('Office'), categoryOptions(doc).join('|'));

  click(doc.getElementById('clear-filters'));
  check('clearing shows everything that was added',
    rowNames(doc).length === 8, `got ${rowNames(doc).length}`);
});

section('keyboard: / to search, Escape to clear it', () => {
  const app = withCatalogue();
  const doc = app.document;
  const search = doc.getElementById('search-input');

  search.focused = false;
  const pressSlash = press(doc, doc.body, '/');
  check('"/" puts the caret in the search box', search.focused === true);
  check('and the page takes the key, so the browser does not',
    pressSlash.defaultPrevented === true);

  type(doc, 'search-input', 'cable');
  check('the list is filtered', rowNames(doc).length === 2);

  press(doc, search, 'Escape');
  check('Escape empties the box', search.value === '', search.value);
  check('and the list with it', rowNames(doc).length === CATALOGUE.length);
  press(doc, search, 'Escape');
  check('Escape on an empty box does nothing', search.value === '');

  /* "/" in a field is a character, not a shortcut — and a dialog's fields are
   * a field. */
  click(doc.getElementById('add-item'));
  search.focused = false;
  const notes = doc.getElementById('field-notes');
  const inField = press(doc, notes, '/');
  check('"/" typed into a form field stays a character',
    search.focused === false && inField.defaultPrevented === false);

  const onBody = press(doc, doc.body, '/');
  check('and it does not reach through an open dialog',
    search.focused === false && onBody.defaultPrevented === false);
  click(doc.getElementById('form-cancel'));

  search.focused = false;
  check('but it works again once the dialog is closed',
    press(doc, doc.body, '/').defaultPrevented === true && search.focused === true);
});

/* -------------------------------------------------------------- the cart */

section('the cart is wired up, and starts empty', () => {
  const app = withCatalogue();
  const doc = app.document;

  check('Inventory.cart is there', typeof app.Inventory.cart === 'object');
  for (const fn of ['load', 'all', 'get', 'add', 'setQuantity', 'remove', 'clear', 'detail', 'subscribe']) {
    check(`Inventory.cart.${fn}`, typeof app.Inventory.cart[fn] === 'function');
  }
  check('storage can open a second collection',
    typeof app.Inventory.storage.collection === 'function');

  check('no lines are drawn', cartRows(doc).length === 0);
  check('the count reads "0 items"', cartCountIn(doc) === '0 items', cartCountIn(doc));
  check('the empty state is shown', doc.getElementById('cart-empty').hidden === false);
  check('there is no total to show', doc.getElementById('cart-total-row').hidden === true);
  check('and nothing to clear', doc.getElementById('cart-clear').hidden === true);
  check('nothing was written to storage', storedCart(app.localStorage) === null);
});

section('adding a product from its row', () => {
  const app = withCatalogue();
  const doc = app.document;
  const row = rowFor(doc, 'mouse');

  check('every row offers it', actionIn(row, 'cart') !== null);
  check('the button is not a submit button', actionIn(row, 'cart').type === 'button');
  check('and it names the product it would add',
    actionIn(row, 'cart').getAttribute('aria-label') === 'Add Wireless Mouse to cart',
    actionIn(row, 'cart').getAttribute('aria-label'));

  click(actionIn(row, 'cart'));

  check('a line is drawn', cartRows(doc).length === 1, `got ${cartRows(doc).length}`);
  check('named after the product', cartNames(doc).join('|') === 'Wireless Mouse',
    cartNames(doc).join('|'));
  check('showing its unit price',
    field(cartRowFor(doc, 'mouse'), 'cart-unit') === '$29.99 each',
    field(cartRowFor(doc, 'mouse'), 'cart-unit'));
  check('and what the line comes to',
    field(cartRowFor(doc, 'mouse'), 'cart-subtotal') === '$29.99');
  check('the count reads "1 item"', cartCountIn(doc) === '1 item', cartCountIn(doc));
  check('the total follows', cartTotalIn(doc) === '$29.99', cartTotalIn(doc));
  check('the empty state goes away', doc.getElementById('cart-empty').hidden === true);
  check('the total row appears', doc.getElementById('cart-total-row').hidden === false);
  check('and there is now something to clear',
    doc.getElementById('cart-clear').hidden === false);

  check('the line is persisted', storedCart(app.localStorage).lines[0].itemId === 'mouse');
  check('with its quantity', storedCart(app.localStorage).lines[0].quantity === 1);
  check('under its own key, not the inventory one',
    storedCart(app.localStorage).version === 1 && stored(app.localStorage).items.length === 6);
  check('the inventory is untouched', countIn(doc) === '6 items', countIn(doc));

  addToCart(doc, 'mouse');
  check('adding again grows the same line', cartRows(doc).length === 1);
  check('to two', quantityIn(doc, 'mouse') === '2', quantityIn(doc, 'mouse'));
  check('which the subtotal follows',
    field(cartRowFor(doc, 'mouse'), 'cart-subtotal') === '$59.98');
  check('and so does the total', cartTotalIn(doc) === '$59.98', cartTotalIn(doc));
  check('the count reads "2 items"', cartCountIn(doc) === '2 items', cartCountIn(doc));
  check('storage holds the new number', storedCart(app.localStorage).lines[0].quantity === 2);

  addToCart(doc, 'keyboard');
  check('a second product gets its own line', cartRows(doc).length === 2);
  check('in the order they were added', cartNames(doc).join('|') === 'Wireless Mouse|Mechanical Keyboard',
    cartNames(doc).join('|'));
  check('the total adds both up', cartTotalIn(doc) === '$178.98', cartTotalIn(doc));
  check('the count counts what would be taken',
    cartCountIn(doc) === '3 items', cartCountIn(doc));
});

section('a cart line points at a product rather than copying it', () => {
  const app = withCatalogue();
  const doc = app.document;
  addToCart(doc, 'mouse');

  app.Inventory.items.update('mouse', { price: 10 });
  check('a price change moves the line', field(cartRowFor(doc, 'mouse'), 'cart-unit') === '$10.00 each',
    field(cartRowFor(doc, 'mouse'), 'cart-unit'));
  check('and the subtotal', field(cartRowFor(doc, 'mouse'), 'cart-subtotal') === '$10.00');
  check('and the total', cartTotalIn(doc) === '$10.00', cartTotalIn(doc));

  app.Inventory.items.update('mouse', { name: 'Wireless Mouse (black)' });
  check('a rename shows up in the cart',
    cartNames(doc).join('|') === 'Wireless Mouse (black)', cartNames(doc).join('|'));

  check('the line survives an edit that is not about it',
    storedCart(app.localStorage).lines.length === 1);
});

section('changing quantities', () => {
  const app = withCatalogue();
  const doc = app.document;
  const note = cartNoteIn(doc);
  addToCart(doc, 'mouse', 2);

  click(actionIn(cartRowFor(doc, 'mouse'), 'increase'));
  check('"+" adds one', quantityIn(doc, 'mouse') === '3', quantityIn(doc, 'mouse'));
  check('the subtotal follows',
    field(cartRowFor(doc, 'mouse'), 'cart-subtotal') === '$89.97',
    field(cartRowFor(doc, 'mouse'), 'cart-subtotal'));

  click(actionIn(cartRowFor(doc, 'mouse'), 'decrease'));
  check('"−" takes one back', quantityIn(doc, 'mouse') === '2', quantityIn(doc, 'mouse'));

  typeQuantity(doc, 'mouse', 5);
  check('a typed number is taken', quantityIn(doc, 'mouse') === '5', quantityIn(doc, 'mouse'));
  check('the total follows', cartTotalIn(doc) === '$149.95', cartTotalIn(doc));
  check('and it is persisted', storedCart(app.localStorage).lines[0].quantity === 5);

  /* Stock on hand for the mouse is 24. */
  typeQuantity(doc, 'mouse', 99);
  check('a number above the stock is capped', quantityIn(doc, 'mouse') === '24',
    quantityIn(doc, 'mouse'));
  check('and the cap is explained',
    /only 24/i.test(note.textContent), note.textContent);
  check('the note is visible', note.hidden === false);
  check('the total is the capped one', cartTotalIn(doc) === '$719.76', cartTotalIn(doc));
  check('storage holds the capped one too',
    storedCart(app.localStorage).lines[0].quantity === 24);

  const minus = actionIn(cartRowFor(doc, 'mouse'), 'decrease');
  check('"+" is disabled at the stock on hand',
    actionIn(cartRowFor(doc, 'mouse'), 'increase').disabled === true);
  check('"−" is not', minus.disabled === false);

  /* A cleared or unusable field is not a request for zero: it is a field the
   * user emptied and left, so the stored number goes back in the box. */
  typeQuantity(doc, 'mouse', '');
  check('an emptied field does not empty the line', cartRows(doc).length === 1);
  check('the stored number comes back', quantityIn(doc, 'mouse') === '24',
    quantityIn(doc, 'mouse'));
  typeQuantity(doc, 'mouse', 0);
  check('nor does a typed zero', quantityIn(doc, 'mouse') === '24', quantityIn(doc, 'mouse'));

  typeQuantity(doc, 'mouse', 1);
  click(actionIn(cartRowFor(doc, 'mouse'), 'decrease'));
  check('"−" past one takes the line out', cartRows(doc).length === 0);
  check('the empty state returns', doc.getElementById('cart-empty').hidden === false);
  check('the total row goes', doc.getElementById('cart-total-row').hidden === true);
  check('storage is emptied with it', storedCart(app.localStorage).lines.length === 0);
  check('and the note from before is cleared', note.hidden === true);
});

section('a product with no stock cannot be added', () => {
  const app = withCatalogue();
  const doc = app.document;
  const note = cartNoteIn(doc);

  check('the row button is disabled for an out-of-stock product',
    actionIn(rowFor(doc, 'hdmi'), 'cart').disabled === true);
  check('and enabled for one in stock',
    actionIn(rowFor(doc, 'mouse'), 'cart').disabled === false);

  /* A button can only go stale; the store refuses regardless, so a row drawn
   * before the stock ran out cannot put products that are not there in the
   * cart. */
  check('the store refuses it', app.Inventory.cart.add('hdmi', 1) === null);
  check('nothing was added', cartRows(doc).length === 0);
  check('a product that is not in the inventory is refused too',
    app.Inventory.cart.add('no-such-product') === null);

  click(actionIn(rowFor(doc, 'hdmi'), 'cart'));
  check('clicking anyway explains why', /out of stock/i.test(note.textContent), note.textContent);
  check('and still adds nothing', cartRows(doc).length === 0);
});

section('the row stops offering what the cart already holds', () => {
  const app = withCatalogue();
  const doc = app.document;
  const note = cartNoteIn(doc);

  addToCart(doc, 'keyboard', 6); // the whole stock
  check('six clicks put six in the cart', quantityIn(doc, 'keyboard') === '6',
    quantityIn(doc, 'keyboard'));
  check('which is all of it', cartCountIn(doc) === '6 items', cartCountIn(doc));
  check('so the row button is disabled', actionIn(rowFor(doc, 'keyboard'), 'cart').disabled === true);
  check('and says why', /no more in stock/i.test(actionIn(rowFor(doc, 'keyboard'), 'cart').title || ''),
    actionIn(rowFor(doc, 'keyboard'), 'cart').title);

  click(actionIn(rowFor(doc, 'keyboard'), 'cart'));
  check('clicking anyway says so', /already has all 6/i.test(note.textContent), note.textContent);
  check('and adds nothing', quantityIn(doc, 'keyboard') === '6');

  addToCart(doc, 'usb');
  check('another product is unaffected', actionIn(rowFor(doc, 'usb'), 'cart').disabled === false);
});

section('removing lines, and clearing the cart', () => {
  const app = withCatalogue();
  const doc = app.document;
  const confirm = doc.getElementById('confirm-dialog');
  const message = doc.getElementById('confirm-message');

  addToCart(doc, 'mouse');
  addToCart(doc, 'keyboard');
  check('two lines to start with', cartRows(doc).length === 2);

  click(actionIn(cartRowFor(doc, 'mouse'), 'remove'));
  check('the line goes', cartRowFor(doc, 'mouse') === undefined);
  check('the other stays', cartNames(doc).join('|') === 'Mechanical Keyboard',
    cartNames(doc).join('|'));
  check('the total drops to what is left', cartTotalIn(doc) === '$119.00', cartTotalIn(doc));
  check('the count follows', cartCountIn(doc) === '1 item', cartCountIn(doc));
  check('and storage with it', storedCart(app.localStorage).lines.length === 1);
  check('removing a line does not ask first', confirm.open === false);

  click(doc.getElementById('cart-clear'));
  check('clearing the cart does ask', confirm.open === true);
  check('and says what it will do', /cart/i.test(message.textContent), message.textContent);
  check('the button is labelled for it',
    doc.getElementById('confirm-delete').textContent === 'Clear cart');
  check('nothing is gone yet', cartRows(doc).length === 1);

  click(doc.getElementById('confirm-cancel'));
  check('cancelling keeps the cart', cartRows(doc).length === 1);
  check('and the products are still in storage',
    storedCart(app.localStorage).lines.length === 1);

  click(doc.getElementById('cart-clear'));
  click(doc.getElementById('confirm-delete'));
  check('confirming empties it', cartRows(doc).length === 0);
  check('the empty state comes back', doc.getElementById('cart-empty').hidden === false);
  check('the total row goes', doc.getElementById('cart-total-row').hidden === true);
  check('the clear button goes too', doc.getElementById('cart-clear').hidden === true);
  check('and storage is emptied', storedCart(app.localStorage).lines.length === 0);
  check('while the inventory is untouched', app.Inventory.items.all().length === CATALOGUE.length);

  /* The dialog is shared, so emptying the cart must not leave its wording
   * behind for the next product deletion. */
  click(actionIn(rowFor(doc, 'usb'), 'delete'));
  check('deleting a product gets its own wording back',
    doc.getElementById('confirm-dialog-title').textContent === 'Delete item',
    doc.getElementById('confirm-dialog-title').textContent);
  check('and its own button',
    doc.getElementById('confirm-delete').textContent === 'Delete');
  click(doc.getElementById('confirm-cancel'));
});

section('the cart is still there after a reload', () => {
  const localStorage = createLocalStorage();
  seed(localStorage, CATALOGUE);

  const first = boot({ localStorage });
  addToCart(first.document, 'mouse', 2);
  addToCart(first.document, 'usb');

  const second = boot({ localStorage });
  const doc = second.document;

  check('the lines come back', cartRows(doc).length === 2, `got ${cartRows(doc).length}`);
  check('in the order they were added',
    cartNames(doc).join('|') === 'Wireless Mouse|USB-C Cable (2 m)', cartNames(doc).join('|'));
  check('with their quantities', quantityIn(doc, 'mouse') === '2', quantityIn(doc, 'mouse'));
  check('the count is rebuilt', cartCountIn(doc) === '3 items', cartCountIn(doc));
  check('and the total', cartTotalIn(doc) === '$72.48', cartTotalIn(doc));
  check('nothing was written back on a read',
    storedCart(localStorage).lines.length === 2);
});

section('a product deleted while it is in the cart', () => {
  const app = withCatalogue();
  const doc = app.document;
  const stale = doc.getElementById('cart-stale');

  addToCart(doc, 'mouse');
  addToCart(doc, 'keyboard');
  app.Inventory.items.remove('mouse');

  check('the line is kept, not quietly dropped', cartRows(doc).length === 2,
    `got ${cartRows(doc).length}`);
  check('and says what became of it',
    field(cartRowFor(doc, 'mouse'), 'cart-name') === 'No longer in your inventory',
    field(cartRowFor(doc, 'mouse'), 'cart-name'));
  check('it is drawn as gone',
    String(field(cartRowFor(doc, 'mouse'), 'cart-name')) !== '' &&
    cartRowFor(doc, 'mouse').find((n) => String(n.className).split(/\s+/).includes('is-gone')) !== null);
  check('there is no quantity to change',
    actionIn(cartRowFor(doc, 'mouse'), 'increase') === null);
  check('and nothing to price', field(cartRowFor(doc, 'mouse'), 'cart-subtotal') === null);
  check('but it can be taken out by hand',
    actionIn(cartRowFor(doc, 'mouse'), 'remove') !== null);
  check('the cart says one is missing',
    /no longer in your inventory/i.test(stale.textContent), stale.textContent);
  check('it is left out of the total', cartTotalIn(doc) === '$119.00', cartTotalIn(doc));
  check('and out of the count', cartCountIn(doc) === '1 item', cartCountIn(doc));

  click(actionIn(cartRowFor(doc, 'mouse'), 'remove'));
  check('removing it clears the notice', stale.hidden === true);
  check('and leaves the other line', cartNames(doc).join('|') === 'Mechanical Keyboard');
});

section('a cart line that outlives a stock change', () => {
  const app = withCatalogue();
  const doc = app.document;

  addToCart(doc, 'monitor', 5); // the whole stock, at $249 each
  check('the whole stock is in the cart', quantityIn(doc, 'monitor') === '5');
  check('and the total is all of it', cartTotalIn(doc) === '$1245.00', cartTotalIn(doc));

  app.Inventory.items.update('monitor', { quantity: 2 });
  check('the number in the cart is left alone', quantityIn(doc, 'monitor') === '5',
    quantityIn(doc, 'monitor'));
  check('but the line says there is less than that',
    field(cartRowFor(doc, 'monitor'), 'cart-meta') === 'Only 2 in stock',
    field(cartRowFor(doc, 'monitor'), 'cart-meta'));
  check('and it is still priced for what is in it',
    cartTotalIn(doc) === '$1245.00', cartTotalIn(doc));

  app.Inventory.items.update('monitor', { quantity: 0 });
  check('down to nothing reads as words',
    field(cartRowFor(doc, 'monitor'), 'cart-meta') === 'Out of stock',
    field(cartRowFor(doc, 'monitor'), 'cart-meta'));
  check('the row will not add more', actionIn(rowFor(doc, 'monitor'), 'cart').disabled === true);

  typeQuantity(doc, 'monitor', 1);
  check('a typed number is still capped at nothing', quantityIn(doc, 'monitor') === '1',
    quantityIn(doc, 'monitor'));
});

section('a lookup narrows the list, never the cart', () => {
  const app = withCatalogue();
  const doc = app.document;
  addToCart(doc, 'mouse');

  type(doc, 'search-input', 'zzz');
  check('the row is filtered away', rowFor(doc, 'mouse') === undefined);
  check('the cart line is not', cartNames(doc).join('|') === 'Wireless Mouse',
    cartNames(doc).join('|'));
  check('and it still knows what the product costs', cartTotalIn(doc) === '$29.99',
    cartTotalIn(doc));

  type(doc, 'search-input', '');
  check('the row comes back with the cart intact',
    actionIn(rowFor(doc, 'mouse'), 'cart').disabled === false);
  check('still one line', cartRows(doc).length === 1);
});

section('junk in the stored cart is repaired', () => {
  const app = withCatalogue([
    { itemId: 'mouse', quantity: 2 },
    { itemId: 'mouse', quantity: 3 },        // the same product twice
    { itemId: 'usb', quantity: -4 },         // not a number of anything
    { itemId: 'keyboard', quantity: 1.7 },   // not a whole one
    { itemId: '', quantity: 4 },             // no product at all
    null,
    'nonsense',
    { itemId: 'ghost', quantity: 2 }         // a product that is not in the list
  ]);
  const doc = app.document;

  check('a line per product, in the order they first appear',
    cartNames(doc).join('|') === 'Wireless Mouse|Mechanical Keyboard|No longer in your inventory',
    cartNames(doc).join('|'));
  check('two lines for one product are added up', quantityIn(doc, 'mouse') === '5',
    quantityIn(doc, 'mouse'));
  check('a fractional quantity truncates', quantityIn(doc, 'keyboard') === '1',
    quantityIn(doc, 'keyboard'));
  check('a line with no product is dropped', cartRowFor(doc, '') === undefined);
  check('one pointing outside the inventory is flagged',
    /no longer in your inventory/i.test(doc.getElementById('cart-stale').textContent));
  check('and left out of the total', cartTotalIn(doc) === '$268.95', cartTotalIn(doc));
  check('while the rest is still priced', cartCountIn(doc) === '6 items', cartCountIn(doc));
});

section('a corrupt cart blob degrades to empty, does not throw', () => {
  const cases = [
    ['not json', '}{'],
    ['json but not an object', '"hello"'],
    ['missing the lines array', '{"version":1}'],
    ['lines is not an array', '{"version":1,"lines":"nope"}'],
    ['null envelope', 'null']
  ];
  for (const [label, raw] of cases) {
    const localStorage = createLocalStorage();
    seed(localStorage, CATALOGUE);
    localStorage.setItem('inventory.cart', raw);
    const app = boot({ localStorage });

    check(label, cartRows(app.document).length === 0, `${cartRows(app.document).length} lines`);
    check(`${label}: the inventory still renders`,
      rowNames(app.document).length === CATALOGUE.length);
    check(`${label}: the unreadable blob is left alone`,
      localStorage.getItem('inventory.cart') === raw);
  }
});

section('a cart the browser refused to save is reported', () => {
  const localStorage = createQuotaStorage();
  seed(localStorage, CATALOGUE);
  const app = boot({ localStorage });
  const doc = app.document;
  const warning = doc.getElementById('save-warning');

  check('there is nothing to warn about yet', warning.hidden === true);

  localStorage.full = true;
  addToCart(doc, 'mouse');
  check('the line is on the page', cartRows(doc).length === 1);
  check('with a total', cartTotalIn(doc) === '$29.99');
  check('the warning is shown', warning.hidden === false);
  check('it says the change was not saved', /refused to save/i.test(warning.textContent),
    warning.textContent);
  /* The very first cart write is the one that failed, so there is no blob at
   * all rather than an empty one. */
  check('and it did not reach storage', storedCart(localStorage) === null,
    JSON.stringify(storedCart(localStorage)));

  localStorage.full = false;
  addToCart(doc, 'mouse');
  check('a later save clears the warning', warning.hidden === true);
  check('and the whole cart is written',
    storedCart(localStorage).lines[0].quantity === 2);
});

section('cart controls say which product they act on', () => {
  const app = withCatalogue();
  const doc = app.document;
  addToCart(doc, 'mouse');
  const line = cartRowFor(doc, 'mouse');

  check('"+" names the product',
    actionIn(line, 'increase').getAttribute('aria-label') === 'Add one more Wireless Mouse',
    actionIn(line, 'increase').getAttribute('aria-label'));
  check('"−" names it too',
    actionIn(line, 'decrease').getAttribute('aria-label') === 'Take one Wireless Mouse',
    actionIn(line, 'decrease').getAttribute('aria-label'));
  check('the quantity field is labelled',
    quantityField(doc, 'mouse').getAttribute('aria-label') === 'Quantity of Wireless Mouse');
  check('the field is a number field', quantityField(doc, 'mouse').type === 'number');
  check('Remove names the product',
    actionIn(line, 'remove').textContent === 'Remove Wireless Mouse',
    actionIn(line, 'remove').textContent);
  check('with the visible label kept short',
    actionIn(line, 'remove').children[0].className === 'visually-hidden');
  check('and the buttons are not submit buttons',
    actionIn(line, 'increase').type === 'button' && actionIn(line, 'remove').type === 'button');
});

section('the caret stays on the control that was used', () => {
  /* A render replaces every node it draws, so without putting the caret back a
   * stepper drops focus on each click and cannot be used from the keyboard. */
  const app = withCatalogue();
  const doc = app.document;
  const note = cartNoteIn(doc);
  addToCart(doc, 'mouse');

  click(actionIn(cartRowFor(doc, 'mouse'), 'increase'));
  const plus = actionIn(cartRowFor(doc, 'mouse'), 'increase');
  check('"+" holds the caret after the redraw', plus.focused === true);

  click(actionIn(cartRowFor(doc, 'mouse'), 'decrease'));
  check('"−" takes it when that is what was clicked',
    actionIn(cartRowFor(doc, 'mouse'), 'decrease').focused === true);
  check('and "+" does not keep it', actionIn(cartRowFor(doc, 'mouse'), 'increase').focused === false);

  typeQuantity(doc, 'mouse', 7);
  check('a committed quantity keeps the caret in the field',
    quantityField(doc, 'mouse').focused === true);
  check('and the field shows what was taken', quantityIn(doc, 'mouse') === '7');

  typeQuantity(doc, 'mouse', 99);
  check('a capped quantity stays in the field too',
    quantityField(doc, 'mouse').focused === true && quantityIn(doc, 'mouse') === '24');
  check('and the note is cleared by the next change that works',
    note.hidden === false && /only 24/i.test(note.textContent));

  /* The "+" that reaches the stock on hand disables itself, and a disabled
   * button cannot hold the caret. */
  typeQuantity(doc, 'mouse', 23);
  click(actionIn(cartRowFor(doc, 'mouse'), 'increase'));
  check('the "+" that ran out of stock is disabled',
    actionIn(cartRowFor(doc, 'mouse'), 'increase').disabled === true);
  check('so the caret lands on the number it just changed',
    quantityField(doc, 'mouse').focused === true);
  check('and the note from the cap is gone', note.hidden === true);
});

/* Which control is holding the caret, and a way to start from none. The stub
 * never clears the flag on its own — the real DOM only ever has one — so the
 * walk takes the deepest and the test clears them all before it acts. */
function caretIn(doc) {
  let hit = null;
  (function walk(node) {
    if (node.focused && hit === null) hit = node;
    node.children.forEach(walk);
  })(doc.body);
  return hit;
}

function dropCaret(doc) {
  (function walk(node) {
    node.focused = false;
    node.children.forEach(walk);
  })(doc.body);
}

section('a redraw hands the caret to a control that survived it', () => {
  /* A stepper is not the only thing a redraw replaces. Every row button and
   * every cart control is drawn again by the change it causes, so each of them
   * has to name where the caret goes — otherwise it falls to the body and the
   * next Tab starts the page from the top, which is what makes a list
   * unusable from the keyboard. */
  const app = withCatalogue();
  const doc = app.document;
  const add = doc.getElementById('add-item');

  dropCaret(doc);
  click(actionIn(rowFor(doc, 'mouse'), 'cart'));
  check('Add to cart keeps the caret on the button that was pressed',
    caretIn(doc) === actionIn(rowFor(doc, 'mouse'), 'cart'));

  /* The click that fills the cart disables the row's own button, and a disabled
   * button cannot take the caret — so it goes to the number it just filled. */
  addToCart(doc, 'monitor', 4); // five in stock
  dropCaret(doc);
  click(actionIn(rowFor(doc, 'monitor'), 'cart'));
  check('the click that fills the cart disables the row button',
    actionIn(rowFor(doc, 'monitor'), 'cart').disabled === true);
  check('so the caret lands on the number it just filled',
    caretIn(doc) === quantityField(doc, 'monitor'));

  dropCaret(doc);
  click(actionIn(cartRowFor(doc, 'mouse'), 'remove'));
  check('removing a line hands the caret to the row the line came from',
    caretIn(doc) === actionIn(rowFor(doc, 'mouse'), 'cart'));
  check('which is where the product can be put back', cartRowFor(doc, 'mouse') === undefined);

  /* The three confirmed actions all destroy the button that was pressed, since
     the dialog closes over the redraw they cause. */
  dropCaret(doc);
  click(actionIn(rowFor(doc, 'usb'), 'delete'));
  click(doc.getElementById('confirm-delete'));
  check('deleting a product lands the caret on something still on the page',
    caretIn(doc) === add, caretIn(doc) && caretIn(doc).id);

  addToCart(doc, 'mouse');
  dropCaret(doc);
  click(doc.getElementById('cart-clear'));
  click(doc.getElementById('confirm-delete'));
  check('emptying the cart does too', caretIn(doc) === add);

  addToCart(doc, 'mouse');
  dropCaret(doc);
  checkOut(doc);
  check('and so does checking out', caretIn(doc) === add);

  /* Never the body: that is the state this is all here to avoid. */
  check('the caret was never dropped on the page itself',
    caretIn(doc) !== doc.body && caretIn(doc) !== null);
});

section('a control the redraw drew away is passed over', () => {
  /* The keys are tried in order, so the reason a control cannot take the caret
   * is the thing that decides where it goes — and a node the last render
   * detached must be skipped rather than focused into nothing. */
  const app = withCatalogue();
  const doc = app.document;
  const stale = actionIn(rowFor(doc, 'mouse'), 'cart');

  type(doc, 'search-input', 'zzz'); // the row goes, so its button does too
  check('the row was filtered out', rowFor(doc, 'mouse') === undefined);
  check('and its button is detached', stale.isConnected === false);

  app.Inventory.cart.add('mouse', 1);
  check('the page still has a caret to place', caretIn(doc) !== doc.body);
});

/* ---------------------------------------------------------- checking out */

section('the order history is wired up, and starts empty', () => {
  const app = withCatalogue();
  const doc = app.document;

  check('Inventory.orders is there', typeof app.Inventory.orders === 'object');
  for (const fn of ['load', 'all', 'get', 'add', 'detail', 'plan', 'checkout', 'subscribe']) {
    check(`Inventory.orders.${fn}`, typeof app.Inventory.orders[fn] === 'function');
  }

  check('no orders are drawn', orderRows(doc).length === 0);
  check('the count reads "0 orders"', orderCountIn(doc) === '0 orders', orderCountIn(doc));
  check('the empty state is shown', doc.getElementById('orders-empty').hidden === false);
  check('nothing was written to storage', storedOrders(app.localStorage) === null);
  check('the inventory was not touched by any of it',
    stored(app.localStorage).items.length === CATALOGUE.length);
});

section('the cart offers checkout only when there is something in it', () => {
  const app = withCatalogue();
  const doc = app.document;

  check('an empty cart has nothing to check out', checkoutButton(doc).hidden === true);
  /* This one is static markup rather than a node the script builds, so the
     assertion is against index.html — the stub does not read attributes off
     the page. */
  check('and is not a submit button',
    /<button[^>]*id="cart-checkout"[^>]*\btype="button"/.test(html));

  addToCart(doc, 'mouse');
  check('a line puts the button there', checkoutButton(doc).hidden === false);

  click(actionIn(cartRowFor(doc, 'mouse'), 'remove'));
  check('emptying the cart takes it away again', checkoutButton(doc).hidden === true);
});

section('the checkout rules live in the data layer', () => {
  /* `plan` takes both lists rather than reading the stores, so every rule about
   * what may be sold can be exercised here without a page. */
  const app = boot({ localStorage: createLocalStorage() });
  const plan = app.Inventory.orders.plan;
  const products = [
    { id: 'a', name: 'Widget', quantity: 5, price: 2.5 },
    { id: 'b', name: 'Sprocket', quantity: 0, price: 1 }
  ];

  check('an empty cart is refused', plan([], products).ok === false);
  check('and says there was nothing in it', plan([], products).reason === 'empty');

  const good = plan([{ itemId: 'a', quantity: 2 }], products);
  check('a cart that can be fulfilled goes through', good.ok === true);
  check('the receipt copies the name', good.order.entries[0].name === 'Widget');
  check('and the price', good.order.entries[0].price === 2.5);
  check('and the count', good.order.entries[0].quantity === 2);
  check('the line is priced', good.order.entries[0].subtotal === 5);
  check('the total is the sum of the lines', good.detail.total === 5, String(good.detail.total));
  check('the count is everything sold', good.detail.count === 2);
  check('the order is stamped', !Number.isNaN(Date.parse(good.order.at)));
  check('and carries an id', typeof good.order.id === 'string' && good.order.id !== '');

  const gone = plan([{ itemId: 'ghost', quantity: 1 }], products);
  check('a line pointing at nothing blocks the sale',
    gone.ok === false && gone.reason === 'blocked');
  check('and is reported as missing', gone.blocked[0].problem === 'missing');

  const none = plan([{ itemId: 'b', quantity: 1 }], products);
  check('a product with no stock blocks it', none.reason === 'blocked');
  check('and says how much there is', none.blocked[0].available === 0);

  const over = plan([{ itemId: 'a', quantity: 9 }], products);
  check('more than there is blocks it', over.reason === 'blocked');
  check('and says how much there is', over.blocked[0].available === 5);

  check('planning changes nothing',
    products[0].quantity === 5 && products[1].quantity === 0);

  const both = plan([
    { itemId: 'a', quantity: 9 },
    { itemId: 'ghost', quantity: 1 }
  ], products);
  check('every line in the way is reported, not just the first',
    both.blocked.length === 2, String(both.blocked.length));

  check('nonsense in place of the lists is not a crash', plan(null, null).reason === 'empty');
  check('a cart of nothing but junk is empty, not blocked',
    plan([null, { itemId: 'a', quantity: 0 }], products).reason === 'empty');
});

section('an order adds up from its own lines', () => {
  const app = boot({ localStorage: createLocalStorage() });
  const detail = app.Inventory.orders.detail;
  const order = {
    id: 'o',
    at: '2026-01-02T03:04:05.000Z',
    entries: [
      { itemId: 'a', name: 'Widget', price: 2.5, quantity: 3 },
      { itemId: 'b', name: 'Sprocket', price: 0.1, quantity: 3 }
    ]
  };

  check('the total adds the lines up', detail(order).total === 7.8, String(detail(order).total));
  check('the count adds the quantities up', detail(order).count === 6, String(detail(order).count));
  check('each line is priced', detail(order).entries[0].subtotal === 7.5);
  check('a subtotal on a fraction of a cent is rounded',
    detail(order).entries[1].subtotal === 0.3, String(detail(order).entries[1].subtotal));

  check('a line with no name is dropped',
    detail({ entries: [null, 'nonsense', { name: '' }, { name: 'Ok', quantity: 0 }] }).count === 0);
  check('nonsense in place of an order is not a crash', detail(null).total === 0);
  check('and an order with no lines comes to nothing',
    detail({ entries: [] }).total === 0 && detail({}).entries.length === 0);
});

section('checking out takes the stock down and files the order', () => {
  const app = withCatalogue();
  const doc = app.document;
  const store = app.Inventory.items;
  const confirmDialog = doc.getElementById('confirm-dialog');
  const message = doc.getElementById('confirm-message');
  const note = cartNoteIn(doc);

  addToCart(doc, 'mouse', 2); // 24 in stock at $29.99
  addToCart(doc, 'keyboard'); // 6 in stock at $119

  click(checkoutButton(doc));
  check('checking out asks first', confirmDialog.open === true);
  check('the question says what it will do', /take 3 items/i.test(message.textContent),
    message.textContent);
  check('and what it comes to', /178\.98/.test(message.textContent), message.textContent);
  check('the button is labelled for it',
    doc.getElementById('confirm-delete').textContent === 'Check out');
  check('and is not the red one',
    doc.getElementById('confirm-delete').className === 'btn btn-primary',
    doc.getElementById('confirm-delete').className);
  check('nothing has happened yet',
    store.get('mouse').quantity === 24 && cartRows(doc).length === 2 && orderRows(doc).length === 0);

  click(doc.getElementById('confirm-cancel'));
  check('cancelling leaves the stock alone', store.get('mouse').quantity === 24);
  check('and the cart where it was', cartRows(doc).length === 2);
  check('and files nothing', orderRows(doc).length === 0);

  checkOut(doc);

  check('the stock comes down by what was in the cart', store.get('mouse').quantity === 22,
    String(store.get('mouse').quantity));
  check('for every line', store.get('keyboard').quantity === 5);
  check('the stock change is stored',
    stored(app.localStorage).items.find((i) => i.id === 'mouse').quantity === 22);
  check('the cart is emptied', cartRows(doc).length === 0);
  check('and stored empty', storedCart(app.localStorage).lines.length === 0);
  check('a receipt is filed', orderRows(doc).length === 1);
  check('the history counts it', orderCountIn(doc) === '1 order', orderCountIn(doc));
  check('the empty state goes', doc.getElementById('orders-empty').hidden === true);
  check('the page says what happened', /checked out 3 items/i.test(note.textContent),
    note.textContent);
  check('and for how much', /178\.98/.test(note.textContent), note.textContent);

  /* Selling is not deleting: every product is still on the list, at a lower
   * count. */
  check('the inventory keeps all its products', store.all().length === CATALOGUE.length);
  check('and their other fields', store.get('mouse').name === 'Wireless Mouse');
});

section('the receipt says what was sold, and for how much', () => {
  const app = withCatalogue();
  const doc = app.document;

  addToCart(doc, 'mouse', 2);
  addToCart(doc, 'keyboard');
  checkOut(doc);

  const order = orderRows(doc)[0];
  const lines = orderLinesIn(order);

  check('one line per product', lines.length === 2, `got ${lines.length}`);
  check('named as they were', orderNamesIn(order).join('|') === 'Wireless Mouse|Mechanical Keyboard',
    orderNamesIn(order).join('|'));
  check('with how many and at what price',
    field(lines[0], 'order-line-price') === '2 × $29.99', field(lines[0], 'order-line-price'));
  check('and what that line comes to', field(lines[0], 'order-line-subtotal') === '$59.98');
  check('the second line too', field(lines[1], 'order-line-subtotal') === '$119.00');
  check('the order counts what was sold', field(order, 'order-count') === '3 items',
    field(order, 'order-count'));
  check('and totals it', field(order, 'order-total') === '$178.98', field(order, 'order-total'));

  const when = order.find((n) => String(n.className).split(/\s+/).includes('order-when'));
  check('it is stamped with when', when !== null && !Number.isNaN(Date.parse(when.dateTime)),
    when && when.dateTime);
  check('which the element carries as a machine-readable time',
    when.tagName === 'TIME' && when.dateTime === app.Inventory.orders.all()[0].at);
  check('and shows in words', when.textContent.length > 0);

  check('the history counts sales, the order counts what was in it',
    orderCountIn(doc) === '1 order' && field(order, 'order-count') === '3 items',
    `${orderCountIn(doc)} / ${field(order, 'order-count')}`);
});

section('a receipt is a snapshot, not a link', () => {
  /* The opposite of a cart line, deliberately: a cart is priced from the live
   * inventory so it cannot quote yesterday's price, and an order is a record of
   * what was sold, so nothing that happens afterwards may rewrite it. */
  const app = withCatalogue();
  const doc = app.document;
  const store = app.Inventory.items;

  addToCart(doc, 'mouse', 2);
  checkOut(doc);

  store.update('mouse', { name: 'Renamed', price: 1 });
  check('renaming a product does not rewrite the receipt',
    orderNamesIn(orderRows(doc)[0]).join('|') === 'Wireless Mouse',
    orderNamesIn(orderRows(doc)[0]).join('|'));
  check('nor does repricing it', field(orderRows(doc)[0], 'order-total') === '$59.98',
    field(orderRows(doc)[0], 'order-total'));
  check('nor does the unit price on the line',
    field(orderLinesIn(orderRows(doc)[0])[0], 'order-line-price') === '2 × $29.99');

  store.remove('mouse');
  check('deleting the product leaves the order standing', orderRows(doc).length === 1);
  check('with its line intact',
    orderNamesIn(orderRows(doc)[0]).join('|') === 'Wireless Mouse');
  check('while the inventory is a product shorter', store.all().length === CATALOGUE.length - 1);
});

section('a cart that cannot be fulfilled is refused, not rounded down', () => {
  const app = withCatalogue();
  const doc = app.document;
  const note = cartNoteIn(doc);
  const store = app.Inventory.items;

  addToCart(doc, 'monitor', 5); // the whole shelf, at $249 each
  store.update('monitor', { quantity: 2 });

  click(checkoutButton(doc));
  check('it does not even ask', doc.getElementById('confirm-dialog').open === false);
  check('it says what is in the way', /only 2 of "27" Monitor" in stock/i.test(note.textContent),
    note.textContent);
  check('and what to do about it', /lower the quantity/i.test(note.textContent));
  check('nothing was sold', orderRows(doc).length === 0);
  check('the stock is untouched', store.get('monitor').quantity === 2);
  check('and the cart is still there', cartRows(doc).length === 1);

  typeQuantity(doc, 'monitor', 2);
  checkOut(doc);
  check('once the quantity fits, it goes through', orderRows(doc).length === 1);
  check('and takes the stock down to nothing', store.get('monitor').quantity === 0);
  check('for what the cart held, not what it first held',
    field(orderRows(doc)[0], 'order-total') === '$498.00',
    field(orderRows(doc)[0], 'order-total'));
});

section('a line whose product is gone has to come out first', () => {
  const app = withCatalogue();
  const doc = app.document;
  const note = cartNoteIn(doc);

  addToCart(doc, 'mouse');
  addToCart(doc, 'keyboard');
  app.Inventory.items.remove('mouse');

  click(checkoutButton(doc));
  check('the sale is refused', doc.getElementById('confirm-dialog').open === false);
  check('and says which line is in the way',
    /no longer in your inventory/i.test(note.textContent), note.textContent);
  check('and what to do with it', /remove it/i.test(note.textContent));
  check('nothing was sold', orderRows(doc).length === 0);
  check('and nothing was taken off the stock',
    app.Inventory.items.get('keyboard').quantity === 6);

  click(actionIn(cartRowFor(doc, 'mouse'), 'remove'));
  checkOut(doc);
  check('with the dead line gone it goes through', orderRows(doc).length === 1);
  check('selling only what was left',
    orderNamesIn(orderRows(doc)[0]).join('|') === 'Mechanical Keyboard',
    orderNamesIn(orderRows(doc)[0]).join('|'));
  check('and taking that off the stock', app.Inventory.items.get('keyboard').quantity === 5);
});

section('several lines in the way are counted, not listed', () => {
  const app = withCatalogue();
  const doc = app.document;
  const note = cartNoteIn(doc);

  addToCart(doc, 'mouse');
  addToCart(doc, 'keyboard');
  addToCart(doc, 'monitor');
  app.Inventory.items.update('mouse', { quantity: 0 });
  app.Inventory.items.update('keyboard', { quantity: 0 });

  click(checkoutButton(doc));
  check('it says how many are in the way',
    /2 items in your cart cannot be checked out/i.test(note.textContent), note.textContent);
  check('and files nothing', orderRows(doc).length === 0);

  app.Inventory.items.update('mouse', { quantity: 4 });
  click(checkoutButton(doc));
  check('one left in the way is named again',
    /out of stock/i.test(note.textContent), note.textContent);
  check('naming the product', /Mechanical Keyboard/.test(note.textContent), note.textContent);
});

section('the history is still there after a reload', () => {
  const localStorage = createLocalStorage();
  seed(localStorage, CATALOGUE);

  const first = boot({ localStorage });
  addToCart(first.document, 'mouse', 2);
  checkOut(first.document);
  addToCart(first.document, 'usb');
  checkOut(first.document);

  const second = boot({ localStorage });
  const doc = second.document;

  check('both orders come back', orderRows(doc).length === 2, `got ${orderRows(doc).length}`);
  check('the count is rebuilt', orderCountIn(doc) === '2 orders', orderCountIn(doc));
  check('the newest is drawn first', field(orderRows(doc)[0], 'order-total') === '$12.50',
    field(orderRows(doc)[0], 'order-total'));
  check('and the one before it under that',
    field(orderRows(doc)[1], 'order-total') === '$59.98');
  check('the receipts keep their lines', orderLinesIn(orderRows(doc)[1]).length === 1);
  check('the stock came back where the sales left it',
    second.Inventory.items.get('mouse').quantity === 22,
    String(second.Inventory.items.get('mouse').quantity));
  check('and the cart is still empty', cartRows(doc).length === 0);
  check('the history is its own collection',
    storedOrders(localStorage).orders.length === 2 && stored(localStorage).items.length === 6);
  check('with a schema version of its own', storedOrders(localStorage).version === 1);
  check('nothing was written back on a read',
    storedOrders(localStorage).orders.length === 2 && orderRows(doc).length === 2);
});

section('junk in the stored history is repaired', () => {
  const localStorage = createLocalStorage();
  seed(localStorage, CATALOGUE);
  localStorage.setItem('inventory.orders', JSON.stringify({
    version: 1,
    orders: [
      {
        id: 'o1',
        at: '2026-01-02T03:04:05.000Z',
        entries: [
          { itemId: 'mouse', name: '  Wireless Mouse  ', price: 29.999, quantity: 2.7 },
          { itemId: 'gone', name: '', price: 3, quantity: 1 },
          { name: 'Ghost', quantity: 0 }
        ]
      },
      { id: 'o2', at: 'not a date', entries: [{ name: 'Thing', price: -4, quantity: 2 }] },
      { id: 'o3', at: '2026-01-02T03:04:05.000Z', entries: [] },
      { id: 'o1', at: '2026-01-02T03:04:05.000Z', entries: [{ name: 'Twin', quantity: 1 }] },
      null,
      'nonsense'
    ]
  }));
  const app = boot({ localStorage });
  const doc = app.document;
  const orders = app.Inventory.orders.all();
  const mouse = orderRows(doc)[2];

  check('orders with nothing left in them are dropped', orders.length === 3, `got ${orders.length}`);
  check('and the page draws what survived',
    orderRows(doc).map((o) => orderNamesIn(o).join(' + ')).join('|') ===
      'Twin|Thing|Wireless Mouse',
    orderRows(doc).map((o) => orderNamesIn(o).join(' + ')).join('|'));

  check('names are trimmed', orderNamesIn(mouse).join('|') === 'Wireless Mouse',
    orderNamesIn(mouse).join('|'));
  check('a nameless line is dropped', orderLinesIn(mouse).length === 1,
    String(orderLinesIn(mouse).length));
  check('a fractional count truncates and the price rounds to cents',
    field(orderLinesIn(mouse)[0], 'order-line-price') === '2 × $30.00',
    field(orderLinesIn(mouse)[0], 'order-line-price'));
  check('and the subtotal follows both', field(orderLinesIn(mouse)[0], 'order-line-subtotal') === '$60.00');
  check('a negative price clamps to nothing',
    field(orderLinesIn(orderRows(doc)[1])[0], 'order-line-subtotal') === '$0.00');
  check('a bad timestamp falls back to now', !Number.isNaN(Date.parse(orders[1].at)));
  check('orders sharing an id are separated',
    new Set(orders.map((o) => o.id)).size === orders.length);
  check('and a kept timestamp is kept',
    orders[0].at === '2026-01-02T03:04:05.000Z', orders[0].at);
});

section('a corrupt history blob degrades to empty, does not throw', () => {
  const cases = [
    ['not json', '}{'],
    ['json but not an object', '"hello"'],
    ['missing the orders array', '{"version":1}'],
    ['orders is not an array', '{"version":1,"orders":"nope"}'],
    ['null envelope', 'null']
  ];
  for (const [label, raw] of cases) {
    const localStorage = createLocalStorage();
    seed(localStorage, CATALOGUE);
    localStorage.setItem('inventory.orders', raw);
    const app = boot({ localStorage });

    check(label, orderRows(app.document).length === 0, `${orderRows(app.document).length} orders`);
    check(`${label}: the inventory still renders`,
      rowNames(app.document).length === CATALOGUE.length);
    check(`${label}: the unreadable blob is left alone`,
      localStorage.getItem('inventory.orders') === raw);
  }
});

section('the order store is a store like the others', () => {
  const localStorage = createLocalStorage();
  const app = boot({ localStorage });
  const orders = app.Inventory.orders;

  const added = orders.add({ entries: [{ itemId: 'x', name: 'Thing', price: 2, quantity: 2 }] });
  check('add returns the order', added !== null && added.entries[0].name === 'Thing');
  check('with an id', typeof added.id === 'string' && added.id !== '');
  check('and a timestamp', !Number.isNaN(Date.parse(added.at)));
  check('it is in the list', orders.all().length === 1);
  check('and in storage', storedOrders(localStorage).orders.length === 1);
  check('get finds it', orders.get(added.id) !== null);
  check('and returns a copy of the lines too', (() => {
    const copy = orders.get(added.id);
    copy.entries[0].price = 999;
    return orders.get(added.id).entries[0].price === 2;
  })());

  check('an order with nothing in it is refused', orders.add({ entries: [] }) === null);
  check('and changes nothing', orders.all().length === 1);
  check('get on an unknown id returns null', orders.get('nope') === null);
  check('a second read does not duplicate',
    orders.load().length === 1 && orders.all().length === 1);
});

section('several products change in one write', () => {
  /* What a checkout needs from the inventory: taking six products off the stock
   * is one change to it, and a write refused halfway would otherwise leave the
   * stored list holding half of it. */
  const localStorage = createLocalStorage();
  const app = boot({ localStorage });
  const store = app.Inventory.items;
  const reports = [];
  store.subscribe((items, info) => reports.push(info.saved));

  const before = store.all();
  const a = before[0];
  const b = before[1];

  const touched = store.updateMany([
    { id: a.id, changes: { quantity: 1 } },
    { id: b.id, changes: { quantity: 2 } },
    { id: 'nope', changes: { quantity: 3 } }
  ]);

  check('every product that was there changed', touched.length === 2, `got ${touched.length}`);
  check('to what it was asked to be',
    store.get(a.id).quantity === 1 && store.get(b.id).quantity === 2);
  check('an unknown id is skipped, not invented', store.all().length === before.length);
  check('the list is written once', reports.length === 1, `${reports.length} writes`);
  check('and the write reached storage',
    stored(localStorage).items.find((i) => i.id === a.id).quantity === 1);
  check('updatedAt moves for each of them',
    Date.parse(store.get(a.id).updatedAt) >= Date.parse(a.updatedAt));
  check('the records keep their other fields', store.get(a.id).name === a.name);

  check('a list with nothing in it writes nothing',
    store.updateMany([]).length === 0 && reports.length === 1);
  check('a change that would leave a product nameless is skipped like any other',
    store.updateMany([{ id: a.id, changes: { name: '   ' } }]).length === 0);
  check('leaving the product alone', store.get(a.id).name === a.name);
  check('nonsense in place of a list is not a crash', store.updateMany(null).length === 0);
});

section('a checkout that only half landed is not reported as saved', () => {
  /* A checkout writes to three collections. One browser that refuses a write
   * usually refuses all of them, but not always, and the page decides what to
   * say about saving from the last notification it gets — which, without the
   * checkout watching its own writes, would be the receipt's, saying fine while
   * the stock change underneath it was refused. */
  const localStorage = createPickStorage();
  seed(localStorage, CATALOGUE);
  const app = boot({ localStorage });
  const doc = app.document;
  const warning = doc.getElementById('save-warning');

  addToCart(doc, 'mouse', 2);
  check('the cart is saved to start with', storedCart(localStorage).lines[0].quantity === 2);

  localStorage.refuse = 'inventory.items';
  checkOut(doc);

  check('the receipt was written', storedOrders(localStorage).orders.length === 1);
  check('and the cart was emptied', storedCart(localStorage).lines.length === 0);
  check('but the stock change was refused',
    stored(localStorage).items.find((i) => i.id === 'mouse').quantity === 24,
    String(stored(localStorage).items.find((i) => i.id === 'mouse').quantity));
  check('so the page does not call the whole of it saved', warning.hidden === false);
  check('and says the change is only in this window', /window/i.test(warning.textContent),
    warning.textContent);

  localStorage.refuse = null;
  addToCart(doc, 'usb');
  checkOut(doc);
  check('a later sale that saves clears the warning', warning.hidden === true);
});

section('a checkout with no storage at all still works on the page', () => {
  const hostile = {
    getItem() { throw new Error('denied'); },
    setItem() { throw new Error('denied'); },
    removeItem() { throw new Error('denied'); }
  };
  const app = boot({ localStorage: hostile });
  const doc = app.document;
  const item = app.Inventory.items.all()[0];

  app.Inventory.cart.add(item.id, 1);
  checkOut(doc);

  check('the sale is made', orderRows(doc).length === 1);
  check('the cart is emptied', cartRows(doc).length === 0);
  check('the stock came down', app.Inventory.items.get(item.id).quantity === item.quantity - 1);
  check('and the page says none of it is saved',
    doc.getElementById('save-warning').hidden === false);
  check('saying why', /storage is unavailable/i.test(doc.getElementById('save-warning').textContent));
});

console.log(failures === 0 ? '\nAll checks passed.\n' : `\n${failures} check(s) failed.\n`);
process.exit(failures === 0 ? 0 : 1);
