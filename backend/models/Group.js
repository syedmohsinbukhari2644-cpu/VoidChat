const mongoose = require('mongoose')

const GroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    maxlength: 300
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: { type: Date, default: Date.now }
  }],
  isPaid: {
    type: Boolean,
    default: false
  },
  monthlyFee: {
    type: Number,
    default: 0
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  // E2E encrypted messages
  messages: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    encryptedContent: String,
    iv: String,
    createdAt: { type: Date, default: Date.now }
  }],
  totalEarned: {
    type: Number,
    default: 0
  },
  createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Group', GroupSchema)