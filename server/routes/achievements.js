const express = require('express');
const router = express.Router();
const achievementsController = require('../controllers/achievementsController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

// Public routes (for user views)
router.get('/leaderboard', achievementsController.getLeaderboard);

// Protected user routes
router.use(protect);

// User achievement routes
router.get('/user/:userId', achievementsController.getUserAchievements);

// Admin routes
router.use(admin);

// Achievement CRUD operations
router.get('/', achievementsController.getAchievements);
router.get('/stats', achievementsController.getAchievementStats);
router.get('/:id', achievementsController.getAchievement);
router.post('/', achievementsController.createAchievement);
router.put('/:id', achievementsController.updateAchievement);
router.delete('/:id', achievementsController.deleteAchievement);

// User achievement management
router.post('/award', achievementsController.awardAchievement);
router.delete('/user-achievement/:userAchievementId', achievementsController.revokeAchievement);

module.exports = router;
