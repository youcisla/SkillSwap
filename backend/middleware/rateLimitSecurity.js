// Rate limiting and API throttling middleware
const rateLimit = require('express-rate-limit');

// Basic rate limiting configurations
const createRateLimit = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: { success: false, error: message },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in development mode
    return process.env.NODE_ENV === 'development';
  },
  handler: (req, res) => {
    console.warn(`🚨 Rate limit exceeded: ${req.ip} - ${req.path}`);
    res.status(429).json({
      success: false,
      error: message,
      retryAfter: Math.ceil(windowMs / 1000)
    });
  }
});

// Different rate limits for different endpoints
const rateLimits = {
  // General API rate limit
  general: createRateLimit(
    15 * 60 * 1000, // 15 minutes
    1000, // 1000 requests per window
    'Too many requests, please try again later'
  ),

  // Authentication endpoints (stricter)
  auth: createRateLimit(
    15 * 60 * 1000, // 15 minutes
    10, // 10 attempts per window
    'Too many authentication attempts, please try again later'
  ),

  // Message sending (moderate)
  messages: createRateLimit(
    1 * 60 * 1000, // 1 minute
    30, // 30 messages per minute
    'Too many messages sent, please slow down'
  ),

  // File uploads (stricter)
  uploads: createRateLimit(
    60 * 60 * 1000, // 1 hour
    20, // 20 uploads per hour
    'Upload limit exceeded, please try again later'
  ),

  // Search endpoints
  search: createRateLimit(
    1 * 60 * 1000, // 1 minute
    60, // 60 searches per minute
    'Too many search requests, please try again later'
  ),

  // Admin endpoints (very strict)
  admin: createRateLimit(
    15 * 60 * 1000, // 15 minutes
    100, // 100 requests per window
    'Admin rate limit exceeded'
  ),

  // Password reset (very strict)
  passwordReset: createRateLimit(
    60 * 60 * 1000, // 1 hour
    3, // 3 attempts per hour
    'Too many password reset attempts'
  )
};

// Dynamic rate limiting based on user behavior
class DynamicRateLimit {
  constructor() {
    this.userLimits = new Map();
    this.suspiciousIPs = new Set();
    
    // Clean up old entries every hour
    setInterval(() => this.cleanup(), 60 * 60 * 1000);
  }

  middleware() {
    return (req, res, next) => {
      const clientIP = req.ip || req.connection.remoteAddress;
      const userId = req.userId;
      const identifier = userId || clientIP;

      // Check if IP is marked as suspicious
      if (this.suspiciousIPs.has(clientIP)) {
        return res.status(429).json({
          success: false,
          error: 'Access temporarily restricted due to suspicious activity'
        });
      }

      // Get or create user limit tracker
      if (!this.userLimits.has(identifier)) {
        this.userLimits.set(identifier, {
          requests: [],
          violations: 0,
          lastViolation: null
        });
      }

      const userLimit = this.userLimits.get(identifier);
      const now = Date.now();
      const windowMs = 60 * 1000; // 1 minute window

      // Remove old requests
      userLimit.requests = userLimit.requests.filter(
        timestamp => now - timestamp < windowMs
      );

      // Determine rate limit based on user behavior
      let maxRequests = 100; // Base limit
      
      if (userLimit.violations > 0) {
        maxRequests = Math.max(20, 100 - (userLimit.violations * 20));
      }

      // Check if limit exceeded
      if (userLimit.requests.length >= maxRequests) {
        userLimit.violations++;
        userLimit.lastViolation = now;

        // Mark IP as suspicious after multiple violations
        if (userLimit.violations >= 5) {
          this.suspiciousIPs.add(clientIP);
          setTimeout(() => {
            this.suspiciousIPs.delete(clientIP);
          }, 24 * 60 * 60 * 1000); // 24 hours
        }

        console.warn(`🚨 Dynamic rate limit exceeded: ${identifier} (${userLimit.violations} violations)`);
        
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded. Please slow down.',
          retryAfter: 60
        });
      }

      // Record this request
      userLimit.requests.push(now);
      next();
    };
  }

  cleanup() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    for (const [identifier, data] of this.userLimits.entries()) {
      // Remove entries older than 1 hour with no recent activity
      if (data.requests.length === 0 && 
          (!data.lastViolation || now - data.lastViolation > oneHour)) {
        this.userLimits.delete(identifier);
      }
    }
  }

  // Reset limits for a specific user (admin function)
  resetUserLimits(identifier) {
    this.userLimits.delete(identifier);
  }

  // Get current limit status for a user
  getUserLimitStatus(identifier) {
    const userLimit = this.userLimits.get(identifier);
    if (!userLimit) return null;

    return {
      currentRequests: userLimit.requests.length,
      violations: userLimit.violations,
      lastViolation: userLimit.lastViolation
    };
  }
}

// Input validation and sanitization middleware
const sanitizeInput = (req, res, next) => {
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    
    // Remove potentially dangerous characters
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  };

  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Prevent XSS attacks
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Enable HSTS in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self';"
  );

  next();
};

// Request size limiting
const requestSizeLimit = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length']);
    const maxBytes = parseSize(maxSize);

    if (contentLength && contentLength > maxBytes) {
      return res.status(413).json({
        success: false,
        error: `Request size exceeds ${maxSize} limit`
      });
    }

    next();
  };
};

// Helper function to parse size strings
const parseSize = (size) => {
  const units = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
  const match = size.toLowerCase().match(/^(\d+)(b|kb|mb|gb)$/);
  
  if (!match) return 0;
  
  const [, num, unit] = match;
  return parseInt(num) * units[unit];
};

// Create dynamic rate limiter instance
const dynamicRateLimit = new DynamicRateLimit();

module.exports = {
  rateLimits,
  dynamicRateLimit,
  sanitizeInput,
  securityHeaders,
  requestSizeLimit,
  createRateLimit
};
