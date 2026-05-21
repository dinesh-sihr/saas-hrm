const db = require('../config/db');
const { hashPassword } = require('./passwordUtils');
require('dotenv').config({ path: '../../.env' });

const seed = async () => {
    try {
        const password = await hashPassword('admin123');
        const query = `
            INSERT INTO users (name, email, password, role)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (email) DO NOTHING
            RETURNING email;
        `;
        
        const { rows } = await db.query(query, ['Super Admin', 'admin@shnoor.com', password, 'super_admin']);
        
        if (rows.length) {
            console.log(`Admin created: ${rows[0].email}`);
        } else {
            console.log('Admin already exists.');
        }
        
        process.exit(0);
    } catch (err) {
        console.error('Seed error:', err);
        process.exit(1);
    }
};

seed();
