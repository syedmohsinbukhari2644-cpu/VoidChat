const express = require('express')
const router = express.Router()
const User = require('../models/User')
const VOID = require('../models/VOID')
const { protect } = require('../middleware/auth')
const crypto = require('crypto')

// Refer code generate karo
router.get('/mycode', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)

    if (!user.referCode) {
      user.referCode = 'VOIDCHAT-' +
        crypto.randomBytes(4).toString('hex').toUpperCase()
      await user.save()
    }

    res.json({
      success: true,
      referCode: user.referCode,
      totalRefers: user.totalRefers || 0,
      voidEarned: (user.totalRefers || 0) * 500
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Refer code use karo (registration ke waqt)
router.post('/use', protect, async (req, res) => {
  try {
    const { referCode } = req.body
    const newUser = await User.findById(req.user._id)

    if (newUser.referredBy) {
      return res.status(400).json({
        success: false,
        message: '❌ Pehle se refer code use ho chuka!'
      })
    }

    const referrer = await User.findOne({ referCode })

    if (!referrer) {
      return res.status(404).json({
        success: false,
        message: '❌ Refer code galat hai!'
      })
    }

    if (referrer._id.toString() === newUser._id.toString()) {
      return res.status(400).json({
        success: false,
        message: '❌ Apna code use nahi kar sakte!'
      })
    }

    // Referrer ko 500 VOID do
    await User.findByIdAndUpdate(referrer._id, {
      $inc: { voidBalance: 500, totalRefers: 1 }
    })

    await VOID.create({
      user: referrer._id,
      amount: 500,
      type: 'refer',
      description: `${newUser.username} ne join kiya! +500 VOID`
    })

    // Naye user ko 200 VOID welcome bonus
    await User.findByIdAndUpdate(newUser._id, {
      $inc: { voidBalance: 200 },
      referredBy: referrer._id
    })

    await VOID.create({
      user: newUser._id,
      amount: 200,
      type: 'refer',
      description: 'Welcome bonus! Refer code use kiya! +200 VOID'
    })

    res.json({
      success: true,
      message: '🎉 Refer code use ho gaya! +200 VOID mile!'
    })

  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

module.exports = router

