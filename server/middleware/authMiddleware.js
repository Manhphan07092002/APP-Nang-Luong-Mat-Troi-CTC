const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Lấy token từ header (Bỏ chữ 'Bearer ')
            token = req.headers.authorization.split(' ')[1];

            if (!token) {
                return res.status(401).json({ message: 'Not authorized, no token provided' });
            }

            if (!process.env.JWT_SECRET) {
                console.error('JWT_SECRET environment variable is not set');
                return res.status(500).json({ message: 'Server configuration error' });
            }

            // Giải mã token để lấy id người dùng
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            if (!decoded || (!decoded._id && !decoded.id)) {
                return res.status(401).json({ message: 'Not authorized, invalid token payload' });
            }

            // Tìm người dùng trong CSDL và gắn vào request, loại bỏ trường password
            req.user = await User.findById(decoded._id || decoded.id).select('-password');
            
            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }
            
            next(); // Cho phép đi tiếp
        } catch (error) {
            console.error('JWT Error:', error.message);
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Not authorized, token expired' });
            } else if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: 'Not authorized, invalid token' });
            }
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Admin only middleware
const requireAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ 
            success: false,
            message: 'Access denied. Admin role required.' 
        });
    }
};

module.exports = { protect, requireAdmin };