/* Checkout and order history. A purchase records the cart, then reduces stock. */
const Orders = (function () {
  function copyLine(line) {
    return {
      productId: line.productId,
      name: line.name,
      sku: line.sku,
      quantity: line.quantity
    };
  }

  function copyOrder(order) {
    const lines = order.lines.map(copyLine);
    return {
      id: order.id,
      number: order.number,
      placedAt: order.placedAt,
      lines: lines,
      units: lines.reduce(function (sum, line) { return sum + line.quantity; }, 0)
    };
  }

  function parseQuantity(value) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!/^\d+$/.test(trimmed)) {
        return null;
      }
      value = Number(trimmed);
    }
    if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1) {
      return null;
    }
    return value;
  }

  function normalizeLine(record) {
    if (!record || typeof record !== "object") {
      return null;
    }
    const productId = typeof record.productId === "string" ? record.productId.trim() : "";
    const name = typeof record.name === "string" ? record.name.trim().replace(/\s+/g, " ") : "";
    const sku = typeof record.sku === "string" ? record.sku.trim().replace(/\s+/g, " ") : "";
    const quantity = parseQuantity(record.quantity);
    if (!productId || !name || quantity == null) {
      return null;
    }
    return { productId: productId, name: name, sku: sku, quantity: quantity };
  }

  function normalizeOrder(record) {
    if (!record || typeof record !== "object") {
      return null;
    }
    const id = typeof record.id === "string" ? record.id.trim() : "";
    const placedAt = typeof record.placedAt === "string" ? record.placedAt.trim() : "";
    const number = Number.isSafeInteger(record.number) && record.number > 0 ? record.number : 0;
    if (!id || !placedAt || !Array.isArray(record.lines)) {
      return null;
    }
    const lines = [];
    record.lines.forEach(function (line) {
      const normalized = normalizeLine(line);
      if (normalized) {
        lines.push(normalized);
      }
    });
    if (lines.length === 0) {
      return null;
    }
    return { id: id, number: number, placedAt: placedAt, lines: lines };
  }

  function readOrders() {
    const orders = [];
    const seen = Object.create(null);
    InventoryStorage.loadOrders().forEach(function (record) {
      const order = normalizeOrder(record);
      if (!order || seen[order.id]) {
        return;
      }
      seen[order.id] = true;
      orders.push(order);
    });
    orders.sort(function (a, b) {
      if (a.number !== b.number) {
        return b.number - a.number;
      }
      if (a.placedAt === b.placedAt) {
        return 0;
      }
      return a.placedAt < b.placedAt ? 1 : -1;
    });
    return orders;
  }

  function productsById() {
    const byId = Object.create(null);
    Inventory.list().forEach(function (product) {
      byId[product.id] = product;
    });
    return byId;
  }

  function nextNumber(orders) {
    return orders.reduce(function (max, order) {
      return Math.max(max, order.number);
    }, 0) + 1;
  }

  function createId(orders) {
    let id = "";
    do {
      id = "o-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
    } while (orders.some(function (order) { return order.id === id; }));
    return id;
  }

  function summary() {
    let lines;
    let byId;
    try {
      lines = Cart.contents();
      byId = productsById();
    } catch (_) {
      return { ok: false, error: "Could not complete checkout in this browser." };
    }
    if (lines.length === 0) {
      return { ok: false, error: "Your cart is empty." };
    }
    const items = [];
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      const product = byId[line.productId];
      if (!product) {
        return { ok: false, error: "A product in the cart is no longer in the inventory." };
      }
      if (product.stock < 1) {
        return { ok: false, error: product.name + " is out of stock." };
      }
      if (line.quantity > product.stock) {
        return { ok: false, error: "Only " + product.stock + " " + product.name + " in stock." };
      }
      items.push({
        productId: product.id,
        name: product.name,
        sku: product.sku,
        quantity: line.quantity,
        stock: product.stock
      });
    }
    const units = items.reduce(function (sum, item) { return sum + item.quantity; }, 0);
    return { ok: true, items: items, units: units };
  }

  function restoreStock(items) {
    for (let i = 0; i < items.length; i += 1) {
      try {
        const result = Inventory.setStock(items[i].productId, items[i].stock);
        if (!result.ok) {
          return false;
        }
      } catch (_) {
        return false;
      }
    }
    return true;
  }

  function restoreOrders(existed, previous) {
    try {
      if (!existed) {
        InventoryStorage.clearOrders();
      } else {
        InventoryStorage.saveOrders(previous);
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  function checkout() {
    const plan = summary();
    if (!plan.ok) {
      return plan;
    }
    let existing;
    let ordersExisted;
    let previousOrders;
    try {
      existing = readOrders();
      ordersExisted = InventoryStorage.hasOrders();
      previousOrders = InventoryStorage.loadOrders();
    } catch (_) {
      return { ok: false, error: "Could not complete checkout in this browser." };
    }

    const sold = Inventory.sell(plan.items);
    if (!sold.ok) {
      return sold;
    }

    const order = {
      id: createId(existing),
      number: nextNumber(existing),
      placedAt: new Date().toISOString(),
      lines: plan.items.map(copyLine)
    };
    const stored = existing.map(function (current) {
      return {
        id: current.id,
        number: current.number,
        placedAt: current.placedAt,
        lines: current.lines.map(copyLine)
      };
    });
    stored.unshift({
      id: order.id,
      number: order.number,
      placedAt: order.placedAt,
      lines: order.lines.map(copyLine)
    });

    try {
      InventoryStorage.saveOrders(stored);
    } catch (_) {
      restoreStock(plan.items);
      return { ok: false, error: "Could not save orders in this browser." };
    }

    const cleared = Cart.clear();
    if (!cleared.ok) {
      restoreOrders(ordersExisted, previousOrders);
      restoreStock(plan.items);
      return cleared;
    }
    return { ok: true, order: copyOrder(order) };
  }

  function list() {
    return readOrders().map(copyOrder);
  }

  return { summary, checkout, list };
})();
