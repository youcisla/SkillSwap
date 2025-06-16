const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
  followerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  followingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Ensure unique follow relationships (prevent duplicate follows)
followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

// Ensure a user cannot follow themselves
followSchema.pre('save', function(next) {
  if (this.followerId.toString() === this.followingId.toString()) {
    return next(new Error('Users cannot follow themselves'));
  }
  next();
});

// Remove follow from JSON output that aren't needed
followSchema.methods.toJSON = function() {
  const follow = this.toObject();
  
  // Transform _id to id for frontend compatibility
  follow.id = follow._id;
  delete follow._id;
  delete follow.__v;
  
  return follow;
};

// Prevent model overwrite error during development
module.exports = mongoose.models.Follow || mongoose.model('Follow', followSchema);
