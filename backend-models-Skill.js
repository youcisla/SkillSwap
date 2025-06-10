const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Skill name is required'],
    trim: true,
    maxlength: [100, 'Skill name cannot exceed 100 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['technology', 'music', 'cooking', 'sports', 'languages', 'arts', 'other'],
    lowercase: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },
  level: {
    type: String,
    required: [true, 'Skill level is required'],
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    lowercase: true
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
  },
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  experienceYears: {
    type: Number,
    min: 0,
    max: 50,
    default: 0
  },
  certifications: [{
    name: String,
    issuer: String,
    date: Date,
    url: String
  }],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalSessions: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient querying
skillSchema.index({ name: 'text', description: 'text', tags: 'text' });
skillSchema.index({ category: 1, level: 1 });
skillSchema.index({ userId: 1, type: 1 });
skillSchema.index({ isActive: 1 });

// Compound index for matching
skillSchema.index({ category: 1, type: 1, isActive: 1 });

// Virtual for popularity score
skillSchema.virtual('popularityScore').get(function() {
  return (this.rating * this.totalSessions) + (this.tags.length * 0.1);
});

// Static method to find matching skills
skillSchema.statics.findMatchingSkills = function(teachingSkills, learningSkills) {
  const teachingNames = teachingSkills.map(skill => skill.name.toLowerCase());
  const learningNames = learningSkills.map(skill => skill.name.toLowerCase());
  
  return this.find({
    $or: [
      { name: { $in: teachingNames }, type: 'learn' },
      { name: { $in: learningNames }, type: 'teach' }
    ],
    isActive: true
  }).populate('userId', 'name city profileImage rating');
};

// Method to update skill statistics
skillSchema.methods.updateStats = function(newRating) {
  if (newRating) {
    const currentTotal = this.rating * this.totalSessions;
    this.totalSessions += 1;
    this.rating = (currentTotal + newRating) / this.totalSessions;
  } else {
    this.totalSessions += 1;
  }
  return this.save();
};

// Pre-save middleware
skillSchema.pre('save', function(next) {
  // Auto-generate tags from name and description
  if (this.isModified('name') || this.isModified('description')) {
    const words = (this.name + ' ' + this.description)
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2)
      .slice(0, 10); // Limit to 10 tags
    
    this.tags = [...new Set([...this.tags, ...words])]; // Remove duplicates
  }
  next();
});

module.exports = mongoose.model('Skill', skillSchema);
