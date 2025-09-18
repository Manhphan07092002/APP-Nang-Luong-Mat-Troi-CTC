// File: server/server.js

require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const Stats = require('./models/statsModel');
const apiRoutes = require('./routes/api');
const productRoutes = require('./routes/productRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const reportController = require('./controllers/reportController'); // Import controller
const contactRoutes = require('./routes/contactRoutes');

const app = express();

// --- 1. Middleware ---
// CORS configuration for admin panel access
const corsOptions = {
    origin: [
        'http://ctcdn.vn:5000',
        'http://127.0.0.1:5000',
        'http://ctcdn.vn:3000',
        'http://127.0.0.1:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
};

app.use(cors(corsOptions));

// Trust proxy to get real IP addresses
app.set('trust proxy', true);

// Debug middleware to log IP information
app.use('/api/auth/login', (req, res, next) => {
    console.log('=== LOGIN REQUEST DEBUG ===');
    console.log('req.ip:', req.ip);
    console.log('req.connection.remoteAddress:', req.connection?.remoteAddress);
    console.log('req.socket.remoteAddress:', req.socket?.remoteAddress);
    console.log('Headers:', {
        'x-forwarded-for': req.headers['x-forwarded-for'],
        'x-real-ip': req.headers['x-real-ip'],
        'x-client-ip': req.headers['x-client-ip'],
        'cf-connecting-ip': req.headers['cf-connecting-ip'],
        'user-agent': req.headers['user-agent']
    });
    console.log('=== END DEBUG ===');
    next();
});

// Content Security Policy middleware to fix CSP errors
app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', 
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' " +
            "https://accounts.google.com " +
            "https://connect.facebook.net " +
            "https://cdn.jsdelivr.net " +
            "https://cdnjs.cloudflare.com " +
            "https://cdn.tailwindcss.com; " +
        "script-src-elem 'self' 'unsafe-inline' " +
            "https://accounts.google.com " +
            "https://connect.facebook.net " +
            "https://cdn.jsdelivr.net " +
            "https://cdnjs.cloudflare.com " +
            "https://cdn.tailwindcss.com; " +
        "script-src-attr 'unsafe-inline'; " +
        "style-src 'self' 'unsafe-inline' " +
            "https://fonts.googleapis.com " +
            "https://cdnjs.cloudflare.com " +
            "https://cdn.jsdelivr.net; " +
        "style-src-elem 'self' 'unsafe-inline' " +
            "https://fonts.googleapis.com " +
            "https://cdnjs.cloudflare.com " +
            "https://cdn.jsdelivr.net; " +
        "font-src 'self' " +
            "https://fonts.gstatic.com " +
            "https://cdnjs.cloudflare.com " +
            "https://cdn.jsdelivr.net " +
            "data:; " +
        "img-src 'self' data: blob: " +
            "https: " +
            "http:; " +
        "connect-src 'self' " +
            "http://ctcdn.vn:5000 http://127.0.0.1:5000 " +
            "https://accounts.google.com " +
            "https://graph.facebook.com " +
            "wss: ws:; " +
        "frame-src 'self' " +
            "https://www.google.com " + // Allow Google Maps
            "https://accounts.google.com " +
            "https://www.facebook.com; " +
        "object-src 'none'; " +
        "base-uri 'self';"
    );
    next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// MongoDB connection với validation
if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI không được định nghĩa trong file .env');
    process.exit(1);
}

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ Kết nối MongoDB thành công');
    })
    .catch(err => {
        console.error('❌ Lỗi kết nối MongoDB:', err.message);
        console.error('💡 Đảm bảo dịch vụ MongoDB đang chạy và MONGO_URI trong .env là chính xác.');
        process.exit(1); // Thoát nếu không kết nối được
    });

// --- 3. Middleware đếm lượt truy cập ---
app.use(async (req, res, next) => {
    try {
        if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/reports/view')) {
            await Stats.increment('totalVisits');
        }
    } catch (error) {
        console.error('Error incrementing stats:', error);
        // Continue without failing the request
    }
    next();
});

// --- 4. Định tuyến ---
// API routes
app.use('/api', apiRoutes);
app.use('/api/products', productRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin/security', require('./routes/securityRoutes'));

// **GIẢI PHÁP MỚI:** Route để render báo cáo chi tiết phía server
// Route này phải được định nghĩa ở đây để server nhận diện
app.get('/reports/view/:shareId', reportController.renderSharedReport);

// Admin shortcut routes
app.get('/admin', (req, res) => {
    res.redirect('/admin/login.html');
});

app.get('/a', (req, res) => {
    res.redirect('/admin/login.html');
});

// Phục vụ các file tĩnh (HTML, CSS, JS) từ thư mục client
app.use(express.static(path.join(__dirname, '../client')));

// Phục vụ các file đã tải lên
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// Xử lý 404 cho các trang không tìm thấy
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '../client/404.html'));
});

// --- 5. Khởi động Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));