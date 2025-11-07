const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// Simple in-memory storage (for demo purposes)
let users = [];
let orders = [];

// API Routes (simple versions without MongoDB)
app.get('/api/users', (req, res) => {
    res.json(users);
});

app.post('/api/users', (req, res) => {
    users.push(req.body);
    res.json(req.body);
});

app.get('/api/orders', (req, res) => {
    res.json(orders);
});

app.post('/api/orders', (req, res) => {
    orders.push(req.body);
    res.json(req.body);
});

app.put('/api/orders/:id', (req, res) => {
    const order = orders.find(o => o._id === req.params.id || o.orderId === req.params.id);
    if (order) {
        order.status = req.body.status;
        res.json(order);
    } else {
        res.status(404).json({ error: 'Order not found' });
    }
});

// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🍰 Mr D Cakes website running at http://localhost:${PORT}`);
    console.log(`🔧 Admin Panel: http://localhost:${PORT}/admin.html`);
    console.log(`❤️ Favorites: http://localhost:${PORT}/favorites.html`);
    console.log('📊 Simple Mode: Using localStorage + basic API');
    console.log('Press Ctrl+C to stop the server');
});