const express = require('express')
const dotenv = require('dotenv')
const connectDB = require('./config/database')
const authRoutes = require('./routes/auth')
const postRoutes = require('./routes/posts')
const messageRoutes = require('./routes/messages')
const VOIDRoutes = require('./routes/void')
const referRoutes = require('./routes/refer')
const reelRoutes = require('./routes/reels')
const groupRoutes = require('./routes/Groups')
const userRoutes = require('./routes/Users')
const { router: notifRoutes } = require('./routes/notifications')

dotenv.config()
connectDB()

const cors = require('cors')
const rateLimit = require('express-rate-limit')

const app = express()

// Security: Enable CORS properly
app.use(cors())

// Security: Rate limiting to prevent DDoS and Brute Force attacks
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
})

// Apply rate limiting to all /api/ routes
app.use('/api/', apiLimiter)

app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/VOID', VOIDRoutes)
app.use('/api/refer', referRoutes)
app.use('/api/reels', reelRoutes)
app.use('/api/groups', groupRoutes)
app.use('/api/users', userRoutes)
app.use('/api/notifications', notifRoutes)

app.get('/', (req, res) => {
  res.json({
    app: 'VOID CHAT',
    version: '1.0.0',
    status: '🔓 Running!',
    message: 'Speak, Write, Live — Without Fear!',
    apis: [
      '/api/auth',
      '/api/posts',
      '/api/messages',
      '/api/VOID',
      '/api/refer',
      '/api/reels',
      '/api/groups',
      '/api/users',
      '/api/notifications'
    ]
  })
})

const PORT = process.env.PORT || 3000

// Only start the server locally if not in a Vercel serverless environment
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`
    ╔══════════════════════════════════════╗
    ║      🔓 VOID CHAT Server Running!    ║
    ║                                      ║
    ║  Auth:          /api/auth            ║
    ║  Posts:         /api/posts           ║
    ║  Messages:      /api/messages        ║
    ║  VOID Wallet:   /api/VOID            ║
    ║  Refer:         /api/refer           ║
    ║  Reels:         /api/reels           ║
    ║  Groups:        /api/groups          ║
    ║  Users:         /api/users           ║
    ║  Notifications: /api/notifications   ║
    ║                                      ║
    ║  Status: Ready! ✅                   ║
    ╚══════════════════════════════════════╝
    `)
  })
}

// Export for Vercel Serverless
module.exports = app


