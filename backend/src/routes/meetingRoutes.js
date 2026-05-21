const express = require('express');
const router = express.Router();
const { getMeetings, createMeeting, joinMeeting } = require('../controller/meetingController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, getMeetings);
router.post('/', protect, authorize('manager'), createMeeting);
router.post('/:id/join', protect, joinMeeting);

module.exports = router;
