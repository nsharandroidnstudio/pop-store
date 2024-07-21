// File: routes/auth.js

// Import necessary modules
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt'); // For hashing and comparing passwords
const jwt = require('jsonwebtoken'); // For generating and verifying JWT tokens
const { saveUser, userExists, getUserByUsername } = require('../persist'); // Import user-related persistence functions

// Registration route
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body; // Extract username and password from request body

        // Basic validation
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' }); // Check if username and password are provided
        }

        // Check if user already exists
        if (await userExists(username)) {
            return res.status(400).json({ error: 'Username already exists' }); // Return error if username is already taken
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10); // Hash the password with a salt round of 10

        // Save the user
        await saveUser(username, hashedPassword); // Save the new user to the data store

        res.status(201).json({ message: 'User registered successfully' }); // Return success response
    } catch (error) {
        console.error('Registration error:', error); // Log error details
        res.status(500).json({ error: 'Internal server error' }); // Return error response
    }
});

// Login route
router.post('/login', async (req, res) => {
    try {
        const { username, password, rememberMe } = req.body; // Extract username, password, and rememberMe from request body

        // Basic validation
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' }); // Check if username and password are provided
        }

        // Get user from database
        const user = await getUserByUsername(username); // Retrieve user data by username
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' }); // Return error if user not found
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password); // Compare provided password with hashed password
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid username or password' }); // Return error if password is incorrect
        }

        // Create JWT token
        const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, {
            expiresIn: rememberMe ? '10d' : '30m' // Set token expiration based on rememberMe flag
        });

        // Set cookie
        res.cookie('token', token, {
            httpOnly: true, // Prevent client-side access to the cookie
            secure: process.env.NODE_ENV === 'production', // Set cookie as secure if in production
            sameSite: 'strict', // Prevent CSRF attacks by ensuring cookie is sent with same-site requests
            maxAge: rememberMe ? 10 * 24 * 60 * 60 * 1000 : 30 * 60 * 1000 // Set cookie expiration time based on rememberMe flag
        });

        res.json({ message: 'Login successful' }); // Return success response
    } catch (error) {
        console.error('Login error:', error); // Log error details
        res.status(500).json({ error: 'Internal server error' }); // Return error response
    }
});

module.exports = router; // Export router for use in the main application
