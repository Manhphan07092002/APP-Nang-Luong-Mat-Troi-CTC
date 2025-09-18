const UserSession = require('../models/userSessionModel');
const User = require('../models/userModel');

// Get all sessions for admin (with pagination and filters)
exports.getAllSessions = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            device,
            dateFrom,
            dateTo,
            userId
        } = req.query;

        // Build filter object
        const filter = {};
        
        if (status) {
            if (status === 'active') {
                filter.isActive = true;
                filter.expiresAt = { $gt: new Date() };
            } else if (status === 'inactive') {
                filter.isActive = false;
            } else if (status === 'expired') {
                filter.expiresAt = { $lt: new Date() };
            }
        }

        if (device) {
            filter.device = { $regex: device, $options: 'i' };
        }

        if (userId) {
            filter.userId = userId;
        }

        if (dateFrom || dateTo) {
            filter.loginTime = {};
            if (dateFrom) filter.loginTime.$gte = new Date(dateFrom);
            if (dateTo) {
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59, 999);
                filter.loginTime.$lte = toDate;
            }
        }

        // Execute query with pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const [sessions, totalCount] = await Promise.all([
            UserSession.find(filter)
                .populate('userId', 'name email profileImage')
                .sort({ lastActivity: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            UserSession.countDocuments(filter)
        ]);

        // Format sessions for frontend
        const formattedSessions = sessions.map(session => ({
            id: session._id,
            sessionId: session.sessionId,
            user: {
                id: session.userId._id,
                name: session.userId.name,
                email: session.userId.email,
                profileImage: session.userId.profileImage
            },
            device: session.device,
            browser: session.browser,
            os: session.os,
            ipAddress: session.ipAddress,
            location: session.location,
            loginTime: session.loginTime,
            lastActivity: session.lastActivity,
            logoutTime: session.logoutTime,
            status: session.isActive ? 
                (session.expiresAt > new Date() ? 'active' : 'expired') : 
                'inactive',
            loginMethod: session.loginMethod,
            userAgent: session.userAgent,
            riskScore: session.riskScore || 0,
            metadata: session.metadata
        }));

        const totalPages = Math.ceil(totalCount / parseInt(limit));

        res.json({
            success: true,
            sessions: formattedSessions,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalCount,
                hasNext: parseInt(page) < totalPages,
                hasPrev: parseInt(page) > 1
            }
        });

    } catch (error) {
        console.error('Error getting all sessions:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách phiên đăng nhập'
        });
    }
};

// Get session statistics for admin dashboard
exports.getSessionStats = async (req, res) => {
    try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const [
            activeSessions,
            totalUsers,
            todayLogins,
            expiredSessions,
            weeklyLogins,
            deviceStats,
            locationStats
        ] = await Promise.all([
            // Active sessions
            UserSession.countDocuments({
                isActive: true,
                expiresAt: { $gt: now }
            }),
            
            // Total unique users with sessions
            UserSession.distinct('userId'),
            
            // Today's logins
            UserSession.countDocuments({
                loginTime: { $gte: today }
            }),
            
            // Expired sessions
            UserSession.countDocuments({
                expiresAt: { $lt: now }
            }),
            
            // Weekly logins
            UserSession.countDocuments({
                loginTime: { $gte: thisWeek }
            }),
            
            // Device statistics
            UserSession.aggregate([
                { $match: { loginTime: { $gte: thisWeek } } },
                { $group: { _id: '$browser', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 5 }
            ]),
            
            // Location statistics
            UserSession.aggregate([
                { $match: { loginTime: { $gte: thisWeek } } },
                { $group: { _id: '$location.city', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 5 }
            ])
        ]);

        res.json({
            success: true,
            stats: {
                activeSessions,
                totalUsers: totalUsers.length,
                todayLogins,
                expiredSessions,
                weeklyLogins,
                deviceStats: deviceStats.map(stat => ({
                    device: stat._id || 'Unknown',
                    count: stat.count
                })),
                locationStats: locationStats.map(stat => ({
                    location: stat._id || 'Unknown',
                    count: stat.count
                }))
            }
        });

    } catch (error) {
        console.error('Error getting session stats:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy thống kê phiên đăng nhập'
        });
    }
};

// Terminate a specific session (admin action)
exports.terminateSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        const session = await UserSession.findOne({ 
            sessionId, 
            isActive: true 
        }).populate('userId', 'name email');
        
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phiên đăng nhập'
            });
        }
        
        await session.logout();
        
        console.log(`🔨 Admin terminated session ${sessionId} for user ${session.userId.email}`);
        
        res.json({
            success: true,
            message: `Đã ngắt kết nối phiên của ${session.userId.name}`,
            terminatedSession: {
                sessionId: session.sessionId,
                user: session.userId.name,
                device: session.device
            }
        });
        
    } catch (error) {
        console.error('Error terminating session:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi ngắt kết nối phiên'
        });
    }
};

// Terminate all sessions for a specific user (admin action)
exports.terminateUserSessions = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }
        
        const result = await UserSession.logoutAllUserSessions(userId);
        
        console.log(`🔨 Admin terminated all sessions for user ${user.email} (${result.modifiedCount} sessions)`);
        
        res.json({
            success: true,
            message: `Đã ngắt kết nối ${result.modifiedCount} phiên của ${user.name}`,
            terminatedCount: result.modifiedCount
        });
        
    } catch (error) {
        console.error('Error terminating user sessions:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi ngắt kết nối phiên người dùng'
        });
    }
};

// Clean up expired sessions
exports.cleanupExpiredSessions = async (req, res) => {
    try {
        const result = await UserSession.cleanupExpiredSessions();
        
        console.log(`🧹 Cleaned up ${result.modifiedCount} expired sessions`);
        
        res.json({
            success: true,
            message: `Đã dọn dẹp ${result.modifiedCount} phiên hết hạn`,
            cleanedCount: result.modifiedCount
        });
        
    } catch (error) {
        console.error('Error cleaning up expired sessions:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi dọn dẹp phiên hết hạn'
        });
    }
};

// Get session activity timeline for a specific user
exports.getUserSessionTimeline = async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 50 } = req.query;
        
        const sessions = await UserSession.find({ userId })
            .sort({ loginTime: -1 })
            .limit(parseInt(limit))
            .select('sessionId device ipAddress location loginTime logoutTime lastActivity isActive loginMethod');
        
        const timeline = sessions.map(session => ({
            sessionId: session.sessionId,
            device: session.device,
            ipAddress: session.ipAddress,
            location: session.location,
            loginTime: session.loginTime,
            logoutTime: session.logoutTime,
            lastActivity: session.lastActivity,
            duration: session.logoutTime ? 
                session.logoutTime - session.loginTime : 
                new Date() - session.loginTime,
            status: session.isActive ? 'active' : 'inactive',
            loginMethod: session.loginMethod
        }));
        
        res.json({
            success: true,
            timeline,
            totalSessions: timeline.length
        });
        
    } catch (error) {
        console.error('Error getting user session timeline:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy lịch sử phiên người dùng'
        });
    }
};

// Get suspicious sessions (high risk score, unusual locations, etc.)
exports.getSuspiciousSessions = async (req, res) => {
    try {
        const suspiciousSessions = await UserSession.find({
            $or: [
                { riskScore: { $gte: 70 } }, // High risk score
                { 'location.city': { $regex: 'unknown', $options: 'i' } }, // Unknown location
                { 
                    loginTime: { 
                        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                    },
                    ipAddress: { $not: /^(127\.0\.0\.1|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/ } // Non-local IPs
                }
            ],
            isActive: true
        })
        .populate('userId', 'name email')
        .sort({ riskScore: -1, loginTime: -1 })
        .limit(20);

        const formattedSessions = suspiciousSessions.map(session => ({
            id: session._id,
            sessionId: session.sessionId,
            user: {
                name: session.userId.name,
                email: session.userId.email
            },
            device: session.device,
            ipAddress: session.ipAddress,
            location: session.location,
            loginTime: session.loginTime,
            lastActivity: session.lastActivity,
            riskScore: session.riskScore,
            riskFactors: this.calculateRiskFactors(session)
        }));

        res.json({
            success: true,
            suspiciousSessions: formattedSessions,
            count: formattedSessions.length
        });

    } catch (error) {
        console.error('Error getting suspicious sessions:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy phiên đăng nhập đáng nghi'
        });
    }
};

// Helper function to calculate risk factors
exports.calculateRiskFactors = (session) => {
    const factors = [];
    
    if (session.riskScore >= 80) factors.push('High Risk Score');
    if (session.location?.city?.toLowerCase().includes('unknown')) factors.push('Unknown Location');
    if (!session.ipAddress.match(/^(127\.0\.0\.1|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/)) {
        factors.push('External IP');
    }
    if (session.loginTime > new Date(Date.now() - 60 * 60 * 1000)) {
        factors.push('Recent Login');
    }
    
    return factors;
};
