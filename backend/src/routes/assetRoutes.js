const express = require('express');
const router = express.Router();
const { getAssets, addAsset, updateAsset, deleteAsset } = require('../controller/assetController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getAssets);
router.post('/', authorize('admin', 'manager'), addAsset);
router.put('/:id', authorize('admin', 'manager'), updateAsset);
router.delete('/:id', authorize('admin', 'manager'), deleteAsset);

module.exports = router;
