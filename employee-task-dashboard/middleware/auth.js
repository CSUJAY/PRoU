// middleware/auth.js

const jwt = require('jsonwebtoken');

// Middleware function to protect routes
const protect = (req, res, next) => {
    // 1. Check for the token in the headers
    let token;
    
    // Header format: Authorization: Bearer <token>
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // 2. Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 3. Attach the user_id from the token payload to the request
            // We can now access the logged-in user's ID using req.userId
            req.userId = decoded.userId; 

            next(); // Proceed to the next middleware or the route handler

        } catch (error) {
            console.error('Token verification error:', error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    // 4. Handle case where no token is provided
    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = protect;