# Solar Analytics - Hướng dẫn Kiểm thử

## Khởi động Ứng dụng

### Cách 1: Sử dụng file batch (Windows)
```bash
# Chạy file START_SERVER.bat
START_SERVER.bat
```

### Cách 2: Sử dụng command line
```bash
# Cài đặt dependencies
npm install

# Khởi động server
npm start
# hoặc
node server/server.js
```

## Kiểm tra Ứng dụng

### 1. Truy cập ứng dụng
- URL: http://localhost:5000
- Trang chủ sẽ hiển thị với hero section và navigation

### 2. Kiểm tra các trang chính
- **Trang chủ**: `/` hoặc `/index.html`
- **Đăng nhập**: `/login.html`
- **Đăng ký**: `/register.html`
- **Phân tích**: `/phan_tich.html`
- **Dashboard**: `/dashboard.html`
- **Profile**: `/profile.html`
- **Lịch sử**: `/lich_su.html` (đã được sửa)

### 3. Kiểm tra Authentication Flow
1. **Đăng ký tài khoản mới**:
   - Vào `/register.html`
   - Điền form với validation:
     - Tên: tối thiểu 10 ký tự
     - Email: định dạng hợp lệ
     - Mật khẩu: tối thiểu 10 ký tự + ký tự đặc biệt
   - Kiểm tra password toggle hoạt động

2. **Đăng nhập**:
   - Vào `/login.html`
   - Sử dụng tài khoản đã đăng ký
   - Kiểm tra redirect đến dashboard

3. **Kiểm tra Header Authentication**:
   - Khi chưa đăng nhập: hiển thị "Đăng nhập" và "Đăng ký"
   - Khi đã đăng nhập: hiển thị dropdown profile

### 4. Kiểm tra Database
- MongoDB cần chạy trên `localhost:27017`
- Database: `solaranalytics`
- Collections: `users`, `reports`, `stats`

### 5. Kiểm tra Console Errors
Mở Developer Tools và kiểm tra:
- Không có lỗi JavaScript
- Không có lỗi CSP (Content Security Policy)
- Không có lỗi 404 cho resources

## Các Lỗi Đã Được Sửa

### ✅ JavaScript Errors
- Null reference errors trong profile.js, analysis-page.js, login.js, register.js
- Proper userInfo parsing và validation
- Enhanced error handling trong tất cả API calls

### ✅ Server-side Improvements
- Global error handler
- MongoDB connection validation
- JWT token validation enhancements
- Input validation cho authentication

### ✅ UI/UX Fixes
- Trang lịch sử hoàn chỉnh (trước đó bị trống)
- CSP-compliant styling
- Consistent authentication state management

### ✅ Dependencies
- Thêm missing packages: multer, nodemailer
- Updated package.json

## Troubleshooting

### Lỗi MongoDB Connection
```
Error: MongoDB connection error
```
**Giải pháp**: Đảm bảo MongoDB đang chạy trên localhost:27017

### Lỗi JWT_SECRET
```
Error: JWT_SECRET environment variable is not set
```
**Giải pháp**: Kiểm tra file `.env` trong thư mục `server/`

### Lỗi Port đã được sử dụng
```
Error: listen EADDRINUSE :::5000
```
**Giải pháp**: Thay đổi PORT trong file `.env` hoặc kill process đang sử dụng port 5000

## Environment Variables (.env)
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/solaranalytics
JWT_SECRET=mot_chuoi_bi_mat_rat_dai_va_kho_doan_123456
EMAIL_USER=pxmanhctc@gmail.com
EMAIL_PASS=wrutbkloiaiejyyx
CLIENT_URL=http://127.0.0.1:5500
```
