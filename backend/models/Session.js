const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  skillId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  scheduledAt: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // Duration in minutes
    default: 60
  },
  location: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    maxlength: 1000
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      maxlength: 500
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  cancellationReason: String
}, {
  timestamps: true
});

// Index for better query performance
sessionSchema.index({ teacherId: 1, scheduledAt: 1 });
sessionSchema.index({ studentId: 1, scheduledAt: 1 });
sessionSchema.index({ status: 1, scheduledAt: 1 });

// Prevent model overwrite error during development
module.exports = mongoose.models.Session || mongoose.model('Session', sessionSchema);
