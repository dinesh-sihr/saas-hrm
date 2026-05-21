const fs = require('fs');
const path = require('path');
const db = require('./db');

const runMigrations = async () => {
    try {
        const schemaPath = path.join(__dirname, '../models/schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await db.query(schemaSql);
        console.log('✓ Base schema initialized successfully');
    } catch (err) {
        console.error('✗ Failed to initialize base schema:', err.message);
    }
    
    const migrate = async (label, query) => {
        try {
            await db.query(query);
        } catch (err) {
            console.error(`✗ Migration failed: ${label}`, err.message);
        }
    };

    await migrate('Companies: portal_header', 'ALTER TABLE companies ADD COLUMN IF NOT EXISTS portal_header TEXT');
    await migrate('Companies: portal_config', "ALTER TABLE companies ADD COLUMN IF NOT EXISTS portal_config JSONB DEFAULT '{}'");
    await migrate('Users: profile_photo', 'ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo TEXT');
    await migrate('Leave Requests: reason', 'ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS reason TEXT');
    await migrate('Announcements: tag', "ALTER TABLE announcements ADD COLUMN IF NOT EXISTS tag VARCHAR(50) DEFAULT 'Update'");
    await migrate('Announcements: created_by', 'ALTER TABLE announcements ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL');

    await migrate('Notifications Table', `
        CREATE TABLE IF NOT EXISTS notifications (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await migrate('Payroll Table', `
        CREATE TABLE IF NOT EXISTS payroll (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            month VARCHAR(20) NOT NULL,
            year INTEGER NOT NULL,
            basic_salary DECIMAL(10, 2) NOT NULL,
            allowances DECIMAL(10, 2) DEFAULT 0,
            deductions DECIMAL(10, 2) DEFAULT 0,
            net_salary DECIMAL(10, 2) NOT NULL,
            status VARCHAR(50) DEFAULT 'paid',
            paid_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await migrate('Rewards Table', `
        CREATE TABLE IF NOT EXISTS rewards (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
            sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            reward_type VARCHAR(100) NOT NULL,
            points INTEGER DEFAULT 0,
            message TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await migrate('Chat History Table', `
        CREATE TABLE IF NOT EXISTS chat_history (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            role VARCHAR(50) NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await migrate('Tasks Table', `
        CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
            assigned_to INTEGER REFERENCES users(id) ON DELETE CASCADE,
            assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            priority VARCHAR(50) DEFAULT 'medium',
            status VARCHAR(50) DEFAULT 'pending',
            due_date DATE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await migrate('Performance Insights Table', `
        CREATE TABLE IF NOT EXISTS performance_insights (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            metrics_json JSONB NOT NULL,
            ai_summary TEXT NOT NULL,
            calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await migrate('Meetings Table', `
        CREATE TABLE IF NOT EXISTS meetings (
            id SERIAL PRIMARY KEY,
            company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await migrate('Meeting Participants Table', `
        CREATE TABLE IF NOT EXISTS meeting_participants (
            id SERIAL PRIMARY KEY,
            meeting_id INTEGER REFERENCES meetings(id) ON DELETE CASCADE,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            joined_at TIMESTAMP WITH TIME ZONE,
            status VARCHAR(50) DEFAULT 'invited'
        )
    `);

    await migrate('Announcement Reads Table', `
        CREATE TABLE IF NOT EXISTS announcement_reads (
            id SERIAL PRIMARY KEY,
            announcement_id INTEGER REFERENCES announcements(id) ON DELETE CASCADE,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await migrate('Tasks: type', "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'individual'");

    await migrate('Task Assignees Table', `
        CREATE TABLE IF NOT EXISTS task_assignees (
            id SERIAL PRIMARY KEY,
            task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await migrate('Activities Table', `
        CREATE TABLE IF NOT EXISTS activities (
            id SERIAL PRIMARY KEY,
            company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
            user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            action TEXT NOT NULL,
            status VARCHAR(50),
            color VARCHAR(20),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await migrate('Companies: geofencing columns', `
        ALTER TABLE companies 
        ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
        ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION
    `);

    await migrate('Users: basic_salary column', `
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS basic_salary DECIMAL(10, 2) DEFAULT 30000.00
    `);

    await migrate('Daily Salary Logs Table', `
        CREATE TABLE IF NOT EXISTS daily_salary_logs (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            log_date DATE NOT NULL,
            effective_hours DECIMAL(5, 2) DEFAULT 0,
            daily_rate DECIMAL(10, 2) DEFAULT 0,
            earned_amount DECIMAL(10, 2) DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, log_date)
        )
    `);

    await migrate('Users: status column', `
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active'
    `);

    try {
        const { hashPassword } = require('../utils/passwordUtils');
        const password = await hashPassword('admin123');
        await db.query(`
            INSERT INTO users (name, email, password, role, status)
            VALUES ($1, $2, $3, $4, 'active')
            ON CONFLICT (email) DO NOTHING
        `, ['Super Admin', 'admin@shnoor.com', password, 'super_admin']);
        console.log('✓ Super Admin seeded successfully');
    } catch (err) {
        console.error('✗ Failed to seed Super Admin:', err.message);
    }
};

module.exports = runMigrations;
