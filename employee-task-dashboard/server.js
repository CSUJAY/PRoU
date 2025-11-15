// server.js

// Load environment variables from .env file
require('dotenv').config(); 

const express = require('express');
const cors = require('cors');

// Import the pool from the dedicated db.js file (FIX for circular dependency)
const { pool } = require('./db'); 

const app = express();
const port = process.env.PORT || 3000;

// --- Middleware Setup ---
app.use(cors()); // Allow cross-origin requests from the frontend
app.use(express.json()); // Allow the server to parse JSON bodies
app.use(express.static('public'));
// NOTE: All DB Connection logic is now in db.js

// --- Import Routes ---
// Import the authentication routes
const authRoutes = require('./routes/authRoutes');
// Import the employee routes (Goal C)
const employeeRoutes = require('./routes/employeeRoutes');
// Import the authentication middleware
const protect = require('./middleware/auth'); 
const taskRoutes = require('./routes/taskRoutes'); // <--- ADD THIS



// --- Use Routes ---

// Authentication Routes: /api/register and /api/login
app.use('/api', authRoutes); 

// Employee Routes: All routes start with /api/employees
app.use('/api/employees', employeeRoutes);
app.use('/api/tasks', taskRoutes); // <--- ADD THIS


// --- Basic Route (Optional, for testing the server is alive) ---
app.get('/', (req, res) => {
    res.send('Employee & Task Management API is running!');
});

// --- Example of a Protected Route (Test) ---
app.get('/api/protected-test', protect, (req, res) => {
    res.json({ 
        message: 'This is a protected route!', 
        userId: req.userId 
    });
});


// --- Start Server ---
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});