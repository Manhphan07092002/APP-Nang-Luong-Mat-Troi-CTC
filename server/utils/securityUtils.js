// Security utilities for input validation and sanitization
const crypto = require('crypto');

/**
 * Sanitize string input to prevent XSS attacks
 */
function sanitizeString(str) {
    if (typeof str !== 'string') return str;
    
    return str
        .replace(/[<>]/g, '') // Remove < and > characters
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, '') // Remove event handlers
        .trim();
}

/**
 * Sanitize email input
 */
function sanitizeEmail(email) {
    if (typeof email !== 'string') return email;
    
    return email
        .toLowerCase()
        .trim()
        .replace(/[<>]/g, '');
}

/**
 * Sanitize ObjectId input
 */
function sanitizeObjectId(id) {
    if (typeof id !== 'string') return id;
    
    // Only allow alphanumeric characters for ObjectId
    return id.replace(/[^a-fA-F0-9]/g, '');
}

/**
 * Validate registration input
 */
function validateRegistrationInput(data) {
    const errors = [];
    
    if (!data.name || data.name.length < 2) {
        errors.push('Tên phải có ít nhất 2 ký tự');
    }
    
    if (!data.email || !isValidEmail(data.email)) {
        errors.push('Email không hợp lệ');
    }
    
    if (!data.password || data.password.length < 6) {
        errors.push('Mật khẩu phải có ít nhất 6 ký tự');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate update profile input
 */
function validateUpdateProfileInput(data) {
    const errors = [];
    
    if (data.name && data.name.length < 2) {
        errors.push('Tên phải có ít nhất 2 ký tự');
    }
    
    if (data.email && !isValidEmail(data.email)) {
        errors.push('Email không hợp lệ');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Check for recent login attempts (rate limiting)
 */
function checkRecentLoginAttempts(attempts) {
    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000);
    
    // Count attempts in last 5 minutes
    const recentAttempts = attempts.filter(attempt => attempt > fiveMinutesAgo);
    
    return {
        count: recentAttempts.length,
        isBlocked: recentAttempts.length >= 5
    };
}

/**
 * Log failed login attempt
 */
function logFailedLoginAttempt(email, ip) {
    console.log(`Failed login attempt for ${email} from IP ${ip} at ${new Date().toISOString()}`);
}

/**
 * Handle failed login attempt
 */
function handleFailedLoginAttempt(user, ip) {
    if (!user.failedLoginAttempts) {
        user.failedLoginAttempts = 0;
    }
    
    user.failedLoginAttempts += 1;
    user.lastFailedLogin = new Date();
    
    // Lock account after 5 failed attempts
    if (user.failedLoginAttempts >= 5) {
        user.accountLocked = true;
        user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    }
    
    logFailedLoginAttempt(user.email, ip);
}

/**
 * Log security events
 */
function logSecurityEvent(event, severity = 'medium', details = {}) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        event,
        severity,
        details
    };
    
    console.log('SECURITY EVENT:', JSON.stringify(logEntry));
}

/**
 * Detect injection attempts
 */
function detectInjectionAttempt(input) {
    if (typeof input !== 'string') return false;
    
    const injectionPatterns = [
        /\$\w+/g, // MongoDB operators
        /\{\s*\$\w+/g, // MongoDB query objects
        /union\s+select/gi, // SQL injection
        /drop\s+table/gi, // SQL injection
        /insert\s+into/gi, // SQL injection
        /delete\s+from/gi // SQL injection
    ];
    
    return injectionPatterns.some(pattern => pattern.test(input));
}

/**
 * Detect XSS attempts
 */
function detectXSSAttempt(input) {
    if (typeof input !== 'string') return false;
    
    const xssPatterns = [
        /<script/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<iframe/gi,
        /<object/gi,
        /<embed/gi
    ];
    
    return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Validate request with custom rules
 */
function validateRequest(req, rules = {}) {
    const errors = [];
    
    // Check for injection attempts
    const bodyString = JSON.stringify(req.body || {});
    if (detectInjectionAttempt(bodyString)) {
        errors.push('Phát hiện cố gắng injection');
        logSecurityEvent('injection_attempt', 'high', { 
            ip: req.ip, 
            userAgent: req.get('User-Agent'),
            body: req.body 
        });
    }
    
    // Check for XSS attempts
    if (detectXSSAttempt(bodyString)) {
        errors.push('Phát hiện cố gắng XSS');
        logSecurityEvent('xss_attempt', 'high', { 
            ip: req.ip, 
            userAgent: req.get('User-Agent'),
            body: req.body 
        });
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Generate secure random token
 */
function generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash password with salt
 */
function hashPassword(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

/**
 * Generate salt for password hashing
 */
function generateSalt() {
    return crypto.randomBytes(32).toString('hex');
}

module.exports = {
    sanitizeString,
    sanitizeEmail,
    sanitizeObjectId,
    validateRegistrationInput,
    validateUpdateProfileInput,
    isValidEmail,
    checkRecentLoginAttempts,
    logFailedLoginAttempt,
    handleFailedLoginAttempt,
    logSecurityEvent,
    detectInjectionAttempt,
    detectXSSAttempt,
    validateRequest,
    generateSecureToken,
    hashPassword,
    generateSalt
};
