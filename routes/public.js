const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// ✅ Public route to get approved content
router.get('/approved', adminController.getApprovedContent);

module.exports = router;
