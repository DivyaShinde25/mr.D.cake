require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// MongoDB Atlas Connection
// Replace YOUR_CONNECTION_STRING with your actual Atlas connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/mrdcakes?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('✅ Connected to MongoDB');
});

// User Schema
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    phone: String,
    address: String,
    createdAt: { type: Date, default: Date.now }
});

// Order Schema
const orderSchema = new mongoose.Schema({
    orderId: String,
    customer: {
        email: String,
        phone: String,
        address: String,
        name: String
    },
    items: [{
        name: String,
        price: Number,
        quantity: Number,
        customization: String,
        flavour: String,
        weight: String,
        instructions: String
    }],
    total: Number,
    deliveryDate: String,
    deliveryTime: String,
    status: { type: String, default: 'pending' },
    orderDate: { type: Date, default: Date.now },
    estimatedTime: String
});

const User = mongoose.model('User', userSchema);
const Order = mongoose.model('Order', orderSchema);

// API Routes

// Get all users
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find({});
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create user
app.post('/api/users', async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all orders
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await Order.find({}).sort({ orderDate: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create order
app.post('/api/orders', async (req, res) => {
    try {
        const order = new Order(req.body);
        await order.save();
        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update order status
app.put('/api/orders/:id', async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(
            req.params.id, 
            { status: req.body.status },
            { new: true }
        );
        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
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
    console.log('📊 MongoDB: Storing orders and users in database');
    console.log('Press Ctrl+C to stop the server');
});