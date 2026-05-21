const db = require('../config/db');

const getHolidays = async (req, res) => {
    const result = await db.query(
        'SELECT * FROM holidays WHERE company_id = $1 ORDER BY holiday_date ASC',
        [req.user.company_id]
    );
    res.json(result.rows);
};

const addHoliday = async (req, res) => {
    const { name, holiday_date } = req.body;
    const result = await db.query(
        'INSERT INTO holidays (name, holiday_date, company_id) VALUES ($1, $2, $3) RETURNING *',
        [name, holiday_date, req.user.company_id]
    );
    res.status(201).json(result.rows[0]);
};

const updateHoliday = async (req, res) => {
    const { id } = req.params;
    const { name, holiday_date } = req.body;
    const result = await db.query(
        'UPDATE holidays SET name = $1, holiday_date = $2 WHERE id = $3 AND company_id = $4 RETURNING *',
        [name, holiday_date, id, req.user.company_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Holiday not found' });
    res.json(result.rows[0]);
};

const deleteHoliday = async (req, res) => {
    const { id } = req.params;
    const result = await db.query('DELETE FROM holidays WHERE id = $1 AND company_id = $2', [id, req.user.company_id]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Holiday not found' });
    res.json({ message: 'Holiday deleted successfully' });
};

module.exports = { getHolidays, addHoliday, updateHoliday, deleteHoliday };
