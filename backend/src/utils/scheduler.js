const db = require('../config/db');
const { createNotification } = require('../controller/notificationController');

const initScheduler = () => {
    setInterval(async () => {
        const now = new Date();
        const istOptions = { timeZone: 'Asia/Kolkata', hour: '2-digit', hour12: false, minute: '2-digit' };
        const istTimeString = now.toLocaleTimeString('en-US', istOptions);
        
        if (istTimeString === '19:00') {
            try {
                const activeSessions = await db.query(
                    "SELECT id, check_in FROM attendance WHERE check_out IS NULL AND DATE(created_at) = CURRENT_DATE"
                );

                for (const session of activeSessions.rows) {
                    const checkInTime = new Date(session.check_in);
                    const forceCheckoutTime = new Date();
                    const totalHours = (forceCheckoutTime - checkInTime) / 3600000;

                    await db.query(
                        "UPDATE attendance SET check_out = $1, total_hours = $2 WHERE id = $3",
                        [forceCheckoutTime, totalHours.toFixed(2), session.id]
                    );
                }
                if (activeSessions.rows.length > 0) {
                    console.log(`[Scheduler] Automatically clocked out ${activeSessions.rows.length} users.`);
                }

                const employees = await db.query(
                    "SELECT id, company_id, basic_salary FROM users WHERE role = 'employee'"
                );

                const istDateString = now.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' });
                const [m, d, y] = istDateString.split('/');
                const year = parseInt(y);
                const month = parseInt(m);
                const day = parseInt(d);

                const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
                const endOfMonthObj = new Date(year, month, 0);
                const endOfMonth = `${year}-${String(month).padStart(2, '0')}-${String(endOfMonthObj.getDate()).padStart(2, '0')}`;
                const todayStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

                for (const emp of employees.rows) {
                    const holQuery = await db.query(
                        "SELECT TO_CHAR(holiday_date, 'YYYY-MM-DD') as holiday_date FROM holidays WHERE company_id = $1 AND TO_CHAR(holiday_date, 'YYYY-MM-DD') BETWEEN $2 AND $3",
                        [emp.company_id, startOfMonth, endOfMonth]
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
                    const dailyRate = parseFloat(emp.basic_salary) / stdDays;

                    const attendanceQuery = await db.query(
                        "SELECT total_hours FROM attendance WHERE user_id = $1 AND DATE(created_at) = $2",
                        [emp.id, todayStr]
                    );
                    
                    let totalHours = 0;
                    if (attendanceQuery.rows.length > 0) {
                        totalHours = parseFloat(attendanceQuery.rows[0].total_hours || 0);
                    }
                    
                    const effectiveHours = Math.min(totalHours, 8);
                    const earnedAmount = dailyRate * (effectiveHours / 8);

                    await db.query(`
                        INSERT INTO daily_salary_logs (user_id, log_date, effective_hours, daily_rate, earned_amount)
                        VALUES ($1, $2, $3, $4, $5)
                        ON CONFLICT (user_id, log_date) DO UPDATE
                        SET effective_hours = EXCLUDED.effective_hours,
                            daily_rate = EXCLUDED.daily_rate,
                            earned_amount = EXCLUDED.earned_amount
                    `, [emp.id, todayStr, effectiveHours, dailyRate.toFixed(2), earnedAmount.toFixed(2)]);
                }
            } catch (error) {
                console.error('[Scheduler] Auto tap-out failed:', error);
            }
        }

        if (istTimeString === '10:00') {
            try {
                const companies = await db.query("SELECT id FROM companies");
                
                for (const company of companies.rows) {
                    const absenteeQuery = `
                        SELECT u.id, u.name 
                        FROM users u 
                        WHERE u.company_id = $1 
                        AND u.role = 'employee' 
                        AND u.id NOT IN (
                            SELECT user_id 
                            FROM attendance 
                            WHERE DATE(created_at) = CURRENT_DATE
                        )
                    `;
                    const absentees = await db.query(absenteeQuery, [company.id]);

                    if (absentees.rows.length > 0) {
                        const absenteeNames = absentees.rows.map(a => a.name).join(', ');
                        
                        const manager = await db.query(
                            "SELECT id FROM users WHERE company_id = $1 AND role = 'manager' LIMIT 1",
                            [company.id]
                        );

                        if (manager.rows.length > 0) {
                            await createNotification(
                                manager.rows[0].id,
                                "Daily Absentee Report",
                                `The following ${absentees.rows.length} employees have not tapped in by 10:00 AM: ${absenteeNames}`
                            );
                        }
                    }
                }
                console.log(`[Scheduler] Dispatched absentee reports for ${companies.rows.length} companies.`);
            } catch (error) {
                console.error('[Scheduler] Absentee reporting failed:', error);
            }
        }
    }, 60000); 
};

module.exports = initScheduler;
