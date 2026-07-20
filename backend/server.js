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

// Security: Rate limiting set to high production threshold for WhatsApp-like zero-lag chat
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100000, // WhatsApp-style unlimited throughput for active live messaging
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

const http = require('http')
const socketIO = require('socket.io')

const server = http.createServer(app)
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

// Store online users: userId -> socket.id
const onlineUsers = new Map()

app.set('io', io)
app.set('onlineUsers', onlineUsers)

io.on('connection', (socket) => {
  console.log('⚡ User connected to socket:', socket.id)

  socket.on('user-online', (userId) => {
    if (userId) {
      onlineUsers.set(userId, socket.id)
      console.log(`👤 User ${userId} is online with socket ${socket.id}`)
    }
  })

  socket.on('call-user', ({ to, from, fromName, offer, callType }) => {
    const targetSocketId = onlineUsers.get(to)
    if (targetSocketId) {
      io.to(targetSocketId).emit('incoming-call', {
        from,
        fromName,
        offer,
        callType
      })
    } else {
      socket.emit('call-unavailable', { userId: to })
    }
  })

  socket.on('call-accepted', ({ to, answer }) => {
    const targetSocketId = onlineUsers.get(to)
    if (targetSocketId) {
      io.to(targetSocketId).emit('call-accepted', { answer })
    }
  })

  socket.on('call-rejected', ({ to }) => {
    const targetSocketId = onlineUsers.get(to)
    if (targetSocketId) {
      io.to(targetSocketId).emit('call-rejected')
    }
  })

  socket.on('call-ended', ({ to }) => {
    const targetSocketId = onlineUsers.get(to)
    if (targetSocketId) {
      io.to(targetSocketId).emit('call-ended')
    }
  })

  socket.on('ice-candidate', ({ to, candidate }) => {
    const targetSocketId = onlineUsers.get(to)
    if (targetSocketId) {
      io.to(targetSocketId).emit('ice-candidate', { candidate })
    }
  })

  socket.on('disconnect', () => {
    console.log('❌ Socket disconnected:', socket.id)
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId)
        console.log(`👤 User ${userId} went offline`)
        break
      }
    }
  })
})

// Only start the server locally if not in a Vercel serverless environment
if (!process.env.VERCEL) {
  server.listen(PORT, () => {
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
    ║  Status: Ready! ✅ (With Sockets)    ║
    ╚══════════════════════════════════════╝
    `)
  })
}

// Export for Vercel Serverless
module.exports = app
