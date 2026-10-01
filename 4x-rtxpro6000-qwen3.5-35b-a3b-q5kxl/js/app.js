// Inventory Management Application
// Data is persisted in localStorage

const STORAGE_KEY = 'inventory_items';
const ORDERS_STORAGE_KEY = 'order_history';

/**
 * Sample data to populate inventory on first run
 */
const SAMPLE_DATA = [
    {
        name: 'Wireless Mouse',
        quantity: 45,
        price: 29.99,
        category: 'Electronics'
    },
    {
        name: 'USB-C Cable (3ft)',
        quantity: 120,
        price: 12.99,
        category: 'Electronics'
    },
    {
        name: 'Notebook (500 sheets)',
        quantity: 85,
        price: 8.49,
        category: 'Office Supplies'
    },
    {
        name: 'Desk Lamp LED',
        quantity: 32,
        price: 34.99,
        category: 'Office Supplies'
    },
    {
        name: 'Coffee Mug 16oz',
        quantity: 200,
        price: 9.99,
        category: 'Kitchen'
    },
    {
        name: 'Stapler Heavy Duty',
        quantity: 28,
        price: 15.99,
        category: 'Office Supplies'
    },
    {
        name: 'HDMI Cable (6ft)',
        quantity: 67,
        price: 14.99,
        category: 'Electronics'
    },
    {
        name: 'Water Bottle 32oz',
        quantity: 150,
        price: 19.99,
        category: 'Kitchen'
    }
];

// Track current edit mode and item
let editingItemId = null;

// Track current search term
let currentSearchTerm = '';

// Shopping Cart
const CART_STORAGE_KEY = 'shopping_cart';
let cart = [];

// Load items from localStorage
function loadItems() {
    const items = localStorage.getItem(STORAGE_KEY);
    return items ? JSON.parse(items) : [];
}

// Save items to localStorage
function saveItems(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// Cart functions
function loadCart() {
    const cartData = localStorage.getItem(CART_STORAGE_KEY);
    return cartData ? JSON.parse(cartData) : [];
}

function saveCart() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function generateCartItemId(itemId, inventoryItem) {
    return `${itemId}_${inventoryItem.id}`;
}

// Add item to cart
function addToCart(inventoryItem) {
    const existingCartItem = cart.find(item => item.inventoryItemId === inventoryItem.id);

    if (existingCartItem) {
        existingCartItem.quantity += 1;
    } else {
        cart.push({
            cartItemId: generateCartItemId(inventoryItem.id, inventoryItem),
            inventoryItemId: inventoryItem.id,
            name: inventoryItem.name,
            price: inventoryItem.price,
            quantity: 1
        });
    }

    saveCart();
    renderCart();
}

// Update cart item quantity
function updateCartQuantity(cartItemId, newQuantity) {
    const cartItem = cart.find(item => item.cartItemId === cartItemId);

    if (cartItem) {
        if (newQuantity <= 0) {
            removeFromCart(cartItemId);
        } else {
            cartItem.quantity = newQuantity;
            saveCart();
            renderCart();
        }
    }
}

// Remove item from cart
function removeFromCart(cartItemId) {
    cart = cart.filter(item => item.cartItemId !== cartItemId);
    saveCart();
    renderCart();
}

// Clear entire cart
function clearCart() {
    if (cart.length > 0 && confirm('Are you sure you want to clear the entire cart?')) {
        cart = [];
        saveCart();
        renderCart();
    }
}

// Add all inventory items to cart (1 of each)
function addAllToCart() {
    const inventoryItems = loadItems();

    if (inventoryItems.length === 0) {
        alert('No items in inventory to add to cart.');
        return;
    }

    inventoryItems.forEach(item => {
        addToCart(item);
    });

    renderCart();
}

// Calculate cart total
function calculateCartTotal() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// Order History functions
function loadOrders() {
    const ordersData = localStorage.getItem(ORDERS_STORAGE_KEY);
    return ordersData ? JSON.parse(ordersData) : [];
}

function saveOrders(orders) {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
}

function generateOrderId() {
    return 'ORD-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
}

function generateOrderItemsSummary(cartItems) {
    return cartItems.map(item => `${item.name} (x${item.quantity})`).join(', ');
}

// Process checkout and create order
function processCheckout() {
    if (cart.length === 0) {
        alert('Your cart is empty. Add items before checking out.');
        return;
    }

    // Confirm checkout
    if (!confirm('Complete this purchase? This will update inventory quantities.')) {
        return;
    }

    const items = loadItems();
    const orderItems = [];
    let success = true;

    // Check stock and prepare order
    for (const cartItem of cart) {
        const inventoryItem = items.find(item => item.id === cartItem.inventoryItemId);
        if (!inventoryItem) {
            alert(`Item "${cartItem.name}" is no longer in inventory.`);
            success = false;
            break;
        }
        if (inventoryItem.quantity < cartItem.quantity) {
            alert(`Insufficient stock for "${cartItem.name}". Available: ${inventoryItem.quantity}, Requested: ${cartItem.quantity}`);
            success = false;
            break;
        }
        orderItems.push({
            inventoryItemId: inventoryItem.id,
            name: inventoryItem.name,
            quantity: cartItem.quantity,
            price: inventoryItem.price,
            subtotal: inventoryItem.price * cartItem.quantity
        });
    }

    if (!success) {
        return;
    }

    // Update inventory quantities
    const updatedItems = items.map(item => {
        const cartItem = cart.find(ci => ci.inventoryItemId === item.id);
        if (cartItem) {
            return {
                ...item,
                quantity: item.quantity - cartItem.quantity
            };
        }
        return item;
    });
    saveItems(updatedItems);

    // Create order record
    const order = {
        orderId: generateOrderId(),
        orderDate: new Date().toISOString(),
        items: orderItems,
        itemCount: cart.reduce((sum, item) => sum + item.quantity, 0),
        total: calculateCartTotal()
    };

    // Save order to history
    const orders = loadOrders();
    orders.unshift(order); // Add to beginning of array (newest first)
    saveOrders(orders);

    // Clear cart and re-render
    cart = [];
    saveCart();
    renderCart();
    renderItems();
    renderOrders();

    alert(`Order ${order.orderId} completed successfully!`);
}

// Render cart items
function renderCart() {
    const tbody = document.getElementById('cart-body');
    const cartSummary = document.getElementById('cart-summary');
    const cartTotal = document.getElementById('cart-total');
    const clearCartBtn = document.getElementById('clear-cart');
    const checkoutBtn = document.getElementById('checkout-btn');
    const addAllToCartBtn = document.getElementById('add-all-to-cart');

    if (cart.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-message">Your cart is empty. Add items from the inventory below!</td></tr>';
        cartSummary.style.display = 'none';
        clearCartBtn.style.display = 'none';
        checkoutBtn.style.display = 'none';
        addAllToCartBtn.disabled = false;
        return;
    }

    tbody.innerHTML = cart.map(item => {
        const subtotal = (item.price * item.quantity).toFixed(2);
        return `
            <tr>
                <td>${escapeHtml(item.name)}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td>
                    <div class="cart-quantity-controls">
                        <button class="cart-qty-btn" onclick="decreaseQuantity('${item.cartItemId}')">-</button>
                        <input type="number" class="cart-qty-input" value="${item.quantity}" min="1" onchange="updateQuantityInput('${item.cartItemId}', this.value)">
                        <button class="cart-qty-btn" onclick="increaseQuantity('${item.cartItemId}')">+</button>
                    </div>
                </td>
                <td class="total-value">$${subtotal}</td>
                <td class="actions">
                    <button class="btn-delete" onclick="removeFromCart('${item.cartItemId}')">Remove</button>
                </td>
            </tr>
        `;
    }).join('');

    cartTotal.textContent = `$${calculateCartTotal().toFixed(2)}`;
    cartSummary.style.display = 'block';
    clearCartBtn.style.display = 'inline-block';
    checkoutBtn.style.display = 'inline-block';
    addAllToCartBtn.disabled = false;
}

// Increase quantity
function increaseQuantity(cartItemId) {
    const cartItem = cart.find(item => item.cartItemId === cartItemId);
    if (cartItem) {
        updateCartQuantity(cartItemId, cartItem.quantity + 1);
    }
}

// Decrease quantity
function decreaseQuantity(cartItemId) {
    const cartItem = cart.find(item => item.cartItemId === cartItemId);
    if (cartItem) {
        updateCartQuantity(cartItemId, cartItem.quantity - 1);
    }
}

// Update quantity from input field
function updateQuantityInput(cartItemId, value) {
    const newQuantity = parseInt(value);
    if (!isNaN(newQuantity) && newQuantity > 0) {
        updateCartQuantity(cartItemId, newQuantity);
    }
}

// Initialize sample data if localStorage is empty
function initializeSampleData() {
    const existingItems = loadItems();
    if (existingItems.length === 0) {
        const itemsWithIds = SAMPLE_DATA.map(item => ({
            ...item,
            id: generateId(),
            createdAt: new Date().toISOString()
        }));
        saveItems(itemsWithIds);
        return true;
    }
    return false;
}

// Generate a unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Add a new item
function addItem(name, quantity, price, category) {
    const items = loadItems();
    const newItem = {
        id: generateId(),
        name,
        quantity: parseInt(quantity),
        price: parseFloat(price),
        category,
        createdAt: new Date().toISOString()
    };
    items.push(newItem);
    saveItems(items);
    renderItems();
}

// Edit an existing item
function editItem(id, name, quantity, price, category) {
    const items = loadItems();
    const index = items.findIndex(item => item.id === id);
    if (index !== -1) {
        items[index] = {
            ...items[index],
            name,
            quantity: parseInt(quantity),
            price: parseFloat(price),
            category
        };
        saveItems(items);
        renderItems();
    }
}

// Delete an item
function deleteItem(id) {
    if (!confirm('Are you sure you want to delete this item?')) {
        return;
    }
    let items = loadItems();
    items = items.filter(item => item.id !== id);
    saveItems(items);
    renderItems();
}

// Calculate total value for an item
function calculateTotalValue(item) {
    return (item.quantity * item.price).toFixed(2);
}

// Filter items based on search term
function filterItems(items, searchTerm) {
    if (!searchTerm.trim()) {
        return items;
    }

    const term = searchTerm.toLowerCase().trim();
    return items.filter(item => {
        const nameMatch = item.name.toLowerCase().includes(term);
        const categoryMatch = item.category.toLowerCase().includes(term);
        const quantityMatch = item.quantity.toString().includes(term);
        return nameMatch || categoryMatch || quantityMatch;
    });
}

// Render all items in the table
function renderItems(itemsToRender) {
    const items = itemsToRender || loadItems();
    const tbody = document.getElementById('inventory-body');

    if (items.length === 0) {
        const message = currentSearchTerm.trim()
            ? 'No items match your search criteria.'
            : 'No items in inventory. Add your first item above!';
        tbody.innerHTML = `<tr><td colspan="6" class="empty-message">${escapeHtml(message)}</td></tr>`;
        return;
    }

    tbody.innerHTML = items.map(item => `
        <tr>
            <td>${escapeHtml(item.name)}</td>
            <td>${item.quantity}</td>
            <td>$${item.price.toFixed(2)}</td>
            <td>${escapeHtml(item.category)}</td>
            <td class="total-value">$${calculateTotalValue(item)}</td>
            <td class="actions">
                <button class="btn-add-to-cart" onclick="addToCart(${JSON.stringify(item).replace(/"/g, '&quot;')})">Add to Cart</button>
                <button class="btn-edit" onclick="startEditItem('${item.id}')">Edit</button>
                <button class="btn-delete" onclick="deleteItem('${item.id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Handle form submission
function handleFormSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('item-name').value.trim();
    const quantity = document.getElementById('item-quantity').value;
    const price = document.getElementById('item-price').value;
    const category = document.getElementById('item-category').value.trim();

    if (!name || !quantity || !price || !category) {
        alert('Please fill in all fields');
        return;
    }

    if (editingItemId) {
        // Update existing item
        editItem(editingItemId, name, quantity, price, category);
        // Clear edit mode
        editingItemId = null;
        // Reset form and update UI
        e.target.reset();
        document.getElementById('form-title').textContent = 'Add New Item';
        document.getElementById('submit-btn').textContent = 'Add Item';
        document.getElementById('cancel-btn').style.display = 'none';
    } else {
        // Add new item
        addItem(name, quantity, price, category);
        // Clear the form
        e.target.reset();
    }
}

// Start editing an item
function startEditItem(id) {
    const items = loadItems();
    const item = items.find(i => i.id === id);
    if (!item) return;

    // Populate the form with item data
    document.getElementById('item-name').value = item.name;
    document.getElementById('item-quantity').value = item.quantity;
    document.getElementById('item-price').value = item.price;
    document.getElementById('item-category').value = item.category;

    // Set edit mode
    editingItemId = id;

    // Update form UI
    document.getElementById('form-title').textContent = 'Edit Item';
    document.getElementById('submit-btn').textContent = 'Update Item';
    document.getElementById('cancel-btn').style.display = 'inline-block';

    // Scroll to form
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
}

// Cancel editing
function cancelEdit() {
    editingItemId = null;
    document.getElementById('item-form').reset();
    document.getElementById('form-title').textContent = 'Add New Item';
    document.getElementById('submit-btn').textContent = 'Add Item';
    document.getElementById('cancel-btn').style.display = 'none';
}

// Handle search input
function handleSearch(e) {
    currentSearchTerm = e.target.value;
    const items = loadItems();
    const filteredItems = filterItems(items, currentSearchTerm);
    renderItems(filteredItems);

    // Show/hide clear button based on search term
    const clearBtn = document.getElementById('clear-search');
    clearBtn.style.display = currentSearchTerm.trim() ? 'inline-block' : 'none';
}

// Clear search
function clearSearch() {
    currentSearchTerm = '';
    document.getElementById('search-input').value = '';
    const clearBtn = document.getElementById('clear-search');
    clearBtn.style.display = 'none';
    renderItems();
}

// Render order history
function renderOrders() {
    const orders = loadOrders();
    const ordersList = document.getElementById('orders-list');
    const noOrdersMessage = document.getElementById('no-orders-message');
    const ordersBody = document.getElementById('orders-body');
    const viewAllBtn = document.getElementById('view-all-orders');
    const clearOrdersBtn = document.getElementById('clear-orders');

    if (orders.length === 0) {
        ordersList.style.display = 'none';
        noOrdersMessage.style.display = 'block';
        viewAllBtn.style.display = 'none';
        clearOrdersBtn.style.display = 'none';
        return;
    }

    ordersList.style.display = 'block';
    noOrdersMessage.style.display = 'none';
    viewAllBtn.style.display = 'inline-block';
    clearOrdersBtn.style.display = 'inline-block';

    ordersBody.innerHTML = orders.map(order => {
        const date = new Date(order.orderDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        const itemCount = order.itemCount;
        return `
            <tr>
                <td>${escapeHtml(order.orderId)}</td>
                <td>${date}</td>
                <td>${itemCount} item(s)</td>
                <td class="total-value">$${order.total.toFixed(2)}</td>
                <td class="actions">
                    <button class="btn-view-order" onclick="viewOrderDetails('${order.orderId}')">View</button>
                </td>
            </tr>
        `;
    }).join('');
}

// Show orders list
function showOrders() {
    document.getElementById('orders-list').style.display = 'block';
    document.getElementById('no-orders-message').style.display = 'none';
    document.getElementById('view-all-orders').style.display = 'none';
    const orders = loadOrders();
    if (orders.length > 0) {
        document.getElementById('clear-orders').style.display = 'inline-block';
    }
}

// Hide orders list
function hideOrders() {
    document.getElementById('orders-list').style.display = 'none';
    document.getElementById('no-orders-message').style.display = 'block';
    document.getElementById('view-all-orders').style.display = 'inline-block';
    document.getElementById('clear-orders').style.display = 'none';
}

// View order details (simple alert with order info)
function viewOrderDetails(orderId) {
    const orders = loadOrders();
    const order = orders.find(o => o.orderId === orderId);

    if (!order) {
        alert('Order not found.');
        return;
    }

    const date = new Date(order.orderDate).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    let details = `Order: ${order.orderId}\nDate: ${date}\nItems: ${order.itemCount}\n\n`;
    order.items.forEach((item, index) => {
        details += `${index + 1}. ${item.name}\n   Qty: ${item.quantity} × $${item.price.toFixed(2)} = $${item.subtotal.toFixed(2)}\n`;
    });
    details += `\nTotal: $${order.total.toFixed(2)}`;

    alert(details);
}

// Clear order history
function clearOrderHistory() {
    if (loadOrders().length === 0) {
        return;
    }
    if (confirm('Are you sure you want to clear all order history? This cannot be undone.')) {
        saveOrders([]);
        renderOrders();
    }
}

// Initialize the application
function init() {
    const form = document.getElementById('item-form');
    form.addEventListener('submit', handleFormSubmit);

    // Add cancel button event listener
    const cancelBtn = document.getElementById('cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', cancelEdit);
    }

    // Add search input event listener
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }

    // Add clear search button event listener
    const clearSearchBtn = document.getElementById('clear-search');
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', clearSearch);
    }

    // Add cart buttons event listeners
    const addAllToCartBtn = document.getElementById('add-all-to-cart');
    if (addAllToCartBtn) {
        addAllToCartBtn.addEventListener('click', addAllToCart);
    }

    const clearCartBtn = document.getElementById('clear-cart');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', clearCart);
    }

    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', processCheckout);
    }

    // Order history controls
    const viewAllOrdersBtn = document.getElementById('view-all-orders');
    if (viewAllOrdersBtn) {
        viewAllOrdersBtn.addEventListener('click', showOrders);
    }

    const clearOrdersBtn = document.getElementById('clear-orders');
    if (clearOrdersBtn) {
        clearOrdersBtn.addEventListener('click', clearOrderHistory);
    }

    // Initialize sample data on first run
    initializeSampleData();

    // Load and render cart
    cart = loadCart();
    renderCart();

    // Initial render
    renderItems();
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
