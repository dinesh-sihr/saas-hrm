const db = require('../config/db');
const { logActivity } = require('../utils/activityLogger');

const getMeetings = async (req, res) => {
    const query = `
        SELECT m.*, 
               mp.status as user_status, 
               mp.joined_at,
               (SELECT COUNT(*) FROM meeting_participants WHERE meeting_id = m.id) as participant_count
        FROM meetings m
        LEFT JOIN meeting_participants mp ON m.id = mp.meeting_id AND mp.user_id = $1
        WHERE m.company_id = $2
        ORDER BY m.scheduled_at DESC
    `;
    const result = await db.query(query, [req.user.id, req.user.company_id]);
    res.json(result.rows);
};

const createMeeting = async (req, res) => {
    const { title, scheduled_at, participantIds } = req.body;
    
    const meetingResult = await db.query(
        'INSERT INTO meetings (company_id, title, scheduled_at) VALUES ($1, $2, $3) RETURNING *',
        [req.user.company_id, title, scheduled_at]
    );
    const meeting = meetingResult.rows[0];

    if (participantIds && participantIds.length > 0) {
        const queryParams = [meeting.id];
        const valueRows = [];
        for (let i = 0; i < participantIds.length; i++) {
            queryParams.push(participantIds[i]);
            valueRows.push(`($1, $${i + 2})`);
        }
        await db.query(
            `INSERT INTO meeting_participants (meeting_id, user_id) VALUES ${valueRows.join(', ')}`,
            queryParams
        );
    }

    await logActivity(req.user.company_id, req.user.id, `scheduled a new meeting: ${title}`, 'Meeting Sync', '#8b5cf6');

    res.status(201).json(meeting);
};

const joinMeeting = async (req, res) => {
    const { id } = req.params;
    const result = await db.query(
        'UPDATE meeting_participants SET joined_at = CURRENT_TIMESTAMP, status = $1 WHERE meeting_id = $2 AND user_id = $3 RETURNING *',
        ['attended', id, req.user.id]
    );
    
    if (result.rows.length === 0) {
        await db.query(
            'INSERT INTO meeting_participants (meeting_id, user_id, joined_at, status) VALUES ($1, $2, CURRENT_TIMESTAMP, $3)',
            [id, req.user.id, 'attended']
        );
    }
    
    await logActivity(req.user.company_id, req.user.id, `joined the meeting`, 'Call Started', '#10b981');

    res.json({ success: true });
};

module.exports = { getMeetings, createMeeting, joinMeeting };
