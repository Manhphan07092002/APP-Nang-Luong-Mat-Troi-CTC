require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/userModel');
const Achievement = require('./models/achievementModel');

async function setupAchievements() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB connected successfully');

        // Create or find admin user
        let adminUser = await User.findOne({ role: 'admin' });
        
        if (!adminUser) {
            console.log('👤 Creating admin user...');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            adminUser = new User({
                name: 'Admin User',
                email: 'admin@example.com',
                password: hashedPassword,
                role: 'admin',
                isActive: true
            });
            await adminUser.save();
            console.log('✅ Admin user created: admin@example.com / admin123');
        } else {
            console.log('✅ Admin user found:', adminUser.email);
        }

        // Create sample achievements
        const sampleAchievements = [
            {
                name: 'Người tiên phong Solar',
                description: 'Hoàn thành báo cáo phân tích năng lượng mặt trời đầu tiên',
                category: 'solar',
                rarity: 'common',
                points: 50,
                icon: 'fas fa-sun',
                color: '#f59e0b',
                createdBy: adminUser._id
            },
            {
                name: 'Chuyên gia Solar',
                description: 'Hoàn thành 10 báo cáo phân tích năng lượng mặt trời',
                category: 'solar',
                rarity: 'uncommon',
                points: 150,
                icon: 'fas fa-solar-panel',
                color: '#f59e0b',
                createdBy: adminUser._id
            },
            {
                name: 'Người viết báo cáo',
                description: 'Tạo báo cáo đầu tiên trong hệ thống',
                category: 'reports',
                rarity: 'common',
                points: 25,
                icon: 'fas fa-file-alt',
                color: '#3b82f6',
                createdBy: adminUser._id
            },
            {
                name: 'Nhà phân tích mới',
                description: 'Hoàn thành phân tích dữ liệu đầu tiên',
                category: 'analysis',
                rarity: 'common',
                points: 40,
                icon: 'fas fa-chart-line',
                color: '#10b981',
                createdBy: adminUser._id
            },
            {
                name: 'Thành viên mới',
                description: 'Chào mừng bạn đến với cộng đồng Solar Analytics!',
                category: 'community',
                rarity: 'common',
                points: 10,
                icon: 'fas fa-handshake',
                color: '#ec4899',
                createdBy: adminUser._id
            }
        ];

        // Clear and insert achievements
        await Achievement.deleteMany({});
        const achievements = await Achievement.insertMany(sampleAchievements);
        console.log(`🏆 Created ${achievements.length} sample achievements`);

        // Generate JWT token for testing
        const token = jwt.sign(
            { _id: adminUser._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('\n🎯 API Testing Information:');
        console.log('Admin Login: admin@example.com / admin123');
        console.log('JWT Token for API calls:');
        console.log(`Bearer ${token}`);
        
        console.log('\n📋 Available API Endpoints:');
        console.log('GET /api/achievements/stats - Get achievement statistics');
        console.log('GET /api/achievements - Get all achievements (admin)');
        console.log('POST /api/achievements - Create new achievement (admin)');
        console.log('GET /api/achievements/leaderboard - Get leaderboard (public)');
        
        console.log('\n✅ Setup completed successfully!');
        
    } catch (error) {
        console.error('❌ Error during setup:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

setupAchievements();
