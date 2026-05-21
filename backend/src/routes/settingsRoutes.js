const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controller/settingsController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', getSettings);
router.post('/', protect, authorize('super_admin'), updateSettings);

module.exports = router;
