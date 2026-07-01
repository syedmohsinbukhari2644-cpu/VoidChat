const express = require('express')
const router = express.Router()
const Post = require('../models/Post')
const User = require('../models/User')
const VOID = require('../models/VOID')

const { protect } = require('../middleware/auth')

// Saare posts dekho (Feed)
router.get('/', protect, async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('user', 'username isAnonymous')
      .sort({ createdAt: -1 })
      .limit(20)

    res.json({ success: true, posts })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Nai post likho
router.post('/', protect, async (req, res) => {
  try {
    const { content, isAnonymous } = req.body

    const post = await Post.create({
      user: req.user._id,
      content,
      isAnonymous: isAnonymous || false,
      voidEarned: 40
    })

    // 40 void do post karne pe (DB field name as-is)
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { voidBalance: 40 }
    })

    await VOID.create({
      user: req.user._id,
      amount: 40,
      type: 'post',
      description: 'Post likhne pe VOID!'
    })

    res.status(201).json({
      success: true,
      message: '✅ Post ho gayi! +40 VOID mile!',
      post
    })

  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Post like karo
router.put('/:id/like', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post nahi mili!'
      })
    }

    const alreadyLiked = post.likes.includes(req.user._id)

    if (alreadyLiked) {
      // Unlike karo
      post.likes = post.likes.filter(
        id => id.toString() !== req.user._id.toString()
      )
      await post.save()
      return res.json({ success: true, message: 'Unlike ho gayi!' })
    }

    // Like karo + 5 reward (DB field name as-is)
    post.likes.push(req.user._id)
    await post.save()

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { voidBalance: 5 }
    })

    await VOID.create({
      user: req.user._id,
      amount: 5,
      type: 'like',
      description: 'Like karne pe VOID!'
    })

    res.json({
      success: true,
      message: '❤️ Like ho gayi! +5 VOID mile!',
      likes: post.likes.length
    })

  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Comment karo
router.post('/:id/comment', protect, async (req, res) => {
  try {
    const { text, isAnonymous } = req.body
    const post = await Post.findById(req.params.id)

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post nahi mili!'
      })
    }

    post.comments.push({
      user: req.user._id,
      text,
      isAnonymous: isAnonymous || false
    })
    await post.save()

    // 10 reward (DB field name as-is)
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { voidBalance: 10 }
    })

    await VOID.create({
      user: req.user._id,
      amount: 10,
      type: 'comment',
      description: 'Comment karne pe VOID!'
    })

    res.json({
      success: true,
      message: '💬 Comment ho gaya! +10 VOID mile!',
      comments: post.comments.length
    })

  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

module.exports = router

