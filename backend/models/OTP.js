const mongoose = require('mongoose')

const OTPSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  otp: {
    type: String,
    required: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  attempts: {
    type: Number,
    default: 0
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 10 * 60 * 1000)
    // 10 minute mein expire
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model('OTP', OTPSchema)