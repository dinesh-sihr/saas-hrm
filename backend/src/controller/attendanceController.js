const db = require('../config/db');
const { createNotification } = require('./notificationController');
const { logActivity } = require('../utils/activityLogger');

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const earthRadius = 6371e3; 
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadius * c;
};

const getStatus = async (req, res) => {
    const result = await db.query(
        "SELECT * FROM attendance WHERE user_id = $1 AND DATE(created_at) = CURRENT_DATE ORDER BY created_at DESC LIMIT 1",
        [req.user.id]
    );
    res.json(result.rows[0] || null);
};

const checkIn = async (req, res) => {
    const existingStatus = await db.query(
        "SELECT * FROM attendance WHERE user_id = $1 AND DATE(created_at) = CURRENT_DATE AND check_out IS NULL",
        [req.user.id]
    );

    if (existingStatus.rows.length > 0) {
        return res.status(400).json({ message: 'Already checked in' });
    }

    const companyId = req.user.company_id;
    if (companyId) {
        const companyQuery = await db.query(
            "SELECT latitude, longitude FROM companies WHERE id = $1",
            [companyId]
        );
        
        if (companyQuery.rows.length > 0) {
            const company = companyQuery.rows[0];
            if (company.latitude !== null && company.longitude !== null) {
                let latitude = req.body.latitude;
                let longitude = req.body.longitude;
                
                if (latitude === undefined || longitude === undefined) {
                    return res.status(400).json({ 
                        message: 'GPS coordinates are required to clock in. Please enable location services on your device.' 
                    });
                }
                
                const distance = calculateDistance(
                    company.latitude, 
                    company.longitude, 
                    parseFloat(latitude), 
                    parseFloat(longitude)
                );
                
                if (distance > 100) {
                    return res.status(400).json({ 
                        message: `Geofence block: You are ${Math.round(distance)}m away from the office. Tap-in is restricted to a 100-meter radius.` 
                    });
                }
            }
        }
    }

    const result = await db.query(
        "INSERT INTO attendance (user_id, check_in, status) VALUES ($1, CURRENT_TIMESTAMP, 'present') RETURNING *",
        [req.user.id]
    );
    const checkInRecord = result.rows[0];

    const checkInTime = new Date(checkInRecord.check_in);
    const istOptions = { timeZone: 'Asia/Kolkata', hour: '2-digit', hour12: false, minute: '2-digit' };
    const istTimeString = checkInTime.toLocaleTimeString('en-US', istOptions);
    const [hour, minute] = istTimeString.split(':').map(Number);
    
    if (hour > 10 || (hour === 10 && minute > 0)) {
        await createNotification(
            req.user.id, 
            "Late Tap-In Warning", 
            `You checked in at ${istTimeString}, which is past the 10:00 AM threshold. Please ensure timely arrivals.`
        );
        
        if (req.user.role === 'employee' && req.user.company_id) {
            const managerQuery = await db.query(
                "SELECT id FROM users WHERE role = 'manager' AND company_id = $1 LIMIT 1",
                [req.user.company_id]
            );
            if (managerQuery.rows.length > 0) {
                await createNotification(
                    managerQuery.rows[0].id,
                    "Employee Late Arrival",
                    `${req.user.name} checked in late today at ${istTimeString}.`
                );
            }
        }
    }

    await logActivity(req.user.company_id, req.user.id, 'checked in for the day', 'Arrival', '#10b981');
    res.status(201).json(checkInRecord);
};

const checkOut = async (req, res) => {
    const activeSession = await db.query(
        "SELECT * FROM attendance WHERE user_id = $1 AND check_out IS NULL ORDER BY created_at DESC LIMIT 1",
        [req.user.id]
    );

    if (activeSession.rows.length === 0) {
        return res.status(400).json({ message: 'No active session found' });
    }

    const companyId = req.user.company_id;
    if (companyId) {
        const companyQuery = await db.query(
            "SELECT latitude, longitude FROM companies WHERE id = $1",
            [companyId]
        );
        
        if (companyQuery.rows.length > 0) {
            const company = companyQuery.rows[0];
            if (company.latitude !== null && company.longitude !== null) {
                let latitude = req.body.latitude;
                let longitude = req.body.longitude;
                
                if (latitude === undefined || longitude === undefined) {
                    return res.status(400).json({ 
                        message: 'GPS coordinates are required to clock out. Please enable location services on your device.' 
                    });
                }
                
                const distance = calculateDistance(
                    company.latitude, 
                    company.longitude, 
                    parseFloat(latitude), 
                    parseFloat(longitude)
                );
                
                if (distance > 100) {
                    return res.status(400).json({ 
                        message: `Geofence block: You are ${Math.round(distance)}m away from the office. Tap-out is restricted to a 100-meter radius.` 
                    });
                }
            }
        }
    }

    const checkInTime = new Date(activeSession.rows[0].check_in);
    const checkOutTime = new Date();
    const totalHours = (checkOutTime - checkInTime) / 3600000;

    const result = await db.query(
        "UPDATE attendance SET check_out = $1, total_hours = $2 WHERE id = $3 RETURNING *",
        [checkOutTime, totalHours.toFixed(2), activeSession.rows[0].id]
    );

    const userQuery = await db.query("SELECT basic_salary FROM users WHERE id = $1", [req.user.id]);
    const basicSalary = parseFloat(userQuery.rows[0]?.basic_salary || 30000.00);

    const currentYear = checkOutTime.getFullYear();
    const currentMonth = checkOutTime.getMonth() + 1;
    const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
    const endDate = new Date(currentYear, currentMonth, 0);
    const endDateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

    const holidayQuery = await db.query(
        "SELECT COUNT(*) FROM holidays WHERE company_id = $1 AND holiday_date BETWEEN $2 AND $3", 
        [req.user.company_id, startDate, endDateStr]
    );
    const holidaysCount = parseInt(holidayQuery.rows[0].count) || 0;

    const standardDays = Math.max(26 - holidaysCount, 1);
    const dailyRate = basicSalary / standardDays;
    const totalHoursFloat = parseFloat(totalHours.toFixed(2));
    const effectiveHours = Math.min(totalHoursFloat, 8);
    const earnedAmount = dailyRate * (effectiveHours / 8);
    const logDateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(checkOutTime.getDate()).padStart(2, '0')}`;

    await db.query(`
        INSERT INTO daily_salary_logs (user_id, log_date, effective_hours, daily_rate, earned_amount)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id, log_date) DO UPDATE
        SET effective_hours = EXCLUDED.effective_hours,
            daily_rate = EXCLUDED.daily_rate,
            earned_amount = EXCLUDED.earned_amount
    `, [req.user.id, logDateStr, effectiveHours, dailyRate.toFixed(2), earnedAmount.toFixed(2)]);

    await logActivity(req.user.company_id, req.user.id, 'checked out for the day', 'Departure', '#f43f5e');
    res.json(result.rows[0]);
};

const getHistory = async (req, res) => {
    const result = await db.query(
        "SELECT * FROM attendance WHERE user_id = $1 ORDER BY created_at DESC",
        [req.user.id]
    );
    res.json(result.rows);
};

const getAttendanceStats = async (req, res) => {
    const todayResult = await db.query(
        `SELECT COALESCE(SUM(total_hours), 0) as hours 
         FROM attendance 
         WHERE user_id = $1 AND DATE(created_at) = CURRENT_DATE`,
        [req.user.id]
    );

    const activeSession = await db.query(
        "SELECT check_in FROM attendance WHERE user_id = $1 AND check_out IS NULL AND DATE(created_at) = CURRENT_DATE",
        [req.user.id]
    );

    let todayHours = parseFloat(todayResult.rows[0].hours);
    if (activeSession.rows.length > 0) {
        const checkInTime = new Date(activeSession.rows[0].check_in);
        const elapsed = (new Date() - checkInTime) / 3600000;
        todayHours += elapsed;
    }

    const monthResult = await db.query(
        `SELECT COALESCE(SUM(total_hours), 0) as hours 
         FROM attendance 
         WHERE user_id = $1 AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
         AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)`,
        [req.user.id]
    );

    const monthRecords = await db.query(
        `SELECT MIN(check_in) as first_check_in 
         FROM attendance 
         WHERE user_id = $1 AND status = 'present'
         AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
         AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
         GROUP BY DATE(created_at)`,
        [req.user.id]
    );

    let onTimeDays = 0;
    const daysPresent = monthRecords.rows.length;

    monthRecords.rows.forEach(record => {
        const checkInTime = new Date(record.first_check_in);
        const istString = checkInTime.toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour12: false });
        const timePart = istString.split(', ')[1];
        if (timePart) {
            const hour = parseInt(timePart.split(':')[0]);
            const min = parseInt(timePart.split(':')[1]);
            if (hour < 10 || (hour === 10 && min === 0)) {
                onTimeDays++;
            }
        }
    });

    res.json({
        todayHours: todayHours.toFixed(2),
        monthHours: parseFloat(monthResult.rows[0].hours).toFixed(2),
        daysPresent: daysPresent,
        onTimeDays: onTimeDays,
        targetHours: 8 
    });
};

const getTeamAttendance = async (req, res) => {
    if (req.user.role === 'employee') {
        return res.status(403).json({ message: 'Access denied' });
    }
    const result = await db.query(
        `SELECT a.*, u.name as user_name, u.email as user_email 
         FROM attendance a 
         JOIN users u ON a.user_id = u.id 
         WHERE u.company_id = $1 
         ORDER BY a.created_at DESC LIMIT 100`,
        [req.user.company_id]
    );
    res.json(result.rows);
};

const getGeofence = async (req, res) => {
    try {
        const companyId = req.user.company_id;
        if (!companyId) {
            return res.status(400).json({ message: 'No company associated with this user account.' });
        }

        const result = await db.query(
            "SELECT latitude, longitude FROM companies WHERE id = $1",
            [companyId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Company record not found.' });
        }

        res.json({
            latitude: result.rows[0].latitude,
            longitude: result.rows[0].longitude,
            radius: 100 
        });
    } catch (err) {
        console.error('Error fetching geofencing settings:', err.message);
        res.status(500).json({ message: 'Failed to retrieve geofencing settings.' });
    }
};

const updateGeofence = async (req, res) => {
    try {
        const companyId = req.user.company_id;
        if (!companyId) {
            return res.status(400).json({ message: 'No company associated with this account.' });
        }

        if (req.user.role !== 'manager' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only managers or admins can modify the company location settings.' });
        }

        const { latitude, longitude } = req.body;

        if (latitude === undefined || longitude === undefined || isNaN(latitude) || isNaN(longitude)) {
            return res.status(400).json({ message: 'A valid numeric latitude and longitude are required.' });
        }

        await db.query(
            "UPDATE companies SET latitude = $1, longitude = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3",
            [parseFloat(latitude), parseFloat(longitude), companyId]
        );

        res.json({
            message: 'Office location coordinates successfully updated!',
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude)
        });
    } catch (err) {
        console.error('Error updating company geofence coordinates:', err.message);
        res.status(500).json({ message: 'Failed to update geofencing settings.' });
    }
};

const getDrilldownAnalytics = async (req, res) => {
    try {
        const companyId = req.user.company_id;
        if (!companyId) {
            return res.status(400).json({ message: 'No company associated with this user.' });
        }

        const usersResult = await db.query(
            "SELECT id, name, email, role, status, profile_photo FROM users WHERE company_id = $1 AND status = 'active'",
            [companyId]
        );
        const users = usersResult.rows;

        const attendanceResult = await db.query(
            `SELECT user_id, check_in, check_out, total_hours, status 
             FROM attendance 
             WHERE user_id IN (SELECT id FROM users WHERE company_id = $1)
             ORDER BY check_in DESC`,
             [companyId]
        );
        const attendanceRows = attendanceResult.rows;

        const userAttendanceMap = {};
        users.forEach(u => {
            userAttendanceMap[u.id] = [];
        });

        attendanceRows.forEach(row => {
            if (userAttendanceMap[row.user_id]) {
                userAttendanceMap[row.user_id].push(row);
            }
        });

        const depts = {
            hr: { id: 'hr', name: 'HR', attendanceSum: 0, members: [], color: '#10b981' },
            dev: { id: 'dev', name: 'Development', attendanceSum: 0, members: [], color: '#6366f1' },
            testing: { id: 'testing', name: 'Testing', attendanceSum: 0, members: [], color: '#ec4899' }
        };

        users.forEach(user => {
            const logs = userAttendanceMap[user.id] || [];
            const uniqueDays = new Set(logs.map(log => new Date(log.check_in).toDateString())).size;
            const attendancePct = Math.min(Math.round((uniqueDays / 26) * 100), 100);

            const memberInfo = {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                profile_photo: user.profile_photo,
                attendance: attendancePct,
                presentDays: uniqueDays,
                absentDays: Math.max(26 - uniqueDays, 0),
                logs: logs.map(log => {
                    const checkInTime = new Date(log.check_in);
                    const checkOutTime = log.check_out ? new Date(log.check_out) : null;
                    const hours = parseFloat(log.total_hours) || 0;
                    
                    const istOptions = { timeZone: 'Asia/Kolkata', hour: '2-digit', hour12: true, minute: '2-digit' };
                    const inTimeStr = checkInTime.toLocaleTimeString('en-US', istOptions);
                    const outTimeStr = checkOutTime ? checkOutTime.toLocaleTimeString('en-US', istOptions) : '--';
                    
                    const checkInHour = checkInTime.getHours();
                    const checkInMin = checkInTime.getMinutes();
                    const isLate = checkInHour > 10 || (checkInHour === 10 && checkInMin > 0);

                    return {
                        date: checkInTime.toISOString().split('T')[0],
                        status: log.status || 'present',
                        hours: hours,
                        inTime: inTimeStr,
                        outTime: outTimeStr,
                        type: isLate ? 'Late Arrival' : 'On Time'
                    };
                })
            };

            let deptKey = 'dev';
            if (user.role === 'manager' || user.role === 'super_admin') {
                deptKey = 'hr';
            } else if (user.role === 'tester') {
                deptKey = 'testing';
            }

            depts[deptKey].members.push(memberInfo);
            depts[deptKey].attendanceSum += attendancePct;
        });

        const departmentSummaries = Object.values(depts).map(d => {
            const avgAttendance = d.members.length > 0 ? Math.round(d.attendanceSum / d.members.length) : 100;
            const totalPresentDays = d.members.reduce((acc, m) => acc + m.presentDays, 0);
            const trendVal = totalPresentDays > 0 ? (totalPresentDays % 3 === 0 ? 1.8 : totalPresentDays % 2 === 0 ? 2.4 : -1.2) : 0.0;
            return {
                id: d.id,
                name: d.name,
                attendance: avgAttendance,
                totalMembers: d.members.length,
                color: d.color,
                lead: d.members[0]?.name || 'N/A',
                trend: trendVal,
                members: d.members
            };
        });

        res.json({
            departments: departmentSummaries
        });
    } catch (err) {
        console.error('Drilldown analytics error:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = {
    getStatus,
    checkIn,
    checkOut,
    getHistory,
    getAttendanceStats,
    getTeamAttendance,
    getGeofence,
    updateGeofence,
    getDrilldownAnalytics
};
