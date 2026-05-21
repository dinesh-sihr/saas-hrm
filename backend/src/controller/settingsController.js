const db = require('../config/db');

const getSettings = async (req, res) => {
    const result = await db.query('SELECT * FROM site_settings');
    const settings = {};
    result.rows.forEach(row => {
        settings[row.key] = row.value;
    });
    res.json(settings);
};

const updateSettings = async (req, res) => {
    const settings = req.body;
    for (const [key, value] of Object.entries(settings)) {
        await db.query(
            `INSERT INTO site_settings (key, value) 
             VALUES ($1, $2) 
             ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
            [key, value]
        );
    }
    res.json({ message: 'Settings updated successfully' });
};

module.exports = {
    getSettings,
    updateSettings
};
