import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

// Detect dev vs prod environment
const isDev = __DEV__

// Dynamic backend URL determination
const getBackendUrl = () => {
  if (isDev) {
    if (Platform.OS === 'web') {
      return 'http://localhost:3000'
    }
    try {
      const Constants = require('expo-constants').default
      const manifest = Constants.expoConfig || Constants.manifest
      const hostUri = manifest?.debuggerHost?.split(':')[0]
      if (hostUri) {
        return `http://${hostUri}:3000`
      }
    } catch (e) {}
    return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000'
  }
  return 'https://voidchat-production-5df5.up.railway.app'
}

export const SOCKET_URL = getBackendUrl()
const BASE_URL = `${SOCKET_URL}/api`

// Backend server config
const API = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
})

// Token automatically add karo aur save karo
export const setToken = async (token) => {
  if (token) {
    API.defaults.headers.common['Authorization'] = `Bearer ${token}`
    await AsyncStorage.setItem('void_token', token)
  } else {
    delete API.defaults.headers.common['Authorization']
    await AsyncStorage.removeItem('void_token')
  }
}

// Token load karo
export const loadSavedToken = async () => {
  try {
    const token = await AsyncStorage.getItem('void_token')
    if (token) {
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`
      return token
    }
  } catch (e) {}
  return null
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
export const savePost = (id) => API.put(`/posts/${id}/save`)

// VOID APIs
export const getBalance = () => API.get('/VOID/balance')
export const dailyLogin = () => API.post('/VOID/daily-login')
export const transferVOID = (data) => API.post('/VOID/transfer', data)
export const buyPremium = () => API.post('/VOID/buy-premium')

// Messages APIs
export const sendMessage = (data) => API.post('/messages/send', data)
export const getMessages = (userId) => API.get(`/messages/${userId}`)

// Group Messages APIs
export const sendGroupMessage = (groupId, data) =>
  API.post(`/groups/${groupId}/messages/send`, data)
export const getGroupMessages = (groupId) => API.get(`/groups/${groupId}/messages`)
export const createGroup = (data) => API.post('/groups/create', data)
export const joinGroup = (id) => API.post(`/groups/${id}/join`)
export const addGroupMember = (id, data) => API.post(`/groups/${id}/add-member`, data)

// Refer APIs
export const getMyCode = () => API.get('/refer/mycode')
export const useReferCode = (data) => API.post('/refer/use', data)

// Reels APIs
export const getReels = () => API.get('/reels')
export const uploadReel = (data) => API.post('/reels', data)

// User Block APIs
export const blockUser = (userId) => API.put(`/users/block/${userId}`)
export const getMe = () => API.get('/users/me')
export const getUsers = () => API.get('/users/all')
export const updatePreferences = (data) => API.put('/users/preferences', data)

export default API

