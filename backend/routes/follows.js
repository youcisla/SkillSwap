const express = require('express');
const Follow = require('../models/Follow');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { emitNewFollower } = require('../utils/socketUtils');

const router = express.Router();

// Follow a user
router.post('/', auth, async (req, res) => {
  try {
    const { followingId } = req.body;
    const followerId = req.userId;

    if (!followingId) {
      return res.status(400).json({
        success: false,
        error: 'followingId is required'
      });
    }

    // Check if user exists
    const userToFollow = await User.findById(followingId);
    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        error: 'User to follow not found'
      });
    }

    // Check if user is trying to follow themselves
    if (followerId === followingId) {
      return res.status(400).json({
        success: false,
        error: 'Users cannot follow themselves'
      });
    }

    // Check if already following (including inactive follows)
    let follow = await Follow.findOne({ 
      followerId, 
      followingId
    });

    let isNewFollow = false;

    if (follow) {
      if (follow.isActive) {
        return res.status(400).json({
          success: false,
          error: 'Already following this user'
        });
      } else {
        // Reactivate existing follow
        follow.isActive = true;
        follow.createdAt = new Date();
        await follow.save();
        isNewFollow = true;
      }
    } else {
      // Create new follow relationship
      try {
        follow = new Follow({
          followerId,
          followingId
        });
        await follow.save();
        isNewFollow = true;
      } catch (error) {
        // Handle duplicate key error gracefully
        if (error.code === 11000) {
          // Race condition - another request already created the follow
          follow = await Follow.findOne({ followerId, followingId });
          if (follow && follow.isActive) {
            return res.status(400).json({
              success: false,
              error: 'Already following this user'
            });
          }
          // If follow exists but is inactive, activate it
          if (follow && !follow.isActive) {
            follow.isActive = true;
            follow.createdAt = new Date();
            await follow.save();
            isNewFollow = true;
          }
        } else {
          throw error;
        }
      }
    }

    // Update follower counts only for new follows
    if (isNewFollow) {
      await Promise.all([
        User.findByIdAndUpdate(followerId, { 
          $inc: { followingCount: 1 } 
        }),
        User.findByIdAndUpdate(followingId, { 
          $inc: { followersCount: 1 } 
        })
      ]);
    }

    // Get follower info for notification (only for new follows)
    if (isNewFollow) {
      const follower = await User.findById(followerId).select('name');
      
      // Emit real-time notification to the followed user
      if (follower) {
        emitNewFollower(followingId, {
          followerId,
          followerName: follower.name
        });
      }
    }

    res.status(201).json({
      success: true,
      data: follow.toJSON(),
      message: 'Successfully followed user'
    });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to follow user'
    });
  }
});

// Unfollow a user
router.delete('/:followingId', auth, async (req, res) => {
  try {
    const followerId = req.userId;
    const { followingId } = req.params;

    // Find and remove the follow relationship
    const follow = await Follow.findOneAndUpdate(
      { 
        followerId, 
        followingId, 
        isActive: true 
      },
      { 
        isActive: false 
      },
      { new: true }
    );

    if (!follow) {
      return res.status(404).json({
        success: false,
        error: 'Follow relationship not found'
      });
    }

    // Update follower counts
    await Promise.all([
      User.findByIdAndUpdate(followerId, { 
        $inc: { followingCount: -1 } 
      }),
      User.findByIdAndUpdate(followingId, { 
        $inc: { followersCount: -1 } 
      })
    ]);

    res.json({
      success: true,
      message: 'Successfully unfollowed user'
    });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unfollow user'
    });
  }
});

// Get followers of a user
router.get('/:userId/followers', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const follows = await Follow.find({ 
      followingId: req.params.userId, 
      isActive: true 
    })
    .populate('followerId', 'name email profileImage city rating totalSessions')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip(offset);

    const followers = follows.map(follow => ({
      ...follow.followerId.toJSON(),
      followedAt: follow.createdAt
    }));

    const totalCount = await Follow.countDocuments({
      followingId: req.params.userId,
      isActive: true
    });

    res.json({
      success: true,
      data: followers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get followers'
    });
  }
});

// Get users that a user is following
router.get('/:userId/following', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const follows = await Follow.find({ 
      followerId: req.params.userId, 
      isActive: true 
    })
    .populate('followingId', 'name email profileImage city rating totalSessions')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip(offset);

    const following = follows.map(follow => ({
      ...follow.followingId.toJSON(),
      followedAt: follow.createdAt
    }));

    const totalCount = await Follow.countDocuments({
      followerId: req.params.userId,
      isActive: true
    });

    res.json({
      success: true,
      data: following,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get following'
    });
  }
});

// Check if user is following another user
router.get('/check/:followingId', auth, async (req, res) => {
  try {
    const followerId = req.userId;
    const { followingId } = req.params;

    const isFollowing = await Follow.findOne({
      followerId,
      followingId,
      isActive: true
    });

    res.json({
      success: true,
      data: {
        isFollowing: !!isFollowing
      }
    });
  } catch (error) {
    console.error('Check follow status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check follow status'
    });
  }
});

// Get follow statistics for a user
router.get('/:userId/stats', auth, async (req, res) => {
  try {
    const [followersCount, followingCount] = await Promise.all([
      Follow.countDocuments({ 
        followingId: req.params.userId, 
        isActive: true 
      }),
      Follow.countDocuments({ 
        followerId: req.params.userId, 
        isActive: true 
      })
    ]);

    res.json({
      success: true,
      data: {
        followersCount,
        followingCount
      }
    });
  } catch (error) {
    console.error('Get follow stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get follow statistics'
    });
  }
});

// Get mutual follows (users that both follow each other)
router.get('/:userId/mutual', auth, async (req, res) => {
  try {
    const currentUserId = req.userId;
    const { userId } = req.params;

    // Find users that both currentUser and userId follow
    const currentUserFollowing = await Follow.find({
      followerId: currentUserId,
      isActive: true
    }).select('followingId');

    const targetUserFollowing = await Follow.find({
      followerId: userId,
      isActive: true
    }).select('followingId');

    const currentUserFollowingIds = currentUserFollowing.map(f => f.followingId.toString());
    const targetUserFollowingIds = targetUserFollowing.map(f => f.followingId.toString());

    const mutualFollowingIds = currentUserFollowingIds.filter(id => 
      targetUserFollowingIds.includes(id)
    );

    const mutualUsers = await User.find({
      _id: { $in: mutualFollowingIds }
    }).select('name email profileImage city rating totalSessions');

    res.json({
      success: true,
      data: mutualUsers.map(user => user.toJSON())
    });
  } catch (error) {
    console.error('Get mutual follows error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get mutual follows'
    });
  }
});

module.exports = router;
