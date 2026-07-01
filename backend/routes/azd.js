const express = require('express')
const router = express.Router()
const User = require('../models/User')
const VOID = require('../models/VOID')
const { protect } = require('../middleware/auth')

// VOID balance dekho
router.get('/balance', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    const history = await VOID.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10)

    res.json({
      success: true,
      balance: user.voidBalance,
      pkrValue: Math.floor(user.voidBalance / 5),
      history
    })

  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// VOID transfer karo
router.post('/transfer', protect, async (req, res) => {
  try {
    const { receiverUsername, amount } = req.body
    const sender = await User.findById(req.user._id)

    if (sender.voidBalance < amount) {
      return res.status(400).json({
        success: false,
        message: '❌ VOID kam hai!'
      })
    }

    const receiver = await User.findOne({ username: receiverUsername })

    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: '❌ User nahi mila!'
      })
    }

    // Transfer karo
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { voidBalance: -amount }
    })
    await User.findByIdAndUpdate(receiver._id, {
      $inc: { voidBalance: amount }
    })

    await VOID.create({
      user: req.user._id,
      amount: -amount,
      type: 'transfer',
      description: `${receiverUsername} ko ${amount} VOID bheje`
    })

    res.json({
      success: true,
      message: `✅ ${amount} VOID ${receiverUsername} ko mil gaye!`
    })

  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Daily login bonus
router.post('/daily-login', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    const lastLogin = new Date(user.lastLogin)
    const now = new Date()
    const diffHours = (now - lastLogin) / (1000 * 60 * 60)

    if (diffHours < 20) {
      return res.status(400).json({
        success: false,
        message: '⏰ Kal wapas aao daily bonus ke liye!'
      })
    }

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { voidBalance: 20 },
      lastLogin: now
    })

    await VOID.create({
      user: req.user._id,
      amount: 20,
      type: 'login',
      description: 'Daily login bonus!'
    })

    res.json({
      success: true,
      message: '🌟 Daily login bonus! +20 VOID mile!'
    })

  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

module.exports = router

