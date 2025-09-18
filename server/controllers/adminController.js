const User = require('../models/userModel');
const Report = require('../models/reportModel');
const Stats = require('../models/statsModel');
const SecurityEvent = require('../models/securityEventModel');
const bcrypt = require('bcryptjs');

// ===== THỐNG KÊ VÀ DASHBOARD =====
exports.getStats = async (req, res) => {
    try {
        const stats = await Stats.findOne({ singleton: 'main_stats' });
        const userCount = await User.countDocuments();
        const adminCount = await User.countDocuments({ role: 'admin' });
        const reportCount = await Report.countDocuments();
        
        // Thống kê theo thời gian
        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 30);
        
        const recentUsers = await User.countDocuments({ createdAt: { $gte: last30Days } });
        const recentReports = await Report.countDocuments({ createdAt: { $gte: last30Days } });
        
        res.json({
            totalVisits: stats ? stats.totalVisits : 0,
            analysesCreated: stats ? stats.analysesCreated : 0,
            logins: stats ? stats.logins : 0,
            totalUsers: userCount,
            totalAdmins: adminCount,
            totalReports: reportCount,
            recentUsers,
            recentReports
        });
    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy thống kê' });
    }
};

// Thống kê chi tiết cho biểu đồ
exports.getDetailedStats = async (req, res) => {
    try {
        // Thống kê người dùng theo tháng (6 tháng gần nhất)
        const usersByMonth = await User.aggregate([
            {
                $match: {
                    createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) }
                }
            },
            {
                $group: {
                    _id: { 
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // Thống kê báo cáo theo tháng
        const reportsByMonth = await Report.aggregate([
            {
                $match: {
                    createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) }
                }
            },
            {
                $group: {
                    _id: { 
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // Thống kê theo vai trò
        const usersByRole = await User.aggregate([
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Top 10 người dùng có nhiều báo cáo nhất
        const topUsers = await Report.aggregate([
            {
                $group: {
                    _id: '$user',
                    reportCount: { $sum: 1 }
                }
            },
            { $sort: { reportCount: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'userInfo'
                }
            },
            {
                $project: {
                    reportCount: 1,
                    userName: { $arrayElemAt: ['$userInfo.name', 0] },
                    userEmail: { $arrayElemAt: ['$userInfo.email', 0] }
                }
            }
        ]);

        res.json({
            usersByMonth,
            reportsByMonth,
            usersByRole,
            topUsers
        });
    } catch (error) {
        console.error('Error getting detailed stats:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy thống kê chi tiết' });
    }
};

// ===== QUẢN LÝ NGƯỜI DÙNG =====
// Lấy thống kê người dùng
exports.getUserStats = async (req, res) => {
    try {
        const total = await User.countDocuments();
        const active = await User.countDocuments({ isActive: true });
        const admins = await User.countDocuments({ role: 'admin' });
        
        // Người dùng mới hôm nay
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const newToday = await User.countDocuments({
            createdAt: { $gte: today, $lt: tomorrow }
        });

        res.json({
            total,
            active,
            admins,
            newToday
        });
    } catch (error) {
        console.error('Error getting user stats:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy thống kê người dùng' });
    }
};

// Lấy danh sách tất cả người dùng
exports.getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const role = req.query.role || '';
        
        const query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }
        if (role) {
            query.role = role;
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await User.countDocuments(query);

        res.json({
            users,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách người dùng' });
    }
};

// Lấy thông tin một người dùng
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }
        
        // Lấy thống kê báo cáo của user này
        const reportCount = await Report.countDocuments({ user: req.params.id });
        const recentReports = await Report.find({ user: req.params.id })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('shareId survey.name createdAt');

        res.json({
            user,
            reportCount,
            recentReports
        });
    } catch (error) {
        console.error('Error getting user:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy thông tin người dùng' });
    }
};

// Tạo người dùng mới
exports.createUser = async (req, res) => {
    try {
        const { name, email, password, phone, address, employeeId, role } = req.body;
        
        // Kiểm tra email đã tồn tại
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email đã được sử dụng' });
        }

        // Kiểm tra employeeId nếu có
        if (employeeId) {
            const existingEmployee = await User.findOne({ employeeId });
            if (existingEmployee) {
                return res.status(400).json({ message: 'Mã nhân viên đã được sử dụng' });
            }
        }

        const userData = {
            name,
            email,
            password,
            phone,
            address,
            role: role || 'user'
        };
        if (employeeId && employeeId.trim() !== '') {
            userData.employeeId = employeeId;
        }
        const user = await User.create(userData);

        await user.save();
        
        // Trả về user không có password
        const userResponse = await User.findById(user._id).select('-password');
        res.status(201).json(userResponse);
    } catch (error) {
        console.error('Error creating user:', error);
        if (error.code === 11000) {
            res.status(400).json({ message: 'Email hoặc mã nhân viên đã được sử dụng' });
        } else {
            res.status(500).json({ message: 'Lỗi server khi tạo người dùng' });
        }
    }
};

// Cập nhật người dùng
exports.updateUserByAdmin = async (req, res) => {
    try {
        const { name, email, phone, address, employeeId, role, password } = req.body;
        
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        // Kiểm tra email unique (nếu thay đổi)
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: 'Email đã được sử dụng' });
            }
        }

        // Kiểm tra employeeId unique (nếu thay đổi)
        if (employeeId && employeeId !== user.employeeId) {
            const existingEmployee = await User.findOne({ employeeId });
            if (existingEmployee) {
                return res.status(400).json({ message: 'Mã nhân viên đã được sử dụng' });
            }
        }

        // Cập nhật thông tin
        user.name = name || user.name;
        user.email = email || user.email;
        user.phone = phone || user.phone;
        user.address = address || user.address;
        if (employeeId !== undefined) {
            if (employeeId && employeeId.trim() !== '') {
                user.employeeId = employeeId;
            } else {
                user.employeeId = undefined;
            }
        }
        user.role = role || user.role;
        
        if (password) {
            user.password = password;
        }

        await user.save();
        
        const updatedUser = await User.findById(user._id).select('-password');
        res.json(updatedUser);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Lỗi server khi cập nhật người dùng' });
    }
};

// Xóa người dùng
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        // Không cho phép xóa admin cuối cùng
        if (user.role === 'admin') {
            const adminCount = await User.countDocuments({ role: 'admin' });
            if (adminCount <= 1) {
                return res.status(400).json({ message: 'Không thể xóa admin cuối cùng' });
            }
        }

        // Xóa tất cả báo cáo của user này
        await Report.deleteMany({ user: req.params.id });
        
        // Xóa user
        await User.findByIdAndDelete(req.params.id);
        
        res.json({ message: 'Đã xóa người dùng và tất cả báo cáo của họ' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Lỗi server khi xóa người dùng' });
    }
};

// ===== QUẢN LÝ BÁO CÁO =====
// Lấy danh sách tất cả báo cáo
exports.getAllReports = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const userId = req.query.userId || '';
        
        const query = {};
        if (search) {
            query.$or = [
                { 'survey.name': { $regex: search, $options: 'i' } },
                { 'survey.address': { $regex: search, $options: 'i' } },
                { shareId: { $regex: search, $options: 'i' } }
            ];
        }
        if (userId) {
            query.user = userId;
        }

        const reports = await Report.find(query)
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Report.countDocuments(query);

        res.json({
            reports,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error('Error getting reports:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách báo cáo' });
    }
};

// Lấy thông tin một báo cáo
exports.getReportById = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id).populate('user', 'name email');
        if (!report) {
            return res.status(404).json({ message: 'Không tìm thấy báo cáo' });
        }
        res.json(report);
    } catch (error) {
        console.error('Lỗi khi lấy chi tiết báo cáo:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy chi tiết báo cáo' });
    }
};

// Xóa báo cáo
exports.deleteReport = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ message: 'Không tìm thấy báo cáo' });
        }

        await Report.findByIdAndDelete(req.params.id);
        res.json({ message: 'Đã xóa báo cáo thành công' });
    } catch (error) {
        console.error('Error deleting report:', error);
        res.status(500).json({ message: 'Lỗi server khi xóa báo cáo' });
    }
};

// ===== QUẢN LÝ TRUY CẬP WEB =====
// Lấy thống kê truy cập
exports.getAccessStats = async (req, res) => {
    try {
        const stats = await Stats.findOne({ singleton: 'main_stats' });
        
        // Thống kê truy cập theo ngày (7 ngày gần nhất)
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            last7Days.push({
                date: date.toISOString().split('T')[0],
                visits: Math.floor(Math.random() * 100) + 50 // Mock data - thay thế bằng dữ liệu thực
            });
        }

        res.json({
            totalVisits: stats ? stats.totalVisits : 0,
            totalLogins: stats ? stats.logins : 0,
            analysesCreated: stats ? stats.analysesCreated : 0,
            dailyStats: last7Days
        });
    } catch (error) {
        console.error('Error getting access stats:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy thống kê truy cập' });
    }
};

// Reset thống kê
exports.resetStats = async (req, res) => {
    try {
        await Stats.findOneAndUpdate(
            { singleton: 'main_stats' },
            { totalVisits: 0, logins: 0, analysesCreated: 0 },
            { upsert: true }
        );
        res.json({ message: 'Đã reset thống kê thành công' });
    } catch (error) {
        console.error('Error resetting stats:', error);
        res.status(500).json({ message: 'Lỗi server khi reset thống kê' });
    }
};

// ===== QUẢN LÝ BẢO MẬT =====

// Lấy thống kê tổng quan về bảo mật
exports.getSecurityDashboardStats = async (req, res) => {
    try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const totalEvents = await SecurityEvent.countDocuments();
        const criticalEventsToday = await SecurityEvent.countDocuments({
            level: 'critical',
            createdAt: { $gte: twentyFourHoursAgo }
        });
        const lockedAccounts = await User.countDocuments({ accountLocked: true });

        const latestCriticalEvent = await SecurityEvent.findOne({ level: 'critical' })
            .sort({ createdAt: -1 })
            .populate('user', 'name email');

        res.json({
            totalEvents,
            criticalEventsToday,
            lockedAccounts,
            latestCriticalEvent
        });
    } catch (error) {
        console.error('Error getting security dashboard stats:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy thống kê bảo mật' });
    }
};

// Lấy danh sách sự kiện bảo mật
exports.getSecurityEvents = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;
        const level = req.query.level || '';

        const query = {};
        if (level) {
            query.level = level;
        }

        const events = await SecurityEvent.find(query)
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip((page - 1) * limit);

        const total = await SecurityEvent.countDocuments(query);

        res.json({
            events,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error('Error getting security events:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách sự kiện bảo mật' });
    }
};

// Lấy danh sách tài khoản bị khóa
exports.getLockedAccounts = async (req, res) => {
    try {
        const lockedUsers = await User.find({ accountLocked: true })
            .select('name email employeeId lockUntil failedLoginAttempts');
            
        res.json(lockedUsers);
    } catch (error) {
        console.error('Error getting locked accounts:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách tài khoản bị khóa' });
    }
};

// Mở khóa tài khoản
exports.unlockUserAccount = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        if (!user.accountLocked) {
            return res.status(400).json({ message: 'Tài khoản này không bị khóa' });
        }

        user.accountLocked = false;
        user.lockUntil = null;
        user.failedLoginAttempts = 0;
        await user.save();

        // Ghi lại sự kiện bảo mật
        await SecurityEvent.create({
            type: 'ACCOUNT_UNLOCKED',
            user: user._id,
            description: `Tài khoản ${user.email} đã được mở khóa bởi quản trị viên ${req.user.name}.`,
            level: 'medium',
            ipAddress: req.ip
        });

        res.json({ message: `Đã mở khóa thành công tài khoản ${user.email}` });
    } catch (error) {
        console.error('Error unlocking user account:', error);
        res.status(500).json({ message: 'Lỗi server khi mở khóa tài khoản' });
    }
};