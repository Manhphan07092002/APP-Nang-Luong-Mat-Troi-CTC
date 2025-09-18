const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: __dirname + '/.env' });

// Import Models
const SecurityLog = require('./models/securityLogModel');
const User = require('./models/userModel');

// Connect to database
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected for Security Data Seeding...');
    } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
    }
};

// Sample security events
const sampleSecurityEvents = [
    {
        event: 'login_success',
        description: 'Đăng nhập thành công từ IP 192.168.1.100',
        level: 'low',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    {
        event: 'login_failed',
        description: 'Đăng nhập thất bại - Sai mật khẩu từ IP 192.168.1.105',
        level: 'medium',
        ipAddress: '192.168.1.105',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    {
        event: 'login_failed',
        description: 'Đăng nhập thất bại - Nhiều lần thử sai từ IP 10.0.0.50',
        level: 'high',
        ipAddress: '10.0.0.50',
        userAgent: 'curl/7.68.0'
    },
    {
        event: 'suspicious_activity',
        description: 'Phát hiện hoạt động đáng ngờ - Truy cập từ nhiều IP khác nhau',
        level: 'critical',
        ipAddress: '203.162.4.191',
        userAgent: 'Python-requests/2.25.1'
    },
    {
        event: 'account_locked',
        description: 'Tài khoản bị khóa do quá nhiều lần đăng nhập thất bại',
        level: 'high',
        ipAddress: '192.168.1.105'
    },
    {
        event: 'permission_denied',
        description: 'Truy cập bị từ chối - Không đủ quyền admin',
        level: 'medium',
        ipAddress: '192.168.1.120'
    },
    {
        event: 'data_access',
        description: 'Truy cập dữ liệu sản phẩm',
        level: 'low',
        ipAddress: '192.168.1.100'
    },
    {
        event: 'admin_action',
        description: 'Admin đã tạo sản phẩm mới',
        level: 'low',
        ipAddress: '192.168.1.10'
    },
    {
        event: 'password_change',
        description: 'Người dùng đã thay đổi mật khẩu',
        level: 'medium',
        ipAddress: '192.168.1.100'
    },
    {
        event: 'logout',
        description: 'Đăng xuất thành công',
        level: 'low',
        ipAddress: '192.168.1.100'
    }
];

const importSecurityData = async () => {
    try {
        // Find admin user for some events
        const adminUser = await User.findOne({ role: 'admin' });
        
        // Clear existing security logs
        await SecurityLog.deleteMany();
        console.log('Old security logs destroyed!');

        // Create events with some assigned to users
        const eventsWithUsers = sampleSecurityEvents.map((event, index) => {
            const eventData = { ...event };
            
            // Assign some events to admin user
            if (index % 3 === 0 && adminUser) {
                eventData.user = adminUser._id;
            }
            
            // Add random timestamps within last 7 days
            const now = new Date();
            const randomDays = Math.floor(Math.random() * 7);
            const randomHours = Math.floor(Math.random() * 24);
            const randomMinutes = Math.floor(Math.random() * 60);
            
            eventData.createdAt = new Date(
                now.getTime() - (randomDays * 24 * 60 * 60 * 1000) - 
                (randomHours * 60 * 60 * 1000) - (randomMinutes * 60 * 1000)
            );
            
            return eventData;
        });

        // Insert security events
        await SecurityLog.insertMany(eventsWithUsers);
        console.log(`${sampleSecurityEvents.length} security events imported successfully!`);

        // Create a test locked user account (non-admin)
        const existingTestUser = await User.findOne({ email: 'locked@test.com' });
        if (!existingTestUser) {
            await User.create({
                name: 'Test Locked User',
                email: 'locked@test.com',
                password: 'hashedpassword123',
                role: 'user',
                isActive: false, // Locked account
                loginAttempts: 5,
                lockUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) // Locked for 24 hours
            });
            console.log('Test locked user account created!');
        }

        process.exit(0);
    } catch (error) {
        console.error(`Error importing security data: ${error}`);
        process.exit(1);
    }
};

// Connect DB and import data
connectDB().then(() => {
    importSecurityData();
});
