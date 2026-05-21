const db = require('../config/db');
const { logActivity } = require('../utils/activityLogger');

const assignTask = async (req, res) => {
    const { assigned_to, title, description, priority, due_date } = req.body;
    const isGroup = Array.isArray(assigned_to) && assigned_to.length > 1;
    const type = isGroup ? 'group' : 'individual';
    
    const primaryAssignee = isGroup ? assigned_to[0] : assigned_to;

    const result = await db.query(
        `INSERT INTO tasks (company_id, assigned_to, assigned_by, title, description, priority, due_date, type) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [req.user.company_id, primaryAssignee, req.user.id, title, description, priority, due_date, type]
    );

    const taskId = result.rows[0].id;

    if (isGroup) {
        for (const userId of assigned_to) {
            await db.query(
                "INSERT INTO task_assignees (task_id, user_id) VALUES ($1, $2)",
                [taskId, userId]
            );
            
            await db.query(
                "INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)",
                [userId, "New Group Task Assigned", `You have been added to a group task: ${title}`]
            );
            await logActivity(req.user.company_id, userId, `was added to a group task: ${title}`, 'Group Synergy', '#6366f1');
        }
    } else {
        await db.query(
            "INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)",
            [assigned_to, "New Task Assigned", `You have been assigned a new task: ${title}`]
        );
        await logActivity(req.user.company_id, assigned_to, `was assigned a new task: ${title}`, 'Task Assigned', '#f59e0b');
    }

    res.status(201).json(result.rows[0]);
};

const getMyTasks = async (req, res) => {
    const result = await db.query(
        `SELECT DISTINCT t.* FROM tasks t
         LEFT JOIN task_assignees ta ON t.id = ta.task_id
         WHERE t.assigned_to = $1 OR ta.user_id = $1
         ORDER BY t.created_at DESC`,
        [req.user.id]
    );
    res.json(result.rows);
};

const completeTask = async (req, res) => {
    const { id } = req.params;
    
    const authCheck = await db.query(
        `SELECT t.* FROM tasks t
         LEFT JOIN task_assignees ta ON t.id = ta.task_id
         WHERE t.id = $1 AND (t.assigned_to = $2 OR ta.user_id = $2)`,
        [id, req.user.id]
    );

    if (authCheck.rowCount === 0) return res.status(404).json({ message: 'Task not found or unauthorized' });

    const result = await db.query(
        "UPDATE tasks SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
        [id]
    );
    
    const task = result.rows[0];

    if (task.type === 'group') {
        const assignees = await db.query("SELECT user_id FROM task_assignees WHERE task_id = $1", [task.id]);
        for (const assignee of assignees.rows) {
            await logActivity(req.user.company_id, assignee.user_id, `collaborated to complete group task: ${task.title}`, 'Group Synergy', '#6366f1');
            await db.query(
                "INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)",
                [assignee.user_id, "Group Synergy Success!", `Your group task "${task.title}" has been completed!`]
            );
        }
    }

    if (task.due_date) {
        const completedAt = new Date(task.updated_at);
        const dueDate = new Date(task.due_date);
        dueDate.setHours(23, 59, 59, 999);

        if (completedAt <= dueDate) {
            await db.query(
                `INSERT INTO rewards (user_id, company_id, sender_id, reward_type, points, message) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [req.user.id, req.user.company_id, task.assigned_by, 'Task Completed On Time', 10, `Excellent work completing "${task.title}" before the deadline!`]
            );
        }
    }

    if (task.assigned_by) {
        await db.query(
            "INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)",
            [task.assigned_by, "Task Completed", `Task "${task.title}" has been completed by ${req.user.name}.`]
        );
    }
    await logActivity(req.user.company_id, req.user.id, `completed task: ${task.title}`, 'Task Done', '#10b981');

    res.json(task);
};

const getSmartTrackingData = async (req, res) => {
    const query = `
        SELECT 
            u.id, 
            u.name, 
            u.role,
            (SELECT check_in FROM attendance WHERE user_id = u.id AND created_at::date = CURRENT_DATE LIMIT 1) as tap_in,
            (SELECT check_out FROM attendance WHERE user_id = u.id AND created_at::date = CURRENT_DATE LIMIT 1) as tap_out,
            (SELECT status FROM attendance WHERE user_id = u.id AND created_at::date = CURRENT_DATE AND status = 'on_leave' LIMIT 1) as leave_status,
            COUNT(t.id) as total_tasks,
            COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
            COUNT(CASE WHEN t.status = 'pending' THEN 1 END) as pending_tasks
        FROM users u
        LEFT JOIN tasks t ON u.id = t.assigned_to
        WHERE u.company_id = $1 AND u.role = 'employee'
        GROUP BY u.id
        ORDER BY u.name ASC
    `;
    const result = await db.query(query, [req.user.company_id]);
    
    const trackedEmployees = result.rows.map(emp => {
        const pending = parseInt(emp.pending_tasks);
        return {
            ...emp,
            workload: pending > 3 ? 'Overloaded' : 'Good'
        };
    });

    res.json(trackedEmployees);
};

module.exports = {
    assignTask,
    getMyTasks,
    completeTask,
    getSmartTrackingData
};
