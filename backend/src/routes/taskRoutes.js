const express = require('express');
const router = express.Router();
const { 
    assignTask, 
    getMyTasks, 
    completeTask, 
    getSmartTrackingData 
} = require('../controller/taskController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/my-tasks', protect, getMyTasks);
router.patch('/:id/complete', protect, completeTask);

router.get('/tracking', protect, authorize('manager'), getSmartTrackingData);
router.post('/assign', protect, authorize('manager'), assignTask);

module.exports = router;
