/* Shopping cart. Lines reference inventory products and stay within stock on hand. */
const Cart = (function () {
  function copyLine(line) {
    return {
      productId: line.productId,
      quantity: line.quantity
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
    if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
      return null;
    }
    return value;
  }

  function readLines() {
    const lines = [];
    const seen = Object.create(null);
    InventoryStorage.loadCart().forEach(function (record) {
      if (!record || typeof record !== "object") {
        return;
      }
      const productId = typeof record.productId === "string" ? record.productId.trim() : "";
      const quantity = parseQuantity(record.quantity);
      if (!productId || quantity == null || quantity < 1) {
        return;
      }
      if (seen[productId]) {
        const existing = lines.find(function (line) { return line.productId === productId; });
        existing.quantity += quantity;
        return;
      }
      seen[productId] = true;
      lines.push({ productId: productId, quantity: quantity });
    });
    return lines;
  }

  function productsById() {
    const byId = Object.create(null);
    Inventory.list().forEach(function (product) {
      byId[product.id] = product;
    });
    return byId;
  }

  function decorate(line, product) {
    return {
      productId: line.productId,
      quantity: line.quantity,
      name: product.name,
      sku: product.sku,
      stock: product.stock
    };
  }

  function persist(lines) {
    try {
      InventoryStorage.saveCart(lines.map(copyLine));
    } catch (_) {
      return { ok: false, error: "Could not save the cart in this browser." };
    }
    return { ok: true };
  }

  function reconcile(lines, byId) {
    const next = [];
    let changed = false;
    lines.forEach(function (line) {
      const product = byId[line.productId];
      if (!product || product.stock < 1) {
        changed = true;
        return;
      }
      const quantity = Math.min(line.quantity, product.stock);
      if (quantity !== line.quantity) {
        changed = true;
      }
      next.push({ productId: line.productId, quantity: quantity });
    });
    if (next.length !== lines.length) {
      changed = true;
    }
    return { lines: next, changed: changed };
  }

  function list() {
    const rawCount = InventoryStorage.loadCart().length;
    const lines = readLines();
    const byId = productsById();
    const reconciled = reconcile(lines, byId);
    if (reconciled.changed || rawCount !== reconciled.lines.length) {
      persist(reconciled.lines);
    }
    return reconciled.lines.map(function (line) {
      return decorate(line, byId[line.productId]);
    });
  }

  function totalQuantity(items) {
    const lines = items || list();
    return lines.reduce(function (sum, line) {
      return sum + line.quantity;
    }, 0);
  }

  function add(productId) {
    let product;
    try {
      product = Inventory.get(productId);
    } catch (_) {
      return { ok: false, error: "Could not save the cart in this browser." };
    }
    if (!product) {
      return { ok: false, error: "That product is no longer in the inventory." };
    }
    if (product.stock < 1) {
      return { ok: false, error: product.name + " is out of stock." };
    }
    const lines = readLines();
    const index = lines.findIndex(function (line) { return line.productId === productId; });
    const current = index === -1 ? 0 : lines[index].quantity;
    if (current >= product.stock) {
      return { ok: false, error: "Only " + product.stock + " " + product.name + " in stock." };
    }
    const line = { productId: productId, quantity: current + 1 };
    if (index === -1) {
      lines.push(line);
    } else {
      lines[index] = line;
    }
    const saved = persist(lines);
    if (!saved.ok) {
      return saved;
    }
    return { ok: true, item: decorate(line, product) };
  }

  function setQuantity(productId, quantity) {
    const parsed = parseQuantity(quantity);
    if (parsed == null) {
      return { ok: false, error: "Enter a whole number of units." };
    }
    let product;
    try {
      product = Inventory.get(productId);
    } catch (_) {
      return { ok: false, error: "Could not save the cart in this browser." };
    }
    const lines = readLines();
    const index = lines.findIndex(function (line) { return line.productId === productId; });
    if (index === -1) {
      return { ok: false, error: "That product is not in the cart." };
    }
    if (!product || product.stock < 1 || parsed === 0) {
      lines.splice(index, 1);
      const saved = persist(lines);
      if (!saved.ok) {
        return saved;
      }
      return { ok: true, removed: true, quantity: 0 };
    }
    const clamped = parsed > product.stock;
    const nextQuantity = clamped ? product.stock : parsed;
    lines[index] = { productId: productId, quantity: nextQuantity };
    const saved = persist(lines);
    if (!saved.ok) {
      return saved;
    }
    return {
      ok: true,
      clamped: clamped,
      quantity: nextQuantity,
      item: decorate(lines[index], product)
    };
  }

  function remove(productId) {
    const lines = readLines().filter(function (line) {
      return line.productId !== productId;
    });
    return persist(lines);
  }

  function contents() {
    return readLines().map(copyLine);
  }

  function clear() {
    return persist([]);
  }

  return { list, add, setQuantity, remove, totalQuantity, contents, clear };
})();
