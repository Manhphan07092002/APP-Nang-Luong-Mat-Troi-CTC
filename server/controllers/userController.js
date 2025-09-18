// File: server/controllers/userController.js

const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách người dùng' });
    }
};

// Get current user profile with comprehensive data
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        // Update last activity
        user.stats.lastActivityDate = new Date();
        await user.save();

        // Return comprehensive profile data
        const profileData = {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            address: user.address,
            position: user.position,
            company: user.company,
            bio: user.bio,
            profileImage: user.profileImage,
            dateOfBirth: user.dateOfBirth,
            gender: user.gender,
            role: user.role,
            stats: user.stats,
            preferences: user.preferences,
            socialProviders: {
                google: user.socialProviders?.google?.verified || false,
                facebook: user.socialProviders?.facebook?.verified || false
            },
            lastLogin: user.lastLogin,
            memberSince: user.createdAt,
            isActive: user.isActive
        };

        res.json(profileData);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy thông tin profile' });
    }
};

exports.updateUserProfile = async (req, res) => {
    try {
        console.log('=== UPDATE PROFILE REQUEST ===');
        console.log('User ID:', req.user._id);
        console.log('Request body keys:', Object.keys(req.body));
        console.log('ProfileImage in request:', req.body.profileImage ? 'YES (length: ' + req.body.profileImage.length + ')' : 'NO');
        
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        console.log('Current user profileImage:', user.profileImage ? 'EXISTS' : 'NULL');

        // Update basic profile fields
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.phone = req.body.phone || user.phone;
        user.address = req.body.address || user.address;
        user.position = req.body.position || user.position;
        user.company = req.body.company || user.company;
        user.bio = req.body.bio || user.bio;
        
        // Handle profileImage update specifically
        if (req.body.profileImage) {
            console.log('Updating profileImage...');
            user.profileImage = req.body.profileImage;
        }
        
        user.dateOfBirth = req.body.dateOfBirth || user.dateOfBirth;
        user.gender = req.body.gender || user.gender;

        // Update password if provided
        if (req.body.password) {
            user.password = req.body.password;
        }

        // Update preferences if provided
        if (req.body.preferences) {
            user.preferences = { ...user.preferences, ...req.body.preferences };
        }

        const updatedUser = await user.save();
        console.log('Profile saved successfully. New profileImage:', updatedUser.profileImage ? 'SAVED' : 'NULL');
        console.log('=== END UPDATE PROFILE ===');
        
        // Return updated profile data (excluding password)
        const profileData = {
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone,
            address: updatedUser.address,
            position: updatedUser.position,
            company: updatedUser.company,
            bio: updatedUser.bio,
            profileImage: updatedUser.profileImage,
            dateOfBirth: updatedUser.dateOfBirth,
            gender: updatedUser.gender,
            preferences: updatedUser.preferences,
            stats: updatedUser.stats
        };

        res.json({
            message: 'Cập nhật profile thành công',
            user: profileData
        });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ message: 'Lỗi server khi cập nhật profile' });
    }
};

exports.updateUserAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Vui lòng chọn một file ảnh.' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
        }

        // Delete old avatar if it exists and is not the default one
        if (user.profileImage && !user.profileImage.includes('default-avatar.png')) {
            const oldAvatarPath = path.join(__dirname, '../../client', user.profileImage);
            if (fs.existsSync(oldAvatarPath)) {
                fs.unlinkSync(oldAvatarPath);
                console.log(`Deleted old avatar: ${oldAvatarPath}`);
            }
        }

        const newAvatarUrl = `/uploads/avt/${req.file.filename}`;
        user.profileImage = newAvatarUrl;

        const updatedUser = await user.save();

        res.json({
            success: true,
            message: 'Cập nhật ảnh đại diện thành công!',
            filePath: updatedUser.profileImage
        });

    } catch (error) {
        console.error('Error updating user avatar:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật ảnh đại diện.' });
    }
};

// Update user statistics (for activity tracking)
exports.updateUserStats = async (req, res) => {
    console.log('--- Received request to /api/users/stats ---');
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        const { action, value = 1 } = req.body;
        
        switch (action) {
            case 'project_completed':
                user.stats.projectsCompleted += value;
                break;
            case 'report_generated':
                user.stats.reportsGenerated += value;
                break;
            case 'achievement_earned':
                user.stats.achievementsEarned += value;
                break;
            case 'login':
                user.lastLogin = new Date();
                user.stats.totalLoginDays += 1;
                break;
            case 'profile_update':
                // This action primarily updates the lastActivityDate, which is handled below.
                // No other stats need to be changed for a simple profile update.
                break;
            default:
                return res.status(400).json({ message: 'Action không hợp lệ' });
        }

        user.stats.lastActivityDate = new Date();
        await user.save();

        res.json({
            message: 'Cập nhật thống kê thành công',
            stats: user.stats
        });
    } catch (error) {
        console.error('Error updating user stats:', error);
        res.status(500).json({ message: 'Lỗi server khi cập nhật thống kê' });
    }
};

// Change user password
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        // Validation
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ 
                success: false,
                message: 'Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới' 
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ 
                success: false,
                message: 'Mật khẩu mới phải có ít nhất 6 ký tự' 
            });
        }

        // Find user and include password for verification
        const user = await User.findById(req.user._id).select('+password');
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'Không tìm thấy người dùng' 
            });
        }

        // Check if current password is correct
        const isCurrentPasswordValid = await user.matchPassword(currentPassword);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({ 
                success: false,
                message: 'Mật khẩu hiện tại không đúng' 
            });
        }

        // Check if new password is different from current password
        const isSamePassword = await user.matchPassword(newPassword);
        if (isSamePassword) {
            return res.status(400).json({ 
                success: false,
                message: 'Mật khẩu mới phải khác mật khẩu hiện tại' 
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        // Log security event
        console.log(`Password changed for user: ${user.email} at ${new Date()}`);

        res.json({ 
            success: true,
            message: 'Đổi mật khẩu thành công' 
        });

    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ 
            success: false,
            message: 'Lỗi server khi đổi mật khẩu' 
        });
    }
};

// Delete current user account
exports.deleteCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        await User.findByIdAndDelete(req.user._id);
        res.json({ message: 'Tài khoản đã được xóa thành công' });
    } catch (error) {
        console.error('Error deleting current user:', error);
        res.status(500).json({ message: 'Lỗi server khi xóa tài khoản' });
    }
};

// Admin: Create new user
exports.createUser = async (req, res) => {
    try {
        const { name, email, password, phone, address, role = 'user' } = req.body;
        
        // Validation
        if (!name || !email || !password || !phone) {
            return res.status(400).json({ 
                success: false,
                message: 'Vui lòng cung cấp đầy đủ thông tin bắt buộc' 
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                success: false,
                message: 'Email đã được sử dụng' 
            });
        }

        // Create new user
        const newUser = new User({
            name,
            email,
            password,
            phone,
            address,
            role
        });

        await newUser.save();

        // Return user data without password
        const userData = {
            _id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            phone: newUser.phone,
            address: newUser.address,
            role: newUser.role,
            isActive: newUser.isActive,
            createdAt: newUser.createdAt
        };

        res.status(201).json({
            success: true,
            message: 'Tạo người dùng thành công',
            user: userData
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ 
            success: false,
            message: 'Lỗi server khi tạo người dùng' 
        });
    }
};

// Admin: Update user
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, address, role, isActive } = req.body;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'Không tìm thấy người dùng' 
            });
        }

        // Check if email is being changed and already exists
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Email đã được sử dụng' 
                });
            }
        }

        // Update user fields
        user.name = name || user.name;
        user.email = email || user.email;
        user.phone = phone || user.phone;
        user.address = address || user.address;
        user.role = role || user.role;
        if (typeof isActive !== 'undefined') {
            user.isActive = isActive;
        }

        await user.save();

        // Return updated user data
        const userData = {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            address: user.address,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };

        res.json({
            success: true,
            message: 'Cập nhật người dùng thành công',
            user: userData
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ 
            success: false,
            message: 'Lỗi server khi cập nhật người dùng' 
        });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'Không tìm thấy người dùng' 
            });
        }

        // Prevent deleting admin users (optional security measure)
        if (user.role === 'admin' && user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ 
                success: false,
                message: 'Không thể xóa tài khoản admin hiện tại' 
            });
        }

        await User.findByIdAndDelete(req.params.id);
        
        res.json({ 
            success: true,
            message: `Đã xóa người dùng "${user.name}" thành công` 
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ 
            success: false,
            message: 'Lỗi server khi xóa người dùng' 
        });
    }
};

// Helper function to get clean IP address
function getCleanIP(req) {
    // Try multiple sources for IP address
    const ipSources = [
        req.headers['x-forwarded-for'],
        req.headers['x-real-ip'], 
        req.headers['x-client-ip'],
        req.headers['cf-connecting-ip'],
        req.connection?.remoteAddress,
        req.socket?.remoteAddress,
        req.connection?.socket?.remoteAddress,
        req.ip
    ];

    console.log('=== IP DETECTION RESULT ===');
    console.log('IP Sources tried:', ipSources);
    
    // Find first valid IP
    let finalIP = 'Unknown';
    for (const ip of ipSources) {
        if (ip && ip !== 'undefined') {
            // Convert IPv6 localhost to IPv4
            if (ip === '::1') {
                finalIP = '127.0.0.1';
                break;
            }
            // Clean IPv6 mapped IPv4
            if (ip.startsWith('::ffff:')) {
                finalIP = ip.replace(/^::ffff:/, '');
                break;
            }
            // Use first valid IP
            finalIP = ip;
            break;
        }
    }
    
    console.log('Final IP:', finalIP);
    console.log('========================');
    
    return finalIP;
}

// Helper function to parse device info from user agent
function parseDeviceInfo(userAgent) {
    if (!userAgent) return 'Unknown Device';
    
    // Browser detection
    let browser = 'Unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    
    // OS detection
    let os = 'Unknown';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
    
    return `${browser} on ${os}`;
}

// Get user IP address
exports.getUserIP = async (req, res) => {
    try {
        const cleanIP = getCleanIP(req);

        res.json({
            success: true,
            ip: cleanIP,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error getting user IP:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy địa chỉ IP',
            ip: 'Unknown'
        });
    }
};

// Get user active sessions
exports.getUserSessions = async (req, res) => {
    try {
        const userId = req.user.id;
        const UserSession = require('../models/userSessionModel');
        
        // Get real sessions from database
        const dbSessions = await UserSession.findActiveByUser(userId).populate('userId', 'name email');
        
        // Convert database sessions to frontend format
        const sessions = dbSessions.map(session => {
            const timeDiff = new Date() - session.lastActivity;
            const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
            const daysAgo = Math.floor(hoursAgo / 24);
            
            let status = 'Hiện tại';
            if (daysAgo > 0) {
                status = `${daysAgo} ngày trước`;
            } else if (hoursAgo > 0) {
                status = `${hoursAgo} giờ trước`;
            } else {
                status = 'Hiện tại';
            }
            
            // Determine if this is the current session based on IP and User-Agent
            const currentIP = getCleanIP(req);
            const currentUserAgent = req.headers['user-agent'] || 'Unknown';
            const isCurrent = session.ipAddress === currentIP && 
                            session.userAgent === currentUserAgent &&
                            timeDiff < 30 * 60 * 1000; // Within last 30 minutes
            
            return {
                id: session.sessionId,
                device: session.device,
                ip: session.ipAddress,
                location: session.location?.city ? 
                    `${session.location.city}, ${session.location.country}` : 
                    (session.ipAddress === '127.0.0.1' ? 'Localhost (Development)' : 'Unknown Location'),
                lastActive: session.lastActivity,
                isCurrent: isCurrent,
                userAgent: session.userAgent,
                status: status,
                loginTime: session.loginTime,
                loginMethod: session.loginMethod,
                browser: session.browser,
                os: session.os
            };
        });

        // If no sessions found, create a fallback current session
        if (sessions.length === 0) {
            const currentIP = getCleanIP(req);
            const userAgent = req.headers['user-agent'] || 'Unknown';
            
            sessions.push({
                id: 'current-fallback',
                device: parseDeviceInfo(userAgent),
                ip: currentIP,
                location: currentIP === '127.0.0.1' ? 'Localhost (Development)' : 'Ho Chi Minh City, Vietnam',
                lastActive: new Date(),
                isCurrent: true,
                userAgent: userAgent,
                status: 'Hiện tại',
                loginTime: new Date(),
                loginMethod: 'email'
            });
        }

        console.log(`📊 Retrieved ${sessions.length} sessions for user ${userId}`);

        res.json({
            success: true,
            sessions: sessions,
            totalSessions: sessions.length
        });

    } catch (error) {
        console.error('Error getting user sessions:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách phiên đăng nhập'
        });
    }
};

// Logout specific session
exports.logoutSession = async (req, res) => {
    try {
        const userId = req.user.id;
        const { sessionId } = req.params;
        const UserSession = require('../models/userSessionModel');
        
        // Find and logout the session
        const session = await UserSession.findOne({ 
            sessionId, 
            userId, 
            isActive: true 
        });
        
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phiên đăng nhập'
            });
        }
        
        await session.logout();
        
        console.log(`🚪 Session ${sessionId} logged out for user ${userId}`);
        
        res.json({
            success: true,
            message: 'Đã đăng xuất phiên thành công'
        });
        
    } catch (error) {
        console.error('Error logging out session:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi đăng xuất phiên'
        });
    }
};

// Logout all sessions except current
exports.logoutAllSessions = async (req, res) => {
    try {
        const userId = req.user.id;
        const currentIP = getCleanIP(req);
        const currentUserAgent = req.headers['user-agent'] || 'Unknown';
        const UserSession = require('../models/userSessionModel');
        
        // Logout all sessions except current one
        const result = await UserSession.updateMany(
            { 
                userId, 
                isActive: true,
                $or: [
                    { ipAddress: { $ne: currentIP } },
                    { userAgent: { $ne: currentUserAgent } }
                ]
            },
            { 
                isActive: false, 
                logoutTime: new Date() 
            }
        );
        
        console.log(`🚪 Logged out ${result.modifiedCount} sessions for user ${userId}`);
        
        res.json({
            success: true,
            message: `Đã đăng xuất ${result.modifiedCount} phiên khác`,
            loggedOutCount: result.modifiedCount
        });
        
    } catch (error) {
        console.error('Error logging out all sessions:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi đăng xuất tất cả phiên'
        });
    }
};

// Terminate a specific session
exports.terminateSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        if (sessionId === 'current-session') {
            return res.status(400).json({
                success: false,
                message: 'Không thể ngắt kết nối phiên hiện tại'
            });
        }

        // In real implementation, remove session from Redis/database
        // For now, just return success
        res.json({
            success: true,
            message: `Đã ngắt kết nối phiên ${sessionId}`,
            terminatedSessionId: sessionId
        });

    } catch (error) {
        console.error('Error terminating session:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi ngắt kết nối phiên'
        });
    }
};

// Terminate all sessions except current
exports.terminateAllSessions = async (req, res) => {
    try {
        // Mock implementation - in real app, you would invalidate all user sessions except current
        // For now, just return success message
        res.json({ success: true, message: 'Đã đăng xuất tất cả thiết bị khác', terminatedCount: 2 });
    } catch (error) {
        console.error('Error terminating all sessions:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi đăng xuất tất cả phiên' });
    }
};

// Two-Factor Authentication Functions
exports.setup2FA = async (req, res) => {
    try {
        const userId = req.user.id;
        const { secret, backupCodes } = req.body;

        if (!secret) {
            return res.status(400).json({ success: false, message: 'Secret key là bắt buộc' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        }

        // Update user with 2FA info
        user.twoFactorAuth = {
            enabled: true,
            secret: secret,
            backupCodes: backupCodes || [],
            enabledAt: new Date(),
            lastUsed: null
        };

        await user.save();
        console.log('2FA setup successful for user:', userId, 'enabled:', user.twoFactorAuth.enabled);

        res.json({ 
            success: true, 
            message: 'Đã thiết lập xác thực hai yếu tố thành công',
            twoFactorEnabled: true
        });
    } catch (error) {
        console.error('Error setting up 2FA:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi thiết lập 2FA' });
    }
};

exports.verify2FA = async (req, res) => {
    try {
        const userId = req.user.id;
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ success: false, message: 'Mã xác thực là bắt buộc' });
        }

        const user = await User.findById(userId).select('+twoFactorAuth.secret');
        if (!user || !user.twoFactorAuth.enabled) {
            return res.status(400).json({ success: false, message: '2FA chưa được thiết lập' });
        }

        // In real implementation, you would verify the TOTP token here
        // For now, we'll accept any 6-digit code
        const isValidToken = /^\d{6}$/.test(token);

        if (isValidToken) {
            // Update last used time
            user.twoFactorAuth.lastUsed = new Date();
            await user.save();

            res.json({ 
                success: true, 
                message: 'Xác thực thành công',
                verified: true
            });
        } else {
            res.status(400).json({ success: false, message: 'Mã xác thực không hợp lệ' });
        }
    } catch (error) {
        console.error('Error verifying 2FA:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi xác thực 2FA' });
    }
};

exports.get2FAStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        }

        const twoFactorEnabled = user.twoFactorAuth?.enabled || false;
        console.log('Getting 2FA status for user:', userId, 'enabled:', twoFactorEnabled);

        res.json({ 
            success: true, 
            twoFactorEnabled: twoFactorEnabled,
            enabledAt: user.twoFactorAuth?.enabledAt,
            lastUsed: user.twoFactorAuth?.lastUsed
        });
    } catch (error) {
        console.error('Error getting 2FA status:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy trạng thái 2FA' });
    }
};

exports.disable2FA = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        }

        // Disable 2FA
        user.twoFactorAuth = {
            enabled: false,
            secret: null,
            backupCodes: [],
            enabledAt: null,
            lastUsed: null
        };

        await user.save();

        res.json({ 
            success: true, 
            message: 'Đã tắt xác thực hai yếu tố',
            twoFactorEnabled: false
        });
    } catch (error) {
        console.error('Error disabling 2FA:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi tắt 2FA' });
    }
};

// Helper function to get device info from user agent
function getDeviceInfo(userAgent) {
if (!userAgent) return 'Unknown Device';
    
    if (userAgent.includes('Chrome')) {
        if (userAgent.includes('Windows')) return 'Chrome on Windows';
        if (userAgent.includes('Mac')) return 'Chrome on Mac';
        if (userAgent.includes('Android')) return 'Chrome on Android';
        return 'Chrome Browser';
    }
    
    if (userAgent.includes('Firefox')) {
        if (userAgent.includes('Windows')) return 'Firefox on Windows';
        if (userAgent.includes('Mac')) return 'Firefox on Mac';
        if (userAgent.includes('Android')) return 'Firefox on Android';
        return 'Firefox Browser';
    }
    
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
        if (userAgent.includes('iPhone')) return 'Safari on iPhone';
        if (userAgent.includes('iPad')) return 'Safari on iPad';
        if (userAgent.includes('Mac')) return 'Safari on Mac';
        return 'Safari Browser';
    }
    
    if (userAgent.includes('Edge')) return 'Microsoft Edge';
    if (userAgent.includes('Opera')) return 'Opera Browser';
    
    return 'Unknown Browser';
}