const STORAGE_KEY = 'inventory_data';
const CART_STORAGE_KEY = 'cart_data';
const ORDER_HISTORY_KEY = 'order_history';
let searchQuery = '';

class InventoryStore {
    constructor() {
        this.products = this.load();
        if (this.products.length === 0) {
            this.products = [
                { id: 1, name: 'Apple', stock: 50, price: 0.5 },
                { id: 2, name: 'Banana', stock: 30, price: 0.3 },
                { id: 3, name: 'Cherry', stock: 100, price: 0.1 }
            ];
            this.save();
        }
    }

    load() {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    }

    save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.products));
    }

    getProducts() {
        return this.products;
    }

    addProduct(product) {
        const newProduct = {
            ...product,
            id: Date.now()
        };
        this.products.push(newProduct);
        this.save();
        return newProduct;
    }

    updateProduct(productId, updatedProduct) {
        const index = this.products.findIndex(p => p.id === Number(productId));
        if (index !== -1) {
            this.products[index] = { ...this.products[index], ...updatedProduct, id: Number(productId) };
            this.save();
        }
    }

    deleteProduct(productId) {
        this.products = this.products.filter(p => p.id !== Number(productId));
        this.save();
    }
}

class CartStore {
    constructor() {
        this.items = this.load();
    }

    load() {
        const data = localStorage.getItem(CART_STORAGE_KEY);
        return data ? JSON.parse(data) : {};
    }

    save() {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.items));
    }

    addItem(productId) {
        const id = Number(productId);
        if (this.items[id]) {
            this.items[id]++;
        } else {
            this.items[id] = 1;
        }
        this.save();
    }

    updateQuantity(productId, quantity) {
        const id = Number(productId);
        if (quantity <= 0) {
            delete this.items[id];
        } else {
            this.items[id] = quantity;
        }
        this.save();
    }

    removeItem(productId) {
        const id = Number(productId);
        delete this.items[id];
        this.save();
    }

    getItems() {
        return this.items;
    }

    clear() {
        this.items = {};
        this.save();
    }
}

class OrderStore {
    constructor() {
        this.orders = this.load();
    }

    load() {
        const data = localStorage.getItem(ORDER_HISTORY_KEY);
        return data ? JSON.parse(data) : [];
    }

    save() {
        localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(this.orders));
    }

    addOrder(order) {
        this.orders.push({
            ...order,
            id: Date.now(),
            date: new Date().toLocaleString()
        });
        this.save();
    }

    getOrders() {
        return this.orders;
    }
}

const store = new InventoryStore();
const cartStore = new CartStore();
const orderStore = new OrderStore();

function render() {
    const app = document.getElementById('app');
    if (!app) return;

    const allProducts = store.getProducts();
    const products = allProducts.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Calculate cart data
    const cartItemsData = cartStore.getItems();
    const cartItemsHtml = Object.keys(cartItemsData).map(productId => {
        const product = allProducts.find(p => p.id === Number(productId));
        if (!product) return '';
        const quantity = cartItemsData[productId];
        const itemTotal = product.price * quantity;
        return `
            <tr>
                <td>${product.name}</td>
                <td>
                    <button class="qty-btn" onclick="updateCartQuantity(${product.id}, ${quantity - 1})">-</button>
                    <span>${quantity}</span>
                    <button class="qty-btn" onclick="updateCartQuantity(${product.id}, ${quantity + 1})">+</button>
                </td>
                <td>$${itemTotal.toFixed(2)}</td>
                <td>
                    <button class="remove-cart-btn" onclick="removeFromCart(${product.id})">Remove</button>
                </td>
            </tr>
        `;
    }).join('');

    const cartTotal = Object.keys(cartItemsData).reduce((total, productId) => {
        const product = allProducts.find(p => p.id === Number(productId));
        return total + (product ? product.price * cartItemsData[productId] : 0);
    }, 0);

    let html = `
        <section id="inventory-section">
            <h2>Inventory</h2>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Stock</th>
                        <th>Price</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${products.map(product => `
                        <tr>
                            <td>${product.name}</td>
                            <td>${product.stock}</td>
                            <td>$${product.price.toFixed(2)}</td>
                            <td>
                                <button class="edit-btn" onclick="editProduct(${product.id})">Edit</button>
                                <button class="delete-btn" onclick="deleteProduct(${product.id})">Delete</button>
                                <button class="add-to-cart-btn" onclick="addToCart(${product.id})">Add to Cart</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            ${products.length === 0 ? '<p>No products found.</p>' : ''}
        </section>

        <section id="form-section">
            <h2 id="form-title">Add Product</h2>
            <form id="product-form">
                <input type="hidden" id="product-id">
                <div class="form-group">
                    <label for="name">Name:</label>
                    <input type="text" id="name" required>
                </div>
                <div class="form-group">
                    <label for="stock">Stock:</label>
                    <input type="number" id="stock" required min="0">
                </div>
                <div class="form-group">
                    <label for="price">Price:</label>
                    <input type="number" id="price" step="0.01" required min="0">
                </div>
                <div class="form-buttons">
                    <button type="submit" id="submit-btn">Save Product</button>
                    <button type="button" id="cancel-btn" style="display: none;">Cancel</button>
                </div>
            </form>
        </section>

        <section id="cart-section">
            <h2>Shopping Cart</h2>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Quantity</th>
                        <th>Total</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${cartItemsHtml}
                </tbody>
            </table>
            ${Object.keys(cartItemsData).length === 0 ? '<p>Your cart is empty.</p>' : ''}
            <div id="cart-summary">
                <p>Total: $<span id="cart-total">${cartTotal.toFixed(2)}</span></p>
                ${Object.keys(cartItemsData).length > 0 ? '<button class="checkout-btn" onclick="handleCheckout()">Checkout</button>' : ''}
            </div>
        </section>

        <section id="order-history-section">
            <h2>Order History</h2>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Items</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${orderStore.getOrders().map(order => `
                        <tr>
                            <td>${order.date}</td>
                            <td>${order.items.map(item => `${item.name} (x${item.quantity})`).join(', ')}</td>
                            <td>$${order.total.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            ${orderStore.getOrders().length === 0 ? '<p>No orders yet.</p>' : ''}
        </section>
    `;

    app.innerHTML = html;

    // Re-attach event listeners for the form
    const form = document.getElementById('product-form');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
    const cancelBtn = document.getElementById('cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', resetForm);
    }

    // Expose functions to window
    window.editProduct = editProduct;
    window.deleteProduct = deleteProduct;
    window.addToCart = addToCart;
    window.updateCartQuantity = updateCartQuantity;
    window.removeFromCart = removeFromCart;
    window.handleCheckout = handleCheckout;
}

function handleFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('product-id').value;
    const name = document.getElementById('name').value;
    const stock = parseInt(document.getElementById('stock').value, 10);
    const price = parseFloat(document.getElementById('price').value);

    if (id) {
        store.updateProduct(Number(id), { name, stock, price });
    } else {
        store.addProduct({ name, stock, price });
    }

    resetForm();
    render();
}

function editProduct(id) {
    const product = store.getProducts().find(p => p.id === id);
    if (!product) return;

    document.getElementById('form-title').innerText = 'Edit Product';
    document.getElementById('product-id').value = product.id;
    document.getElementById('name').value = product.name;
    document.getElementById('stock').value = product.stock;
    document.getElementById('price').value = product.price;
    document.getElementById('submit-btn').innerText = 'Update Product';
    document.getElementById('cancel-btn').style.display = 'inline-block';

    document.getElementById('form-section').scrollIntoView({ behavior: 'smooth' });
}

function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        store.deleteProduct(id);
        render();
    }
}

function resetForm() {
    document.getElementById('form-title').innerText = 'Add Product';
    document.getElementById('product-id').value = '';
    document.getElementById('product-form').reset();
    document.getElementById('submit-btn').innerText = 'Save Product';
    document.getElementById('cancel-btn').style.display = 'none';
}

function handleSearch(e) {
    searchQuery = e.target.value;
    render();
}

function addToCart(productId) {
    cartStore.addItem(productId);
    render();
}

function updateCartQuantity(productId, quantity) {
    cartStore.updateQuantity(productId, quantity);
    render();
}

function removeFromCart(productId) {
    cartStore.removeItem(productId);
    render();
}

function handleCheckout() {
    const cartItemsData = cartStore.getItems();
    const orderItems = [];
    let total = 0;

    for (const productId in cartItemsData) {
        const product = store.getProducts().find(p => p.id === Number(productId));
        if (product) {
            const quantity = cartItemsData[productId];
            if (product.stock < quantity) {
                alert(`Not enough stock for ${product.name}`);
                return;
            }

            orderItems.push({
                name: product.name,
                quantity: quantity,
                price: product.price
            });
            total += product.price * quantity;
            store.updateProduct(product.id, { stock: product.stock - quantity });
        }
    }

    if (orderItems.length > 0) {
        orderStore.addOrder({ items: orderItems, total: total });
        cartStore.clear();
        render();
        alert('Order completed successfully!');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    render();
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
});
