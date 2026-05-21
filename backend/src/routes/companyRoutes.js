const express = require('express');
const router = express.Router();
const { getAllCompanies, updateCompanyStatus, createCompany, updateCompanyDetails, deleteCompany } = require('../controller/superAdminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('super_admin'));

router.get('/', getAllCompanies);
router.post('/', createCompany);
router.patch('/:id/status', updateCompanyStatus);
router.put('/:id', updateCompanyDetails);
router.delete('/:id', deleteCompany);

module.exports = router;

