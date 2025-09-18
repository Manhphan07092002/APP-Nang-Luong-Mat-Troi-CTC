const nodemailer = require('nodemailer');

// Email service for sending verification codes
class EmailService {
    constructor() {
        // Create transporter with Gmail SMTP
        this.transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER, // Your Gmail address
                pass: process.env.EMAIL_PASS  // Your Gmail app password
            },
            tls: {
                rejectUnauthorized: false
            }
        });
    }

    // Send verification email
    async sendVerificationEmail(email, verificationCode, userName = 'Người dùng') {
        try {
            const mailOptions = {
                from: {
                    name: 'Solar Analytics',
                    address: process.env.EMAIL_USER
                },
                to: email,
                subject: '🔐 Mã xác thực tài khoản Solar Analytics',
                html: this.generateVerificationEmailHTML(verificationCode, userName)
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log('Verification email sent successfully:', result.messageId);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('Error sending verification email:', error);
            return { success: false, error: error.message };
        }
    }

    // Send general email (for forgot password, notifications, etc.)
    async sendEmail(emailData) {
        try {
            const mailOptions = {
                from: {
                    name: 'Solar Analytics',
                    address: process.env.EMAIL_USER
                },
                to: emailData.to,
                subject: emailData.subject,
                html: emailData.html
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log('Email sent successfully:', result.messageId);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('Error sending email:', error);
            return { success: false, error: error.message };
        }
    }

    // Generate beautiful HTML email template
    generateVerificationEmailHTML(verificationCode, userName) {
        return `
        <!DOCTYPE html>
        <html lang="vi">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Mã xác thực Solar Analytics</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    border-radius: 10px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px;
                    text-align: center;
                }
                .header h1 {
                    margin: 0;
                    font-size: 28px;
                    font-weight: 600;
                }
                .content {
                    padding: 40px 30px;
                }
                .greeting {
                    font-size: 18px;
                    margin-bottom: 20px;
                    color: #2c3e50;
                }
                .verification-box {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 10px;
                    padding: 30px;
                    text-align: center;
                    margin: 30px 0;
                }
                .verification-code {
                    font-size: 36px;
                    font-weight: bold;
                    color: white;
                    letter-spacing: 8px;
                    margin: 10px 0;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
                }
                .verification-label {
                    color: rgba(255,255,255,0.9);
                    font-size: 14px;
                    margin-bottom: 10px;
                }
                .instructions {
                    background-color: #f8f9fa;
                    border-left: 4px solid #667eea;
                    padding: 20px;
                    margin: 20px 0;
                    border-radius: 5px;
                }
                .warning {
                    background-color: #fff3cd;
                    border: 1px solid #ffeaa7;
                    color: #856404;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 20px 0;
                }
                .footer {
                    background-color: #2c3e50;
                    color: white;
                    padding: 20px;
                    text-align: center;
                    font-size: 14px;
                }
                .footer a {
                    color: #74b9ff;
                    text-decoration: none;
                }
                .logo {
                    font-size: 24px;
                    margin-bottom: 10px;
                }
                .features {
                    display: flex;
                    justify-content: space-around;
                    margin: 30px 0;
                    flex-wrap: wrap;
                }
                .feature {
                    text-align: center;
                    flex: 1;
                    min-width: 150px;
                    margin: 10px;
                }
                .feature-icon {
                    font-size: 24px;
                    margin-bottom: 10px;
                }
                @media (max-width: 600px) {
                    .container {
                        margin: 0 10px;
                    }
                    .content {
                        padding: 20px;
                    }
                    .verification-code {
                        font-size: 28px;
                        letter-spacing: 4px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">🌞 Solar Analytics</div>
                    <h1>Xác Thực Tài Khoản</h1>
                </div>
                
                <div class="content">
                    <div class="greeting">
                        Xin chào <strong>${userName}</strong>,
                    </div>
                    
                    <p>Cảm ơn bạn đã đăng ký tài khoản Solar Analytics! Để hoàn tất quá trình đăng ký, vui lòng sử dụng mã xác thực dưới đây:</p>
                    
                    <div class="verification-box">
                        <div class="verification-label">MÃ XÁC THỰC CỦA BẠN</div>
                        <div class="verification-code">${verificationCode}</div>
                        <div style="color: rgba(255,255,255,0.8); font-size: 12px; margin-top: 10px;">
                            Mã có hiệu lực trong 10 phút
                        </div>
                    </div>
                    
                    <div class="instructions">
                        <h3 style="margin-top: 0; color: #667eea;">📋 Hướng dẫn sử dụng:</h3>
                        <ol>
                            <li>Sao chép mã xác thực <strong>${verificationCode}</strong></li>
                            <li>Quay lại trang đăng ký Solar Analytics</li>
                            <li>Nhập mã vào ô "Mã xác thực"</li>
                            <li>Nhấn "Xác thực" để hoàn tất</li>
                        </ol>
                    </div>
                    
                    <div class="warning">
                        <strong>⚠️ Lưu ý quan trọng:</strong>
                        <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                            <li>Mã xác thực chỉ có hiệu lực trong <strong>10 phút</strong></li>
                            <li>Không chia sẻ mã này với bất kỳ ai</li>
                            <li>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email</li>
                        </ul>
                    </div>
                    
                    <div class="features">
                        <div class="feature">
                            <div class="feature-icon">📊</div>
                            <div><strong>Phân Tích Chi Tiết</strong></div>
                            <div style="font-size: 12px; color: #666;">Theo dõi hiệu suất năng lượng mặt trời</div>
                        </div>
                        <div class="feature">
                            <div class="feature-icon">🔒</div>
                            <div><strong>Bảo Mật Cao</strong></div>
                            <div style="font-size: 12px; color: #666;">Dữ liệu được bảo vệ an toàn</div>
                        </div>
                        <div class="feature">
                            <div class="feature-icon">📱</div>
                            <div><strong>Đa Nền Tảng</strong></div>
                            <div style="font-size: 12px; color: #666;">Truy cập mọi lúc, mọi nơi</div>
                        </div>
                    </div>
                    
                    <p style="text-align: center; margin-top: 30px;">
                        <strong>Cần hỗ trợ?</strong><br>
                        Liên hệ với chúng tôi qua email: 
                        <a href="mailto:support@solaranalytics.com" style="color: #667eea;">support@solaranalytics.com</a>
                    </p>
                </div>
                
                <div class="footer">
                    <p>© 2024 Solar Analytics. Tất cả quyền được bảo lưu.</p>
                    <p>
                        <a href="#">Chính sách bảo mật</a> | 
                        <a href="#">Điều khoản sử dụng</a> | 
                        <a href="#">Liên hệ</a>
                    </p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    // Send SMS verification (placeholder for future SMS service integration)
    async sendVerificationSMS(phone, verificationCode) {
        // TODO: Integrate with SMS service like Twilio
        console.log(`SMS verification code for ${phone}: ${verificationCode}`);
        return { success: true, message: 'SMS sent (simulated)' };
    }

    // Test email configuration
    async testEmailConfig() {
        try {
            await this.transporter.verify();
            console.log('Email configuration is valid');
            return { success: true };
        } catch (error) {
            console.error('Email configuration error:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new EmailService();
