const express = require('express')
const router = express.Router()
const Group = require('../models/Group')
const User = require('../models/User')
const VOID = require('../models/VOID')


const { protect } = require('../middleware/auth')

// Group banao
router.post('/create', protect, async (req, res) => {
  try {
    const { name, description, isPaid, monthlyFee, isPrivate } = req.body

    const group = await Group.create({
      name,
      description,
      owner: req.user._id,
      isPaid: isPaid || false,
      monthlyFee: monthlyFee || 0,
      isPrivate: isPrivate || false,
      members: [{ user: req.user._id }]
    })

    res.status(201).json({
      success: true,
      message: `✅ Group "${name}" ban gaya!`,
      group
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Group join karo
router.post('/:id/join', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group nahi mila!'
      })
    }

    // Paid group check
    if (group.isPaid && group.monthlyFee > 0) {
      const user = await User.findById(req.user._id)

      if (user.voidBalance < group.monthlyFee) {
        return res.status(400).json({
          success: false,
          message: `❌ ${group.monthlyFee} VOID chahiye join karne ke liye!`
        })
      }



      // Fee kata o
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { voidBalance: -group.monthlyFee }
      })

      // Owner ko 90% do
      const ownerShare = Math.floor(group.monthlyFee * 0.9)
      await User.findByIdAndUpdate(group.owner, {
        $inc: { voidBalance: ownerShare }
      })

      await VOID.create({

        user: group.owner,
        amount: ownerShare,
        type: 'refer',
        description: `Group "${group.name}" membership fee (VOID)`
      })


      await Group.findByIdAndUpdate(group._id, {
        $inc: { totalEarned: ownerShare }
      })
    }

    // Member add karo
    const alreadyMember = group.members.find(
      m => m.user.toString() === req.user._id.toString()
    )

    if (alreadyMember) {
      return res.status(400).json({
        success: false,
        message: 'Pehle se member ho!'
      })
    }

    group.members.push({ user: req.user._id })
    await group.save()

    res.json({
      success: true,
      message: `✅ "${group.name}" group join ho gaya!`
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Saare groups dekho
router.get('/', protect, async (req, res) => {
  try {
    const groups = await Group.find({ isPrivate: false })
      .populate('owner', 'username')
      .select('-messages')
      .sort({ createdAt: -1 })

    res.json({ success: true, groups })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})


// ------------------------------
// Group Messages (E2E Encrypted)
// ------------------------------

// Encrypt function (same concept as direct messages)
const encryptMessage = (text) => {
  const crypto = require('crypto')
  const iv = crypto.randomBytes(16)
  const key = crypto.scryptSync(process.env.JWT_SECRET, 'salt', 32)
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
  const crypto = require('crypto')
  const key = crypto.scryptSync(process.env.JWT_SECRET, 'salt', 32)
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

// Send group message
router.post('/:id/messages/send', protect, async (req, res) => {
  try {
    const groupId = req.params.id
    const { content } = req.body

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Message content required' })
    }

    const group = await Group.findById(groupId)
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' })
    }

    // membership check
    const isMember = group.members.some(m => m.user.toString() === req.user._id.toString())
    const isOwner = group.owner && group.owner.toString() === req.user._id.toString()

    if (!isMember && !isOwner) {
      return res.status(403).json({ success: false, message: 'Not a member of this group' })
    }

    const { encryptedContent, iv } = encryptMessage(content.trim())

    group.messages.push({
      user: req.user._id,
      encryptedContent,
      iv,
      createdAt: new Date()
    })

    await group.save()

    res.json({
      success: true,
      message: '🔐 Group message sent'
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get group messages
router.get('/:id/messages', protect, async (req, res) => {
  try {
    const groupId = req.params.id

    const group = await Group.findById(groupId).select('owner members messages')
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' })
    }

    // membership check
    const isMember = group.members.some(m => m.user.toString() === req.user._id.toString())
    const isOwner = group.owner && group.owner.toString() === req.user._id.toString()

    if (!isMember && !isOwner) {
      return res.status(403).json({ success: false, message: 'Not a member of this group' })
    }

    const decrypted = (group.messages || [])
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map(msg => ({
        user: msg.user,
        content: decryptMessage(msg.encryptedContent, msg.iv),
        createdAt: msg.createdAt
      }))

    res.json({
      success: true,
      messages: decrypted
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

module.exports = router
