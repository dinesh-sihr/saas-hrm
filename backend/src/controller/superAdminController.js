const db = require('../config/db');
const bcrypt = require('bcryptjs');

const getStats = async (req, res) => {
    const companies = await db.query('SELECT status, COUNT(*) FROM companies GROUP BY status');
    const subscriptions = await db.query("SELECT COUNT(*) FROM subscriptions WHERE end_date < CURRENT_DATE AND status = 'active'");
    
    let stats = {
        totalCompanies: 0,
        activeCompanies: 0,
        inactiveCompanies: 0,
        expiredLicenses: parseInt(subscriptions.rows[0].count) || 0
    };

    companies.rows.forEach(row => {
        const count = parseInt(row.count);
        stats.totalCompanies += count;
        if (row.status === 'active') stats.activeCompanies = count;
        else stats.inactiveCompanies = count;
    });

    res.json(stats);
};

const getRecentCompanies = async (req, res) => {
    const result = await db.query(`
        SELECT c.*, s.plan, s.status as sub_status 
        FROM companies c 
        LEFT JOIN subscriptions s ON c.id = s.company_id 
        ORDER BY c.created_at DESC 
        LIMIT 5
    `);
    res.json(result.rows);
};

const getAllCompanies = async (req, res) => {
    const result = await db.query('SELECT * FROM companies ORDER BY created_at DESC');
    res.json(result.rows);
};

const updateCompanyStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    await db.query('BEGIN');
    await db.query('UPDATE companies SET status = $1 WHERE id = $2', [status, id]);
    
    if (status === 'active') {
        await db.query("UPDATE users SET status = 'active' WHERE company_id = $1 AND role = 'manager'", [id]);
    } else if (status === 'inactive') {
        await db.query("UPDATE users SET status = 'inactive' WHERE company_id = $1 AND role = 'manager'", [id]);
    }
    
    await db.query('COMMIT');
    res.json({ message: 'Company status updated' });
};

const updateCompanyDetails = async (req, res) => {
    const { id } = req.params;
    const { name, logo, portal_header, portal_config } = req.body;
    await db.query(
        `UPDATE companies 
         SET name = $1, logo = $2, portal_header = $3, portal_config = $4 
         WHERE id = $5`,
        [name, logo, portal_header, JSON.stringify(portal_config || {}), id]
    );
    res.json({ message: 'Company details updated successfully' });
};


const createCompany = async (req, res) => {
    const { name, email, plan = 'basic', managerName, password } = req.body;
    
    if (!managerName || !password) {
        return res.status(400).json({ message: 'Manager name and password are required to register a company' });
    }

    await db.query('BEGIN');
    
    const companyResult = await db.query(
        'INSERT INTO companies (name, email) VALUES ($1, $2) RETURNING id',
        [name, email]
    );
    const companyId = companyResult.rows[0].id;

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 30); // 30 days trial

    await db.query(
        'INSERT INTO subscriptions (company_id, plan, start_date, end_date) VALUES ($1, $2, $3, $4)',
        [companyId, plan, startDate, endDate]
    );

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
        'INSERT INTO users (name, email, password, role, company_id) VALUES ($1, $2, $3, $4, $5)',
        [managerName, email, hashedPassword, 'manager', companyId]
    );

    await db.query('COMMIT');
    res.status(201).json({ message: 'Company and Manager created successfully', companyId });
};

const deleteCompany = async (req, res) => {
    const { id } = req.params;
    await db.query('DELETE FROM companies WHERE id = $1', [id]);
    res.json({ message: 'Company and all associated data deleted' });
};

const getAdminUsers = async (req, res) => {
    const result = await db.query("SELECT id, name, email, role, created_at FROM users WHERE role = 'super_admin' ORDER BY created_at DESC");
    res.json(result.rows);
};

const addAdminUser = async (req, res) => {
    const { name, email, password } = req.body;
    const existing = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
        return res.status(400).json({ message: 'Email already registered' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
        "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, 'super_admin') RETURNING id, name, email, role",
        [name, email, hashedPassword]
    );
    res.status(201).json(result.rows[0]);
};

module.exports = {
    getStats,
    getRecentCompanies,
    getAllCompanies,
    createCompany,
    updateCompanyStatus,
    updateCompanyDetails,
    deleteCompany,
    getAdminUsers,
    addAdminUser
};
