# Inventory

A browser-only inventory website. It is plain HTML5 and vanilla JavaScript, with no build step, framework, or server. Products, the cart, and orders are stored in the browser's `localStorage`.

## Run

Open `index.html` in a browser.

## Layout

- `index.html` — page structure
- `css/styles.css` — presentation
- `js/storage.js` — read and write the inventory, cart, and order arrays in `localStorage`
- `js/inventory.js` — products, stock, and the sample catalog
- `js/cart.js` — cart lines, quantities, and the unit total
- `js/orders.js` — checkout and order history
- `js/app.js` — startup and page behavior

## Data

Products are stored under the key `inventory.items` as a JSON array. Each product has:

- `id` — stable identifier
- `name` — product name
- `sku` — stock-keeping code, unique when present
- `stock` — units on hand, a whole number from 0 up

The first visit in a browser saves six sample products. Later visits use that saved list, including an empty list after every product is removed. Removing the `inventory.items` key loads the samples again.

The cart is stored under `inventory.cart` as a JSON array of lines:

- `productId` — id of a product in the inventory
- `quantity` — units in the cart, a whole number up to that product's stock

Before anything is added, that key is absent. After the last line is removed, it holds an empty array. Lines whose product was deleted, or whose product is out of stock, are dropped the next time the cart is shown.

## Manage products

The form adds a product (name, optional SKU, and stock). Choose Edit on a row to change that product in the same form, or Delete to remove it after confirmation. Stock is a whole number from 0 up, and a SKU cannot match another product. Changes stay in `localStorage`.

## Find products

Search filters the product list as you type. Matching ignores letter case and extra spaces. Every word must appear in the name or the SKU, so `wid 002` finds Deluxe Widget (`WID-002`). The stock menu limits the list to items that are in stock or out of stock. Search and stock filter together. When nothing matches, the page says so. The lookup itself is not stored; products remain in `localStorage`.

## Cart

**Add to cart** on a product row puts one unit in the cart. Choosing it again adds another, up to the stock on hand. Out-of-stock products cannot be added. In the cart, **-** and **+** change the quantity, the number field sets it directly, and **Remove** takes the product out. Quantity `0` removes the line. The total is the number of units in the cart. The cart stays in `localStorage` across reloads. Lowering a product's stock, or deleting it, reduces or removes that cart line to match.

## Checkout

**Checkout** places the cart as an order. The button is available when the cart has at least one line. **Place order** confirms it. **Cancel** leaves the cart as it is.

A completed order subtracts each quantity from that product's stock, clears the cart, and adds the order to the history. The name and SKU are copied at that moment, so the history stays readable after a product is renamed or deleted. Nothing is sold when the cart is empty, a product in the cart is gone, or a line asks for more units than are in stock. Stock, the cart, and the history stay as they were, and the page names the product that is short. The cart is brought back in line with stock the next time it is shown.

Orders are stored under `inventory.orders` as a JSON array. That key is absent until the first order. Each order has:

- `id` — stable identifier
- `number` — 1, 2, 3… in the order they were placed
- `placedAt` — time of the purchase, an ISO timestamp
- `lines` — products sold, each with `productId`, `name`, `sku`, and `quantity`

The newest order is listed first. Order history remains after reload.
