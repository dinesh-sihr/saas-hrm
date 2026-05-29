const express = require('express');
require('express-async-errors');
const cors = require('cors');
const path = require('path');
const zlib = require('zlib');
const fs = require('fs');
require('dotenv').config();

const { errorHandler } = require('./middleware/errorMiddleware');

const app = express();

const runMigrations = require('./config/migrations');
const initScheduler = require('./utils/scheduler');

setImmediate(() => {
    runMigrations().then(() => {
        initScheduler();
    }).catch(() => {
        initScheduler();
    });
});

app.use((req, res, next) => {
    const acceptEncoding = req.headers['accept-encoding'] || '';
    if (!acceptEncoding.includes('gzip')) {
        return next();
    }

    const originalEnd = res.end;
    const originalWrite = res.write;
    const chunks = [];
    let ended = false;

    const ext = path.extname(req.url).toLowerCase();
    const compressible = ['.js', '.css', '.html', '.json', '.svg', '.txt', '.xml', '.map'];
    
    if (!compressible.includes(ext) && !req.url.startsWith('/api/')) {
        return next();
    }

    res.write = function(chunk, encoding) {
        if (chunk) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
        }
        return true;
    };

    res.end = function(chunk, encoding) {
        if (ended) return;
        ended = true;

        if (chunk) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
        }

        const body = Buffer.concat(chunks);

        if (body.length > 1024) {
            try {
                const compressed = zlib.gzipSync(body, { level: 6 });
                res.setHeader('Content-Encoding', 'gzip');
                res.setHeader('Vary', 'Accept-Encoding');
                res.removeHeader('Content-Length');
                return originalEnd.call(res, compressed);
            } catch (e) {
            }
        }

        return originalEnd.call(res, body);
    };

    next();
});

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

app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        message: 'HRM Server is running',
        timestamp: new Date()
    });
});

app.use('/assets', express.static(path.join(__dirname, '../../frontend/dist/assets'), {
    maxAge: '1y',
    immutable: true,
}));

app.use(express.static(path.join(__dirname, '../../frontend/dist'), {
    maxAge: 0,
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
    }
}));

app.get('*', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

app.use(errorHandler);

module.exports = app;
