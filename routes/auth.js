// File: routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { saveUser, userExists, getUserByUsername, saveAdmin, adminExists, getAdminByUsername } = require('../persist');
const verifyToken = require('../middleware/authMiddleware');

// User registration route
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        if (await userExists(username)) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await saveUser(username, hashedPassword);

        console.log(`User registered: ${username}`);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// User login route
router.post('/login', async (req, res) => {
    try {
        const { username, password, rememberMe } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const user = await getUserByUsername(username);
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, {
            expiresIn: rememberMe ? '10d' : '30m'
        });

        res.cookie('token', token, {
            httpOnly: true,
            secure: true, // Always use HTTPS
            sameSite: 'strict',
            maxAge: rememberMe ? 10 * 24 * 60 * 60 * 1000 : 30 * 60 * 1000,
        });

        console.log(`User logged in: ${username}, Token: ${token}`);
        res.json({ message: 'Login successful', token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// User logout route
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    console.log('User logged out');
    res.json({ message: 'Logout successful' });
});

// Authentication check route
router.get('/check', verifyToken, (req, res) => {
    console.log(`Authenticated user: ${req.username}`);
    res.json({ isAuthenticated: true, username: req.username });
});

// Admin registration route
// Add admin route
router.post('/admin/add', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    try {
        // Check if admin already exists
        if (await adminExists(username)) {
            return res.status(400).json({ message: 'Admin already exists.' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save the admin
        await saveAdmin(username, hashedPassword);

        res.status(201).json({ message: 'Admin added successfully.' });
    } catch (error) {
        console.error('Admin addition error:', error);
        res.status(500).json({ message: 'An error occurred while adding the admin.' });
    }
});

// Admin login route
router.post('/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const admin = await getAdminByUsername(username);
        if (!admin) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const token = jwt.sign({ username: admin.username, isAdmin: true }, process.env.JWT_SECRET, {
            expiresIn: '1h'
        });

        res.cookie('adminToken', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 60 * 60 * 1000, // 1 hour
        });

        console.log(`Admin logged in: ${username}`);
        res.json({ message: 'Admin login successful', token });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
