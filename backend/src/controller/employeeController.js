const db = require('../config/db');
const { hashPassword } = require('../utils/passwordUtils');

const getEmployees = async (req, res) => {
    const result = await db.query(
        `SELECT u.id, u.name, u.email, u.role, u.created_at, u.status, c.name as company_name 
         FROM users u 
         JOIN companies c ON u.company_id = c.id 
         WHERE u.company_id = $1 
         ORDER BY u.created_at DESC`,
        [req.user.company_id]
    );
    res.json(result.rows);
};

const addEmployee = async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!req.user.company_id) {
        return res.status(400).json({ message: 'Session expired or invalid company mapping. Please log out and log back in.' });
    }
    
    const [userExists, hashedPassword] = await Promise.all([
        db.query('SELECT * FROM users WHERE email = $1', [email]),
        hashPassword(password)
    ]);

    if (userExists.rows.length > 0) {
        const existingUser = userExists.rows[0];
        if (!existingUser.company_id) {
            const updateResult = await db.query(
                "UPDATE users SET company_id = $1, role = $2, status = 'active' WHERE id = $3 RETURNING id, name, email, role, status",
                [req.user.company_id, role || 'employee', existingUser.id]
            );
            return res.json(updateResult.rows[0]);
        }
        return res.status(400).json({ message: 'User already exists' });
    }

    const result = await db.query(
        "INSERT INTO users (name, email, password, role, company_id, status) VALUES ($1, $2, $3, $4, $5, 'active') RETURNING id, name, email, role, status",
        [name, email, hashedPassword, role || 'employee', req.user.company_id]
    );
    res.status(201).json(result.rows[0]);
};

const updateEmployee = async (req, res) => {
    const { id } = req.params;
    const { name, email, role } = req.body;
    const result = await db.query(
        'UPDATE users SET name = $1, email = $2, role = $3 WHERE id = $4 AND company_id = $5 RETURNING id, name, email, role',
        [name, email, role, id, req.user.company_id]
    );
    if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(result.rows[0]);
};

const deleteEmployee = async (req, res) => {
    const { id } = req.params;
    await db.query(
        'DELETE FROM users WHERE id = $1 AND company_id = $2',
        [id, req.user.company_id]
    );
    res.json({ message: 'Employee removed successfully' });
};

const getEmployeeProfile = async (req, res) => {
    const { id } = req.params;
    const userCheck = await db.query('SELECT id, name, email, role, created_at, profile_photo FROM users WHERE id = $1 AND company_id = $2', [id, req.user.company_id]);
    if (userCheck.rowCount === 0) return res.status(404).json({ message: 'Employee not found' });
    
    const employee = userCheck.rows[0];

    const [tasks, rewards, leaves, attendance, lateAttendance] = await Promise.all([
        db.query(`SELECT COUNT(*) as total, 
                         SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                         SUM(CASE WHEN status = 'completed' AND due_date IS NOT NULL AND updated_at <= (due_date + interval '23 hours 59 minutes') THEN 1 ELSE 0 END) as on_time,
                         SUM(CASE WHEN status = 'completed' AND due_date IS NOT NULL AND updated_at > (due_date + interval '23 hours 59 minutes') THEN 1 ELSE 0 END) as late
                  FROM tasks WHERE assigned_to = $1`, [id]),
        db.query(`SELECT SUM(points) as total_points FROM rewards WHERE user_id = $1`, [id]),
        db.query(`SELECT COUNT(*) as taken FROM leave_requests WHERE user_id = $1 AND status = 'approved'`, [id]),
        db.query(`SELECT check_in as tap_in, check_out as tap_out 
                  FROM attendance 
                  WHERE user_id = $1 AND created_at::date = CURRENT_DATE LIMIT 1`, [id]),
        db.query(`SELECT COUNT(*) as late_days
                  FROM attendance 
                  WHERE user_id = $1 AND 
                  (EXTRACT(HOUR FROM (check_in AT TIME ZONE 'Asia/Kolkata')) > 10 OR 
                  (EXTRACT(HOUR FROM (check_in AT TIME ZONE 'Asia/Kolkata')) = 10 AND EXTRACT(MINUTE FROM (check_in AT TIME ZONE 'Asia/Kolkata')) > 0))`, [id])
    ]);

    res.json({
        profile: employee,
        stats: {
            tasks: {
                total: parseInt(tasks.rows[0].total) || 0,
                completed: parseInt(tasks.rows[0].completed) || 0,
                on_time: parseInt(tasks.rows[0].on_time) || 0,
                late: parseInt(tasks.rows[0].late) || 0
            },
            points: parseInt(rewards.rows[0].total_points) || 0,
            leaves_taken: parseInt(leaves.rows[0].taken) || 0,
            late_tap_ins: parseInt(lateAttendance.rows[0].late_days) || 0,
            attendance_today: attendance.rows[0] || { tap_in: null, tap_out: null }
        }
    });
};
const updateEmployeeStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const result = await db.query(
        'UPDATE users SET status = $1 WHERE id = $2 AND company_id = $3 RETURNING id, name, email, role, status',
        [status, id, req.user.company_id]
    );
    if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Employee not found' });
    }
    res.json({ message: `Employee status updated to ${status}`, user: result.rows[0] });
};

module.exports = {
    getEmployees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployeeProfile,
    updateEmployeeStatus
};
