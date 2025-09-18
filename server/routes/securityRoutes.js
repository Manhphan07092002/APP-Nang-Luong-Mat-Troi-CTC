const express = require('express');
const router = express.Router();
const { protect, requireAdmin } = require('../middleware/authMiddleware');
const {
    getSecurityStats,
    getLockedAccounts,
    getSecurityEvents,
    unlockAccount,
    getRecentActivities
} = require('../controllers/securityController');

// All routes require admin authentication
router.use(protect);
router.use(requireAdmin);

// GET /api/admin/security/stats
router.get('/stats', getSecurityStats);

// GET /api/admin/security/locked-accounts
router.get('/locked-accounts', getLockedAccounts);

// GET /api/admin/security/events
router.get('/events', getSecurityEvents);

// POST /api/admin/security/unlock-account/:userId
router.post('/unlock-account/:userId', unlockAccount);

// GET /api/admin/security/recent-activities
router.get('/recent-activities', getRecentActivities);

module.exports = router;
