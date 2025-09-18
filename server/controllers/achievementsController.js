const Achievement = require('../models/achievementModel');
const UserAchievement = require('../models/userAchievementModel');
const User = require('../models/userModel');

// Get all achievements with pagination and filtering
exports.getAchievements = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 12,
            category = '',
            rarity = '',
            search = '',
            sortBy = 'createdAt',
            sortOrder = 'desc',
            isActive = ''
        } = req.query;

        // Build filter object
        const filter = {};
        
        if (category) filter.category = category;
        if (rarity) filter.rarity = rarity;
        if (isActive !== '') filter.isActive = isActive === 'true';
        
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortDirection = sortOrder === 'desc' ? -1 : 1;

        // Get achievements
        const achievements = await Achievement.find(filter)
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email')
            .sort({ [sortBy]: sortDirection })
            .limit(parseInt(limit))
            .skip(skip);

        // Get total count for pagination
        const total = await Achievement.countDocuments(filter);

        res.json({
            success: true,
            data: achievements,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / parseInt(limit)),
                total,
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error getting achievements:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách thành tích'
        });
    }
};

// Get achievement statistics
exports.getAchievementStats = async (req, res) => {
    try {
        const stats = await Achievement.getStats();
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error getting achievement stats:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy thống kê thành tích'
        });
    }
};

// Get single achievement by ID
exports.getAchievement = async (req, res) => {
    try {
        const { id } = req.params;
        
        const achievement = await Achievement.findById(id)
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email');
            
        if (!achievement) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thành tích'
            });
        }

        res.json({
            success: true,
            data: achievement
        });
    } catch (error) {
        console.error('Error getting achievement:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy thông tin thành tích'
        });
    }
};

// Create new achievement
exports.createAchievement = async (req, res) => {
    try {
        const {
            name,
            description,
            category,
            rarity,
            points,
            icon,
            color,
            condition,
            isActive
        } = req.body;

        // Validation
        if (!name || !description || !category || !rarity || !points) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin bắt buộc'
            });
        }

        // Check if achievement name already exists
        const existingAchievement = await Achievement.findOne({ name });
        if (existingAchievement) {
            return res.status(400).json({
                success: false,
                message: 'Tên thành tích đã tồn tại'
            });
        }

        const achievement = new Achievement({
            name,
            description,
            category,
            rarity,
            points: parseInt(points),
            icon: icon || 'fas fa-trophy',
            color: color || '#667eea',
            condition,
            isActive: isActive !== false,
            createdBy: req.user._id
        });

        await achievement.save();

        const populatedAchievement = await Achievement.findById(achievement._id)
            .populate('createdBy', 'name email');

        res.status(201).json({
            success: true,
            message: 'Tạo thành tích thành công',
            data: populatedAchievement
        });
    } catch (error) {
        console.error('Error creating achievement:', error);
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi tạo thành tích'
        });
    }
};

// Update achievement
exports.updateAchievement = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            description,
            category,
            rarity,
            points,
            icon,
            color,
            condition,
            isActive
        } = req.body;

        const achievement = await Achievement.findById(id);
        if (!achievement) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thành tích'
            });
        }

        // Check if new name conflicts with existing achievement
        if (name && name !== achievement.name) {
            const existingAchievement = await Achievement.findOne({ name });
            if (existingAchievement) {
                return res.status(400).json({
                    success: false,
                    message: 'Tên thành tích đã tồn tại'
                });
            }
        }

        // Update fields
        if (name) achievement.name = name;
        if (description) achievement.description = description;
        if (category) achievement.category = category;
        if (rarity) achievement.rarity = rarity;
        if (points) achievement.points = parseInt(points);
        if (icon) achievement.icon = icon;
        if (color) achievement.color = color;
        if (condition !== undefined) achievement.condition = condition;
        if (isActive !== undefined) achievement.isActive = isActive;
        
        achievement.updatedBy = req.user._id;

        await achievement.save();

        const populatedAchievement = await Achievement.findById(achievement._id)
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email');

        res.json({
            success: true,
            message: 'Cập nhật thành tích thành công',
            data: populatedAchievement
        });
    } catch (error) {
        console.error('Error updating achievement:', error);
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật thành tích'
        });
    }
};

// Delete achievement
exports.deleteAchievement = async (req, res) => {
    try {
        const { id } = req.params;

        const achievement = await Achievement.findById(id);
        if (!achievement) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thành tích'
            });
        }

        // Check if any users have this achievement
        const userAchievementCount = await UserAchievement.countDocuments({ achievement: id });
        
        if (userAchievementCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Không thể xóa thành tích này vì có ${userAchievementCount} người dùng đã đạt được`
            });
        }

        await Achievement.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Xóa thành tích thành công'
        });
    } catch (error) {
        console.error('Error deleting achievement:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi xóa thành tích'
        });
    }
};

// Award achievement to user (manual)
exports.awardAchievement = async (req, res) => {
    try {
        const { achievementId, userId } = req.body;
        const { adminNotes } = req.body;

        if (!achievementId || !userId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin thành tích hoặc người dùng'
            });
        }

        // Verify user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        // Award the achievement
        const userAchievement = await UserAchievement.awardAchievement(userId, achievementId, {
            awardedBy: req.user._id,
            adminNotes,
            metadata: {
                source: 'admin',
                awardedBy: req.user.name
            }
        });

        const populatedUserAchievement = await UserAchievement.findById(userAchievement._id)
            .populate('achievement', 'name description icon color rarity points')
            .populate('user', 'name email')
            .populate('awardedBy', 'name email');

        res.json({
            success: true,
            message: 'Trao thành tích thành công',
            data: populatedUserAchievement
        });
    } catch (error) {
        console.error('Error awarding achievement:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Lỗi khi trao thành tích'
        });
    }
};

// Get user achievements
exports.getUserAchievements = async (req, res) => {
    try {
        const { userId } = req.params;
        const {
            page = 1,
            limit = 20,
            sortBy = 'completedAt',
            sortOrder = 'desc'
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const userAchievements = await UserAchievement.getUserAchievements(userId, {
            limit: parseInt(limit),
            skip,
            sortBy,
            sortOrder: sortOrder === 'desc' ? -1 : 1
        });

        const total = await UserAchievement.countDocuments({ 
            user: userId, 
            isVisible: true 
        });

        res.json({
            success: true,
            data: userAchievements,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / parseInt(limit)),
                total,
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error getting user achievements:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy thành tích người dùng'
        });
    }
};

// Get achievement leaderboard
exports.getLeaderboard = async (req, res) => {
    try {
        const {
            limit = 10,
            category = null,
            timeframe = null
        } = req.query;

        const leaderboard = await UserAchievement.getLeaderboard({
            limit: parseInt(limit),
            category,
            timeframe
        });

        res.json({
            success: true,
            data: leaderboard
        });
    } catch (error) {
        console.error('Error getting leaderboard:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy bảng xếp hạng'
        });
    }
};

// Revoke achievement from user
exports.revokeAchievement = async (req, res) => {
    try {
        const { userAchievementId } = req.params;

        const userAchievement = await UserAchievement.findById(userAchievementId)
            .populate('achievement')
            .populate('user', 'name email');

        if (!userAchievement) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thành tích của người dùng'
            });
        }

        // Decrement achievement completed count
        await Achievement.findByIdAndUpdate(userAchievement.achievement._id, {
            $inc: { completedCount: -1 }
        });

        // Update user's achievement count
        await User.findByIdAndUpdate(userAchievement.user._id, {
            $inc: { 'stats.achievementsEarned': -1 }
        });

        await UserAchievement.findByIdAndDelete(userAchievementId);

        res.json({
            success: true,
            message: 'Thu hồi thành tích thành công'
        });
    } catch (error) {
        console.error('Error revoking achievement:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi thu hồi thành tích'
        });
    }
};
