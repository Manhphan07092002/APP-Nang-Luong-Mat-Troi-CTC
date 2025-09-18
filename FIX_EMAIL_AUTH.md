# 🔧 Hướng Dẫn Khắc Phục Lỗi Xác Thực Email

## ❌ Vấn đề hiện tại:
```
Error: Missing credentials for "PLAIN" (EAUTH)
```

## 🎯 Nguyên nhân:
- Gmail App Password không hợp lệ hoặc đã hết hạn
- Định dạng App Password không đúng
- Tài khoản Gmail chưa bật 2-Step Verification

## 🔧 Giải pháp từng bước:

### Bước 1: Kiểm tra tài khoản Gmail
1. Đăng nhập Gmail với tài khoản: `manh092002@gmail.com`
2. Đảm bảo tài khoản hoạt động bình thường

### Bước 2: Bật 2-Step Verification (nếu chưa có)
1. Truy cập: https://myaccount.google.com/security
2. Tìm mục **2-Step Verification**
3. Nhấn **Get started** và làm theo hướng dẫn
4. Chọn phương thức xác minh (SMS hoặc Authenticator)

### Bước 3: Tạo App Password mới
1. Vào https://myaccount.google.com/security
2. Tìm mục **App passwords** (Mật khẩu ứng dụng)
3. Nhấn **App passwords**
4. Chọn **Mail** từ dropdown "Select app"
5. Chọn **Other** từ dropdown "Select device"
6. Nhập tên: **Solar Analytics Email Service**
7. Nhấn **Generate**
8. **QUAN TRỌNG**: Copy mật khẩu 16 ký tự (dạng: abcd efgh ijkl mnop)

### Bước 4: Cập nhật file .env
1. Mở file `server/.env`
2. Tìm dòng: `EMAIL_PASS=fcqtvekc gcphjdxz`
3. Thay thế bằng App Password mới (KHÔNG có khoảng trắng):
   ```env
   EMAIL_PASS=abcdefghijklmnop
   ```

### Bước 5: Test lại email service
```bash
cd server
node test-email.js
```

## 🚨 Lưu ý quan trọng:
- App Password phải là 16 ký tự KHÔNG có khoảng trắng
- Không sử dụng mật khẩu Gmail thường
- Phải bật 2-Step Verification trước khi tạo App Password
- Mỗi App Password chỉ hiển thị một lần, hãy lưu lại

## 🔄 Nếu vẫn lỗi:
1. Thử tạo App Password mới
2. Kiểm tra tài khoản Gmail có bị khóa không
3. Thử với email Gmail khác
4. Kiểm tra firewall/antivirus có chặn SMTP không

## 📧 Email thay thế:
Nếu Gmail không hoạt động, có thể sử dụng:
- Outlook/Hotmail SMTP
- SendGrid
- Mailgun
- Amazon SES

## ✅ Kết quả mong đợi:
```
✅ Email sent successfully!
Message ID: <message-id>
```
