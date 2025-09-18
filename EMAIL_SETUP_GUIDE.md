# 📧 Hướng Dẫn Cấu Hình Email Xác Thực

## 🎯 Mục Đích
Hướng dẫn này sẽ giúp bạn cấu hình Gmail SMTP để gửi email xác thực thật cho người dùng đăng ký tài khoản Solar Analytics.

## 📋 Yêu Cầu
- Tài khoản Gmail
- Bật 2-Step Verification trên Gmail
- Tạo App Password cho ứng dụng

## 🔧 Các Bước Cấu Hình

### Bước 1: Chuẩn Bị Tài Khoản Gmail

1. **Đăng nhập Gmail**: Truy cập [Gmail](https://gmail.com) với tài khoản bạn muốn sử dụng
2. **Kiểm tra email**: Đảm bảo tài khoản Gmail hoạt động bình thường

### Bước 2: Bật 2-Step Verification

1. Truy cập [Google Account Settings](https://myaccount.google.com/)
2. Chọn **Security** (Bảo mật) ở menu bên trái
3. Tìm mục **2-Step Verification** (Xác minh 2 bước)
4. Nhấn **Get started** và làm theo hướng dẫn
5. Chọn phương thức xác minh (SMS hoặc Google Authenticator)

### Bước 3: Tạo App Password

1. Sau khi bật 2-Step Verification, quay lại **Security**
2. Tìm mục **App passwords** (Mật khẩu ứng dụng)
3. Nhấn **App passwords**
4. Chọn **Mail** từ dropdown "Select app"
5. Chọn **Other** từ dropdown "Select device"
6. Nhập tên: **Solar Analytics**
7. Nhấn **Generate**
8. **QUAN TRỌNG**: Copy mật khẩu 16 ký tự (dạng: abcd efgh ijkl mnop)

### Bước 4: Cập Nhật File .env

1. Mở file `server/.env`
2. Tìm các dòng:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```
3. Thay thế:
   - `your-email@gmail.com` → Email Gmail thật của bạn
   - `your-app-password` → App Password 16 ký tự vừa tạo

**Ví dụ:**
```env
EMAIL_USER=manhpham@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
```

### Bước 5: Restart Server

1. Dừng server hiện tại (Ctrl+C)
2. Khởi động lại server:
   ```bash
   cd server
   node server.js
   ```

## 🧪 Test Email

### Test Nhanh Qua API
```bash
# PowerShell
Invoke-RestMethod -Uri "http://localhost:5000/api/auth/send-verification" -Method POST -ContentType "application/json" -Body '{"email":"your-test-email@gmail.com","type":"email"}'
```

### Test Qua Website
1. Truy cập `http://localhost:5000/register.html`
2. Điền form đăng ký với email thật
3. Nhấn "Đăng Ký"
4. Kiểm tra hộp thư email

## 🎨 Email Template

Email xác thực sẽ có:
- **Thiết kế đẹp**: Gradient background, responsive design
- **Mã xác thực**: Hiển thị rõ ràng, dễ copy
- **Hướng dẫn**: Các bước sử dụng mã
- **Bảo mật**: Cảnh báo về thời gian hết hạn (10 phút)
- **Branding**: Logo và thông tin Solar Analytics

## 🔍 Troubleshooting

### Lỗi "Invalid login credentials"
- Kiểm tra EMAIL_USER có đúng không
- Đảm bảo sử dụng App Password, không phải mật khẩu Gmail thường
- Kiểm tra 2-Step Verification đã bật chưa

### Lỗi "Connection timeout"
- Kiểm tra kết nối internet
- Thử với Gmail khác
- Kiểm tra firewall/antivirus

### Email không đến
- Kiểm tra thư mục Spam/Junk
- Thử với email khác
- Kiểm tra console log để xem có lỗi không

### Email đến nhưng không có mã
- Kiểm tra HTML email có render đúng không
- Thử với email client khác (Gmail web, Outlook, etc.)

## 📊 Monitoring

Server sẽ log các thông tin sau:
- ✅ Email gửi thành công: `Verification email sent successfully to email@example.com`
- ❌ Email gửi thất bại: `Failed to send email to email@example.com: [error]`
- 🔄 Fallback: `Verification code for email@example.com: 123456` (khi email fail)

## 🚀 Production Notes

### Bảo Mật
- Không commit file `.env` lên Git
- Sử dụng environment variables trên server production
- Rotate App Password định kỳ

### Performance
- Cân nhắc sử dụng email service chuyên nghiệp (SendGrid, Mailgun)
- Implement queue system cho email volume cao
- Cache email templates

### Monitoring
- Log tất cả email events
- Monitor email delivery rate
- Set up alerts cho email failures

## 📞 Hỗ Trợ

Nếu gặp vấn đề:
1. Kiểm tra console logs
2. Test với email khác
3. Verify Gmail settings
4. Restart server sau khi thay đổi .env

**Email hoạt động = Người dùng có thể đăng ký thành công!** 🎉
