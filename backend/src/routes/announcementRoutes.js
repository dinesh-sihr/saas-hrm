const express = require('express');
const router = express.Router();
const { getAnnouncements, createAnnouncement, deleteAnnouncement, markAsRead } = require('../controller/announcementController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, getAnnouncements);
router.post('/', protect, authorize('manager'), createAnnouncement);
router.delete('/:id', protect, authorize('manager'), deleteAnnouncement);
router.post('/:id/read', protect, markAsRead);

module.exports = router;
