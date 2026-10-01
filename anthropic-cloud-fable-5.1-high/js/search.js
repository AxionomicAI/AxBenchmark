// Lookup: finds the products that match what the user is looking for. Works
// on a list of products from Inventory (js/inventory.js) and changes nothing.
// Exposes a single global, InventorySearch.
(function () {
  'use strict';

  // Lower case and without accents, so that 'cafe' finds 'Café'.
  function fold(text) {
    return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  // Letters, digits and spaces only, so that 'usbc' finds 'USB-C'.
  function withoutPunctuation(text) {
    return text.replace(/[^\p{L}\p{M}\p{N}\s]/gu, '');
  }

  // The words of a search text, each as typed and without its punctuation.
  function searchWords(text) {
    return fold(text).split(/\s+/).filter(Boolean).map(function (word) {
      return { typed: word, bare: withoutPunctuation(word) };
    });
  }

  // True if every word is somewhere in the product's name, SKU or category.
  // A word is also found when it only differs in punctuation: 'elcmse210'
  // finds the SKU 'ELC-MSE-210'.
  function hasWords(product, words) {
    // Words hold no white space, so none can match across two fields.
    var text = fold([product.name, product.sku, product.category].join('\n'));
    var bare = withoutPunctuation(text);
    return words.every(function (word) {
      return text.indexOf(word.typed) !== -1 ||
        (word.bare !== '' && bare.indexOf(word.bare) !== -1);
    });
  }

  function sameCategory(a, b) {
    return a.toLowerCase() === b.toLowerCase();
  }

  function isSet(value) {
    return value !== undefined && value !== null;
  }

  // Returns the products that match every part of criteria, in the order
  // they were given:
  //   text      words that must all be in the name, SKU or category
  //   category  a category (ignoring case), or '' for products without one
  //   status    a stock status, as returned by Inventory.stockStatus
  // A part that is left out or null matches every product, as does a text
  // without words.
  function filter(products, criteria) {
    var words = searchWords(criteria.text || '');
    return products.filter(function (product) {
      return hasWords(product, words) &&
        (!isSet(criteria.category) || sameCategory(product.category, criteria.category)) &&
        (!isSet(criteria.status) || Inventory.stockStatus(product) === criteria.status);
    });
  }

  // The categories the products are in, in alphabetical order. Categories
  // that differ only in case are one category, spelled as it first appears.
  function categories(products) {
    var found = [];
    products.forEach(function (product) {
      var isNew = product.category !== '' && !found.some(function (category) {
        return sameCategory(category, product.category);
      });
      if (isNew) {
        found.push(product.category);
      }
    });
    return found.sort(function (a, b) {
      return a.localeCompare(b, 'en', { sensitivity: 'base', numeric: true });
    });
  }

  window.InventorySearch = {
    filter: filter,
    categories: categories
  };
})();
