const db = require('./src/config/db');

async function inspect() {
    try {
        const users = await db.query('SELECT id, name, email, role, company_id, status FROM users');
        console.log('DB_USERS: ' + JSON.stringify(users.rows));
        
        const companies = await db.query('SELECT id, name, status FROM companies');
        console.log('DB_COMPANIES: ' + JSON.stringify(companies.rows));
    } catch (e) {
        console.error(e);
    }
}

inspect();
