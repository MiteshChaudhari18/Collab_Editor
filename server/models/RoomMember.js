const mongoose = require('mongoose');

const roomMemberSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'member'],
    default: 'member'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent duplicate memberships
roomMemberSchema.index({ room: 1, email: 1 }, { unique: true });
roomMemberSchema.index({ room: 1, user: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('RoomMember', roomMemberSchema);

