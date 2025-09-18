const mongoose = require('mongoose');

const userAchievementSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID là bắt buộc']
    },
    achievement: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Achievement',
        required: [true, 'Achievement ID là bắt buộc']
    },
    completedAt: {
        type: Date,
        default: Date.now
    },
    progress: {
        type: Number,
        default: 100,
        min: 0,
        max: 100
    },
    // Metadata about how the achievement was earned
    metadata: {
        trigger: String, // What triggered the achievement (e.g., 'report_created', 'analysis_completed')
        value: mongoose.Schema.Types.Mixed, // Additional data about the achievement
        source: String // Source of the achievement (e.g., 'system', 'manual', 'admin')
    },
    // Points earned (can be different from achievement.points if there are bonuses)
    pointsEarned: {
        type: Number,
        required: true,
        min: 0
    },
    // Whether this achievement is visible to the user
    isVisible: {
        type: Boolean,
        default: true
    },
    // Admin notes (if awarded manually)
    adminNotes: {
        type: String,
        maxlength: [500, 'Ghi chú không được vượt quá 500 ký tự']
    },
    awardedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Admin who awarded this achievement (if manual)
    }
}, {
    timestamps: true
});

// Compound index to prevent duplicate achievements for same user
userAchievementSchema.index({ user: 1, achievement: 1 }, { unique: true });

// Indexes for queries
userAchievementSchema.index({ user: 1, completedAt: -1 });
userAchievementSchema.index({ achievement: 1, completedAt: -1 });
userAchievementSchema.index({ completedAt: -1 });

// Static method to get user's achievements
userAchievementSchema.statics.getUserAchievements = async function(userId, options = {}) {
    const {
        populate = true,
        limit = 50,
        skip = 0,
        sortBy = 'completedAt',
        sortOrder = -1
    } = options;

    let query = this.find({ user: userId, isVisible: true });

    if (populate) {
        query = query.populate('achievement', 'name description icon color rarity points category');
    }

    query = query
        .sort({ [sortBy]: sortOrder })
        .limit(limit)
        .skip(skip);

    return await query.exec();
};

// Static method to get achievement leaderboard
userAchievementSchema.statics.getLeaderboard = async function(options = {}) {
    const {
        limit = 10,
        category = null,
        timeframe = null // 'week', 'month', 'year'
    } = options;

    let matchStage = { isVisible: true };
    
    // Add time filter if specified
    if (timeframe) {
        const now = new Date();
        let startDate;
        
        switch (timeframe) {
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
        }
        
        if (startDate) {
            matchStage.completedAt = { $gte: startDate };
        }
    }

    const pipeline = [
        { $match: matchStage },
        {
            $lookup: {
                from: 'achievements',
                localField: 'achievement',
                foreignField: '_id',
                as: 'achievementData'
            }
        },
        { $unwind: '$achievementData' }
    ];

    // Add category filter if specified
    if (category) {
        pipeline.push({
            $match: { 'achievementData.category': category }
        });
    }

    pipeline.push(
        {
            $group: {
                _id: '$user',
                totalPoints: { $sum: '$pointsEarned' },
                achievementCount: { $sum: 1 },
                latestAchievement: { $max: '$completedAt' }
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'userData'
            }
        },
        { $unwind: '$userData' },
        {
            $project: {
                _id: 1,
                totalPoints: 1,
                achievementCount: 1,
                latestAchievement: 1,
                userName: '$userData.name',
                userEmail: '$userData.email',
                userAvatar: '$userData.profileImage'
            }
        },
        { $sort: { totalPoints: -1, achievementCount: -1 } },
        { $limit: limit }
    );

    return await this.aggregate(pipeline);
};

// Static method to award achievement to user
userAchievementSchema.statics.awardAchievement = async function(userId, achievementId, options = {}) {
    const {
        pointsEarned = null,
        metadata = {},
        awardedBy = null,
        adminNotes = null
    } = options;

    try {
        // Get achievement details
        const Achievement = mongoose.model('Achievement');
        const achievement = await Achievement.findById(achievementId);
        
        if (!achievement) {
            throw new Error('Thành tích không tồn tại');
        }

        if (!achievement.isActive) {
            throw new Error('Thành tích không còn hoạt động');
        }

        // Check if user already has this achievement
        const existingAchievement = await this.findOne({
            user: userId,
            achievement: achievementId
        });

        if (existingAchievement) {
            throw new Error('Người dùng đã có thành tích này');
        }

        // Create user achievement record
        const userAchievement = new this({
            user: userId,
            achievement: achievementId,
            pointsEarned: pointsEarned || achievement.points,
            metadata: {
                ...metadata,
                source: awardedBy ? 'admin' : 'system'
            },
            awardedBy,
            adminNotes
        });

        await userAchievement.save();

        // Increment achievement completed count
        await achievement.incrementCompleted();

        // Update user's total achievement points
        const User = mongoose.model('User');
        await User.findByIdAndUpdate(userId, {
            $inc: { 'stats.achievementsEarned': 1 }
        });

        return userAchievement;
    } catch (error) {
        throw error;
    }
};

// Static method to check and award automatic achievements
userAchievementSchema.statics.checkAndAwardAchievements = async function(userId, trigger, data = {}) {
    try {
        const Achievement = mongoose.model('Achievement');
        const User = mongoose.model('User');
        
        // Get user data for checking conditions
        const user = await User.findById(userId);
        if (!user) return [];

        // Get all active achievements that user doesn't have yet
        const userAchievementIds = await this.find({ user: userId }).distinct('achievement');
        const availableAchievements = await Achievement.find({
            _id: { $nin: userAchievementIds },
            isActive: true
        });

        const awardedAchievements = [];

        // Check each achievement's conditions
        for (const achievement of availableAchievements) {
            let shouldAward = false;

            // Simple condition checking based on trigger and achievement category
            switch (trigger) {
                case 'report_created':
                    if (achievement.category === 'reports' || achievement.category === 'solar') {
                        // Check if user has created enough reports
                        const reportCount = user.stats?.reportsGenerated || 0;
                        if (achievement.name.includes('đầu tiên') && reportCount >= 1) {
                            shouldAward = true;
                        } else if (achievement.name.includes('10') && reportCount >= 10) {
                            shouldAward = true;
                        }
                    }
                    break;
                    
                case 'analysis_completed':
                    if (achievement.category === 'analysis') {
                        const analysisCount = data.analysisCount || 0;
                        if (achievement.name.includes('Chuyên gia') && analysisCount >= 10) {
                            shouldAward = true;
                        }
                    }
                    break;
                    
                case 'profile_completed':
                    if (achievement.category === 'milestone') {
                        if (achievement.name.includes('Hoàn thiện') && data.profileComplete) {
                            shouldAward = true;
                        }
                    }
                    break;
            }

            if (shouldAward) {
                try {
                    const userAchievement = await this.awardAchievement(userId, achievement._id, {
                        metadata: { trigger, ...data }
                    });
                    awardedAchievements.push(userAchievement);
                } catch (error) {
                    console.error(`Error awarding achievement ${achievement._id} to user ${userId}:`, error);
                }
            }
        }

        return awardedAchievements;
    } catch (error) {
        console.error('Error in checkAndAwardAchievements:', error);
        return [];
    }
};

module.exports = mongoose.model('UserAchievement', userAchievementSchema);
