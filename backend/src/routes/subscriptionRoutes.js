const express = require('express');
const router = express.Router();
const { getAllSubscriptions, getRevenueStats, cancelSubscription, renewSubscription, addSubscription } = require('../controller/subscriptionController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('super_admin'));

router.get('/', getAllSubscriptions);
router.post('/', addSubscription);
router.get('/stats', getRevenueStats);
router.patch('/:id/renew', renewSubscription);
router.patch('/:id/cancel', cancelSubscription);

module.exports = router;
