const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const token = req.cookies.token || req.headers['authorization'];
    if (!token) {
        return res.status(403).json({ error: 'No token provided, authorization denied' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Invalid token, authorization denied' });
        }

        // If the token is valid, proceed with the request
        req.user = decoded;
        next();
    });
}

module.exports = verifyToken;
