// Tests for the product lookup in js/search.js.
// Run with: node tests/search.test.js
'use strict';

var assert = require('assert');
var vm = require('vm');
var harness = require('./harness');

var test = harness.test;

// search.js asks Inventory for stock statuses, so the data layer is loaded
// too. It finds no localStorage here and never has to store anything.
var sandbox = { addEventListener: function () {} };
sandbox.window = sandbox;
vm.createContext(sandbox);
harness.loadScripts(['storage.js', 'sample-data.js', 'inventory.js', 'search.js']).forEach(function (script) {
  script.runInContext(sandbox);
});
var Search = sandbox.InventorySearch;

var nextId = 1;

function product(overrides) {
  return Object.assign({
    id: 'p' + nextId++,
    name: 'Widget',
    sku: 'W-1',
    category: '',
    quantity: 5,
    priceCents: 250,
    reorderLevel: 2
  }, overrides);
}

var PRODUCTS = [
  product({ name: 'Wireless Mouse', sku: 'ELC-MSE-210', category: 'Electronics', quantity: 35, reorderLevel: 10 }),
  product({ name: 'USB-C Cable, 1 m', sku: 'ELC-CBL-100', category: 'Electronics', quantity: 0, reorderLevel: 15 }),
  product({ name: 'Mouse Mat', sku: 'OFF-MAT-001', category: 'Office Supplies', quantity: 4, reorderLevel: 4 }),
  product({ name: 'Café Crème Mug', sku: 'KIT-MUG-7', category: '', quantity: 0, reorderLevel: 0 }),
  product({ name: 'Desk Lamp', sku: 'FUR-LMP-030', category: 'furniture', quantity: 18, reorderLevel: 6 })
];

// The names of the products that match, in the order they were found. Arrays
// made inside the vm have another realm's prototype, which deepStrictEqual
// treats as different, so the names are put in an array made here.
function find(criteria, products) {
  var found = Search.filter(products || PRODUCTS, criteria);
  return Array.from(found, function (p) { return p.name; });
}

function findText(text) {
  return find({ text: text });
}

var ALL = PRODUCTS.map(function (p) { return p.name; });

// --- Text ---

test('empty criteria match every product, in the order given', function () {
  assert.deepStrictEqual(find({}), ALL);
  assert.deepStrictEqual(find({ text: '', category: null, status: null }), ALL);
  assert.deepStrictEqual(find({ text: '   ' }), ALL);
  assert.deepStrictEqual(find({ text: undefined, category: undefined, status: undefined }), ALL);
  assert.deepStrictEqual(find({ text: 'mouse' }, []), []);
});

test('text is looked for in the name, the SKU and the category', function () {
  assert.deepStrictEqual(findText('lamp'), ['Desk Lamp']);
  assert.deepStrictEqual(findText('MAT-001'), ['Mouse Mat']);
  assert.deepStrictEqual(findText('office'), ['Mouse Mat']);
  assert.deepStrictEqual(findText('mouse'), ['Wireless Mouse', 'Mouse Mat']);
  assert.deepStrictEqual(findText('zzz'), []);
});

test('text matches part of a word, ignoring case and surrounding space', function () {
  assert.deepStrictEqual(findText('wirel'), ['Wireless Mouse']);
  assert.deepStrictEqual(findText('LESS'), ['Wireless Mouse']);
  assert.deepStrictEqual(findText('  elc-mse  '), ['Wireless Mouse']);
  assert.deepStrictEqual(findText('ELECTRONICS'), ['Wireless Mouse', 'USB-C Cable, 1 m']);
});

test('every word has to match, in any order and in any field', function () {
  assert.deepStrictEqual(findText('mouse wireless'), ['Wireless Mouse']);
  assert.deepStrictEqual(findText('mouse office'), ['Mouse Mat']);
  assert.deepStrictEqual(findText('mouse  elc'), ['Wireless Mouse']);
  assert.deepStrictEqual(findText('mouse lamp'), []);
});

test('a word does not match across two fields', function () {
  // 'Wireless Mouse' is followed by the SKU 'ELC-MSE-210'.
  assert.deepStrictEqual(findText('mouseelc'), []);
  assert.deepStrictEqual(findText('210electronics'), []);
});

test('accents are ignored in both directions', function () {
  assert.deepStrictEqual(findText('cafe creme'), ['Café Crème Mug']);
  assert.deepStrictEqual(findText('CAFÉ'), ['Café Crème Mug']);
  assert.deepStrictEqual(findText('wirèless'), ['Wireless Mouse']);
  // Composed and decomposed forms of the same letter are the same.
  assert.deepStrictEqual(findText('café'), ['Café Crème Mug']);
});

test('punctuation is optional', function () {
  assert.deepStrictEqual(findText('elcmse210'), ['Wireless Mouse']);
  assert.deepStrictEqual(findText('elc mse 210'), ['Wireless Mouse']);
  assert.deepStrictEqual(findText('ELC_MSE_210'), ['Wireless Mouse']);
  assert.deepStrictEqual(findText('usbc'), ['USB-C Cable, 1 m']);
  assert.deepStrictEqual(findText('usb-c'), ['USB-C Cable, 1 m']);
  assert.deepStrictEqual(findText('cable'), ['USB-C Cable, 1 m']);
});

test('a word of punctuation only is looked for as typed', function () {
  assert.deepStrictEqual(findText(','), ['USB-C Cable, 1 m']);
  assert.deepStrictEqual(findText('-'), ALL);
  assert.deepStrictEqual(findText('!'), []);
});

test('text is never treated as a pattern', function () {
  var odd = [product({ name: 'Bolt (M8) [steel] 50%', sku: 'B.8*' }), product({ name: 'Nut', sku: 'N-8' })];
  assert.deepStrictEqual(find({ text: '(m8)' }, odd), ['Bolt (M8) [steel] 50%']);
  assert.deepStrictEqual(find({ text: '[steel]' }, odd), ['Bolt (M8) [steel] 50%']);
  assert.deepStrictEqual(find({ text: 'b.8*' }, odd), ['Bolt (M8) [steel] 50%']);
  assert.deepStrictEqual(find({ text: '.*' }, odd), []);
  assert.deepStrictEqual(find({ text: '50%' }, odd), ['Bolt (M8) [steel] 50%']);
});

test('text in other scripts can be found', function () {
  var products = [product({ name: 'Чайник электрический', sku: 'КХ-1' }), product({ name: '緑茶 100g', sku: 'T-2' })];
  assert.deepStrictEqual(find({ text: 'чайник' }, products), ['Чайник электрический']);
  assert.deepStrictEqual(find({ text: 'кх1' }, products), ['Чайник электрический']);
  assert.deepStrictEqual(find({ text: '緑茶' }, products), ['緑茶 100g']);
});

// --- Category ---

test('category keeps the products in that category, ignoring case', function () {
  assert.deepStrictEqual(find({ category: 'Electronics' }), ['Wireless Mouse', 'USB-C Cable, 1 m']);
  assert.deepStrictEqual(find({ category: 'electronics' }), ['Wireless Mouse', 'USB-C Cable, 1 m']);
  assert.deepStrictEqual(find({ category: 'Furniture' }), ['Desk Lamp']);
  assert.deepStrictEqual(find({ category: 'Electro' }), []);
  assert.deepStrictEqual(find({ category: 'Toys' }), []);
});

test('an empty category keeps the products without one', function () {
  assert.deepStrictEqual(find({ category: '' }), ['Café Crème Mug']);
});

// --- Status ---

test('status keeps the products with that stock status', function () {
  assert.deepStrictEqual(find({ status: 'ok' }), ['Wireless Mouse', 'Desk Lamp']);
  assert.deepStrictEqual(find({ status: 'low' }), ['Mouse Mat']);
  assert.deepStrictEqual(find({ status: 'out' }), ['USB-C Cable, 1 m', 'Café Crème Mug']);
  assert.deepStrictEqual(find({ status: 'other' }), []);
});

// --- Together ---

test('a product has to match every part of the criteria', function () {
  assert.deepStrictEqual(find({ text: 'mouse', category: 'Electronics' }), ['Wireless Mouse']);
  assert.deepStrictEqual(find({ text: 'mouse', status: 'low' }), ['Mouse Mat']);
  assert.deepStrictEqual(find({ category: 'Electronics', status: 'out' }), ['USB-C Cable, 1 m']);
  assert.deepStrictEqual(find({ text: 'cable', category: 'Electronics', status: 'out' }), ['USB-C Cable, 1 m']);
  assert.deepStrictEqual(find({ text: 'cable', category: 'Electronics', status: 'ok' }), []);
  assert.deepStrictEqual(find({ text: 'mug', category: '', status: 'out' }), ['Café Crème Mug']);
});

test('filter returns the products themselves and leaves the list alone', function () {
  var before = PRODUCTS.slice();
  var found = Search.filter(PRODUCTS, { text: 'lamp' });
  assert.strictEqual(found.length, 1);
  assert.strictEqual(found[0], PRODUCTS[4]);
  assert.deepStrictEqual(PRODUCTS, before);
});

test('the sample products can be looked up', function () {
  var samples = sandbox.Inventory.getProducts();
  assert.strictEqual(samples.length, 12);
  assert.deepStrictEqual(find({ text: 'desk' }, samples), ['Desktop Stapler', 'LED Desk Lamp', 'Standing Desk, 160 cm']);
  assert.deepStrictEqual(find({ text: 'pkgboxm' }, samples), ['Shipping Box, Medium']);
  assert.deepStrictEqual(find({ text: '24inch' }, samples), ['24-inch Monitor']);
  assert.deepStrictEqual(find({ category: 'Furniture', status: 'ok' }, samples).length, 3);
  assert.deepStrictEqual(find({ status: 'out' }, samples), ['USB-C Cable, 1 m']);
  assert.deepStrictEqual(find({ status: 'low' }, samples), ['Desktop Stapler', 'Mechanical Keyboard']);
});

// --- Categories ---

test('categories lists each category once, in alphabetical order', function () {
  var list = Search.categories(PRODUCTS);
  assert.deepStrictEqual(Array.from(list), ['Electronics', 'furniture', 'Office Supplies']);
  assert.deepStrictEqual(Array.from(Search.categories([])), []);
});

test('categories that differ only in case are one, spelled as first seen', function () {
  var products = [
    product({ category: 'tools' }),
    product({ category: 'Tools' }),
    product({ category: 'TOOLS' }),
    product({ category: '' }),
    product({ category: 'Aisle 10' }),
    product({ category: 'Aisle 9' })
  ];
  assert.deepStrictEqual(Array.from(Search.categories(products)), ['Aisle 9', 'Aisle 10', 'tools']);
});

harness.run();
