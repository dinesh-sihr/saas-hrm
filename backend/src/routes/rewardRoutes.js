const express = require('express');
const router = express.Router();
const { getRewards, sendReward, deleteReward } = require('../controller/rewardController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getRewards);
router.post('/', authorize('admin', 'manager'), sendReward);
router.delete('/:id', authorize('admin', 'manager'), deleteReward);

module.exports = router;
