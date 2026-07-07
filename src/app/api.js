import axios from 'axios'

// Backend server config
const API = axios.create({
  baseURL: 'https://voidchat-production-5df5.up.railway.app/api',
  timeout: 10000,
})

// Socket.io URL (WebRTC signaling ke liye)
// NOTE: Vercel pe Socket.io nahi chalta — Railway/Render pe deploy karo production mein
export const SOCKET_URL = 'https://voidchat-production-5df5.up.railway.app'



// Token automatically add karo
export const setToken = (token) => {
  API.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

// Auth APIs
export const registerUser = (data) => API.post('/auth/register', data)
export const loginUser = (data) => API.post('/auth/login', data)

// OTP APIs (registration)
export const sendOtp = (data) => API.post('/auth/send-otp', data)
export const verifyOtp = (data) => API.post('/auth/verify-otp', data)

// Forgot password (OTP - currently email supported)
export const sendForgotPasswordOtp = (data) =>
  API.post('/auth/forgot-password/send-otp', data)

export const verifyForgotPasswordOtp = (data) =>
  API.post('/auth/forgot-password/verify-otp', data)

export const resetPasswordWithOtp = (data) =>
  API.post('/auth/forgot-password/reset', data)

// Posts APIs
export const getFeed = () => API.get('/posts')
export const createPost = (data) => API.post('/posts', data)
export const likePost = (id) => API.put(`/posts/${id}/like`)
export const commentPost = (id, data) => API.post(`/posts/${id}/comment`, data)

// VOID APIs
export const getBalance = () => API.get('/VOID/balance')
export const dailyLogin = () => API.post('/VOID/daily-login')
export const transferVOID = (data) => API.post('/VOID/transfer', data)

// Messages APIs
export const sendMessage = (data) => API.post('/messages/send', data)
export const getMessages = (userId) => API.get(`/messages/${userId}`)

// Group Messages APIs
export const sendGroupMessage = (groupId, data) =>
  API.post(`/groups/${groupId}/messages/send`, data)
export const getGroupMessages = (groupId) => API.get(`/groups/${groupId}/messages`)

// Refer APIs
export const getMyCode = () => API.get('/refer/mycode')
export const useReferCode = (data) => API.post('/refer/use', data)

// Reels APIs
export const getReels = () => API.get('/reels')
export const uploadReel = (data) => API.post('/reels', data)

// User Block APIs
export const blockUser = (userId) => API.put(`/users/block/${userId}`)
export const getMe = () => API.get('/users/me')

export default API

