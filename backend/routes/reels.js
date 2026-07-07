const express = require('express')
const router = express.Router()
const Reel = require('../models/Reel')
const User = require('../models/User')
const VOID = require('../models/VOID')
const { protect } = require('../middleware/auth')

// VOID calculate karo views se
const calculateVOID = (views, likes, comments, shares) => {
  let VOID = 0

  // Views se
  if (views >= 50000) VOID += 12000
  else if (views >= 10000) VOID += 2000
  else if (views >= 5000) VOID += 800
  else if (views >= 1000) VOID += 150
  else if (views >= 500) VOID += 60
  else if (views >= 100) VOID += 10

  // Engagement se
  VOID += likes * 2
  VOID += comments * 5
  VOID += shares * 10

  return VOID
}

// Creator level check
const getCreatorLevel = (avgViews) => {
  if (avgViews >= 50000) return 'elite'
  if (avgViews >= 5000) return 'creator'
  if (avgViews >= 500) return 'rising'
  return 'newcomer'
}

// Saare reels dekho
router.get('/', protect, async (req, res) => {
  try {
    const reels = await Reel.find()
      .populate('user', 'username')
      .sort({ createdAt: -1 })
      .limit(10)

    res.json({ success: true, reels })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Naya reel upload
router.post('/', protect, async (req, res) => {
  try {
    const { videoUrl, caption, isAnonymous } = req.body

    const reel = await Reel.create({
      user: req.user._id,
      videoUrl,
      caption,
      isAnonymous: isAnonymous || false,
      VOIDEarned: 80
    })

    // 80 VOID do reel upload pe
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { voidBalance: 80 }
    })

    await VOID.create({
      user: req.user._id,
      amount: 80,
      type: 'reel',
      description: 'Reel upload karne pe! +80 VOID'
    })

    res.status(201).json({
      success: true,
      message: '🎬 Reel upload ho gayi! +80 VOID mile!',
      reel
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Reel like karo
router.put('/:id/like', protect, async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id)

    if (!reel) {
      return res.status(404).json({
        success: false,
        message: 'Reel nahi mili!'
      })
    }

    const alreadyLiked = reel.likes.includes(req.user._id)

    if (alreadyLiked) {
      reel.likes = reel.likes.filter(
        id => id.toString() !== req.user._id.toString()
      )
      await reel.save()
      return res.json({ success: true, message: 'Unlike!' })
    }

    reel.likes.push(req.user._id)

    // VOID update karo
    const newVOID = calculateVOID(
      reel.views,
      reel.likes.length,
      reel.comments.length,
      reel.shares
    )
    reel.VOIDEarned = newVOID
    await reel.save()

    // Creator ko VOID do
    await User.findByIdAndUpdate(reel.user, {
      $inc: { voidBalance: 2 }
    })

    res.json({
      success: true,
      message: '❤️ Like ho gayi!',
      likes: reel.likes.length
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// View count update
router.put('/:id/view', protect, async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id)
    reel.views += 1

    // Har 100 views pe VOID update
    if (reel.views % 100 === 0) {
      const newVOID = calculateVOID(
        reel.views,
        reel.likes.length,
        reel.comments.length,
        reel.shares
      )

      const VOIDDiff = newVOID - reel.VOIDEarned
      if (VOIDDiff > 0) {
        reel.VOIDEarned = newVOID
        await User.findByIdAndUpdate(reel.user, {
          $inc: { voidBalance: VOIDDiff }
        })
      }
    }

    // Creator level update
    reel.creatorLevel = getCreatorLevel(reel.views)
    await reel.save()

    res.json({ success: true, views: reel.views })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

module.exports = router