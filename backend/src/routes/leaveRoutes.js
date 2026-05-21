const express = require('express');
const router = express.Router();
const { getLeaves, requestLeave, updateLeaveStatus, deleteLeaveRequest } = require('../controller/leaveController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getLeaves);
router.post('/', requestLeave);
router.patch('/:id/status', updateLeaveStatus);
router.delete('/:id', deleteLeaveRequest);

module.exports = router;
