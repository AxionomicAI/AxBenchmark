/*
 * items.js — the inventory data layer.
 *
 * Exposes `window.Inventory.items`: the product list, plus the operations that
 * change it. Every mutation writes the whole list back to localStorage before
 * returning, so no caller has to remember to save, and then notifies
 * subscribers so the page redraws itself. Subscribers also hear whether that
 * write was accepted, since a change the browser refused is still on the page
 * and the user needs to know it is not saved.
 *
 * Records are normalized on the way into the list and on the way out of
 * storage. A hand-edited or half-written blob cannot put `undefined` on the
 * page, and callers cannot store a negative stock count by accident.
 *
 * Classic script (no ES module syntax) so the page works over file://.
 */
(function (global) {
  'use strict';

  var storage = global.Inventory.storage;

  /*
   * First run only. An empty page tells you nothing about what the app does, so
   * a fresh install starts with a small, plausible stock list to edit or delete.
   * Ids are fixed rather than generated to keep the seed readable in devtools;
   * timestamps are stamped at seed time like any other record.
   */
  var SAMPLE_ITEMS = [
    { id: 'sample-wireless-mouse', name: 'Wireless Mouse', category: 'Accessories', quantity: 24, price: 29.99, notes: '' },
    { id: 'sample-keyboard', name: 'Mechanical Keyboard', category: 'Accessories', quantity: 6, price: 119, notes: 'Brown switches' },
    { id: 'sample-usb-c-cable', name: 'USB-C Cable (2 m)', category: 'Cables', quantity: 63, price: 12.5, notes: '' },
    { id: 'sample-hdmi-cable', name: 'HDMI Cable (1 m)', category: 'Cables', quantity: 0, price: 9.75, notes: 'Out of stock — reorder' },
    { id: 'sample-monitor', name: '27" Monitor', category: 'Displays', quantity: 5, price: 249, notes: '' },
    { id: 'sample-laptop-stand', name: 'Laptop Stand', category: 'Accessories', quantity: 17, price: 45, notes: '' },
    { id: 'sample-headphones', name: 'Noise-Cancelling Headphones', category: 'Audio', quantity: 3, price: 199, notes: 'Low stock' },
    { id: 'sample-webcam', name: 'Webcam 1080p', category: 'Video', quantity: 0, price: 79.5, notes: '' }
  ];

  var items = [];
  var listeners = [];
  var loaded = false;

  /* ------------------------------------------------------------- helpers */

  function nowIso() {
    return new Date().toISOString();
  }

  /*
   * `crypto.randomUUID` needs a secure context. file:// counts as one in most
   * browsers but not all, and older ones lack the method entirely, so fall back
   * to a timestamp plus randomness. Ids only have to be unique within one list.
   */
  function newId() {
    if (global.crypto && typeof global.crypto.randomUUID === 'function') {
      return global.crypto.randomUUID();
    }
    return 'item-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }

  function asText(value) {
    return typeof value === 'string' ? value.trim() : '';
  }

  /* Stock is a non-negative whole number. Anything else reads as 0. */
  function asQuantity(value) {
    var n = Math.trunc(Number(value));
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  /* Unit price, rounded to cents. */
  function asPrice(value) {
    var n = Number(value);
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.round(n * 100) / 100;
  }

  /* ISO 8601, falling back to now when the stored value is missing or nonsense. */
  function asTimestamp(value) {
    if (typeof value === 'string' && !Number.isNaN(Date.parse(value))) return value;
    return nowIso();
  }

  /*
   * Coerce one record into a product. Records with no name to show are dropped;
   * everything else is repaired rather than discarded, because quietly losing a
   * stock count is worse than a row the user can correct.
   */
  function normalize(raw) {
    if (!raw || typeof raw !== 'object') return null;

    var name = asText(raw.name);
    if (!name) return null;

    return {
      id: asText(raw.id) || newId(),
      name: name,
      category: asText(raw.category),
      quantity: asQuantity(raw.quantity),
      price: asPrice(raw.price),
      notes: asText(raw.notes),
      createdAt: asTimestamp(raw.createdAt),
      updatedAt: asTimestamp(raw.updatedAt)
    };
  }

  /*
   * Normalize a whole list, handing a fresh id to anything that would collide:
   * ids address rows, so duplicates would make edit and delete ambiguous.
   */
  function normalizeAll(rawList) {
    var seen = Object.create(null);
    var out = [];

    (Array.isArray(rawList) ? rawList : []).forEach(function (raw) {
      var item = normalize(raw);
      if (!item) return;

      if (seen[item.id]) item.id = newId();
      seen[item.id] = true;
      out.push(item);
    });

    return out;
  }

  function copy(item) {
    return Object.assign({}, item);
  }

  /*
   * Every mutation calls this first. `commit()` saves the whole list, so a
   * change made before the store had read anything would write the empty
   * starting list straight over the user's data. Nothing does that today; this
   * makes it impossible to get wrong later.
   */
  function ensureLoaded() {
    if (!loaded) load();
  }

  function indexOf(id) {
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) return i;
    }
    return -1;
  }

  /*
   * Write through, then notify. Returns false when the browser refused the
   * write — quota exceeded, or storage that probed as usable and then was not —
   * and subscribers get that result as well. The change still happened as far
   * as the page is concerned; the point is that it can be shown as unsaved
   * rather than passed off as safe.
   */
  function commit() {
    var saved = storage.save(items);
    var snapshot = all();
    var report = { saved: saved };
    listeners.slice().forEach(function (fn) {
      fn(snapshot, report);
    });
    return saved;
  }

  /* --------------------------------------------------------------- store */

  function all() {
    return items.map(copy);
  }

  function get(id) {
    var i = indexOf(id);
    return i === -1 ? null : copy(items[i]);
  }

  /* -------------------------------------------------------------- lookup */

  /*
   * Text folding, for comparing what someone typed against what is stored:
   * lowercase, and accents stripped, so "cafe" finds "Café". NFD splits an
   * accented letter into the letter plus a separate combining mark, and the
   * range below is the combining-marks block.
   */
  function fold(text) {
    return String(text)
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase();
  }

  /*
   * What a lookup reads. Name, category and notes are the words someone would
   * find a product by; the numbers are left out, so that typing "5" does not
   * match every product with five in stock.
   */
  function searchable(item) {
    return fold([item.name, item.category, item.notes].join('\n'));
  }

  /*
   * The products in `list` matching `{ text, category }`, in list order. An
   * empty field matches everything, so an empty query returns the whole list.
   *
   * The text is split on whitespace and every term has to appear somewhere in
   * the product, in any order: someone typing "cable usb" is looking for the
   * USB-C cable, and word order should not decide whether they find it.
   *
   * The category is matched whole rather than folded, because its values come
   * from the picker of categories that are actually in the list — there is no
   * half-typed category to be lenient about.
   */
  function search(list, query) {
    var terms = fold(asText(query && query.text)).split(/\s+/).filter(Boolean);
    var category = asText(query && query.category);

    return (Array.isArray(list) ? list : []).filter(function (item) {
      if (category && item.category !== category) return false;
      if (terms.length === 0) return true;

      var haystack = searchable(item);
      return terms.every(function (term) {
        return haystack.indexOf(term) !== -1;
      });
    });
  }

  /*
   * The distinct categories present in `list`, A→Z, for the picker. Sorted
   * case-insensitively, so "audio" does not sort a page away from "Audio".
   */
  function categories(list) {
    var seen = Object.create(null);

    (Array.isArray(list) ? list : []).forEach(function (item) {
      if (item.category) seen[item.category] = true;
    });

    return Object.keys(seen).sort(function (a, b) {
      var foldedA = fold(a);
      var foldedB = fold(b);
      return foldedA < foldedB ? -1 : foldedA > foldedB ? 1 : 0;
    });
  }

  /* Returns the new product, or null when there is no name to store. */
  function add(fields) {
    ensureLoaded();
    var item = normalize(fields);
    if (!item) return null;

    if (indexOf(item.id) !== -1) item.id = newId();
    items.push(item);
    commit();
    return copy(item);
  }

  /*
   * Merge `changes` into the product at `i` and put the result back in the
   * list. Returns the new record, or null when the change would leave the
   * product without a name — in which case the list is left alone. `id` and
   * `createdAt` are not editable; `updatedAt` is stamped here rather than taken
   * from the caller.
   */
  function applyAt(i, changes) {
    var merged = Object.assign({}, items[i], changes, {
      id: items[i].id,
      createdAt: items[i].createdAt
    });

    var next = normalize(merged);
    if (!next) return null;
    next.updatedAt = nowIso();

    items[i] = next;
    return next;
  }

  /*
   * Returns the updated product, or null when the id is unknown or the change
   * would leave the product without a name.
   */
  function update(id, changes) {
    ensureLoaded();
    var i = indexOf(id);
    if (i === -1) return null;

    var next = applyAt(i, changes);
    if (!next) return null;

    commit();
    return copy(next);
  }

  /*
   * Change several products as one write. `changes` is a list of
   * `{ id, changes }`, applied in order; an id that is not in the list, or a
   * change that would leave a product nameless, is skipped.
   *
   * One save and one notification rather than one of each per product, which is
   * what a checkout needs: taking six products off the stock is one change to
   * the inventory, and a browser that refused the fourth write of six would
   * otherwise leave the stored list holding half of it. Returns the products
   * that changed, in the order they were given.
   */
  function updateMany(changes) {
    ensureLoaded();

    var touched = [];
    (Array.isArray(changes) ? changes : []).forEach(function (change) {
      var i = indexOf(asText(change && change.id));
      if (i === -1) return;

      var next = applyAt(i, change.changes);
      if (next) touched.push(copy(next));
    });

    if (touched.length > 0) commit();
    return touched;
  }

  function remove(id) {
    ensureLoaded();
    var i = indexOf(id);
    if (i === -1) return false;

    items.splice(i, 1);
    commit();
    return true;
  }

  /* Wholesale replacement — the import path, and how the sample set lands. */
  function replaceAll(rawList) {
    ensureLoaded();
    items = normalizeAll(rawList);
    commit();
    return all();
  }

  /*
   * Listen for changes: `fn(items, { saved })`. Returns a function that stops
   * listening.
   */
  function subscribe(fn) {
    listeners.push(fn);
    return function unsubscribe() {
      var i = listeners.indexOf(fn);
      if (i !== -1) listeners.splice(i, 1);
    };
  }

  /*
   * Read what is stored, or lay down the sample stock on a first run.
   *
   * "First run" means no stored blob at all. A blob that is present but empty
   * or unreadable is the user's own history, and seeding over it would look
   * like the app replaced their data with demo rows.
   *
   * Does not notify subscribers — this produces the state they start from —
   * and is idempotent, so calling it again is a no-op rather than a re-read.
   */
  function load() {
    if (loaded) return all();
    loaded = true;

    if (storage.hasData()) {
      items = normalizeAll(storage.load());
    } else {
      items = normalizeAll(SAMPLE_ITEMS);
      storage.save(items);
    }
    return all();
  }

  global.Inventory = global.Inventory || {};
  global.Inventory.items = {
    load: load,
    all: all,
    get: get,
    search: search,
    categories: categories,
    add: add,
    update: update,
    updateMany: updateMany,
    remove: remove,
    replaceAll: replaceAll,
    subscribe: subscribe
  };
})(window);
