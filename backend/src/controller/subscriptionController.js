const db = require('../config/db');
const { createNotification } = require('./notificationController');

const getAllSubscriptions = async (req, res) => {
    const result = await db.query(`
        SELECT s.*, c.name as company_name 
        FROM subscriptions s
        JOIN companies c ON s.company_id = c.id
        ORDER BY s.end_date ASC
    `);
    res.json(result.rows);
};

const getRevenueStats = async (req, res) => {
    const result = await db.query(`
        SELECT 
            COUNT(*) as total_subscriptions,
            SUM(CASE WHEN plan = 'premium' THEN 1 ELSE 0 END) as premium_count,
            SUM(CASE WHEN plan = 'basic' THEN 1 ELSE 0 END) as basic_count
        FROM subscriptions
        WHERE status = 'active'
    `);
    res.json(result.rows[0]);
};

const cancelSubscription = async (req, res) => {
    const { id } = req.params;
    await db.query("UPDATE subscriptions SET status = 'cancelled' WHERE id = $1", [id]);
    
    await createNotification(req.user.id, 'Subscription Cancelled', 'Your subscription has been cancelled. You will still have access until the end of your current billing cycle.');
    
    res.json({ message: 'Subscription cancelled successfully' });
};

const renewSubscription = async (req, res) => {
    const { id } = req.params;
    await db.query(`
        UPDATE subscriptions 
        SET end_date = CASE 
            WHEN end_date < CURRENT_TIMESTAMP THEN CURRENT_TIMESTAMP + INTERVAL '30 days'
            ELSE end_date + INTERVAL '30 days'
        END,
        status = 'active' 
        WHERE id = $1
    `, [id]);

    await createNotification(req.user.id, 'Subscription Renewed', 'Your subscription has been successfully renewed for another 30 days.');

    res.json({ message: 'Subscription renewed for 30 days' });
};

const addSubscription = async (req, res) => {
    const { company_id, plan = 'basic' } = req.body;
    
    const existing = await db.query("SELECT * FROM subscriptions WHERE company_id = $1 AND status = 'active'", [company_id]);
    if (existing.rows.length > 0) {
        return res.status(400).json({ message: 'This company already has an active subscription' });
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 30); 

    const result = await db.query(
        'INSERT INTO subscriptions (company_id, plan, start_date, end_date, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [company_id, plan, startDate, endDate, 'active']
    );

    res.status(201).json(result.rows[0]);
};

module.exports = {
    getAllSubscriptions,
    getRevenueStats,
    cancelSubscription,
    renewSubscription,
    addSubscription
};
