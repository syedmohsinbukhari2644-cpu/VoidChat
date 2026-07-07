const express = require('express')
const router = express.Router()
const Message = require('../models/Message')
const Streak = require('../models/Streak')
const User = require('../models/User')
const VOID = require('../models/VOID')
const { protect } = require('../middleware/auth')
const crypto = require('crypto')

// Encrypt function
const encryptMessage = (text) => {
  const iv = crypto.randomBytes(16)
  const key = crypto.scryptSync(
    process.env.JWT_SECRET, 'salt', 32
  )
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final()
  ])
  return {
    encryptedContent: encrypted.toString('hex'),
    iv: iv.toString('hex')
  }
}

// Decrypt function
const decryptMessage = (encryptedContent, iv) => {
  const key = crypto.scryptSync(
    process.env.JWT_SECRET, 'salt', 32
  )
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(iv, 'hex')
  )
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedContent, 'hex')),
    decipher.final()
  ])
  return decrypted.toString('utf8')
}

// Message bhejo
router.post('/send', protect, async (req, res) => {
  try {
    const { receiverId, content } = req.body

    const receiver = await User.findById(receiverId)
    if (!receiver) {
      return res.status(404).json({ success: false, message: 'User nahi mila!' })
    }

    const currentUser = await User.findById(req.user._id)
    if (currentUser.blockedUsers.includes(receiverId)) {
      return res.status(400).json({ success: false, message: 'Aapne is user ko block kiya hua hai!' })
    }
    if (receiver.blockedUsers.includes(req.user._id)) {
      return res.status(400).json({ success: false, message: 'Is user ne aapko block kiya hua hai!' })
    }

    // E2E Encrypt karo
    const { encryptedContent, iv } = encryptMessage(content)

    const message = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      encryptedContent,
      iv
    })

    // Streak update karo
    let streak = await Streak.findOne({
      user: req.user._id,
      friend: receiverId
    })

    if (!streak) {
      streak = await Streak.create({
        user: req.user._id,
        friend: receiverId,
        currentStreak: 1
      })
    } else {
      const lastMsg = new Date(streak.lastMessageDate)
      const now = new Date()
      const diffHours = (now - lastMsg) / (1000 * 60 * 60)

      if (diffHours < 24) {
        // Same din — streak count nahi
      } else if (diffHours < 48) {
        // Kal ka message — streak barhe!
        streak.currentStreak += 1
        if (streak.currentStreak > streak.longestStreak) {
          streak.longestStreak = streak.currentStreak
        }

        // Bonus multiplier update karo
        if (streak.currentStreak >= 90) streak.bonusMultiplier = 2.0
        else if (streak.currentStreak >= 60) streak.bonusMultiplier = 1.5
        else if (streak.currentStreak >= 30) streak.bonusMultiplier = 1.25
        else if (streak.currentStreak >= 7) streak.bonusMultiplier = 1.1

      } else {
        // Streak toot gayi!
        streak.currentStreak = 1
        streak.bonusMultiplier = 1.0
      }

      streak.lastMessageDate = now
      await streak.save()
    }

    // Streak VOID bonus do
    const streakVOID = Math.floor(50 * streak.bonusMultiplier)
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { voidBalance: streakVOID }
    })

    await VOID.create({
      user: req.user._id,
      amount: streakVOID,
      type: 'streak',
      description: `Streak ${streak.currentStreak} din! +${streakVOID} VOID`
    })

    res.status(201).json({
      success: true,
      message: `🔐 Message send! +${streakVOID} VOID mile!`,
      streak: streak.currentStreak,
      VOIDEarned: streakVOID
    })

  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Messages dekho
router.get('/:userId', protect, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user._id }
      ]
    }).sort({ createdAt: 1 })

    // Decrypt karo
    const decrypted = messages.map(msg => ({
      _id: msg._id,
      sender: msg.sender,
      receiver: msg.receiver,
      content: decryptMessage(msg.encryptedContent, msg.iv),
      isRead: msg.isRead,
      createdAt: msg.createdAt
    }))

    res.json({ success: true, messages: decrypted })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

module.exports = router