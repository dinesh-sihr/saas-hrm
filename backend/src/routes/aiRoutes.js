const express = require('express');
const router = express.Router();
const { chatWithAI, getChatHistory, clearChatHistory, getInsights, getTeamInsights, getTeamAggregate, refreshInsights } = require('../controller/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/chat', protect, chatWithAI);
router.get('/history', protect, getChatHistory);
router.delete('/history', protect, clearChatHistory);
router.get('/insights', protect, getInsights);
router.get('/team-insights', protect, getTeamInsights);
router.get('/team-aggregate', protect, getTeamAggregate);
router.post('/refresh/:userId', protect, refreshInsights);

module.exports = router;
