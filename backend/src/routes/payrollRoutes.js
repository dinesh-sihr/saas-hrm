const express = require('express');
const router = express.Router();
const { getPayroll, generatePayroll, deletePayroll, calculateSalary, getEmployeesSummary, saveOverridePay } = require('../controller/payrollController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/calculate', calculateSalary);
router.get('/employees-summary', authorize('admin', 'manager'), getEmployeesSummary);
router.post('/save-override', authorize('admin', 'manager'), saveOverridePay);
router.get('/', getPayroll);
router.post('/', authorize('admin', 'manager'), generatePayroll);
router.delete('/:id', authorize('admin', 'manager'), deletePayroll);

module.exports = router;
