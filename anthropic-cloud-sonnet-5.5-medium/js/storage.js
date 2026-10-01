// Inventory data layer: products with stock, persisted in localStorage.
//
// Product shape:
//   { id, sku, name, category, price, quantity, reorderLevel, createdAt, updatedAt }
// Everything is stored as JSON under one key. Sample data is seeded only when
// the key does not exist yet, so deleting every product does not bring it back.
const Storage = (() => {
  const KEY = 'inventory.items';

  // Falls back to memory if localStorage is unavailable (e.g. blocked by the browser).
  let memory = null;

  function read() {
    try {
      return localStorage.getItem(KEY);
    } catch (e) {
      return memory;
    }
  }

  function write(json) {
    try {
      localStorage.setItem(KEY, json);
    } catch (e) {
      memory = json;
    }
  }

  function load() {
    const raw = read();
    if (raw === null) {
      const items = sampleData();
      save(items);
      return items;
    }
    try {
      const items = JSON.parse(raw);
      return Array.isArray(items) ? items : [];
    } catch (e) {
      return [];
    }
  }

  function save(items) {
    write(JSON.stringify(items));
  }

  function sampleData() {
    const now = new Date().toISOString();
    const rows = [
      ['LAP-001', 'Laptop 14"', 'Computers', 899.0, 12, 5],
      ['MON-027', '27" Monitor', 'Computers', 249.99, 8, 4],
      ['KEY-101', 'Mechanical Keyboard', 'Accessories', 79.5, 25, 10],
      ['MOU-050', 'Wireless Mouse', 'Accessories', 24.99, 3, 10],
      ['USB-064', 'USB-C Cable 2m', 'Accessories', 9.99, 60, 20],
      ['HDS-210', 'Noise-Cancelling Headset', 'Audio', 129.0, 0, 5],
      ['SPK-033', 'Bluetooth Speaker', 'Audio', 59.95, 14, 6],
      ['WEB-720', 'HD Webcam', 'Video', 49.0, 9, 5],
      ['DSK-140', 'Standing Desk', 'Furniture', 379.0, 4, 3],
      ['CHR-880', 'Ergonomic Chair', 'Furniture', 299.0, 6, 3],
    ];
    return rows.map(([sku, name, category, price, quantity, reorderLevel], i) => ({
      id: 'p' + (i + 1),
      sku, name, category, price, quantity, reorderLevel,
      createdAt: now,
      updatedAt: now,
    }));
  }

  function newId(items) {
    const max = items.reduce((m, p) => {
      const n = parseInt(String(p.id).replace(/^p/, ''), 10);
      return Number.isFinite(n) && n > m ? n : m;
    }, 0);
    return 'p' + (max + 1);
  }

  // Coerces and validates user-supplied fields; throws Error with a readable message.
  // With partial=true only the fields present are checked (used by update).
  function clean(fields, partial) {
    const out = {};
    const has = (k) => Object.prototype.hasOwnProperty.call(fields, k);

    ['sku', 'name', 'category'].forEach((k) => {
      if (has(k)) out[k] = String(fields[k]).trim();
    });
    if ((!partial || has('sku')) && !out.sku) throw new Error('SKU is required');
    if ((!partial || has('name')) && !out.name) throw new Error('Name is required');
    if (!partial && out.category === undefined) out.category = '';

    const wholeOnly = { price: false, quantity: true, reorderLevel: true };
    Object.keys(wholeOnly).forEach((k) => {
      if (partial && !has(k)) return;
      const v = has(k) && fields[k] !== '' ? Number(fields[k]) : 0;
      if (!Number.isFinite(v) || v < 0) throw new Error(k + ' must be a number >= 0');
      if (wholeOnly[k] && !Number.isInteger(v)) throw new Error(k + ' must be a whole number');
      out[k] = k === 'price' ? Math.round(v * 100) / 100 : v;
    });
    return out;
  }

  function skuTaken(items, sku, exceptId) {
    const s = sku.toLowerCase();
    return items.some((p) => p.id !== exceptId && p.sku.toLowerCase() === s);
  }

  function getAll() {
    return load();
  }

  function get(id) {
    return load().find((p) => p.id === id) || null;
  }

  function add(fields) {
    const items = load();
    const data = clean(fields, false);
    if (skuTaken(items, data.sku, null)) throw new Error('SKU "' + data.sku + '" already exists');
    const now = new Date().toISOString();
    const product = Object.assign({ id: newId(items) }, data, { createdAt: now, updatedAt: now });
    items.push(product);
    save(items);
    return product;
  }

  function update(id, fields) {
    const items = load();
    const product = items.find((p) => p.id === id);
    if (!product) throw new Error('Product not found');
    const data = clean(fields, true);
    if (data.sku !== undefined && skuTaken(items, data.sku, id)) {
      throw new Error('SKU "' + data.sku + '" already exists');
    }
    Object.assign(product, data, { updatedAt: new Date().toISOString() });
    save(items);
    return product;
  }

  // Changes stock by a signed whole-number delta; stock cannot go below zero.
  function adjustStock(id, delta) {
    const product = get(id);
    if (!product) throw new Error('Product not found');
    if (!Number.isInteger(delta)) throw new Error('Adjustment must be a whole number');
    if (product.quantity + delta < 0) throw new Error('Not enough stock');
    return update(id, { quantity: product.quantity + delta });
  }

  function remove(id) {
    const items = load();
    const next = items.filter((p) => p.id !== id);
    if (next.length === items.length) return false;
    save(next);
    return true;
  }

  // Discards all data and restores the sample products.
  function reset() {
    const items = sampleData();
    save(items);
    return items;
  }

  return { load, save, getAll, get, add, update, adjustStock, remove, reset };
})();
