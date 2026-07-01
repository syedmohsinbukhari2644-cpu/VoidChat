const mongoose = require('mongoose')

const VOIDSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: [
      'login',        // Roz login
      'post',         // Post karna
      'like',         // Like karna
      'comment',      // Comment karna
      'streak',       // Streak bonus
      'refer',        // Refer karna
      'reel',         // Reel banana
      'cashout',      // Cashout
      'transfer'      // Kisi ko bhejna
    ],
    required: true
  },
  description: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model('VOID', VOIDSchema)