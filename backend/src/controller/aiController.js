const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../config/db');
const { createNotification } = require('./notificationController');

const getContextData = async (user) => {
    const toIST = (dateStr) => {
        if (!dateStr) return null;
        return new Date(dateStr).toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    };

    let contextText = '';

    if (user.role === 'super_admin') {
        const companies = await db.query('SELECT name, email, status, created_at FROM companies');
        const subscriptions = await db.query('SELECT company_id, plan, status, end_date FROM subscriptions');
        const users = await db.query('SELECT name, email, role FROM users');

        contextText = `You are a Super Admin Assistant. 
        Companies: ${JSON.stringify(companies.rows.map(c => ({ ...c, created_at: toIST(c.created_at) })))}. 
        Subscriptions: ${JSON.stringify(subscriptions.rows.map(s => ({ ...s, end_date: toIST(s.end_date) })))}. 
        System Users: ${JSON.stringify(users.rows)}. 
        Answer queries about platform management and tenant oversight.`;
    }
    else if (user.role === 'manager') {
        const [employees, assets, leaves, attendance, payroll, rewards] = await Promise.all([
            db.query('SELECT id, name, email, role FROM users WHERE company_id = $1', [user.company_id]),
            db.query('SELECT name, serial_number, status, user_id FROM assets WHERE company_id = $1', [user.company_id]),
            db.query(`SELECT u.name, l.type, l.status, l.from_date, l.to_date FROM leave_requests l JOIN users u ON l.user_id = u.id WHERE u.company_id = $1`, [user.company_id]),
            db.query(`SELECT u.name, a.check_in, a.check_out, a.total_hours, a.status FROM attendance a JOIN users u ON a.user_id = u.id WHERE u.company_id = $1 ORDER BY a.created_at DESC LIMIT 50`, [user.company_id]),
            db.query(`SELECT u.name, p.month, p.year, p.basic_salary, p.allowances, p.deductions, p.net_salary FROM payroll p JOIN users u ON p.user_id = u.id WHERE u.company_id = $1`, [user.company_id]),
            db.query(`SELECT u.name as receiver, r.reward_type, r.points, r.message FROM rewards r JOIN users u ON r.user_id = u.id WHERE u.company_id = $1`, [user.company_id])
        ]);

        contextText = `You are a Manager Assistant for the company with ID ${user.company_id}. 
        Team: ${JSON.stringify(employees.rows)}. 
        Inventory: ${JSON.stringify(assets.rows)}. 
        Leave Requests: ${JSON.stringify(leaves.rows.map(l => ({ ...l, from_date: toIST(l.from_date), to_date: toIST(l.to_date) })))}. 
        Recent Attendance (IST): ${JSON.stringify(attendance.rows.map(a => ({ ...a, check_in: toIST(a.check_in), check_out: toIST(a.check_out) })))}. 
        Payroll History: ${JSON.stringify(payroll.rows)}. 
        Rewards Given: ${JSON.stringify(rewards.rows)}. 
        Help with HR operations and team tracking.`;
    }
    else {
        const [myAttendance, myLeaves, myAssets, myPayroll, myRewards] = await Promise.all([
            db.query('SELECT check_in, check_out, total_hours, status, created_at FROM attendance WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30', [user.id]),
            db.query('SELECT type, status, from_date, to_date, reason FROM leave_requests WHERE user_id = $1', [user.id]),
            db.query('SELECT name, serial_number, status FROM assets WHERE user_id = $1', [user.id]),
            db.query('SELECT month, year, basic_salary, allowances, deductions, net_salary, status FROM payroll WHERE user_id = $1', [user.id]),
            db.query('SELECT reward_type, points, message FROM rewards WHERE user_id = $1', [user.id])
        ]);

        contextText = `You are a Personal HR Assistant for ${user.name}. 
        Your Attendance (IST): ${JSON.stringify(myAttendance.rows.map(a => ({ ...a, check_in: toIST(a.check_in), check_out: toIST(a.check_out), created_at: toIST(a.created_at) })))}. 
        Your Leaves: ${JSON.stringify(myLeaves.rows.map(l => ({ ...l, from_date: toIST(l.from_date), to_date: toIST(l.to_date) })))}. 
        Your Assigned Assets: ${JSON.stringify(myAssets.rows)}. 
        Your Payroll: ${JSON.stringify(myPayroll.rows)}. 
        Your Rewards: ${JSON.stringify(myRewards.rows)}. 
        Help the user understand their records and company benefits.`;
    }

    return contextText;
};

const chatWithAI = async (req, res) => {
    const { message } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error('GEMINI_API_KEY is missing in environment variables');
        return res.status(500).json({ message: 'Chat service is currently unavailable. Please check configuration.' });
    }

    await db.query('INSERT INTO chat_history (user_id, role, message) VALUES ($1, $2, $3)', [req.user.id, 'user', message]);

    let context = await getContextData(req.user);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const currentTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    const prompt = `
        Current System Time (IST): ${currentTime}
        User Profile: ${req.user.name} (Role: ${req.user.role})
        
        Context Data (User Records): ${context}
        
        User Question: ${message}
        
        Strict Instructions:
        1. Use the provided Context Data to answer accurately. 
        2. All timestamps and dates in the Context Data are already in IST (Asia/Kolkata). Do not perform further conversions.
        3. For attendance, always check the date. If the user asks about "today", look for records matching ${new Date().toISOString().split('T')[0]}.
        4. Use "total_hours" from the data if available to report durations.
        5. If "check_in" or "check_out" are missing for today, mention that the user might still be clocked in or hasn't started yet.
        6. Provide the response in PLAIN TEXT ONLY. Absolutely no markdown (no stars, no bolding, no headers).
        7. Be conversational, human, and professional.
    `;

    const result = await model.generateContent(prompt);

    if (!result || !result.response) {
        throw new Error('Invalid response from AI provider');
    }

    let aiResponse = result.response.text();
    if (!aiResponse) {
        aiResponse = "I'm sorry, I'm having trouble processing that request. Could you try rephrasing it?";
    }

    aiResponse = aiResponse.replace(/[\*\#\_]/g, '').trim();

    await db.query('INSERT INTO chat_history (user_id, role, message) VALUES ($1, $2, $3)', [req.user.id, 'ai', aiResponse]);

    res.json({ response: aiResponse });
};

const getChatHistory = async (req, res) => {
    const result = await db.query('SELECT role, message, created_at FROM chat_history WHERE user_id = $1 ORDER BY created_at ASC', [req.user.id]);
    res.json(result.rows);
};

const clearChatHistory = async (req, res) => {
    await db.query('DELETE FROM chat_history WHERE user_id = $1', [req.user.id]);
    res.json({ message: 'Chat history cleared' });
};

const generateAISummary = async (metrics, userName, role) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.warn('GEMINI_API_KEY missing - falling back to rule-based summary');
        return metrics.trend.status === 'improved' 
            ? "You're on a roll! Great consistency and faster completion this week." 
            : "A bit of a slow week, but you've got this. Let's clear those pending tasks.";
    }

    try {
        console.log(`Generating humanized AI summary for ${userName}...`);
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        
        const prompt = `
            Analyze this performance for ${userName} (${role}):
            - Tasks: ${metrics.tasks.completed}/${metrics.tasks.total}
            - Speed: ${metrics.tasks.avgSpeed}h avg
            - Punctuality: ${metrics.attendance.onTimeRate}% on-time
            - Meetings: ${metrics.meetings.onTimeRate}% on-time attendance
            - Notice Reaction: ${metrics.notices.avgReactionTime}h avg response
            - Trend: ${metrics.trend.value}% ${metrics.trend.status}
            
            Write a very short, 1-2 sentence summary as if a friendly manager is speaking directly to them. 
            Avoid corporate jargon. Be direct, warm, and brief. No markdown. PLAIN TEXT.
        `;
        
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        console.log('AI Summary generated successfully');
        return text;
    } catch (err) {
        console.error('AI Summary Error:', err.message);
        return metrics.trend.status === 'improved' 
            ? "You're doing great lately! Keep that same energy going." 
            : "Focus on finishing your active tasks to get your trend back up.";
    }
};

const getPerformanceMetrics = async (userId, companyId, userName, role, forceRefresh = false, skipGemini = false) => {
    if (!forceRefresh) {
        const cached = await db.query(
            "SELECT * FROM performance_insights WHERE user_id = $1 AND calculated_at > CURRENT_TIMESTAMP - INTERVAL '1 hour' ORDER BY calculated_at DESC LIMIT 1",
            [userId]
        );
        if (cached.rows.length > 0) {
            const metrics = cached.rows[0].metrics_json;
            return {
                ...metrics,
                meetings: metrics.meetings || { onTimeRate: 100 },
                notices: metrics.notices || { avgReactionTime: 0 },
                aiSummary: cached.rows[0].ai_summary,
                cachedAt: cached.rows[0].calculated_at
            };
        }
    }

    const taskStats = await db.query(`
        SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
            AVG(CASE WHEN status = 'completed' AND updated_at IS NOT NULL 
                THEN EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600 
                ELSE NULL END) as avg_hours_to_complete
        FROM tasks 
        WHERE assigned_to = $1
    `, [userId]);

    const attendanceStats = await db.query(`
        SELECT 
            AVG(total_hours) as avg_daily_hours,
            COUNT(*) as total_days,
            COUNT(CASE WHEN EXTRACT(HOUR FROM check_in) < 10 THEN 1 END) as on_time_count
        FROM attendance 
        WHERE user_id = $1
    `, [userId]);

    const meetingStats = await db.query(`
        SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN mp.joined_at <= m.scheduled_at THEN 1 END) as on_time
        FROM meeting_participants mp
        JOIN meetings m ON mp.meeting_id = m.id
        WHERE mp.user_id = $1
    `, [userId]);

    const noticeStats = await db.query(`
        SELECT 
            AVG(EXTRACT(EPOCH FROM (ar.read_at - a.created_at)) / 3600) as avg_reaction_hours
        FROM announcement_reads ar
        JOIN announcements a ON ar.announcement_id = a.id
        WHERE ar.user_id = $1
    `, [userId]);

    const trendStats = await db.query(`
        WITH periods AS (
            SELECT 
                CASE 
                    WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 'current'
                    WHEN created_at >= CURRENT_DATE - INTERVAL '14 days' AND created_at < CURRENT_DATE - INTERVAL '7 days' THEN 'previous'
                END as period,
                status
            FROM tasks
            WHERE assigned_to = $1 AND created_at >= CURRENT_DATE - INTERVAL '14 days'
        )
        SELECT 
            period,
            COUNT(*) as total,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
        FROM periods
        WHERE period IS NOT NULL
        GROUP BY period
    `, [userId]);

    const current = trendStats.rows.find(r => r.period === 'current') || { total: 0, completed: 0 };
    const previous = trendStats.rows.find(r => r.period === 'previous') || { total: 0, completed: 0 };

    const currentScore = current.total > 0 ? (current.completed / current.total) * 100 : 0;
    const previousScore = previous.total > 0 ? (previous.completed / previous.total) * 100 : 0;

    let improvement = 0;
    if (previousScore > 0) {
        improvement = Math.round(((currentScore - previousScore) / previousScore) * 100);
    } else if (currentScore > 0) {
        improvement = 100; 
    }

    const meetingRate = meetingStats.rows[0].total > 0
        ? Math.round((meetingStats.rows[0].on_time / meetingStats.rows[0].total) * 100)
        : 100;
    
    const reactionTime = parseFloat(noticeStats.rows[0].avg_reaction_hours || 0);
    const reactionScore = Math.max(0, 100 - (reactionTime * 5)); // 20h = 0 score
    
    const completionRate = taskStats.rows[0].total > 0 
        ? Math.round((taskStats.rows[0].completed / taskStats.rows[0].total) * 100) 
        : 0;

    const punctualityRate = attendanceStats.rows[0].total_days > 0 
        ? Math.round((attendanceStats.rows[0].on_time_count / attendanceStats.rows[0].total_days) * 100) 
        : 0;

    const groupStats = await db.query(`
        SELECT COUNT(*) as synergy_count 
        FROM activities 
        WHERE user_id = $1 AND action LIKE '%collaborated to complete group task%'
    `, [userId]);

    const synergyBonus = Math.min(15, (parseInt(groupStats.rows[0].synergy_count) || 0) * 5);

    const collaborationScore = Math.min(100, Math.round((meetingRate * 0.5) + (reactionScore * 0.3) + synergyBonus));
    const coordinationScore = Math.round((completionRate * 0.5) + (punctualityRate * 0.5));
    
    let behaviorType = "Developing Talent";
    if (collaborationScore > 80 && coordinationScore > 80) behaviorType = "The Catalyst";
    else if (coordinationScore > 85 && collaborationScore < 60) behaviorType = "The Focused Soloist";
    else if (collaborationScore > 85 && coordinationScore < 60) behaviorType = "The Team Pillar";
    else if (coordinationScore > 75 && parseFloat(taskStats.rows[0].avg_hours_to_complete) > 12) behaviorType = "The Architect";
    else if (collaborationScore > 50 && coordinationScore > 50) behaviorType = "Reliable Performer";

    const companyAvgQuery = await db.query(`
        SELECT 
            AVG(collaboration_avg) as avg_collab,
            AVG(coordination_avg) as avg_coord
        FROM (
            SELECT 
                (metrics_json->'behavioral'->>'collaboration')::int as collaboration_avg,
                (metrics_json->'behavioral'->>'coordination')::int as coordination_avg
            FROM performance_insights pi
            JOIN users u ON pi.user_id = u.id
            WHERE u.company_id = $1 AND u.role = 'employee'
        ) as sub
    `, [companyId]);

    const companyAvg = {
        collaboration: Math.round(parseFloat(companyAvgQuery.rows[0]?.avg_collab || 0)),
        coordination: Math.round(parseFloat(companyAvgQuery.rows[0]?.avg_coord || 0))
    };

    const metrics = {
        tasks: {
            total: parseInt(taskStats.rows[0].total) || 0,
            completed: parseInt(taskStats.rows[0].completed) || 0,
            avgSpeed: parseFloat(taskStats.rows[0].avg_hours_to_complete || 0).toFixed(1)
        },
        attendance: {
            avgHours: parseFloat(attendanceStats.rows[0].avg_daily_hours || 0).toFixed(1),
            onTimeRate: punctualityRate
        },
        meetings: {
            onTimeRate: meetingRate
        },
        notices: {
            avgReactionTime: reactionTime.toFixed(1)
        },
        behavioral: {
            collaboration: collaborationScore,
            coordination: coordinationScore,
            type: behaviorType,
            map: [
                { subject: 'Collaboration', A: collaborationScore, fullMark: 100 },
                { subject: 'Punctuality', A: punctualityRate, fullMark: 100 },
                { subject: 'Completion', A: completionRate, fullMark: 100 },
                { subject: 'Reaction', A: reactionScore, fullMark: 100 },
                { subject: 'Reliability', A: Math.round((collaborationScore + coordinationScore) / 2), fullMark: 100 }
            ],
            benchmarks: {
                companyAvg: companyAvg,
                isAboveCollab: collaborationScore >= companyAvg.collaboration,
                isAboveCoord: coordinationScore >= companyAvg.coordination
            }
        },
        trend: {
            value: improvement,
            status: improvement >= 0 ? 'improved' : 'declined'
        }
    };

    metrics.aiSummary = metrics.trend.status === 'improved'
        ? "You're doing great lately! Keep that same energy going."
        : "Focus on finishing your active tasks to get your trend back up.";

    await db.query("DELETE FROM performance_insights WHERE user_id = $1", [userId]);
    await db.query(
        "INSERT INTO performance_insights (user_id, metrics_json, ai_summary) VALUES ($1, $2, $3)",
        [userId, JSON.stringify(metrics), metrics.aiSummary]
    );

    if (!skipGemini && process.env.GEMINI_API_KEY) {
        generateAISummary(metrics, userName, role).then(async (aiSummary) => {
            if (aiSummary) {
                await db.query(
                    "UPDATE performance_insights SET ai_summary = $1 WHERE user_id = $2",
                    [aiSummary, userId]
                );
            }
        }).catch(err => {
            console.error('Background AI Summary generation failed:', err);
        });
    }

    if (metrics.trend.status === 'declined' && Math.abs(metrics.trend.value) > 5) {
        await createNotification(
            userId,
            "Performance Trend Alert",
            `Your performance trend has declined by ${Math.abs(metrics.trend.value)}%. Check your AI Insights for personalized advice.`
        );

        const managerQuery = await db.query(
            "SELECT id FROM users WHERE role = 'manager' AND company_id = $1 LIMIT 1",
            [companyId]
        );
        if (managerQuery.rows.length > 0) {
            await createNotification(
                managerQuery.rows[0].id,
                "Employee Performance Warning",
                `${userName}'s performance trend has declined by ${Math.abs(metrics.trend.value)}%. You may want to review their recent workload.`
            );
        }
    }

    return metrics;
};

const getInsights = async (req, res) => {
    const metrics = await getPerformanceMetrics(req.user.id, req.user.company_id, req.user.name, req.user.role, req.query.refresh === 'true');
    res.json(metrics);
};

const getTeamInsights = async (req, res) => {
    if (req.user.role !== 'manager' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized' });
    }

    const employees = await db.query(
        'SELECT id, name, role FROM users WHERE company_id = $1 AND role = $2',
        [req.user.company_id, 'employee']
    );

    const teamMetrics = await Promise.all(employees.rows.map(async (emp) => {
        const metrics = await getPerformanceMetrics(emp.id, req.user.company_id, emp.name, emp.role, req.query.refresh === 'true', true);
        return {
            id: emp.id,
            name: emp.name,
            ...metrics
        };
    }));

    res.json(teamMetrics);
};

const refreshInsights = async (req, res) => {
    const { userId } = req.params;
    
    const targetUser = await db.query("SELECT company_id, name, role FROM users WHERE id = $1", [userId]);
    if (targetUser.rows.length === 0) return res.status(404).json({ message: 'User not found' });

    if (req.user.role !== 'manager' && req.user.id != userId) {
        return res.status(403).json({ message: 'Unauthorized refresh' });
    }

    const metrics = await getPerformanceMetrics(
        userId, 
        targetUser.rows[0].company_id, 
        targetUser.rows[0].name, 
        targetUser.rows[0].role, 
        true
    );
    res.json(metrics);
};

const getTeamAggregate = async (req, res) => {
    if (req.user.role !== 'manager' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized' });
    }

    try {
        const teamData = await db.query(`
            SELECT 
                pi.metrics_json, 
                u.name, 
                u.role, 
                pi.ai_summary,
                u.id as user_id
            FROM (
                SELECT DISTINCT ON (user_id) *
                FROM performance_insights
                ORDER BY user_id, calculated_at DESC
            ) pi
            JOIN users u ON pi.user_id = u.id
            WHERE u.company_id = $1
        `, [req.user.company_id]);

        if (teamData.rows.length === 0) {
            return res.json({ 
                behavioral: { 
                    collaboration: 0, 
                    coordination: 0, 
                    type: 'N/A',
                    map: [] 
                },
                teamList: [],
                aiSummary: "No team performance data available yet."
            });
        }

        const teamList = teamData.rows.map(row => ({
            id: row.user_id,
            name: row.name,
            role: row.role,
            collaboration: row.metrics_json.behavioral?.collaboration || 0,
            coordination: row.metrics_json.behavioral?.coordination || 0,
            type: row.metrics_json.behavioral?.type || 'Standard Pro',
            summary: row.ai_summary
        }));

        const distribution = {};
        teamList.forEach(m => {
            distribution[m.type] = (distribution[m.type] || 0) + 1;
        });

        const trendData = await db.query(`
            SELECT 
                TO_CHAR(created_at, 'Dy') as day,
                COUNT(*) as count,
                DATE(created_at) as date_val
            FROM activities
            WHERE company_id = $1 
              AND action LIKE '%collaborated%'
              AND created_at >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY date_val, day
            ORDER BY date_val ASC
        `, [req.user.company_id]);

        const employeeData = teamData.rows.filter(r => r.role === 'employee');
        const count = employeeData.length || 1;
        let totalCollab = 0;
        let totalCoord = 0;
        let mapSums = [0, 0, 0, 0, 0];
        const subjects = ['Collaboration', 'Punctuality', 'Completion', 'Reaction', 'Reliability'];

        employeeData.forEach(row => {
            const m = row.metrics_json;
            totalCollab += m.behavioral?.collaboration || 0;
            totalCoord += m.behavioral?.coordination || 0;
            (m.behavioral?.map || []).forEach((point, i) => {
                mapSums[i] += point.A || 0;
            });
        });

        const avgCollab = Math.round(totalCollab / count);
        const avgCoord = Math.round(totalCoord / count);
        
        let teamType = "Growing Organization";
        if (avgCollab > 75 && avgCoord > 75) teamType = "High-Performance Unit";
        else if (avgCollab > 75) teamType = "Collaborative Community";
        else if (avgCoord > 75) teamType = "Operationally Disciplined";

        res.json({
            behavioral: {
                collaboration: avgCollab,
                coordination: avgCoord,
                type: teamType,
                map: subjects.map((s, i) => ({ subject: s, A: Math.round(mapSums[i] / count) }))
            },
            teamList: teamList,
            distribution,
            synergyTrend: trendData.rows,
            aiSummary: `Your team of ${employeeData.length} is currently operating as a ${teamType}. Overall coordination is at ${avgCoord}% and collaboration at ${avgCollab}%.`
        });
    } catch (err) {
        console.error('Aggregate Error:', err);
        res.status(500).json({ message: 'Failed to aggregate team data' });
    }
};

module.exports = {
    chatWithAI,
    getChatHistory,
    clearChatHistory,
    getInsights,
    getTeamInsights,
    getTeamAggregate,
    refreshInsights
};
