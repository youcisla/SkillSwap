const express = require('express');
const { body, validationResult } = require('express-validator');
const Skill = require('../models/Skill');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get user skills (both teach and learn)
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const teachSkills = await Skill.find({
      userId: req.params.userId,
      type: 'teach',
      isActive: true
    });

    const learnSkills = await Skill.find({
      userId: req.params.userId,
      type: 'learn',
      isActive: true
    });

    res.json({
      success: true,
      data: {
        teach: teachSkills,
        learn: learnSkills
      }
    });
  } catch (error) {
    console.error('Get user skills error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user skills'
    });
  }
});

// Add a skill
router.post('/teach', [
  auth,
  body('name').notEmpty().withMessage('Skill name is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('level').isIn(['beginner', 'intermediate', 'advanced', 'expert']).withMessage('Invalid level'),
  body('userId').notEmpty().withMessage('User ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { name, category, level, description, userId } = req.body;

    // Check if user is adding skill for themselves
    if (req.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only add skills for yourself'
      });
    }

    // Check if skill already exists for this user
    const existingSkill = await Skill.findOne({
      userId,
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      type: 'teach',
      isActive: true
    });

    if (existingSkill) {
      return res.status(400).json({
        success: false,
        error: 'You already have this skill to teach'
      });
    }

    const skill = new Skill({
      name,
      category,
      level,
      description,
      userId,
      type: 'teach'
    });

    await skill.save();

    // Add skill to user's skillsToTeach array
    await User.findByIdAndUpdate(userId, {
      $addToSet: { skillsToTeach: skill._id }
    });

    res.status(201).json({
      success: true,
      data: skill
    });
  } catch (error) {
    console.error('Add teach skill error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add skill'
    });
  }
});

// Add a learn skill
router.post('/learn', [
  auth,
  body('name').notEmpty().withMessage('Skill name is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('level').isIn(['beginner', 'intermediate', 'advanced', 'expert']).withMessage('Invalid level'),
  body('userId').notEmpty().withMessage('User ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { name, category, level, description, userId } = req.body;

    // Check if user is adding skill for themselves
    if (req.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only add skills for yourself'
      });
    }

    // Check if skill already exists for this user
    const existingSkill = await Skill.findOne({
      userId,
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      type: 'learn',
      isActive: true
    });

    if (existingSkill) {
      return res.status(400).json({
        success: false,
        error: 'You already want to learn this skill'
      });
    }

    const skill = new Skill({
      name,
      category,
      level,
      description,
      userId,
      type: 'learn'
    });

    await skill.save();

    // Add skill to user's skillsToLearn array
    await User.findByIdAndUpdate(userId, {
      $addToSet: { skillsToLearn: skill._id }
    });

    res.status(201).json({
      success: true,
      data: skill
    });
  } catch (error) {
    console.error('Add learn skill error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add skill'
    });
  }
});

// Update a skill
router.put('/:skillId', auth, async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.skillId);
    
    if (!skill) {
      return res.status(404).json({
        success: false,
        error: 'Skill not found'
      });
    }

    // Check if user owns this skill
    if (skill.userId.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only update your own skills'
      });
    }

    const updates = req.body;
    const updatedSkill = await Skill.findByIdAndUpdate(
      req.params.skillId,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedSkill
    });
  } catch (error) {
    console.error('Update skill error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update skill'
    });
  }
});

// Delete a skill
router.delete('/:skillId', auth, async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.skillId);
    
    if (!skill) {
      return res.status(404).json({
        success: false,
        error: 'Skill not found'
      });
    }

    // Check if user owns this skill
    if (skill.userId.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own skills'
      });
    }

    // Remove skill from user's arrays
    const updateField = skill.type === 'teach' ? 'skillsToTeach' : 'skillsToLearn';
    await User.findByIdAndUpdate(skill.userId, {
      $pull: { [updateField]: skill._id }
    });

    // Soft delete the skill
    await Skill.findByIdAndUpdate(req.params.skillId, { isActive: false });

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

// Search skills
router.get('/search', auth, async (req, res) => {
  try {
    const { q, category } = req.query;
    let query = { isActive: true };

    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = category;
    }

    const skills = await Skill.find(query)
      .populate('userId', 'name city profileImage')
      .limit(20);

    res.json({
      success: true,
      data: skills
    });
  } catch (error) {
    console.error('Search skills error:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed'
    });
  }
});

// Get popular skills
router.get('/popular', auth, async (req, res) => {
  try {
    const popularSkills = await Skill.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$name', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: popularSkills
    });
  } catch (error) {
    console.error('Get popular skills error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get popular skills'
    });
  }
});

// Get skills by category
router.get('/category/:category', auth, async (req, res) => {
  try {
    const skills = await Skill.find({
      category: req.params.category,
      isActive: true
    }).populate('userId', 'name city profileImage');

    res.json({
      success: true,
      data: skills
    });
  } catch (error) {
    console.error('Get skills by category error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get skills by category'
    });
  }
});

module.exports = router;
