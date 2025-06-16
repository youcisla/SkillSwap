const express = require('express');
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
    const { teacherId, studentId, skillId, scheduledAt, location, notes } = req.body;

    // Validate users exist
    const teacher = await User.findById(teacherId);
    const student = await User.findById(studentId);
    const skill = await Skill.findById(skillId);

    if (!teacher || !student || !skill) {
      return res.status(404).json({
        success: false,
        error: 'Teacher, student, or skill not found'
      });
    }

    // Check if user is either teacher or student
    if (req.userId !== teacherId && req.userId !== studentId) {
      return res.status(403).json({
        success: false,
        error: 'You can only create sessions for yourself'
      });
    }

    const session = new Session({
      teacherId,
      studentId,
      skillId,
      scheduledAt: new Date(scheduledAt),
      location,
      notes
    });

    await session.save();

    const populatedSession = await Session.findById(session._id)
      .populate('teacherId', 'name profileImage')
      .populate('studentId', 'name profileImage')
      .populate('skillId', 'name category');

    res.status(201).json({
      success: true,
      data: populatedSession
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create session'
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
    const { status } = req.body;
    
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

    const updatedSession = await Session.findByIdAndUpdate(
      req.params.sessionId,
      { status },
      { new: true }
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
    const { reason } = req.body;
    
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

    const updatedSession = await Session.findByIdAndUpdate(
      req.params.sessionId,
      { 
        status: 'cancelled',
        cancellationReason: reason
      },
      { new: true }
    )
    .populate('teacherId', 'name profileImage')
    .populate('studentId', 'name profileImage')
    .populate('skillId', 'name category');

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
