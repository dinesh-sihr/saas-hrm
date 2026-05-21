const express = require('express');
const router = express.Router();
const { getDashboardStats, getRecentActivities } = require('../controller/statsController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getDashboardStats);
router.get('/activities', protect, getRecentActivities);

module.exports = router;
