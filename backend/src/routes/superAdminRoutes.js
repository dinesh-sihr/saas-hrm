const express = require('express');
const router = express.Router();
const { 
    getStats, 
    getRecentCompanies, 
    getAllCompanies, 
    updateCompanyStatus,
    getAdminUsers,
    addAdminUser
} = require('../controller/superAdminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('super_admin'));

router.get('/stats', getStats);
router.get('/recent-companies', getRecentCompanies);
router.get('/companies', getAllCompanies);
router.patch('/companies/:id/status', updateCompanyStatus);
router.get('/admins', getAdminUsers);
router.post('/admins', addAdminUser);

module.exports = router;
