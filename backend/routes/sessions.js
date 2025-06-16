const express = require('express');
const mongoose = require('mongoose');
const Session = require('../models/Session');
const User = require('../models/User');
const Skill = require('../models/Skill');
const auth = require('../middleware/auth');

const router = express.Router();

// Get user sessions
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const sessions = await Session.find({
      $or: [
        { teacherId: req.params.userId },
        { studentId: req.params.userId }
      ]
    })
    .populate('teacherId', 'name profileImage')
    .populate('studentId', 'name profileImage')
    .populate('skillId', 'name category')
    .sort({ scheduledAt: -1 });

    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    console.error('Get user sessions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user sessions'
    });
  }
});

// Create a session
router.post('/', auth, async (req, res) => {
  try {
    console.log('🎯 Session creation request received');
    console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
    console.log('👤 Auth user ID:', req.userId);
    
    const { teacherId, studentId, skillId, scheduledAt, location, notes } = req.body;

    // Basic validation
    if (!teacherId || !studentId || !skillId || !scheduledAt) {
      console.log('❌ Missing required fields');
      const missingFields = [];
      if (!teacherId) missingFields.push('teacherId');
      if (!studentId) missingFields.push('studentId');
      if (!skillId) missingFields.push('skillId');
      if (!scheduledAt) missingFields.push('scheduledAt');
      
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`,
        details: {
          received: { teacherId, studentId, skillId, scheduledAt },
          missing: missingFields
        }
      });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(teacherId) || !mongoose.Types.ObjectId.isValid(studentId) || !mongoose.Types.ObjectId.isValid(skillId)) {
      console.log('❌ Invalid ObjectId format');
      return res.status(400).json({
        success: false,
        error: 'Invalid ID format'
      });
    }

    // Validate date format
    const sessionDate = new Date(scheduledAt);
    if (isNaN(sessionDate.getTime())) {
      console.log('❌ Invalid date format');
      return res.status(400).json({
        success: false,
        error: 'Invalid date format'
      });
    }

    // Validate users exist
    console.log('🔍 Validating teacher:', teacherId);
    const teacher = await User.findById(teacherId);
    if (!teacher) {
      console.log('❌ Teacher not found');
      return res.status(404).json({
        success: false,
        error: 'Teacher not found'
      });
    }
    console.log('✅ Teacher found:', teacher.name);

    console.log('🔍 Validating student:', studentId);
    const student = await User.findById(studentId);
    if (!student) {
      console.log('❌ Student not found');
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }
    console.log('✅ Student found:', student.name);

    console.log('🔍 Validating skill:', skillId);
    const skill = await Skill.findById(skillId);
    if (!skill) {
      console.log('❌ Skill not found');
      return res.status(404).json({
        success: false,
        error: 'Skill not found'
      });
    }
    console.log('✅ Skill found:', skill.name);

    // Check if user is either teacher or student
    if (req.userId !== teacherId && req.userId !== studentId) {
      console.log('❌ Authorization failed');
      return res.status(403).json({
        success: false,
        error: 'You can only create sessions for yourself'
      });
    }

    console.log('🔧 Creating session object');
    const sessionData = {
      teacherId: new mongoose.Types.ObjectId(teacherId),
      studentId: new mongoose.Types.ObjectId(studentId),
      skillId: new mongoose.Types.ObjectId(skillId),
      scheduledAt: sessionDate,
      location: location || '',
      notes: notes || ''
    };
    console.log('📋 Session data:', sessionData);

    const session = new Session(sessionData);
    console.log('💾 Saving session to database');
    const savedSession = await session.save();
    console.log('✅ Session saved with ID:', savedSession._id);

    console.log('📚 Populating session data');
    const populatedSession = await Session.findById(savedSession._id)
      .populate('teacherId', 'name profileImage')
      .populate('studentId', 'name profileImage')
      .populate('skillId', 'name category');

    console.log('🎉 Session created successfully');
    res.status(201).json({
      success: true,
      data: populatedSession
    });
  } catch (error) {
    console.error('💥 Create session error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Handle different types of errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid data format',
        details: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create session',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get session by ID
router.get('/:sessionId', auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId)
      .populate('teacherId', 'name profileImage city rating')
      .populate('studentId', 'name profileImage city rating')
      .populate('skillId', 'name category level description');

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Check if user is part of this session
    if (session.teacherId._id.toString() !== req.userId && session.studentId._id.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'You are not part of this session'
      });
    }

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get session'
    });
  }
});

// Update session status
router.put('/:sessionId/status', auth, async (req, res) => {
  try {
    console.log('🔄 Update session status request for ID:', req.params.sessionId);
    console.log('📝 New status:', req.body.status);
    console.log('👤 User ID:', req.userId);
    
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    const validStatuses = ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(req.params.sessionId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid session ID format'
      });
    }
    
    const session = await Session.findById(req.params.sessionId);
    if (!session) {
      console.log('❌ Session not found:', req.params.sessionId);
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    console.log('✅ Session found:', session._id);
    console.log('🔄 Current status:', session.status);

    // Check if user is part of this session
    if (session.teacherId.toString() !== req.userId && session.studentId.toString() !== req.userId) {
      console.log('❌ User not authorized to update this session');
      return res.status(403).json({
        success: false,
        error: 'You are not part of this session'
      });
    }

    console.log('🔄 Updating session status');
    const updatedSession = await Session.findByIdAndUpdate(
      req.params.sessionId,
      { status },
      { new: true, runValidators: true }
    )
    .populate('teacherId', 'name profileImage')
    .populate('studentId', 'name profileImage')
    .populate('skillId', 'name category');

    res.json({
      success: true,
      data: updatedSession
    });
  } catch (error) {
    console.error('Update session status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update session status'
    });
  }
});

// Update session
router.put('/:sessionId', auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Check if user is part of this session
    if (session.teacherId.toString() !== req.userId && session.studentId.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'You are not part of this session'
      });
    }

    const updates = req.body;
    if (updates.scheduledAt) {
      updates.scheduledAt = new Date(updates.scheduledAt);
    }

    const updatedSession = await Session.findByIdAndUpdate(
      req.params.sessionId,
      updates,
      { new: true, runValidators: true }
    )
    .populate('teacherId', 'name profileImage')
    .populate('studentId', 'name profileImage')
    .populate('skillId', 'name category');

    res.json({
      success: true,
      data: updatedSession
    });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update session'
    });
  }
});

// Cancel session
router.put('/:sessionId/cancel', auth, async (req, res) => {
  try {
    console.log('🔄 Cancel session request for ID:', req.params.sessionId);
    console.log('👤 User ID:', req.userId);
    
    const { reason } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(req.params.sessionId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid session ID format'
      });
    }
    
    const session = await Session.findById(req.params.sessionId);
    if (!session) {
      console.log('❌ Session not found:', req.params.sessionId);
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    console.log('✅ Session found:', session._id);
    console.log('👨‍🏫 Teacher ID:', session.teacherId);
    console.log('👨‍🎓 Student ID:', session.studentId);

    // Check if user is part of this session
    if (session.teacherId.toString() !== req.userId && session.studentId.toString() !== req.userId) {
      console.log('❌ User not authorized to cancel this session');
      return res.status(403).json({
        success: false,
        error: 'You are not part of this session'
      });
    }

    // Check if session is already cancelled
    if (session.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Session is already cancelled'
      });
    }

    console.log('🔄 Updating session status to cancelled');
    const updatedSession = await Session.findByIdAndUpdate(
      req.params.sessionId,
      { 
        status: 'cancelled',
        cancellationReason: reason || 'No reason provided'
      },
      { new: true }
    )
    .populate('teacherId', 'name profileImage')
    .populate('studentId', 'name profileImage')
    .populate('skillId', 'name category');

    console.log('✅ Session cancelled successfully');
    res.json({
      success: true,
      data: updatedSession
    });
  } catch (error) {
    console.error('Cancel session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel session'
    });
  }
});

// Complete session with feedback
router.put('/:sessionId/complete', auth, async (req, res) => {
  try {
    const { feedback } = req.body;
    
    const session = await Session.findById(req.params.sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Check if user is part of this session
    if (session.teacherId.toString() !== req.userId && session.studentId.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'You are not part of this session'
      });
    }

    const updateData = { status: 'completed' };
    if (feedback) {
      updateData.feedback = {
        ...feedback,
        submittedBy: req.userId
      };
    }

    const updatedSession = await Session.findByIdAndUpdate(
      req.params.sessionId,
      updateData,
      { new: true }
    )
    .populate('teacherId', 'name profileImage')
    .populate('studentId', 'name profileImage')
    .populate('skillId', 'name category');

    // Update user session count and rating
    if (feedback && feedback.rating) {
      const ratedUserId = session.teacherId.toString() === req.userId ? session.studentId : session.teacherId;
      await updateUserRating(ratedUserId, feedback.rating);
    }

    res.json({
      success: true,
      data: updatedSession
    });
  } catch (error) {
    console.error('Complete session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete session'
    });
  }
});

// Get upcoming sessions
router.get('/user/:userId/upcoming', auth, async (req, res) => {
  try {
    const now = new Date();
    const sessions = await Session.find({
      $or: [
        { teacherId: req.params.userId },
        { studentId: req.params.userId }
      ],
      scheduledAt: { $gte: now },
      status: { $in: ['pending', 'confirmed'] }
    })
    .populate('teacherId', 'name profileImage')
    .populate('studentId', 'name profileImage')
    .populate('skillId', 'name category')
    .sort({ scheduledAt: 1 });

    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    console.error('Get upcoming sessions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get upcoming sessions'
    });
  }
});

// Get past sessions
router.get('/user/:userId/past', auth, async (req, res) => {
  try {
    const now = new Date();
    const sessions = await Session.find({
      $or: [
        { teacherId: req.params.userId },
        { studentId: req.params.userId }
      ],
      $or: [
        { scheduledAt: { $lt: now } },
        { status: { $in: ['completed', 'cancelled'] } }
      ]
    })
    .populate('teacherId', 'name profileImage')
    .populate('studentId', 'name profileImage')
    .populate('skillId', 'name category')
    .sort({ scheduledAt: -1 });

    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    console.error('Get past sessions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get past sessions'
    });
  }
});

// Helper function to update user rating
async function updateUserRating(userId, newRating) {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const totalSessions = user.totalSessions || 0;
    const currentRating = user.rating || 0;

    const newTotalSessions = totalSessions + 1;
    const newAverageRating = ((currentRating * totalSessions) + newRating) / newTotalSessions;

    await User.findByIdAndUpdate(userId, {
      rating: Math.round(newAverageRating * 10) / 10, // Round to 1 decimal place
      totalSessions: newTotalSessions
    });
  } catch (error) {
    console.error('Update user rating error:', error);
  }
}

module.exports = router;
