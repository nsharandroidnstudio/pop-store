require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const Product = require('./models/Product');  // Ensure Product model is required here

const app = express();

// Database connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',  // Replace with your frontend URL if different
  credentials: true
}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'public/images'));  // Path to store uploaded images
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));  // Use original file extension
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

// Serve the register page
app.get('/register', (req, res) => {
    console.log('Serving register.html');
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Serve the login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Serve the store page
app.get('/store', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'store.html'));
});

// Fetch all products
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();  // Fetch products from the database
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Search products
app.get('/api/products/search', async (req, res) => {
    const query = req.query.query.toLowerCase();
    try {
        const products = await Product.find();
        const results = products.filter(p =>
            p.title.toLowerCase().includes(query) || p.description.toLowerCase().includes(query)
        );
        res.json(results);
    } catch (error) {
        console.error('Error searching products:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add product to cart
app.post('/api/cart', (req, res) => {
    const { productId } = req.body;
    console.log(`Product ${productId} added to cart.`);
    res.json({ success: true });
});

// Image upload endpoint
app.post('/admin/products/upload', upload.single('image'), (req, res) => {
    res.json({ message: 'Image uploaded successfully', imagePath: `/images/${req.file.filename}` });
});

// Add a new product
app.post('/admin/products', async (req, res) => {
    try {
        const { title, description, price, imagePath } = req.body;
        const product = new Product({ title, description, picture: imagePath, price });
        await product.save();
        res.status(201).json({ message: 'Product added successfully' });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).send('Something broke!');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
