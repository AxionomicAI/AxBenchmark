// Checkout and order history, persisted in localStorage.
//
// Stored as JSON under 'inventory.orders', oldest first:
//   [{ id, createdAt, total, lines: [{ productId, sku, name, price, quantity, subtotal }] }]
// Lines are snapshots (sku, name and price at the time of purchase), so history
// stays correct if a product is later edited or deleted.
const Orders = (() => {
  const KEY = 'inventory.orders';
  let memory = null;

  function read() {
    try {
      return localStorage.getItem(KEY);
    } catch (e) {
      return memory;
    }
  }

  function save(orders) {
    const json = JSON.stringify(orders);
    try {
      localStorage.setItem(KEY, json);
    } catch (e) {
      memory = json;
    }
  }

  function load() {
    let orders = [];
    try {
      orders = JSON.parse(read());
    } catch (e) { /* empty or corrupt: no history */ }
    return Array.isArray(orders) ? orders : [];
  }

  const round = (n) => Math.round(n * 100) / 100;

  // Order history, newest first.
  function all() {
    return load().slice().reverse();
  }

  function get(id) {
    return load().find((o) => o.id === id) || null;
  }

  function newId(orders) {
    const max = orders.reduce((m, o) => {
      const n = parseInt(String(o.id).replace(/^o/, ''), 10);
      return Number.isFinite(n) && n > m ? n : m;
    }, 0);
    return 'o' + (max + 1);
  }

  // Turns the cart into an order and deducts the stock. All-or-nothing: if any
  // line exceeds the stock on hand nothing is changed. Returns the new order.
  function checkout() {
    const lines = Cart.items(); // already clamped to current stock
    if (lines.length === 0) throw new Error('The cart is empty.');

    const products = Storage.load();
    const orderLines = lines.map(({ product, quantity }) => {
      const p = products.find((x) => x.id === product.id);
      if (!p || p.quantity < quantity) {
        throw new Error('Not enough stock of ' + product.name + '.');
      }
      return {
        productId: p.id, sku: p.sku, name: p.name, price: p.price,
        quantity, subtotal: round(p.price * quantity),
      };
    });

    const now = new Date().toISOString();
    orderLines.forEach((l) => {
      const p = products.find((x) => x.id === l.productId);
      p.quantity -= l.quantity;
      p.updatedAt = now;
    });
    const orders = load();
    const order = {
      id: newId(orders),
      createdAt: now,
      total: round(orderLines.reduce((sum, l) => sum + l.subtotal, 0)),
      lines: orderLines,
    };
    orders.push(order);
    // Order first: a recorded order without a stock change is easier to spot
    // than stock that vanished without a record.
    save(orders);
    Storage.save(products);
    Cart.clear();
    return order;
  }

  function clearHistory() {
    save([]);
  }

  return { all, get, checkout, clearHistory };
})();
