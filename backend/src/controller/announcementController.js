const db = require('../config/db');
const { logActivity } = require('../utils/activityLogger');

const getAnnouncements = async (req, res) => {
    const result = await db.query(
        'SELECT a.*, u.name as author FROM announcements a LEFT JOIN users u ON a.created_by = u.id WHERE a.company_id = $1 ORDER BY a.created_at DESC LIMIT 5',
        [req.user.company_id]
    );
    res.json(result.rows);
};

const createAnnouncement = async (req, res) => {
    const { title, description, tag } = req.body;
    const result = await db.query(
        'INSERT INTO announcements (company_id, title, description, tag, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [req.user.company_id, title, description, tag || 'Update', req.user.id]
    );
    await logActivity(req.user.company_id, req.user.id, `published a new notice: ${title}`, 'Company Update', '#6366f1');

    res.status(201).json(result.rows[0]);
};

const deleteAnnouncement = async (req, res) => {
    const { id } = req.params;
    await db.query('DELETE FROM announcements WHERE id = $1 AND company_id = $2', [id, req.user.company_id]);
    res.json({ message: 'Announcement deleted' });
};

const markAsRead = async (req, res) => {
    const { id } = req.params;
    await db.query(`
        INSERT INTO announcement_reads (announcement_id, user_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
    `, [id, req.user.id]);
    res.json({ success: true });
};

module.exports = { getAnnouncements, createAnnouncement, deleteAnnouncement, markAsRead };
