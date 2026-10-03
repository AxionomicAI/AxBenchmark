// Text conversion: turns stored numbers and dates into text for display and
// the text typed into a form back into numbers. Exposes a single global,
// InventoryFormat.
(function () {
  'use strict';

  // Fixed rather than taken from the browser, so that what is displayed can
  // always be typed back into a form.
  var LOCALE = 'en-US';
  var CURRENCY = 'USD';

  // Digits, optionally grouped in thousands by commas: 1500 or 1,500.
  var DIGITS = '(\\d+|\\d{1,3}(?:,\\d{3})+)';
  var WHOLE_NUMBER = new RegExp('^' + DIGITS + '$');
  var PRICE = new RegExp('^\\$?\\s*' + DIGITS + '?(?:\\.(\\d{1,2}))?$');

  function toNumber(digits) {
    return Number(digits.replace(/,/g, ''));
  }

  // 1500 -> '1,500'
  function formatNumber(number) {
    return number.toLocaleString(LOCALE);
  }

  // 129999 -> '$1,299.99'
  function formatPrice(cents) {
    // The dollars and the cents are written apart: cents / 100 is not exact
    // for the largest totals, and would be a cent off.
    var fraction = cents % 100;
    var dollars = ((cents - fraction) / 100).toLocaleString(LOCALE, {
      style: 'currency', currency: CURRENCY, maximumFractionDigits: 0
    });
    return dollars + '.' + (fraction < 10 ? '0' : '') + fraction;
  }

  // The price as it is put in a form input: 129999 -> '1299.99'
  function priceToInput(cents) {
    return (cents / 100).toFixed(2);
  }

  // An ISO 8601 timestamp as a date and time in the user's time zone:
  // '2026-10-01T14:05:00.000Z' -> 'Oct 1, 2026, 2:05 PM' (in UTC)
  function formatDate(timestamp) {
    return new Date(timestamp).toLocaleString(LOCALE, { dateStyle: 'medium', timeStyle: 'short' });
  }

  // Reads a whole number, 0 or more, such as '1500' or '1,500'. Returns null
  // if the text is anything else. The size of the number is not checked.
  function parseWholeNumber(text) {
    var match = WHOLE_NUMBER.exec(text.trim());
    return match ? toNumber(match[1]) : null;
  }

  // Reads a price with up to two decimal places, such as '19.99', '.5' or
  // '$1,299.99', and returns it in cents. Returns null if the text is
  // anything else. The size of the number is not checked.
  function parsePrice(text) {
    var match = PRICE.exec(text.trim());
    if (!match || (match[1] === undefined && match[2] === undefined)) {
      return null;
    }
    // Built from the digits, not by multiplying a decimal by 100, which is
    // inexact (19.99 * 100 is 1998.9999999999998).
    var whole = match[1] === undefined ? 0 : toNumber(match[1]);
    var fraction = match[2] === undefined ? 0 : Number((match[2] + '0').slice(0, 2));
    return whole * 100 + fraction;
  }

  window.InventoryFormat = {
    formatNumber: formatNumber,
    formatPrice: formatPrice,
    priceToInput: priceToInput,
    formatDate: formatDate,
    parseWholeNumber: parseWholeNumber,
    parsePrice: parsePrice
  };
})();
