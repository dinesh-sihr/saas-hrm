const db = require('../config/db');
const { createNotification } = require('./notificationController');
const { logActivity } = require('../utils/activityLogger');

const getLeaves = async (req, res) => {
    let leaveQuery;
    let queryParams;

    if (req.user.role === 'employee') {
        leaveQuery = 'SELECT * FROM leave_requests WHERE user_id = $1 ORDER BY created_at DESC';
        queryParams = [req.user.id];
    } else {
        leaveQuery = `
            SELECT lr.*, u.name as employee_name, u.email as employee_email 
            FROM leave_requests lr 
            JOIN users u ON lr.user_id = u.id 
            WHERE u.company_id = $1 
            ORDER BY lr.created_at DESC
        `;
        queryParams = [req.user.company_id];
    }

    const leaveRecords = await db.query(leaveQuery, queryParams);
    res.json(leaveRecords.rows);
};

const requestLeave = async (req, res) => {
    const { type, from_date, to_date, reason } = req.body;
    if (new Date(from_date) > new Date(to_date)) {
        return res.status(400).json({ message: 'It looks like your starting date is after your returning date. Please check the dates and try again!' });
    }

    const newLeaveRequest = await db.query(
        'INSERT INTO leave_requests (user_id, type, from_date, to_date, reason, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [req.user.id, type, from_date, to_date, reason, 'pending']
    );

    const managers = await db.query('SELECT id FROM users WHERE company_id = $1 AND role = $2', [req.user.company_id, 'manager']);
    for (const manager of managers.rows) {
        await createNotification(
            manager.id,
            'New Leave Request',
            `${req.user.name || 'An employee'} has requested ${type} from ${new Date(from_date).toLocaleDateString()} to ${new Date(to_date).toLocaleDateString()}.`
        );
    }

    await logActivity(req.user.company_id, req.user.id, `requested ${type} leave`, 'Leave Request', '#a855f7');

    res.status(201).json(newLeaveRequest.rows[0]);
};

const updateLeaveStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (req.user.role === 'employee') {
        return res.status(403).json({ message: 'Only managers have the authority to update leave statuses.' });
    }

    const updatedLeave = await db.query(
        'UPDATE leave_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [status, id]
    );

    if (updatedLeave.rows.length === 0) {
        return res.status(404).json({ message: 'We couldn’t find that leave request in our records.' });
    }
    const leaveData = updatedLeave.rows[0];

    if (status === 'approved') {
        const start = new Date(leaveData.from_date);
        const end = new Date(leaveData.to_date);
        const dayCount = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

        for (let i = 0; i < dayCount; i++) {
            const currentDate = new Date(start);
            currentDate.setDate(start.getDate() + i);
            
            await db.query(`
                INSERT INTO attendance (user_id, created_at, check_in, check_out, status, total_hours)
                VALUES ($1, $2, $2, $2, 'on_leave', 0)
                ON CONFLICT DO NOTHING
            `, [leaveData.user_id, currentDate]);
        }
    }

    await createNotification(
        leaveData.user_id,
        `Leave Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        `Your request for ${leaveData.type} leave has been ${status} by your manager.`
    );

    await logActivity(req.user.company_id, leaveData.user_id, `leave request was ${status}`, 'Leave Update', status === 'approved' ? '#10b981' : '#f43f5e');

    res.json(updatedLeave.rows[0]);
};

const deleteLeaveRequest = async (req, res) => {
    const { id } = req.params;
    const cancelResult = await db.query(
        'DELETE FROM leave_requests WHERE id = $1 AND user_id = $2 AND status = $3',
        [id, req.user.id, 'pending']
    );
    if (cancelResult.rowCount === 0) {
        return res.status(404).json({ message: 'The request couldn’t be found or it may have already been processed.' });
    }
    res.json({ message: 'Your time-off request has been successfully cancelled.' });
};

module.exports = { getLeaves, requestLeave, updateLeaveStatus, deleteLeaveRequest };
