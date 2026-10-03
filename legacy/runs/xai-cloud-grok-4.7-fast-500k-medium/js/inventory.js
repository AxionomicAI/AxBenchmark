/* Products and stock. Seeds a sample catalog the first time storage is empty. */
const Inventory = (function () {
  const MAX_NAME = 120;
  const MAX_SKU = 40;
  const MAX_STOCK = 999999;

  const SAMPLE_PRODUCTS = [
    { id: "p-widget-std", name: "Standard Widget", sku: "WID-001", stock: 42 },
    { id: "p-widget-dlx", name: "Deluxe Widget", sku: "WID-002", stock: 18 },
    { id: "p-usb-cable", name: "USB Cable", sku: "CBL-010", stock: 75 },
    { id: "p-mouse", name: "Wireless Mouse", sku: "MSE-220", stock: 15 },
    { id: "p-notebook", name: "Notebook", sku: "NB-014", stock: 60 },
    { id: "p-tape", name: "Packing Tape", sku: "PKG-003", stock: 0 }
  ];

  function copy(product) {
    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      stock: product.stock
    };
  }

  function sampleProducts() {
    return SAMPLE_PRODUCTS.map(copy);
  }

  function parseName(value) {
    if (typeof value !== "string") {
      return null;
    }
    const name = value.trim().replace(/\s+/g, " ");
    if (!name || name.length > MAX_NAME) {
      return null;
    }
    return name;
  }

  function parseSku(value) {
    if (value == null || value === "") {
      return "";
    }
    if (typeof value !== "string") {
      return null;
    }
    const sku = value.trim().replace(/\s+/g, " ");
    if (sku.length > MAX_SKU) {
      return null;
    }
    return sku;
  }

  function parseStock(value) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!/^\d+$/.test(trimmed)) {
        return null;
      }
      value = Number(trimmed);
    }
    if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > MAX_STOCK) {
      return null;
    }
    return value;
  }

  function normalize(record) {
    if (!record || typeof record !== "object") {
      return null;
    }
    const id = typeof record.id === "string" ? record.id.trim() : "";
    const name = parseName(record.name);
    const sku = parseSku(record.sku);
    const stock = parseStock(record.stock);
    if (!id || name == null || sku == null || stock == null) {
      return null;
    }
    return { id: id, name: name, sku: sku, stock: stock };
  }

  function readStored() {
    const products = [];
    const seen = Object.create(null);
    InventoryStorage.load().forEach(function (record) {
      const product = normalize(record);
      if (!product || seen[product.id]) {
        return;
      }
      seen[product.id] = true;
      products.push(product);
    });
    return products;
  }

  function storedProducts() {
    if (!InventoryStorage.hasStored()) {
      const seeded = sampleProducts();
      InventoryStorage.save(seeded);
      return seeded;
    }
    return readStored();
  }

  function list() {
    return storedProducts().map(copy);
  }

  function searchTerms(query) {
    if (typeof query !== "string") {
      return [];
    }
    const normalized = query.trim().replace(/\s+/g, " ").toLowerCase();
    if (!normalized) {
      return [];
    }
    return normalized.split(" ");
  }

  function matchesTerms(product, terms) {
    if (terms.length === 0) {
      return true;
    }
    const haystack = (product.name + "\n" + product.sku).toLowerCase();
    return terms.every(function (term) {
      return haystack.indexOf(term) !== -1;
    });
  }

  function find(query) {
    const terms = searchTerms(query);
    return list().filter(function (product) {
      return matchesTerms(product, terms);
    });
  }

  function get(id) {
    const products = list();
    for (let i = 0; i < products.length; i += 1) {
      if (products[i].id === id) {
        return products[i];
      }
    }
    return null;
  }

  function skuTaken(products, sku, exceptId) {
    if (!sku) {
      return false;
    }
    const needle = sku.toLowerCase();
    return products.some(function (product) {
      return product.id !== exceptId && product.sku.toLowerCase() === needle;
    });
  }

  function validateFields(fields, products, exceptId) {
    const name = parseName(fields.name);
    if (name == null) {
      return { ok: false, error: "Enter a product name." };
    }
    const sku = parseSku(fields.sku);
    if (sku == null) {
      return { ok: false, error: "Enter a shorter SKU." };
    }
    if (skuTaken(products, sku, exceptId)) {
      return { ok: false, error: "That SKU is already used." };
    }
    const stock = parseStock(fields.stock);
    if (stock == null) {
      return { ok: false, error: "Stock must be a whole number from 0 to " + MAX_STOCK + "." };
    }
    return { ok: true, fields: { name: name, sku: sku, stock: stock } };
  }

  function createId(products) {
    let id = "";
    do {
      id = "p-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
    } while (products.some(function (product) { return product.id === id; }));
    return id;
  }

  function persist(products) {
    try {
      InventoryStorage.save(products);
    } catch (_) {
      return { ok: false, error: "Could not save inventory in this browser." };
    }
    return { ok: true };
  }

  function add(fields) {
    let products;
    try {
      products = storedProducts();
    } catch (_) {
      return { ok: false, error: "Could not save inventory in this browser." };
    }
    const validated = validateFields(fields || {}, products, null);
    if (!validated.ok) {
      return validated;
    }
    const product = {
      id: createId(products),
      name: validated.fields.name,
      sku: validated.fields.sku,
      stock: validated.fields.stock
    };
    products.push(product);
    const saved = persist(products);
    if (!saved.ok) {
      return saved;
    }
    return { ok: true, product: copy(product) };
  }

  function update(id, changes) {
    let products;
    try {
      products = storedProducts();
    } catch (_) {
      return { ok: false, error: "Could not save inventory in this browser." };
    }
    const index = products.findIndex(function (product) { return product.id === id; });
    if (index === -1) {
      return { ok: false, error: "No product with that id." };
    }
    const current = products[index];
    const incoming = changes || {};
    const validated = validateFields({
      name: Object.prototype.hasOwnProperty.call(incoming, "name") ? incoming.name : current.name,
      sku: Object.prototype.hasOwnProperty.call(incoming, "sku") ? incoming.sku : current.sku,
      stock: Object.prototype.hasOwnProperty.call(incoming, "stock") ? incoming.stock : current.stock
    }, products, id);
    if (!validated.ok) {
      return validated;
    }
    const product = {
      id: current.id,
      name: validated.fields.name,
      sku: validated.fields.sku,
      stock: validated.fields.stock
    };
    products[index] = product;
    const saved = persist(products);
    if (!saved.ok) {
      return saved;
    }
    return { ok: true, product: copy(product) };
  }

  function setStock(id, stock) {
    return update(id, { stock: stock });
  }

  function sell(lines) {
    if (!Array.isArray(lines) || lines.length === 0) {
      return { ok: false, error: "Your cart is empty." };
    }
    let products;
    try {
      products = storedProducts();
    } catch (_) {
      return { ok: false, error: "Could not save inventory in this browser." };
    }
    const next = products.map(copy);
    for (let i = 0; i < lines.length; i += 1) {
      const request = lines[i] || {};
      const productId = typeof request.productId === "string" ? request.productId : "";
      const quantity = request.quantity;
      const index = next.findIndex(function (product) { return product.id === productId; });
      if (!productId || index === -1) {
        return { ok: false, error: "A product in the cart is no longer in the inventory." };
      }
      if (typeof quantity !== "number" || !Number.isSafeInteger(quantity) || quantity < 1) {
        return { ok: false, error: "Enter a whole number of units." };
      }
      const product = next[index];
      if (product.stock < 1) {
        return { ok: false, error: product.name + " is out of stock." };
      }
      if (quantity > product.stock) {
        return { ok: false, error: "Only " + product.stock + " " + product.name + " in stock." };
      }
      next[index] = {
        id: product.id,
        name: product.name,
        sku: product.sku,
        stock: product.stock - quantity
      };
    }
    const saved = persist(next);
    if (!saved.ok) {
      return saved;
    }
    return { ok: true };
  }

  function remove(id) {
    let products;
    try {
      products = storedProducts();
    } catch (_) {
      return { ok: false, error: "Could not save inventory in this browser." };
    }
    const index = products.findIndex(function (product) { return product.id === id; });
    if (index === -1) {
      return { ok: false, error: "No product with that id." };
    }
    const removed = products.splice(index, 1)[0];
    const saved = persist(products);
    if (!saved.ok) {
      return saved;
    }
    return { ok: true, product: copy(removed) };
  }

  return { list, get, add, update, setStock, sell, remove, find, searchTerms };
})();
