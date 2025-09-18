const mongoose = require('mongoose');

const userSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    sessionId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    ipAddress: {
        type: String,
        required: true
    },
    userAgent: {
        type: String,
        required: true
    },
    device: {
        type: String,
        required: true
    },
    browser: {
        type: String
    },
    os: {
        type: String
    },
    location: {
        city: String,
        country: String,
        region: String,
        timezone: String,
        coordinates: {
            lat: Number,
            lon: Number
        }
    },
    loginTime: {
        type: Date,
        default: Date.now,
        required: true
    },
    lastActivity: {
        type: Date,
        default: Date.now,
        required: true
    },
    logoutTime: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    loginMethod: {
        type: String,
        enum: ['email', 'google', 'facebook', '2fa'],
        default: 'email'
    },
    jwtToken: {
        type: String,
        select: false // Don't include in queries by default
    },
    refreshToken: {
        type: String,
        select: false
    },
    expiresAt: {
        type: Date,
        required: true
    },
    // Security fields
    isSecure: {
        type: Boolean,
        default: false
    },
    isTrusted: {
        type: Boolean,
        default: false
    },
    riskScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    // Metadata
    metadata: {
        screenResolution: String,
        language: String,
        timezone: String,
        plugins: [String]
    }
}, {
    timestamps: true,
    collection: 'user_sessions'
});

// Indexes for performance
userSessionSchema.index({ userId: 1, isActive: 1 });
userSessionSchema.index({ sessionId: 1, isActive: 1 });
userSessionSchema.index({ loginTime: -1 });
userSessionSchema.index({ lastActivity: -1 });
userSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Instance methods
userSessionSchema.methods.updateActivity = function() {
    this.lastActivity = new Date();
    return this.save();
};

userSessionSchema.methods.logout = function() {
    this.isActive = false;
    this.logoutTime = new Date();
    return this.save();
};

userSessionSchema.methods.isExpired = function() {
    return new Date() > this.expiresAt;
};

// Static methods
userSessionSchema.statics.createSession = async function(sessionData) {
    const session = new this(sessionData);
    return await session.save();
};

userSessionSchema.statics.findActiveByUser = function(userId) {
    return this.find({ 
        userId, 
        isActive: true,
        expiresAt: { $gt: new Date() }
    }).sort({ lastActivity: -1 });
};

userSessionSchema.statics.findBySessionId = function(sessionId) {
    return this.findOne({ 
        sessionId, 
        isActive: true,
        expiresAt: { $gt: new Date() }
    });
};

userSessionSchema.statics.logoutAllUserSessions = function(userId) {
    return this.updateMany(
        { userId, isActive: true },
        { 
            isActive: false, 
            logoutTime: new Date() 
        }
    );
};

userSessionSchema.statics.cleanupExpiredSessions = function() {
    return this.updateMany(
        { 
            isActive: true,
            expiresAt: { $lt: new Date() }
        },
        { 
            isActive: false,
            logoutTime: new Date()
        }
    );
};

// Pre-save middleware
userSessionSchema.pre('save', function(next) {
    if (this.isNew) {
        // Set default expiration (7 days)
        if (!this.expiresAt) {
            this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        }
        
        // Parse device info from user agent
        if (!this.device && this.userAgent) {
            this.device = this.parseDeviceInfo(this.userAgent);
        }
    }
    next();
});

// Helper method to parse device info
userSessionSchema.methods.parseDeviceInfo = function(userAgent) {
    if (!userAgent) return 'Unknown Device';
    
    // Browser detection
    let browser = 'Unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    
    // OS detection
    let os = 'Unknown';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
    
    this.browser = browser;
    this.os = os;
    
    return `${browser} on ${os}`;
};

module.exports = mongoose.model('UserSession', userSessionSchema);
