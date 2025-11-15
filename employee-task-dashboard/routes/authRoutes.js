// routes/authRoutes.js

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db'); // Import the database pool

const router = express.Router();

// Helper function to generate JWT
const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: '30d', // Token expires in 30 days
    });
};

// @route   POST /api/register
// @desc    Register a new user
router.post('/register', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    try {
        // 1. Check if user already exists
        const [rows] = await pool.query('SELECT user_id FROM Users WHERE email = ?', [email]);
        
        if (rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // 2. Hash the password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // 3. Save the new user to the database
        const [result] = await pool.query(
            'INSERT INTO Users (email, password_hash) VALUES (?, ?)',
            [email, password_hash]
        );

        const userId = result.insertId;

        // 4. Send back a success response with a JWT
        res.status(201).json({
            user_id: userId,
            email: email,
            token: generateToken(userId),
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// @route   POST /api/login
// @desc    Authenticate a user and get token
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Find the user by email
        const [rows] = await pool.query('SELECT user_id, password_hash FROM Users WHERE email = ?', [email]);
        const user = rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // 2. Compare the provided password with the stored hash
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (isMatch) {
            // 3. Passwords match, send back JWT
            res.json({
                user_id: user.user_id,
                email: email,
                token: generateToken(user.user_id),
            });
        } else {
            // 4. Passwords do not match
            res.status(401).json({ message: 'Invalid credentials' });
        }

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error during login' });
    }
});

module.exports = router;