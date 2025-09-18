const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../client/uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'product-' + uniqueSuffix + ext);
    }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file hình ảnh!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Upload multiple images endpoint
router.post('/images', protect, requireAdmin, upload.array('images', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Không có file nào được upload'
            });
        }

        // Generate URLs for uploaded files
        const imageUrls = req.files.map(file => {
            return `/uploads/${file.filename}`;
        });

        res.json({
            success: true,
            message: 'Upload hình ảnh thành công',
            imageUrls: imageUrls
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi upload hình ảnh: ' + error.message
        });
    }
});

// Delete image endpoint
router.delete('/images/:filename', protect, requireAdmin, async (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(uploadsDir, filename);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            res.json({
                success: true,
                message: 'Xóa hình ảnh thành công'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Không tìm thấy file'
            });
        }

    } catch (error) {
        console.error('Delete image error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa hình ảnh'
        });
    }
});

module.exports = router;
