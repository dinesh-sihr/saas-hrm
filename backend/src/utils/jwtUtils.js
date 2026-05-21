const jwt = require('jsonwebtoken');

const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user.id, 
            role: user.role, 
            company_id: user.company_id 
        }, 
        process.env.JWT_SECRET, 
        { expiresIn: '24h' }
    );
};

module.exports = { generateToken };
