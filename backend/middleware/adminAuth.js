const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;

// Admin authentication middleware
const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.role !== 'admin' && user.role !== 'super-admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin privileges required.'
      });
    }

    req.userId = decoded.userId;
    req.userRole = user.role;
    req.userPermissions = user.permissions;
    next();
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Admin auth middleware error:', error);
    }
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
};

// Check specific permission
const checkPermission = (permission) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.userId);
      
      if (user.role === 'super-admin') {
        // Super admin has all permissions
        return next();
      }
      
      if (!user.permissions.includes(permission)) {
        return res.status(403).json({
          success: false,
          error: `Access denied. ${permission} permission required.`
        });
      }
      
      next();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Permission check error:', error);
      }
      res.status(500).json({
        success: false,
        error: 'Permission check failed'
      });
    }
  };
};

module.exports = { adminAuth, checkPermission };
