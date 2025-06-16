const express = require('express');
const { adminAuth, checkPermission } = require('../middleware/adminAuth');
const User = require('../models/User');
const Skill = require('../models/Skill');
const Session = require('../models/Session');
const Match = require('../models/Match');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Follow = require('../models/Follow');

const router = express.Router();

// Dashboard - Overview statistics
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalSkills,
      activeSkills,
      totalSessions,
      pendingSessions,
      completedSessions,
      totalMatches,
      activeMatches,
      totalChats,
      totalMessages,
      recentUsers,
      topSkills
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true, lastActive: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }),
      Skill.countDocuments(),
      Skill.countDocuments({ isActive: true }),
      Session.countDocuments(),
      Session.countDocuments({ status: 'pending' }),
      Session.countDocuments({ status: 'completed' }),
      Match.countDocuments(),
      Match.countDocuments({ isActive: true }),
      Chat.countDocuments(),
      Message.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(5).select('name email city createdAt isActive'),
      Skill.aggregate([
        { $group: { _id: '$name', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    res.json({
      success: true,
      data: {
        statistics: {
          users: {
            total: totalUsers,
            active: activeUsers,
            inactive: totalUsers - activeUsers
          },
          skills: {
            total: totalSkills,
            active: activeSkills
          },
          sessions: {
            total: totalSessions,
            pending: pendingSessions,
            completed: completedSessions
          },
          matches: {
            total: totalMatches,
            active: activeMatches
          },
          communication: {
            chats: totalChats,
            messages: totalMessages
          }
        },
        recentUsers,
        topSkills
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load dashboard data'
    });
  }
});

// User Management
router.get('/users', [adminAuth, checkPermission('manage_users')], async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, role } = req.query;
    const offset = (page - 1) * limit;

    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      query.isActive = status === 'active';
    }
    
    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .populate('skillsToTeach', 'name category')
      .populate('skillsToLearn', 'name category')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip(offset);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users: users.map(user => user.toJSON()),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get users'
    });
  }
});

// Update user status/role
router.put('/users/:userId', [adminAuth, checkPermission('manage_users')], async (req, res) => {
  try {
    const { isActive, role, permissions } = req.body;
    const updates = {};
    
    if (typeof isActive === 'boolean') updates.isActive = isActive;
    if (role) updates.role = role;
    if (permissions) updates.permissions = permissions;

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      updates,
      { new: true, runValidators: true }
    ).populate('skillsToTeach').populate('skillsToLearn');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user.toJSON(),
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user'
    });
  }
});

// Delete user account
router.delete('/users/:userId', [adminAuth, checkPermission('manage_users')], async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Soft delete by deactivating
    await User.findByIdAndUpdate(req.params.userId, { isActive: false });

    // Optionally clean up related data
    await Promise.all([
      Skill.updateMany({ userId: req.params.userId }, { isActive: false }),
      Session.updateMany(
        { $or: [{ teacherId: req.params.userId }, { studentId: req.params.userId }] },
        { status: 'cancelled' }
      ),
      Match.updateMany(
        { $or: [{ user1Id: req.params.userId }, { user2Id: req.params.userId }] },
        { isActive: false }
      ),
      Follow.updateMany(
        { $or: [{ followerId: req.params.userId }, { followingId: req.params.userId }] },
        { isActive: false }
      )
    ]);

    res.json({
      success: true,
      message: 'User account deactivated successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user'
    });
  }
});

// Skills Management
router.get('/skills', [adminAuth, checkPermission('manage_skills')], async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category, type, status } = req.query;
    const offset = (page - 1) * limit;

    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category) query.category = category;
    if (type) query.type = type;
    if (status) query.isActive = status === 'active';

    const skills = await Skill.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip(offset);

    const total = await Skill.countDocuments(query);

    res.json({
      success: true,
      data: {
        skills,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get admin skills error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get skills'
    });
  }
});

// Update skill
router.put('/skills/:skillId', [adminAuth, checkPermission('manage_skills')], async (req, res) => {
  try {
    const skill = await Skill.findByIdAndUpdate(
      req.params.skillId,
      req.body,
      { new: true, runValidators: true }
    ).populate('userId', 'name email');

    if (!skill) {
      return res.status(404).json({
        success: false,
        error: 'Skill not found'
      });
    }

    res.json({
      success: true,
      data: skill,
      message: 'Skill updated successfully'
    });
  } catch (error) {
    console.error('Update skill error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update skill'
    });
  }
});

// Delete skill
router.delete('/skills/:skillId', [adminAuth, checkPermission('manage_skills')], async (req, res) => {
  try {
    const skill = await Skill.findByIdAndUpdate(
      req.params.skillId,
      { isActive: false },
      { new: true }
    );

    if (!skill) {
      return res.status(404).json({
        success: false,
        error: 'Skill not found'
      });
    }

    // Remove from user's skill arrays
    await User.findByIdAndUpdate(skill.userId, {
      $pull: { 
        skillsToTeach: skill._id,
        skillsToLearn: skill._id
      }
    });

    res.json({
      success: true,
      message: 'Skill deleted successfully'
    });
  } catch (error) {
    console.error('Delete skill error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete skill'
    });
  }
});

// Sessions Management
router.get('/sessions', [adminAuth, checkPermission('manage_sessions')], async (req, res) => {
  try {
    const { page = 1, limit = 20, status, dateFrom, dateTo } = req.query;
    const offset = (page - 1) * limit;

    let query = {};
    
    if (status) query.status = status;
    if (dateFrom || dateTo) {
      query.scheduledAt = {};
      if (dateFrom) query.scheduledAt.$gte = new Date(dateFrom);
      if (dateTo) query.scheduledAt.$lte = new Date(dateTo);
    }

    const sessions = await Session.find(query)
      .populate('teacherId', 'name email')
      .populate('studentId', 'name email')
      .populate('skillId', 'name category')
      .sort({ scheduledAt: -1 })
      .limit(limit * 1)
      .skip(offset);

    const total = await Session.countDocuments(query);

    res.json({
      success: true,
      data: {
        sessions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get admin sessions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sessions'
    });
  }
});

// Update session
router.put('/sessions/:sessionId', [adminAuth, checkPermission('manage_sessions')], async (req, res) => {
  try {
    const session = await Session.findByIdAndUpdate(
      req.params.sessionId,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('teacherId', 'name email')
    .populate('studentId', 'name email')
    .populate('skillId', 'name category');

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    res.json({
      success: true,
      data: session,
      message: 'Session updated successfully'
    });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update session'
    });
  }
});

// Analytics
router.get('/analytics', [adminAuth, checkPermission('view_analytics')], async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case '7d':
        dateFilter = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
        break;
      case '30d':
        dateFilter = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
        break;
      case '90d':
        dateFilter = { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) };
        break;
      case '1y':
        dateFilter = { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) };
        break;
    }

    const [
      userGrowth,
      skillDistribution,
      sessionStats,
      topUsers,
      engagementMetrics
    ] = await Promise.all([
      // User growth over time
      User.aggregate([
        { $match: { createdAt: dateFilter } },
        { 
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // Skill category distribution
      Skill.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      // Session completion rates
      Session.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Top users by sessions
      User.aggregate([
        { $match: { totalSessions: { $gt: 0 } } },
        { $sort: { totalSessions: -1 } },
        { $limit: 10 },
        { $project: { name: 1, email: 1, totalSessions: 1, rating: 1 } }
      ]),
      
      // Engagement metrics
      {
        activeUsers: await User.countDocuments({ 
          lastActive: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } 
        }),
        messagesThisWeek: await Message.countDocuments({ 
          createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } 
        })
      }
    ]);

    res.json({
      success: true,
      data: {
        userGrowth,
        skillDistribution,
        sessionStats,
        topUsers,
        engagementMetrics
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics'
    });
  }
});

// System settings
router.get('/settings', [adminAuth, checkPermission('system_settings')], async (req, res) => {
  try {
    // This could be expanded to include actual system settings
    // For now, return basic configuration
    res.json({
      success: true,
      data: {
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        database: 'Connected',
        features: {
          chat: true,
          matching: true,
          sessions: true,
          follows: true
        }
      }
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get settings'
    });
  }
});

// Content Moderation Routes
router.get('/reports', [adminAuth, checkPermission('manage_content')], async (req, res) => {
  try {
    const { page = 1, limit = 20, status, severity, type } = req.query;
    const offset = (page - 1) * limit;

    // This would be replaced with an actual Report model
    // For now, returning mock data structure
    const mockReports = [
      {
        id: '1',
        type: 'user',
        reportedBy: { id: 'user1', name: 'John Doe', email: 'john@example.com' },
        reportedItem: { id: 'user2', name: 'Jane Smith', email: 'jane@example.com' },
        reason: 'Inappropriate behavior',
        description: 'User was using offensive language during a session',
        status: 'pending',
        severity: 'medium',
        createdAt: new Date(),
      }
    ];

    res.json({
      success: true,
      data: {
        reports: mockReports,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: mockReports.length,
          totalPages: Math.ceil(mockReports.length / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get reports'
    });
  }
});

router.put('/reports/:reportId', [adminAuth, checkPermission('manage_content')], async (req, res) => {
  try {
    const { status, action, notes } = req.body;
    
    // Mock response - replace with actual database update
    res.json({
      success: true,
      message: 'Report updated successfully',
      data: {
        id: req.params.reportId,
        status,
        action,
        notes,
        reviewedBy: req.userId,
        reviewedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update report'
    });
  }
});

// System Settings Routes
router.get('/system-settings', [adminAuth, checkPermission('system_settings')], async (req, res) => {
  try {
    // Mock settings - replace with actual settings storage
    const settings = {
      general: {
        appName: 'SkillShare',
        appVersion: '1.0.0',
        maintenanceMode: false,
        registrationEnabled: true,
        maxUsersPerSession: 10,
        sessionDurationLimit: 120,
      },
      security: {
        passwordMinLength: 8,
        requireEmailVerification: true,
        enableTwoFactorAuth: false,
        sessionTimeout: 1440,
        maxLoginAttempts: 5,
      },
      features: {
        chatEnabled: true,
        videoCallEnabled: true,
        fileUploadEnabled: true,
        skillRecommendations: true,
        userMatching: true,
        geoLocation: true,
      },
      notifications: {
        emailNotifications: true,
        pushNotifications: true,
        sessionReminders: true,
        matchNotifications: true,
        messageNotifications: true,
      },
      content: {
        maxSkillsPerUser: 20,
        autoModeration: true,
        profanityFilter: true,
        imageModeration: true,
        requireSkillApproval: false,
      },
      analytics: {
        dataRetentionDays: 365,
        anonymizeUserData: true,
        trackUserBehavior: true,
        shareAnalytics: false,
      },
    };

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Get system settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get system settings'
    });
  }
});

router.put('/system-settings', [adminAuth, checkPermission('system_settings')], async (req, res) => {
  try {
    const settings = req.body;
    
    // Mock update - replace with actual settings storage
    res.json({
      success: true,
      message: 'System settings updated successfully',
      data: settings
    });
  } catch (error) {
    console.error('Update system settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update system settings'
    });
  }
});

// Bulk Actions
router.post('/bulk-actions', [adminAuth, checkPermission('manage_users')], async (req, res) => {
  try {
    const { action, type, ids, data } = req.body;
    
    switch (action) {
      case 'delete':
        if (type === 'users') {
          await User.updateMany(
            { _id: { $in: ids } },
            { isActive: false }
          );
        } else if (type === 'skills') {
          await Skill.updateMany(
            { _id: { $in: ids } },
            { isActive: false }
          );
        }
        break;
        
      case 'activate':
        if (type === 'users') {
          await User.updateMany(
            { _id: { $in: ids } },
            { isActive: true }
          );
        } else if (type === 'skills') {
          await Skill.updateMany(
            { _id: { $in: ids } },
            { isActive: true }
          );
        }
        break;
        
      case 'update':
        if (type === 'users') {
          await User.updateMany(
            { _id: { $in: ids } },
            data
          );
        }
        break;
    }

    res.json({
      success: true,
      message: `Bulk ${action} completed successfully`,
      processed: ids.length
    });
  } catch (error) {
    console.error('Bulk action error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform bulk action'
    });
  }
});

// Enhanced Analytics with Charts Data
router.get('/analytics/charts', [adminAuth, checkPermission('view_analytics')], async (req, res) => {
  try {
    const { period = '30d', type } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case '7d':
        dateFilter = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
        break;
      case '30d':
        dateFilter = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
        break;
      case '90d':
        dateFilter = { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) };
        break;
      case '1y':
        dateFilter = { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) };
        break;
    }

    const chartsData = {};

    if (type === 'users' || !type) {
      chartsData.userRegistrations = await User.aggregate([
        { $match: { createdAt: dateFilter } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);
    }

    if (type === 'skills' || !type) {
      chartsData.skillsCreated = await Skill.aggregate([
        { $match: { createdAt: dateFilter } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);
    }

    if (type === 'sessions' || !type) {
      chartsData.sessionsScheduled = await Session.aggregate([
        { $match: { createdAt: dateFilter } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);
    }

    res.json({
      success: true,
      data: chartsData
    });
  } catch (error) {
    console.error('Get charts data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get charts data'
    });
  }
});

// System Health Check
router.get('/health', adminAuth, async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: 'connected',
      services: {
        auth: 'operational',
        messaging: 'operational',
        matching: 'operational',
        sessions: 'operational',
      },
      stats: {
        totalUsers: await User.countDocuments(),
        activeUsers: await User.countDocuments({ 
          lastActive: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } 
        }),
        totalSessions: await Session.countDocuments(),
        activeSessions: await Session.countDocuments({ 
          status: 'active',
          scheduledAt: { $gte: new Date() }
        }),
      }
    };

    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      }
    });
  }
});

module.exports = router;
