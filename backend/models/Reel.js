const mongoose = require('mongoose')

const ReelSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  videoUrl: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String
  },
  caption: {
    type: String,
    maxlength: 300
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    createdAt: { type: Date, default: Date.now }
  }],
  shares: { type: Number, default: 0 },
  VOIDEarned: { type: Number, default: 0 },
  // Creator level
  creatorLevel: {
    type: String,
    enum: ['newcomer', 'rising', 'creator', 'elite'],
    default: 'newcomer'
  },
  createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Reel', ReelSchema)