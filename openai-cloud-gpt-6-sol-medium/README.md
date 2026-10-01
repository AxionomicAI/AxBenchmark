# Inventory

A small inventory website built with HTML5, CSS, and vanilla JavaScript. Items are stored in the browser's `localStorage`; no server, build step, framework, or dependency is required.

## Run

Open `index.html` in a browser. The first visit loads three sample products. Add a product with a name, stock quantity, and USD price; edit those fields from the product list, or delete a product. Use **Find a product** to filter the list by name as you type; matching is case insensitive, and Clear shows all products again. Add available products to the shopping cart, change their quantities, or remove them. The cart shows line subtotals and a total. Select **Complete purchase** to reduce stock by the quantities bought, empty the cart, and save the purchase in **Order history**. Past orders keep the product names, quantities, and prices from checkout even if products are later edited or deleted. Inventory, cart, and orders remain available when you reopen the page in the same browser. An intentionally empty inventory stays empty on later visits.

## Files

- `index.html` — page structure and form
- `styles.css` — responsive styling
- `app.js` — form handling and page rendering
- `inventory-data.js` — product, cart, and order storage operations

Products have an `id`, `name`, nonnegative whole-number `stock`, and nonnegative integer `priceCents`. `InventoryStore` provides product, cart, and checkout operations. Orders are saved under `inventory-orders` with a timestamp, line-item snapshots, and total in cents. Existing products without a price receive a $0.00 price that can be edited. Existing data saved by the original scaffold under `inventory-items` is imported on first load. Cart quantities cannot exceed stock; reducing stock or deleting a product adjusts the cart when it is next read. Checkout is unavailable when the cart is empty.

Browser storage is local to the browser and page origin. Clearing site data also clears the inventory.
