const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tên sản phẩm là bắt buộc'],
        trim: true,
        maxlength: [100, 'Tên sản phẩm không được vượt quá 100 ký tự']
    },
    description: {
        type: String,
        required: [true, 'Mô tả sản phẩm là bắt buộc'],
        trim: true,
        maxlength: [1000, 'Mô tả không được vượt quá 1000 ký tự']
    },
    shortDescription: {
        type: String,
        required: [true, 'Mô tả ngắn là bắt buộc'],
        trim: true,
        maxlength: [200, 'Mô tả ngắn không được vượt quá 200 ký tự']
    },
    price: {
        type: Number,
        required: [true, 'Giá sản phẩm là bắt buộc'],
        min: [0, 'Giá không thể âm']
    },
    originalPrice: {
        type: Number,
        min: [0, 'Giá gốc không thể âm']
    },
    category: {
        type: String,
        required: [true, 'Danh mục là bắt buộc'],
        enum: {
            values: ['solar-panels', 'inverters', 'batteries', 'mounting-systems', 'monitoring', 'accessories'],
            message: 'Danh mục không hợp lệ'
        }
    },
    brand: {
        type: String,
        required: [true, 'Thương hiệu là bắt buộc'],
        trim: true
    },
    model: {
        type: String,
        required: [true, 'Model là bắt buộc'],
        trim: true
    },
    specifications: {
        power: {
            type: String,
            trim: true
        },
        efficiency: {
            type: String,
            trim: true
        },
        warranty: {
            type: String,
            trim: true
        },
        dimensions: {
            type: String,
            trim: true
        },
        weight: {
            type: String,
            trim: true
        },
        material: {
            type: String,
            trim: true
        },
        certification: {
            type: String,
            trim: true
        }
    },
    images: [{
        url: {
            type: String,
            required: true
        },
        alt: {
            type: String,
            required: true
        },
        isPrimary: {
            type: Boolean,
            default: false
        }
    }],
    features: [{
        type: String,
        trim: true
    }],
    applications: [{
        type: String,
        trim: true
    }],
    inStock: {
        type: Boolean,
        default: true
    },
    stockQuantity: {
        type: Number,
        default: 0,
        min: [0, 'Số lượng tồn kho không thể âm']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    rating: {
        average: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        count: {
            type: Number,
            default: 0
        }
    },
    tags: [{
        type: String,
        trim: true
    }],
    seoTitle: {
        type: String,
        trim: true
    },
    seoDescription: {
        type: String,
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
    if (this.originalPrice && this.originalPrice > this.price) {
        return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
    }
    return 0;
});

// Virtual for primary image
productSchema.virtual('primaryImage').get(function() {
    const primary = this.images.find(img => img.isPrimary);
    return primary || (this.images.length > 0 ? this.images[0] : null);
});

// Indexes for better performance
productSchema.index({ name: 'text', description: 'text', shortDescription: 'text' });
productSchema.index({ category: 1, isActive: 1, isDeleted: 1 });
productSchema.index({ brand: 1, isActive: 1, isDeleted: 1 });
productSchema.index({ price: 1 });
productSchema.index({ isFeatured: 1, isActive: 1, isDeleted: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ isDeleted: 1 });

// Pre-save middleware to ensure only one primary image
productSchema.pre('save', function(next) {
    if (this.images && this.images.length > 0) {
        const primaryImages = this.images.filter(img => img.isPrimary);
        if (primaryImages.length === 0) {
            this.images[0].isPrimary = true;
        } else if (primaryImages.length > 1) {
            this.images.forEach((img, index) => {
                img.isPrimary = index === 0;
            });
        }
    }
    next();
});

module.exports = mongoose.model('Product', productSchema);
