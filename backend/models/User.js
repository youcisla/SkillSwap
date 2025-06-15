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
    type: {
      type: String,
      enum: ['Point'],
      required: function() {
        return this.location && this.location.coordinates;
      }
    },
    coordinates: {
      type: [Number],
      required: function() {
        return this.location && this.location.type;
      },
      validate: {
        validator: function(v) {
          return !v || (Array.isArray(v) && v.length === 2 && 
                       v.every(coord => typeof coord === 'number' && !isNaN(coord)));
        },
        message: 'Coordinates must be an array of exactly 2 numbers [longitude, latitude]'
      }
    }
  },
  locationUpdatedAt: {
    type: Date
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
  followersCount: {
    type: Number,
    default: 0
  },
  followingCount: {
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
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'super-admin'],
    default: 'user'
  },
  permissions: [{
    type: String,
    enum: [
      'manage_users',
      'manage_skills', 
      'manage_sessions',
      'manage_matches',
      'manage_chats',
      'manage_content',
      'view_analytics',
      'system_settings',
      'bulk_actions'
    ]
  }]
}, {
  timestamps: true
});

// Create geospatial index for location
userSchema.index({ location: '2dsphere' });

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Clean up invalid location data
  if (this.location && this.location.coordinates && (
    !Array.isArray(this.location.coordinates) ||
    this.location.coordinates.length !== 2 ||
    this.location.coordinates.some(coord => typeof coord !== 'number' || isNaN(coord))
  )) {
    console.log(`🔧 Cleaning invalid location data for user: ${this._id}`);
    this.location = undefined;
  }

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

// Helper method to set location data
userSchema.methods.setLocation = function(latitude, longitude) {
  if (latitude && longitude) {
    this.location = {
      type: 'Point',
      coordinates: [parseFloat(longitude), parseFloat(latitude)]
    };
    this.locationUpdatedAt = new Date();
  }
};

// Helper method to get location data
userSchema.methods.getLocation = function() {
  if (this.location && this.location.coordinates) {
    return {
      latitude: this.location.coordinates[1],
      longitude: this.location.coordinates[0],
      updatedAt: this.locationUpdatedAt
    };
  }
  return null;
};

// Prevent model overwrite error during development
module.exports = mongoose.models.User || mongoose.model('User', userSchema);
