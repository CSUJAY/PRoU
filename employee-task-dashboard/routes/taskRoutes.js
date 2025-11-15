// routes/taskRoutes.js

const express = require('express');
const { pool } = require('../db');
const protect = require('../middleware/auth');

const router = express.Router();

// --- 1. CREATE Task (POST) ---
router.post('/', protect, async (req, res) => {
    // Note: Assigned Employee ID is required to link the task
    // ASSUMING priority is also sent in the body for the metrics to work (Low, Medium, High)
    const { title, description, status, due_date, employee_id, priority } = req.body; 
    const user_id = req.userId;

    if (!title || !employee_id) {
        return res.status(400).json({ message: 'Title and Assigned Employee are required.' });
    }
    
    // Default status/priority if not provided
    const taskStatus = status || 'Pending';
    const taskPriority = priority || 'Medium'; // Default to Medium 
    
    try {
        // NOTE: The SQL insert assumes you have a 'priority' column in your Tasks table
        const [result] = await pool.query(
            'INSERT INTO Tasks (user_id, employee_id, title, description, status, due_date, priority) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [user_id, employee_id, title, description, taskStatus, due_date, taskPriority]
        );
        
        res.status(201).json({ 
            task_id: result.insertId, 
            title, 
            description, 
            status: taskStatus, 
            due_date, 
            employee_id,
            priority: taskPriority
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error creating task' });
    }
});

// --- 2. READ All Tasks (GET) ---
router.get('/', protect, async (req, res) => {
    const user_id = req.userId;

    try {
        // Fetch tasks and join with employee name
        const [tasks] = await pool.query(
            `SELECT 
                t.task_id, t.title, t.description, t.status, t.due_date, t.employee_id, t.priority,
                e.name AS employee_name, e.role AS employee_role 
             FROM Tasks t
             LEFT JOIN Employees e ON t.employee_id = e.employee_id
             WHERE t.user_id = ? 
             ORDER BY t.due_date ASC`,
            [user_id]
        );
        
        res.status(200).json(tasks);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error fetching tasks' });
    }
});

// --- 3. UPDATE Task (PUT) ---
router.put('/:id', protect, async (req, res) => {
    const { id } = req.params;
    // NOTE: Added priority to the update destructured body
    const { title, description, status, due_date, employee_id, priority } = req.body; 
    const user_id = req.userId;

    // Added priority to the update query
    const [result] = await pool.query(
        'UPDATE Tasks SET title = ?, description = ?, status = ?, due_date = ?, employee_id = ?, priority = ? WHERE task_id = ? AND user_id = ?',
        [title, description, status, due_date, employee_id, priority, id, user_id]
    );

    if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Task not found or unauthorized' });
    }

    res.status(200).json({ message: 'Task updated successfully' });
});

// --- 4. DELETE Task (DELETE) ---
router.delete('/:id', protect, async (req, res) => {
    const { id } = req.params;
    const user_id = req.userId;

    const [result] = await pool.query(
        'DELETE FROM Tasks WHERE task_id = ? AND user_id = ?',
        [id, user_id]
    );

    if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Task not found or unauthorized' });
    }
    
    res.status(200).json({ message: 'Task deleted successfully' });
});


// --- 5. GET Task Metrics (Data Visualization Bonus - CORRECTED) ---
router.get('/metrics', protect, async (req, res) => {
    const user_id = req.userId;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD for overdue check

    try {
        // Query 1: Get counts by Status and Priority
        const [statusPriorityCounts] = await pool.query(
            `SELECT status, priority, COUNT(*) as count
             FROM Tasks 
             WHERE user_id = ? 
             GROUP BY status, priority`,
            [user_id]
        );
        
        // Query 2: Get Total, Total Done, and Overdue Count
        const [totalOverdueCounts] = await pool.query(
            `SELECT 
                COUNT(*) as total_tasks,
                SUM(CASE WHEN status = 'Complete' THEN 1 ELSE 0 END) as total_done,
                SUM(CASE WHEN due_date < ? AND status != 'Complete' THEN 1 ELSE 0 END) as total_overdue
             FROM Tasks 
             WHERE user_id = ?`,
            [today, user_id]
        );
        
        // --- Assemble the final metrics object ---
        
        // 1. Initialize all metrics to zero
        const metrics = {
            'Low': 0,
            'Medium': 0,
            'High': 0,
            'Total': totalOverdueCounts[0].total_tasks,
            'Done': totalOverdueCounts[0].total_done,
            'Overdue': totalOverdueCounts[0].total_overdue,
            'Pending': 0,
            'In Progress': 0,
            'Complete': 0,
        };
        
        // 2. Populate Status and Priority from the first query results
        statusPriorityCounts.forEach(row => {
            // Populate Status counts for chart
            if (row.status === 'Pending') metrics['Pending'] += row.count;
            if (row.status === 'In Progress') metrics['In Progress'] += row.count;
            if (row.status === 'Complete') metrics['Complete'] += row.count;

            // Populate Priority counts for cards
            if (row.priority) {
                metrics[row.priority] += row.count;
            }
        });
        
        res.status(200).json(metrics);

    } catch (err) {
        console.error('Metrics API Error:', err.message);
        res.status(500).json({ message: 'Server error fetching task metrics' });
    }
});

module.exports = router;