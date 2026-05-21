const db = require('../config/db');
const { createNotification } = require('./notificationController');

const getPayroll = async (req, res) => {
    let query;
    let params;

    if (req.user.role === 'employee') {
        query = 'SELECT * FROM payroll WHERE user_id = $1 ORDER BY year DESC, month DESC';
        params = [req.user.id];
    } else {
        query = `
            SELECT p.*, u.name as employee_name, u.email as employee_email 
            FROM payroll p 
            JOIN users u ON p.user_id = u.id 
            WHERE u.company_id = $1 
            ORDER BY p.year DESC, p.month DESC
        `;
        params = [req.user.company_id];
    }

    const result = await db.query(query, params);
    res.json(result.rows);
};

const generatePayroll = async (req, res) => {
    const { user_id, month, year, basic_salary, allowances, deductions } = req.body;
    const net_salary = parseFloat(basic_salary) + parseFloat(allowances || 0) - parseFloat(deductions || 0);
    
    const result = await db.query(
        `INSERT INTO payroll 
        (user_id, month, year, basic_salary, allowances, deductions, net_salary, status) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
        RETURNING *`,
        [user_id, month, year, basic_salary, allowances || 0, deductions || 0, net_salary, 'paid']
    );

    await createNotification(
        user_id,
        'Salary Credited ',
        `Your payroll for ${month} ${year} has been generated. Net Salary: ${net_salary.toLocaleString('en-IN')}.`
    );

    res.status(201).json(result.rows[0]);
};

const deletePayroll = async (req, res) => {
    const { id } = req.params;
    await db.query('DELETE FROM payroll WHERE id = $1', [id]);
    res.json({ message: 'Payroll record deleted' });
};

const calculateSalary = async (req, res) => {
    try {
        const { from, to } = req.query;
        let targetUserId = req.user.id;
        if ((req.user.role === 'manager' || req.user.role === 'admin') && req.query.user_id) {
            targetUserId = req.query.user_id;
        }

        const userQuery = await db.query(
            "SELECT id, name, email, company_id, basic_salary FROM users WHERE id = $1",
            [targetUserId]
        );
        if (userQuery.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        const user = userQuery.rows[0];

        const holidaysQuery = await db.query(
            "SELECT TO_CHAR(holiday_date, 'YYYY-MM-DD') as holiday_date FROM holidays WHERE company_id = $1 AND TO_CHAR(holiday_date, 'YYYY-MM-DD') BETWEEN $2 AND $3",
            [user.company_id, from, to]
        );
        const leavesQuery = await db.query(
            "SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as leave_date FROM attendance WHERE user_id = $1 AND status = 'on_leave' AND TO_CHAR(created_at, 'YYYY-MM-DD') BETWEEN $2 AND $3",
            [targetUserId, from, to]
        );
        const excludedDates = new Set();
        holidaysQuery.rows.forEach(r => excludedDates.add(r.holiday_date));
        leavesQuery.rows.forEach(r => excludedDates.add(r.leave_date));
        const holidaysCount = excludedDates.size;

        const start = new Date(from);
        const end = new Date(to);

        const formatDate = (dateObj) => {
            const y = dateObj.getFullYear();
            const m = String(dateObj.getMonth() + 1).padStart(2, '0');
            const d = String(dateObj.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        };

        const todayStr = formatDate(new Date());

        const existingLogsQuery = await db.query(
            "SELECT TO_CHAR(log_date, 'YYYY-MM-DD') as log_date FROM daily_salary_logs WHERE user_id = $1 AND log_date BETWEEN $2 AND $3",
            [targetUserId, from, to]
        );
        const existingLogsSet = new Set(existingLogsQuery.rows.map(r => r.log_date));

        const attendanceQuery = await db.query(
            "SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as work_date, total_hours FROM attendance WHERE user_id = $1 AND DATE(created_at) BETWEEN $2 AND $3",
            [targetUserId, from, to]
        );
        const attendanceMap = {};
        attendanceQuery.rows.forEach(r => {
            attendanceMap[r.work_date] = parseFloat(r.total_hours || 0);
        });

        const monthCache = {};
        const getMonthlyParams = async (year, month) => {
            const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
            const endOfMonthObj = new Date(year, month, 0);
            const endOfMonth = `${year}-${String(month).padStart(2, '0')}-${String(endOfMonthObj.getDate()).padStart(2, '0')}`;
            
            const holQuery = await db.query(
                "SELECT TO_CHAR(holiday_date, 'YYYY-MM-DD') as holiday_date FROM holidays WHERE company_id = $1 AND TO_CHAR(holiday_date, 'YYYY-MM-DD') BETWEEN $2 AND $3",
                [user.company_id, startOfMonth, endOfMonth]
            );
            const leaveQuery = await db.query(
                "SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as leave_date FROM attendance WHERE user_id = $1 AND status = 'on_leave' AND TO_CHAR(created_at, 'YYYY-MM-DD') BETWEEN $2 AND $3",
                [targetUserId, startOfMonth, endOfMonth]
            );
            const excludedDates = new Set();
            holQuery.rows.forEach(r => excludedDates.add(r.holiday_date));
            leaveQuery.rows.forEach(r => excludedDates.add(r.leave_date));
            const holCount = excludedDates.size;
            const stdDays = Math.max(26 - holCount, 1);
            return {
                standardDays: stdDays,
                dailyRate: parseFloat(user.basic_salary) / stdDays
            };
        };

        let tempDate = new Date(start);
        while (tempDate <= end) {
            const dateStr = formatDate(tempDate);
            if (!existingLogsSet.has(dateStr) || dateStr === todayStr) {
                const year = tempDate.getFullYear();
                const month = tempDate.getMonth() + 1;
                const cacheKey = `${year}-${month}`;
                if (!monthCache[cacheKey]) {
                    monthCache[cacheKey] = await getMonthlyParams(year, month);
                }
                const { dailyRate } = monthCache[cacheKey];
                const effectiveHours = Math.min(parseFloat(attendanceMap[dateStr] || 0), 8);
                const earnedAmount = dailyRate * (effectiveHours / 8);

                await db.query(`
                    INSERT INTO daily_salary_logs (user_id, log_date, effective_hours, daily_rate, earned_amount)
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (user_id, log_date) DO UPDATE
                    SET effective_hours = EXCLUDED.effective_hours,
                        daily_rate = EXCLUDED.daily_rate,
                        earned_amount = EXCLUDED.earned_amount
                `, [targetUserId, dateStr, effectiveHours, dailyRate.toFixed(2), earnedAmount.toFixed(2)]);
            }
            tempDate.setDate(tempDate.getDate() + 1);
        }

        const logsResult = await db.query(
            "SELECT TO_CHAR(log_date, 'YYYY-MM-DD') as date, effective_hours, daily_rate, earned_amount FROM daily_salary_logs WHERE user_id = $1 AND log_date BETWEEN $2 AND $3 ORDER BY log_date ASC",
            [targetUserId, from, to]
        );

        let totalEffectiveHours = 0;
        let earnedSalary = 0;
        logsResult.rows.forEach(r => {
            totalEffectiveHours += parseFloat(r.effective_hours);
            earnedSalary += parseFloat(r.earned_amount);
        });

        const primaryYear = start.getFullYear();
        const primaryMonth = start.getMonth() + 1;
        const primaryCacheKey = `${primaryYear}-${primaryMonth}`;
        if (!monthCache[primaryCacheKey]) {
            monthCache[primaryCacheKey] = await getMonthlyParams(primaryYear, primaryMonth);
        }
        const { standardDays, dailyRate } = monthCache[primaryCacheKey];

        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const monthName = monthNames[start.getMonth()];
        const yearVal = start.getFullYear();

        const payrollOverrideQuery = await db.query(
            "SELECT * FROM payroll WHERE user_id = $1 AND month = $2 AND year = $3",
            [targetUserId, monthName, yearVal]
        );

        const engineEarned = Math.min(earnedSalary, parseFloat(user.basic_salary));
        const engineDeductions = Math.max(parseFloat(user.basic_salary) - engineEarned, 0);

        let netSalary = engineEarned;
        let deductions = engineDeductions;
        let status = 'pending';

        if (payrollOverrideQuery.rows.length > 0) {
            const payrollRec = payrollOverrideQuery.rows[0];
            netSalary = parseFloat(payrollRec.net_salary);
            deductions = parseFloat(payrollRec.deductions);
            status = payrollRec.status;
        }

        res.json({
            basicSalary: parseFloat(user.basic_salary),
            holidaysCount,
            standardDays,
            totalEffectiveHours: parseFloat(totalEffectiveHours.toFixed(2)),
            actualWorkedDays: parseFloat((totalEffectiveHours / 8).toFixed(2)),
            dailyRate: parseFloat(dailyRate.toFixed(2)),
            earnedSalary: parseFloat(engineEarned.toFixed(2)),
            netSalary: parseFloat(netSalary.toFixed(2)),
            deductions: parseFloat(deductions.toFixed(2)),
            status,
            logs: logsResult.rows.map(r => ({
                date: r.date,
                effectiveHours: parseFloat(r.effective_hours),
                dailyRate: parseFloat(r.daily_rate),
                earnedAmount: parseFloat(r.earned_amount)
            }))
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to calculate salary" });
    }
};

const getEmployeesSummary = async (req, res) => {
    try {
        const { from, to } = req.query;
        if (!from || !to) {
            return res.status(400).json({ message: "Date range is required" });
        }

        const employeesQuery = await db.query(
            "SELECT id, name, email, basic_salary FROM users WHERE company_id = $1 AND role = 'employee' ORDER BY name ASC",
            [req.user.company_id]
        );
        const employees = employeesQuery.rows;

        const start = new Date(from);
        const end = new Date(to);
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const monthName = monthNames[start.getMonth()];
        const yearVal = start.getFullYear();

        const summaryList = [];

        for (const emp of employees) {
            const holidaysQuery = await db.query(
                "SELECT TO_CHAR(holiday_date, 'YYYY-MM-DD') as holiday_date FROM holidays WHERE company_id = $1 AND TO_CHAR(holiday_date, 'YYYY-MM-DD') BETWEEN $2 AND $3",
                [req.user.company_id, from, to]
            );
            const leavesQuery = await db.query(
                "SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as leave_date FROM attendance WHERE user_id = $1 AND status = 'on_leave' AND TO_CHAR(created_at, 'YYYY-MM-DD') BETWEEN $2 AND $3",
                [emp.id, from, to]
            );
            const excludedDates = new Set();
            holidaysQuery.rows.forEach(r => excludedDates.add(r.holiday_date));
            leavesQuery.rows.forEach(r => excludedDates.add(r.leave_date));
            const holidaysCount = excludedDates.size;

            const formatDate = (dateObj) => {
                const y = dateObj.getFullYear();
                const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                const d = String(dateObj.getDate()).padStart(2, '0');
                return `${y}-${m}-${d}`;
            };
            const todayStr = formatDate(new Date());

            const existingLogsQuery = await db.query(
                "SELECT TO_CHAR(log_date, 'YYYY-MM-DD') as log_date FROM daily_salary_logs WHERE user_id = $1 AND log_date BETWEEN $2 AND $3",
                [emp.id, from, to]
            );
            const existingLogsSet = new Set(existingLogsQuery.rows.map(r => r.log_date));

            const attendanceQuery = await db.query(
                "SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as work_date, total_hours FROM attendance WHERE user_id = $1 AND DATE(created_at) BETWEEN $2 AND $3",
                [emp.id, from, to]
            );
            const attendanceMap = {};
            attendanceQuery.rows.forEach(r => {
                attendanceMap[r.work_date] = parseFloat(r.total_hours || 0);
            });

            const getMonthlyParams = async (year, month) => {
                const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
                const endOfMonthObj = new Date(year, month, 0);
                const endOfMonth = `${year}-${String(month).padStart(2, '0')}-${String(endOfMonthObj.getDate()).padStart(2, '0')}`;
                
                const holQuery = await db.query(
                    "SELECT TO_CHAR(holiday_date, 'YYYY-MM-DD') as holiday_date FROM holidays WHERE company_id = $1 AND TO_CHAR(holiday_date, 'YYYY-MM-DD') BETWEEN $2 AND $3",
                    [req.user.company_id, startOfMonth, endOfMonth]
                );
                const leaveQuery = await db.query(
                    "SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as leave_date FROM attendance WHERE user_id = $1 AND status = 'on_leave' AND TO_CHAR(created_at, 'YYYY-MM-DD') BETWEEN $2 AND $3",
                    [emp.id, startOfMonth, endOfMonth]
                );
                const excludedDates = new Set();
                holQuery.rows.forEach(r => excludedDates.add(r.holiday_date));
                leaveQuery.rows.forEach(r => excludedDates.add(r.leave_date));
                const holCount = excludedDates.size;
                const stdDays = Math.max(26 - holCount, 1);
                return {
                    standardDays: stdDays,
                    dailyRate: parseFloat(emp.basic_salary) / stdDays
                };
            };

            const monthCache = {};
            let tempDate = new Date(start);
            while (tempDate <= end) {
                const dateStr = formatDate(tempDate);
                if (!existingLogsSet.has(dateStr) || dateStr === todayStr) {
                    const year = tempDate.getFullYear();
                    const month = tempDate.getMonth() + 1;
                    const cacheKey = `${year}-${month}`;
                    if (!monthCache[cacheKey]) {
                        monthCache[cacheKey] = await getMonthlyParams(year, month);
                    }
                    const { dailyRate } = monthCache[cacheKey];
                    const effectiveHours = Math.min(parseFloat(attendanceMap[dateStr] || 0), 8);
                    const earnedAmount = dailyRate * (effectiveHours / 8);

                    await db.query(`
                        INSERT INTO daily_salary_logs (user_id, log_date, effective_hours, daily_rate, earned_amount)
                        VALUES ($1, $2, $3, $4, $5)
                        ON CONFLICT (user_id, log_date) DO UPDATE
                        SET effective_hours = EXCLUDED.effective_hours,
                            daily_rate = EXCLUDED.daily_rate,
                            earned_amount = EXCLUDED.earned_amount
                    `, [emp.id, dateStr, effectiveHours, dailyRate.toFixed(2), earnedAmount.toFixed(2)]);
                }
                tempDate.setDate(tempDate.getDate() + 1);
            }

            const logsResult = await db.query(
                "SELECT effective_hours, earned_amount FROM daily_salary_logs WHERE user_id = $1 AND log_date BETWEEN $2 AND $3",
                [emp.id, from, to]
            );

            let totalEffectiveHours = 0;
            let earnedSalary = 0;
            logsResult.rows.forEach(r => {
                totalEffectiveHours += parseFloat(r.effective_hours);
                earnedSalary += parseFloat(r.earned_amount);
            });

            const primaryYear = start.getFullYear();
            const primaryMonth = start.getMonth() + 1;
            const primaryCacheKey = `${primaryYear}-${primaryMonth}`;
            let standardDays = 26;
            let dailyRate = parseFloat(emp.basic_salary) / 26;
            if (monthCache[primaryCacheKey]) {
                standardDays = monthCache[primaryCacheKey].standardDays;
                dailyRate = monthCache[primaryCacheKey].dailyRate;
            } else {
                const params = await getMonthlyParams(primaryYear, primaryMonth);
                standardDays = params.standardDays;
                dailyRate = params.dailyRate;
            }

            const payrollOverrideQuery = await db.query(
                "SELECT * FROM payroll WHERE user_id = $1 AND month = $2 AND year = $3",
                [emp.id, monthName, yearVal]
            );

            const engineEarned = Math.min(earnedSalary, parseFloat(emp.basic_salary));
            const engineDeductions = Math.max(parseFloat(emp.basic_salary) - engineEarned, 0);

            let netSalary = engineEarned;
            let deductions = engineDeductions;
            let status = 'pending';

            if (payrollOverrideQuery.rows.length > 0) {
                const payrollRec = payrollOverrideQuery.rows[0];
                netSalary = parseFloat(payrollRec.net_salary);
                deductions = parseFloat(payrollRec.deductions);
                status = payrollRec.status;
            }

            summaryList.push({
                id: emp.id,
                name: emp.name,
                email: emp.email,
                basicSalary: parseFloat(emp.basic_salary),
                standardDays,
                holidaysCount,
                totalEffectiveHours: parseFloat(totalEffectiveHours.toFixed(2)),
                actualWorkedDays: parseFloat((totalEffectiveHours / 8).toFixed(2)),
                dailyRate: parseFloat(dailyRate.toFixed(2)),
                earnedSalary: parseFloat(engineEarned.toFixed(2)),
                netSalary: parseFloat(netSalary.toFixed(2)),
                deductions: parseFloat(deductions.toFixed(2)),
                status
            });
        }

        res.json(summaryList);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to get employees summary" });
    }
};

const saveOverridePay = async (req, res) => {
    try {
        const { user_id, month, year, net_salary, status } = req.body;
        if (!user_id || !month || !year || net_salary === undefined) {
            return res.status(400).json({ message: "Missing required payroll override parameters" });
        }

        const userQuery = await db.query(
            "SELECT id, name, basic_salary FROM users WHERE id = $1",
            [user_id]
        );
        if (userQuery.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        const user = userQuery.rows[0];

        const basicSalary = parseFloat(user.basic_salary);
        const netSalary = parseFloat(net_salary);
        const deductions = Math.max(basicSalary - netSalary, 0);
        const currentStatus = status || 'pending';

        const existingPayrollQuery = await db.query(
            "SELECT * FROM payroll WHERE user_id = $1 AND month = $2 AND year = $3",
            [user_id, month, year]
        );

        let result;
        if (existingPayrollQuery.rows.length > 0) {
            result = await db.query(
                "UPDATE payroll SET net_salary = $1, deductions = $2, status = $3, paid_at = CURRENT_TIMESTAMP WHERE user_id = $4 AND month = $5 AND year = $6 RETURNING *",
                [netSalary, deductions, currentStatus, user_id, month, year]
            );
        } else {
            result = await db.query(
                "INSERT INTO payroll (user_id, month, year, basic_salary, allowances, deductions, net_salary, status) VALUES ($1, $2, $3, $4, 0, $5, $6, $7) RETURNING *",
                [user_id, month, year, basicSalary, deductions, netSalary, currentStatus]
            );
        }

        if (currentStatus === 'paid') {
            await createNotification(
                user_id,
                'Salary Credited',
                `Your payroll for ${month} ${year} has been processed. Net Salary: ₹${netSalary.toLocaleString('en-IN')}.`
            );
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to save payroll override" });
    }
};

module.exports = { getPayroll, generatePayroll, deletePayroll, calculateSalary, getEmployeesSummary, saveOverridePay };
