/*
 * storage.js — localStorage persistence layer.
 *
 * Exposes `window.Inventory.storage`. Everything is synchronous: localStorage
 * has no async API and the dataset is small enough that it does not matter.
 *
 * The app keeps three collections in storage — the inventory, the cart, and the
 * order history — and all of them are stored the same way: a JSON envelope
 * `{ version, <field> }` around an array. `collection(key, field)` builds the
 * reader and writer for one of them; the functions on `Inventory.storage` itself
 * are the inventory's, so the call sites written against them are unchanged.
 *
 * Classic script (no ES module syntax) so the page works over file://.
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'inventory.items';
  var SCHEMA_VERSION = 1;

  /*
   * localStorage is not always usable: Safari private mode throws on write, and
   * some browsers block it entirely for file:// pages. Probe once and remember,
   * so callers get a plain false instead of an exception on every call.
   */
  var available = (function probe() {
    try {
      var k = '__inventory_probe__';
      global.localStorage.setItem(k, '1');
      global.localStorage.removeItem(k);
      return true;
    } catch (err) {
      return false;
    }
  })();

  function isAvailable() {
    return available;
  }

  /*
   * Read one collection's raw envelope: { version, <field> }. Anything
   * unparseable or the wrong shape is treated as "no data" rather than thrown,
   * so a corrupt entry (or a hand-edited one) cannot brick the page.
   */
  function readEnvelope(key, field) {
    if (!available) return null;

    var raw;
    try {
      raw = global.localStorage.getItem(key);
    } catch (err) {
      return null;
    }
    if (!raw) return null;

    var parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      return null;
    }
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed[field])) {
      return null;
    }

    return parsed;
  }

  /*
   * The reader and writer for one stored collection. `field` is the name the
   * array is stored under inside the envelope, so a blob read by hand in
   * devtools says what it holds.
   *
   * The functions are all or nothing per call and report failure by return
   * value, never by throwing: a browser that has storage switched off, or that
   * refuses a write because the quota is full, must not take the page down with
   * it. Callers surface the `false` to the user — data loss the user cannot see
   * is the worst outcome here.
   */
  function collection(key, field) {
    /*
     * True when a blob is present, whether or not it parses. This separates
     * "you have never run this before" from "your data is unreadable", which
     * load() deliberately reports the same way. The first-run sample set keys
     * off it: an unreadable blob is still the user's history, and overwriting
     * it with demo rows would hide that something went wrong.
     */
    function hasData() {
      if (!available) return false;
      try {
        return global.localStorage.getItem(key) !== null;
      } catch (err) {
        return false;
      }
    }

    function load() {
      var envelope = readEnvelope(key, field);
      return envelope ? envelope[field] : [];
    }

    function save(list) {
      if (!available) return false;

      var payload = { version: SCHEMA_VERSION };
      payload[field] = list;

      try {
        global.localStorage.setItem(key, JSON.stringify(payload));
        return true;
      } catch (err) {
        return false;
      }
    }

    function clear() {
      if (!available) return false;
      try {
        global.localStorage.removeItem(key);
        return true;
      } catch (err) {
        return false;
      }
    }

    return {
      KEY: key,
      SCHEMA_VERSION: SCHEMA_VERSION,
      isAvailable: isAvailable,
      hasData: hasData,
      load: load,
      save: save,
      clear: clear
    };
  }

  var items = collection(STORAGE_KEY, 'items');

  global.Inventory = global.Inventory || {};
  global.Inventory.storage = {
    KEY: STORAGE_KEY,
    SCHEMA_VERSION: SCHEMA_VERSION,
    isAvailable: isAvailable,
    hasData: items.hasData,
    load: items.load,
    save: items.save,
    clear: items.clear,
    collection: collection
  };
})(window);
