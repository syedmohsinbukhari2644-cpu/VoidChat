const express = require('express')
const { createServer } = require('http')
const { Server } = require('socket.io')
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

// ── HTTP server + Socket.io ─────────────────────────────────────
const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling']
})

// Online users: { userId: socketId }
const onlineUsers = {}

io.on('connection', (socket) => {
  console.log('🔌 Socket connected:', socket.id)

  // ── User online register karo ──────────────────────────────
  socket.on('user-online', (userId) => {
    onlineUsers[userId] = socket.id
    console.log(`✅ ${userId} online (socket: ${socket.id})`)
  })

  // ── Call Initiate (Caller → Callee) ───────────────────────
  socket.on('call-user', ({ to, from, fromName, offer, callType }) => {
    const receiverSocket = onlineUsers[to]
    if (receiverSocket) {
      io.to(receiverSocket).emit('incoming-call', {
        from,
        fromName,
        offer,
        callType
      })
      console.log(`📞 Call: ${from} → ${to} (${callType})`)
    } else {
      // Receiver offline hai
      socket.emit('call-unavailable', { userId: to })
    }
  })

  // ── Call Accepted (Callee → Caller) ───────────────────────
  socket.on('call-accepted', ({ to, answer }) => {
    const callerSocket = onlineUsers[to]
    if (callerSocket) {
      io.to(callerSocket).emit('call-accepted', { answer })
    }
  })

  // ── ICE Candidates exchange ────────────────────────────────
  socket.on('ice-candidate', ({ to, candidate }) => {
    const targetSocket = onlineUsers[to]
    if (targetSocket) {
      io.to(targetSocket).emit('ice-candidate', { candidate })
    }
  })

  // ── Call Rejected ──────────────────────────────────────────
  socket.on('call-rejected', ({ to }) => {
    const callerSocket = onlineUsers[to]
    if (callerSocket) {
      io.to(callerSocket).emit('call-rejected')
    }
  })

  // ── Call Ended ────────────────────────────────────────────
  socket.on('call-ended', ({ to }) => {
    const targetSocket = onlineUsers[to]
    if (targetSocket) {
      io.to(targetSocket).emit('call-ended')
    }
  })

  // ── Disconnect ────────────────────────────────────────────
  socket.on('disconnect', () => {
    Object.keys(onlineUsers).forEach(userId => {
      if (onlineUsers[userId] === socket.id) {
        delete onlineUsers[userId]
        console.log(`❌ ${userId} offline`)
      }
    })
  })
})

// ── Security: Enable CORS ──────────────────────────────────────
app.use(cors())

// ── Security: Rate limiting ────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/api/', apiLimiter)
app.use(express.json())

// ── REST Routes ───────────────────────────────────────────────
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
    features: {
      webrtc: '✅ Socket.io signaling active',
      encryption: '✅ AES-256-GCM E2E'
    },
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

// ── Start Server ──────────────────────────────────────────────
const PORT = process.env.PORT || 3000

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  httpServer.listen(PORT, () => {
    console.log(`
    ╔══════════════════════════════════════╗
    ║      🔓 VOID CHAT Server Running!    ║
    ║                                      ║
    ║  HTTP REST:     /api/*               ║
    ║  Socket.io:     ws://localhost:${PORT}  ║
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
    ║  WebRTC:        Socket.io ✅          ║
    ║  Status:        Ready! ✅            ║
    ╚══════════════════════════════════════╝
    `)
  })
}

// ── Export for Vercel Serverless ──────────────────────────────
// NOTE: Vercel pe Socket.io work nahi karta (serverless limitation)
// Production ke liye Railway.app ya Render.com use karo
module.exports = app
