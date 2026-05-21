const express = require('express');
const router = express.Router();
const { 
    getStatus, 
    checkIn, 
    checkOut, 
    getHistory, 
    getAttendanceStats, 
    getTeamAttendance,
    getGeofence,
    updateGeofence
} = require('../controller/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/status', getStatus);
router.get('/stats', getAttendanceStats);
router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.get('/history', getHistory);
router.get('/team', authorize('admin', 'manager'), getTeamAttendance);

router.get('/geofence', getGeofence);
router.post('/geofence', authorize('admin', 'manager'), updateGeofence);

module.exports = router;
