const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'location'],
    default: 'text'
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  attachments: [{
    url: String,
    type: String,
    name: String,
    size: Number
  }]
}, {
  timestamps: true
});

// Index for efficient querying
messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });

// Prevent model overwrite error during development
module.exports = mongoose.models.Message || mongoose.model('Message', messageSchema);
