const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  bio: {
    type: String,
    maxlength: 500
  },
  profileImage: {
    type: String,
    default: null
  },
  location: {
    latitude: Number,
    longitude: Number,
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  skillsToTeach: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill'
  }],
  skillsToLearn: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill'
  }],
  availability: [{
    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6
    },
    startTime: String,
    endTime: String
  }],
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalSessions: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  
  // Transform _id to id for frontend compatibility
  user.id = user._id;
  delete user._id;
  delete user.__v;
  
  return user;
};

// Prevent model overwrite error during development
module.exports = mongoose.models.User || mongoose.model('User', userSchema);
