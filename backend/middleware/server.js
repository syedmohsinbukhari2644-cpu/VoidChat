const express = require('express')
const dotenv = require('dotenv')
const connectDB = require('./config/database')
const authRoutes = require('./routes/auth')
// Load environment variables
dotenv.config()
// Connect to database
connectDB()
const app = express()
// Parse JSON requests
app.use(express.json())
// Routes
app.use('/api/auth', authRoutes)
// Home route
app.get('/', (req, res) => {
  res.json({
    app: 'VOID CHAT',
    version: '1.0.0',
    status: '🔓 Running!',
    message: 'Speak, Write, Live — Without Fear!'
  })
})
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(
  ╔═══════════════════════════════╗
  ║   🔓 VOID CHAT Server Running!   ║
  ║   Port: ${PORT}                  ║
  ║   Status: Ready! ✅           ║
  ╚═══════════════════════════════╝
  )
})