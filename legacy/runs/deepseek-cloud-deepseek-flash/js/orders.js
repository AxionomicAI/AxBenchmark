/*
 * orders.js — the order history, and the checkout that fills it.
 *
 * Exposes `window.Inventory.orders`. An order is a record of a sale that has
 * happened, and its lines are copies: the name, the price and the quantity as
 * they were at the time. A cart line is the opposite — a reference, priced from
 * the live inventory every time it is drawn. That difference is the point. A
 * cart must not quote yesterday's price; a receipt must not change because
 * someone renamed a product this afternoon.
 *
 * Checking out is the one operation that spans all three collections: it takes
 * the cart's quantities off the stock, empties the cart, and appends the order.
 * The rules for what may be checked out are a pure function (`plan`) taking
 * both lists as arguments, so they can be exercised without a page; `checkout`
 * is the thin part that applies them.
 *
 * Classic script (no ES module syntax) so the page works over file://.
 */
(function (global) {
  'use strict';

  var storage = global.Inventory.storage;
  var inventory = global.Inventory.items;
  var cart = global.Inventory.cart;

  var STORAGE_KEY = 'inventory.orders';
  var store = storage.collection(STORAGE_KEY, 'orders');

  var orders = [];
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
    return 'order-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }

  function asText(value) {
    return typeof value === 'string' ? value.trim() : '';
  }

  /* A count is a positive whole number. Anything else reads as 0. */
  function asQuantity(value) {
    var n = Math.trunc(Number(value));
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  /* Money — a price, a subtotal, a total — is held to cents. */
  function asMoney(value) {
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
   * One line of a receipt: what was sold, for how much, and how many. A line
   * with no name to show, or nothing sold, is dropped. The subtotal is worked
   * out from the price and the count rather than trusted, so a hand-edited blob
   * cannot leave an order that does not add up.
   */
  function normalizeEntry(raw) {
    if (!raw || typeof raw !== 'object') return null;

    var name = asText(raw.name);
    var quantity = asQuantity(raw.quantity);
    if (!name || quantity === 0) return null;

    var price = asMoney(raw.price);
    return {
      itemId: asText(raw.itemId),
      name: name,
      price: price,
      quantity: quantity,
      subtotal: asMoney(price * quantity)
    };
  }

  /*
   * Coerce one record into an order. An order with no lines left after that is
   * dropped: there is no such thing as a sale of nothing, and a row with
   * nothing under it would only be a puzzle.
   */
  function normalizeOrder(raw) {
    if (!raw || typeof raw !== 'object') return null;

    var entries = [];
    (Array.isArray(raw.entries) ? raw.entries : []).forEach(function (entry) {
      var line = normalizeEntry(entry);
      if (line) entries.push(line);
    });
    if (entries.length === 0) return null;

    return {
      id: asText(raw.id) || newId(),
      at: asTimestamp(raw.at),
      entries: entries
    };
  }

  /*
   * Normalize a whole list, handing a fresh id to anything that would collide:
   * ids address orders on the page, so two of them alike would make one entry
   * indistinguishable from the other.
   */
  function normalizeAll(rawList) {
    var seen = Object.create(null);
    var out = [];

    (Array.isArray(rawList) ? rawList : []).forEach(function (raw) {
      var order = normalizeOrder(raw);
      if (!order) return;

      if (seen[order.id]) order.id = newId();
      seen[order.id] = true;
      out.push(order);
    });

    return out;
  }

  /*
   * An order owns its lines, and callers are handed copies, so nothing outside
   * can edit a receipt by holding on to one — the entries are copied a level
   * deeper than the record itself.
   */
  function copy(order) {
    return {
      id: order.id,
      at: order.at,
      entries: order.entries.map(function (entry) {
        return Object.assign({}, entry);
      })
    };
  }

  function indexOf(id) {
    for (var i = 0; i < orders.length; i++) {
      if (orders[i].id === id) return i;
    }
    return -1;
  }

  /*
   * Write through, then notify. `reported` is what the page should hear about
   * the write: an ordinary change leaves it out and gets the truth about its
   * own, while a checkout passes what it learned about every write it made — so
   * the notification the page draws from last cannot call a half-written
   * checkout saved.
   */
  function commit(reported) {
    var saved = store.save(orders);
    if (reported === false) saved = false;

    var snapshot = all();
    var report = { saved: saved };
    listeners.slice().forEach(function (fn) {
      fn(snapshot, report);
    });
    return saved;
  }

  /* --------------------------------------------------------------- store */

  function all() {
    return orders.map(copy);
  }

  function get(id) {
    var i = indexOf(asText(id));
    return i === -1 ? null : copy(orders[i]);
  }

  /*
   * Append an order. Returns the stored order, or null when there is nothing in
   * it to record.
   */
  function add(raw) {
    ensureLoaded();

    var order = normalizeOrder(raw);
    if (!order) return null;

    if (indexOf(order.id) !== -1) order.id = newId();
    record(order);
    return copy(order);
  }

  /*
   * Put a normalized order at the end of the history — the one place that
   * appends, so a checkout and a plain add cannot differ in how. `reported`
   * goes straight to commit(); returns whether the write was accepted.
   */
  function record(order, reported) {
    orders.push(order);
    return commit(reported);
  }

  /* --------------------------------------------------------- the numbers */

  /*
   * What an order comes to, read off its own lines. Pure, and the only place
   * this arithmetic lives: the count and the total are worked out from the
   * entries rather than stored next to them, so there is no second number that
   * can disagree with the lines it is supposed to be the sum of.
   */
  function detail(order) {
    var entries = [];
    (order && Array.isArray(order.entries) ? order.entries : []).forEach(function (raw) {
      var entry = normalizeEntry(raw);
      if (entry) entries.push(entry);
    });

    var total = 0;
    var count = 0;
    entries.forEach(function (entry) {
      total += entry.subtotal;
      count += entry.quantity;
    });

    return { entries: entries, total: asMoney(total), count: count };
  }

  /* ------------------------------------------------------------ checkout */

  /*
   * What checking out would do, worked out without changing anything. Both
   * lists are arguments rather than read from their stores, so every rule here
   * can be exercised on its own.
   *
   * Returns `{ ok: true, order, detail }` when the cart can be checked out, and
   * otherwise `{ ok: false, reason, blocked }`:
   *
   *   'empty'   — there is nothing in the cart to check out
   *   'blocked' — a line cannot be fulfilled, because its product is gone or
   *               because the cart holds more of it than there is in stock
   *
   * A line like that is refused rather than quietly dropped or rounded down to
   * what happens to be on the shelf, for the same reason the cart refuses to
   * cap a quantity behind the user's back: a sale that comes to less than the
   * cart said is worse than one that did not happen. The cart draws both
   * problems on the line already; this is what the page turns into advice.
   */
  function plan(lines, products) {
    var cartDetail = cart.detail(lines, products);
    if (cartDetail.entries.length === 0) {
      return { ok: false, reason: 'empty', blocked: [] };
    }

    var blocked = [];
    cartDetail.entries.forEach(function (entry) {
      if (!entry.item) {
        blocked.push({ itemId: entry.itemId, name: '', problem: 'missing', available: 0 });
      } else if (entry.overStock) {
        blocked.push({
          itemId: entry.itemId,
          name: entry.item.name,
          problem: 'short',
          available: entry.item.quantity
        });
      }
    });
    if (blocked.length > 0) return { ok: false, reason: 'blocked', blocked: blocked };

    /*
     * The order is built from the cart's own join rather than from the records
     * again, so the receipt and the total the user was looking at when they
     * said yes are the same numbers.
     */
    var order = normalizeOrder({
      id: newId(),
      at: nowIso(),
      entries: cartDetail.entries.map(function (entry) {
        return {
          itemId: entry.itemId,
          name: entry.item.name,
          price: entry.item.price,
          quantity: entry.quantity
        };
      })
    });

    return { ok: true, order: order, detail: detail(order) };
  }

  /*
   * Run `change` and report whether every write it made was accepted. Both
   * stores hand their subscribers the result of the write behind each change,
   * so this listens for the duration rather than asking them to return it: a
   * checkout writes to two collections besides this one, and what the page
   * needs to know is whether all of it landed, not what any single call
   * returned. The listeners are taken off again whatever happens, so a throw
   * cannot leave one behind on a store that outlives the call.
   */
  function allWritesAccepted(change) {
    var accepted = true;

    function watch(list, info) {
      if (!info.saved) accepted = false;
    }

    var stops = [inventory.subscribe(watch), cart.subscribe(watch)];
    try {
      change();
    } finally {
      stops.forEach(function (stop) { stop(); });
    }
    return accepted;
  }

  /*
   * Check the cart out: take what is in it off the stock, empty it, and record
   * the sale. Returns what `plan` does, plus `saved` — whether every write the
   * checkout made was accepted by the browser — when it goes through.
   *
   * The writes are watched rather than assumed. One browser that refuses a
   * write usually refuses all of them, but not always, and the page decides
   * what to say about saving from the last notification it gets: without this,
   * a checkout whose stock change was refused could be reported as saved
   * because the order that followed it went through.
   */
  function checkout() {
    ensureLoaded();

    var result = plan(cart.all(), inventory.all());
    if (!result.ok) return result;

    var accepted = allWritesAccepted(function () {
      /* The stock first and the cart second: a cart emptied before the goods
         came off the shelf would leave nothing to retry from if a write were
         refused. Both are one write each, so neither can land half applied. */
      var changes = [];
      result.order.entries.forEach(function (entry) {
        var item = inventory.get(entry.itemId);
        /* `plan` has just found every one of these; the guard is only against
           the two reads disagreeing. */
        if (item) {
          changes.push({
            id: entry.itemId,
            changes: { quantity: item.quantity - entry.quantity }
          });
        }
      });
      inventory.updateMany(changes);
      cart.clear();
    });

    /*
     * The order goes last so that its notification — the only one that can
     * carry the whole result — is the one the page redraws from.
     */
    var saved = record(result.order, accepted);

    return {
      ok: true,
      order: copy(result.order),
      detail: detail(result.order),
      saved: saved
    };
  }

  /*
   * Listen for changes: `fn(orders, { saved })`. Returns a function that stops
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
   * Every mutation calls this first. `commit()` saves the whole history, so a
   * change made before the store had read anything would write the empty
   * starting list straight over the user's.
   */
  function ensureLoaded() {
    if (!loaded) load();
  }

  /*
   * Read what is stored. Unlike the inventory there is no sample set: no orders
   * is what a first run honestly looks like.
   *
   * An order stands on its own — its lines are copies, not references — so
   * nothing here needs the inventory to make sense of it. The other two are
   * loaded alongside all the same, because the only thing that appends to this
   * history is a checkout, and a checkout is worked out against both of them.
   * All three loads are idempotent.
   */
  function load() {
    if (loaded) return all();
    loaded = true;

    inventory.load();
    cart.load();
    orders = normalizeAll(store.load());
    return all();
  }

  global.Inventory = global.Inventory || {};
  global.Inventory.orders = {
    load: load,
    all: all,
    get: get,
    add: add,
    detail: detail,
    plan: plan,
    checkout: checkout,
    subscribe: subscribe
  };
})(window);
