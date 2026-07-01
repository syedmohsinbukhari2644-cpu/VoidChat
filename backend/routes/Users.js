const express = require('express')
const router = express.Router()
const User = require('../models/User')
const Post = require('../models/Post')
const VOID = require('../models/VOID')
const { protect } = require('../middleware/auth')

// Apna profile dekho
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')

    res.json({
      success: true,
      user: {
        username: user.username,
        bio: user.bio,
        VOIDBalance: user.VOIDBalance,
        pkrValue: Math.floor(user.VOIDBalance / 5),
        streakDays: user.streakDays,
        followers: user.followers.length,
        following: user.following.length,
        totalRefers: user.totalRefers,
        referCode: user.referCode,
        createdAt: user.createdAt
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Profile update karo
router.put('/update', protect, async (req, res) => {
  try {
    const { bio, username } = req.body

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { bio, username },
      { new: true }
    ).select('-password')

    res.json({
      success: true,
      message: '✅ Profile update ho gaya!',
      user
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Kisi ko follow karo
router.put('/follow/:id', protect, async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id)
    const currentUser = await User.findById(req.user._id)

    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        message: 'User nahi mila!'
      })
    }

    const alreadyFollowing = currentUser.following.includes(req.params.id)

    if (alreadyFollowing) {
      // Unfollow
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { following: req.params.id }
      })
      await User.findByIdAndUpdate(req.params.id, {
        $pull: { followers: req.user._id }
      })
      return res.json({ success: true, message: 'Unfollow ho gaya!' })
    }

    // Follow
    await User.findByIdAndUpdate(req.user._id, {
      $push: { following: req.params.id }
    })
    await User.findByIdAndUpdate(req.params.id, {
      $push: { followers: req.user._id }
    })

    res.json({ success: true, message: '✅ Follow ho gaya!' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Kisi ka profile dekho
router.get('/:username', protect, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password -email')

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User nahi mila!'
      })
    }

    const posts = await Post.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(10)

    res.json({
      success: true,
      user: {
        username: user.username,
        bio: user.bio,
        followers: user.followers.length,
        following: user.following.length,
        VOIDBalance: user.VOIDBalance,
        posts
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

module.exports = router