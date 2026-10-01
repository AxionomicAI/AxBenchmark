/**
 * Inventory Manager - Main Application
 * 
 * A vanilla JavaScript application for managing inventory items.
 * Data is persisted in localStorage.
 */

(function () {
    'use strict';

    // ==================== Constants ====================
    const STORAGE_KEY = 'inventory_items';
    const CART_STORAGE_KEY = 'inventory_cart';
    const ORDERS_STORAGE_KEY = 'inventory_orders';
    const LOW_STOCK_THRESHOLD = 5;
    const CURRENCY_SYMBOL = '$';

    // ==================== DOM Elements ====================
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const searchSuggestions = document.getElementById('searchSuggestions');
    const addItemBtn = document.getElementById('addItemBtn');
    const inventoryList = document.getElementById('inventoryList');
    const emptyState = document.getElementById('emptyState');
    const itemCount = document.getElementById('itemCount');
    const categoryFilter = document.getElementById('categoryFilter');
    const stockStatusFilter = document.getElementById('stockStatusFilter');
    const sortSelect = document.getElementById('sortSelect');
    const itemModal = document.getElementById('itemModal');
    const modalTitle = document.getElementById('modalTitle');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const itemForm = document.getElementById('itemForm');
    const itemIdInput = document.getElementById('itemId');
    const itemNameInput = document.getElementById('itemName');
    const itemCategoryInput = document.getElementById('itemCategory');
    const itemQuantityInput = document.getElementById('itemQuantity');
    const itemDescriptionInput = document.getElementById('itemDescription');
    const cancelBtn = document.getElementById('cancelBtn');
    const submitBtn = document.getElementById('submitBtn');

    // Quick View Modal elements
    const quickViewModal = document.getElementById('quickViewModal');
    const closeQuickViewBtn = document.getElementById('closeQuickViewBtn');
    const quickViewContent = document.getElementById('quickViewContent');

    // Cart elements
    const cartToggleBtn = document.getElementById('cartToggleBtn');
    const cartBadge = document.getElementById('cartBadge');
    const cartModal = document.getElementById('cartModal');
    const closeCartBtn = document.getElementById('closeCartBtn');
    const cartContent = document.getElementById('cartContent');
    const cartEmptyMsg = document.getElementById('cartEmptyMsg');
    const cartItemsList = document.getElementById('cartItemsList');
    const cartFooter = document.getElementById('cartFooter');
    const cartTotal = document.getElementById('cartTotal');
    const clearCartBtn = document.getElementById('clearCartBtn');
    const checkoutBtn = document.getElementById('checkoutBtn');

    // Order History Modal elements
    const orderHistoryBtn = document.getElementById('orderHistoryBtn');
    const orderHistoryModal = document.getElementById('orderHistoryModal');
    const closeOrderHistoryBtn = document.getElementById('closeOrderHistoryBtn');
    const orderHistoryList = document.getElementById('orderHistoryList');

    // Order Confirmation Modal elements
    const orderConfirmationModal = document.getElementById('orderConfirmationModal');

    // Price Edit Modal elements
    const priceModal = document.getElementById('priceModal');
    const closePriceBtn = document.getElementById('closePriceBtn');
    const priceForm = document.getElementById('priceForm');
    const priceItemId = document.getElementById('priceItemId');
    const priceItemName = document.getElementById('priceItemName');
    const priceInput = document.getElementById('priceInput');

    // ==================== State ====================
    let items = [];
    let currentSearchText = '';
    let cart = [];

    // ==================== Sample Data ====================
    function getSampleData() {
        const now = Date.now();
        return [
            {
                id: generateId(),
                name: 'Wireless Mouse',
                category: 'Electronics',
                quantity: 42,
                price: 29.99,
                description: 'Ergonomic wireless mouse with USB receiver',
                createdAt: now,
                updatedAt: now
            },
            {
                id: generateId(),
                name: 'USB-C Cable',
                category: 'Electronics',
                quantity: 150,
                price: 12.99,
                description: '6ft braided USB-C to USB-C cable',
                createdAt: now,
                updatedAt: now
            },
            {
                id: generateId(),
                name: 'Notebook A5',
                category: 'Stationery',
                quantity: 3,
                price: 8.49,
                description: 'Ruled A5 notebook, 200 pages',
                createdAt: now,
                updatedAt: now
            },
            {
                id: generateId(),
                name: 'Desk Lamp',
                category: 'Furniture',
                quantity: 0,
                price: 45.99,
                description: 'LED desk lamp with adjustable brightness',
                createdAt: now,
                updatedAt: now
            },
            {
                id: generateId(),
                name: 'Sticky Notes',
                category: 'Stationery',
                quantity: 75,
                price: 5.99,
                description: '3x3 inch yellow sticky notes, 100 sheets per pad',
                createdAt: now,
                updatedAt: now
            },
            {
                id: generateId(),
                name: 'Monitor Stand',
                category: 'Furniture',
                quantity: 8,
                price: 39.99,
                description: 'Adjustable monitor stand with storage drawer',
                createdAt: now,
                updatedAt: now
            },
            {
                id: generateId(),
                name: 'Keyboard Mechanical',
                category: 'Electronics',
                quantity: 5,
                price: 89.99,
                description: 'Mechanical keyboard with Cherry MX switches',
                createdAt: now,
                updatedAt: now
            },
            {
                id: generateId(),
                name: 'Paper Clips',
                category: 'Stationery',
                quantity: 200,
                price: 3.49,
                description: 'Box of 100 standard paper clips',
                createdAt: now,
                updatedAt: now
            },
            {
                id: generateId(),
                name: 'Whiteboard Markers',
                category: 'Stationery',
                quantity: 12,
                price: 11.99,
                description: 'Assorted colors, pack of 8',
                createdAt: now,
                updatedAt: now
            },
            {
                id: generateId(),
                name: 'Webcam HD',
                category: 'Electronics',
                quantity: 1,
                price: 59.99,
                description: '1080p HD webcam with built-in microphone',
                createdAt: now,
                updatedAt: now
            }
        ];
    }

    // ==================== Storage Functions ====================
    function loadItems() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            items = data ? JSON.parse(data) : [];
            // Ensure all items have a price field
            items = items.map(item => ({
                ...item,
                price: item.price !== undefined ? item.price : 0
            }));
        } catch (e) {
            console.error('Error loading items:', e);
            items = [];
        }
    }

    function saveItems() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch (e) {
            console.error('Error saving items:', e);
            alert('Failed to save data to localStorage. Storage may be full.');
        }
    }

    function hasItems() {
        return items.length > 0;
    }

    // ==================== Cart Storage Functions ====================
    function loadCart() {
        try {
            const data = localStorage.getItem(CART_STORAGE_KEY);
            cart = data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error loading cart:', e);
            cart = [];
        }
    }

    function saveCart() {
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        } catch (e) {
            console.error('Error saving cart:', e);
            alert('Failed to save cart data to localStorage. Storage may be full.');
        }
    }

    // ==================== Utility Functions ====================
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    function formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function getQuantityClass(quantity) {
        if (quantity === 0) return 'quantity-out-of-stock';
        if (quantity <= LOW_STOCK_THRESHOLD) return 'quantity-low';
        return 'quantity-in-stock';
    }

    function getQuantityLabel(quantity) {
        if (quantity === 0) return 'Out of Stock';
        if (quantity <= LOW_STOCK_THRESHOLD) return `Low (${quantity})`;
        return `In Stock (${quantity})`;
    }

    function getStockStatusClass(quantity) {
        if (quantity === 0) return 'out-of-stock';
        if (quantity <= LOW_STOCK_THRESHOLD) return 'low-stock';
        return 'in-stock';
    }

    function getStockStatusLabel(quantity) {
        if (quantity === 0) return 'Out of Stock';
        if (quantity <= LOW_STOCK_THRESHOLD) return 'Low Stock';
        return 'In Stock';
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ==================== Cart Functions ====================
    function addToCart(itemId) {
        const item = items.find(i => i.id === itemId);
        if (!item) return;

        // Check if item already in cart
        const existingItem = cart.find(c => c.id === itemId);
        if (existingItem) {
            // Increase quantity if in stock
            if (existingItem.quantity < item.quantity) {
                existingItem.quantity += 1;
            }
        } else {
            // Add new item to cart
            cart.push({
                id: item.id,
                name: item.name,
                price: item.price || 0,
                quantity: 1
            });
        }
        saveCart();
        updateCartUI();
    }

    function removeFromCart(itemId) {
        cart = cart.filter(c => c.id !== itemId);
        saveCart();
        updateCartUI();
    }

    function updateCartQuantity(itemId, delta) {
        const cartItem = cart.find(c => c.id === itemId);
        if (!cartItem) return;

        const inventoryItem = items.find(i => i.id === itemId);
        const newQty = cartItem.quantity + delta;

        if (newQty <= 0) {
            removeFromCart(itemId);
        } else if (inventoryItem && newQty > inventoryItem.quantity) {
            // Can't add more than available in stock
            alert('Not enough stock available.');
        } else {
            cartItem.quantity = newQty;
            saveCart();
            updateCartUI();
        }
    }

    function clearCart() {
        if (confirm('Are you sure you want to clear the cart?')) {
            cart = [];
            saveCart();
            updateCartUI();
        }
    }

    function getCartTotal() {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    function getCartItemCount() {
        return cart.reduce((count, item) => count + item.quantity, 0);
    }

    // ==================== Order History Functions ====================

    function loadOrders() {
        const orders = localStorage.getItem(ORDERS_STORAGE_KEY);
        return orders ? JSON.parse(orders) : [];
    }

    function saveOrders(orders) {
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    }

    function generateOrderId() {
        return 'ORD-' + Date.now().toString(36).toUpperCase() + '-' +
               Math.random().toString(36).substring(2, 6).toUpperCase();
    }

    function createOrder(orderItems, total, status = 'completed') {
        const orders = loadOrders();
        const order = {
            id: generateOrderId(),
            timestamp: new Date().toISOString(),
            items: orderItems.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                subtotal: item.price * item.quantity
            })),
            total: total,
            status: status
        };
        orders.unshift(order);
        saveOrders(orders);
        return order;
    }

    function getOrders() {
        return loadOrders();
    }

    function getOrderCount() {
        return loadOrders().length;
    }

    function clearOrders() {
        localStorage.removeItem(ORDERS_STORAGE_KEY);
    }

    // ==================== Order History UI ====================

    function renderOrderHistory() {
        const orders = loadOrders();
        const container = document.getElementById('orderHistoryList');

        if (!container) return;

        if (orders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No orders yet. Complete a purchase to see your order history.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = orders.map(order => {
            const date = new Date(order.timestamp);
            const formattedDate = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const itemsList = order.items.map(item =>
                `<li>${item.quantity}x ${item.name} - ${CURRENCY_SYMBOL}${item.subtotal.toFixed(2)}</li>`
            ).join('');

            return `
                <div class="order-card">
                    <div class="order-header">
                        <div class="order-id">${order.id}</div>
                        <div class="order-status status-${order.status}">${order.status}</div>
                    </div>
                    <div class="order-date">${formattedDate}</div>
                    <ul class="order-items">${itemsList}</ul>
                    <div class="order-total">Total: ${CURRENCY_SYMBOL}${order.total.toFixed(2)}</div>
                </div>
            `;
        }).join('');
    }

    function updateOrderHistoryBadge() {
        const orderBadge = document.getElementById('orderHistoryBadge');
        if (orderBadge) {
            const count = getOrderCount();
            orderBadge.textContent = count;
            orderBadge.style.display = count > 0 ? 'inline-block' : 'none';
        }
    }

    function openOrderHistory() {
        renderOrderHistory();
        const modal = document.getElementById('orderHistoryModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    function closeOrderHistory() {
        const modal = document.getElementById('orderHistoryModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    // ==================== Checkout Functions ====================

    function completeCheckout() {
        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        const orderItems = cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
        }));
        const total = getCartTotal();

        // Deduct stock from inventory
        const items = loadItems();
        cart.forEach(cartItem => {
            const itemIndex = items.findIndex(i => i.id === cartItem.id);
            if (itemIndex !== -1) {
                items[itemIndex].quantity = Math.max(0, items[itemIndex].quantity - cartItem.quantity);
            }
        });
        saveItems(items);

        // Create order record
        const order = createOrder(orderItems, total, 'completed');

        // Clear cart
        cart = [];
        saveCart(cart);
        updateCartUI();

        // Close cart modal
        const cartModal = document.getElementById('cartModal');
        if (cartModal) {
            cartModal.style.display = 'none';
        }

        // Show order confirmation
        showOrderConfirmation(order);

        // Update UI
        renderItems();
        updateOrderHistoryBadge();
    }

    function showOrderConfirmation(order) {
        const modal = document.getElementById('orderConfirmationModal');
        if (!modal) return;

        const date = new Date(order.timestamp);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const itemsList = order.items.map(item =>
            `<li class="confirmation-item">
                <span class="item-name">${item.name}</span>
                <span class="item-detail">${item.quantity} x ${CURRENCY_SYMBOL}${item.price.toFixed(2)}</span>
                <span class="item-subtotal">${CURRENCY_SYMBOL}${item.subtotal.toFixed(2)}</span>
            </li>`
        ).join('');

        modal.innerHTML = `
            <div class="confirmation-content">
                <div class="confirmation-icon">✓</div>
                <h2>Order Confirmed!</h2>
                <p class="order-id-display">Order ID: <strong>${order.id}</strong></p>
                <p class="order-date-display">Placed on ${formattedDate}</p>
                <div class="confirmation-divider"></div>
                <div class="order-items-list">
                    ${itemsList}
                </div>
                <div class="confirmation-total">
                    Total: ${CURRENCY_SYMBOL}${order.total.toFixed(2)}
                </div>
                <div class="confirmation-actions">
                    <button class="btn btn-primary" onclick="document.getElementById('orderConfirmationModal').style.display='none'; document.body.style.overflow='auto';">Continue Shopping</button>
                    <button class="btn btn-secondary" onclick="closeOrderHistory(); openOrderHistory(); document.getElementById('orderConfirmationModal').style.display='none'; document.body.style.overflow='hidden';">View Order History</button>
                </div>
            </div>
        `;

        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function updateCartUI() {
        const itemCount = getCartItemCount();
        const totalPrice = getCartTotal();

        // Update badge
        if (cartBadge) {
            cartBadge.textContent = itemCount > 0 ? itemCount : '';
            cartBadge.style.display = itemCount > 0 ? 'inline-flex' : 'none';
        }

        // Update cart content
        if (cartContent) {
            if (cart.length === 0) {
                cartContent.innerHTML = '';
                cartEmptyMsg.style.display = 'block';
                cartItemsList.style.display = 'none';
                cartFooter.style.display = 'none';
            } else {
                cartEmptyMsg.style.display = 'none';
                cartItemsList.style.display = 'block';
                cartFooter.style.display = 'flex';

                cartItemsList.innerHTML = cart.map(cartItem => {
                    const inventoryItem = items.find(i => i.id === cartItem.id);
                    const maxStock = inventoryItem ? inventoryItem.quantity : Infinity;
                    const subtotal = (cartItem.price * cartItem.quantity).toFixed(2);
                    return `
                        <div class="cart-item" data-id="${cartItem.id}">
                            <div class="cart-item-info">
                                <h4>${escapeHtml(cartItem.name)}</h4>
                                <span class="cart-item-price">${CURRENCY_SYMBOL}${cartItem.price.toFixed(2)}</span>
                            </div>
                            <div class="cart-item-actions">
                                <div class="cart-qty-controls">
                                    <button class="cart-qty-btn cart-qty-decrease" data-id="${cartItem.id}" aria-label="Decrease quantity">−</button>
                                    <span class="cart-qty-value">${cartItem.quantity}</span>
                                    <button class="cart-qty-btn cart-qty-increase" data-id="${cartItem.id}" aria-label="Increase quantity" ${cartItem.quantity >= maxStock ? 'disabled' : ''}>+</button>
                                </div>
                                <span class="cart-item-subtotal">${CURRENCY_SYMBOL}${subtotal}</span>
                                <button class="cart-remove-btn" data-id="${cartItem.id}" aria-label="Remove ${escapeHtml(cartItem.name)}">✕</button>
                            </div>
                        </div>
                    `;
                }).join('');

                // Update total
                if (cartTotal) {
                    cartTotal.innerHTML = `<span>Total:</span><span class="cart-total-amount">${CURRENCY_SYMBOL}${totalPrice.toFixed(2)}</span>`;
                }
            }
        }
    }

    // ==================== Price Functions ====================
    function openPriceModal(itemId) {
        const item = items.find(i => i.id === itemId);
        if (!item) return;

        priceItemId.value = item.id;
        priceItemName.textContent = item.name;
        priceInput.value = item.price !== undefined ? item.price : '';
        priceModal.style.display = 'flex';
        priceInput.focus();
    }

    function closePriceModal() {
        priceModal.style.display = 'none';
        priceForm.reset();
        priceItemId.value = '';
    }

    function savePrice(itemId, price) {
        const item = items.find(i => i.id === itemId);
        if (!item) return;

        const newPrice = parseFloat(price);
        if (isNaN(newPrice) || newPrice < 0) {
            alert('Please enter a valid price.');
            return;
        }

        item.price = newPrice;
        item.updatedAt = Date.now();

        // Update cart item price if item is in cart
        const cartItem = cart.find(c => c.id === itemId);
        if (cartItem) {
            cartItem.price = newPrice;
            saveCart();
            updateCartUI();
        }

        saveItems();
        closePriceModal();
        renderItems(searchInput.value);
    }

    /**
     * Highlight matching search terms in text
     */
    function highlightText(text, searchTerm) {
        if (!searchTerm || !text) return escapeHtml(text);
        const escaped = escapeHtml(text);
        const term = escapeHtml(searchTerm);
        const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return escaped.replace(regex, '<mark>$1</mark>');
    }

    // ==================== Category Filter ====================
    function updateCategoryFilter() {
        const categories = [...new Set(items.map(item => item.category).filter(Boolean))];
        const currentVal = categoryFilter.value;
        categoryFilter.innerHTML = '<option value="">All Categories</option>' +
            categories.map(cat => `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`).join('');
        categoryFilter.value = currentVal;
    }

    // ==================== Search Suggestions ====================
    function updateSearchSuggestions() {
        const query = searchInput.value.trim().toLowerCase();
        
        if (query.length < 1) {
            searchSuggestions.style.display = 'none';
            return;
        }

        // Find matching items (by name, category, description, or ID)
        const matches = items.filter(item => {
            const nameMatch = item.name.toLowerCase().includes(query);
            const catMatch = item.category && item.category.toLowerCase().includes(query);
            const descMatch = item.description && item.description.toLowerCase().includes(query);
            const idMatch = item.id.toLowerCase().includes(query);
            return nameMatch || catMatch || descMatch || idMatch;
        }).slice(0, 8); // Limit to 8 suggestions

        if (matches.length === 0) {
            searchSuggestions.style.display = 'none';
            return;
        }

        searchSuggestions.innerHTML = matches.map(item => `
            <div class="suggestion-item" data-id="${item.id}">
                <span class="suggestion-name">${highlightText(item.name, query)}</span>
                ${item.category ? `<span class="suggestion-category">${escapeHtml(item.category)}</span>` : ''}
                <span class="suggestion-qty">${item.quantity} in stock</span>
            </div>
        `).join('');

        searchSuggestions.style.display = 'block';
    }

    function selectSuggestion(id) {
        const item = items.find(i => i.id === id);
        if (item) {
            searchInput.value = item.name;
            searchSuggestions.style.display = 'none';
            currentSearchText = item.name;
            renderItems(item.name);
        }
    }

    // ==================== Render Functions ====================
    function renderItems(filterText = '') {
        updateCategoryFilter();
        currentSearchText = filterText;

        let filtered = items.filter(item => {
            const searchText = filterText.toLowerCase();
            if (!searchText) return true;
            return (
                item.name.toLowerCase().includes(searchText) ||
                (item.category && item.category.toLowerCase().includes(searchText)) ||
                (item.description && item.description.toLowerCase().includes(searchText)) ||
                item.id.toLowerCase().includes(searchText)
            );
        });

        // Filter by category
        const selectedCategory = categoryFilter.value;
        if (selectedCategory) {
            filtered = filtered.filter(item => item.category === selectedCategory);
        }

        // Filter by stock status
        const selectedStockStatus = stockStatusFilter.value;
        if (selectedStockStatus) {
            filtered = filtered.filter(item => {
                const status = getStockStatusClass(item.quantity);
                return status === selectedStockStatus;
            });
        }

        // Sort
        const sortBy = sortSelect.value;
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'newest': return b.createdAt - a.createdAt;
                case 'oldest': return a.createdAt - b.createdAt;
                case 'name-asc': return a.name.localeCompare(b.name);
                case 'name-desc': return b.name.localeCompare(a.name);
                case 'qty-asc': return a.quantity - b.quantity;
                case 'qty-desc': return b.quantity - a.quantity;
                default: return 0;
            }
        });

        // Update clear button visibility
        if (filterText || selectedCategory || selectedStockStatus) {
            clearSearchBtn.style.display = 'flex';
        } else {
            clearSearchBtn.style.display = 'none';
        }

        if (filtered.length === 0) {
            inventoryList.innerHTML = '';
            emptyState.style.display = 'block';
            const hasActiveFilters = filterText || selectedCategory || selectedStockStatus;
            if (hasActiveFilters) {
                let msg = 'No items match your criteria.';
                if (filterText) msg = `No items match "${escapeHtml(filterText)}".`;
                emptyState.querySelector('p').textContent = msg;
            } else {
                emptyState.querySelector('p').textContent = 'No items in inventory. Click "+ Add Item" to get started.';
            }
        } else {
            itemCount.textContent = `${filtered.length} item${filtered.length !== 1 ? 's' : ''}`;
            emptyState.style.display = 'none';
            inventoryList.innerHTML = filtered.map(item => `
                <div class="item-card" data-id="${item.id}">
                    <div class="item-info">
                        <h3>${highlightText(item.name, filterText)}</h3>
                        <div class="item-meta">
                            ${item.category ? `<span>Category: ${highlightText(item.category, filterText)}</span>` : ''}
                            <span class="stock-status-badge ${getStockStatusClass(item.quantity)}">${getStockStatusLabel(item.quantity)}</span>
                            <span>Added: ${formatDate(item.createdAt)}</span>
                            ${item.updatedAt !== item.createdAt ? `<span>Updated: ${formatDate(item.updatedAt)}</span>` : ''}
                        </div>
                        ${item.description ? `<p class="item-description">${highlightText(item.description, filterText)}</p>` : ''}
                    </div>
                    <div class="item-right">
                        <div class="quantity-controls">
                            <button class="qty-btn qty-decrease" data-id="${item.id}" aria-label="Decrease quantity">−</button>
                            <span class="quantity-badge ${getQuantityClass(item.quantity)}" data-qty="${item.quantity}">${item.quantity}</span>
                            <button class="qty-btn qty-increase" data-id="${item.id}" aria-label="Increase quantity">+</button>
                        </div>
                        <div class="item-actions">
                            <span class="item-price" data-price="${item.price || 0}">${CURRENCY_SYMBOL}${(item.price || 0).toFixed(2)}</span>
                            <button class="btn btn-secondary btn-sm view-btn" data-id="${item.id}" aria-label="View ${escapeHtml(item.name)}">View</button>
                            <button class="btn btn-secondary btn-sm edit-btn" data-id="${item.id}" aria-label="Edit ${escapeHtml(item.name)}">Edit</button>
                            <button class="btn btn-secondary btn-sm add-to-cart-btn" data-id="${item.id}" aria-label="Add ${escapeHtml(item.name)} to cart">🛒</button>
                            <button class="btn btn-danger btn-sm delete-btn" data-id="${item.id}" aria-label="Delete ${escapeHtml(item.name)}">Delete</button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }

    // ==================== Quick View Modal ====================
    function openQuickView(item) {
        const stockStatusClass = getStockStatusClass(item.quantity);
        const stockStatusLabel = getStockStatusLabel(item.quantity);
        
        quickViewContent.innerHTML = `
            <div class="quick-view-header">
                <h2>${highlightText(item.name, currentSearchText)}</h2>
                <span class="stock-status-badge ${stockStatusClass}">${stockStatusLabel}: ${item.quantity}</span>
            </div>
            <div class="quick-view-details">
                <div class="detail-row">
                    <span class="detail-label">ID:</span>
                    <span class="detail-value">${escapeHtml(item.id)}</span>
                </div>
                ${item.category ? `
                <div class="detail-row">
                    <span class="detail-label">Category:</span>
                    <span class="detail-value">${highlightText(item.category, currentSearchText)}</span>
                </div>` : ''}
                <div class="detail-row">
                    <span class="detail-label">Quantity:</span>
                    <span class="detail-value quantity-badge ${getQuantityClass(item.quantity)}">${item.quantity}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Price:</span>
                    <span class="detail-value">${CURRENCY_SYMBOL}${(item.price || 0).toFixed(2)}</span>
                </div>
                ${item.description ? `
                <div class="detail-row full-width">
                    <span class="detail-label">Description:</span>
                    <span class="detail-value description-value">${highlightText(item.description, currentSearchText)}</span>
                </div>` : ''}
                <div class="detail-row">
                    <span class="detail-label">Created:</span>
                    <span class="detail-value">${formatDate(item.createdAt)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Last Updated:</span>
                    <span class="detail-value">${formatDate(item.updatedAt)}</span>
                </div>
            </div>
            <div class="quick-view-actions">
                <button class="btn btn-secondary quick-view-add-to-cart-btn" data-id="${item.id}">🛒 Add to Cart</button>
                <button class="btn btn-secondary quick-view-edit-btn" data-id="${item.id}">Edit</button>
                <button class="btn btn-primary quick-view-close-btn">Close</button>
            </div>
        `;

        quickViewModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Bind quick view action buttons
        quickViewModal.querySelector('.quick-view-add-to-cart-btn').addEventListener('click', () => {
            closeQuickView();
            addToCart(item);
        });
        quickViewModal.querySelector('.quick-view-edit-btn').addEventListener('click', () => {
            closeQuickView();
            openModal(item);
        });
        quickViewModal.querySelector('.quick-view-close-btn').addEventListener('click', closeQuickView);
    }

    function closeQuickView() {
        quickViewModal.style.display = 'none';
        document.body.style.overflow = '';
    }

    // ==================== Modal Functions ====================
    function openModal(item = null) {
        if (item) {
            modalTitle.textContent = 'Edit Item';
            submitBtn.textContent = 'Save Changes';
            itemIdInput.value = item.id;
            itemNameInput.value = item.name;
            itemCategoryInput.value = item.category || '';
            itemQuantityInput.value = item.quantity;
            itemDescriptionInput.value = item.description || '';
        } else {
            modalTitle.textContent = 'Add Item';
            submitBtn.textContent = 'Add Item';
            itemIdInput.value = '';
            itemForm.reset();
        }
        itemModal.style.display = 'flex';
        itemNameInput.focus();
    }

    function closeModal() {
        itemModal.style.display = 'none';
        itemForm.reset();
        itemIdInput.value = '';
    }

    // ==================== CRUD Operations ====================
    function addItem(name, category, quantity, description) {
        const item = {
            id: generateId(),
            name: name.trim(),
            category: category.trim(),
            quantity: parseInt(quantity, 10),
            description: description.trim(),
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        items.unshift(item);
        saveItems();
        renderItems(searchInput.value);
    }

    function updateItem(id, name, category, quantity, description) {
        const index = items.findIndex(item => item.id === id);
        if (index !== -1) {
            items[index].name = name.trim();
            items[index].category = category.trim();
            items[index].quantity = parseInt(quantity, 10);
            items[index].description = description.trim();
            items[index].updatedAt = Date.now();
            saveItems();
            renderItems(searchInput.value);
        }
    }

    function deleteItem(id) {
        if (confirm('Are you sure you want to delete this item?')) {
            items = items.filter(item => item.id !== id);
            saveItems();
            renderItems(searchInput.value);
        }
    }

    function adjustQuantity(id, delta) {
        const item = items.find(item => item.id === id);
        if (item) {
            const newQty = Math.max(0, item.quantity + delta);
            item.quantity = newQty;
            item.updatedAt = Date.now();
            saveItems();
            renderItems(searchInput.value);
        }
    }

    // ==================== Event Listeners ====================
    addItemBtn.addEventListener('click', () => openModal());

    // Close modal on backdrop click
    itemModal.addEventListener('click', (e) => {
        if (e.target === itemModal) {
            closeModal();
        }
    });

    // Close quick view modal on backdrop click
    quickViewModal.addEventListener('click', (e) => {
        if (e.target === quickViewModal) {
            closeQuickView();
        }
    });

    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    closeQuickViewBtn.addEventListener('click', closeQuickView);

    // Close modals on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (quickViewModal.style.display === 'flex') {
                closeQuickView();
            } else if (itemModal.style.display === 'flex') {
                closeModal();
            }
        }
        // Ctrl+K or / to focus search
        if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && !e.ctrlKey && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA')) {
            e.preventDefault();
            searchInput.focus();
            searchInput.select();
        }
    });

    itemForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = itemIdInput.value;
        const name = itemNameInput.value.trim();
        const category = itemCategoryInput.value.trim();
        const quantity = itemQuantityInput.value;
        const description = itemDescriptionInput.value.trim();

        if (!name || !quantity) {
            return;
        }

        if (id) {
            updateItem(id, name, category, quantity, description);
        } else {
            addItem(name, category, quantity, description);
        }
        closeModal();
    });

    // Search input
    searchInput.addEventListener('input', () => {
        const value = searchInput.value;
        updateSearchSuggestions();
        renderItems(value);
    });

    // Clear search button
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        categoryFilter.value = '';
        stockStatusFilter.value = '';
        searchSuggestions.style.display = 'none';
        renderItems('');
        searchInput.focus();
    });

    // Search suggestions click
    searchSuggestions.addEventListener('click', (e) => {
        const suggestionItem = e.target.closest('.suggestion-item');
        if (suggestionItem) {
            selectSuggestion(suggestionItem.dataset.id);
        }
    });

    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-wrapper')) {
            searchSuggestions.style.display = 'none';
        }
    });

    // Category filter
    categoryFilter.addEventListener('change', () => {
        renderItems(searchInput.value);
    });

    // Stock status filter
    stockStatusFilter.addEventListener('change', () => {
        renderItems(searchInput.value);
    });

    // Sort select
    sortSelect.addEventListener('change', () => {
        renderItems(searchInput.value);
    });

    // Event delegation for item actions
    inventoryList.addEventListener('click', (e) => {
        const target = e.target;

        // Quantity buttons
        const qtyBtn = target.closest('.qty-btn');
        if (qtyBtn) {
            const id = qtyBtn.dataset.id;
            const delta = qtyBtn.classList.contains('qty-increase') ? 1 : -1;
            adjustQuantity(id, delta);
            return;
        }

        // View button
        const viewBtn = target.closest('.view-btn');
        if (viewBtn) {
            const id = viewBtn.dataset.id;
            const item = items.find(item => item.id === id);
            if (item) openQuickView(item);
            return;
        }

        const addToCartBtn = target.closest('.add-to-cart-btn');
        if (addToCartBtn) {
            const id = addToCartBtn.dataset.id;
            const item = items.find(i => i.id === id);
            if (item) {
                addToCart(item);
            }
            return;
        }

        const editBtn = target.closest('.edit-btn');
        const deleteBtn = target.closest('.delete-btn');

        if (editBtn) {
            const id = editBtn.dataset.id;
            const item = items.find(item => item.id === id);
            if (item) openModal(item);
        } else if (deleteBtn) {
            const id = deleteBtn.dataset.id;
            deleteItem(id);
        }
    });

    // ==================== Cart Event Listeners ====================
    // Toggle cart modal
    if (cartToggleBtn) {
        cartToggleBtn.addEventListener('click', () => {
            cartModal.style.display = 'flex';
        });
    }

    // Close cart modal on backdrop click
    if (cartModal) {
        cartModal.addEventListener('click', (e) => {
            if (e.target === cartModal) {
                cartModal.style.display = 'none';
            }
        });
    }

    if (closeCartBtn) {
        closeCartBtn.addEventListener('click', () => {
            cartModal.style.display = 'none';
        });
    }

    // Cart actions via event delegation
    if (cartItemsList) {
        cartItemsList.addEventListener('click', (e) => {
            const target = e.target;

            // Remove item from cart
            const removeBtn = target.closest('.cart-remove-btn');
            if (removeBtn) {
                const id = removeBtn.dataset.id;
                removeFromCart(id);
                return;
            }

            // Increase quantity
            const increaseBtn = target.closest('.cart-qty-increase');
            if (increaseBtn && !increaseBtn.disabled) {
                const id = increaseBtn.dataset.id;
                updateCartQuantity(id, 1);
                return;
            }

            // Decrease quantity
            const decreaseBtn = target.closest('.cart-qty-decrease');
            if (decreaseBtn) {
                const id = decreaseBtn.dataset.id;
                updateCartQuantity(id, -1);
                return;
            }
        });
    }

    // Clear cart button
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', clearCart);
    }

    // Checkout button
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', completeCheckout);
    }

    // Order History button
    if (orderHistoryBtn) {
        orderHistoryBtn.addEventListener('click', () => {
            renderOrderHistory();
            openModal(orderHistoryModal);
        });
    }

    // Close Order History modal
    if (closeOrderHistoryBtn) {
        closeOrderHistoryBtn.addEventListener('click', () => {
            closeModal(orderHistoryModal);
        });
    }

    // Close Order History modal when clicking outside
    if (orderHistoryModal) {
        orderHistoryModal.addEventListener('click', (e) => {
            if (e.target === orderHistoryModal) {
                closeModal(orderHistoryModal);
            }
        });
    }

    // Close price modal
    if (closePriceBtn) {
        closePriceBtn.addEventListener('click', closePriceModal);
    }

    if (priceModal) {
        priceModal.addEventListener('click', (e) => {
            if (e.target === priceModal) {
                closePriceModal();
            }
        });
    }

    if (priceForm) {
        priceForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const itemId = priceItemId.value;
            const price = priceInput.value;
            savePrice(itemId, price);
        });
    }

    // ==================== Initialization ====================
    function init() {
        loadItems();
        loadCart();
        if (!hasItems()) {
            items = getSampleData();
            saveItems();
        }
        renderItems();
        updateCartUI();
        updateOrderHistoryBadge();
    }

    init();
})();
