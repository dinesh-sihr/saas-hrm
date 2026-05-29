const db = require('../config/db');

const getDashboardStats = async (req, res) => {
    if (req.user.role === 'employee') {
        const [attendance, leaves, rewards, holidays] = await Promise.all([
            db.query(`
                SELECT SUM(total_hours) as total_hours 
                FROM attendance 
                WHERE user_id = $1 AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
            `, [req.user.id]),
            db.query(`
                SELECT COUNT(*) as taken 
                FROM leave_requests 
                WHERE user_id = $1 AND status = 'approved'
            `, [req.user.id]),
            db.query(`
                SELECT SUM(points) as total_points 
                FROM rewards 
                WHERE user_id = $1
            `, [req.user.id]),
            db.query(`
                SELECT COUNT(*) as count 
                FROM holidays 
                WHERE holiday_date >= CURRENT_DATE
            `)
        ]);

        res.json({
            role: 'employee',
            metrics: [
                { id: 'hours', label: 'Work Hours (Month)', value: attendance.rows[0].total_hours || '0', type: 'hours' },
                { id: 'leaves', label: 'Leaves Taken', value: leaves.rows[0].taken || '0', type: 'count' },
                { id: 'rewards', label: 'Appreciation Points', value: rewards.rows[0].total_points || '0', type: 'points' },
                { id: 'holidays', label: 'Upcoming Holidays', value: holidays.rows[0].count || '0', type: 'count' }
            ]
        });
    } else {
        const [employees, present, leave, pending] = await Promise.all([
            db.query('SELECT COUNT(*) FROM users WHERE company_id = $1', [req.user.company_id]),
            db.query(`
                SELECT COUNT(DISTINCT user_id) FROM attendance a 
                JOIN users u ON a.user_id = u.id 
                WHERE u.company_id = $1 AND a.created_at::date = CURRENT_DATE
            `, [req.user.company_id]),
            db.query(`
                SELECT COUNT(*) FROM leave_requests l 
                JOIN users u ON l.user_id = u.id 
                WHERE u.company_id = $1 AND l.status = 'approved' 
                AND CURRENT_DATE BETWEEN l.from_date AND l.to_date
            `, [req.user.company_id]),
            db.query(`
                SELECT COUNT(*) FROM leave_requests l 
                JOIN users u ON l.user_id = u.id 
                WHERE u.company_id = $1 AND l.status = 'pending'
            `, [req.user.company_id])
        ]);

        res.json({
            role: 'manager',
            metrics: [
                { id: 'employees', label: 'Total Employees', value: employees.rows[0].count, type: 'count' },
                { id: 'present', label: 'Present Today', value: present.rows[0].count, type: 'count' },
                { id: 'on_leave', label: 'On Leave', value: leave.rows[0].count, type: 'count' },
                { id: 'pending', label: 'Pending Requests', value: pending.rows[0].count, type: 'count' }
            ]
        });
    }
};

const getRecentActivities = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT a.*, u.name as user_name
            FROM activities a
            LEFT JOIN users u ON a.user_id = u.id
            WHERE a.company_id = $1 AND a.created_at::date = CURRENT_DATE
            ORDER BY a.created_at DESC
        `, [req.user.company_id]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching activities' });
    }
};

module.exports = { getDashboardStats, getRecentActivities };
