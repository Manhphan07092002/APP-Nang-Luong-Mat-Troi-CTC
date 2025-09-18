// File: server/routes/api.js

const express = require('express');
const router = express.Router();

// Import Controllers
const reportController = require('../controllers/reportController');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const adminController = require('../controllers/adminController');
const productController = require('../controllers/productController');

// Import Routes
const achievementsRoutes = require('./achievements');

// Import Middlewares
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// --- Public Routes ---
router.post('/auth/register', authController.registerUser);
router.post('/auth/login', authController.loginUser);
router.post('/auth/send-verification', authController.sendVerificationCode);
router.post('/auth/verify-code', authController.verifyCode);
router.get('/auth/debug-codes', authController.getVerificationCodes); // Debug endpoint
router.post('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/validate-reset-token', authController.validateResetToken);
router.post('/auth/reset-password', authController.resetPassword);
// Public route to view shared reports
router.get('/reports/share/:shareId', reportController.getReportByShareId);

// --- Avatar Upload Route ---
// Ensure avatar uploads directory exists
const avatarUploadsDir = path.join(__dirname, '../../client/uploads/avt');
if (!fs.existsSync(avatarUploadsDir)) {
    fs.mkdirSync(avatarUploadsDir, { recursive: true });
}

// Configure multer for avatar uploads
const avatarStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, avatarUploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = req.user._id + '-' + Date.now();
        const ext = path.extname(file.originalname);
        cb(null, 'avatar-' + uniqueSuffix + ext);
    }
});

const avatarFileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file hình ảnh!'), false);
    }
};

const avatarUpload = multer({
    storage: avatarStorage,
    fileFilter: avatarFileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

router.put('/users/profile/avatar', protect, avatarUpload.single('avatar'), userController.updateUserAvatar);

// --- User Routes (Yêu cầu đăng nhập) ---
// Profile management
router.get('/users/profile', protect, userController.getUserProfile);
router.put('/users/profile', protect, userController.updateUserProfile);
router.delete('/users/profile', protect, userController.deleteCurrentUser);
router.put('/users/stats', protect, userController.updateUserStats);
router.post('/users/change-password', protect, userController.changePassword);
router.get('/users/ip', protect, userController.getUserIP);

// Two-Factor Authentication// 2FA routes
router.post('/users/2fa/setup', protect, userController.setup2FA);
router.post('/users/2fa/verify', protect, userController.verify2FA);
router.get('/users/2fa/status', protect, userController.get2FAStatus);
router.delete('/users/2fa/disable', protect, userController.disable2FA);

// Session management routes
router.get('/users/sessions', protect, userController.getUserSessions);
router.delete('/users/sessions/:sessionId', protect, userController.logoutSession);
router.delete('/users/sessions', protect, userController.logoutAllSessions);

// Admin session management routes
const sessionController = require('../controllers/sessionController');
router.get('/admin/sessions', protect, admin, sessionController.getAllSessions);
router.get('/admin/sessions/stats', protect, admin, sessionController.getSessionStats);
router.delete('/admin/sessions/:sessionId', protect, admin, sessionController.terminateSession);
router.delete('/admin/sessions/user/:userId', protect, admin, sessionController.terminateUserSessions);
router.post('/admin/sessions/cleanup', protect, admin, sessionController.cleanupExpiredSessions);
router.get('/admin/sessions/suspicious', protect, admin, sessionController.getSuspiciousSessions);
router.get('/admin/sessions/timeline/:userId', protect, admin, sessionController.getUserSessionTimeline);

// Reports
router.post('/reports', protect, reportController.createReport);
router.get('/reports', protect, reportController.getAllReports);
router.delete('/reports/:id', protect, reportController.deleteReport);

// --- ADMIN ROUTES (Yêu cầu đăng nhập VÀ có quyền admin) ---
// Dashboard & Statistics
router.get('/admin/stats', protect, admin, adminController.getStats);
router.get('/admin/stats/detailed', protect, admin, adminController.getDetailedStats);
router.get('/admin/access-stats', protect, admin, adminController.getAccessStats);
router.post('/admin/reset-stats', protect, admin, adminController.resetStats);

// User Management
router.get('/admin/users/stats', protect, admin, adminController.getUserStats);
router.get('/admin/users', protect, admin, adminController.getAllUsers);
router.get('/admin/users/:id', protect, admin, adminController.getUserById);
router.post('/admin/users', protect, admin, userController.createUser);
router.put('/admin/users/:id', protect, admin, userController.updateUser);
router.delete('/admin/users/:id', protect, admin, userController.deleteUser);

// Product Management (Admin)
router.get('/admin/products', protect, admin, productController.getAllProductsAdmin);
router.post('/admin/products', protect, admin, productController.createProduct);
router.put('/admin/products/:id', protect, admin, productController.updateProduct);
router.delete('/admin/products/:id', protect, admin, productController.deleteProduct);

// Public Product Routes
router.get('/products', productController.getAllProducts);
router.get('/products/categories', productController.getCategories);
router.get('/products/featured', productController.getFeaturedProducts);
router.get('/products/:id', productController.getProductById);

// Report Management
router.get('/admin/reports', protect, admin, adminController.getAllReports);
router.get('/admin/reports/:id', protect, admin, adminController.getReportById);
router.delete('/admin/reports/:id', protect, admin, adminController.deleteReport);

// Security Management
router.get('/admin/security/stats', protect, admin, adminController.getSecurityDashboardStats);
router.get('/admin/security/events', protect, admin, adminController.getSecurityEvents);
router.get('/admin/security/locked-accounts', protect, admin, adminController.getLockedAccounts);
router.post('/admin/security/unlock-account/:userId', protect, admin, adminController.unlockUserAccount);

// Achievements Management
router.use('/achievements', achievementsRoutes);

// Legacy routes (keep for backward compatibility)
router.get('/users', protect, admin, userController.getAllUsers);
router.delete('/users/:id', protect, admin, userController.deleteUser);

module.exports = router;