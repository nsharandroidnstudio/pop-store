// File: middleware/authMiddleware.js

const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        return res.status(403).json({ isAuthenticated: false, message: 'No token provided.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(500).json({ isAuthenticated: false, message: 'Failed to authenticate token.' });
        }

        // If the token is valid, proceed with the request
        req.username = decoded.username;
        next();
    });
}

module.exports = verifyToken;
