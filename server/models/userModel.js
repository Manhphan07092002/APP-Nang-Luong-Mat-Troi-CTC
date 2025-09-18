const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: [true, 'Họ tên là bắt buộc'] },
    email: {
        type: String, required: [true, 'Email là bắt buộc'],
        unique: true, lowercase: true, trim: true,
        match: [/\S+@\S+\.\S+/, 'Vui lòng sử dụng email hợp lệ.']
    },
    password: { type: String, required: [true, 'Mật khẩu là bắt buộc'], minlength: 6, select: false },
    phone: { type: String, required: [true, 'Số điện thoại là bắt buộc'] },
    address: { type: String },
    employeeId: { type: String, unique: true, sparse: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    
    // Enhanced profile fields for personalization
    profileImage: { 
        type: String, 
        default: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face' 
    },
    bio: { type: String, maxlength: 500 },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    company: { type: String },
    position: { type: String, default: 'Solar Analytics Engineer' },
    
    // Social providers integration
    socialProviders: {
        google: {
            id: String,
            email: String,
            verified: { type: Boolean, default: false }
        },
        facebook: {
            id: String,
            email: String,
            verified: { type: Boolean, default: false }
        }
    },
    
    // Activity tracking
    lastLogin: { type: Date, default: Date.now },
    lastLoginIP: { type: String },
    loginHistory: [{
        ip: String,
        userAgent: String,
        timestamp: { type: Date, default: Date.now },
        location: String
    }],
    isActive: { type: Boolean, default: true },
    
    // User statistics for personalization
    stats: {
        projectsCompleted: { type: Number, default: 0 },
        reportsGenerated: { type: Number, default: 0 },
        experienceYears: { type: Number, default: 1 },
        achievementsEarned: { type: Number, default: 0 },
        totalLoginDays: { type: Number, default: 1 },
        lastActivityDate: { type: Date, default: Date.now }
    },
    
    // Two-Factor Authentication
    twoFactorAuth: {
        enabled: { type: Boolean, default: false },
        secret: { type: String, select: false }, // TOTP secret key
        backupCodes: [{ type: String, select: false }], // Recovery codes
        enabledAt: { type: Date },
        lastUsed: { type: Date }
    },
    
    // Preferences for personalization
    preferences: {
        theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'auto' },
        language: { type: String, default: 'vi' },
        notifications: {
            email: { type: Boolean, default: true },
            browser: { type: Boolean, default: true },
            reports: { type: Boolean, default: true }
        },
        dashboard: {
            layout: { type: String, enum: ['grid', 'list'], default: 'grid' },
            widgets: [{ type: String }]
        }
    }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);