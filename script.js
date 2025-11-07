// DOM Elements
const searchIcon = document.querySelector(".search-icon");
const searchForm = document.querySelector(".search-form");
const menuIcon = document.querySelector(".menu-icon");
const navbar = document.querySelector(".navbar");
const cartIcon = document.querySelector(".cart-icon");
const cartItemsContainer = document.querySelector(".cart-items-container");

// Event delegation for add to cart and favorites
document.addEventListener('click', (e) => {
    const target = e.target;
    if (target.matches('.add-to-cart') || target.closest('.add-to-cart')) {
        e.preventDefault();
        e.stopPropagation();
        const card = target.closest('.cake-card') || target.closest('.cheese-card');
        if (!card) return;
        const name = card.querySelector('h3').textContent;
        const priceElem = card.querySelector('.price');
        let priceText = priceElem.textContent.split(/\s+/)[0].replace('₹', '').replace('/-', '').trim();
        const price = parseFloat(priceText);
        const image = card.querySelector('img').getAttribute('src');
        addToCart(name, price, image);
    }
    if (target.matches('.toggle-favorite') || target.closest('.toggle-favorite')) {
        e.preventDefault();
        e.stopPropagation();
        const card = target.closest('.cake-card') || target.closest('.cheese-card');
        if (!card) return;
        const name = card.querySelector('h3').textContent;
        const priceElem = card.querySelector('.price');
        let priceText = priceElem.textContent.split(/\s+/)[0].replace('₹', '').replace('/-', '').trim();
        const price = parseFloat(priceText);
        const image = card.querySelector('img').getAttribute('src');
        toggleFavorite(name, price, image);
    }
});

// UI Toggle Functions
searchIcon.addEventListener("click", () => {
    searchForm.classList.add("active");
    cartItemsContainer.classList.remove("active");
    navbar.classList.remove("active");
});

menuIcon.addEventListener("click", () => {
    navbar.classList.add("active");
    searchForm.classList.remove("active");
    cartItemsContainer.classList.remove("active");
});

cartIcon.addEventListener("click", () => {
    cartItemsContainer.classList.toggle("active");
    document.querySelector('.receipt-container').classList.remove("active");
    document.querySelector('.tracking-container').classList.remove("active");
    searchForm.classList.remove("active");
    navbar.classList.remove("active");
});

window.onscroll = () => {
    cartItemsContainer.classList.remove("active");
    document.querySelector('.receipt-container').classList.remove("active");
    searchForm.classList.remove("active");
    navbar.classList.remove("active");
}

// Data Storage
let cart = [];
let orderType = '';
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let orders = JSON.parse(localStorage.getItem('orders')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let users = JSON.parse(localStorage.getItem('users')) || [];

// Cart Functions
function addToCart(name, price, image) {
    // Input validation and sanitization
    if (!name || !price || !image) {
        showError('Invalid product data');
        return;
    }
    
    // Ensure image path is correct
    if (!image.startsWith('images/')) {
        image = 'images/' + image;
    }
    
    const sanitizeInput = (input) => {
        if (typeof input !== 'string') return input;
        return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    };
    
    const escapeHtml = (unsafe) => {
        if (typeof unsafe !== 'string') return unsafe;
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };
    
    const sanitizedName = window.SecurityUtils ? SecurityUtils.sanitizeInput(name) : sanitizeInput(name);
    const sanitizedImage = window.SecurityUtils ? SecurityUtils.sanitizeInput(image) : sanitizeInput(image);
    const numericPrice = parseFloat(price);
    
    if (isNaN(numericPrice) || numericPrice <= 0) {
        showError('Invalid price');
        return;
    }
    
    const existingItem = cart.find(item => item.name === sanitizedName);
    if (existingItem) {
        existingItem.quantity += 1;
        const displayName = window.SecurityUtils ? SecurityUtils.escapeHtml(sanitizedName) : escapeHtml(sanitizedName);
        showSuccess(`${displayName} quantity updated in cart!`);
    } else {
        cart.push({ name: sanitizedName, price: numericPrice, image: sanitizedImage, quantity: 1 });
        const displayName = window.SecurityUtils ? SecurityUtils.escapeHtml(sanitizedName) : escapeHtml(sanitizedName);
        showSuccess(`${displayName} added to cart successfully!`);
    }
    updateCartDisplay();
    cartItemsContainer.classList.add('active');
}



function addCustomCakeToCart() {
    const flavour = document.getElementById('cake-flavour').value;
    const cakeType = document.getElementById('cake-type').value;
    const weight = document.getElementById('cake-weight').value;
    const instructions = document.getElementById('special-instructions').value;
    
    if (!flavour) {
        showError('Please select a flavour');
        return;
    }
    
    if (!cakeType) {
        showError('Please select a cake type');
        return;
    }
    
    const flavourOption = document.querySelector(`#cake-flavour option[value="${flavour}"]`);
    const halfKgPrice = parseInt(flavourOption.dataset.priceHalf);
    const fullKgPrice = parseInt(flavourOption.dataset.priceFull);
    
    // Calculate price based on weight
    let basePrice;
    const weightNum = parseFloat(weight);
    if (weightNum <= 0.5) {
        basePrice = halfKgPrice;
    } else if (weightNum <= 1) {
        basePrice = fullKgPrice;
    } else {
        basePrice = fullKgPrice * weightNum;
    }
    
    const totalPrice = basePrice;
    
    const customName = `${cakeType} ${flavour} Cake (${weight})`;
    
    const existingItem = cart.find(item => 
        item.name === customName && 
        item.instructions === instructions
    );
    
    if (existingItem) {
        existingItem.quantity += 1;
        showSuccess(`${customName} quantity updated in cart!`);
    } else {
        cart.push({
            name: customName,
            price: totalPrice,
            image: 'images/logo.png',
            quantity: 1,
            flavour: flavour,
            cakeType: cakeType,
            weight: weight,
            instructions: instructions
        });
        showSuccess(`${customName} added to cart successfully!`);
    }
    
    updateCartDisplay();
    cartItemsContainer.classList.add('active');
    
    // Reset form
    document.getElementById('cake-flavour').value = '';
    document.getElementById('cake-type').value = '';
    document.getElementById('cake-weight').value = '0.5kg';
    document.getElementById('special-instructions').value = '';
    document.getElementById('custom-price').textContent = '0';
}

function updateCustomPrice() {
    const flavour = document.getElementById('cake-flavour').value;
    const weight = document.getElementById('cake-weight').value;
    
    if (!flavour) {
        document.getElementById('custom-price').textContent = '0';
        return;
    }
    
    const flavourOption = document.querySelector(`#cake-flavour option[value="${flavour}"]`);
    const halfKgPrice = parseInt(flavourOption.dataset.priceHalf);
    const fullKgPrice = parseInt(flavourOption.dataset.priceFull);
    
    let basePrice;
    const weightNum = parseFloat(weight);
    if (weightNum <= 0.5) {
        basePrice = halfKgPrice;
    } else if (weightNum <= 1) {
        basePrice = fullKgPrice;
    } else {
        basePrice = fullKgPrice * weightNum;
    }
    
    const totalPrice = basePrice;
    
    document.getElementById('custom-price').textContent = totalPrice;
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartDisplay();
    if (cart.length === 0) {
        cartItemsContainer.classList.remove('active');
    }
}

function updateCartDisplay() {
    const cartContainer = document.querySelector('.cart-items-container');
    const emptyMessage = cartContainer.querySelector('.empty-cart-message');
    
    // Show/hide empty message based on cart contents
    if (cart.length === 0) {
        emptyMessage.style.display = 'block';
    } else {
        emptyMessage.style.display = 'none';
    }
    
    const escapeHtml = (unsafe) => {
        if (typeof unsafe !== 'string') return unsafe;
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };
    
    const cartItemsHTML = cart.map((item, index) => {
        const safeName = window.SecurityUtils ? SecurityUtils.escapeHtml(item.name) : escapeHtml(item.name);
        const safeImage = window.SecurityUtils ? SecurityUtils.escapeHtml(item.image) : escapeHtml(item.image);
        
        // Preload the image to ensure it's in cache
        const img = new Image();
        img.src = safeImage;
        
        const totalPrice = item.price * item.quantity;
        
        return `
        <div class="cart-items">
            <img src="${safeImage}" alt="${safeName}" class="cart-item-image"
                 onerror="this.onerror=null; this.src='images/logo.png'">
            <div class="content">
                <h3>${safeName}</h3>
                ${item.instructions ? `<p class="instructions">Instructions: ${escapeHtml(item.instructions)}</p>` : ''}
                <div class="quantity-controls">
                    <button onclick="decreaseQuantity(${index})">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="increaseQuantity(${index})">+</button>
                </div>
                <div class="price-remove">
                    <div class="price">₹${Math.round(totalPrice)}/-</div>
                    <button class="remove-btn" onclick="removeFromCart(${index})">Remove</button>
                </div>
            </div>
        </div>
        `;
    }).join('');
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('cart-total').textContent = total;
    
    // Update cart content
    let cartContent = cartContainer.querySelector('.cart-content');
    if (!cartContent) {
        cartContent = document.createElement('div');
        cartContent.className = 'cart-content';
        cartContainer.insertBefore(cartContent, cartContainer.querySelector('.cart-total'));
    }
    cartContent.innerHTML = cartItemsHTML;
    
    // Show cart container when items are added
    cartContainer.classList.add('active');
}

function increaseQuantity(index) {
    cart[index].quantity += 1;
    updateCartDisplay();
}



function decreaseQuantity(index) {
    if (cart[index].quantity > 1) {
        cart[index].quantity -= 1;
    } else {
        cart.splice(index, 1);
    }
    updateCartDisplay();
}



// UI Feedback
function showLoading() {
    document.getElementById('loading-spinner').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading-spinner').style.display = 'none';
}

function showError(message) {
    document.getElementById('error-message').textContent = message;
    document.getElementById('error-toast').style.display = 'flex';
    setTimeout(() => hideError(), 5000);
}

function hideError() {
    document.getElementById('error-toast').style.display = 'none';
}

function showSuccess(message) {
    document.getElementById('success-message').textContent = message;
    document.getElementById('success-toast').style.display = 'flex';
    setTimeout(() => hideSuccess(), 3000);
}

function hideSuccess() {
    document.getElementById('success-toast').style.display = 'none';
}

// Order Placement
async function placeOrder() {
    if (!currentUser) {
        showError('Please login to place an order');
        document.getElementById('auth-modal').classList.add('active');
        return;
    }
    
    if (cart.length === 0) {
        showError('Your cart is empty!');
        return;
    }
    
    orderType = 'delivery';
    showLoading();

    const name = document.getElementById('customer-name').value;
    const phone = document.getElementById('phone-number').value;
    const address = document.getElementById('address').value;
    const deliveryDate = document.getElementById('delivery-date').value;
    const deliveryTime = document.getElementById('delivery-time').value;
    const customizations = document.getElementById('customizations').value;
    
    if (!name || !phone || !address || !deliveryDate || !deliveryTime) {
        hideLoading();
        showError('Please fill all required fields including delivery date and time');
        return;
    }
    
    const selectedDate = new Date(deliveryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
        hideLoading();
        showError('Delivery date cannot be in the past');
        return;
    }
    
    const orderId = Date.now();
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Store order locally first
    const localOrder = {
        id: orderId,
        items: [...cart],
        total: total,
        type: orderType,
        details: { name, phone, address, deliveryDate, deliveryTime, customizations },
        date: new Date().toLocaleString(),
        status: 'Not Confirmed Yet',
        estimatedTime: 'Awaiting confirmation',
        placedAt: Date.now()
    };
    
    orders.push(localOrder);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Try to save to MongoDB (optional)
    try {
        const customerData = {
            email: currentUser.email,
            phone: phone,
            address: address
        };
        
        const orderData = {
            orderId: orderId.toString(),
            customer: {
                email: currentUser.email,
                phone: phone,
                address: address
            },
            items: [...cart],
            total: total,
            deliveryDate: deliveryDate,
            deliveryTime: deliveryTime,
            status: 'Not Confirmed Yet'
        };

        // Try MongoDB save (will fail silently if server not running)
        fetch(`${CONFIG.API_BASE_URL}/api/customers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(customerData)
        }).catch(() => {});

        fetch(`${CONFIG.API_BASE_URL}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        }).catch(() => {});
        
    } catch (error) {
        console.log('MongoDB not available, using localStorage only');
    }
    
    updateReceiptDisplay();
    updateTrackingDisplay();
    
    hideLoading();
    showSuccess('Order placed successfully! Awaiting baker confirmation.');
    
    cart = [];
    updateCartDisplay();

    document.getElementById('customer-name').value = '';
    document.getElementById('phone-number').value = '';
    document.getElementById('address').value = '';
    document.getElementById('delivery-date').value = '';
    document.getElementById('delivery-time').value = '';
    document.getElementById('customizations').value = '';
}

// Favorites
function toggleFavorite(name, price, image) {
    const existingIndex = favorites.findIndex(item => item.name === name);
    if (existingIndex > -1) {
        favorites.splice(existingIndex, 1);
    } else {
        favorites.push({ name, price, image });
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    if (document.getElementById('favorites-wrapper')) {
        updateFavoritesDisplay();
    }
    updateFavoriteIcons();
}

function updateFavoritesDisplay() {
    const favoritesWrapper = document.getElementById('favorites-wrapper');
    if (!favoritesWrapper) return;
    
    const storedFavorites = JSON.parse(localStorage.getItem('favorites')) || [];
    
    if (storedFavorites.length === 0) {
        favoritesWrapper.innerHTML = '<div class="no-favorites"><p>No favorite items yet. Go back to <a href="index.html#cakes">Cakes</a> and click the heart icon on any item to add it to your favorites!</p></div>';
    } else {
        const favoritesHTML = storedFavorites.map((item, index) => {
            const safeName = item.name.replace(/'/g, "&#39;");
            const safeImage = item.image.replace(/'/g, "&#39;");
            return `
            <div class="cake-card">
                <button type="button" class="cake-favorite toggle-favorite active">
                    <i class="fa-solid fa-heart"></i>
                </button>
                <img src="${safeImage}" alt="" class="loaded">
                <h3>${safeName}</h3>
                <div class="price">₹${item.price}/-</div>
                <button class="btn add-to-cart">add to cart</button>
            </div>
            `;
        }).join('');
        favoritesWrapper.innerHTML = favoritesHTML;
    }
}

function updateFavoriteIcons() {
    document.querySelectorAll('.cake-favorite').forEach(favoriteBtn => {
        const card = favoriteBtn.closest('.cake-card');
        const itemName = card.querySelector('h3').textContent;
        const isFavorite = favorites.some(item => item.name === itemName);
        favoriteBtn.classList.toggle('active', isFavorite);
    });
    
    document.querySelectorAll('.cheese-card .fa-heart').forEach(favoriteBtn => {
        const card = favoriteBtn.closest('.cheese-card');
        const itemName = card.querySelector('h3').textContent;
        const isFavorite = favorites.some(item => item.name === itemName);
        favoriteBtn.classList.toggle('active', isFavorite);
    });
}

function updateReceiptDisplay() {
    const receiptContent = document.getElementById('receipt-content');
    if (orders.length === 0) {
        receiptContent.innerHTML = '<p>No orders yet</p>';
    } else {
        const receiptsHTML = orders.map(order => {
            const details = order.details || {};
            return `
            <div class="receipt-item">
                <h4>Order #${order.id}</h4>
                <p><strong>Date:</strong> ${order.date}</p>
                <p><strong>Type:</strong> Home Delivery</p>
                ${details.name ? `<p><strong>Customer:</strong> ${details.name}</p><p><strong>Phone:</strong> ${details.phone || 'N/A'}</p><p><strong>Address:</strong> ${details.address || 'N/A'}</p>${details.deliveryDate ? `<p><strong>Delivery:</strong> ${details.deliveryDate} at ${details.deliveryTime || 'N/A'}</p>` : ''}` : ''}
                <p><strong>Items:</strong></p>
                <ul>
                    ${order.items.map(item => `<li>${item.name} x${item.quantity} - ₹${item.price * item.quantity}</li>`).join('')}
                </ul>
                <p><strong>Total: ₹${order.total}</strong></p>
            </div>
            `;
        }).join('');
        receiptContent.innerHTML = receiptsHTML;
    }
}

function updateTrackingDisplay() {
    const trackingContent = document.getElementById('tracking-content');
    orders = JSON.parse(localStorage.getItem('orders')) || [];
    
    const activeOrders = orders.filter(order => order.status !== 'completed' && order.status !== 'cancelled');
    
    if (activeOrders.length === 0) {
        trackingContent.innerHTML = '<p>No active orders to track</p>';
    } else {
        const trackingHTML = activeOrders.map(order => {
            const currentStatus = order.status || 'confirmed';
            
            return `
                <div class="tracking-item">
                    <h4>Order #${order.id}</h4>
                    <p><strong>Type:</strong> Home Delivery</p>
                    <p><strong>Status:</strong> ${currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}</p>
                    <p><strong>Estimated Time:</strong> ${order.estimatedTime}</p>
                    <div class="status-bar">
                        <div class="status-step ${currentStatus === 'pending' ? 'active' : ['confirmed', 'preparing', 'ready', 'delivered'].includes(currentStatus) ? 'completed' : ''}">Pending</div>
                        <div class="status-step ${currentStatus === 'confirmed' ? 'active' : ['preparing', 'ready', 'delivered'].includes(currentStatus) ? 'completed' : ''}">Confirmed</div>
                        <div class="status-step ${currentStatus === 'preparing' ? 'active' : ['ready', 'delivered'].includes(currentStatus) ? 'completed' : ''}">Preparing</div>
                        <div class="status-step ${currentStatus === 'ready' ? 'active' : currentStatus === 'delivered' ? 'completed' : ''}">Ready</div>
                        <div class="status-step ${currentStatus === 'delivered' ? 'active' : ''}">Delivered</div>
                    </div>
                    <div class="delivery-time">
                        <strong>Estimated Delivery Time:</strong> ${order.estimatedTime}
                    </div>
                </div>
            `;
        }).join('');
        trackingContent.innerHTML = trackingHTML;
    }
}

// Check MongoDB connection status
async function checkMongoDBConnection() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/orders`, {
            method: 'GET',
            timeout: 2000
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

// Sync localStorage data with MongoDB when available
async function syncWithMongoDB() {
    const isConnected = await checkMongoDBConnection();
    if (!isConnected) {
        console.log('MongoDB not available, using localStorage only');
        return;
    }
    
    try {
        // Sync users
        const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
        for (const user of localUsers) {
            await fetch(`${CONFIG.API_BASE_URL}/api/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(user)
            }).catch(() => {});
        }
        
        // Sync orders
        const localOrders = JSON.parse(localStorage.getItem('orders') || '[]');
        for (const order of localOrders) {
            const orderData = {
                orderId: order.id.toString(),
                customer: {
                    email: currentUser?.email || 'guest@mrdcakes.com',
                    phone: order.details?.phone || '',
                    address: order.details?.address || '',
                    name: order.details?.name || 'Guest'
                },
                items: order.items,
                total: order.total,
                deliveryDate: order.details?.deliveryDate || '',
                deliveryTime: order.details?.deliveryTime || '',
                status: order.status || 'pending'
            };
            
            await fetch(`${CONFIG.API_BASE_URL}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            }).catch(() => {});
        }
        
        console.log('✅ Data synced with MongoDB');
    } catch (error) {
        console.log('Sync failed, continuing with localStorage');
    }
}

// Authentication
function showLogin() {
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('signup-form').style.display = 'none';
    document.querySelectorAll('.tab-btn')[0].classList.add('active');
    document.querySelectorAll('.tab-btn')[1].classList.remove('active');
}

function showSignup() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('signup-form').style.display = 'block';
    document.querySelectorAll('.tab-btn')[0].classList.remove('active');
    document.querySelectorAll('.tab-btn')[1].classList.add('active');
}

function login() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    
    // Rate limiting (fallback if SecurityUtils not available)
    if (window.SecurityUtils && !SecurityUtils.checkRateLimit('login', 5)) {
        showError('Too many login attempts. Please try again later.');
        return;
    }
    
    // Input validation (fallback if SecurityUtils not available)
    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };
    
    const emailValid = window.SecurityUtils ? SecurityUtils.isValidEmail(email) : isValidEmail(email);
    if (!emailValid) {
        showError('Please enter a valid email address');
        return;
    }
    
    if (!password || password.length < 6) {
        showError('Password must be at least 6 characters long');
        return;
    }
    
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        document.getElementById('auth-modal').classList.remove('active');
        updateLoginIcon();
        showSuccess('Login successful!');
        
        // Clear form
        document.getElementById('login-email').value = '';
        document.getElementById('login-password').value = '';
    } else {
        showError('Invalid email or password');
    }
}

function signup() {
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    
    // Rate limiting (fallback if SecurityUtils not available)
    if (window.SecurityUtils && !SecurityUtils.checkRateLimit('signup', 3)) {
        showError('Too many signup attempts. Please try again later.');
        return;
    }
    
    // Input validation (fallback functions)
    const isValidName = (name) => {
        const nameRegex = /^[a-zA-Z\s]+$/;
        return nameRegex.test(name) && name.trim().length >= 2;
    };
    
    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };
    
    const sanitizeInput = (input) => {
        if (typeof input !== 'string') return input;
        return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    };
    
    const nameValid = window.SecurityUtils ? SecurityUtils.isValidName(name) : isValidName(name);
    if (!nameValid) {
        showError('Name must be at least 2 characters and contain only letters and spaces');
        return;
    }
    
    const emailValid = window.SecurityUtils ? SecurityUtils.isValidEmail(email) : isValidEmail(email);
    if (!emailValid) {
        showError('Please enter a valid email address');
        return;
    }
    
    if (!password || password.length < 6) {
        showError('Password must be at least 6 characters long');
        return;
    }
    
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        showError('Password must contain at least one lowercase letter, one uppercase letter, and one number');
        return;
    }
    
    if (users.find(u => u.email === email)) {
        showError('Email already exists');
        return;
    }
    
    const sanitizedName = window.SecurityUtils ? SecurityUtils.sanitizeInput(name) : sanitizeInput(name);
    const newUser = { name: sanitizedName, email, password };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    currentUser = newUser;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    document.getElementById('auth-modal').classList.remove('active');
    updateLoginIcon();
    showSuccess('Account created successfully!');
    
    // Clear form
    document.getElementById('signup-name').value = '';
    document.getElementById('signup-email').value = '';
    document.getElementById('signup-password').value = '';
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateLoginIcon();
    showSuccess('Logged out successfully!');
}

function updateLoginIcon() {
    const loginIcon = document.querySelector('.login-icon i');
    const receiptIcon = document.querySelector('.receipt-icon');
    const trackingIcon = document.querySelector('.tracking-icon');
    const adminIcon = document.querySelector('.admin-icon');
    
    if (currentUser) {
        loginIcon.className = 'fa-solid fa-user-check';
        loginIcon.style.color = 'var(--main-color)';
        receiptIcon.style.display = 'block';
        trackingIcon.style.display = 'block';
        adminIcon.style.display = currentUser.email === 'admin@mrdcakes.com' ? 'block' : 'none';
    } else {
        loginIcon.className = 'fa-solid fa-user';
        loginIcon.style.color = '';
        receiptIcon.style.display = 'none';
        trackingIcon.style.display = 'none';
        adminIcon.style.display = 'none';
    }
}

// Search
function performSearch() {
    const query = document.getElementById('search-box').value.toLowerCase().trim();
    
    if (query.length === 0) {
        document.querySelectorAll('.cake-card, .cheese-card').forEach(card => {
            card.style.display = 'block';
        });
        return;
    }
    
    document.querySelectorAll('.cake-card, .cheese-card').forEach(card => {
        const productName = card.querySelector('h3').textContent.toLowerCase();
        card.style.display = productName.includes(query) ? 'block' : 'none';
    });
}





// Initialize
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Handle any undefined cake references
        window.cake2 = null;
        
        // Try to sync with MongoDB in background
        syncWithMongoDB();
        
        setTimeout(() => hideLoading(), 500);
    updateFavoriteIcons();
    updateReceiptDisplay();
    updateTrackingDisplay();
    
    // Receipt toggle
    document.querySelector('.receipt-icon').addEventListener('click', () => {
        if (!currentUser) {
            showError('Please login to view receipts');
            document.getElementById('auth-modal').classList.add('active');
            return;
        }
        document.querySelector('.receipt-container').classList.toggle('active');
        document.querySelector('.cart-items-container').classList.remove('active');
        document.querySelector('.tracking-container').classList.remove('active');
        document.querySelector('.search-form').classList.remove('active');
        document.querySelector('.navbar').classList.remove('active');
    });
    
    // Tracking toggle
    document.querySelector('.tracking-icon').addEventListener('click', () => {
        if (!currentUser) {
            showError('Please login to track orders');
            document.getElementById('auth-modal').classList.add('active');
            return;
        }
        document.querySelector('.tracking-container').classList.toggle('active');
        document.querySelector('.cart-items-container').classList.remove('active');
        document.querySelector('.receipt-container').classList.remove('active');
        document.querySelector('.search-form').classList.remove('active');
        document.querySelector('.navbar').classList.remove('active');
        updateTrackingDisplay();
    });
    
    document.querySelector('.close-tracking').addEventListener('click', () => {
        document.querySelector('.tracking-container').classList.remove('active');
    });
    
    // Admin panel access
    document.querySelector('.admin-icon').addEventListener('click', () => {
        if (currentUser && currentUser.email === 'admin@mrdcakes.com') {
            window.location.href = 'admin.html';
        }
    });
    

    
    // Click outside to close panels
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.header') && !e.target.closest('.customization-modal')) {
            document.querySelector('.cart-items-container').classList.remove('active');
            document.querySelector('.receipt-container').classList.remove('active');
            document.querySelector('.tracking-container').classList.remove('active');
            document.querySelector('.search-form').classList.remove('active');
            document.querySelector('.navbar').classList.remove('active');
        }
        

    });
    
    // Authentication
    document.querySelector('.login-icon').addEventListener('click', () => {
        if (currentUser) {
            logout();
        } else {
            document.getElementById('auth-modal').classList.add('active');
        }
    });
    
    document.querySelector('.close-auth').addEventListener('click', () => {
        document.getElementById('auth-modal').classList.remove('active');
    });
    
    // Search functionality
    const searchBox = document.getElementById('search-box');
    if (searchBox) {
        searchBox.addEventListener('input', performSearch);
        searchBox.addEventListener('keyup', performSearch);
    }
    
    const searchLabel = document.querySelector('.search-form label');
    if (searchLabel) {
        searchLabel.addEventListener('click', performSearch);
    }
    
    updateLoginIcon();
    
    // Set minimum delivery date to today
    const today = new Date().toISOString().split('T')[0];
    const deliveryDateInput = document.getElementById('delivery-date');
    if (deliveryDateInput) {
        deliveryDateInput.setAttribute('min', today);
    }
    
    // Listen for storage changes from admin panel
    window.addEventListener('storage', function(e) {
        if (e.key === 'orders') {
            orders = JSON.parse(localStorage.getItem('orders') || '[]');
            updateTrackingDisplay();
            updateReceiptDisplay();
        }
    });
    
    // Auto-refresh tracking every 2 seconds
    setInterval(() => {
        try {
            updateTrackingDisplay();
            updateReceiptDisplay();
        } catch (error) {
            console.error('Auto-refresh error:', error);
        }
    }, 2000);
    
    // Clean up delivered orders every hour
    setInterval(() => {
        const now = Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        
        let allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
        const initialCount = allOrders.length;
        
        allOrders = allOrders.filter(order => {
            if (order.status === 'delivered') {
                const deliveredTime = order.deliveredAt || order.placedAt || 0;
                return (now - deliveredTime) < twentyFourHours;
            }
            return true;
        });
        
        if (initialCount > allOrders.length) {
            localStorage.setItem('orders', JSON.stringify(allOrders));
            orders = allOrders;
            updateTrackingDisplay();
            updateReceiptDisplay();
        }
    }, 60 * 60 * 1000); // 1 hour
    } catch (error) {
        console.error('Initialization error:', error);
        showError('Failed to initialize application');
    }
});