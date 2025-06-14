const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Import enhanced utilities
const { createIndex, optimizeQuery } = require('../utils/databaseOptimization');
const { cacheService } = require('../utils/cacheService');

// Enhanced security middleware with comprehensive protection
const enhancedSecurityMiddleware = (app) => {
  // Helmet for security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "ws:", "wss:"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));

  // Enhanced CORS configuration
  const corsOptions = {
    origin: function (origin, callback) {
      const allowedOrigins = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://192.168.1.93:3000',
        'exp://192.168.1.93:8081',
        'http://localhost:8081',
        process.env.FRONTEND_URL
      ].filter(Boolean);

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count']
  };
  app.use(cors(corsOptions));

  // Compression for better performance
  app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    }
  }));

  // Enhanced rate limiting with different tiers
  const createRateLimit = (windowMs, max, message) => rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for admin users or in development
      if (process.env.NODE_ENV === 'development') return false;
      return req.user && req.user.role === 'admin';
    },
    keyGenerator: (req) => {
      // Use IP + user ID if authenticated, otherwise just IP
      return req.user ? `${req.ip}-${req.user.id}` : req.ip;
    }
  });

  // Different rate limits for different endpoints
  app.use('/api/auth/login', createRateLimit(15 * 60 * 1000, 5, 'Too many login attempts'));
  app.use('/api/auth/register', createRateLimit(60 * 60 * 1000, 3, 'Too many registration attempts'));
  app.use('/api/auth/forgot-password', createRateLimit(60 * 60 * 1000, 3, 'Too many password reset attempts'));
  app.use('/api/messages', createRateLimit(60 * 1000, 60, 'Too many messages sent'));
  app.use('/api/upload', createRateLimit(60 * 60 * 1000, 10, 'Too many uploads'));
  app.use('/api/', createRateLimit(15 * 60 * 1000, 100, 'Too many requests'));

  // Request size limits
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request timeout middleware
  app.use((req, res, next) => {
    req.setTimeout(30000, () => {
      res.status(408).json({ error: 'Request timeout' });
    });
    next();
  });
};

// Enhanced input sanitization and validation
const sanitizeInput = (req, res, next) => {
  // Remove potentially dangerous characters
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<[\/\!]*?[^<>]*?>/gi, '')
        .replace(/(\b)(on\S+)(\s*)=|javascript|expression/gi, '')
        .trim();
    }
    if (typeof obj === 'object' && obj !== null) {
      const sanitized = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitize(obj[key]);
        }
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }
  if (req.params) {
    req.params = sanitize(req.params);
  }

  next();
};

// Enhanced authentication middleware with caching
const enhancedAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    // Check token blacklist cache
    const isBlacklisted = await cacheService.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({ error: 'Token has been revoked' });
    }

    // Try to get user from cache first
    const cacheKey = `user:${token}`;
    let user = await cacheService.get(cacheKey);

    if (!user) {
      // Verify token and get user from database
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const User = require('../models/User');
      
      user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        return res.status(401).json({ error: 'Invalid token.' });
      }

      // Cache user for 15 minutes
      await cacheService.set(cacheKey, user, 15 * 60);
    }

    req.userId = user._id || user.id;
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    res.status(500).json({ error: 'Server error during authentication' });
  }
};

// Enhanced admin authentication with role-based access
const enhancedAdminAuth = async (req, res, next) => {
  try {
    await enhancedAuth(req, res, () => {});
    
    if (!req.user || !['admin', 'super-admin'].includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access denied. Admin privileges required.',
        requiredRole: 'admin',
        userRole: req.user?.role || 'none'
      });
    }

    // Log admin actions for security audit
    console.log(`Admin action: ${req.method} ${req.path} by ${req.user.email} (${req.user.role})`);
    
    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error during admin authentication' });
  }
};

// Permission-based access control
const checkPermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Super admin has all permissions
      if (req.user.role === 'super-admin') {
        return next();
      }

      // Check user permissions
      const userPermissions = req.user.permissions || [];
      if (!userPermissions.includes(permission)) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: permission,
          userPermissions: userPermissions
        });
      }

      next();
    } catch (error) {
      res.status(500).json({ error: 'Server error during permission check' });
    }
  };
};

// Enhanced file upload middleware with security checks
const enhancedFileUpload = () => {
  const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
      const uploadDir = path.join(__dirname, '../uploads/profile-images');
      try {
        await fs.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
      } catch (error) {
        cb(error);
      }
    },
    filename: (req, file, cb) => {
      // Generate secure filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const fileExtension = path.extname(file.originalname).toLowerCase();
      cb(null, `${req.userId}-${uniqueSuffix}${fileExtension}`);
    }
  });

  const fileFilter = (req, file, cb) => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
    }
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
      files: 1
    }
  });
};

// Enhanced validation middleware with comprehensive checks
const validateInput = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value
      }));

      return res.status(400).json({
        error: 'Validation failed',
        details: formattedErrors
      });
    }

    next();
  };
};

// Common validation rules
const validationRules = {
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  
  password: body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number and special character'),
  
  name: body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s\-']+$/)
    .withMessage('Name can only contain letters, spaces, hyphens and apostrophes'),
  
  city: body('city')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),
  
  skillName: body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Skill name must be between 2 and 50 characters'),
  
  messageContent: body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
  
  mongoId: (field) => body(field)
    .isMongoId()
    .withMessage(`${field} must be a valid ID`)
};

// Enhanced error handling middleware
const enhancedErrorHandler = (err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    user: req.user?.id,
    timestamp: new Date().toISOString()
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: Object.values(err.errors).map(e => e.message)
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid ID format'
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      error: `${field} already exists`
    });
  }

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large. Maximum size is 5MB.'
      });
    }
    return res.status(400).json({
      error: 'File upload error: ' + err.message
    });
  }

  // Default error
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
};

// Performance monitoring middleware
const performanceMonitor = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`Slow request: ${req.method} ${req.url} - ${duration}ms`);
    }

    // Log to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // Integration point for monitoring services like DataDog, New Relic, etc.
    }
  });
  
  next();
};

// Health check endpoint
const healthCheck = (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version,
    database: 'connected', // Should check actual DB connection
    cache: cacheService.isConnected() ? 'connected' : 'disconnected'
  };

  res.status(200).json(health);
};

module.exports = {
  enhancedSecurityMiddleware,
  sanitizeInput,
  enhancedAuth,
  enhancedAdminAuth,
  checkPermission,
  enhancedFileUpload,
  validateInput,
  validationRules,
  enhancedErrorHandler,
  performanceMonitor,
  healthCheck
};
