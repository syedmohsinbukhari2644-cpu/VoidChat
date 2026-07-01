const mongoose = require('mongoose')

const VoidSchema = new mongoose.Schema({

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
      'login',
      'post',
      'like',
      'comment',
      'streak',
      'refer',
      'reel',
      'cashout',
      'transfer'
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

module.exports = mongoose.model('VOID', VoidSchema)

