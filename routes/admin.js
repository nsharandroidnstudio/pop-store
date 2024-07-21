// File: routes/products.js
// This file defines an Express router for handling product-related API endpoints. It includes:
// Image Upload Configuration: Using multer to handle file uploads and save them to the public/images/ directory.
// Add Product: Endpoint to add a product with an image, saving data to both MongoDB and a local JSON file.
// Remove Product: Endpoint to remove a product by title, deleting it from MongoDB, the local JSON file, and the server's file system.
// Get Products: Endpoint to retrieve all products from MongoDB.
// Import necessary modules
const express = require('express');
const router = express.Router();
const multer = require('multer'); // Middleware for handling file uploads
const path = require('path');
const fs = require('fs'); // File system module for file operations
const Product = require('../models/Product'); // Import Product model for MongoDB operations
const { saveProduct, removeProduct, getProducts } = require('../persist'); // Import functions for file-based data persistence

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images/'); // Define the destination folder for uploaded images
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname); // Get the file extension
        cb(null, Date.now() + ext); // Create a unique file name using the current timestamp
    }
});
const upload = multer({ storage: storage }); // Initialize multer with the defined storage configuration

// Route to add a new product with an image upload
router.post('/products', upload.single('image'), async (req, res) => {
    try {
        const { title, description, price } = req.body; // Extract product details from request body
        const image = req.file ? req.file.filename : ''; // Get the filename of the uploaded image, if any

        // Save product to MongoDB
        const product = new Product({ title, description, price, image });
        await product.save();

        // Save product to products.json file
        await saveProduct(title, description, price, image);

        res.status(201).json({ message: 'Product added successfully' }); // Send success response
    } catch (error) {
        console.error('Error adding product:', error); // Log error details
        res.status(500).json({ error: 'Internal server error' }); // Send error response
    }
});

// Route to remove a product by title
router.delete('/products', async (req, res) => {
    try {
        const { title } = req.query; // Get the product title from query parameters

        if (!title) {
            return res.status(400).json({ message: 'Product title is required' }); // Validate request
        }

        // Remove product from MongoDB
        const product = await Product.findOne({ title });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' }); // Handle case where product does not exist
        }
        await Product.deleteOne({ title });

        // Remove product from products.json file
        const productRemoved = await removeProduct(title);
        if (!productRemoved) {
            console.error('Error removing product from JSON file'); // Log if there was an issue removing from the JSON file
        }

        // Delete the image file from the server, if it exists
        if (product.image) {
            const imagePath = path.join('public/images', product.image); // Construct the path to the image file
            fs.unlink(imagePath, (err) => {
                if (err) {
                    console.error('Error deleting image:', err); // Log error if image deletion fails
                }
            });
        }

        res.status(200).json({ message: 'Product removed successfully' }); // Send success response
    } catch (error) {
        console.error('Error removing product:', error); // Log error details
        res.status(500).json({ error: 'Internal server error' }); // Send error response
    }
});

// Route to get all products
router.get('/products', async (req, res) => {
    try {
        const products = await Product.find(); // Retrieve all products from MongoDB
        res.status(200).json(products); // Send products as response
    } catch (error) {
        console.error('Error fetching products:', error); // Log error details
        res.status(500).json({ error: 'Internal server error' }); // Send error response
    }
});
module.exports = router; // Export router for use in the main application
