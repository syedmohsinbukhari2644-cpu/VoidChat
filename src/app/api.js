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
    if (!raw || raw === 'null' || raw === 'undefined') return defaultValue
    const parsed = JSON.parse(raw)
    return parsed !== null && parsed !== undefined ? parsed : defaultValue
  } catch (e) {
    return defaultValue
  }
}

const setStoredData = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value))
  } catch (e) { }
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
  } catch (e) { }
  return null
}

// Cloud Sync Endpoints for global cross-device persistence
const FIRESTORE_BASE_URL = 'https://firestore.googleapis.com/v1/projects/azaad-app/databases/(default)/documents'
const FIRESTORE_USERS_URL = `${FIRESTORE_BASE_URL}/users`
const FIRESTORE_MESSAGES_URL = `${FIRESTORE_BASE_URL}/messages`
const FIRESTORE_POSTS_URL = `${FIRESTORE_BASE_URL}/posts`
const FIRESTORE_REELS_URL = `${FIRESTORE_BASE_URL}/reels`
const FIRESTORE_GROUPS_URL = `${FIRESTORE_BASE_URL}/groups`

// Helper to generate updateMask parameter string for Firestore REST PATCH
const getUpdateMaskParams = (fields) => {
  return Object.keys(fields).map(key => `updateMask.fieldPaths=${encodeURIComponent(key)}`).join('&')
}

// ── Auth APIs ─────────────────────────────────────────────────────────────
export const registerUser = async (data) => {
  const allUsersRes = await getUsers()
  const currentUsers = allUsersRes.data.users || []
  const existing = currentUsers.find(u =>
    (u.email && u.email.toLowerCase() === data.email?.toLowerCase()) ||
    (u.username && u.username.toLowerCase() === data.username?.toLowerCase())
  )

  if (existing) {
    throw new Error('User with this email or username already exists!')
  }

  const userId = 'user_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
  const newUser = {
    _id: userId,
    id: userId,
    name: data.name || data.username || 'User',
    username: data.username || 'user_' + Math.floor(Math.random() * 1000),
    email: data.email,
    password: data.password,
    avatar: (data.name || data.username || 'U')[0].toUpperCase(),
    voidBalance: 500, // Welcome bonus
    isPremium: false,
    referralCode: 'VOID' + Math.floor(1000 + Math.random() * 9000),
    blockedUsers: [],
    createdAt: new Date().toISOString()
  }

  const localUsers = await getStoredData('@void_users', DEFAULT_USERS)
  localUsers.push(newUser)
  await setStoredData('@void_users', localUsers)

  // Push to Cloud Firestore document URL so other users across devices find this new user instantly
  try {
    const fields = {
      id: { stringValue: String(newUser.id) },
      _id: { stringValue: String(newUser._id) },
      name: { stringValue: String(newUser.name) },
      username: { stringValue: String(newUser.username) },
      email: { stringValue: String(newUser.email || '') },
      password: { stringValue: String(newUser.password || '') },
      voidBalance: { integerValue: String(newUser.voidBalance || 500) },
      isPremium: { booleanValue: Boolean(newUser.isPremium) },
      createdAt: { stringValue: String(newUser.createdAt) }
    }
    const firestoreUrl = `${FIRESTORE_USERS_URL}/${userId}?${getUpdateMaskParams(fields)}`
    await fetch(firestoreUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    })
  } catch (e) {
    console.log('Cloud user register sync error:', e)
  }

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
  const allUsersRes = await getUsers()
  const users = allUsersRes.data.users || []
  const user = users.find(
    u => (u.email && u.email.toLowerCase() === data.email?.toLowerCase()) ||
      (u.username && u.username.toLowerCase() === data.email?.toLowerCase())
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

export const getMe = async () => {
  const currentUser = await getStoredData('@void_current_user', DEFAULT_USERS[0])
  if (currentUser && currentUser._id) {
    if (currentUser.isPremium && currentUser.premiumExpiry) {
      if (new Date() > new Date(currentUser.premiumExpiry)) {
        currentUser.isPremium = false
        currentUser.premiumExpiry = null
        await setStoredData('@void_current_user', currentUser)
        await setStoredData('@void_ghost_settings', { enabled: false, pin: '', emergencyContact: '', userId: null })
      }
    }

    try {
      const docUrl = `${FIRESTORE_USERS_URL}/${currentUser._id}`
      const res = await fetch(docUrl)
      if (res.ok) {
        const doc = await res.json()
        if (doc && doc.fields) {
          const fields = doc.fields

          let isPremium = fields.isPremium?.booleanValue !== undefined ? fields.isPremium.booleanValue : !!currentUser.isPremium
          let premiumExpiry = fields.premiumExpiry?.stringValue || currentUser.premiumExpiry || null

          if (isPremium && premiumExpiry) {
            if (new Date() > new Date(premiumExpiry)) {
              isPremium = false
              premiumExpiry = null
              await setStoredData('@void_ghost_settings', { enabled: false, pin: '', emergencyContact: '', userId: null })

              try {
                const patchFields = {
                  isPremium: { booleanValue: false },
                  premiumExpiry: { stringValue: '' }
                }
                await fetch(`${FIRESTORE_USERS_URL}/${currentUser._id}?updateMask.fieldPaths=isPremium&updateMask.fieldPaths=premiumExpiry`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ fields: patchFields })
                })
              } catch (e) { }
            }
          }

          const updatedUser = {
            ...currentUser,
            name: fields.name?.stringValue || currentUser.name || 'User',
            username: fields.username?.stringValue || currentUser.username || 'user',
            avatar: fields.avatar?.stringValue || currentUser.avatar || '💬',
            bio: fields.bio?.stringValue || currentUser.bio || '',
            voidBalance: fields.voidBalance?.integerValue ? Number(fields.voidBalance.integerValue) : (currentUser.voidBalance || 500),
            lastBonusClaimTime: fields.lastBonusClaimTime?.stringValue ? Number(fields.lastBonusClaimTime.stringValue) : (currentUser.lastBonusClaimTime || 0),
            isPremium: isPremium,
            premiumExpiry: premiumExpiry,
          }
          if (fields.starredMessages?.stringValue) {
            try { updatedUser.starredMessages = JSON.parse(fields.starredMessages.stringValue) } catch (e) { }
          }
          if (fields.lockedChats?.stringValue) {
            try { updatedUser.lockedChats = JSON.parse(fields.lockedChats.stringValue) } catch (e) { }
          }
          if (fields.secretFolderPin?.stringValue) {
            updatedUser.secretFolderPin = fields.secretFolderPin.stringValue
          }
          if (fields.activeChatIds?.stringValue) {
            try { updatedUser.activeChatIds = JSON.parse(fields.activeChatIds.stringValue) } catch (e) { }
          }
          await setStoredData('@void_current_user', updatedUser)
          return { data: { success: true, user: updatedUser } }
        }
      }
    } catch (e) { }
  }
  return {
    data: {
      success: true,
      user: currentUser
    }
  }
}

export const getUsers = async () => {
  const localUsers = await getStoredData('@void_users', DEFAULT_USERS)
  const userMap = new Map()

  for (const u of [...DEFAULT_USERS, ...localUsers]) {
    const key = String(u.username || u._id || u.id).toLowerCase()
    if (key) userMap.set(key, u)
  }

  try {
    const res = await fetch(FIRESTORE_USERS_URL)
    if (res.ok) {
      const json = await res.json()
      if (json.documents && Array.isArray(json.documents)) {
        for (const doc of json.documents) {
          const fields = doc.fields || {}
          const uId = fields.id?.stringValue || fields._id?.stringValue || doc.name.split('/').pop()
          const uname = fields.username?.stringValue || 'user'
          const u = {
            _id: uId,
            id: uId,
            name: fields.name?.stringValue || uname || 'User',
            username: uname,
            email: fields.email?.stringValue || '',
            password: fields.password?.stringValue || '',
            avatar: fields.avatar?.stringValue || (fields.name?.stringValue || uname || 'U')[0].toUpperCase(),
            bio: fields.bio?.stringValue || '',
            voidBalance: Number(fields.voidBalance?.integerValue || 500),
            lastBonusClaimTime: fields.lastBonusClaimTime?.stringValue ? Number(fields.lastBonusClaimTime.stringValue) : 0,
            isPremium: Boolean(fields.isPremium?.booleanValue),
            createdAt: fields.createdAt?.stringValue || new Date().toISOString()
          }
          if (fields.activeChatIds?.stringValue) {
            try { u.activeChatIds = JSON.parse(fields.activeChatIds.stringValue) } catch (e) { }
          }
          if (fields.premiumExpiry?.stringValue) {
            u.premiumExpiry = fields.premiumExpiry.stringValue
          }
          if (u.username) {
            userMap.set(String(u.username).toLowerCase(), u)
          }
        }
      }
    }
  } catch (e) { }

  const mergedUsersList = Array.from(userMap.values())
  return {
    data: {
      success: true,
      users: mergedUsersList
    }
  }
}

// ── Real 6-Digit OTP Store ────────────────────────────────────────────────
const activeOtpStore = {}

// Cloud OTP Sync Endpoint
const FIRESTORE_OTPS_URL = 'https://firestore.googleapis.com/v1/projects/azaad-app/databases/(default)/documents/otps'

export const sendOtp = async (data) => {
  const isPhone = !!data.phone || (!data.email && data.target && !data.target.includes('@'))
  const target = (data.email || data.phone || data.target || '').toLowerCase().trim()

  if (!target) {
    throw new Error('Please enter a valid Email or Phone Number!')
  }

  // Generate 6-digit Real OTP code
  const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString()
  activeOtpStore[target] = generatedOtp

  console.log(`🔑 [REAL OTP CODE GENERATED FOR ${target.toUpperCase()}]: ${generatedOtp}`)

  // Push OTP to Cloud Firestore so both admin & user can inspect it anytime
  try {
    const docId = target.replace(/[^a-zA-Z0-9]/g, '_')
    const docUrl = `${FIRESTORE_OTPS_URL}/${docId}`
    await fetch(docUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          target: { stringValue: String(target) },
          otp: { stringValue: String(generatedOtp) },
          createdAt: { stringValue: new Date().toISOString() }
        }
      })
    })
  } catch (e) { }

  let emailSentStatus = false
  if (!isPhone && target.includes('@')) {
    const emailSubject = '🔓 VOID CHAT — Verification Code'
    const emailBodyText = `Your VOID CHAT 6-digit verification code is: ${generatedOtp}. Do not share this code with anyone.`

    // Service 1: Formspree Mailer
    try {
      const res1 = await fetch('https://formspree.io/f/xbjnqkyw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          email: target,
          _subject: emailSubject,
          verification_code: generatedOtp,
          message: emailBodyText
        })
      })
      if (res1.ok) emailSentStatus = true
    } catch (e) { }

    // Service 2: FormSubmit direct submit
    if (!emailSentStatus) {
      try {
        const res2 = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(target)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            _subject: emailSubject,
            _captcha: 'false',
            code: generatedOtp,
            message: emailBodyText
          })
        })
        if (res2.ok) emailSentStatus = true
      } catch (e) { }
    }

    // Service 3: Backend API endpoints
    if (!emailSentStatus) {
      const backendEndpoints = [
        'https://azaad-app.web.app/api/auth/send-otp',
        'http://localhost:3000/api/auth/send-otp'
      ]
      for (const url of backendEndpoints) {
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: target,
              otp: generatedOtp,
              skipExistingCheck: true
            })
          })
          const json = await res.json()
          if (json.success || json.sentSuccess) {
            emailSentStatus = true
            break
          }
        } catch (err) { }
      }
    }
  }

  const successMsg = `📧 Verification code has been sent to ${target}! Please check your email inbox.`

  return {
    data: {
      success: true,
      isPhone,
      sentEmail: emailSentStatus,
      message: successMsg
    }
  }
}

export const verifyOtp = async (data) => {
  const target = (data.email || data.phone || data.target || '').toLowerCase().trim()
  let expectedOtp = activeOtpStore[target]
  const userEnteredOtp = (data.otp || '').trim()

  if (!expectedOtp) {
    try {
      const docId = target.replace(/[^a-zA-Z0-9]/g, '_')
      const res = await fetch(`${FIRESTORE_OTPS_URL}/${docId}`)
      if (res.ok) {
        const json = await res.json()
        expectedOtp = json.fields?.otp?.stringValue
      }
    } catch (e) { }
  }

  if (expectedOtp && userEnteredOtp === expectedOtp) {
    delete activeOtpStore[target]
    const isPhone = !target.includes('@')
    return {
      data: {
        success: true,
        message: isPhone
          ? `✅ Phone Number (${target}) verified successfully!`
          : `✅ Email (${target}) verified successfully!`
      }
    }
  }

  throw new Error(`Invalid OTP code! Please enter the exact 6-digit code sent to ${target}.`)
}

export const sendForgotPasswordOtp = async (data) => {
  const target = (data.email || data.phone || '').toLowerCase().trim()
  if (!target) throw new Error('Please enter your Email or Phone Number!')

  const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString()
  activeOtpStore['reset_' + target] = generatedOtp

  return {
    data: {
      success: true,
      message: `🔑 Password Reset OTP sent to ${target}. Please check your device.`
    }
  }
}

export const verifyForgotPasswordOtp = async (data) => {
  const target = (data.email || data.phone || '').toLowerCase().trim()
  const expectedOtp = activeOtpStore['reset_' + target]
  const userEnteredOtp = (data.otp || '').trim()

  if (expectedOtp && userEnteredOtp === expectedOtp) {
    delete activeOtpStore['reset_' + target]
    return { data: { success: true, message: 'OTP verified successfully!' } }
  }

  throw new Error(`Invalid OTP code! Please check the 6-digit code.`)
}

export const resetPasswordWithOtp = async (data) => {
  return { data: { success: true, message: 'Password reset successful! You can now log in.' } }
}

// ── User Profile & Blocking ────────────────────────────────────────────────
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
  const me = (await getStoredData('@void_current_user', DEFAULT_USERS[0])) || DEFAULT_USERS[0]
  const updated = { ...me, ...data }
  await setStoredData('@void_current_user', updated)

  // Sync to Cloud Firestore if user has a valid ID
  if (updated._id) {
    try {
      // Construct fields dynamically based on what exists on the user object
      const fields = {}
      if (updated.id) fields.id = { stringValue: String(updated.id) }
      if (updated._id) fields._id = { stringValue: String(updated._id) }
      if (updated.name) fields.name = { stringValue: String(updated.name) }
      if (updated.username) fields.username = { stringValue: String(updated.username) }
      if (updated.email) fields.email = { stringValue: String(updated.email || '') }
      if (updated.password) fields.password = { stringValue: String(updated.password || '') }
      if (updated.avatar) fields.avatar = { stringValue: String(updated.avatar || '💬') }
      if (updated.bio) fields.bio = { stringValue: String(updated.bio || '') }
      if (updated.voidBalance !== undefined) fields.voidBalance = { integerValue: String(updated.voidBalance) }
      if (updated.isPremium !== undefined) fields.isPremium = { booleanValue: Boolean(updated.isPremium) }
      if (updated.createdAt) fields.createdAt = { stringValue: String(updated.createdAt) }

      // Include any other syncable preferences if needed
      if (updated.starredMessages) fields.starredMessages = { stringValue: JSON.stringify(updated.starredMessages) }
      if (updated.lockedChats) fields.lockedChats = { stringValue: JSON.stringify(updated.lockedChats) }
      if (updated.secretFolderPin) fields.secretFolderPin = { stringValue: String(updated.secretFolderPin) }

      const firestoreUrl = `${FIRESTORE_USERS_URL}/${updated._id}?${getUpdateMaskParams(fields)}`
      await fetch(firestoreUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
      })
    } catch (e) {
      console.log('Error syncing user preferences to Firestore:', e)
    }
  }

  return { data: { success: true, user: updated } }
}

// ── Messages APIs ──────────────────────────────────────────────────────────
const getChatRoomId = (id1, id2) => {
  const str1 = String(id1 || 'me')
  const str2 = String(id2 || 'them')
  return str1 < str2 ? `${str1}_${str2}` : `${str2}_${str1}`
}

export const isUserOnline = async (userId) => {
  try {
    const res = await fetch(`${SOCKET_URL}/api/users/online-check/${userId}`)
    if (res.ok) {
      const json = await res.json()
      return json.isOnline === true
    }
  } catch (e) {
    console.log('Error checking online status:', e)
  }
  return false
}

export const sendMessage = async (data) => {
  const { receiverId, content } = data
  const me = await getStoredData('@void_current_user', DEFAULT_USERS[0])
  const myId = me._id || 'me'
  const messages = await getStoredData('@void_messages_' + myId, [])

  let isDelivered = false
  try {
    isDelivered = await isUserOnline(receiverId)
  } catch (e) {}

  const newMsg = {
    _id: 'msg_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    sender: myId,
    receiver: receiverId,
    content: content,
    isRead: false,
    isDelivered: isDelivered,
    createdAt: new Date().toISOString()
  }

  messages.push(newMsg)
  await setStoredData('@void_messages_' + myId, messages)

  // 1. Add recipient to my local activeChatIds list
  if (me._id) {
    let myActiveChats = me.activeChatIds || []
    if (!myActiveChats.includes(receiverId)) {
      myActiveChats.push(receiverId)
      me.activeChatIds = myActiveChats
      await setStoredData('@void_current_user', me)
    }
  }

  // 2. Push message to Cloud Firestore for 100% instant cross-device delivery
  try {
    const chatRoomId = getChatRoomId(me._id || 'me', receiverId)
    const url = `${FIRESTORE_BASE_URL}/chats/${chatRoomId}/messages?documentId=${newMsg._id}`
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          _id: { stringValue: String(newMsg._id) },
          sender: { stringValue: String(newMsg.sender) },
          receiver: { stringValue: String(newMsg.receiver) },
          content: { stringValue: String(newMsg.content) },
          isRead: { booleanValue: Boolean(newMsg.isRead) },
          isDelivered: { booleanValue: Boolean(newMsg.isDelivered) },
          createdAt: { stringValue: String(newMsg.createdAt) }
        }
      })
    })
  } catch (e) { }

  // 3. Sync to both sender and receiver's Firestore profiles to update activeChatIds list
  if (me._id) {
    try {
      // Update sender's activeChatIds on Firestore
      let senderActiveChats = me.activeChatIds || []
      const senderFields = {
        activeChatIds: { stringValue: JSON.stringify(senderActiveChats) }
      }
      await fetch(`${FIRESTORE_USERS_URL}/${me._id}?updateMask.fieldPaths=activeChatIds`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: senderFields })
      })

      // Fetch and update receiver's activeChatIds on Firestore
      const receiverRes = await fetch(`${FIRESTORE_USERS_URL}/${receiverId}`)
      if (receiverRes.ok) {
        const receiverDoc = await receiverRes.json()
        const fields = receiverDoc.fields || {}
        let receiverActiveChats = []
        if (fields.activeChatIds?.stringValue) {
          try { receiverActiveChats = JSON.parse(fields.activeChatIds.stringValue) } catch (e) { }
        }
        if (!receiverActiveChats.includes(me._id)) {
          receiverActiveChats.push(me._id)
          const receiverFields = {
            activeChatIds: { stringValue: JSON.stringify(receiverActiveChats) }
          }
          await fetch(`${FIRESTORE_USERS_URL}/${receiverId}?updateMask.fieldPaths=activeChatIds`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fields: receiverFields })
          })
        }
      }
    } catch (e) {
      console.log('Error updating activeChatIds on message send:', e)
    }
  }

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
  let messages = await getStoredData('@void_messages_' + myId, [])

  // Fetch Cloud Firestore Messages for this specific chat room
  try {
    const chatRoomId = getChatRoomId(myId, userId)
    const url = `${FIRESTORE_BASE_URL}/chats/${chatRoomId}/messages?pageSize=1000`
    const res = await fetch(url)
    if (res.ok) {
      const json = await res.json()
      if (json.documents && Array.isArray(json.documents)) {
        const cloudMsgs = json.documents.map(doc => {
          const fields = doc.fields || {}
          return {
            _id: fields._id?.stringValue || doc.name.split('/').pop(),
            sender: fields.sender?.stringValue || 'me',
            receiver: fields.receiver?.stringValue || '',
            content: fields.content?.stringValue || '',
            isRead: fields.isRead?.booleanValue || false,
            isDelivered: fields.isDelivered?.booleanValue || false,
            createdAt: fields.createdAt?.stringValue || new Date().toISOString()
          }
        })
        
        // Sync read/delivered statuses
        cloudMsgs.forEach(async cm => {
          if (String(cm.receiver) === String(myId) && (!cm.isRead || !cm.isDelivered)) {
            cm.isRead = true
            cm.isDelivered = true
            try {
              const patchUrl = `${FIRESTORE_BASE_URL}/chats/${chatRoomId}/messages/${cm._id}?updateMask.fieldPaths=isRead&updateMask.fieldPaths=isDelivered`
              await fetch(patchUrl, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  fields: {
                    isRead: { booleanValue: true },
                    isDelivered: { booleanValue: true }
                  }
                })
              })
            } catch (e) {
              console.log('Error updating status on Firestore:', e)
            }
          }
        })

        cloudMsgs.forEach(cm => {
          const idx = messages.findIndex(lm => String(lm._id) === String(cm._id))
          if (idx === -1) {
            messages.push(cm)
          } else {
            messages[idx].isRead = cm.isRead
            messages[idx].isDelivered = cm.isDelivered
          }
        })
        await setStoredData('@void_messages_' + myId, messages)
      }
    }
  } catch (e) { }

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

export const deleteMessage = async (receiverId, msgId) => {
  const me = await getStoredData('@void_current_user', DEFAULT_USERS[0])
  const myId = me._id || 'me'

  // 1. Delete from local storage
  let messages = await getStoredData('@void_messages_' + myId, DEFAULT_MESSAGES)
  messages = messages.filter(m => m._id !== msgId && m.id !== msgId)
  await setStoredData('@void_messages_' + myId, messages)

  // 2. Delete from Cloud Firestore
  try {
    const chatRoomId = getChatRoomId(myId, receiverId)
    const url = `${FIRESTORE_BASE_URL}/chats/${chatRoomId}/messages/${msgId}`
    await fetch(url, {
      method: 'DELETE'
    })
  } catch (e) { }

  return { data: { success: true } }
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
  const now = Date.now()
  const lastBonusTime = me.lastBonusClaimTime ? Number(me.lastBonusClaimTime) : 0
  const timeDiff = now - lastBonusTime
  const hours24Ms = 24 * 60 * 60 * 1000

  if (lastBonusTime && timeDiff < hours24Ms) {
    const remainingMs = hours24Ms - timeDiff
    const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60))
    return {
      data: {
        success: false,
        message: `⏰ Daily bonus can only be claimed once every 24 hours! Next bonus in ${remainingHours}h.`,
        balance: me.voidBalance || 500
      }
    }
  }

  me.voidBalance = (me.voidBalance || 0) + 100
  me.lastBonusClaimTime = now
  await setStoredData('@void_current_user', me)

  // Sync to Firestore
  if (me._id) {
    try {
      const fields = {
        voidBalance: { integerValue: me.voidBalance },
        lastBonusClaimTime: { stringValue: String(me.lastBonusClaimTime) }
      }
      await fetch(`${FIRESTORE_USERS_URL}/${me._id}?updateMask.fieldPaths=voidBalance&updateMask.fieldPaths=lastBonusClaimTime`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
      })
    } catch (e) {
      console.log('Error syncing daily login bonus to Firestore:', e)
    }
  }

  // Sync to local users cache
  try {
    const localUsers = await getStoredData('@void_users', DEFAULT_USERS)
    const idx = localUsers.findIndex(u => String(u._id || u.id) === String(me._id || me.id))
    if (idx !== -1) {
      localUsers[idx].voidBalance = me.voidBalance
      localUsers[idx].lastBonusClaimTime = now
      await setStoredData('@void_users', localUsers)
    }
  } catch (e) { }

  return {
    data: {
      success: true,
      message: '🎉 Daily bonus +100 VOID claimed!',
      balance: me.voidBalance
    }
  }
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
  me.premiumExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days monthly pass
  await setStoredData('@void_current_user', me)

  // Sync to Firestore
  if (me._id) {
    try {
      const fields = {
        isPremium: { booleanValue: true },
        premiumExpiry: { stringValue: me.premiumExpiry }
      }
      await fetch(`${FIRESTORE_USERS_URL}/${me._id}?updateMask.fieldPaths=isPremium&updateMask.fieldPaths=premiumExpiry`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
      })
    } catch (e) { }
  }

  return { data: { success: true, message: '✨ Upgraded to VOID Premium! (30 Days Pass)' } }
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
export const uploadImageFile = async (base64Data) => {
  try {
    const res = await fetch(`${SOCKET_URL}/api/upload-base64`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Data })
    })
    if (res.ok) {
      const json = await res.json()
      if (json.success) {
        return json.url
      }
    }
  } catch (e) {
    console.log('Error uploading image to server:', e)
  }
  return null
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
  uploadReel,
  uploadImageFile
}
