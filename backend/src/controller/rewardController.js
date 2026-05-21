const db = require('../config/db');
const { createNotification } = require('./notificationController');

const getRewards = async (req, res) => {
    let query;
    let params;

    if (req.user.role === 'employee') {
        query = `
            SELECT r.*, u.name as sender_name 
            FROM rewards r 
            LEFT JOIN users u ON r.sender_id = u.id 
            WHERE r.user_id = $1 
            ORDER BY r.created_at DESC
        `;
        params = [req.user.id];
    } else {
        query = `
            SELECT r.*, u.name as employee_name, u.email as employee_email, s.name as sender_name 
            FROM rewards r 
            JOIN users u ON r.user_id = u.id 
            LEFT JOIN users s ON r.sender_id = s.id 
            WHERE u.company_id = $1 
            ORDER BY r.created_at DESC
        `;
        params = [req.user.company_id];
    }

    const result = await db.query(query, params);
    res.json(result.rows);
};

const sendReward = async (req, res) => {
    const { user_id, reward_type, points, message } = req.body;
    const result = await db.query(
        `INSERT INTO rewards 
        (user_id, company_id, sender_id, reward_type, points, message) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING *`,
        [user_id, req.user.company_id, req.user.id, reward_type, points || 0, message]
    );

    await createNotification(
        user_id,
        'New Reward Received! 🎉',
        `You have been awarded ${points} points for "${reward_type}". Message: ${message}`
    );

    res.status(201).json(result.rows[0]);
};

const deleteReward = async (req, res) => {
    const { id } = req.params;
    await db.query('DELETE FROM rewards WHERE id = $1 AND company_id = $2', [id, req.user.company_id]);
    res.json({ message: 'Reward record deleted' });
};

module.exports = { getRewards, sendReward, deleteReward };
