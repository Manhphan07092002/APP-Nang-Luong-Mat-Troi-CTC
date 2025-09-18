const Product = require('../models/productModel');
const { sanitizeString } = require('../utils/securityUtils');

// Get all products with filtering, sorting, and pagination
exports.getAllProducts = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 12,
            category,
            brand,
            minPrice,
            maxPrice,
            search,
            sort = '-createdAt',
            featured,
            inStock
        } = req.query;

        // Build filter object
        const filter = { isActive: true };

        if (category) filter.category = category;
        if (brand) filter.brand = new RegExp(sanitizeString(brand), 'i');
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }
        if (search) {
            filter.$text = { $search: sanitizeString(search) };
        }
        if (featured === 'true') filter.isFeatured = true;
        if (inStock === 'true') filter.inStock = true;

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Execute query
        const products = await Product.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(Number(limit))
            .populate('createdBy', 'name')
            .select('-__v');

        // Get total count for pagination
        const total = await Product.countDocuments(filter);

        res.json({
            success: true,
            data: {
                products,
                pagination: {
                    currentPage: Number(page),
                    totalPages: Math.ceil(total / limit),
                    totalProducts: total,
                    hasNext: page * limit < total,
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi tải danh sách sản phẩm'
        });
    }
};

// Get single product by ID
exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findById(id)
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email');

        if (!product || !product.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }

        res.json({
            success: true,
            data: product
        });

    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi tải thông tin sản phẩm'
        });
    }
};

// Get featured products
exports.getFeaturedProducts = async (req, res) => {
    try {
        const limit = req.query.limit || 6;

        const products = await Product.find({
            isActive: true,
            isFeatured: true,
            inStock: true
        })
            .sort('-createdAt')
            .limit(Number(limit))
            .select('-__v');

        res.json({
            success: true,
            data: products
        });

    } catch (error) {
        console.error('Get featured products error:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi tải sản phẩm nổi bật'
        });
    }
};

// Get product categories
exports.getCategories = async (req, res) => {
    try {
        const categories = [
            { value: 'solar-panels', label: 'Tấm Pin Mặt Trời', icon: '☀️' },
            { value: 'inverters', label: 'Inverter', icon: '⚡' },
            { value: 'batteries', label: 'Pin Lưu Trữ', icon: '🔋' },
            { value: 'mounting-systems', label: 'Hệ Thống Lắp Đặt', icon: '🔧' },
            { value: 'monitoring', label: 'Giám Sát', icon: '📊' },
            { value: 'accessories', label: 'Phụ Kiện', icon: '🛠️' }
        ];

        // Get product count for each category
        const categoriesWithCount = await Promise.all(
            categories.map(async (category) => {
                const count = await Product.countDocuments({
                    category: category.value,
                    isActive: true
                });
                return { ...category, count };
            })
        );

        res.json({
            success: true,
            data: categoriesWithCount
        });

    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi tải danh mục'
        });
    }
};

// Admin only - Create new product
exports.createProduct = async (req, res) => {
    try {
        console.log('=== CREATE PRODUCT DEBUG ===');
        console.log('req.body:', req.body);
        console.log('req.files:', req.files);
        
        const productData = {
            ...req.body,
            createdBy: req.user.id
        };

        // Chỉ xử lý ảnh từ req.files
        if (req.files && req.files.length > 0) {
            productData.images = req.files.map(file => ({
                url: `/uploads/products/${file.filename}`,
                alt: productData.name || 'Product image'
            }));
            console.log('Generated images array:', productData.images);
        } else {
            productData.images = []; // Khởi tạo mảng rỗng nếu không có ảnh
            console.log('No files uploaded, setting empty images array');
        }

        // Sanitize string fields
        if (productData.name) productData.name = sanitizeString(productData.name);
        if (productData.description) productData.description = sanitizeString(productData.description);
        if (productData.shortDescription) productData.shortDescription = sanitizeString(productData.shortDescription);

        const product = new Product(productData);
        await product.save();

        const populatedProduct = await Product.findById(product._id)
            .populate('createdBy', 'name email');

        res.status(201).json({
            success: true,
            message: 'Tạo sản phẩm thành công',
            data: populatedProduct
        });

    } catch (error) {
        console.error('Create product error:', error);
        
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors
            });
        }

        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi tạo sản phẩm'
        });
    }
};

// Admin only - Update product
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const productToUpdate = await Product.findById(req.params.id);
        if (!productToUpdate) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }

        const updateData = {
            ...req.body,
            updatedBy: req.user.id
        };

        // Xử lý parse các trường JSON từ form-data
        if (typeof updateData.specifications === 'string') {
            updateData.specifications = JSON.parse(updateData.specifications);
        }
        // Xử lý và hợp nhất ảnh
        let finalImages = [];
        // 1. Phân tích cú pháp ảnh hiện có từ req.body
        if (req.body.images) {
            try {
                finalImages = JSON.parse(req.body.images);
                if (!Array.isArray(finalImages)) finalImages = [];
            } catch (e) {
                console.warn('Could not parse req.body.images, starting with empty array.');
                finalImages = [];
            }
        }

        // 2. Thêm ảnh mới từ req.files (multer)
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => ({
                url: `/uploads/products/${file.filename}`,
                alt: req.body.name || product.name || 'Product image'
            }));
            finalImages.push(...newImages);
        }

        // Đảm bảo tất cả ảnh đều có alt text
        finalImages.forEach(img => {
            if (!img.alt) {
                img.alt = req.body.name || product.name || 'Product image';
            }
        });

        updateData.images = finalImages;

        if (updateData.name) updateData.name = sanitizeString(updateData.name);
        if (updateData.description) updateData.description = sanitizeString(updateData.description);
        if (updateData.shortDescription) updateData.shortDescription = sanitizeString(updateData.shortDescription);

        const product = await Product.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('createdBy updatedBy', 'name email');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }

        res.json({
            success: true,
            message: 'Cập nhật sản phẩm thành công',
            data: product
        });

    } catch (error) {
        console.error('Update product error:', error);
        
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors
            });
        }

        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi cập nhật sản phẩm'
        });
    }
};

// Admin only - Delete product (soft delete)
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findByIdAndUpdate(
            id,
            { 
                isActive: false,
                updatedBy: req.user.id
            },
            { new: true }
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }

        res.json({
            success: true,
            message: 'Xóa sản phẩm thành công'
        });

    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi xóa sản phẩm'
        });
    }
};

// Admin only - Get all products (including inactive)
exports.getAllProductsAdmin = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 12,
            category,
            brand,
            search,
            sort = '-createdAt',
            isActive
        } = req.query;

        // Build filter object (no isActive filter for admin)
        const filter = {};

        if (category) filter.category = category;
        if (brand) filter.brand = new RegExp(sanitizeString(brand), 'i');
        if (search) {
            filter.$text = { $search: sanitizeString(search) };
        }
        if (isActive !== undefined) filter.isActive = isActive === 'true';

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Execute query
        const products = await Product.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(Number(limit))
            .populate('createdBy updatedBy', 'name email')
            .select('-__v');

        // Get total count for pagination
        const total = await Product.countDocuments(filter);

        res.json({
            success: true,
            data: {
                products,
                pagination: {
                    currentPage: Number(page),
                    totalPages: Math.ceil(total / limit),
                    totalProducts: total,
                    hasNext: page * limit < total,
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Get admin products error:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi tải danh sách sản phẩm'
        });
    }
};
