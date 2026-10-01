/*
 * cart.js — the shopping cart.
 *
 * Exposes `window.Inventory.cart`. A cart line is `{ itemId, quantity }`: a
 * reference to a product, never a copy of one. Names, prices and stock are read
 * back through that reference every time the cart is drawn, so editing a price
 * moves the total, and a product that has been deleted leaves a line that says
 * so rather than disappearing from the cart without explanation.
 *
 * Shaped like items.js, one level down: every mutation writes the whole cart to
 * localStorage before returning and then notifies subscribers, who also hear
 * whether that write was accepted. Quantities are capped at the stock on hand —
 * a cart is what you would take out of the inventory — so the way to put more
 * in the cart is to record more stock.
 *
 * Classic script (no ES module syntax) so the page works over file://.
 */
(function (global) {
  'use strict';

  var storage = global.Inventory.storage;
  var inventory = global.Inventory.items;

  var STORAGE_KEY = 'inventory.cart';
  var store = storage.collection(STORAGE_KEY, 'lines');

  var lines = [];
  var listeners = [];
  var loaded = false;

  /* ------------------------------------------------------------- helpers */

  function asText(value) {
    return typeof value === 'string' ? value.trim() : '';
  }

  /*
   * A line holds a positive whole number of a product. Anything else reads as
   * 0, and no products is the same thing as not being in the cart.
   */
  function asQuantity(value) {
    var n = Math.trunc(Number(value));
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  /*
   * Money is held to cents. A subtotal is a price times a count, which lands on
   * a fraction of a cent more often than not, and a total summed from those
   * would drift.
   */
  function asMoney(value) {
    var n = Number(value);
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.round(n * 100) / 100;
  }

  function normalize(raw) {
    if (!raw || typeof raw !== 'object') return null;

    var itemId = asText(raw.itemId);
    var quantity = asQuantity(raw.quantity);
    if (!itemId || quantity === 0) return null;

    return { itemId: itemId, quantity: quantity };
  }

  /*
   * A product appears at most once in the cart — two lines for one product
   * would make "change the quantity" ambiguous — so a blob that lists one twice
   * is added up rather than dropped, and a line pointing at nothing is dropped
   * because there is nothing left to say about it.
   */
  function normalizeAll(rawList) {
    var byId = Object.create(null);
    var out = [];

    (Array.isArray(rawList) ? rawList : []).forEach(function (raw) {
      var line = normalize(raw);
      if (!line) return;

      var seen = byId[line.itemId];
      if (seen) {
        seen.quantity += line.quantity;
        return;
      }
      byId[line.itemId] = line;
      out.push(line);
    });

    return out;
  }

  function copy(line) {
    return Object.assign({}, line);
  }

  function indexOf(itemId) {
    for (var i = 0; i < lines.length; i++) {
      if (lines[i].itemId === itemId) return i;
    }
    return -1;
  }

  /*
   * How many of this product there are to take. A product that is not in the
   * inventory — deleted while it was in the cart, or an id that never existed —
   * has none.
   */
  function stockOf(itemId) {
    var item = inventory.get(itemId);
    return item ? item.quantity : 0;
  }

  /*
   * Write through, then notify. Returns false when the browser refused the
   * write, and subscribers get that result as well, so an unsaved cart can be
   * shown as unsaved rather than passed off as safe.
   */
  function commit() {
    var saved = store.save(lines);
    var snapshot = all();
    var report = { saved: saved };
    listeners.slice().forEach(function (fn) {
      fn(snapshot, report);
    });
    return saved;
  }

  /* --------------------------------------------------------------- store */

  function all() {
    return lines.map(copy);
  }

  function get(itemId) {
    var i = indexOf(asText(itemId));
    return i === -1 ? null : copy(lines[i]);
  }

  /* ------------------------------------------------------------- changes */

  /*
   * Put `quantity` more of a product in the cart, on top of what is already
   * there. Returns the resulting line, or null when there is nothing to add:
   * no such product, none in stock, or the cart already holding all of it.
   * Those three are refused rather than clamped to a no-op so the page can say
   * which one it was.
   */
  function add(itemId, quantity) {
    ensureLoaded();

    var id = asText(itemId);
    var want = asQuantity(quantity === undefined ? 1 : quantity);
    if (!id || want === 0) return null;

    var available = stockOf(id);
    var i = indexOf(id);
    var current = i === -1 ? 0 : lines[i].quantity;
    if (available === 0 || current >= available) return null;

    var next = Math.min(current + want, available);

    if (i === -1) {
      lines.push({ itemId: id, quantity: next });
      i = lines.length - 1;
    } else {
      lines[i].quantity = next;
    }

    commit();
    return copy(lines[i]);
  }

  /*
   * Set a line to an exact quantity, capped at the stock on hand. Returns the
   * resulting line, or null when there is none left: no such line, or a
   * quantity of zero, which is what taking the last one out means.
   */
  function setQuantity(itemId, quantity) {
    ensureLoaded();

    var i = indexOf(asText(itemId));
    if (i === -1) return null;

    var want = asQuantity(quantity);
    if (want === 0) {
      lines.splice(i, 1);
      commit();
      return null;
    }

    /*
     * A product that is gone cannot cap anything. Its line is already drawn as
     * unavailable, and the number the user asked for is the honest one to keep.
     */
    var available = stockOf(lines[i].itemId);
    var next = available === 0 ? want : Math.min(want, available);

    /* Nothing actually changed, so there is nothing to write or redraw. */
    if (next === lines[i].quantity) return copy(lines[i]);

    lines[i].quantity = next;
    commit();
    return copy(lines[i]);
  }

  function remove(itemId) {
    ensureLoaded();

    var i = indexOf(asText(itemId));
    if (i === -1) return false;

    lines.splice(i, 1);
    commit();
    return true;
  }

  function clear() {
    ensureLoaded();
    if (lines.length === 0) return false;

    lines = [];
    commit();
    return true;
  }

  /* ------------------------------------------------------------ the join */

  /*
   * The cart read against the inventory: what each line is worth, and what the
   * cart comes to. Pure — both lists are arguments rather than being read from
   * the stores — so the arithmetic can be exercised on its own.
   *
   * A line whose product is gone is reported with `item: null` and adds nothing
   * to the total. Dropping it here would be the quiet way to handle a deletion
   * the user did not ask for; the page would rather show the line and say so.
   */
  function detail(entries, products) {
    var byId = Object.create(null);
    (Array.isArray(products) ? products : []).forEach(function (item) {
      byId[item.id] = item;
    });

    var out = [];
    var total = 0;
    var count = 0;
    var missing = 0;

    (Array.isArray(entries) ? entries : []).forEach(function (line) {
      var quantity = asQuantity(line && line.quantity);
      if (quantity === 0) return;

      var item = byId[line.itemId] || null;
      var subtotal = item ? asMoney(item.price * quantity) : 0;

      if (item) {
        total += subtotal;
        count += quantity;
      } else {
        missing++;
      }

      out.push({
        itemId: line.itemId,
        quantity: quantity,
        item: item,
        subtotal: subtotal,
        overStock: !!item && quantity > item.quantity
      });
    });

    return {
      entries: out,
      total: asMoney(total),
      count: count,
      missing: missing
    };
  }

  /*
   * Listen for changes: `fn(lines, { saved })`. Returns a function that stops
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
   * Every mutation calls this first. `commit()` saves the whole cart, so a
   * change made before the store had read anything would write the empty
   * starting cart straight over the user's.
   */
  function ensureLoaded() {
    if (!loaded) load();
  }

  /*
   * Read what is stored. Unlike the inventory there is no sample set: an empty
   * cart is what a first run honestly looks like.
   *
   * The inventory is loaded alongside it, because every change to the cart is
   * measured against the stock on hand and a cart read before the products were
   * would cap everything at nothing. Both loads are idempotent.
   */
  function load() {
    if (loaded) return all();
    loaded = true;

    inventory.load();
    lines = normalizeAll(store.load());
    return all();
  }

  global.Inventory = global.Inventory || {};
  global.Inventory.cart = {
    load: load,
    all: all,
    get: get,
    add: add,
    setQuantity: setQuantity,
    remove: remove,
    clear: clear,
    detail: detail,
    subscribe: subscribe
  };
})(window);
