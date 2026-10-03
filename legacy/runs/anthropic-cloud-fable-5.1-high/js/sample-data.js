// Sample products loaded into the inventory the first time the site is opened.
// Exposes a single global, InventorySampleData. Prices are in cents.
(function () {
  'use strict';

  window.InventorySampleData = [
    { name: 'Ballpoint Pens, Blue (Box of 12)', sku: 'OFF-PEN-012', category: 'Office Supplies', quantity: 140, priceCents: 499, reorderLevel: 30 },
    { name: 'A4 Copy Paper (500 Sheets)', sku: 'OFF-PPR-500', category: 'Office Supplies', quantity: 62, priceCents: 649, reorderLevel: 20 },
    { name: 'Desktop Stapler', sku: 'OFF-STP-001', category: 'Office Supplies', quantity: 8, priceCents: 1295, reorderLevel: 10 },
    { name: 'Wireless Mouse', sku: 'ELC-MSE-210', category: 'Electronics', quantity: 35, priceCents: 1999, reorderLevel: 10 },
    { name: 'USB-C Cable, 1 m', sku: 'ELC-CBL-100', category: 'Electronics', quantity: 0, priceCents: 850, reorderLevel: 15 },
    { name: 'Mechanical Keyboard', sku: 'ELC-KBD-104', category: 'Electronics', quantity: 5, priceCents: 7490, reorderLevel: 5 },
    { name: '24-inch Monitor', sku: 'ELC-MON-024', category: 'Electronics', quantity: 12, priceCents: 14900, reorderLevel: 4 },
    { name: 'LED Desk Lamp', sku: 'FUR-LMP-030', category: 'Furniture', quantity: 18, priceCents: 2999, reorderLevel: 6 },
    { name: 'Ergonomic Office Chair', sku: 'FUR-CHR-200', category: 'Furniture', quantity: 7, priceCents: 18900, reorderLevel: 3 },
    { name: 'Standing Desk, 160 cm', sku: 'FUR-DSK-160', category: 'Furniture', quantity: 3, priceCents: 39900, reorderLevel: 2 },
    { name: 'Packing Tape, 48 mm', sku: 'PKG-TPE-048', category: 'Packaging', quantity: 96, priceCents: 275, reorderLevel: 24 },
    { name: 'Shipping Box, Medium', sku: 'PKG-BOX-M', category: 'Packaging', quantity: 240, priceCents: 120, reorderLevel: 100 }
  ];
})();
