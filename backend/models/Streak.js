const mongoose = require('mongoose')

const StreakSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  friend: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  currentStreak: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  lastMessageDate: {
    type: Date,
    default: Date.now
  },
  bonusMultiplier: {
    type: Number,
    default: 1.0
    // 7 din = 1.1
    // 30 din = 1.25
    // 60 din = 1.5
    // 90 din = 2.0
  }
})

module.exports = mongoose.model('Streak', StreakSchema)