const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  // Use string ID for frontend compatibility
  _id: {
    type: String,
    required: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  _id: false // Disable automatic ObjectId generation
});

// Index for better query performance
chatSchema.index({ participants: 1 });

// Static method to generate chat ID from participants
chatSchema.statics.generateChatId = function(userId1, userId2) {
  // Sort to ensure consistent ID regardless of order
  const sortedIds = [userId1.toString(), userId2.toString()].sort();
  return `${sortedIds[0]}-${sortedIds[1]}`;
};

// Prevent model overwrite error during development
module.exports = mongoose.models.Chat || mongoose.model('Chat', chatSchema);
