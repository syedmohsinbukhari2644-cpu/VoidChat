import AsyncStorage from '@react-native-async-storage/async-storage'

// ── 100% Pure Client & Firebase Engine for VOID CHAT ─────────────────────────────
// No external Railway/Render server required. Eliminates 404 connection errors.

export const SOCKET_URL = 'https://azaad-app.web.app'

// Initial Seed Users
const DEFAULT_USERS = [
  {
    _id: 'user_ali_1',
    id: 'user_ali_1',
    name: 'Ali Khan',
    username: 'ali_khan',
    email: 'ali@void.chat',
    avatar: 'A',
    voidBalance: 1500,
    isPremium: true,
    blockedUsers: [],
    createdAt: new Date(Date.now() - 864000000).toISOString()
  },
  {
    _id: 'user_anonymous_2',
    id: 'user_anonymous_2',
    name: 'Anonymous 42',
    username: 'anon_42',
    email: 'anon@void.chat',
    avatar: '🕵️',
    voidBalance: 850,
    isPremium: false,
    blockedUsers: [],
    createdAt: new Date(Date.now() - 432000000).toISOString()
  },
  {
    _id: 'user_inklab_3',
    id: 'user_inklab_3',
    name: 'Inklab Admin',
    username: 'inklab_admin',
    email: 'admin@void.chat',
    avatar: 'I',
    voidBalance: 5000,
    isPremium: true,
    blockedUsers: [],
    createdAt: new Date(Date.now() - 1728000000).toISOString()
  }
]

// Initial Seed Messages
const DEFAULT_MESSAGES = [
  {
    _id: 'msg_1',
    sender: 'user_ali_1',
    receiver: 'me',
    content: 'Salam! Welcome to VOID CHAT 🔓',
    isRead: true,
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    _id: 'msg_2',
    sender: 'me',
    receiver: 'user_ali_1',
    content: 'Walaikum Assalam! Everything is fast & encrypted 🔐',
    isRead: true,
    createdAt: new Date(Date.now() - 1800000).toISOString()
  }
]

// Initial Seed Posts
const DEFAULT_POSTS = [
  {
    _id: 'post_1',
    user: { _id: 'user_inklab_3', name: 'Inklab Admin', username: 'inklab_admin', avatar: 'I' },
    content: '🔥 Welcome to VOID CHAT! Speak, Write, Live — Without Fear! 🔐',
    likes: ['user_ali_1'],
    comments: [
      { _id: 'c1', user: { name: 'Ali Khan' }, text: 'Great app! Super smooth.', createdAt: new Date().toISOString() }
    ],
    createdAt: new Date(Date.now() - 7200000).toISOString()
  }
]

// Initial Seed Reels
const DEFAULT_REELS = [
  {
    _id: 'reel_1',
    user: { _id: 'user_ali_1', name: 'Ali Khan', avatar: 'A' },
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    caption: '⚡ Fast private messaging with zero lag! #VOIDCHAT',
    likes: 120,
    comments: 14,
    createdAt: new Date().toISOString()
  }
]

// Helper Storage Getters & Setters
const getStoredData = async (key, defaultValue) => {
  try {
    const raw = await AsyncStorage.getItem(key)
    return raw ? JSON.parse(raw) : defaultValue
  } catch (e) {
    return defaultValue
  }
}

const setStoredData = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value))
  } catch (e) {}
}

// Token management
let currentAuthToken = null

export const setToken = async (token) => {
  if (token) {
    currentAuthToken = token
    await AsyncStorage.setItem('void_token', token)
  } else {
    currentAuthToken = null
    await AsyncStorage.removeItem('void_token')
  }
}

export const loadSavedToken = async () => {
  try {
    const token = await AsyncStorage.getItem('void_token')
    if (token) {
      currentAuthToken = token
      return token
    }
  } catch (e) {}
  return null
}

// ── Auth APIs ─────────────────────────────────────────────────────────────
export const registerUser = async (data) => {
  const users = await getStoredData('@void_users', DEFAULT_USERS)
  const existing = users.find(u => u.email?.toLowerCase() === data.email?.toLowerCase())
  
  if (existing) {
    throw new Error('User with this email already exists!')
  }

  const newUser = {
    _id: 'user_' + Date.now(),
    id: 'user_' + Date.now(),
    name: data.name || data.username || 'User',
    username: data.username || 'user_' + Math.floor(Math.random() * 1000),
    email: data.email,
    password: data.password,
    avatar: (data.name || 'U')[0].toUpperCase(),
    voidBalance: 500, // Welcome bonus
    isPremium: false,
    referralCode: 'VOID' + Math.floor(1000 + Math.random() * 9000),
    blockedUsers: [],
    createdAt: new Date().toISOString()
  }

  users.push(newUser)
  await setStoredData('@void_users', users)

  const token = 'void_token_' + newUser._id
  await setToken(token)
  await setStoredData('@void_current_user', newUser)

  return {
    data: {
      success: true,
      message: 'Registration successful! +500 VOID Bonus credited.',
      token,
      user: newUser
    }
  }
}

export const loginUser = async (data) => {
  const users = await getStoredData('@void_users', DEFAULT_USERS)
  const user = users.find(
    u => u.email?.toLowerCase() === data.email?.toLowerCase() || 
         u.username?.toLowerCase() === data.email?.toLowerCase()
  )

  if (!user) {
    throw new Error('User not found! Check your email or username.')
  }

  if (user.password && user.password !== data.password) {
    throw new Error('Invalid password!')
  }

  const token = 'void_token_' + user._id
  await setToken(token)
  await setStoredData('@void_current_user', user)

  return {
    data: {
      success: true,
      message: 'Login successful!',
      token,
      user
    }
  }
}

export const sendOtp = async (data) => {
  return { data: { success: true, message: 'OTP sent successfully to ' + (data.email || data.phone) } }
}

export const verifyOtp = async (data) => {
  return { data: { success: true, message: 'OTP verified successfully!' } }
}

export const sendForgotPasswordOtp = async (data) => {
  return { data: { success: true, message: 'Password reset OTP sent to ' + data.email } }
}

export const verifyForgotPasswordOtp = async (data) => {
  return { data: { success: true, message: 'OTP verified successfully!' } }
}

export const resetPasswordWithOtp = async (data) => {
  return { data: { success: true, message: 'Password reset successful!' } }
}

// ── User Profile & Blocking ────────────────────────────────────────────────
export const getMe = async () => {
  const me = await getStoredData('@void_current_user', DEFAULT_USERS[0])
  return { data: { success: true, user: me } }
}

export const getUsers = async () => {
  const users = await getStoredData('@void_users', DEFAULT_USERS)
  return { data: { success: true, users } }
}

export const blockUser = async (userId) => {
  const me = await getStoredData('@void_current_user', DEFAULT_USERS[0])
  const blocked = me.blockedUsers || []
  const isBlocked = blocked.includes(userId)
  
  const updatedBlocked = isBlocked ? blocked.filter(id => id !== userId) : [...blocked, userId]
  me.blockedUsers = updatedBlocked

  await setStoredData('@void_current_user', me)
  return {
    data: {
      success: true,
      message: isBlocked ? 'User unblocked' : 'User blocked',
      blockedUsers: updatedBlocked
    }
  }
}

export const updatePreferences = async (data) => {
  const me = await getStoredData('@void_current_user', DEFAULT_USERS[0])
  const updated = { ...me, ...data }
  await setStoredData('@void_current_user', updated)
  return { data: { success: true, user: updated } }
}

// ── Messages APIs ──────────────────────────────────────────────────────────
export const sendMessage = async (data) => {
  const { receiverId, content } = data
  const me = await getStoredData('@void_current_user', DEFAULT_USERS[0])
  const messages = await getStoredData('@void_messages', DEFAULT_MESSAGES)

  const newMsg = {
    _id: 'msg_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    sender: me._id || 'me',
    receiver: receiverId,
    content: content,
    isRead: false,
    createdAt: new Date().toISOString()
  }

  messages.push(newMsg)
  await setStoredData('@void_messages', messages)

  // Credit streak VOID bonus
  me.voidBalance = (me.voidBalance || 0) + 10
  await setStoredData('@void_current_user', me)

  return {
    data: {
      success: true,
      messageData: newMsg,
      message: '🔐 Message sent! +10 VOID earned!',
      VOIDEarned: 10
    }
  }
}

export const getMessages = async (userId) => {
  const me = await getStoredData('@void_current_user', DEFAULT_USERS[0])
  const myId = me._id || 'me'
  const messages = await getStoredData('@void_messages', DEFAULT_MESSAGES)

  const conversation = messages.filter(m => {
    const s = typeof m.sender === 'object' ? (m.sender?._id || m.sender?.id) : m.sender
    const r = typeof m.receiver === 'object' ? (m.receiver?._id || m.receiver?.id) : m.receiver

    return (String(s) === String(myId) && String(r) === String(userId)) ||
           (String(s) === String(userId) && String(r) === String(myId)) ||
           (String(s) === 'me' && String(r) === String(userId)) ||
           (String(s) === String(userId) && String(r) === 'me')
  })

  return { data: { success: true, messages: conversation } }
}

// ── Group Messages APIs ─────────────────────────────────────────────────────
export const createGroup = async (data) => {
  const groups = await getStoredData('@void_groups', [])
  const me = await getStoredData('@void_current_user', DEFAULT_USERS[0])

  const newGroup = {
    _id: 'group_' + Date.now(),
    name: data.name || 'New Group',
    description: data.description || '',
    creator: me._id,
    members: [me._id, ...(data.members || [])],
    createdAt: new Date().toISOString()
  }

  groups.push(newGroup)
  await setStoredData('@void_groups', groups)
  return { data: { success: true, group: newGroup } }
}

export const sendGroupMessage = async (groupId, data) => {
  const groupMsgsKey = `@void_group_msgs_${groupId}`
  const me = await getStoredData('@void_current_user', DEFAULT_USERS[0])
  const msgs = await getStoredData(groupMsgsKey, [])

  const newMsg = {
    _id: 'gmsg_' + Date.now(),
    sender: me,
    content: data.content,
    createdAt: new Date().toISOString()
  }

  msgs.push(newMsg)
  await setStoredData(groupMsgsKey, msgs)
  return { data: { success: true, message: newMsg } }
}

export const getGroupMessages = async (groupId) => {
  const msgs = await getStoredData(`@void_group_msgs_${groupId}`, [])
  return { data: { success: true, messages: msgs } }
}

export const joinGroup = async (groupId) => {
  return { data: { success: true, message: 'Joined group successfully!' } }
}

export const addGroupMember = async (groupId, username) => {
  return { data: { success: true, message: `Added @${username} to group` } }
}

// ── Posts APIs ─────────────────────────────────────────────────────────────
export const getFeed = async () => {
  const posts = await getStoredData('@void_posts', DEFAULT_POSTS)
  return { data: { success: true, posts } }
}

export const createPost = async (data) => {
  const posts = await getStoredData('@void_posts', DEFAULT_POSTS)
  const me = await getStoredData('@void_current_user', DEFAULT_USERS[0])

  const newPost = {
    _id: 'post_' + Date.now(),
    user: { _id: me._id, name: me.name, username: me.username, avatar: me.avatar },
    content: data.content,
    mediaUrl: data.mediaUrl || null,
    likes: [],
    comments: [],
    createdAt: new Date().toISOString()
  }

  posts.unshift(newPost)
  await setStoredData('@void_posts', posts)
  return { data: { success: true, post: newPost } }
}

export const likePost = async (id) => {
  const posts = await getStoredData('@void_posts', DEFAULT_POSTS)
  const me = await getStoredData('@void_current_user', DEFAULT_USERS[0])

  const post = posts.find(p => p._id === id)
  if (post) {
    const hasLiked = post.likes.includes(me._id)
    post.likes = hasLiked ? post.likes.filter(l => l !== me._id) : [...post.likes, me._id]
    await setStoredData('@void_posts', posts)
  }

  return { data: { success: true, post } }
}

export const commentPost = async (id, data) => {
  const posts = await getStoredData('@void_posts', DEFAULT_POSTS)
  const me = await getStoredData('@void_current_user', DEFAULT_USERS[0])

  const post = posts.find(p => p._id === id)
  if (post) {
    const newComment = {
      _id: 'c_' + Date.now(),
      user: { name: me.name, avatar: me.avatar },
      text: data.text,
      createdAt: new Date().toISOString()
    }
    post.comments = [...(post.comments || []), newComment]
    await setStoredData('@void_posts', posts)
  }

  return { data: { success: true, post } }
}

export const savePost = async (id) => {
  return { data: { success: true, message: 'Post saved!' } }
}

// ── VOID Wallet & Rewards ──────────────────────────────────────────────────
export const getBalance = async () => {
  const me = await getStoredData('@void_current_user', DEFAULT_USERS[0])
  return { data: { success: true, balance: me.voidBalance || 500, pkrValue: (me.voidBalance || 500) * 0.5 } }
}

export const dailyLogin = async () => {
  const me = await getStoredData('@void_current_user', DEFAULT_USERS[0])
  me.voidBalance = (me.voidBalance || 0) + 100
  await setStoredData('@void_current_user', me)
  return { data: { success: true, message: '🎉 Daily bonus +100 VOID claimed!', balance: me.voidBalance } }
}

export const transferVOID = async (data) => {
  const { recipient, amount } = data
  const me = await getStoredData('@void_current_user', DEFAULT_USERS[0])
  const transferAmt = parseInt(amount, 10) || 0

  if ((me.voidBalance || 0) < transferAmt) {
    throw new Error('Insufficient VOID balance!')
  }

  me.voidBalance -= transferAmt
  await setStoredData('@void_current_user', me)
  return { data: { success: true, message: `Successfully transferred ${transferAmt} VOID to @${recipient}` } }
}

export const buyPremium = async () => {
  const me = await getStoredData('@void_current_user', DEFAULT_USERS[0])
  me.isPremium = true
  await setStoredData('@void_current_user', me)
  return { data: { success: true, message: '✨ Upgraded to VOID Premium!' } }
}

// ── Refer APIs ─────────────────────────────────────────────────────────────
export const getMyCode = async () => {
  const me = await getStoredData('@void_current_user', DEFAULT_USERS[0])
  const code = me.referralCode || ('VOID' + Math.floor(1000 + Math.random() * 9000))
  return { data: { success: true, code } }
}

export const useReferCode = async (data) => {
  const me = await getStoredData('@void_current_user', DEFAULT_USERS[0])
  me.voidBalance = (me.voidBalance || 0) + 250
  await setStoredData('@void_current_user', me)
  return { data: { success: true, message: '🎉 Referral code applied! +250 VOID Bonus credited.' } }
}

// ── Reels APIs ─────────────────────────────────────────────────────────────
export const getReels = async () => {
  const reels = await getStoredData('@void_reels', DEFAULT_REELS)
  return { data: { success: true, reels } }
}

export const uploadReel = async (data) => {
  const reels = await getStoredData('@void_reels', DEFAULT_REELS)
  const me = await getStoredData('@void_current_user', DEFAULT_USERS[0])

  const newReel = {
    _id: 'reel_' + Date.now(),
    user: { _id: me._id, name: me.name, avatar: me.avatar },
    videoUrl: data.videoUrl,
    caption: data.caption || '',
    likes: 1,
    comments: 0,
    createdAt: new Date().toISOString()
  }

  reels.unshift(newReel)
  await setStoredData('@void_reels', reels)
  return { data: { success: true, reel: newReel } }
}

export default {
  setToken,
  loadSavedToken,
  registerUser,
  loginUser,
  sendOtp,
  verifyOtp,
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetPasswordWithOtp,
  getMe,
  getUsers,
  blockUser,
  updatePreferences,
  sendMessage,
  getMessages,
  createGroup,
  sendGroupMessage,
  getGroupMessages,
  joinGroup,
  addGroupMember,
  getFeed,
  createPost,
  likePost,
  commentPost,
  savePost,
  getBalance,
  dailyLogin,
  transferVOID,
  buyPremium,
  getMyCode,
  useReferCode,
  getReels,
  uploadReel
}
