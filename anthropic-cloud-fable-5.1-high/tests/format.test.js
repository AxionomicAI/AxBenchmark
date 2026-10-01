// Tests for the text conversion in js/format.js.
// Run with: node tests/format.test.js
'use strict';

var assert = require('assert');
var vm = require('vm');
var harness = require('./harness');

var test = harness.test;

var sandbox = {};
sandbox.window = sandbox;
vm.createContext(sandbox);
harness.loadScripts(['format.js']).forEach(function (script) { script.runInContext(sandbox); });
var Format = sandbox.InventoryFormat;

test('formatNumber groups thousands', function () {
  assert.strictEqual(Format.formatNumber(0), '0');
  assert.strictEqual(Format.formatNumber(999), '999');
  assert.strictEqual(Format.formatNumber(1500), '1,500');
  assert.strictEqual(Format.formatNumber(1000000000), '1,000,000,000');
});

test('formatPrice shows cents as dollars', function () {
  assert.strictEqual(Format.formatPrice(0), '$0.00');
  assert.strictEqual(Format.formatPrice(5), '$0.05');
  assert.strictEqual(Format.formatPrice(850), '$8.50');
  assert.strictEqual(Format.formatPrice(1999), '$19.99');
  assert.strictEqual(Format.formatPrice(129999), '$1,299.99');
  assert.strictEqual(Format.formatPrice(1000000000), '$10,000,000.00');
});

test('formatPrice is exact for the largest totals', function () {
  assert.strictEqual(Format.formatPrice(9000006999999993), '$90,000,069,999,999.93');
  assert.strictEqual(Format.formatPrice(Number.MAX_SAFE_INTEGER), '$90,071,992,547,409.91');
});

test('priceToInput writes a plain decimal', function () {
  assert.strictEqual(Format.priceToInput(0), '0.00');
  assert.strictEqual(Format.priceToInput(5), '0.05');
  assert.strictEqual(Format.priceToInput(850), '8.50');
  assert.strictEqual(Format.priceToInput(129999), '1299.99');
});

test('parseWholeNumber reads whole numbers', function () {
  assert.strictEqual(Format.parseWholeNumber('0'), 0);
  assert.strictEqual(Format.parseWholeNumber('42'), 42);
  assert.strictEqual(Format.parseWholeNumber(' 42 '), 42);
  assert.strictEqual(Format.parseWholeNumber('007'), 7);
  assert.strictEqual(Format.parseWholeNumber('1,500'), 1500);
  assert.strictEqual(Format.parseWholeNumber('1,000,000,000'), 1000000000);
  assert.strictEqual(Format.parseWholeNumber('99999999999'), 99999999999);
});

test('parseWholeNumber rejects everything else', function () {
  ['', ' ', '-1', '+1', '1.5', '1.0', '1e3', '0x10', 'abc', '12abc', '1 500', '1,50', '1,5000', ',500', '1,,500', 'Infinity', 'NaN'].forEach(function (text) {
    assert.strictEqual(Format.parseWholeNumber(text), null, JSON.stringify(text));
  });
});

test('parsePrice reads prices into cents', function () {
  assert.strictEqual(Format.parsePrice('0'), 0);
  assert.strictEqual(Format.parsePrice('5'), 500);
  assert.strictEqual(Format.parsePrice('19.99'), 1999);
  assert.strictEqual(Format.parsePrice(' 19.99 '), 1999);
  assert.strictEqual(Format.parsePrice('8.5'), 850);
  assert.strictEqual(Format.parsePrice('0.05'), 5);
  assert.strictEqual(Format.parsePrice('.5'), 50);
  assert.strictEqual(Format.parsePrice('.05'), 5);
  assert.strictEqual(Format.parsePrice('$19.99'), 1999);
  assert.strictEqual(Format.parsePrice('$ 19.99'), 1999);
  assert.strictEqual(Format.parsePrice('1,299.99'), 129999);
  assert.strictEqual(Format.parsePrice('$10,000,000.00'), 1000000000);
});

test('formatDate shows a timestamp as a date and time in the local time zone', function () {
  // Built from local parts, so that the result is the same in every time zone.
  function at(year, month, day, hours, minutes) {
    // Some versions of the formatter put a narrow no-break space before AM and PM.
    return Format.formatDate(new Date(year, month - 1, day, hours, minutes).toISOString())
      .replace(/\s/g, ' ');
  }
  assert.strictEqual(at(2026, 10, 1, 14, 5), 'Oct 1, 2026, 2:05 PM');
  assert.strictEqual(at(2026, 1, 31, 0, 0), 'Jan 31, 2026, 12:00 AM');
  assert.strictEqual(at(2027, 12, 9, 9, 59), 'Dec 9, 2027, 9:59 AM');
});

test('parsePrice is exact where multiplying by 100 is not', function () {
  // 19.99 * 100, 1.15 * 100, 4.35 * 100 and 0.29 * 100 are all slightly off.
  assert.strictEqual(Format.parsePrice('19.99'), 1999);
  assert.strictEqual(Format.parsePrice('1.15'), 115);
  assert.strictEqual(Format.parsePrice('4.35'), 435);
  assert.strictEqual(Format.parsePrice('0.29'), 29);
  assert.strictEqual(Format.parsePrice('9999999.99'), 999999999);
});

test('parsePrice rejects everything else', function () {
  ['', ' ', '.', '$', '-1', '-0.50', '+1', '1.999', '1.', '1,5', '1.5.0', '1e3', 'abc', '12abc', '19,99', '1,29.99', '19.99$', '€5', 'free'].forEach(function (text) {
    assert.strictEqual(Format.parsePrice(text), null, JSON.stringify(text));
  });
});

test('every price survives being written to a form input and read back', function () {
  [0, 1, 5, 10, 99, 100, 101, 850, 1999, 129999, 999999999, 1000000000].forEach(function (cents) {
    assert.strictEqual(Format.parsePrice(Format.priceToInput(cents)), cents);
    assert.strictEqual(Format.parsePrice(Format.formatPrice(cents)), cents);
  });
  for (var cents = 0; cents < 20000; cents++) {
    assert.strictEqual(Format.parsePrice(Format.priceToInput(cents)), cents);
  }
});

harness.run();
