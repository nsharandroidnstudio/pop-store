require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs').promises;
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const Product = require('./models/Product');
const { getProducts} = require('./persist');
const app = express();
const verifyToken = require('./middleware/auth');

// Database connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'public/images'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api', authRoutes);
app.use('/admin', adminRoutes);

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/store', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'store.html'));
});

app.get('/cart', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'cart.html'));
});

// Fetch all products
app.get('/api/products', async (req, res) => {
    try {
        const products = await getProducts();
        console.log('Products fetched successfully:', products.length);
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});


// Search products
app.get('/api/products/search', async (req, res) => {
    const query = req.query.query.toLowerCase();
    try {
        const products = await getProducts();
        const results = products.filter(p =>
            p.title.toLowerCase().includes(query) || p.description.toLowerCase().includes(query)
        );
        res.json(results);
    } catch (error) {
        console.error('Error searching products:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// User-specific carts
const userCarts = new Map();
// Get cart items
app.get('/api/cart/items', verifyToken, (req, res) => {
    const userId = req.username; // Changed from req.user.id to req.username
    const userCart = userCarts.get(userId) || [];
    res.json(userCart);
});

// Add product to cart
app.post('/api/cart', verifyToken, async (req, res) => {
    const userId = req.username;
    const { title } = req.body;
    if (!title) {
        return res.status(400).json({ error: 'Product title is required' });
    }
    
    try {
        const products = await getProducts();
        const product = products.find(p => p.title.toLowerCase() === title.toLowerCase());

        if (product) {
            if (!userCarts.has(userId)) {
                userCarts.set(userId, []);
            }
            userCarts.get(userId).push(product);
            console.log(userCarts)
            res.json({ success: true, message: 'Product added to cart successfully' });
        } else {
            res.status(404).json({ error: 'Product not found' });
        }
    } catch (err) {
        console.error('Error adding product to cart:', err);
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});

app.delete('/api/cart/delete', verifyToken, (req, res) => {
    const userId = req.username; // Changed from req.user.id to req.username
    const { title } = req.body;
    if (!title) {
        return res.status(400).json({ error: 'Product title is required' });
    }

    const userCart = userCarts.get(userId) || [];
    const index = userCart.findIndex(item => item.title.toLowerCase() === title.toLowerCase());
    if (index !== -1) {
        userCart.splice(index, 1);
        res.json({ success: true, message: 'Product deleted from cart successfully' });
    } else {
        res.status(404).json({ error: 'Product not found in cart' });
    }
});


const purchasesRouter = require('./routes/purchases');
app.use('/api/purchase', purchasesRouter);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({ error: 'Something broke!', details: err.message });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));