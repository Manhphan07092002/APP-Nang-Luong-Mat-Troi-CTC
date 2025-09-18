const mongoose = require('mongoose');

const securityEventSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['LOGIN_SUCCESS', 'LOGIN_FAIL', 'LOGOUT', 'PASSWORD_CHANGE', 'ACCOUNT_LOCKED', 'ACCOUNT_UNLOCKED', '2FA_ENABLED', '2FA_DISABLED', 'API_RATE_LIMIT', 'INJECTION_ATTEMPT', 'XSS_ATTEMPT']
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    description: {
        type: String,
        required: true
    },
    level: {
        type: String,
        required: true,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    }
}, {
    timestamps: true
});

securityEventSchema.index({ createdAt: -1 });
securityEventSchema.index({ user: 1 });
securityEventSchema.index({ type: 1 });

const SecurityEvent = mongoose.model('SecurityEvent', securityEventSchema);

module.exports = SecurityEvent;
