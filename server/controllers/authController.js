const User = require('../models/userModel');
const Stats = require('../models/statsModel');
const UserSession = require('../models/userSessionModel');
const jwt = require('jsonwebtoken');
const emailService = require('../services/emailService');
const crypto = require('crypto');
const { logSecurityEvent } = require('./securityController');

const generateToken = (id) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable is not set');
    }
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Helper function to parse device info from user agent
const parseDeviceInfo = (userAgent) => {
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
};

// Generate random verification code
const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
};

exports.registerUser = async (req, res) => {
    const { name, email, password, phone, address, employeeId } = req.body;
    
    // Input validation
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Tên, email và mật khẩu là bắt buộc' });
    }
    
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'Email đã tồn tại' });
        }

        const userData = { name, email, password, phone, address };
        if (employeeId && employeeId.trim() !== '') {
            userData.employeeId = employeeId;
        }
        const user = await User.create(userData);

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profileImage: user.profileImage,
                phone: user.phone,
                position: user.position,
                company: user.company,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Dữ liệu người dùng không hợp lệ' });
        }
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
    
    // Input validation
    if (!email || !password) {
        return res.status(400).json({ message: 'Email và mật khẩu là bắt buộc' });
    }
    
    try {
        const user = await User.findOne({ email }).select('+password');
        if (user && (await user.matchPassword(password))) {
            try {
                await Stats.increment('logins');
            } catch (statsError) {
                console.error('Error incrementing login stats:', statsError);
                // Continue with login even if stats fail
            }
            
            // Get client IP address with comprehensive detection
            let clientIP = 'Unknown';
            
            // Try multiple IP detection methods in order of preference
            const ipSources = [
                req.headers['cf-connecting-ip'], // Cloudflare
                req.headers['x-client-ip'],      // General proxy
                req.headers['x-forwarded-for']?.split(',')[0]?.trim(), // Load balancer
                req.headers['x-real-ip'],        // Nginx proxy
                req.ip,                          // Express with trust proxy
                req.connection?.remoteAddress,   // Direct connection
                req.socket?.remoteAddress,       // Socket connection
                req.connection?.socket?.remoteAddress // Nested socket
            ];
            
            // Find the first valid IP, preferring IPv4
            for (const ip of ipSources) {
                if (ip && ip !== 'undefined' && ip.trim() !== '') {
                    let cleanIP = ip.trim();
                    
                    // Convert IPv6 localhost to IPv4
                    if (cleanIP === '::1') {
                        cleanIP = '127.0.0.1';
                    }
                    
                    // Skip localhost IPs unless it's the only option
                    if (cleanIP !== '127.0.0.1' && cleanIP !== 'localhost') {
                        clientIP = cleanIP;
                        break;
                    } else if (clientIP === 'Unknown') {
                        // Keep localhost as fallback
                        clientIP = '127.0.0.1';
                    }
                }
            }
            
            // Final fallback to IPv4 localhost
            if (clientIP === 'Unknown') {
                clientIP = '127.0.0.1';
            }
            
            console.log('=== IP DETECTION RESULT ===');
            console.log('Final IP:', clientIP);
            console.log('IP Sources tried:', ipSources);
            console.log('========================');
            
            // Update last login time and IP
            user.lastLogin = new Date();
            user.lastLoginIP = clientIP;
            
            // Add to login history (keep last 10 entries)
            if (!user.loginHistory) user.loginHistory = [];
            user.loginHistory.unshift({
                ip: clientIP,
                userAgent: req.headers['user-agent'] || 'Unknown',
                timestamp: new Date()
            });
            if (user.loginHistory.length > 10) {
                user.loginHistory = user.loginHistory.slice(0, 10);
            }
            
            await user.save();
            
            // Log successful login
            await logSecurityEvent(
                'login_success',
                `Đăng nhập thành công từ IP ${clientIP}`,
                'low',
                user,
                req
            );
            
            // Generate JWT token
            const token = generateToken(user._id);
            
            // Create session record in database
            try {
                const sessionData = {
                    userId: user._id,
                    sessionId: crypto.randomUUID(),
                    ipAddress: clientIP,
                    userAgent: req.headers['user-agent'] || 'Unknown',
                    device: parseDeviceInfo(req.headers['user-agent'] || 'Unknown'),
                    loginMethod: 'email',
                    jwtToken: token,
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                    location: {
                        city: clientIP === '127.0.0.1' ? 'Localhost' : 'Ho Chi Minh City',
                        country: clientIP === '127.0.0.1' ? 'Development' : 'Vietnam',
                        region: clientIP === '127.0.0.1' ? 'Local' : 'Southeast Asia'
                    }
                };
                
                await UserSession.createSession(sessionData);
                console.log('✅ Session created successfully for user:', user.email);
            } catch (sessionError) {
                console.error('❌ Error creating session:', sessionError);
                // Continue with login even if session creation fails
            }
            
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profileImage: user.profileImage,
                phone: user.phone,
                position: user.position,
                company: user.company,
                lastLogin: user.lastLogin,
                token: token,
            });
        } else {
            // Log failed login attempt
            await logSecurityEvent(
                'login_failed',
                `Đăng nhập thất bại - Email hoặc mật khẩu không đúng từ IP ${req.ip || 'Unknown'}`,
                'medium',
                null,
                req
            );
            
            res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
        }
    } catch (error) {
        console.error('Login error:', error);
        
        // Log system error
        await logSecurityEvent(
            'login_failed',
            `Lỗi hệ thống khi đăng nhập: ${error.message}`,
            'high',
            null,
            req
        );
        
        res.status(500).json({ message: error.message });
    }
};

// Send verification code to email or phone
exports.sendVerificationCode = async (req, res) => {
    const { email, phone, type } = req.body; // type: 'email' or 'phone'
    
    try {
        // Generate verification code
        const verificationCode = generateVerificationCode();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        
        // Store verification code in memory (in production, use Redis or database)
        global.verificationCodes = global.verificationCodes || {};
        const key = email || phone;
        global.verificationCodes[key] = {
            code: verificationCode,
            expiresAt: expiresAt,
            type: type
        };
        
        let sendResult = { success: false };
        
        if (type === 'email' && email) {
            // Send real email
            sendResult = await emailService.sendVerificationEmail(email, verificationCode);
            
            if (sendResult.success) {
                console.log(`Verification email sent successfully to ${email}`);
            } else {
                console.error(`Failed to send email to ${email}:`, sendResult.error);
                // Fallback to console log for development
                console.log(`Verification code for ${email}: ${verificationCode}`);
            }
        } else if (type === 'phone' && phone) {
            // Send SMS (placeholder - implement SMS service later)
            sendResult = await emailService.sendVerificationSMS(phone, verificationCode);
        }
        
        res.json({
            success: true,
            message: type === 'email' 
                ? `Mã xác thực đã được gửi đến email ${email}` 
                : `Mã xác thực đã được gửi đến số điện thoại ${phone}`,
            emailSent: sendResult.success,
            // For development, return the code when email fails
            ...(type === 'email' && !sendResult.success ? { verificationCode: verificationCode } : {})
        });
    } catch (error) {
        console.error('Error in sendVerificationCode:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi khi gửi mã xác thực' 
        });
    }
};

// Verify email or phone code
exports.verifyCode = async (req, res) => {
    const { email, phone, code } = req.body;
    
    try {
        const key = email || phone;
        console.log('Verify request - Key:', key, 'Code:', code);
        console.log('Stored codes:', Object.keys(global.verificationCodes || {}));
        
        const storedData = global.verificationCodes?.[key];
        console.log('Stored data for key:', storedData);
        
        if (!storedData) {
            return res.status(400).json({
                success: false,
                message: 'Mã xác thực không tồn tại hoặc đã hết hạn'
            });
        }
        
        if (new Date() > storedData.expiresAt) {
            delete global.verificationCodes[key];
            return res.status(400).json({
                success: false,
                message: 'Mã xác thực đã hết hạn'
            });
        }
        
        if (storedData.code !== code) {
            return res.status(400).json({
                success: false,
                message: 'Mã xác thực không đúng'
            });
        }
        
        // Verification successful
        delete global.verificationCodes[key];
        
        res.json({
            success: true,
            message: 'Xác thực thành công!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xác thực'
        });
    }
};

// Debug endpoint to get verification codes (remove in production)
exports.getVerificationCodes = async (req, res) => {
    try {
        const codes = global.verificationCodes || {};
        const debugInfo = {};
        
        for (const [key, data] of Object.entries(codes)) {
            debugInfo[key] = {
                code: data.code,
                expiresAt: data.expiresAt,
                timeLeft: Math.max(0, Math.floor((data.expiresAt - new Date()) / 1000)),
                type: data.type
            };
        }
        
        res.json({
            success: true,
            codes: debugInfo,
            totalCodes: Object.keys(codes).length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Debug endpoint error'
        });
    }
};

// Generate password reset token
const generateResetToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Forgot Password - Send reset email
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    
    try {
        // Validate email
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập địa chỉ email'
            });
        }

        // Check if user exists
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tài khoản với email này'
            });
        }

        // Generate reset token
        const resetToken = generateResetToken();
        const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        // Store reset token in memory (in production, use Redis or database)
        global.passwordResetTokens = global.passwordResetTokens || {};
        global.passwordResetTokens[email.toLowerCase()] = {
            token: resetToken,
            userId: user._id.toString(),
            expiresAt: resetTokenExpiry
        };

        // Create reset URL
        const resetUrl = `${req.protocol}://${req.get('host')}/reset-password.html?token=${resetToken}&email=${encodeURIComponent(email)}`;

        // Send reset email
        const emailData = {
            to: email,
            subject: '🔑 Đặt lại mật khẩu - SolarAnalytics',
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 12px 12px 0 0; box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);">
                        <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700;">🔑 Đặt lại mật khẩu</h1>
                        <p style="color: #e2e8f0; margin: 15px 0 0 0; font-size: 16px;">SolarAnalytics - Hệ thống phân tích năng lượng mặt trời</p>
                    </div>
                    
                    <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                        <h2 style="color: #2d3748; margin-bottom: 20px;">Xin chào ${user.name}!</h2>
                        
                        <p style="color: #4a5568; line-height: 1.6; margin-bottom: 20px;">
                            Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. 
                            Nhấp vào nút bên dưới để tạo mật khẩu mới:
                        </p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetUrl}" 
                               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                      color: white; 
                                      padding: 15px 30px; 
                                      text-decoration: none; 
                                      border-radius: 8px; 
                                      font-weight: bold; 
                                      display: inline-block;
                                      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                                🔐 Đặt lại mật khẩu
                            </a>
                        </div>
                        
                        <div style="background: #edf2f7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #2d3748; margin-top: 0;">⚠️ Lưu ý quan trọng:</h3>
                            <ul style="color: #4a5568; margin: 0; padding-left: 20px;">
                                <li>Liên kết này chỉ có hiệu lực trong <strong>15 phút</strong></li>
                                <li>Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này</li>
                                <li>Không chia sẻ liên kết này với bất kỳ ai</li>
                            </ul>
                        </div>
                        
                        <p style="color: #718096; font-size: 14px; margin-top: 30px;">
                            Nếu nút không hoạt động, bạn có thể sao chép và dán liên kết sau vào trình duyệt:
                        </p>
                        <p style="background: #f7fafc; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 12px; color: #4a5568;">
                            ${resetUrl}
                        </p>
                        
                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                        
                        <div style="text-align: center; color: #718096; font-size: 14px;">
                            <p>Cần hỗ trợ? Liên hệ với chúng tôi:</p>
                            <p>
                                📧 <a href="mailto:support@solaranalytics.com" style="color: #667eea;">support@solaranalytics.com</a> | 
                                📞 <a href="tel:+84123456789" style="color: #667eea;">+84 123 456 789</a>
                            </p>
                            <p style="margin-top: 20px; font-size: 12px;">
                                © 2024 SolarAnalytics. Bản quyền thuộc về chúng tôi.
                            </p>
                        </div>
                    </div>
                </div>
            `
        };

        let emailSent = false;
        try {
            const result = await emailService.sendEmail(emailData);
            emailSent = result.success;
            
            if (!emailSent) {
                console.error('Failed to send reset email:', result.error);
                // Log the reset token for development
                console.log(`Password reset token for ${email}: ${resetToken}`);
                console.log(`Reset URL: ${resetUrl}`);
            }
        } catch (emailError) {
            console.error('Email service error:', emailError);
            // Log the reset token for development
            console.log(`Password reset token for ${email}: ${resetToken}`);
            console.log(`Reset URL: ${resetUrl}`);
        }

        // Always return success for security (don't reveal if email exists)
        res.json({
            success: true,
            message: 'Nếu email tồn tại trong hệ thống, liên kết đặt lại mật khẩu đã được gửi',
            emailSent: emailSent,
            // For development, include reset info when email fails
            ...(process.env.NODE_ENV === 'development' && !emailSent ? { 
                resetToken: resetToken,
                resetUrl: resetUrl 
            } : {})
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi xử lý yêu cầu đặt lại mật khẩu'
        });
    }
};

// Reset Password - Verify token and update password
exports.resetPassword = async (req, res) => {
    const { token, email, newPassword, confirmPassword } = req.body;
    
    try {
        // Validate input
        if (!token || !email || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin'
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu xác nhận không khớp'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu phải có ít nhất 6 ký tự'
            });
        }

        // Check if reset token exists and is valid
        const storedData = global.passwordResetTokens?.[email.toLowerCase()];
        if (!storedData) {
            return res.status(400).json({
                success: false,
                message: 'Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn'
            });
        }

        if (new Date() > storedData.expiresAt) {
            delete global.passwordResetTokens[email.toLowerCase()];
            return res.status(400).json({
                success: false,
                message: 'Token đặt lại mật khẩu đã hết hạn'
            });
        }

        if (storedData.token !== token) {
            return res.status(400).json({
                success: false,
                message: 'Token đặt lại mật khẩu không hợp lệ'
            });
        }

        // Find user and update password
        const user = await User.findById(storedData.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        // Update password
        user.password = newPassword;
        user.passwordChangedAt = new Date();
        await user.save();

        // Remove used token
        delete global.passwordResetTokens[email.toLowerCase()];

        res.json({
            success: true,
            message: 'Mật khẩu đã được đặt lại thành công',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profileImage: user.profileImage,
                token: generateToken(user._id)
            }
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi đặt lại mật khẩu'
        });
    }
};

// Validate Reset Token - Check if reset token is valid
exports.validateResetToken = async (req, res) => {
    const { token, email } = req.body;
    
    try {
        // Validate input
        if (!token || !email) {
            return res.status(400).json({
                success: false,
                message: 'Token và email là bắt buộc'
            });
        }

        // Check if reset token exists and is valid
        const storedData = global.passwordResetTokens?.[email.toLowerCase()];
        if (!storedData) {
            return res.status(400).json({
                success: false,
                message: 'Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn'
            });
        }

        // Check if token has expired
        if (new Date() > storedData.expiresAt) {
            delete global.passwordResetTokens[email.toLowerCase()];
            return res.status(400).json({
                success: false,
                message: 'Token đặt lại mật khẩu đã hết hạn'
            });
        }

        // Check if token matches
        if (storedData.token !== token) {
            return res.status(400).json({
                success: false,
                message: 'Token đặt lại mật khẩu không hợp lệ'
            });
        }

        // Find user to ensure they still exist
        const user = await User.findById(storedData.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        res.json({
            success: true,
            message: 'Token hợp lệ',
            email: email
        });

    } catch (error) {
        console.error('Validate reset token error:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi xác thực token'
        });
    }
};