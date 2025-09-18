const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tên thành tích là bắt buộc'],
        trim: true,
        maxlength: [100, 'Tên thành tích không được vượt quá 100 ký tự']
    },
    description: {
        type: String,
        required: [true, 'Mô tả thành tích là bắt buộc'],
        trim: true,
        maxlength: [500, 'Mô tả không được vượt quá 500 ký tự']
    },
    category: {
        type: String,
        required: [true, 'Danh mục là bắt buộc'],
        enum: {
            values: ['solar', 'reports', 'analysis', 'community', 'milestone'],
            message: 'Danh mục không hợp lệ'
        }
    },
    rarity: {
        type: String,
        required: [true, 'Độ hiếm là bắt buộc'],
        enum: {
            values: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
            message: 'Độ hiếm không hợp lệ'
        },
        default: 'common'
    },
    points: {
        type: Number,
        required: [true, 'Điểm thưởng là bắt buộc'],
        min: [1, 'Điểm thưởng phải lớn hơn 0'],
        max: [1000, 'Điểm thưởng không được vượt quá 1000']
    },
    icon: {
        type: String,
        default: 'fas fa-trophy',
        trim: true
    },
    color: {
        type: String,
        default: '#667eea',
        trim: true,
        validate: {
            validator: function(v) {
                return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
            },
            message: 'Màu sắc phải là mã hex hợp lệ'
        }
    },
    condition: {
        type: String,
        trim: true,
        maxlength: [200, 'Điều kiện không được vượt quá 200 ký tự']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    completedCount: {
        type: Number,
        default: 0,
        min: 0
    },
    // Metadata for tracking
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes for better performance
achievementSchema.index({ category: 1, rarity: 1 });
achievementSchema.index({ isActive: 1 });
achievementSchema.index({ name: 'text', description: 'text' });

// Virtual for rarity level (for sorting)
achievementSchema.virtual('rarityLevel').get(function() {
    const levels = {
        'common': 1,
        'uncommon': 2,
        'rare': 3,
        'epic': 4,
        'legendary': 5
    };
    return levels[this.rarity] || 1;
});

// Static method to get achievements stats
achievementSchema.statics.getStats = async function() {
    const total = await this.countDocuments();
    const active = await this.countDocuments({ isActive: true });
    const rareAchievements = await this.countDocuments({ 
        rarity: { $in: ['epic', 'legendary'] },
        isActive: true 
    });
    
    // Get users with achievements count
    const UserAchievement = mongoose.model('UserAchievement');
    const usersWithAchievements = await UserAchievement.distinct('user').countDocuments();
    
    // Today's completions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayCompletions = await UserAchievement.countDocuments({
        completedAt: { $gte: today, $lt: tomorrow }
    });

    return {
        total,
        active,
        rareAchievements,
        usersWithAchievements,
        todayCompletions
    };
};

// Instance method to increment completed count
achievementSchema.methods.incrementCompleted = async function() {
    this.completedCount += 1;
    return await this.save();
};

module.exports = mongoose.model('Achievement', achievementSchema);
