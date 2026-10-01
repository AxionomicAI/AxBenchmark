# Inventory Website

A simple inventory management website built with HTML5 and vanilla JavaScript.
No frameworks or libraries are used. All data is persisted in the browser's
`localStorage`, so the site works by simply opening `index.html` in a browser.

## Getting started

No build step required. Open `index.html` in any modern browser:

```
open index.html        # macOS
xdg-open index.html    # Linux
```

## Project structure

```
.
├── index.html      # Main page
├── css/
│   └── styles.css  # Styles
├── js/
│   └── app.js      # Application logic
└── README.md
```

## Features

- View inventory in a table
- Add products via the form (name + stock)
- Edit a product: its values load into the form, then save or cancel
- Delete a product (with a confirmation prompt)
- Look up products with a search box (case-insensitive name match, live filtering)
- Shopping cart: add products to the cart, change quantities, see per-item
  subtotals and the order total, and clear the cart
- Checkout: complete a purchase, which decrements product stock, records the
  order, and clears the cart
- Order history: past orders are listed with their date, items, and total
- Data persisted in `localStorage` (survives page reloads)
- Sample products seeded on first run
- Works offline, no server required

## Data layer

`js/app.js` exposes small product, cart, and order data layers backed by
`localStorage`. Products use the key `inventory.products` (each product has
an `id`, `name`, `price`, and `stock`); the cart uses `inventory.cart` (an
array of `{ id, quantity }` entries); orders use `inventory.orders` (an array
of `{ id, date, items, total }` records).

- `getProducts()` / `getProduct(id)` — read products (seeds sample data
  on first run)
- `addProduct(name, stock)` — add a product
- `updateProduct(id, changes)` — update fields of a product
- `searchProducts(query)` — case-insensitive name search (all products if empty)
- `setStock(id, stock)` / `adjustStock(id, delta)` — change stock
- `removeProduct(id)` — delete a product

Cart functions:

- `getCart()` / `saveCart(entries)` — read/write cart entries
- `addToCart(id, quantity)` / `setCartQuantity(id, quantity)` — change a
  cart line (quantities are clamped to available stock)
- `getCartItems()` / `getCartTotal()` — resolve entries to products and
  compute the order total
- `clearCart()` — empty the cart

Order functions:

- `getOrders()` / `saveOrders(orders)` — read/write order history
- `placeOrder()` — validate stock, decrement it, record the order, and
  clear the cart; on insufficient stock the cart is clamped to what is
  available and the shortage is reported
