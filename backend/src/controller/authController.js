const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const register = async (req, res) => {
    const { name, email, password, role, companyName } = req.body;

    const existingUserCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUserCheck.rows.length > 0) {
        return res.status(400).json({ message: 'It looks like that email is already registered. Try logging in instead!' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let assignedCompanyId = null;

    if (role === 'manager' && companyName) {
        const newCompany = await db.query(
            'INSERT INTO companies (name, email) VALUES ($1, $2) RETURNING id',
            [companyName, email]
        );
        assignedCompanyId = newCompany.rows[0].id;
    } else if (role === 'employee') {
        if (companyName) {
            const companySearch = await db.query('SELECT id FROM companies WHERE name = $1', [companyName]);
            if (companySearch.rows.length === 0) {
                return res.status(400).json({ message: 'We couldn’t find a company with that name. Please double-check it with your HR team.' });
            }
            assignedCompanyId = companySearch.rows[0].id;
        } else {
            return res.status(400).json({ message: 'We need a company name to get you set up properly.' });
        }
    }

    const newUserAccount = await db.query(
        'INSERT INTO users (name, email, password, role, company_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, company_id',
        [name, email, hashedPassword, role, assignedCompanyId]
    );

    const authToken = jwt.sign(
        { 
            id: newUserAccount.rows[0].id, 
            name: newUserAccount.rows[0].name, 
            role: newUserAccount.rows[0].role, 
            company_id: newUserAccount.rows[0].company_id 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );

    res.status(201).json({
        token: authToken,
        user: newUserAccount.rows[0]
    });
};

const login = async (req, res) => {
    const { email, password } = req.body;

    const userSearch = await db.query(`
        SELECT u.*, c.name as company_name, c.logo as company_logo, c.portal_header, c.portal_config 
        FROM users u
        LEFT JOIN companies c ON u.company_id = c.id
        WHERE u.email = $1
    `, [email]);
    
    if (userSearch.rows.length === 0) {
        return res.status(400).json({ message: 'We couldn’t find an account with those details. Please check your email and password.' });
    }

    const userData = userSearch.rows[0];
    const doPasswordsMatch = await bcrypt.compare(password, userData.password);
    if (!doPasswordsMatch) {
        return res.status(400).json({ message: 'That password doesn’t seem right. Please try again!' });
    }

    const sessionToken = jwt.sign(
        { 
            id: userData.id, 
            name: userData.name, 
            role: userData.role, 
            company_id: userData.company_id 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );

    delete userData.password;

    res.json({
        token: sessionToken,
        user: userData
    });
};

const getProfile = async (req, res) => {
    const profileData = await db.query(`
        SELECT u.id, u.name, u.email, u.role, u.company_id, u.created_at, u.profile_photo,
               c.name as company_name, c.logo as company_logo
        FROM users u
        LEFT JOIN companies c ON u.company_id = c.id
        WHERE u.id = $1
    `, [req.user.id]);
    res.json(profileData.rows[0]);
};

const updateProfile = async (req, res) => {
    const { name, email, password, profile_photo } = req.body;
    let updateParams = [name, email, profile_photo, req.user.id];
    let updateQuery = 'UPDATE users SET name = $1, email = $2, profile_photo = $3';

    if (password) {
        const newHashedPassword = await bcrypt.hash(password, 10);
        updateQuery += ', password = $5';
        updateParams.push(newHashedPassword);
    }

    updateQuery += ' WHERE id = $4 RETURNING id, name, email, role, company_id, profile_photo';
    
    const updateResult = await db.query(updateQuery, updateParams);
    res.json({ message: 'Your profile has been updated successfully!', user: updateResult.rows[0] });
};

module.exports = {
    register,
    login,
    getProfile,
    updateProfile
};
