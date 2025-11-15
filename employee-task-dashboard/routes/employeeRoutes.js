// routes/employeeRoutes.js

const express = require('express');
const { pool } = require('../db'); 
const protect = require('../middleware/auth'); 

const router = express.Router();

// --- 1. CREATE Employee (POST) ---
router.post('/', protect, async (req, res) => {
    const { name, role, department } = req.body;
    const user_id = req.userId; 

    if (!name || !role || !department) {
        return res.status(400).json({ message: 'Please include name, role, and department.' });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO Employees (user_id, name, role, department) VALUES (?, ?, ?, ?)',
            [user_id, name, role, department]
        );
        
        const newEmployee = {
            employee_id: result.insertId,
            name, role, department, user_id
        };

        res.status(201).json(newEmployee);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error creating employee' });
    }
});

// --- 2. READ All Employees (GET) ---
router.get('/', protect, async (req, res) => {
    const user_id = req.userId; 

    try {
        const [employees] = await pool.query(
            'SELECT employee_id, name, role, department FROM Employees WHERE user_id = ? ORDER BY name ASC',
            [user_id]
        );
        
        res.status(200).json(employees);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error fetching employees' });
    }
});

// --- 3. UPDATE Employee (PUT) ---
router.put('/:id', protect, async (req, res) => {
    const { id } = req.params;
    const { name, role, department } = req.body;
    const user_id = req.userId;

    if (!name || !role || !department) {
        return res.status(400).json({ message: 'Please provide all fields for update.' });
    }

    try {
        const [result] = await pool.query(
            'UPDATE Employees SET name = ?, role = ?, department = ? WHERE employee_id = ? AND user_id = ?',
            [name, role, department, id, user_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Employee not found or unauthorized' });
        }

        res.status(200).json({ message: 'Employee updated successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error updating employee' });
    }
});


// --- 4. DELETE Employee (DELETE) ---
// (This is the part you were missing!)
router.delete('/:id', protect, async (req, res) => {
    const { id } = req.params;
    const user_id = req.userId;

    try {
        const [result] = await pool.query(
            'DELETE FROM Employees WHERE employee_id = ? AND user_id = ?',
            [id, user_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Employee not found or unauthorized' });
        }
        
        res.status(200).json({ message: 'Employee deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error deleting employee' });
    }
});

module.exports = router;