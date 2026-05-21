const db = require('../config/db');
const { createNotification } = require('./notificationController');

const getAssets = async (req, res) => {
    const fetchQuery = req.user.role === 'employee' 
        ? 'SELECT a.*, u.name as assigned_to FROM assets a LEFT JOIN users u ON a.user_id = u.id WHERE a.user_id = $1 ORDER BY a.created_at DESC'
        : 'SELECT a.*, u.name as assigned_to FROM assets a LEFT JOIN users u ON a.user_id = u.id WHERE a.company_id = $1 ORDER BY a.created_at DESC';
    
    const queryParams = req.user.role === 'employee' ? [req.user.id] : [req.user.company_id];
    const assetRecords = await db.query(fetchQuery, queryParams);
    res.json(assetRecords.rows);
};

const addAsset = async (req, res) => {
    const { name, serial_number, status, user_id } = req.body;
    const newAssetResult = await db.query(
        'INSERT INTO assets (name, serial_number, status, user_id, company_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [name, serial_number, status || 'available', user_id || null, req.user.company_id]
    );

    if (user_id) {
        await createNotification(
            user_id,
            'New Asset Assigned',
            `A new asset "${name}" (${serial_number}) has been assigned to you.`
        );
    }

    res.status(201).json(newAssetResult.rows[0]);
};

const updateAsset = async (req, res) => {
    const { id } = req.params;
    const { name, serial_number, status, user_id } = req.body;
    const currentAsset = await db.query('SELECT user_id FROM assets WHERE id = $1', [id]);
    
    const updatedAssetResult = await db.query(
        'UPDATE assets SET name = $1, serial_number = $2, status = $3, user_id = $4 WHERE id = $5 AND company_id = $6 RETURNING *',
        [name, serial_number, status, user_id || null, id, req.user.company_id]
    );

    if (updatedAssetResult.rows.length === 0) {
        return res.status(404).json({ message: 'We couldn’t find that asset in our records.' });
    }

    if (user_id && (!currentAsset.rows[0] || currentAsset.rows[0].user_id !== parseInt(user_id))) {
        await createNotification(
            user_id,
            'Asset Assignment Update',
            `The asset "${name}" has been assigned to you. Please check your assigned assets.`
        );
    }

    res.json(updatedAssetResult.rows[0]);
};

const deleteAsset = async (req, res) => {
    const { id } = req.params;
    const deleteResult = await db.query('DELETE FROM assets WHERE id = $1 AND company_id = $2', [id, req.user.company_id]);
    if (deleteResult.rowCount === 0) {
        return res.status(404).json({ message: 'The asset record you’re trying to delete wasn’t found.' });
    }
    res.json({ message: 'The asset record has been successfully removed.' });
};

module.exports = { getAssets, addAsset, updateAsset, deleteAsset };
