const express = require('express');
const router = express.Router();
const { getHolidays, addHoliday, updateHoliday, deleteHoliday } = require('../controller/holidayController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getHolidays);
router.post('/', authorize('admin', 'manager'), addHoliday);
router.put('/:id', authorize('admin', 'manager'), updateHoliday);
router.delete('/:id', authorize('admin', 'manager'), deleteHoliday);

module.exports = router;
