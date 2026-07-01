const mongoose = require('mongoose')

const MessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // ==========================================
  // 🛡️ ZERO-KNOWLEDGE E2E ENCRYPTION
  // ==========================================
  // Content is ALWAYS encrypted on the client side using AES-256-GCM.
  // The backend NEVER sees the plain text and DOES NOT hold the decryption keys.
  // Any developer, admin, or hacker looking at this DB will only see cipher gibberish.
  encryptedContent: {
    type: String,
    required: true
  },
  iv: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model('Message', MessageSchema)