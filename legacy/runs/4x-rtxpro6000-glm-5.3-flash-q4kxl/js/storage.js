/* =========================================================
   Inventory — localStorage wrapper
   Thin, error-safe wrapper around window.localStorage with
   JSON (de)serialization and a "inventory." key prefix.
   Exposes window.InventoryStorage.
   ========================================================= */

(function () {
  'use strict';

  var PREFIX = 'inventory.';

  /**
   * Detect whether localStorage is usable (it can throw in
   * private-browsing modes or when storage is disabled).
   * @returns {boolean}
   */
  function available() {
    try {
      var testKey = PREFIX + '__availability_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Read a JSON value under the given (prefixed) key.
   * @param {string} key key without prefix
   * @param {*} fallback value returned when missing or unreadable
   * @returns {*}
   */
  function get(key, fallback) {
    try {
      var raw = window.localStorage.getItem(PREFIX + key);
      if (raw === null) {
        return fallback;
      }
      return JSON.parse(raw);
    } catch (err) {
      console.error('[storage] Failed to read "' + key + '":', err);
      return fallback;
    }
  }

  /**
   * Write a JSON value under the given (prefixed) key.
   * @param {string} key key without prefix
   * @param {*} value JSON-serializable value
   * @returns {boolean} true on success
   */
  function set(key, value) {
    try {
      window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.error('[storage] Failed to write "' + key + '":', err);
      return false;
    }
  }

  /**
   * Remove the given (prefixed) key.
   * @param {string} key key without prefix
   */
  function remove(key) {
    try {
      window.localStorage.removeItem(PREFIX + key);
    } catch (err) {
      console.error('[storage] Failed to remove "' + key + '":', err);
    }
  }

  window.InventoryStorage = {
    available: available,
    get: get,
    set: set,
    remove: remove
  };
})();
