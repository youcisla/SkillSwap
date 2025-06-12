const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['technology', 'music', 'cooking', 'sports', 'languages', 'arts', 'other']
  },
  description: {
    type: String,
    maxlength: 500
  },
  level: {
    type: String,
    required: true,
    enum: ['beginner', 'intermediate', 'advanced', 'expert']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['teach', 'learn']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better search performance
skillSchema.index({ name: 'text', description: 'text', category: 1 });
skillSchema.index({ userId: 1, type: 1 });

// Prevent model overwrite error during development
module.exports = mongoose.models.Skill || mongoose.model('Skill', skillSchema);
