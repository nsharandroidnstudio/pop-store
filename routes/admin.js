const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const bcrypt = require('bcrypt');
const router = express.Router();

// Load environment variables
require('dotenv').config();

// Admin login
router.post('/login', async (req, res) => {
    const { username, password, rememberMe } = req.body;

    try {
        const data = await fs.readFile('data/admin.json', 'utf8');
        const admins = JSON.parse(data);
        const admin = admins.find(admin => admin.username === username);

        if (!admin) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ username: admin.username, role: 'admin' }, process.env.JWT_SECRET, {
            expiresIn: rememberMe ? '10d' : '30m'
        });

        res.json({ token });
    } catch (err) {
        console.error('Error during admin login:', err);
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});

module.exports = router;
