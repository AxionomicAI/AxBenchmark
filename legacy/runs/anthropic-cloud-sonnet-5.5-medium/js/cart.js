// Shopping cart: product ids with quantities, persisted in localStorage.
//
// Stored as JSON under 'inventory.cart': [{ id, quantity }]. Only ids and
// quantities are stored; names and prices are always read from the inventory
// so the cart never shows stale data. Quantities are capped at the stock on
// hand, and lines whose product was deleted are dropped.
const Cart = (() => {
  const KEY = 'inventory.cart';
  let memory = null;

  function read() {
    try {
      return localStorage.getItem(KEY);
    } catch (e) {
      return memory;
    }
  }

  function save(lines) {
    const json = JSON.stringify(lines);
    try {
      localStorage.setItem(KEY, json);
    } catch (e) {
      memory = json;
    }
  }

  function load() {
    let lines = [];
    try {
      lines = JSON.parse(read());
    } catch (e) { /* empty or corrupt: start with an empty cart */ }
    return Array.isArray(lines) ? lines.filter((l) => l && typeof l.id === 'string') : [];
  }

  const round = (n) => Math.round(n * 100) / 100;

  // Cart lines joined with their products, quantities clamped to current stock.
  // Persists the cleaned-up cart if anything had to change.
  function items() {
    const raw = load();
    const lines = [];
    raw.forEach((l) => {
      const product = Storage.get(l.id);
      if (!product) return;
      const quantity = Math.min(Math.floor(Number(l.quantity)) || 0, product.quantity);
      if (quantity < 1) return;
      lines.push({ product, quantity, subtotal: round(product.price * quantity) });
    });
    const changed = lines.length !== raw.length
      || lines.some((l, i) => l.quantity !== raw[i].quantity || l.product.id !== raw[i].id);
    if (changed) save(lines.map((l) => ({ id: l.product.id, quantity: l.quantity })));
    return lines;
  }

  function quantityOf(id) {
    const line = items().find((l) => l.product.id === id);
    return line ? line.quantity : 0;
  }

  // Set the quantity of a product (0 removes it). Throws if it exceeds stock.
  function setQuantity(id, quantity) {
    quantity = Math.floor(Number(quantity));
    if (!Number.isFinite(quantity) || quantity < 0) throw new Error('Quantity must be a whole number, 0 or more.');
    const product = Storage.get(id);
    if (!product) throw new Error('Product no longer exists.');
    if (quantity > product.quantity) {
      throw new Error('Only ' + product.quantity + ' of ' + product.name + ' in stock.');
    }
    const lines = items().map((l) => ({ id: l.product.id, quantity: l.quantity })).filter((l) => l.id !== id);
    if (quantity > 0) lines.push({ id, quantity });
    save(lines);
  }

  function add(id, quantity = 1) {
    setQuantity(id, quantityOf(id) + quantity);
  }

  function remove(id) {
    setQuantity(id, 0);
  }

  function clear() {
    save([]);
  }

  function count() {
    return items().reduce((n, l) => n + l.quantity, 0);
  }

  function total() {
    return round(items().reduce((sum, l) => sum + l.subtotal, 0));
  }

  return { items, quantityOf, setQuantity, add, remove, clear, count, total };
})();
