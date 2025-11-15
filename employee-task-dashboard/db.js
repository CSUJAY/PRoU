// db.js

const mysql = require('mysql2/promise');
require('dotenv').config(); 

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test connection once here for peace of mind
pool.getConnection()
    .then(connection => {
        console.log("Successfully connected to MySQL database from db.js!");
        connection.release();
    })
    .catch(err => {
        console.error("Database connection failed in db.js:", err.stack);
        // Do NOT exit the process here, let server.js handle it
    });

module.exports = { pool }; // Export the pool directly