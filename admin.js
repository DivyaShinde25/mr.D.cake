// Admin data
let orders = JSON.parse(localStorage.getItem('orders')) || [];
let isAdminLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';

// Clean up delivered orders older than 24 hours
function cleanupDeliveredOrders() {
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    let allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    const initialCount = allOrders.length;
    
    // Remove delivered orders older than 24 hours
    allOrders = allOrders.filter(order => {
        if (order.status === 'delivered') {
            const deliveredTime = order.deliveredAt || order.placedAt || 0;
            return (now - deliveredTime) < twentyFourHours;
        }
        return true;
    });
    
    const cleanedCount = initialCount - allOrders.length;
    if (cleanedCount > 0) {
        localStorage.setItem('orders', JSON.stringify(allOrders));
        console.log(`Cleaned up ${cleanedCount} delivered orders older than 24 hours`);
    }
    
    return allOrders;
}

// Load orders from MongoDB
async function loadOrdersFromMongoDB() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/orders`);
        if (response.ok) {
            const mongoOrders = await response.json();
            
            // Convert MongoDB orders to local format
            const convertedOrders = mongoOrders.map(order => ({
                id: parseInt(order.orderId),
                items: order.items,
                total: order.total,
                type: 'delivery',
                details: {
                    name: order.customer.email.split('@')[0],
                    phone: order.customer.phone,
                    address: order.customer.address,
                    deliveryDate: order.deliveryDate,
                    deliveryTime: order.deliveryTime
                },
                date: new Date(order.orderDate).toLocaleString(),
                status: order.status,
                estimatedTime: 'Awaiting confirmation',
                placedAt: new Date(order.orderDate).getTime(),
                _id: order._id
            }));
            
            // Merge with localStorage orders
            const localOrders = JSON.parse(localStorage.getItem('orders')) || [];
            const mergedOrders = [...localOrders];
            
            convertedOrders.forEach(mongoOrder => {
                if (!mergedOrders.find(local => local.id === mongoOrder.id)) {
                    mergedOrders.push(mongoOrder);
                }
            });
            
            orders = mergedOrders;
            localStorage.setItem('orders', JSON.stringify(orders));
            
            updateDashboard();
            updateOrderList();
        }
    } catch (error) {
        console.log('MongoDB not available, using localStorage only');
    }
    
    // Clean up delivered orders
    orders = cleanupDeliveredOrders();
}

// Admin Login
function checkAdminLogin() {
    if (!isAdminLoggedIn) {
        document.getElementById('admin-login-modal').classList.add('active');
        document.getElementById('admin-main').style.display = 'none';
    } else {
        document.getElementById('admin-login-modal').classList.remove('active');
        document.getElementById('admin-main').style.display = 'block';
        initializeAdmin();
    }
}

function handleAdminLogin(e) {
    e.preventDefault();
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    
    if (email === 'admin@mrdcakes.com' && password === 'admin123') {
        sessionStorage.setItem('adminLoggedIn', 'true');
        isAdminLoggedIn = true;
        document.getElementById('admin-login-modal').classList.remove('active');
        document.getElementById('admin-main').style.display = 'block';
        initializeAdmin();
    } else {
        document.getElementById('admin-error').textContent = 'Invalid credentials';
    }
}

async function initializeAdmin() {
    // Load from localStorage first
    orders = JSON.parse(localStorage.getItem('orders')) || [];
    updateDashboard();
    updateOrderList();
    
    // Try to sync with MongoDB in background
    loadOrdersFromMongoDB();
}

// Navigation
function showSection(sectionId) {
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    document.getElementById(sectionId).classList.add('active');
    document.querySelector(`[onclick="showSection('${sectionId}')"]`).classList.add('active');
    
    if (sectionId === 'dashboard') updateDashboard();
    if (sectionId === 'orders') updateOrderList();
}

// Dashboard
function updateDashboard() {
    orders = JSON.parse(localStorage.getItem('orders') || '[]');
    
    const totalOrders = orders.length;
    const completedOrders = orders.filter(order => order.status === 'delivered').length;
    
    // Get orders scheduled for next 24 hours
    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const scheduledOrders = orders.filter(order => {
        if (!order.details || !order.details.deliveryDate) return false;
        const deliveryDate = new Date(order.details.deliveryDate);
        return deliveryDate >= now && deliveryDate <= next24Hours;
    }).length;
    
    document.getElementById('total-orders').textContent = totalOrders;
    document.getElementById('completed-orders').textContent = completedOrders;
    document.getElementById('scheduled-orders').textContent = scheduledOrders;
    
    // Today's orders
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(order => {
        if (!order.details || !order.details.deliveryDate) return false;
        return order.details.deliveryDate === today && order.status !== 'delivered';
    });
    
    // Tomorrow's orders
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const tomorrowOrders = orders.filter(order => {
        if (!order.details || !order.details.deliveryDate) return false;
        return order.details.deliveryDate === tomorrow;
    });
    
    // Upcoming orders (day after tomorrow to end of month)
    const dayAfter = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const upcomingOrders = orders.filter(order => {
        if (!order.details || !order.details.deliveryDate) return false;
        const deliveryDate = new Date(order.details.deliveryDate);
        return deliveryDate >= dayAfter && deliveryDate <= endOfMonth;
    });
    
    document.getElementById('today-orders').innerHTML = todayOrders.length > 0 ? 
        todayOrders.map(order => `
            <div class="todo-item">
                <strong>Order #${String(order.id).slice(-6)}</strong><br>
                ${order.details.deliveryTime || 'No time'} - ${order.details.name}<br>
                <span class="status-${order.status || 'confirmed'}">${order.status || 'confirmed'}</span>
            </div>
        `).join('') : '<p>No orders for today</p>';
    
    document.getElementById('tomorrow-orders').innerHTML = tomorrowOrders.length > 0 ? 
        tomorrowOrders.map(order => `
            <div class="todo-item">
                <strong>Order #${String(order.id).slice(-6)}</strong><br>
                ${order.details.deliveryTime || 'No time'} - ${order.details.name}<br>
                Items: ${order.items.length}
            </div>
        `).join('') : '<p>No orders for tomorrow</p>';
    
    document.getElementById('upcoming-orders').innerHTML = upcomingOrders.length > 0 ? 
        upcomingOrders.map(order => `
            <div class="todo-item">
                <strong>Order #${String(order.id).slice(-6)}</strong><br>
                ${order.details.deliveryDate} ${order.details.deliveryTime || ''}<br>
                ${order.details.name} - Items: ${order.items.length}
            </div>
        `).join('') : '<p>No upcoming orders</p>';
}

// Order Management
function updateOrderList() {
    orders = JSON.parse(localStorage.getItem('orders') || '[]');
    
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const dayAfter = new Date(Date.now() + 48 * 60 * 60 * 1000);
    
    const todayOrders = orders.filter(order => {
        if (!order.details || !order.details.deliveryDate) return false;
        return order.details.deliveryDate === today;
    });
    
    const tomorrowOrders = orders.filter(order => {
        if (!order.details || !order.details.deliveryDate) return false;
        return order.details.deliveryDate === tomorrow;
    });
    
    const scheduledOrders = orders.filter(order => {
        if (!order.details || !order.details.deliveryDate) return false;
        const deliveryDate = new Date(order.details.deliveryDate);
        return deliveryDate >= dayAfter;
    });
    
    function renderOrderSection(ordersList) {
        if (ordersList.length === 0) return '<p>No orders</p>';
        return ordersList.map(order => renderOrder(order)).join('');
    }
    
    document.getElementById('orders-today').innerHTML = renderOrderSection(todayOrders);
    document.getElementById('orders-tomorrow').innerHTML = renderOrderSection(tomorrowOrders);
    document.getElementById('orders-scheduled').innerHTML = renderOrderSection(scheduledOrders);
}

function renderOrder(order) {
    const statusClass = `status-${order.status || 'confirmed'}`;
    const details = order.details || {};
    const deliveredClass = order.status === 'delivered' ? 'delivered-order' : '';
    
    return `
    <div class="order-item ${deliveredClass}">
        <h4>
            Order #${String(order.id).slice(-6)}
            <span class="order-status ${statusClass}">${order.status || 'confirmed'}</span>
        </h4>
        
        <div class="order-details">
            <div class="order-info">
                <strong>📅 Date:</strong>
                ${order.date}
            </div>
            <div class="order-info">
                <strong>🚚 Type:</strong>
                Home Delivery
            </div>
        </div>
        
        ${details.name ? `
        <div class="delivery-info">
            <strong>👤 Customer:</strong> ${details.name}<br>
            <strong>📞 Phone:</strong> ${details.phone || 'N/A'}<br>
            <strong>📍 Address:</strong> ${details.address || 'N/A'}
            ${details.deliveryDate ? `
            <div class="delivery-schedule">
                <i class="fas fa-clock"></i>
                Scheduled: ${details.deliveryDate} at ${details.deliveryTime || 'N/A'}
            </div>
            ` : ''}
        </div>
        ` : ''}
        
        <div class="order-items">
            <h5>📦 Items Ordered:</h5>
            <ul class="item-list">
                ${order.items.map(item => `
                <li>
                    <span>${item.name} x${item.quantity}</span>
                    <span>₹${item.price * item.quantity}</span>
                    ${item.flavour ? `<div class="item-details">Flavour: ${item.flavour}</div>` : ''}
                    ${item.weight ? `<div class="item-details">Weight: ${item.weight}</div>` : ''}
                    ${item.tiers && item.tiers > 1 ? `<div class="item-details">Tiers: ${item.tiers}</div>` : ''}
                    ${item.instructions ? `<div class="item-details">Instructions: ${item.instructions}</div>` : ''}
                </li>
                `).join('')}
            </ul>
        </div>
        
        <div class="order-total">
            Total: ₹${order.total}
        </div>
        
        <div class="order-actions">
            <select class="btn-update order-status-select" data-order-id="${order.id}">
                <option value="pending" ${order.status === 'pending' ? 'selected' : ''}> Not Confirmed Yet</option>
                <option value="confirmed" ${(order.status || 'confirmed') === 'confirmed' ? 'selected' : ''}> Confirmed</option>
                <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>Preparing</option>
                <option value="ready" ${order.status === 'ready' ? 'selected' : ''}> Ready</option>
                <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
            </select>
        </div>
    </div>
    `;
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        // Find the order with MongoDB _id
        const order = orders.find(o => String(o.id) === String(orderId));
        if (order && order._id) {
            // Try to update in MongoDB
            fetch(`${CONFIG.API_BASE_URL}/api/orders/${order._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            }).catch(() => {});
        }
        
        // Update locally
        let allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
        const localOrder = allOrders.find(o => String(o.id) === String(orderId));
        if (localOrder) {
            localOrder.status = newStatus;
            
            // Set delivered timestamp for cleanup
            if (newStatus === 'delivered') {
                localOrder.deliveredAt = Date.now();
                localOrder.estimatedTime = 'Delivered';
            } else if (newStatus === 'confirmed') {
                localOrder.estimatedTime = new Date(Date.now() + 45 * 60000).toLocaleTimeString();
            } else if (newStatus === 'preparing') {
                localOrder.estimatedTime = new Date(Date.now() + 30 * 60000).toLocaleTimeString();
            } else if (newStatus === 'ready') {
                localOrder.estimatedTime = 'Ready for pickup/delivery';
            }
            
            localStorage.setItem('orders', JSON.stringify(allOrders));
            orders = allOrders;
            
            updateOrderList();
            updateDashboard();
            
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'orders',
                newValue: JSON.stringify(allOrders)
            }));
            
            console.log('Order', orderId, 'status updated to', newStatus);
        }
    } catch (error) {
        console.error('Error updating order status:', error);
    }
}

// Add event listeners for order status dropdowns
document.addEventListener('change', function(e) {
    if (e.target.classList.contains('order-status-select')) {
        const orderId = e.target.getAttribute('data-order-id');
        const newStatus = e.target.value;
        updateOrderStatus(orderId, newStatus);
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    checkAdminLogin();
    
    document.getElementById('admin-login-form').addEventListener('submit', handleAdminLogin);
    
    if (isAdminLoggedIn) {
        updateDashboard();
    }
    
    // Auto-refresh every 10 seconds
    setInterval(() => {
        // Refresh from localStorage
        orders = JSON.parse(localStorage.getItem('orders')) || [];
        
        if (document.getElementById('dashboard').classList.contains('active')) {
            updateDashboard();
        }
        if (document.getElementById('orders').classList.contains('active')) {
            updateOrderList();
        }
        
        // Try MongoDB sync in background
        loadOrdersFromMongoDB();
    }, 10000);
    
    // Clean up delivered orders every hour
    setInterval(() => {
        cleanupDeliveredOrders();
        if (document.getElementById('dashboard').classList.contains('active')) {
            updateDashboard();
        }
        if (document.getElementById('orders').classList.contains('active')) {
            updateOrderList();
        }
    }, 60 * 60 * 1000); // 1 hour
});