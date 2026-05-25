const { hashPassword, comparePassword } = require('../utils/passwordUtils');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const register = async (req, res) => {
    try {
        const { name, email, password, role, companyName } = req.body;

        const [existingUserCheck, hashedPassword] = await Promise.all([
            db.query('SELECT * FROM users WHERE email = $1', [email]),
            hashPassword(password)
        ]);

        if (existingUserCheck.rows.length > 0) {
            return res.status(400).json({ message: 'It looks like that email is already registered. Try logging in instead!' });
        }

        let assignedCompanyId = null;

        if (role === 'manager' && companyName) {
            const newCompany = await db.query(
                "INSERT INTO companies (name, email, status) VALUES ($1, $2, 'pending') RETURNING id",
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

        const userStatus = (role === 'super_admin') ? 'active' : 'pending';

        const newUserAccount = await db.query(
            'INSERT INTO users (name, email, password, role, company_id, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, role, company_id, status',
            [name, email, hashedPassword, role, assignedCompanyId, userStatus]
        );

        if (userStatus === 'pending') {
            return res.status(201).json({
                message: role === 'manager'
                    ? 'Your manager account and company are currently pending approval from the System Admin.'
                    : 'Your account is pending approval from your company manager.',
                user: newUserAccount.rows[0]
            });
        }

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
    } catch (err) {
        console.error('Registration error details:', err);
        res.status(500).json({ message: err.message || 'An unexpected error occurred during registration.' });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;

    const userSearch = await db.query(`
        SELECT u.*, c.name as company_name, c.logo as company_logo, c.portal_header, c.portal_config, c.status as company_status 
        FROM users u
        LEFT JOIN companies c ON u.company_id = c.id
        WHERE u.email = $1
    `, [email]);
    
    if (userSearch.rows.length === 0) {
        return res.status(400).json({ message: 'We couldn’t find an account with those details. Please check your email and password.' });
    }

    const userData = userSearch.rows[0];
    const doPasswordsMatch = await comparePassword(password, userData.password);
    if (!doPasswordsMatch) {
        return res.status(400).json({ message: 'That password doesn’t seem right. Please try again!' });
    }

    if (userData.password.startsWith('$2a$') || userData.password.startsWith('$2b$')) {
        hashPassword(password).then(async (upgradedPassword) => {
            await db.query('UPDATE users SET password = $1 WHERE id = $2', [upgradedPassword, userData.id]);
        }).catch((upgradeErr) => {
            console.error('Failed to auto-upgrade password:', upgradeErr);
        });
    }

    if (userData.role !== 'super_admin') {
        if (userData.status === 'pending') {
            return res.status(403).json({
                message: userData.role === 'manager'
                    ? 'Your manager account and company setup are currently pending approval from the System Admin.'
                    : 'Your account is pending approval from your company manager.'
            });
        }
        if (userData.status === 'inactive') {
            return res.status(403).json({ message: 'Your account has been deactivated. Please contact your administrator.' });
        }

        if (userData.company_id) {
            if (userData.company_status === 'pending') {
                return res.status(403).json({ message: 'Your company is currently pending approval from the System Admin.' });
            }
            if (userData.company_status === 'inactive') {
                return res.status(403).json({ message: 'Your company has been deactivated. Please contact your administrator.' });
            }
        }
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
        SELECT u.id, u.name, u.email, u.role, u.company_id, u.created_at, u.profile_photo, u.status,
               c.name as company_name, c.logo as company_logo, c.status as company_status
        FROM users u
        LEFT JOIN companies c ON u.company_id = c.id
        WHERE u.id = $1
    `, [req.user.id]);
    
    if (profileData.rows.length === 0) {
        return res.status(401).json({ message: 'User not found' });
    }

    const userData = profileData.rows[0];
    if (userData.role !== 'super_admin') {
        if (userData.status === 'pending' || userData.status === 'inactive' || userData.company_status === 'pending' || userData.company_status === 'inactive') {
            return res.status(403).json({ message: 'Not authorized, account status is invalid' });
        }
    }

    res.json(userData);
};

const updateProfile = async (req, res) => {
    const { name, email, password, profile_photo } = req.body;
    let updateParams = [name, email, profile_photo, req.user.id];
    let updateQuery = 'UPDATE users SET name = $1, email = $2, profile_photo = $3';

    if (password) {
        const newHashedPassword = await hashPassword(password);
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
