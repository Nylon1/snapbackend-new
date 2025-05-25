const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// 1️⃣ Public login endpoint
router.post('/login', adminController.login);

// 2️⃣ Protect every route below this line
router.use(authenticateAdmin);

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

// (Optional) If you want this JSON endpoint guarded as well:
router.get('/public/approved', adminController.getApprovedContent);

module.exports = router;
