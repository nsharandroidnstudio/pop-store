// This file (persist.js) is responsible for handling data persistence operations related to users and products. It ensures that directories and files exist, and provides functions to save, retrieve, and delete user and product data from products.json and users.json files.
// File: persist.js

// Import necessary modules
const fs = require('fs').promises; // File system promises API for async operations
const path = require('path'); // Module for handling file paths
const Product = require('./models/Product'); // Import Product model for MongoDB operations

// Define paths for data storage
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');

// Ensure that a directory exists; create it if it does not
async function ensureDirectoryExists(directory) {
    try {
        await fs.access(directory); // Check if directory exists
    } catch (error) {
        if (error.code === 'ENOENT') {
            // Directory does not exist, create it
            await fs.mkdir(directory, { recursive: true });
        } else {
            throw error; // Throw error if it's not about the directory not existing
        }
    }
}

// Ensure that a file exists; create it if it does not
async function ensureFileExists(filePath) {
    try {
        await fs.access(filePath); // Check if file exists
    } catch (error) {
        if (error.code === 'ENOENT') {
            // File does not exist, create it with an empty array
            await fs.writeFile(filePath, '[]');
        } else {
            throw error; // Throw error if it's not about the file not existing
        }
    }

    // Initialize the file with an empty array if it's empty
    const data = await fs.readFile(filePath, 'utf8');
    if (!data.trim()) {
        await fs.writeFile(filePath, '[]');
    }
}
// User-related functions
// Save a new user to the users.json file
async function saveUser(username, hashedPassword) {
    await ensureDirectoryExists(DATA_DIR);
    await ensureFileExists(USERS_FILE);

    let users = [];
    try {
        const data = await fs.readFile(USERS_FILE, 'utf8');
        users = JSON.parse(data); // Parse existing users
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }

    users.push({ username, password: hashedPassword }); // Add new user
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2)); // Save updated users list
}
// Check if a user already exists in the users.json file
async function userExists(username) {
    await ensureDirectoryExists(DATA_DIR);
    await ensureFileExists(USERS_FILE);

    try {
        const data = await fs.readFile(USERS_FILE, 'utf8');
        const users = JSON.parse(data);
        return users.some(user => user.username === username); // Check if username exists
    } catch (error) {
        if (error.code === 'ENOENT') {
            return false; // Return false if file does not exist
        }
        throw error;
    }
}
// Get a user by username from the users.json file
async function getUserByUsername(username) {
    await ensureDirectoryExists(DATA_DIR);
    await ensureFileExists(USERS_FILE);

    try {
        const data = await fs.readFile(USERS_FILE, 'utf8');
        const users = JSON.parse(data);
        return users.find(user => user.username === username); // Find user by username
    } catch (error) {
        if (error.code === 'ENOENT') {
            return null; // Return null if file does not exist
        }
        throw error;
    }
}

// Product-related functions
// Save a new product to both MongoDB and products.json
async function saveProduct(title, description, price, image) {
    await ensureDirectoryExists(DATA_DIR);
    await ensureFileExists(PRODUCTS_FILE);

    let products = [];
    try {
        const data = await fs.readFile(PRODUCTS_FILE, 'utf8');
        products = JSON.parse(data); // Parse existing products
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }

    products.push({ title, description, price, image }); // Add new product
    await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2)); // Save updated products list
}

// Get all products from the products.json file
async function getProducts() {
    await ensureDirectoryExists(DATA_DIR);
    await ensureFileExists(PRODUCTS_FILE);

    try {
        const data = await fs.readFile(PRODUCTS_FILE, 'utf8');
        return JSON.parse(data); // Return products list
    } catch (error) {
        if (error.code === 'ENOENT') {
            return []; // Return empty array if file does not exist
        }
        throw error;
    }
}
// Remove a product by title from both MongoDB and products.json
async function removeProduct(title) {
    await ensureDirectoryExists(DATA_DIR);
    await ensureFileExists(PRODUCTS_FILE);

    let products = [];
    try {
        const data = await fs.readFile(PRODUCTS_FILE, 'utf8');
        products = JSON.parse(data); // Parse existing products
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }

    // Filter out the product to be removed
    const updatedProducts = products.filter(product => product.title !== title);
    await fs.writeFile(PRODUCTS_FILE, JSON.stringify(updatedProducts, null, 2)); // Save updated products list

    return products.length !== updatedProducts.length; // Return true if a product was removed
}
// Export functions for use in other modules
module.exports = { saveUser, userExists, getUserByUsername, saveProduct, getProducts, removeProduct };
