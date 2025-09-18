const mongoose = require('mongoose');
const Achievement = require('../models/achievementModel');
const User = require('../models/userModel');
require('dotenv').config();

// Sample achievements data
const sampleAchievements = [
    // Solar Category
    {
        name: 'Người tiên phong Solar',
        description: 'Hoàn thành báo cáo phân tích năng lượng mặt trời đầu tiên',
        category: 'solar',
        rarity: 'common',
        points: 50,
        icon: 'fas fa-sun',
        color: '#f59e0b',
        condition: 'Tạo báo cáo solar đầu tiên'
    },
    {
        name: 'Chuyên gia Solar',
        description: 'Hoàn thành 10 báo cáo phân tích năng lượng mặt trời',
        category: 'solar',
        rarity: 'uncommon',
        points: 150,
        icon: 'fas fa-solar-panel',
        color: '#f59e0b',
        condition: 'Tạo 10 báo cáo solar'
    },
    {
        name: 'Bậc thầy Solar',
        description: 'Hoàn thành 50 báo cáo phân tích năng lượng mặt trời',
        category: 'solar',
        rarity: 'rare',
        points: 500,
        icon: 'fas fa-crown',
        color: '#f59e0b',
        condition: 'Tạo 50 báo cáo solar'
    },

    // Reports Category
    {
        name: 'Người viết báo cáo',
        description: 'Tạo báo cáo đầu tiên trong hệ thống',
        category: 'reports',
        rarity: 'common',
        points: 25,
        icon: 'fas fa-file-alt',
        color: '#3b82f6',
        condition: 'Tạo báo cáo đầu tiên'
    },
    {
        name: 'Tác giả năng suất',
        description: 'Tạo 25 báo cáo trong hệ thống',
        category: 'reports',
        rarity: 'uncommon',
        points: 200,
        icon: 'fas fa-edit',
        color: '#3b82f6',
        condition: 'Tạo 25 báo cáo'
    },
    {
        name: 'Chuyên gia báo cáo',
        description: 'Tạo 100 báo cáo chất lượng cao',
        category: 'reports',
        rarity: 'epic',
        points: 750,
        icon: 'fas fa-medal',
        color: '#8b5cf6',
        condition: 'Tạo 100 báo cáo'
    },

    // Analysis Category
    {
        name: 'Nhà phân tích mới',
        description: 'Hoàn thành phân tích dữ liệu đầu tiên',
        category: 'analysis',
        rarity: 'common',
        points: 40,
        icon: 'fas fa-chart-line',
        color: '#10b981',
        condition: 'Hoàn thành phân tích đầu tiên'
    },
    {
        name: 'Chuyên gia phân tích',
        description: 'Hoàn thành 20 phân tích dữ liệu chuyên sâu',
        category: 'analysis',
        rarity: 'rare',
        points: 400,
        icon: 'fas fa-chart-pie',
        color: '#10b981',
        condition: 'Hoàn thành 20 phân tích'
    },
    {
        name: 'Bậc thầy dữ liệu',
        description: 'Hoàn thành 100 phân tích dữ liệu với độ chính xác cao',
        category: 'analysis',
        rarity: 'legendary',
        points: 1000,
        icon: 'fas fa-brain',
        color: '#f59e0b',
        condition: 'Hoàn thành 100 phân tích chính xác'
    },

    // Community Category
    {
        name: 'Thành viên mới',
        description: 'Chào mừng bạn đến với cộng đồng Solar Analytics!',
        category: 'community',
        rarity: 'common',
        points: 10,
        icon: 'fas fa-handshake',
        color: '#ec4899',
        condition: 'Đăng ký tài khoản'
    },
    {
        name: 'Người chia sẻ',
        description: 'Chia sẻ báo cáo đầu tiên với cộng đồng',
        category: 'community',
        rarity: 'uncommon',
        points: 75,
        icon: 'fas fa-share',
        color: '#ec4899',
        condition: 'Chia sẻ báo cáo đầu tiên'
    },
    {
        name: 'Người cộng tác',
        description: 'Tham gia vào 5 dự án cộng đồng',
        category: 'community',
        rarity: 'rare',
        points: 300,
        icon: 'fas fa-users',
        color: '#ec4899',
        condition: 'Tham gia 5 dự án'
    },

    // Milestone Category
    {
        name: 'Hoàn thiện hồ sơ',
        description: 'Hoàn thành đầy đủ thông tin hồ sơ cá nhân',
        category: 'milestone',
        rarity: 'common',
        points: 30,
        icon: 'fas fa-user-check',
        color: '#6366f1',
        condition: 'Hoàn thành profile 100%'
    },
    {
        name: 'Người dùng tích cực',
        description: 'Đăng nhập liên tục 30 ngày',
        category: 'milestone',
        rarity: 'uncommon',
        points: 100,
        icon: 'fas fa-calendar-check',
        color: '#6366f1',
        condition: 'Đăng nhập 30 ngày liên tục'
    },
    {
        name: 'Huyền thoại Solar',
        description: 'Đạt được tất cả thành tích trong hệ thống',
        category: 'milestone',
        rarity: 'legendary',
        points: 2000,
        icon: 'fas fa-trophy',
        color: '#f59e0b',
        condition: 'Đạt tất cả thành tích khác'
    }
];

async function seedAchievements() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://ctcdn.vn:27017/solar-analytics');
        console.log('Connected to MongoDB');

        // Find an admin user to assign as creator
        let adminUser = await User.findOne({ role: 'admin' });
        
        if (!adminUser) {
            // Create a default admin user if none exists
            adminUser = new User({
                name: 'System Admin',
                email: 'admin@solar-analytics.com',
                password: 'admin123',
                role: 'admin',
                isActive: true
            });
            await adminUser.save();
            console.log('Created default admin user');
        }

        // Clear existing achievements
        await Achievement.deleteMany({});
        console.log('Cleared existing achievements');

        // Add createdBy field to all achievements
        const achievementsWithCreator = sampleAchievements.map(achievement => ({
            ...achievement,
            createdBy: adminUser._id
        }));

        // Insert sample achievements
        const insertedAchievements = await Achievement.insertMany(achievementsWithCreator);
        console.log(`Inserted ${insertedAchievements.length} achievements`);

        // Display summary
        console.log('\n=== ACHIEVEMENTS SEEDED ===');
        const categories = ['solar', 'reports', 'analysis', 'community', 'milestone'];
        for (const category of categories) {
            const count = insertedAchievements.filter(a => a.category === category).length;
            console.log(`${category.toUpperCase()}: ${count} achievements`);
        }

        const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
        console.log('\nBy Rarity:');
        for (const rarity of rarities) {
            const count = insertedAchievements.filter(a => a.rarity === rarity).length;
            console.log(`${rarity.toUpperCase()}: ${count} achievements`);
        }

        console.log('\n✅ Achievement seeding completed successfully!');
        
    } catch (error) {
        console.error('Error seeding achievements:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run the seeding function
if (require.main === module) {
    seedAchievements();
}

module.exports = { seedAchievements, sampleAchievements };
