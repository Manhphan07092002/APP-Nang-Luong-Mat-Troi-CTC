const mongoose = require('mongoose');

const securityLogSchema = new mongoose.Schema({
    event: {
        type: String,
        required: true,
        enum: [
            'login_success',
            'login_failed',
            'logout',
            'password_change',
            'account_locked',
            'account_unlocked',
            'permission_denied',
            'suspicious_activity',
            'data_access',
            'admin_action'
        ]
    },
    description: {
        type: String,
        required: true
    },
    level: {
        type: String,
        required: true,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'low'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null // null for system events
    },
    ipAddress: {
        type: String,
        default: null
    },
    userAgent: {
        type: String,
        default: null
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Index for performance
securityLogSchema.index({ createdAt: -1 });
securityLogSchema.index({ event: 1 });
securityLogSchema.index({ level: 1 });
securityLogSchema.index({ user: 1 });

module.exports = mongoose.model('SecurityLog', securityLogSchema);
