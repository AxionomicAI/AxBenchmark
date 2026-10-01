/* Checks for the inventory UI (js/app.js). Run by hand: node test/app.test.js
 *
 * app.js needs a DOM, so this stands up a minimal element stub — just enough
 * for the page's build-and-render code — and drives it the way a user would:
 * opening the form, filling fields, submitting, clicking row buttons. Each
 * setup() run loads the store and app scripts fresh, like a page load.
 */
"use strict";

var assert = require("assert");
var fs = require("fs");
var path = require("path");
var vm = require("vm");

var ROOT = path.join(__dirname, "..");
var STORAGE_KEY = "inventory.data.v1";
var SAMPLE_COUNT = 10;

function fakeStorage() {
  var data = {};
  return {
    setItem: function (key, value) {
      data[key] = String(value);
    },
    getItem: function (key) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
    },
    removeItem: function (key) {
      delete data[key];
    }
  };
}

/* ---- minimal DOM stub ----------------------------------------------------*/

function fire(element, type, event) {
  (element.listeners[type] || []).forEach(function (handler) {
    handler(event);
  });
}

function makeElement(tag) {
  var element = {
    tagName: tag,
    children: [],
    parentNode: null,
    attributes: {},
    listeners: {},
    className: "",
    hidden: false,
    value: "",
    type: "",
    id: "",
    name: "",
    scope: "",
    htmlFor: "",
    colSpan: 0,
    noValidate: false,
    focus: function () {},
    showModal: function () {},
    close: function () {
      fire(element, "close", { target: element });
    },
    setAttribute: function (name, value) {
      element.attributes[name] = String(value);
    },
    getAttribute: function (name) {
      return Object.prototype.hasOwnProperty.call(element.attributes, name)
        ? element.attributes[name]
        : null;
    },
    removeAttribute: function (name) {
      delete element.attributes[name];
    },
    appendChild: function (child) {
      child.parentNode = element;
      element.children.push(child);
      return child;
    },
    addEventListener: function (type, handler) {
      (element.listeners[type] = element.listeners[type] || []).push(handler);
    },
    /* Only the shape app.js asks for: tag with an optional [attribute]. */
    closest: function (selector) {
      var match = /^([a-zA-Z]+)(?:\[([^\]=]+)\])?$/.exec(selector);
      for (var node = element; node; node = node.parentNode) {
        if (match && node.tagName === match[1] &&
            (!match[2] || node.getAttribute(match[2]) !== null)) {
          return node;
        }
      }
      return null;
    }
  };
  Object.defineProperty(element, "textContent", {
    get: function () {
      var text = element._text || "";
      element.children.forEach(function (child) {
        text += child.textContent;
      });
      return text;
    },
    set: function (value) {
      element._text = value;
      if (value === "") {
        element.children = []; // matches the DOM: assigning clears children
      }
    }
  });
  /* A select's value only sticks while a matching option exists; when the
   * options are rebuilt without it, the browser falls back to the first
   * one. renderCategoryFilter depends on this behavior. */
  if (tag === "select") {
    Object.defineProperty(element, "value", {
      get: function () {
        var options = element.children.filter(function (child) {
          return child.tagName === "option";
        });
        for (var i = 0; i < options.length; i++) {
          if (options[i].value === element._value) {
            return element._value;
          }
        }
        return options.length > 0 ? options[0].value : "";
      },
      set: function (value) {
        element._value = String(value);
      }
    });
  }
  return element;
}

/* Run click handlers on the target and let the event bubble, which is what
 * the delegated table listener relies on. */
function click(target) {
  var event = { target: target, preventDefault: function () {} };
  for (var node = target; node; node = node.parentNode) {
    fire(node, "click", event);
  }
}

function submit(form) {
  fire(form, "submit", { target: form, preventDefault: function () {} });
}

function walk(node, fn) {
  fn(node);
  node.children.forEach(function (child) {
    walk(child, fn);
  });
}

function findFirst(root, predicate) {
  var found = null;
  walk(root, function (node) {
    if (!found && predicate(node)) {
      found = node;
    }
  });
  return found;
}

function findById(root, id) {
  return findFirst(root, function (node) {
    return node.id === id;
  });
}

function byClass(root, className) {
  return findFirst(root, function (node) {
    return (" " + node.className + " ").indexOf(" " + className + " ") !== -1;
  });
}

function tbodyOf(root) {
  return findFirst(root, function (node) {
    return node.tagName === "tbody";
  });
}

/* ---- driving the page -----------------------------------------------------*/

/* Load store.js and app.js into a fresh sandbox against a fresh DOM stub,
 * then run the DOMContentLoaded init. Pass a storage to simulate a reload
 * of the same browser profile. */
function setup(storage) {
  storage = storage || fakeStorage();
  var root = makeElement("section");
  var onReady = null;
  var sandbox = {
    window: { localStorage: storage },
    document: {
      createElement: makeElement,
      getElementById: function (id) {
        return id === "inventory-root" ? root : null;
      },
      addEventListener: function (type, handler) {
        if (type === "DOMContentLoaded") {
          onReady = handler;
        }
      }
    },
    console: console
  };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, "js", "store.js"), "utf8"), sandbox, {
    filename: path.join(ROOT, "js", "store.js")
  });
  sandbox.InventoryStore = sandbox.window.InventoryStore;
  vm.runInContext(fs.readFileSync(path.join(ROOT, "js", "app.js"), "utf8"), sandbox, {
    filename: path.join(ROOT, "js", "app.js")
  });
  onReady();
  return { store: sandbox.window.InventoryStore, storage: storage, root: root };
}

function toolbarAddButton(root) {
  return findFirst(root, function (node) {
    return node.tagName === "button" && node.className === "btn btn-primary" && node.type === "button";
  });
}

function firstRowButton(root, action) {
  var row = tbodyOf(root).children[0];
  return findFirst(row, function (node) {
    return node.getAttribute("data-action") === action;
  });
}

function confirmDeleteButton(root) {
  return findFirst(root, function (node) {
    return node.tagName === "button" && node.className === "btn btn-danger";
  });
}

function fillForm(root, values) {
  Object.keys(values).forEach(function (key) {
    findById(root, "product-" + key).value = values[key];
  });
}

function statusText(page) {
  return page.root.children[0].textContent;
}

function searchInput(root) {
  return findById(root, "product-search");
}

function categorySelect(root) {
  return findById(root, "category-filter");
}

function clearLookupButton(root) {
  return findFirst(root, function (node) {
    return node.tagName === "button" && node.className === "btn btn-small lookup-clear";
  });
}

function rowNames(root) {
  return tbodyOf(root).children.map(function (row) {
    return row.children[0].textContent;
  });
}

function rowButton(root, rowIndex, action) {
  var row = tbodyOf(root).children[rowIndex];
  return findFirst(row, function (node) {
    return node.getAttribute("data-action") === action;
  });
}

function cartTbody(root) {
  var table = findFirst(root, function (node) {
    return node.className === "product-table cart-table";
  });
  return findFirst(table, function (node) {
    return node.tagName === "tbody";
  });
}

function cartRowNames(root) {
  return cartTbody(root).children.map(function (row) {
    return row.children[0].textContent;
  });
}

function qtyInputs(root) {
  var found = [];
  walk(root, function (node) {
    if (node.className === "qty-input") {
      found.push(node);
    }
  });
  return found;
}

function cartActionButton(root, action) {
  return findFirst(cartTbody(root), function (node) {
    return node.getAttribute("data-action") === action;
  });
}

function cartTotalCell(root) {
  return byClass(root, "cart-total");
}

function clearCartButton(root) {
  return findFirst(root, function (node) {
    return node.tagName === "button" &&
      node.className === "btn btn-small btn-quiet-danger cart-clear";
  });
}

function checkoutButton(root) {
  return findFirst(root, function (node) {
    return node.tagName === "button" &&
      node.className === "btn btn-primary cart-checkout";
  });
}

/* The checkout dialog: the second confirm-style dialog on the page, appended
 * after the delete confirmation. */
function checkoutDialog(root) {
  var found = null;
  walk(root, function (node) {
    if (node.tagName === "dialog" && node.className === "dialog dialog-confirm") {
      found = node;
    }
  });
  return found;
}

function dialogButton(dialog, label) {
  return findFirst(dialog, function (node) {
    return node.tagName === "button" && node._text === label;
  });
}

function ordersTbody(root) {
  var table = findFirst(root, function (node) {
    return node.className === "product-table orders-table";
  });
  return findFirst(table, function (node) {
    return node.tagName === "tbody";
  });
}

/* ---- checks ------------------------------------------------------------------*/

var failures = 0;
function test(name, fn) {
  try {
    fn();
    console.log("ok - " + name);
  } catch (err) {
    failures += 1;
    console.log("FAIL - " + name);
    console.log(String((err && err.stack) || err));
  }
}

test("renders the seeded catalogue as a table", function () {
  var page = setup();
  assert.strictEqual(tbodyOf(page.root).children.length, SAMPLE_COUNT);
  assert.ok(/10 products tracked/.test(page.root.children[1].textContent), "summary line");
  assert.ok(/^\$/.test(byClass(page.root, "tfoot-value").textContent), "total value shown");
  assert.ok(byClass(page.root, "badge-out"), "out-of-stock badge rendered");
  assert.ok(byClass(page.root, "badge-low"), "low-stock badge rendered");
});

test("adds a product through the form and persists it", function () {
  var page = setup();
  click(toolbarAddButton(page.root));
  fillForm(page.root, {
    name: "Test Widget",
    sku: "TST-900",
    category: "Electronics",
    quantity: "5",
    unitPrice: "1.5"
  });
  submit(findFirst(page.root, function (node) {
    return node.tagName === "form";
  }));

  assert.strictEqual(page.store.getProducts().length, SAMPLE_COUNT + 1);
  assert.strictEqual(JSON.parse(page.storage.getItem(STORAGE_KEY)).products.length, SAMPLE_COUNT + 1);
  assert.ok(statusText(page).indexOf("Added") === 0, "status announces the add");
  assert.ok(findFirst(page.root, function (node) {
    return node.className === "cell-name" && node._text === "Test Widget";
  }), "new row rendered");
});

test("shows validation errors and saves nothing", function () {
  var page = setup();
  click(toolbarAddButton(page.root));
  fillForm(page.root, { name: "", sku: "elc-wm-001" });
  submit(findFirst(page.root, function (node) {
    return node.tagName === "form";
  }));

  assert.strictEqual(page.store.getProducts().length, SAMPLE_COUNT);
  var nameError = findById(page.root, "error-name");
  assert.strictEqual(nameError.hidden, false);
  assert.strictEqual(nameError._text, "Name is required.");
  assert.ok(findById(page.root, "error-sku")._text.indexOf("already used") !== -1);
});

test("edits a product from its row", function () {
  var page = setup();
  click(firstRowButton(page.root, "edit"));
  assert.strictEqual(findById(page.root, "product-name").value, "Wireless Mouse");
  fillForm(page.root, { quantity: "99" });
  submit(findFirst(page.root, function (node) {
    return node.tagName === "form";
  }));

  assert.strictEqual(page.store.getProducts().length, SAMPLE_COUNT);
  assert.strictEqual(tbodyOf(page.root).children[0].children[3].textContent, "99");
  assert.ok(statusText(page).indexOf("Updated") === 0, "status announces the edit");
});

test("deletes a product after confirmation", function () {
  var page = setup();
  click(firstRowButton(page.root, "delete"));
  assert.ok(byClass(page.root, "dialog-text")._text.indexOf("Wireless Mouse") !== -1,
    "confirm dialog names the product");

  click(confirmDeleteButton(page.root));
  assert.strictEqual(page.store.getProducts().length, SAMPLE_COUNT - 1);
  assert.strictEqual(tbodyOf(page.root).children[0].children[0]._text, "Mechanical Keyboard");
  assert.ok(statusText(page).indexOf("Deleted") === 0, "status announces the delete");
});

test("shows the empty state when the last product is deleted", function () {
  var page = setup();
  var tbody = tbodyOf(page.root);
  while (tbody.children.length > 0) {
    click(firstRowButton(page.root, "delete"));
    click(confirmDeleteButton(page.root));
  }

  assert.strictEqual(page.store.getProducts().length, 0);
  assert.strictEqual(byClass(page.root, "empty-state").hidden, false);
  assert.strictEqual(byClass(page.root, "table-wrap").hidden, true);
});

/* ---- lookup -------------------------------------------------------------------*/

test("the search box filters rows as you type", function () {
  var page = setup();
  var input = searchInput(page.root);
  input.value = "notebook";
  fire(input, "input", {});

  assert.deepStrictEqual(rowNames(page.root), ["Notebook (A5, dotted)"]);
  assert.ok(/Showing 1 of 10 products/.test(page.root.children[1].textContent),
    "summary counts the filtered view");
  assert.strictEqual(byClass(page.root, "tfoot-label")._text,
    "Total value of shown products");
});

test("a search with no matches shows the no-results state", function () {
  var page = setup();
  var input = searchInput(page.root);
  input.value = "zzz-nothing";
  fire(input, "input", {});

  assert.strictEqual(tbodyOf(page.root).children.length, 0);
  assert.strictEqual(byClass(page.root, "no-results").hidden, false);
  assert.strictEqual(byClass(page.root, "empty-state").hidden, true);
  assert.strictEqual(byClass(page.root, "table-wrap").hidden, true);
});

test("the category filter narrows the table and survives re-renders", function () {
  var page = setup();
  var select = categorySelect(page.root);
  select.value = "Stationery";
  fire(select, "change", {});
  assert.deepStrictEqual(rowNames(page.root), [
    "Notebook (A5, dotted)",
    "Gel Pens (pack of 12)",
    "Whiteboard Markers (4 pack)"
  ]);

  searchInput(page.root).value = "notebook";
  fire(searchInput(page.root), "input", {});
  assert.deepStrictEqual(rowNames(page.root), ["Notebook (A5, dotted)"]);
  assert.strictEqual(categorySelect(page.root).value, "Stationery",
    "category choice kept while searching");
});

test("clear resets the search and category filter", function () {
  var page = setup();
  var input = searchInput(page.root);
  input.value = "mouse";
  fire(input, "input", {});
  assert.strictEqual(clearLookupButton(page.root).hidden, false);

  click(clearLookupButton(page.root));

  assert.strictEqual(input.value, "");
  assert.strictEqual(tbodyOf(page.root).children.length, SAMPLE_COUNT);
  assert.ok(/10 products tracked/.test(page.root.children[1].textContent),
    "summary returns to the full catalogue");
  assert.strictEqual(clearLookupButton(page.root).hidden, true);
  assert.strictEqual(byClass(page.root, "tfoot-label")._text, "Total inventory value");
});

test("Escape clears an active search", function () {
  var page = setup();
  var input = searchInput(page.root);
  input.value = "mouse";
  fire(input, "input", {});
  assert.strictEqual(tbodyOf(page.root).children.length, 1);

  fire(input, "keydown", { key: "Escape", preventDefault: function () {} });

  assert.strictEqual(input.value, "");
  assert.strictEqual(tbodyOf(page.root).children.length, SAMPLE_COUNT);
});

test("re-categorizing a category's last product resets the filter view", function () {
  var page = setup();
  var select = categorySelect(page.root);
  select.value = "Furniture";
  fire(select, "change", {});
  assert.strictEqual(tbodyOf(page.root).children.length, 3);

  /* Re-categorize every Furniture product. The filter choice must fall back
   * to "All categories" and the whole view must follow in the same render —
   * not keep showing the stale filtered state until the next interaction. */
  for (var i = 0; i < 3; i++) {
    click(rowButton(page.root, 0, "edit"));
    fillForm(page.root, { category: "Misc" });
    submit(findFirst(page.root, function (node) {
      return node.tagName === "form";
    }));
  }

  assert.strictEqual(categorySelect(page.root).value, "", "stale selection resets");
  assert.strictEqual(tbodyOf(page.root).children.length, SAMPLE_COUNT,
    "table shows the full catalogue again");
  assert.ok(/10 products tracked/.test(page.root.children[1].textContent),
    "summary matches the reset filter");
});

/* ---- cart ------------------------------------------------------------------*/

var CART_KEY = "inventory.cart.v1";

test("starts with an empty cart and an empty state", function () {
  var page = setup();
  assert.strictEqual(page.store.getCart().length, 0);
  assert.strictEqual(byClass(page.root, "cart-empty").hidden, false);
  assert.strictEqual(byClass(page.root, "cart-wrap").hidden, true);
  assert.strictEqual(clearCartButton(page.root).hidden, true);
});

test("adds a product to the cart from its row", function () {
  var page = setup();
  click(rowButton(page.root, 0, "add-cart"));

  assert.strictEqual(page.store.getCart().length, 1);
  assert.ok(page.storage.getItem(CART_KEY).indexOf("p-001") !== -1, "cart persisted");
  assert.deepStrictEqual(cartRowNames(page.root), ["Wireless Mouse"]);
  assert.strictEqual(qtyInputs(page.root)[0].value, "1");
  assert.strictEqual(byClass(page.root, "cart-line-total").textContent, "$24.99");
  assert.strictEqual(cartTotalCell(page.root).textContent, "$24.99");
  assert.ok(/Total \(1 unit\)/.test(byClass(page.root, "cart-foot-label").textContent));
  assert.strictEqual(byClass(page.root, "cart-empty").hidden, true);
  assert.ok(statusText(page).indexOf("Added") === 0, "status announces the add");
});

test("repeated adds stack and the steppers change the total", function () {
  var page = setup();
  click(rowButton(page.root, 0, "add-cart"));
  click(rowButton(page.root, 0, "add-cart"));
  assert.strictEqual(qtyInputs(page.root)[0].value, "2", "stacked to 2");

  click(cartActionButton(page.root, "cart-inc"));
  assert.strictEqual(page.store.getCart()[0].quantity, 3);
  assert.strictEqual(byClass(page.root, "cart-line-total").textContent, "$74.97");
  assert.strictEqual(cartTotalCell(page.root).textContent, "$74.97");

  click(cartActionButton(page.root, "cart-dec"));
  click(cartActionButton(page.root, "cart-dec"));
  click(cartActionButton(page.root, "cart-dec")); // 1 → 0 removes the line
  assert.strictEqual(page.store.getCart().length, 0);
  assert.strictEqual(byClass(page.root, "cart-empty").hidden, false);
  assert.strictEqual(byClass(page.root, "cart-wrap").hidden, true);
  assert.ok(statusText(page).indexOf("Removed") === 0, "status announces the removal");
});

test("the quantity input sets an exact amount; bad input is restored", function () {
  var page = setup();
  click(rowButton(page.root, 0, "add-cart"));

  var input = qtyInputs(page.root)[0];
  input.value = "5";
  fire(input, "change", {});
  assert.strictEqual(page.store.getCart()[0].quantity, 5);
  assert.strictEqual(cartTotalCell(page.root).textContent, "$124.95");

  qtyInputs(page.root)[0].value = "bogus";
  fire(qtyInputs(page.root)[0], "change", {});
  assert.strictEqual(page.store.getCart()[0].quantity, 5, "bad input changes nothing");
  assert.strictEqual(qtyInputs(page.root)[0].value, "5", "the field is restored");
});

test("removes a cart item from its row", function () {
  var page = setup();
  click(rowButton(page.root, 0, "add-cart"));

  click(cartActionButton(page.root, "cart-remove"));

  assert.strictEqual(page.store.getCart().length, 0);
  assert.strictEqual(byClass(page.root, "cart-empty").hidden, false);
  assert.ok(statusText(page).indexOf("Removed") === 0);
});

test("clear cart empties everything at once", function () {
  var page = setup();
  click(rowButton(page.root, 0, "add-cart"));
  click(rowButton(page.root, 1, "add-cart"));
  assert.strictEqual(page.store.getCart().length, 2);

  click(clearCartButton(page.root));

  assert.strictEqual(page.store.getCart().length, 0);
  assert.strictEqual(byClass(page.root, "cart-empty").hidden, false);
  assert.strictEqual(clearCartButton(page.root).hidden, true);
  assert.deepStrictEqual(JSON.parse(page.storage.getItem(CART_KEY)).items, []);
});

test("add to cart is capped by the stock on hand", function () {
  var page = setup();
  var chair = rowButton(page.root, 5, "add-cart"); // Office Chair: 3 in stock
  click(chair);
  click(rowButton(page.root, 5, "add-cart"));
  click(rowButton(page.root, 5, "add-cart"));
  assert.strictEqual(page.store.getCart()[0].quantity, 3);
  assert.strictEqual(rowButton(page.root, 5, "add-cart").disabled, true,
    "button disabled once every unit is in the cart");

  click(rowButton(page.root, 5, "add-cart")); // the stub still fires; the handler guards
  assert.strictEqual(page.store.getCart()[0].quantity, 3);
});

test("out-of-stock products cannot be added to the cart", function () {
  var page = setup();
  var button = rowButton(page.root, 6, "add-cart"); // seeded with 0 on hand
  assert.strictEqual(button.disabled, true);
  click(button);
  assert.strictEqual(page.store.getCart().length, 0);
});

test("the cart survives a page reload", function () {
  var page = setup();
  click(rowButton(page.root, 0, "add-cart"));

  var reloaded = setup(page.storage);
  assert.deepStrictEqual(cartRowNames(reloaded.root), ["Wireless Mouse"]);
  assert.strictEqual(qtyInputs(reloaded.root)[0].value, "1");
  assert.strictEqual(cartTotalCell(reloaded.root).textContent, "$24.99");
});

test("deleting a product takes it out of the cart", function () {
  var page = setup();
  click(rowButton(page.root, 0, "add-cart")); // Wireless Mouse

  click(rowButton(page.root, 0, "delete"));
  click(confirmDeleteButton(page.root));

  assert.strictEqual(page.store.getCart().length, 0);
  assert.strictEqual(byClass(page.root, "cart-empty").hidden, false);
  assert.ok(/removed it from the cart/.test(statusText(page)),
    "status mentions the cart");
});

/* ---- checkout --------------------------------------------------------------------*/

var ORDERS_KEY = "inventory.orders.v1";

function placeOrder(page, row, times) {
  for (var i = 0; i < times; i++) {
    click(rowButton(page.root, row, "add-cart"));
  }
  click(checkoutButton(page.root));
  click(dialogButton(checkoutDialog(page.root), "Place order"));
}

test("the checkout button shows only when the cart has something in it", function () {
  var page = setup();
  assert.strictEqual(checkoutButton(page.root).hidden, true);

  click(rowButton(page.root, 0, "add-cart"));
  assert.strictEqual(checkoutButton(page.root).hidden, false);
});

test("checkout asks for confirmation and cancel keeps the cart", function () {
  var page = setup();
  click(rowButton(page.root, 0, "add-cart"));
  click(rowButton(page.root, 0, "add-cart"));
  click(checkoutButton(page.root));

  var text = byClass(checkoutDialog(page.root), "checkout-text")._text;
  assert.ok(/2 units/.test(text), "the dialog counts the units");
  assert.ok(/\$49\.98/.test(text), "the dialog totals the order");

  click(dialogButton(checkoutDialog(page.root), "Cancel"));
  assert.strictEqual(page.store.getCart().length, 1, "nothing checked out");
  assert.strictEqual(page.store.getCart()[0].quantity, 2);
  assert.strictEqual(page.store.getOrders().length, 0);
  assert.strictEqual(JSON.parse(page.storage.getItem(ORDERS_KEY)), null);
});

test("placing the order updates stock, empties the cart and records it", function () {
  var page = setup();
  placeOrder(page, 0, 2); // 2 × Wireless Mouse

  assert.strictEqual(page.store.getProducts()[0].quantity, 40, "stock reduced");
  assert.strictEqual(page.store.getCart().length, 0);
  assert.deepStrictEqual(JSON.parse(page.storage.getItem(CART_KEY)).items, []);

  var stored = JSON.parse(page.storage.getItem(ORDERS_KEY));
  assert.strictEqual(stored.orders.length, 1);
  assert.strictEqual(stored.orders[0].number, 1001);

  var rows = ordersTbody(page.root).children;
  assert.strictEqual(rows.length, 1);
  assert.strictEqual(rows[0].children[0]._text, "#1001");
  assert.strictEqual(rows[0].children[4].textContent, "$49.98");
  assert.ok(/Order #1001 placed/.test(statusText(page)), "status announces it");
  assert.strictEqual(byClass(page.root, "cart-empty").hidden, false, "cart back to empty");
});

test("order history lists the newest order first", function () {
  var page = setup();
  placeOrder(page, 0, 1); // Wireless Mouse → #1001
  placeOrder(page, 1, 1); // Mechanical Keyboard → #1002

  var rows = ordersTbody(page.root).children;
  assert.deepStrictEqual(rows.map(function (row) {
    return row.children[0]._text;
  }), ["#1002", "#1001"]);
});

test("buying the last unit flags the product out of stock", function () {
  var page = setup();
  var chairRow = 5; // Office Chair: 3 in stock
  placeOrder(page, chairRow, 3);

  assert.strictEqual(page.store.getProducts()[chairRow].quantity, 0);
  var button = rowButton(page.root, chairRow, "add-cart");
  assert.strictEqual(button.disabled, true);
  assert.strictEqual(button.title, "Out of stock");
  assert.ok(byClass(tbodyOf(page.root).children[chairRow], "badge-out"),
    "the row shows the out-of-stock badge");
});

if (failures > 0) {
  console.log(failures + " test(s) failed");
  process.exit(1);
}
console.log("All tests passed.");
