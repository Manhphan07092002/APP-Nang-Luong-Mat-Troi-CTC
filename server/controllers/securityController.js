const User = require('../models/userModel');
const SecurityLog = require('../models/securityLogModel');

// Utility function to log security events
const logSecurityEvent = async (event, description, level = 'low', user = null, req = null) => {
    try {
        const logData = {
            event,
            description,
            level,
            user: user ? user._id || user : null
        };

        if (req) {
            logData.ipAddress = req.ip || req.connection.remoteAddress;
            logData.userAgent = req.get('User-Agent');
        }

        await SecurityLog.create(logData);
    } catch (error) {
        console.error('Error logging security event:', error);
    }
};

// Get security statistics
exports.getSecurityStats = async (req, res) => {
    try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Total security events
        const totalEvents = await SecurityLog.countDocuments();

        // Critical events today
        const criticalEventsToday = await SecurityLog.countDocuments({
            level: { $in: ['high', 'critical'] },
            createdAt: { $gte: today }
        });

        // Locked accounts
        const lockedAccounts = await User.countDocuments({
            isActive: false,
            role: { $ne: 'admin' }
        });

        // Latest critical event
        const latestCriticalEvent = await SecurityLog.findOne({
            level: { $in: ['high', 'critical'] }
        }).sort({ createdAt: -1 }).limit(1);

        // Failed login attempts today
        const failedLoginsToday = await SecurityLog.countDocuments({
            event: 'login_failed',
            createdAt: { $gte: today }
        });

        res.json({
            success: true,
            data: {
                totalEvents,
                criticalEventsToday,
                lockedAccounts,
                failedLoginsToday,
                latestCriticalEvent: latestCriticalEvent ? {
                    description: latestCriticalEvent.description,
                    createdAt: latestCriticalEvent.createdAt
                } : null
            }
        });
    } catch (error) {
        console.error('Error fetching security stats:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể tải thống kê bảo mật'
        });
    }
};

// Get locked accounts
exports.getLockedAccounts = async (req, res) => {
    try {
        const lockedAccounts = await User.find({
            isActive: false,
            role: { $ne: 'admin' }
        }).select('name email createdAt lastLogin').sort({ createdAt: -1 });

        res.json({
            success: true,
            data: lockedAccounts
        });
    } catch (error) {
        console.error('Error fetching locked accounts:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể tải danh sách tài khoản bị khóa'
        });
    }
};

// Get security events with pagination
exports.getSecurityEvents = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const events = await SecurityLog.find()
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalEvents = await SecurityLog.countDocuments();
        const totalPages = Math.ceil(totalEvents / limit);

        res.json({
            success: true,
            data: {
                events,
                currentPage: page,
                totalPages,
                totalEvents,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Error fetching security events:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể tải nhật ký sự kiện bảo mật'
        });
    }
};

// Unlock user account
exports.unlockAccount = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tài khoản'
            });
        }

        if (user.role === 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Không thể mở khóa tài khoản admin'
            });
        }

        // Unlock account
        user.isActive = true;
        user.loginAttempts = 0;
        user.lockUntil = undefined;
        await user.save();

        // Log security event
        await logSecurityEvent(
            'account_unlocked',
            `Tài khoản ${user.email} đã được mở khóa bởi admin`,
            'medium',
            req.user,
            req
        );

        res.json({
            success: true,
            message: 'Mở khóa tài khoản thành công'
        });
    } catch (error) {
        console.error('Error unlocking account:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể mở khóa tài khoản'
        });
    }
};

// Get recent security activities
exports.getRecentActivities = async (req, res) => {
    try {
        const activities = await SecurityLog.find()
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .limit(20);

        res.json({
            success: true,
            data: activities
        });
    } catch (error) {
        console.error('Error fetching recent activities:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể tải hoạt động gần đây'
        });
    }
};

// Export the logging function for use in other controllers
exports.logSecurityEvent = logSecurityEvent;
