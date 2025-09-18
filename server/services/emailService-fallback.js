const nodemailer = require('nodemailer');

// Fallback Email service with multiple providers
class EmailServiceFallback {
    constructor() {
        this.transporters = this.createTransporters();
        this.currentTransporterIndex = 0;
    }

    createTransporters() {
        const transporters = [];

        // Gmail SMTP (primary)
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            transporters.push({
                name: 'Gmail',
                transporter: nodemailer.createTransporter({
                    host: 'smtp.gmail.com',
                    port: 587,
                    secure: false,
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS
                    },
                    tls: {
                        rejectUnauthorized: false
                    }
                })
            });
        }

        // Ethereal Email (testing - always works)
        transporters.push({
            name: 'Ethereal (Test)',
            transporter: nodemailer.createTransporter({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: 'ethereal.user@ethereal.email',
                    pass: 'ethereal.pass'
                }
            })
        });

        return transporters;
    }

    async sendVerificationEmail(email, verificationCode, userName = 'Người dùng') {
        // Try each transporter until one works
        for (let i = 0; i < this.transporters.length; i++) {
            const { name, transporter } = this.transporters[i];
            
            try {
                console.log(`🔄 Trying ${name} email service...`);
                
                const mailOptions = {
                    from: {
                        name: 'Solar Analytics',
                        address: process.env.EMAIL_USER || 'noreply@solaranalytics.com'
                    },
                    to: email,
                    subject: '🔐 Mã xác thực tài khoản Solar Analytics',
                    html: this.generateVerificationEmailHTML(verificationCode, userName)
                };

                const result = await transporter.sendMail(mailOptions);
                console.log(`✅ ${name} email sent successfully:`, result.messageId);
                
                // If using test service, show preview URL
                if (name.includes('Test') && result.messageId) {
                    const previewUrl = nodemailer.getTestMessageUrl(result);
                    if (previewUrl) {
                        console.log(`📧 Preview email: ${previewUrl}`);
                    }
                }
                
                return { 
                    success: true, 
                    messageId: result.messageId,
                    provider: name,
                    previewUrl: name.includes('Test') ? nodemailer.getTestMessageUrl(result) : null
                };
                
            } catch (error) {
                console.error(`❌ ${name} failed:`, error.message);
                
                // If this is the last transporter, return error
                if (i === this.transporters.length - 1) {
                    return { 
                        success: false, 
                        error: `All email providers failed. Last error: ${error.message}`,
                        provider: name
                    };
                }
                // Otherwise, continue to next transporter
            }
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
                    margin: 0;
                    padding: 0;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 15px;
                    overflow: hidden;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                }
                .header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 40px 30px;
                    text-align: center;
                }
                .header h1 {
                    margin: 0;
                    font-size: 28px;
                    font-weight: 700;
                }
                .content {
                    padding: 40px 30px;
                }
                .verification-code {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    font-size: 32px;
                    font-weight: bold;
                    text-align: center;
                    padding: 20px;
                    border-radius: 10px;
                    margin: 30px 0;
                    letter-spacing: 8px;
                    font-family: 'Courier New', monospace;
                }
                .footer {
                    background: #f8f9fa;
                    padding: 30px;
                    text-align: center;
                    color: #6c757d;
                    font-size: 14px;
                }
                .warning {
                    background: #fff3cd;
                    border: 1px solid #ffeaa7;
                    color: #856404;
                    padding: 15px;
                    border-radius: 8px;
                    margin: 20px 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🌞 Solar Analytics</h1>
                    <p>Xác thực tài khoản của bạn</p>
                </div>
                
                <div class="content">
                    <h2>Xin chào ${userName}!</h2>
                    <p>Cảm ơn bạn đã đăng ký tài khoản Solar Analytics. Để hoàn tất quá trình đăng ký, vui lòng sử dụng mã xác thực bên dưới:</p>
                    
                    <div class="verification-code">
                        ${verificationCode}
                    </div>
                    
                    <p><strong>Mã xác thực này có hiệu lực trong 10 phút.</strong></p>
                    
                    <div class="warning">
                        <strong>⚠️ Lưu ý bảo mật:</strong>
                        <ul style="margin: 10px 0; padding-left: 20px;">
                            <li>Không chia sẻ mã này với bất kỳ ai</li>
                            <li>Solar Analytics sẽ không bao giờ yêu cầu mã qua điện thoại</li>
                            <li>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email</li>
                        </ul>
                    </div>
                    
                    <p>Nếu bạn gặp khó khăn, vui lòng liên hệ đội ngũ hỗ trợ của chúng tôi.</p>
                    
                    <p>Trân trọng,<br><strong>Đội ngũ Solar Analytics</strong></p>
                </div>
                
                <div class="footer">
                    <p>© 2024 Solar Analytics. Tất cả quyền được bảo lưu.</p>
                    <p>Email này được gửi tự động, vui lòng không trả lời.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    // Test email configuration
    async testConfiguration() {
        console.log('🧪 Testing email configuration...\n');
        
        for (const { name, transporter } of this.transporters) {
            try {
                console.log(`Testing ${name}...`);
                await transporter.verify();
                console.log(`✅ ${name} configuration is valid`);
            } catch (error) {
                console.log(`❌ ${name} configuration failed: ${error.message}`);
            }
        }
    }
}

module.exports = new EmailServiceFallback();
