const db = require('../config/db');

const createNotification = async (userId, title, message) => {
    await db.query(
        'INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)',
        [userId, title, message]
    );
};

const getNotifications = async (req, res) => {
    const result = await db.query(
        'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
        [req.user.id]
    );
    res.json(result.rows);
};

const markAsRead = async (req, res) => {
    const { id } = req.params;
    await db.query(
        'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
        [id, req.user.id]
    );
    res.json({ message: 'Notification marked as read' });
};

const markAllAsRead = async (req, res) => {
    await db.query(
        'UPDATE notifications SET is_read = TRUE WHERE user_id = $1',
        [req.user.id]
    );
    res.json({ message: 'All notifications marked as read' });
};

const deleteNotification = async (req, res) => {
    const { id } = req.params;
    await db.query('DELETE FROM notifications WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    res.json({ message: 'Notification deleted' });
};

module.exports = {
    createNotification,
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
};
