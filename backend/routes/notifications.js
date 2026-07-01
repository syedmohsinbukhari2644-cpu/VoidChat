const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const mongoose = require('mongoose')

const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: {
    type: String,
    enum: ['like', 'comment', 'follow', 'refer', 'VOID', 'streak', 'message']
  },
  message: String,
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
})

const Notification = mongoose.model('Notification', NotificationSchema)

// Notifications dekho
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .populate('from', 'username')
      .sort({ createdAt: -1 })
      .limit(20)

    res.json({ success: true, notifications })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Sab read mark karo
router.put('/read', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id },
      { isRead: true }
    )
    res.json({ success: true, message: '✅ Sab read ho gayi!' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

module.exports = { router, Notification }