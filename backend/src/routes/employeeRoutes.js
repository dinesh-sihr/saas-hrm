const express = require('express');
const router = express.Router();
const { getEmployees, addEmployee, updateEmployee, deleteEmployee, getEmployeeProfile, updateEmployeeStatus } = require('../controller/employeeController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('admin', 'manager'));

router.get('/', getEmployees);
router.post('/', addEmployee);
router.get('/:id/profile', getEmployeeProfile);
router.put('/:id', updateEmployee);
router.patch('/:id/status', updateEmployeeStatus);
router.delete('/:id', deleteEmployee);

module.exports = router;
