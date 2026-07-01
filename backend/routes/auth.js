const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const User = require('../models/User')
const OTP = require('../models/OTP')
const { sendOTP } = require('../config/email')

// OTP generate karo
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Helper: email normalize (lowercase)
const normalizeEmail = (email) => String(email || '').trim().toLowerCase()

// Helper: OTP validate & attempts increment
const validateOtp = async ({ email, otp }) => {
  const otpRecord = await OTP.findOne({ email })
  if (!otpRecord) {
    return { ok: false, status: 400, message: '❌ Pehle OTP mangwao!' }
  }

  // Expire check
  if (new Date() > otpRecord.expiresAt) {
    await OTP.deleteMany({ email })
    return { ok: false, status: 400, message: '❌ OTP expire ho gaya! Dobara mangwao.' }
  }

  // Attempts check — 5 se zyada galat = block
  if (otpRecord.attempts >= 5) {
    await OTP.deleteMany({ email })
    return { ok: false, status: 400, message: '❌ Zyada galat attempts! Dobara OTP mangwao.' }
  }

  // OTP match check
  if (otpRecord.otp !== otp) {
    await OTP.findByIdAndUpdate(otpRecord._id, { $inc: { attempts: 1 } })
    return {
      ok: false,
      status: 400,
      message: `❌ Galat OTP! ${4 - otpRecord.attempts} attempts baaki.`
    }
  }

  await OTP.findByIdAndUpdate(otpRecord._id, { verified: true })
  return { ok: true }
}

// Step 1 — Email bhejo OTP ke saath (Registration)
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body

    const normalizedEmail = normalizeEmail(email)

    if (!normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email dalo!'
      })
    }

    // Check karo email pehle se registered toh nahi
    const existingUser = await User.findOne({ email: normalizedEmail })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '❌ Email pehle se registered hai!'
      })
    }

    // Purana OTP delete karo
    await OTP.deleteMany({ email })

    // Naya OTP banao (Fixed for testing)
    const otp = '123456'

    // Database mein save karo
    await OTP.create({ email, otp })

    // Email bhejo - Temporarily disabled
    // await sendOTP(email, otp)

    res.json({
      success: true,
      message: `✅ OTP (123456) bheja gaya! Testing mode on.`
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Email send nahi hui: ' + error.message
    })
  }
})

// Step 2 — OTP verify karo
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body

    const otpRecord = await OTP.findOne({ email })

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: '❌ Pehle OTP mangwao!'
      })
    }

    // Expire check
    if (new Date() > otpRecord.expiresAt) {
      await OTP.deleteMany({ email })
      return res.status(400).json({
        success: false,
        message: '❌ OTP expire ho gaya! Dobara mangwao.'
      })
    }

    // Attempts check — 5 se zyada galat = block
    if (otpRecord.attempts >= 5) {
      await OTP.deleteMany({ email })
      return res.status(400).json({
        success: false,
        message: '❌ Zyada galat attempts! Dobara OTP mangwao.'
      })
    }

    // OTP match check
    if (otpRecord.otp !== otp) {
      await OTP.findByIdAndUpdate(otpRecord._id, {
        $inc: { attempts: 1 }
      })
      return res.status(400).json({
        success: false,
        message: `❌ Galat OTP! ${4 - otpRecord.attempts} attempts baaki.`
      })
    }

    // OTP sahi hai — verified mark karo
    await OTP.findByIdAndUpdate(otpRecord._id, { verified: true })

    res.json({
      success: true,
      message: '✅ Email verify ho gayi!'
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// Step 3 — Register (OTP verify ke baad)
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body

    // OTP verified check
    const otpRecord = await OTP.findOne({ email, verified: true })
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: '❌ Pehle email verify karo!'
      })
    }

    // Username check
    const existingUsername = await User.findOne({ username })
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: '❌ Username already le liya gaya!'
      })
    }

    // User banao
    const user = await User.create({
      username,
      email,
      password,
      isEmailVerified: true
    })

    // OTP delete karo
    await OTP.deleteMany({ email })

    // Token banao
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    )

    res.status(201).json({
      success: true,
      message: `🔓 VOID CHAT mein khush aamdeed ${username}! +200 VOID mile!`,
      token,
      VOIDBalance: user.VOIDBalance
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '❌ Email ya password galat!'
      })
    }

    // Email verified check
    if (!user.isEmailVerified) {
      return res.status(401).json({
        success: false,
        message: '❌ Email verify karo pehle!'
      })
    }

    const isMatch = await user.matchPassword(password)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: '❌ Email ya password galat!'
      })
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    )

    res.json({
      success: true,
      message: `🔓 Welcome back ${user.username}!`,
      token,
      VOIDBalance: user.VOIDBalance,
      streakDays: user.streakDays
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// ============================
// Forgot Password (Email OTP)
// ============================

// Step 1 — OTP send for password reset
router.post('/forgot-password/send-otp', async (req, res) => {
  try {
    const { email } = req.body
    const normalizedEmail = normalizeEmail(email)

    if (!normalizedEmail) {
      return res.status(400).json({ success: false, message: 'Email dalo!' })
    }

    // Only allow if user exists (security)
    const existingUser = await User.findOne({ email: normalizedEmail })
    if (!existingUser) {
      return res.status(400).json({ success: false, message: '❌ Email register nahi hai!' })
    }

    // Purana OTP delete karo
    await OTP.deleteMany({ email: normalizedEmail })

    const otp = '123456'
    await OTP.create({ email: normalizedEmail, otp })

    // await sendOTP(normalizedEmail, otp)

    res.json({
      success: true,
      message: `✅ Password reset OTP (123456) bheja gaya! Testing mode on.`
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'OTP send nahi hui: ' + error.message })
  }
})

// Step 2 — OTP verify for password reset
router.post('/forgot-password/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body
    const normalizedEmail = normalizeEmail(email)

    if (!normalizedEmail || !otp) {
      return res.status(400).json({ success: false, message: 'Email aur OTP dalo!' })
    }

    const result = await validateOtp({ email: normalizedEmail, otp })
    if (!result.ok) {
      return res.status(result.status).json({ success: false, message: result.message })
    }

    res.json({ success: true, message: '✅ OTP verified! Ab password reset karo.' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Step 3 — Reset password
router.post('/forgot-password/reset', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body
    const normalizedEmail = normalizeEmail(email)

    if (!normalizedEmail || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, OTP aur newPassword dalo!' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password minimum 6 characters ka ho.' })
    }

    // OTP verify (will mark verified: true)
    const result = await validateOtp({ email: normalizedEmail, otp })
    if (!result.ok) {
      return res.status(result.status).json({ success: false, message: result.message })
    }

    const user = await User.findOne({ email: normalizedEmail })
    if (!user) {
      return res.status(400).json({ success: false, message: '❌ Email register nahi hai!' })
    }

    // Update password
    user.password = newPassword
    await user.save()

    // OTP delete (reset complete)
    await OTP.deleteMany({ email: normalizedEmail })

    res.json({ success: true, message: '✅ Password reset ho gaya!' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

module.exports = router
