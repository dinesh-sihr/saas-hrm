const express = require('express');
require('express-async-errors');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { errorHandler } = require('./middleware/errorMiddleware');

const app = express();

const runMigrations = require('./config/migrations');
const initScheduler = require('./utils/scheduler');

runMigrations();
initScheduler();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/companies', require('./routes/companyRoutes'));
app.use('/api/subscriptions', require('./routes/subscriptionRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/assets', require('./routes/assetRoutes'));
app.use('/api/holidays', require('./routes/holidayRoutes'));
app.use('/api/leaves', require('./routes/leaveRoutes'));
app.use('/api/payroll', require('./routes/payrollRoutes'));
app.use('/api/rewards', require('./routes/rewardRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/super-admin', require('./routes/superAdminRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/meetings', require('./routes/meetingRoutes'));

app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        message: 'HRM Server is running',
        timestamp: new Date()
    });
});

app.use(express.static(path.join(__dirname, '../../frontend/dist')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

app.use(errorHandler);

module.exports = app;
