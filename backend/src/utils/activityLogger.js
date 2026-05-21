const db = require('../config/db');

const logActivity = async (companyId, userId, action, status = 'Info', color = '#6366f1') => {
    try {
        await db.query(
            'INSERT INTO activities (company_id, user_id, action, status, color) VALUES ($1, $2, $3, $4, $5)',
            [companyId, userId, action, status, color]
        );
    } catch (error) {
        console.error('Failed to log activity:', error);
    }
};

module.exports = { logActivity };
