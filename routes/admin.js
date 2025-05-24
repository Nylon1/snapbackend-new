const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
router.post('/login', adminController.login);
router.get('/pending-content', adminController.listPendingContent);

router.get('/dashboard', adminController.getDashboardMetrics);
router.get('/content', adminController.listContent);
router.post('/content/:id/approve', adminController.approveContent);
router.post('/content/:id/reject', adminController.rejectContent);
router.get('/users', adminController.listUsers);
router.post('/users/:id/ban', adminController.banUser);
router.post('/users/:id/unban', adminController.unbanUser);
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);
// 🔥 Trending Now routes
router.get('/trending', adminController.getTrending);
router.post('/trending', adminController.addTrending);
router.delete('/trending/:id', adminController.deleteTrending);
router.post('/content', adminController.createContent);
router.get('/analytics', adminController.getAnalytics);

// Public route for frontend to fetch approved content
router.get('/public/approved', adminController.getApprovedContent);

module.exports = router;
