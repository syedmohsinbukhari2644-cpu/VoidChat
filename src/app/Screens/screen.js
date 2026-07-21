import { useState, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, Alert, Modal, StatusBar, Image
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
const RTCView = Platform.OS === 'web' ? View : (require('react-native-webrtc').RTCView || View)
import { encryptMessage, decryptMessage, isEncrypted } from '../../utils/encryption'
import rawWebrtcService from '../../utils/webrtcService'
import * as ImagePicker from 'expo-image-picker'
import Icon from '../../components/Icon'
import ChatDoodleBackground from '../../components/ChatDoodleBackground'
// expo-av removed — caused LazyKType crash on SDK 56
import * as Location from 'expo-location'
// react-native-maps removed - incompatible with RN 0.85
const MapView = () => null;
const Marker = () => null;
import * as DocumentPicker from 'expo-document-picker'
import * as Contacts from 'expo-contacts'

const webrtcService = Platform.OS === 'web' ? new Proxy({}, {
  get: (target, prop) => {
    return () => Promise.resolve({});
  },
  set: (target, prop, value) => {
    return true;
  }
}) : rawWebrtcService;

const mockMessages = [
  {
    id: '1',
    from: 'them',
    type: 'text',
    text: 'Salam! VOID CHAT pe aakar acha laga 🔓',
    time: '10:30',
    streak: false,
    timestamp: Date.now() - 300000
  },
  {
    id: '2',
    from: 'me',
    type: 'text',
    text: 'Haan yaar! Yahan sab private hai 🔐',
    time: '10:31',
    streak: false,
    timestamp: Date.now() - 240000
  },
  {
    id: '3',
    from: 'them',
    type: 'text',
    text: 'Streak maintain karo — VOID milega! 🔥',
    time: '10:32',
    streak: true,
    timestamp: Date.now() - 180000
  },
]

export default function ChatScreen({
  contact,
  onBack,
  onViewProfile,
  blockedUsers,
  messageTextSize = 15,
  chatWallpaper = 'classic_dark',
  nameColor = '#c8ff00',
  onBlockToggle,
  onLockToggle,
  onChangeAvatar,
  isLocked,
  onAddGroupMember,
  isDayMode = false,
}) {
  const theme = {
    bg: isDayMode ? '#f4f4f5' : '#060608',
    cardBg: isDayMode ? '#ffffff' : '#0e0e14',
    text: isDayMode ? '#18181b' : '#f0f0ff',
    subText: isDayMode ? '#71717a' : '#8b8ba7',
    border: isDayMode ? '#e4e4e7' : '#1e1e2c',
    primary: nameColor || '#c8ff00'
  }

  const [customAlert, setCustomAlert] = useState(null)
  const Alert = {
    alert: (title, message, buttons = []) => {
      setCustomAlert({
        title,
        message,
        buttons: buttons && buttons.length > 0 ? buttons : [{ text: 'OK' }]
      })
    }
  }

  const targetUserId = contact?._id || contact?.id || contact?.userId
  const isBlocked = blockedUsers?.includes(targetUserId)
  const [messages, setMessages] = useState([])
  const [loadingMessages, setLoadingMessages] = useState(false)

  const fetchMessages = async () => {
    const targetId = contact?._id || contact?.id || contact?.userId
    if (!targetId) return
    try {
      const res = await getMessages(targetId)
      const dataArray = res.data && Array.isArray(res.data) 
        ? res.data 
        : (res.data?.messages && Array.isArray(res.data.messages) ? res.data.messages : null)
      if (dataArray) {
        const mapped = dataArray.map(m => {
          const content = m.content || ''
          const senderIdStr = typeof m.sender === 'object' ? (m.sender?._id || m.sender?.id) : m.sender
          const isThem = String(senderIdStr) === String(targetId)
          
          let type = m.messageType || 'text'
          let parsedContent = content
          let contactInfo = null

          if (content.startsWith('[IMAGE] ')) {
            type = 'image'
            parsedContent = content.replace('[IMAGE] ', '')
          } else if (content.startsWith('[LOCATION] ')) {
            type = 'location'
            parsedContent = content.replace('[LOCATION] ', '')
          } else if (content.startsWith('[CONTACT] ')) {
            type = 'contact'
            parsedContent = content.replace('[CONTACT] ', '')
            const nameMatch = parsedContent.match(/Contact: ([^(]+)/) || parsedContent.match(/👤 Contact: ([^(]+)/)
            const phoneMatch = parsedContent.match(/\(([^)]+)\)/)
            contactInfo = {
              name: nameMatch ? nameMatch[1].trim() : 'Contact',
              phone: phoneMatch ? phoneMatch[1].trim() : parsedContent
            }
          } else if (content.startsWith('[DOCUMENT] ')) {
            type = 'document'
            parsedContent = content.replace('[DOCUMENT] ', '')
          }

          return {
            id: m._id || m.id,
            from: isThem ? 'them' : 'me',
            type: type,
            text: content,
            content: parsedContent,
            originalText: parsedContent,
            contact: contactInfo,
            time: new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: new Date(m.createdAt || Date.now()).getTime(),
            streak: false,
          }
        })
        setMessages(mapped)
      }
    } catch (e) {
      console.log('Error fetching messages:', e)
    }
  }

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 3000)

    const socket = rawWebrtcService.socket
    const handleReceiveMessage = (data) => {
      const targetId = contact?._id || contact?.id || contact?.userId
      if (data && String(data.sender) === String(targetId)) {
        const newMsg = {
          id: data._id || Date.now().toString(),
          from: 'them',
          type: 'text',
          text: data.content,
          content: data.content,
          originalText: data.content,
          time: new Date(data.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: new Date(data.createdAt || Date.now()).getTime(),
          streak: false,
        }
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev
          return [...prev, newMsg]
        })
      }
    }

    if (socket) {
      socket.on('receive-message', handleReceiveMessage)
    }

    return () => {
      clearInterval(interval)
      if (socket) {
        socket.off('receive-message', handleReceiveMessage)
      }
    }
  }, [contact?._id, contact?.id, contact?.userId])

  const [input, setInput] = useState('')
  const [streak, setStreak] = useState(47)
  const [screenshotAllowed, setScreenshotAllowed] = useState(true)
  const [showVCMenu, setShowVCMenu] = useState(false)
  const [showMediaMenu, setShowMediaMenu] = useState(false)
  const [onCall, setOnCall] = useState(false)
  const [callType, setCallType] = useState(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeaker, setIsSpeaker] = useState(false)
  const [callDuration, setCallDuration] = useState(0)

  // ── New Chat Settings states ──
  const [showChatMenuModal, setShowChatMenuModal] = useState(false)
  const [disappearingMode, setDisappearingMode] = useState('off') // off, 24h, 7d, 30d
  const [isChatMuted, setIsChatMuted] = useState(false)
  const [localChatTheme, setLocalChatTheme] = useState('classic_dark')
  const [searchMessageText, setSearchMessageText] = useState('')
  const [showSearchBox, setShowSearchBox] = useState(false)
  const [showMediaDetails, setShowMediaDetails] = useState(false)

  // ── WebRTC Real Call State ────────────────────────────────────
  const [localStream, setLocalStream] = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)
  const [incomingCall, setIncomingCall] = useState(null) // { from, fromName, offer, callType }
  const [callStatus, setCallStatus] = useState('idle') // idle | calling | ringing | connected | ended
  
  // Permission System
  const [otherUserPermissions, setOtherUserPermissions] = useState({
    canScreenshot: false,
    canForward: false,
    canShareContact: false
  })
  const [pendingPermissionRequest, setPendingPermissionRequest] = useState(null)
  const [selectedMessage, setSelectedMessage] = useState(null)

  // Camera Filters System
  const [selectedFilter, setSelectedFilter] = useState('normal')
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  
  // Camera Roll & Drafts System
  const [cameraRoll, setCameraRoll] = useState([
    { id: 1, type: 'photo', filter: 'normal', timestamp: '2 hrs ago', emoji: '📷' },
    { id: 2, type: 'photo', filter: 'sepia', timestamp: '5 hrs ago', emoji: '🟤' },
    { id: 3, type: 'video', filter: 'cool', timestamp: '1 day ago', emoji: '❄️' },
  ])
  const [showCameraRoll, setShowCameraRoll] = useState(false)
  const [selectedDraft, setSelectedDraft] = useState(null)
  const [showDraftPreview, setShowDraftPreview] = useState(false)
  const [previewImageUri, setPreviewImageUri] = useState(null)

  // ── Voice Recording State ─────────────────────────────────────
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [audioURL, setAudioURL] = useState(null)
  const [playingMsgId, setPlayingMsgId] = useState(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const recordingTimerRef = useRef(null)
  const audioRefs = useRef({})
  const recordingRef = useRef(null)
  const soundObjectRef = useRef(null)

  
  const cameraFilters = [
    { name: 'normal', label: 'Normal', emoji: '📷' },
    { name: 'sepia', label: 'Sepia', emoji: '🟤' },
    { name: 'cool', label: 'Cool', emoji: '❄️' },
    { name: 'bw', label: 'B&W', emoji: '⚫' },
    { name: 'vintage', label: 'Vintage', emoji: '🎬' },
    { name: 'neon', label: 'Neon', emoji: '⚡' },
    { name: 'blur', label: 'Blur', emoji: '🌫️' },
    { name: 'bright', label: 'Bright', emoji: '☀️' },
  ]

  const getFilterStyle = (filter) => {
    const filterStyles = {
      normal: {},
      sepia: { backgroundColor: 'rgba(139, 90, 43, 0.15)' },
      cool: { backgroundColor: 'rgba(0, 150, 200, 0.15)' },
      bw: { backgroundColor: 'rgba(100, 100, 100, 0.4)', opacity: 0.8 },
      vintage: { backgroundColor: 'rgba(200, 180, 150, 0.2)' },
      neon: { backgroundColor: 'rgba(255, 0, 255, 0.1)', borderColor: '#ff00ff', borderWidth: 2 },
      blur: { opacity: 0.7 },
      bright: { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
    }
    return filterStyles[filter] || {}
  }

  // ── WebRTC Service Setup ────────────────────────────────────
  useEffect(() => {
    // contact?.userId real user ID hoga (e.g. MongoDB _id)
    const myUserId = contact?.myUserId || 'guest-' + Date.now()

    webrtcService.connect(myUserId, contact?.myUsername || '')

    // Incoming call aaye toh
    webrtcService.onIncomingCall = ({ from, fromName, offer, callType: ct }) => {
      setIncomingCall({ from, fromName, offer, callType: ct })
      setCallStatus('ringing')
    }

    // Call connected
    webrtcService.onCallAccepted = () => {
      setCallStatus('connected')
    }

    // Remote video stream aaya
    webrtcService.onRemoteStream = (stream) => {
      setRemoteStream(stream)
    }

    // Dusri taraf se reject
    webrtcService.onCallRejected = () => {
      Alert.alert('📵 Call Rejected', `${contact?.name} ne call reject kar diya`)
      setOnCall(false)
      setLocalStream(null)
      setRemoteStream(null)
      setCallStatus('idle')
    }

    // Call khatam
    webrtcService.onCallEnded = () => {
      setOnCall(false)
      setLocalStream(null)
      setRemoteStream(null)
      setIncomingCall(null)
      setCallStatus('idle')
      setCallDuration(0)
    }

    // Dusra user offline
    webrtcService.onCallUnavailable = () => {
      Alert.alert('📵 Unavailable', `${contact?.name} abhi available nahi`)
      setOnCall(false)
      setCallStatus('idle')
    }

    return () => {
      webrtcService.disconnect()
    }
  }, [])

  // ── Call Timer ───────────────────────────────────────────────
  useEffect(() => {
    let interval
    if (onCall && callStatus === 'connected') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [onCall, callStatus])

  // ── Disappearing Messages Handler ──
  useEffect(() => {
    if (disappearingMode === 'off') return

    let durationMs = 0
    if (disappearingMode === '10s (Dev)') durationMs = 10 * 1000
    else if (disappearingMode === '24h') durationMs = 24 * 60 * 60 * 1000
    else if (disappearingMode === '7d') durationMs = 7 * 24 * 60 * 60 * 1000
    else if (disappearingMode === '90d') durationMs = 90 * 24 * 60 * 60 * 1000

    if (durationMs === 0) return

    const interval = setInterval(() => {
      setMessages(prev => {
        const filtered = prev.filter(m => {
          const ts = m.timestamp || Date.now()
          return (Date.now() - ts) < durationMs
        })
        if (filtered.length !== prev.length) {
          return filtered
        }
        return prev
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [disappearingMode])

  // ── Starred Messages Logic ──
  useEffect(() => {
    const loadStarredStatus = async () => {
      try {
        const stored = await AsyncStorage.getItem('starred_messages') || '[]'
        const starredList = JSON.parse(stored)
        const starredIds = starredList.map(m => m.id)
        
        setMessages(prev => prev.map(msg => {
          if (starredIds.includes(msg.id)) {
            return { ...msg, isStarred: true }
          }
          return msg
        }))
      } catch (e) {}
    }
    loadStarredStatus()
  }, [])

  const toggleStarMessage = async (msgId) => {
    try {
      let nowStarred = false
      const updatedMessages = messages.map(msg => {
        if (msg.id === msgId) {
          nowStarred = !msg.isStarred
          return { ...msg, isStarred: nowStarred }
        }
        return msg
      })
      setMessages(updatedMessages)

      const stored = await AsyncStorage.getItem('starred_messages') || '[]'
      let starredList = JSON.parse(stored)

      const targetMsg = messages.find(m => m.id === msgId)
      if (nowStarred) {
        const textToSave = targetMsg.type === 'text' 
          ? (targetMsg.originalText || decryptMessage(targetMsg.text)) 
          : (targetMsg.content || 'Media Message')

        starredList.push({
          id: targetMsg.id,
          chatId: contact?.id || contact?.userId,
          contactName: contact?.name || 'User',
          type: targetMsg.type,
          text: textToSave,
          time: targetMsg.time,
          timestamp: targetMsg.timestamp || Date.now()
        })
      } else {
        starredList = starredList.filter(m => m.id !== msgId)
      }

      await AsyncStorage.setItem('starred_messages', JSON.stringify(starredList))
      await updatePreferences({ starredMessages: starredList })
      Alert.alert(nowStarred ? '⭐ Message Starred' : '⭐ Message Unstarred')
    } catch (e) {
      Alert.alert('Error', 'Could not update starred status.')
    }
  }

  const handleMsgLongPress = (msg) => {
    Alert.alert(
      'Message Options',
      'Choose an action:',
      [
        {
          text: msg.isStarred ? '⭐ Unstar Message' : '⭐ Star Message',
          onPress: () => toggleStarMessage(msg.id)
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    )
  }

  const formatCallDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  const sendMessage = async () => {
    if (!input.trim()) return
    const originalText = input.trim()
    const targetId = contact?._id || contact?.id || contact?.userId
    if (!targetId) {
      Alert.alert('Error', 'Contact ID not found!')
      return
    }
    
    setInput('')
    const tempId = 'temp-' + Date.now()
    const optimisticMsg = {
      id: tempId,
      from: 'me',
      type: 'text',
      text: originalText,
      content: originalText,
      originalText: originalText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      streak: false,
    }

    setMessages(prev => [...prev, optimisticMsg])

    try {
      const res = await sendApiMessage({
        receiverId: targetId,
        content: originalText
      })
      if (res.data?.messageData?._id) {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: res.data.messageData._id } : m))
      }
      setStreak(prev => prev + 1)
    } catch (e) {
      console.log('Error sending message:', e)
      Alert.alert('Error', 'Failed to send message!')
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setInput(originalText)
    }
  }

  const toggleScreenshot = () => {
    setScreenshotAllowed(!screenshotAllowed)
    Alert.alert(
      'Privacy Setting',
      screenshotAllowed 
        ? '📵 Screenshots disabled for this chat\nOther user cannot capture your chat' 
        : '📸 Screenshots enabled for this chat'
    )
  }

  // ── Real Voice Call ──────────────────────────────────────────
  const startVoiceCall = async () => {
    try {
      setShowVCMenu(false)
      setCallStatus('calling')
      const stream = await webrtcService.startCall(
        contact?.userId || contact?.id,
        'voice',
        contact?.myUsername || ''
      )
      setLocalStream(stream)
      setOnCall(true)
      setCallType('voice')
      setCallDuration(0)
      setIsMuted(false)
    } catch (err) {
      Alert.alert('❌ Error', 'Mic permission chahiye call ke liye!')
      setCallStatus('idle')
    }
  }

  // ── Real Video Call ──────────────────────────────────────────
  const startVideoCall = async () => {
    try {
      setShowVCMenu(false)
      setCallStatus('calling')
      const stream = await webrtcService.startCall(
        contact?.userId || contact?.id,
        'video',
        contact?.myUsername || ''
      )
      setLocalStream(stream)
      setOnCall(true)
      setCallType('video')
      setCallDuration(0)
      setIsMuted(false)
    } catch (err) {
      Alert.alert('❌ Error', 'Camera/Mic permission chahiye call ke liye!')
      setCallStatus('idle')
    }
  }

  // ── Answer Incoming Call ─────────────────────────────────────
  const answerIncomingCall = async () => {
    if (!incomingCall) return
    try {
      const stream = await webrtcService.answerCall(
        incomingCall.from,
        incomingCall.offer,
        incomingCall.callType
      )
      setLocalStream(stream)
      setOnCall(true)
      setCallType(incomingCall.callType)
      setCallDuration(0)
      setIncomingCall(null)
      setCallStatus('connected')
    } catch (err) {
      Alert.alert('❌ Error', 'Call answer mein masla aaya')
      setCallStatus('idle')
    }
  }

  // ── Reject Incoming Call ─────────────────────────────────────
  const rejectIncomingCall = () => {
    if (!incomingCall) return
    webrtcService.rejectCall(incomingCall.from)
    setIncomingCall(null)
    setCallStatus('idle')
  }

  // ── Toggle Mute (Real) ───────────────────────────────────────
  const toggleMute = () => {
    const nowMuted = webrtcService.toggleMute()
    setIsMuted(nowMuted)
  }

  // ── Toggle Speaker ───────────────────────────────────────────
  const toggleSpeaker = () => {
    setIsSpeaker(prev => !prev)
    // Platform speaker toggle (RN InCallManager se hota, optional)
  }

  // ── Switch Camera ────────────────────────────────────────────
  const switchCamera = () => {
    webrtcService.switchCamera()
  }

  // Camera Roll Functions
  const savePhotoToDraft = (filterUsed) => {
    const newDraft = {
      id: Date.now(),
      type: 'photo',
      filter: filterUsed,
      timestamp: 'Just now',
      emoji: cameraFilters.find(f => f.name === filterUsed)?.emoji || '📷'
    }
    setCameraRoll(prev => [newDraft, ...prev])
    Alert.alert('✅ Saved', 'Photo saved to camera roll draft!')
  }

  const savePhotoToGallery = (filterUsed) => {
    const filterLabel = cameraFilters.find(f => f.name === filterUsed)?.label
    Alert.alert('✅ Gallery Saved', `Photo ${filterUsed !== 'normal' ? `with ${filterLabel} filter ` : ''}saved to device gallery!`)
  }

  const sendFromDraft = (draft) => {
    const msg = {
      id: Date.now().toString(),
      from: 'me',
      type: 'image',
      content: `📷 Photo sent ${draft.filter !== 'normal' ? `(${cameraFilters.find(f => f.name === draft.filter)?.label} filter)` : ''}`,
      filter: draft.filter,
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit', minute: '2-digit'
      }),
      streak: false
    }
    setMessages(prev => [...prev, msg])
    setShowDraftPreview(false)
    setSelectedDraft(null)
    setStreak(prev => prev + 1)
  }

  const deleteDraft = (draftId) => {
    setCameraRoll(prev => prev.filter(d => d.id !== draftId))
    Alert.alert('🗑️ Deleted', 'Draft removed from camera roll')
  }

  const previewDraft = (draft) => {
    setSelectedDraft(draft)
    setShowDraftPreview(true)
  }

  const openRealCamera = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync()
      if (permissionResult.granted === false) {
        Alert.alert('Permission Denied', 'You need to allow camera access to take photos.')
        return
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      })
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPreviewImageUri(result.assets[0].uri)
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to open camera.')
    }
  }

  const openRealGallery = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (permissionResult.granted === false) {
        Alert.alert('Permission Denied', 'You need to allow access to photos to select images.')
        return
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      })
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPreviewImageUri(result.assets[0].uri)
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to open gallery.')
    }
  }

  const sendMediaMessage = async (type, contentText) => {
    try {
      if (!contact?.id) return
      const prefix = `[${type.toUpperCase()}] `
      const encryptedContent = encryptMessage(prefix + contentText)
      
      await sendApiMessage({
        receiverId: contact.id,
        content: encryptedContent
      })
      await fetchMessages()
      setShowMediaMenu(false)
      setStreak(prev => prev + 1)
    } catch (e) {
      Alert.alert('Error', `Failed to send ${type}!`)
    }
  }

  const handleSendPreviewImage = async () => {
    if (!previewImageUri) return
    const uri = previewImageUri
    setPreviewImageUri(null)
    await sendMediaMessage('image', `🖼️ Media Attached: ${uri}`)
  }

  const sendPhoto = async () => {
    setShowMediaMenu(false)
    await openRealCamera()
  }

  const sendFromGallery = async () => {
    setShowMediaMenu(false)
    await openRealGallery()
  }

  const shareContact = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access contacts is required.')
        return
      }
      
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
        pageSize: 30,
      })
      
      if (data && data.length > 0) {
        const sorted = data.filter(c => c.name && c.phoneNumbers && c.phoneNumbers.length > 0).slice(0, 5)
        if (sorted.length === 0) {
          Alert.alert('No Contacts', 'No contacts with phone numbers found.')
          return
        }
        const options = sorted.map(c => ({
          text: `${c.name} (${c.phoneNumbers[0].number})`,
          onPress: () => sendMediaMessage('contact', `👤 Contact: ${c.name} (${c.phoneNumbers[0].number})`)
        }))
        options.push({ text: 'Cancel', style: 'cancel' })
        Alert.alert('Share Contact', 'Select a contact to share:', options)
      } else {
        Alert.alert('No Contacts', 'No contacts found on your device.')
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to read contacts.')
    }
  }

  const shareDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      })
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0]
        sendMediaMessage('document', `📄 ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`)
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to pick document.')
    }
  }

  const shareLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location is required.')
        return
      }
      const loc = await Location.getCurrentPositionAsync({})
      const lat = loc.coords.latitude
      const lon = loc.coords.longitude
      sendMediaMessage('location', `📍 Location: (${lat.toFixed(4)}, ${lon.toFixed(4)})`)
    } catch (e) {
      Alert.alert('Error', 'Failed to fetch location.')
    }
  }

  // ── Voice Recording Functions ────────────────────────────────
  const startRecording = async () => {
    try {
      if (Platform.OS === 'web') {
        setIsRecording(true)
        setRecordingDuration(0)
        recordingTimerRef.current = setInterval(() => {
          setRecordingDuration(prev => prev + 1)
        }, 1000)

        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          const recorder = new MediaRecorder(stream)
          mediaRecorderRef.current = recorder
          audioChunksRef.current = []

          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) audioChunksRef.current.push(e.data)
          }

          recorder.onstop = () => {
            const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
            const url = URL.createObjectURL(blob)
            sendVoiceMsg(url, recordingDuration)
            stream.getTracks().forEach(t => t.stop())
          }

          recorder.start()
        } catch (e) {
          console.log('Web audio stream failed')
        }
      } else {
        // Voice recording — temporarily disabled (expo-av removed due to SDK 56 crash)
        Alert.alert('🎙️ Voice Note', 'Voice recording feature coming soon!')
        return
      }
    } catch (err) {
      console.log('Mic init error:', err)
    }
  }

  const sendVoiceMsg = (url, duration) => {
    const msg = {
      id: Date.now().toString(),
      from: 'me',
      type: 'voice',
      audioUrl: url,
      duration: duration || 5,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      streak: false
    }
    setMessages(prev => [...prev, msg])
    setStreak(prev => prev + 1)
  }

  const stopRecording = async () => {
    const duration = recordingDuration
    clearInterval(recordingTimerRef.current)
    setIsRecording(false)
    setRecordingDuration(0)

    if (Platform.OS === 'web') {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
    } else {
      if (!recordingRef.current) return
      try {
        await recordingRef.current.stop()
        const uri = recordingRef.current.uri
        recordingRef.current = null
        sendVoiceMsg(uri, duration)
      } catch (err) {
        console.log('Stop recording failed:', err)
      }
    }
  }

  const cancelRecording = async () => {
    clearInterval(recordingTimerRef.current)
    setIsRecording(false)
    setRecordingDuration(0)

    if (Platform.OS === 'web') {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.onstop = null
        mediaRecorderRef.current.stop()
      }
    } else {
      if (!recordingRef.current) return
      try {
        await recordingRef.current.stop()
        recordingRef.current = null
      } catch (err) {}
    }
  }

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const togglePlayVoice = async (msgId, audioUrl) => {
    if (!audioUrl) {
      Alert.alert('Info', 'Audio URL is empty.')
      return
    }

    try {
      if (Platform.OS === 'web') {
        if (playingMsgId && playingMsgId !== msgId) {
          const prev = audioRefs.current[playingMsgId]
          if (prev) { prev.pause(); prev.currentTime = 0 }
        }
        if (!audioRefs.current[msgId]) {
          audioRefs.current[msgId] = new window.Audio(audioUrl)
          audioRefs.current[msgId].onended = () => setPlayingMsgId(null)
        }
        const audio = audioRefs.current[msgId]
        if (playingMsgId === msgId) {
          audio.pause()
          setPlayingMsgId(null)
        } else {
          audio.play()
          setPlayingMsgId(msgId)
        }
      } else {
        // Native audio playback — temporarily disabled (expo-av removed)
        Alert.alert('🔊 Audio', 'Voice note playback coming soon!')
        return
      }
    } catch (err) {
      console.log('Error playing sound:', err)
      Alert.alert('Playback Error', 'Failed to play voice message.')
    }
  }

  // ── End Call (Real) ──────────────────────────────────────────
  const endCall = () => {
    webrtcService.endCall()
    setOnCall(false)
    setCallType(null)
    setCallDuration(0)
    setIsMuted(false)
    setIsSpeaker(false)
    setLocalStream(null)
    setRemoteStream(null)
    setCallStatus('idle')
    Alert.alert('✅ Call Khatam', `${callType === 'voice' ? '🎤' : '📹'} Duration: ${formatCallDuration(callDuration)}`)
  }

  const requestPermission = (permissionType) => {
    const permissionLabels = {
      screenshot: 'Allow screenshots of our chat?',
      forward: 'Allow forwarding of shared images?',
      contact: 'Allow sharing of received contacts?'
    }
    
    Alert.alert(
      '🔐 Permission Request',
      `Send request to ${contact?.name || 'User'}: "${permissionLabels[permissionType]}"`,
      [
        { text: 'Cancel', onPress: () => {} },
        { 
          text: 'Send Request', 
          onPress: () => {
            setPendingPermissionRequest({
              type: permissionType,
              requestedAt: new Date().toLocaleTimeString(),
              status: 'pending'
            })
            
            const msg = {
              id: Date.now().toString(),
              from: 'me',
              type: 'permissionRequest',
              permissionType: permissionType,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              streak: false,
              status: 'pending'
            }
            setMessages(prev => [...prev, msg])
          }
        }
      ]
    )
  }

  const handlePermissionResponse = (messageId, approved) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, status: approved ? 'approved' : 'denied' }
        : msg
    ))
    
    if (approved) {
      const permType = messages.find(m => m.id === messageId)?.permissionType
      if (permType === 'permissionRequest') {
        setOtherUserPermissions(prev => ({
          ...prev,
          canScreenshot: true,
          canForward: true,
          canShareContact: true
        }))
        Alert.alert('✅ Permission Granted', `${contact?.name} allowed all permissions!`)
      }
    } else {
      Alert.alert('❌ Permission Denied', `${contact?.name} denied the request`)
    }
  }

  const canForwardImage = () => {
    if (!otherUserPermissions.canForward) {
      Alert.alert('🔒 Not Allowed', `Request permission from ${contact?.name} to forward images`)
      return false
    }
    return true
  }
  const canShareContact = () => {
    if (!otherUserPermissions.canShareContact) {
      Alert.alert('🔒 Not Allowed', `Request permission from ${contact?.name} to share contacts`)
      return false
    }
    return true
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.cardBg, borderBottomColor: theme.border, borderBottomWidth: 1 }]}>
        <TouchableOpacity onPress={onBack} style={[styles.backBtn, { padding: 4 }]}>
          <Icon name="arrow_back" size={22} color={theme.text} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.contactInfo}
          onPress={() => setShowChatMenuModal(true)}
        >
          <View style={[styles.avatar, { backgroundColor: isDayMode ? '#e4e4e7' : '#27272a' }]}>
            <Text style={[styles.avatarText, { color: theme.text }]}>
              {contact?.avatar || contact?.name?.[0] || 'U'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Text style={[styles.contactName, { color: theme.text }, nameColor && { color: nameColor }]} numberOfLines={1}>
                {contact?.name || 'User'} {isChatMuted && '🔕'}
              </Text>
              {streak > 0 && (
                <View style={styles.streakBadge}>
                  <Text style={styles.streakText}>🔥 {streak}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.encStatus, { color: theme.subText }]}>
              {onCall ? '🔴 On Call' : '🔐 E2E Encrypted'}
            </Text>
          </View>
        </TouchableOpacity>
        
        {/* Privacy Controls */}
        <View style={styles.headerControls}>
          <TouchableOpacity 
            onPress={toggleScreenshot}
            style={{ 
              backgroundColor: screenshotAllowed ? (isDayMode ? '#dcfce7' : '#052e16') : (isDayMode ? '#fee2e2' : '#450a0a'),
              borderRadius: 14, width: 28, height: 28, justifyContent: 'center', alignItems: 'center'
            }}
          >
            <Icon name={screenshotAllowed ? 'photo_camera' : 'no_photography'} size={14} color={screenshotAllowed ? '#22c55e' : '#ef4444'} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={{ backgroundColor: isDayMode ? '#f3e8ff' : '#2e1065', borderRadius: 14, width: 28, height: 28, justifyContent: 'center', alignItems: 'center', marginLeft: 4 }}
            onPress={() => {
              Alert.alert(
                '🔐 Permissions',
                `${contact?.name || 'User'}'s Permissions:\n\n` +
                `Screenshot: ${otherUserPermissions.canScreenshot ? '✅ Allowed' : '❌ Blocked'}\n` +
                `Forward Images: ${otherUserPermissions.canForward ? '✅ Allowed' : '❌ Blocked'}\n` +
                `Share Contact: ${otherUserPermissions.canShareContact ? '✅ Allowed' : '❌ Blocked'}`,
                [
                  { text: 'Close', onPress: () => {} },
                  { 
                    text: 'Request All', 
                    onPress: () => requestPermission('screenshot')
                  }
                ]
              )
            }}
          >
            <Icon name="lock" size={14} color="#a855f7" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => {
              if (isBlocked) {
                Alert.alert('Blocked', 'Unblock this user to make calls.')
              } else {
                Alert.alert(
                  '📞 Call Options',
                  `Select call type for ${contact?.name || 'User'}:`,
                  [
                    { text: '📞 Voice Call', onPress: () => startVoiceCall() },
                    { text: '📹 Video Call', onPress: () => startVideoCall() },
                    { text: 'Cancel', style: 'cancel' }
                  ]
                )
              }
            }}
            style={[{ backgroundColor: isDayMode ? '#e4e4e7' : '#1a1a24', borderRadius: 14, width: 28, height: 28, justifyContent: 'center', alignItems: 'center', marginLeft: 4 }, isBlocked && { opacity: 0.4 }]}
          >
            <Icon name="call" size={14} color={isDayMode ? '#1e1b4b' : '#c8ff00'} />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setShowChatMenuModal(true)}
            style={{ padding: 4, marginLeft: 4 }}
          >
            <Icon name="more_vert" size={20} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Incoming Call Modal ───────────────────────────────── */}
      <Modal visible={!!incomingCall} transparent animationType="slide">
        <View style={styles.incomingCallModal}>
          <View style={styles.incomingCallCard}>
            <View style={styles.callAvatar}>
              <Text style={styles.callAvatarText}>
                {incomingCall?.fromName?.[0] || '?'}
              </Text>
            </View>
            <Text style={styles.incomingCallName}>
              {incomingCall?.fromName || 'Unknown'}
            </Text>
            <View style={styles.incomingCallType}>
              <Text style={{ color: '#8b8ba7', fontSize: 14 }}>
                {incomingCall?.callType === 'video' ? 'Video Call' : 'Voice Call'}
              </Text>
            </View>
            <View style={styles.incomingCallBtns}>
              <TouchableOpacity
                style={styles.rejectCallBtn}
                onPress={rejectIncomingCall}
              >
                <Icon name="call_end" size={22} color="#ef4444" style={styles.rejectCallIcon} />
                <Text style={styles.rejectCallText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.answerCallBtn}
                onPress={answerIncomingCall}
              >
                <Icon name="call" size={22} color="#4ade80" style={styles.answerCallIcon} />
                <Text style={styles.answerCallText}>Answer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Live Call Interface ───────────────────────────────── */}
      {onCall && (
        <View style={styles.callOverlay}>

          {/* Video Streams (video call only) */}
          {callType === 'video' && (
            <View style={styles.videoContainer}>
              {remoteStream && (
                <RTCView
                  streamURL={remoteStream.toURL()}
                  style={styles.remoteVideo}
                  objectFit="cover"
                  mirror={false}
                />
              )}
              {localStream && (
                <RTCView
                  streamURL={localStream.toURL()}
                  style={styles.localVideo}
                  objectFit="cover"
                  mirror={true}
                />
              )}
            </View>
          )}

          <View style={styles.callContainer}>
            {/* Avatar & Info (voice call ya connecting state) */}
            {(callType === 'voice' || callStatus === 'calling') && (
              <View style={styles.callInfo}>
                <View style={styles.callAvatar}>
                  <Text style={styles.callAvatarText}>
                    {contact?.name?.[0] || 'U'}
                  </Text>
                </View>
                <View style={styles.callDetails}>
                  <Text style={styles.callName}>{contact?.name || 'User'}</Text>
                  <Text style={styles.callType}>
                    {callStatus === 'calling'
                      ? '⏳ Connecting...'
                      : callType === 'voice'
                        ? '🎤 Voice Call'
                        : '📹 Video Call'}
                  </Text>
                  <Text style={styles.callDuration}>
                    {callStatus === 'connected' ? formatCallDuration(callDuration) : ''}
                  </Text>
                </View>
              </View>
            )}

            {/* Call Controls */}
            <View style={styles.callControls}>
              <TouchableOpacity
                style={[styles.callingScreenBtn, isMuted && styles.callBtnActive]}
                onPress={toggleMute}
              >
                <Icon name={isMuted ? 'mic_off' : 'mic'} size={24} color="#ffffff" style={styles.callBtnIcon} />
                <Text style={styles.callBtnLabel}>{isMuted ? 'Muted' : 'Mute'}</Text>
              </TouchableOpacity>

              {callType === 'video' && (
                <TouchableOpacity
                  style={styles.callingScreenBtn}
                  onPress={switchCamera}
                >
                  <Icon name="autorenew" size={24} color="#ffffff" style={styles.callBtnIcon} />
                  <Text style={styles.callBtnLabel}>Flip</Text>
                </TouchableOpacity>
              )}

              {callType === 'voice' && (
                <TouchableOpacity
                  style={[styles.callingScreenBtn, isSpeaker && styles.callBtnActive]}
                  onPress={toggleSpeaker}
                >
                  <Icon name={isSpeaker ? 'volume_up' : 'phone_android'} size={24} color="#ffffff" style={styles.callBtnIcon} />
                  <Text style={styles.callBtnLabel}>{isSpeaker ? 'Speaker' : 'Phone'}</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.callingScreenBtn, styles.callBtnEnd]}
                onPress={endCall}
              >
                <Icon name="call_end" size={24} color="#ef4444" style={styles.callBtnIcon} />
                <Text style={styles.callBtnLabel}>End</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* VOID Earned */}
      <View style={styles.VOIDBar}>
        <Text style={styles.VOIDBarText}>
          ⚡ Is chat se: +{streak * 50} VOID kamaye!
        </Text>
      </View>

      {/* Messages, Menus, and Input wrapped in KeyboardAvoidingView */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.select({ ios: 90, android: 0 })}
      >
        {/* Messages */}
        <View style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: { 
            classic_dark: '#0a0a0f', 
            solid_gray: '#27272a', 
            neon_glow: '#120024', 
            emerald_deep: '#021e10',
            pastel_blue: '#0a1c2a',
            aura_purple: '#1c052e',
            sunset_dark: '#24040a'
          }[localChatTheme || chatWallpaper] || '#0a0a0a'
        }}>
        <ChatDoodleBackground opacity={0.08} />
        <ScrollView 
          style={[styles.messages, { backgroundColor: 'transparent' }]} 
          contentContainerStyle={{ padding: 16, gap: 8 }} 
          keyboardShouldPersistTaps="handled"
        >
          {messages.map(msg => (
          <View
            key={msg.id}
            style={[
              styles.msgRow,
              msg.from === 'me' ? styles.msgRowMe : styles.msgRowThem
            ]}
          >
            {msg.type === 'image' && (
              <TouchableOpacity 
                activeOpacity={0.9} 
                onLongPress={() => handleMsgLongPress(msg)} 
                style={[styles.bubble, msg.from === 'me' ? styles.bubbleMe : styles.bubbleThem]}
              >
                <View style={[styles.imageBubble, msg.filter && getFilterStyle(msg.filter), { padding: 4 }]}>
                  {msg.content.startsWith('http') ? (
                    <Image 
                      source={{ uri: msg.content }} 
                      style={{ width: 220, height: 160, borderRadius: 12 }} 
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={{ width: 220, height: 160, borderRadius: 12, backgroundColor: '#1a1a24', justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={styles.imagePlaceholder}>🖼️</Text>
                      <Text style={styles.imageText}>{msg.content}</Text>
                    </View>
                  )}
                  {msg.filter && msg.filter !== 'normal' && (
                    <Text style={styles.filterBadge}>
                      {cameraFilters.find(f => f.name === msg.filter)?.emoji} {cameraFilters.find(f => f.name === msg.filter)?.label}
                    </Text>
                  )}
                  {msg.from !== 'me' && (
                    <View style={styles.forwardStatus}>
                      <Text style={[styles.forwardStatusText, { color: msg.canForward ? '#4ade80' : '#ff4d4d' }]}>
                        {msg.canForward ? '✅ Can Forward' : '❌ Cannot Forward'}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.msgMeta}>
                  {msg.isStarred && <Text style={{ fontSize: 10, marginRight: 4 }}>⭐</Text>}
                  <Text style={styles.msgTime}>{msg.time}</Text>
                  {msg.from === 'me' && <Text style={styles.msgStatus}>✓✓</Text>}
                  <Text style={styles.msgLock}>🔒</Text>
                </View>
              </TouchableOpacity>
            )}
            
            {msg.type === 'location' && (() => {
              const match = msg.content.match(/\((-?\d+\.\d+),\s*(-?\d+\.\d+)\)/)
              const lat = match ? parseFloat(match[1]) : 24.8607
              const lon = match ? parseFloat(match[2]) : 67.0011

              return (
                <TouchableOpacity 
                  activeOpacity={0.9} 
                  onLongPress={() => handleMsgLongPress(msg)} 
                  style={[styles.bubble, msg.from === 'me' ? styles.bubbleMe : styles.bubbleThem]}
                >
                  <View style={[styles.locationBubble, { padding: 4 }]}>
                    <View style={{ width: 220, height: 150, borderRadius: 12, overflow: 'hidden' }}>
                      {false ? (
                        <View />
                      ) : (
                        <View style={{ width: '100%', height: '100%', backgroundColor: '#1a1a24', justifyContent: 'center', alignItems: 'center' }}>
                          <Text style={{ fontSize: 24 }}>📍</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.locationText, { marginTop: 6, paddingHorizontal: 6 }]}>{msg.content}</Text>
                  </View>
                  <View style={styles.msgMeta}>
                    {msg.isStarred && <Text style={{ fontSize: 10, marginRight: 4 }}>⭐</Text>}
                    <Text style={styles.msgTime}>{msg.time}</Text>
                    {msg.from === 'me' && <Text style={styles.msgStatus}>✓✓</Text>}
                    <Text style={styles.msgLock}>🔒</Text>
                  </View>
                </TouchableOpacity>
              )
            })()}
            
            {msg.type === 'contact' && (
              <TouchableOpacity 
                activeOpacity={0.9} 
                onLongPress={() => handleMsgLongPress(msg)} 
                style={[styles.bubble, msg.from === 'me' ? styles.bubbleMe : styles.bubbleThem]}
              >
                <View style={styles.contactBubble}>
                  <View style={styles.contactAvatar}>
                    <Text style={styles.contactAvatarText}>{msg.contact.name[0]}</Text>
                  </View>
                  <View style={styles.contactInfo2}>
                    <Text style={styles.contactName2}>{msg.contact.name}</Text>
                    <Text style={styles.contactPhone}>{msg.contact.phone}</Text>
                  </View>
                  <TouchableOpacity style={styles.addContactBtn}>
                    <Text style={styles.addContactText}>+</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.msgMeta}>
                  {msg.isStarred && <Text style={{ fontSize: 10, marginRight: 4 }}>⭐</Text>}
                  <Text style={styles.msgTime}>{msg.time}</Text>
                  {msg.from === 'me' && <Text style={styles.msgStatus}>✓✓</Text>}
                  <Text style={styles.msgLock}>🔒</Text>
                </View>
              </TouchableOpacity>
            )}
            
            {msg.type === 'document' && (
              <TouchableOpacity 
                activeOpacity={0.9} 
                onLongPress={() => handleMsgLongPress(msg)} 
                style={[styles.bubble, msg.from === 'me' ? styles.bubbleMe : styles.bubbleThem]}
              >
                <View style={styles.docBubble}>
                  <Icon name="description" size={24} color="#8b8ba7" style={styles.docIcon} />
                  <View style={styles.docInfo}>
                    <Text style={styles.docName}>{msg.content}</Text>
                  </View>
                  <TouchableOpacity style={styles.downloadBtn}>
                    <Icon name="download" size={16} color="#c8ff00" />
                  </TouchableOpacity>
                </View>
                <View style={styles.msgMeta}>
                  {msg.isStarred && <Text style={{ fontSize: 10, marginRight: 4 }}>⭐</Text>}
                  <Text style={styles.msgTime}>{msg.time}</Text>
                  {msg.from === 'me' && <Text style={styles.msgStatus}>✓✓</Text>}
                  <Text style={styles.msgLock}>🔒</Text>
                </View>
              </TouchableOpacity>
            )}
            
            {msg.type === 'permissionRequest' && (
              <View style={[styles.bubble, styles.permissionBubble]}>
                <View style={styles.permissionContent}>
                  <Icon name="lock" size={24} color="#a855f7" style={styles.permissionIcon} />
                  <View style={styles.permissionText}>
                    <Text style={styles.permissionTitle}>Permission Request</Text>
                    <Text style={styles.permissionDesc}>
                      {msg.permissionType === 'screenshot' && 'Allow screenshots?'}
                      {msg.permissionType === 'forward' && 'Allow image forwarding?'}
                      {msg.permissionType === 'contact' && 'Allow contact sharing?'}
                    </Text>
                  </View>
                </View>
                
                {msg.from !== 'me' && msg.status === 'pending' && (
                  <View style={styles.permissionButtons}>
                    <TouchableOpacity 
                      style={styles.denyBtn}
                      onPress={() => handlePermissionResponse(msg.id, false)}
                    >
                      <Text style={styles.denyBtnText}>❌ Deny</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.approveBtn}
                      onPress={() => handlePermissionResponse(msg.id, true)}
                    >
                      <Text style={styles.approveBtnText}>✅ Allow</Text>
                    </TouchableOpacity>
                  </View>
                )}
                
                {msg.status === 'approved' && (
                  <View style={styles.permissionStatusApproved}>
                    <Text style={styles.permissionStatusText}>✅ Approved</Text>
                  </View>
                )}
                
                {msg.status === 'denied' && (
                  <View style={styles.permissionStatusDenied}>
                    <Text style={styles.permissionStatusText}>❌ Denied</Text>
                  </View>
                )}
              </View>
            )}
            
            {msg.type === 'voice' && (
              <TouchableOpacity 
                activeOpacity={0.9} 
                onLongPress={() => handleMsgLongPress(msg)} 
                style={[styles.bubble, msg.from === 'me' ? styles.bubbleMe : styles.bubbleThem]}
              >
                <View style={styles.voiceBubble}>
                  <TouchableOpacity
                    style={styles.voicePlayBtn}
                    onPress={() => togglePlayVoice(msg.id, msg.audioUrl)}
                  >
                    <Icon name={playingMsgId === msg.id ? 'pause' : 'play_arrow'} size={14} color="#c8ff00" style={styles.voicePlayIcon} />
                  </TouchableOpacity>
                  <View style={styles.voiceWave}>
                    {[3,5,8,6,9,7,4,6,8,5,7,4,6,9,5].map((h, i) => (
                      <View
                        key={i}
                        style={[
                          styles.voiceBar,
                          { height: h * 2 + 6 },
                          playingMsgId === msg.id && { backgroundColor: '#c8ff00' }
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={styles.voiceDuration}>{formatDuration(msg.duration || 0)}</Text>
                </View>
                <View style={styles.msgMeta}>
                  {msg.isStarred && <Text style={{ fontSize: 10, marginRight: 4 }}>⭐</Text>}
                  <Text style={styles.msgTime}>{msg.time}</Text>
                  {msg.from === 'me' && <Text style={styles.msgStatus}>✓✓</Text>}
                  <Text style={styles.msgLock}>🔒</Text>
                </View>
              </TouchableOpacity>
            )}

            {msg.type === 'text' && (
              <View style={[styles.bubble, msg.from === 'me' ? styles.bubbleMe : styles.bubbleThem]}>
                {(() => {
                  const rawText = msg.originalText || decryptMessage(msg.text) || ''
                  
                  // Helper to extract image URI without showing file path text
                  const extractImageUri = (str) => {
                    if (!str) return null
                    const s = String(str).trim()
                    if (s.startsWith('[IMAGE] ')) {
                      let clean = s.replace('[IMAGE] ', '').trim()
                      if (clean.startsWith('🖼️ Media Attached: ')) {
                        clean = clean.replace('🖼️ Media Attached: ', '').trim()
                      }
                      return clean
                    }
                    if (s.startsWith('🖼️ Media Attached: ')) {
                      return s.replace('🖼️ Media Attached: ', '').trim()
                    }
                    if (s.startsWith('file://') || s.startsWith('content://') || s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:image')) {
                      return s
                    }
                    return null
                  }

                  const imgUri = extractImageUri(rawText)

                  if (imgUri) {
                    return (
                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => setPreviewImageUri(imgUri)}
                        style={{ width: 220, height: 220, borderRadius: 16, overflow: 'hidden', marginVertical: 4, backgroundColor: '#050508', borderWidth: 1, borderColor: '#1e1e2d' }}
                      >
                        <Image source={{ uri: imgUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      </TouchableOpacity>
                    )
                  }

                  if (rawText.startsWith('[LOCATION] ') || rawText.startsWith('📍')) {
                    const cleanLoc = rawText.replace('[LOCATION] ', '')
                    return (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 2 }}>
                        <Icon name="location_on" size={18} color="#10b981" />
                        <Text style={[styles.msgText, { fontSize: messageTextSize, fontWeight: '700' }]}>{cleanLoc}</Text>
                      </View>
                    )
                  }

                  if (rawText.startsWith('[CONTACT] ') || rawText.startsWith('👤')) {
                    const cleanContact = rawText.replace('[CONTACT] ', '')
                    return (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 2 }}>
                        <Icon name="person" size={18} color="#f59e0b" />
                        <Text style={[styles.msgText, { fontSize: messageTextSize, fontWeight: '700' }]}>{cleanContact}</Text>
                      </View>
                    )
                  }

                  if (rawText.startsWith('[DOCUMENT] ') || rawText.startsWith('📄')) {
                    const cleanDoc = rawText.replace('[DOCUMENT] ', '')
                    return (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 2 }}>
                        <Icon name="description" size={18} color="#8b5cf6" />
                        <Text style={[styles.msgText, { fontSize: messageTextSize, fontWeight: '700' }]}>{cleanDoc}</Text>
                      </View>
                    )
                  }

                  return <Text style={[styles.msgText, { fontSize: messageTextSize }]}>{rawText}</Text>
                })()}
                <View style={styles.msgMeta}>
                  <Text style={styles.msgTime}>{msg.time}</Text>
                  {msg.from === 'me' && (
                    <Text style={styles.msgStatus}>✓✓</Text>
                  )}
                  <Text style={styles.msgLock}>🔐</Text>
                </View>
              </View>
            )}
          </View>
        ))}
        </ScrollView>
      </View>

      {/* Camera Roll Drafts */}
      {showCameraRoll && (
        <View style={styles.cameraRollContainer}>
          <View style={styles.cameraRollHeader}>
            <Text style={styles.cameraRollTitle}>📷 Camera Roll ({cameraRoll.length})</Text>
            <TouchableOpacity onPress={() => setShowCameraRoll(false)}>
              <Text style={styles.cameraRollClose}>✕</Text>
            </TouchableOpacity>
          </View>
          {cameraRoll.length === 0 ? (
            <View style={styles.emptyRoll}>
              <Text style={styles.emptyRollText}>No photos yet</Text>
            </View>
          ) : (
            <ScrollView style={styles.cameraRollScroll} showsVerticalScrollIndicator={false}>
              {cameraRoll.map((draft) => (
                <View key={draft.id} style={styles.draftItem}>
                  <View style={styles.draftContent}>
                    <Text style={styles.draftEmoji}>{draft.emoji}</Text>
                    <View style={styles.draftInfo}>
                      <Text style={styles.draftType}>{draft.type === 'photo' ? '📸 Photo' : '🎥 Video'}</Text>
                      <Text style={styles.draftMeta}>
                        {draft.type === 'photo' ? cameraFilters.find(f => f.name === draft.filter)?.label : draft.filter} • {draft.timestamp}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.draftActions}>
                    <TouchableOpacity 
                      style={styles.draftViewBtn}
                      onPress={() => previewDraft(draft)}
                    >
                      <Icon name="visibility" size={16} color="#d946ef" style={styles.draftViewIcon} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.draftSendBtn}
                      onPress={() => sendFromDraft(draft)}
                    >
                      <Icon name="send" size={16} color="#d946ef" style={styles.draftSendIcon} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.draftDeleteBtn}
                      onPress={() => deleteDraft(draft.id)}
                    >
                      <Icon name="delete" size={16} color="#ef4444" style={styles.draftDeleteIcon} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* Draft Preview */}
      {showDraftPreview && selectedDraft && (
        <View style={styles.previewOverlay}>
          <View style={styles.previewModal}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>📸 Photo Preview</Text>
              <TouchableOpacity onPress={() => setShowDraftPreview(false)}>
                <Text style={styles.previewClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.previewContent}>
              <Text style={styles.previewEmoji}>{selectedDraft.emoji}</Text>
              <View style={styles.previewDetails}>
                <Text style={styles.previewFilterLabel}>
                  Filter: {cameraFilters.find(f => f.name === selectedDraft.filter)?.label}
                </Text>
                <Text style={styles.previewTime}>Saved: {selectedDraft.timestamp}</Text>
              </View>
            </View>
            <View style={styles.previewActions}>
              <TouchableOpacity 
                style={styles.previewSendBtn}
                onPress={() => sendFromDraft(selectedDraft)}
              >
                <Text style={styles.previewSendText}>✈️ Send</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.previewDeleteBtn}
                onPress={() => {
                  deleteDraft(selectedDraft.id)
                  setShowDraftPreview(false)
                  setSelectedDraft(null)
                }}
              >
                <Text style={styles.previewDeleteText}>🗑️ Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Filter Menu */}
      {showFilterMenu && (
        <View style={styles.filterMenu}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Choose Filter for Photo</Text>
            <TouchableOpacity onPress={() => setShowFilterMenu(false)}>
              <Text style={styles.filterClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {cameraFilters.map((filter) => (
              <TouchableOpacity 
                key={filter.name}
                style={[
                  styles.filterOption,
                  selectedFilter === filter.name && styles.filterOptionActive
                ]}
                onPress={() => setSelectedFilter(filter.name)}
              >
                <Text style={styles.filterEmoji}>{filter.emoji}</Text>
                <Text style={styles.filterLabel}>{filter.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Floating Media Menu */}
      {showMediaMenu && (
        <View style={{
          position: 'absolute',
          bottom: 80,
          left: 16,
          right: 16,
          backgroundColor: isDayMode ? '#ffffffef' : '#0e0e14ef',
          borderRadius: 24,
          padding: 16,
          borderWidth: 1,
          borderColor: theme.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.35,
          shadowRadius: 20,
          elevation: 10,
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          gap: 12,
          zIndex: 999,
        }}>
          {[
            { label: 'Camera', icon: 'photo_camera', color: '#ec4899', action: () => { setShowMediaMenu(false); openRealCamera(); } },
            { label: 'Gallery', icon: 'image', color: '#3b82f6', action: () => { setShowMediaMenu(false); openRealGallery(); } },
            { label: 'Location', icon: 'location_on', color: '#10b981', action: () => { setShowMediaMenu(false); shareLocation(); } },
            { label: 'Contact', icon: 'person', color: '#f59e0b', action: () => { setShowMediaMenu(false); shareContact(); } },
            { label: 'Document', icon: 'description', color: '#8b5cf6', action: () => { setShowMediaMenu(false); shareDocument(); } },
            { label: 'Audio', icon: 'mic', color: '#ef4444', action: () => { setShowMediaMenu(false); startRecording(); } },
          ].map((item, idx) => (
            <TouchableOpacity 
              key={idx} 
              onPress={item.action}
              style={{
                width: '30%',
                aspectRatio: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: isDayMode ? '#f4f4f5' : '#1e1e2d',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <View style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: item.color + '15',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 6,
              }}>
                <Icon name={item.icon} size={22} color={item.color} />
              </View>
              <Text style={{ color: theme.text, fontSize: 11, fontWeight: '700' }}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Input */}
      <View>
        {isBlocked ? (
          <View style={styles.blockedBannerContainer}>
            <Text style={styles.blockedBannerText}>
              🚫 You blocked this user. Unblock to resume chat.
            </Text>
          </View>
        ) : (
          <View style={[styles.inputArea, { backgroundColor: theme.cardBg, borderTopColor: theme.border }]}>
            <View style={styles.encIndicator}>
              <View style={styles.encDot} />
              <Text style={[styles.encText, { color: theme.subText }]}>
                {screenshotAllowed ? '📸 Screenshots allowed' : '📵 Screenshots blocked'}
              </Text>
            </View>
            {/* Recording indicator bar */}
            {isRecording && (
              <View style={[styles.recordingBar, { backgroundColor: theme.bg }]}>
                <View style={styles.recordingDot} />
                <Text style={[styles.recordingTime, { color: theme.text }]}>{formatDuration(recordingDuration)}</Text>
                <Text style={[styles.recordingHint, { color: theme.subText }]}>  ← Swipe to cancel</Text>
                <TouchableOpacity onPress={cancelRecording} style={styles.recordingCancelBtn}>
                  <Text style={styles.recordingCancelText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.inputRow}>
              <TouchableOpacity 
                style={[styles.mediaBtn, { backgroundColor: isDayMode ? '#e4e4e7' : '#161622', borderColor: theme.border }]}
                onPress={() => setShowMediaMenu(!showMediaMenu)}
              >
                <Icon name="add" size={24} color="#d946ef" />
              </TouchableOpacity>
              <TextInput
                style={[styles.input, { backgroundColor: isDayMode ? '#f4f4f5' : '#1a1a1a', color: theme.text, borderColor: theme.border }]}
                placeholder="Message likho..."
                placeholderTextColor={theme.subText}
                value={input}
                onChangeText={setInput}
                multiline
              />
              <TouchableOpacity
                style={[styles.micBtn, { backgroundColor: isDayMode ? '#e4e4e7' : '#161622', borderColor: theme.border }, isRecording && styles.micBtnActive]}
                onPressIn={startRecording}
                onPressOut={stopRecording}
                activeOpacity={0.7}
              >
                <Icon name={isRecording ? 'stop' : 'mic'} size={22} color={isRecording ? '#ef4444' : theme.subText} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sendBtn, { backgroundColor: isDayMode ? '#e4e4e7' : '#161622', borderColor: theme.border }, input.trim() && styles.sendBtnActive]}
                onPress={sendMessage}
              >
                <Icon name="send" size={20} color="#d946ef" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>

    {/* ── Chat Preferences Modal ──────────────────────────────── */}
      <Modal visible={showChatMenuModal} transparent animationType="fade" onRequestClose={() => setShowChatMenuModal(false)}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(3, 3, 8, 0.88)', justifyContent: 'center', alignItems: 'center', padding: 16 }}
          activeOpacity={1}
          onPress={() => setShowChatMenuModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={{ width: '95%', maxHeight: '90%' }}
          >
            <ScrollView
              style={{ width: '100%' }}
              contentContainerStyle={{
                backgroundColor: '#090a10',
                borderRadius: 28,
                borderWidth: 1,
                borderColor: '#c8ff0040',
                padding: 22,
                gap: 16,
                shadowColor: '#c8ff00',
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.2,
                shadowRadius: 25,
                elevation: 15
              }}
              keyboardShouldPersistTaps="handled"
            >
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1e1e2c', paddingBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(200,255,0,0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#c8ff0040' }}>
                  <Text style={{ fontSize: 18 }}>⚙️</Text>
                </View>
                <Text style={{ color: '#c8ff00', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 }}>Chat Preferences</Text>
              </View>
              <TouchableOpacity 
                onPress={() => setShowChatMenuModal(false)}
                style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#161622', borderWidth: 1, borderColor: '#27272a' }}
              >
                <Text style={{ color: '#8b8ba7', fontSize: 12, fontWeight: '800' }}>✕ Close</Text>
              </TouchableOpacity>
            </View>

            {/* ── Profile Picture / Avatar ── */}
            <View style={{ gap: 8, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#1e1e2c' }}>
              <Text style={{ color: '#a3e635', fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>CONTACT AVATAR</Text>
              <Text style={{ color: '#f0f0ff', fontSize: 13, fontWeight: '700' }}>🖼️ Change Profile Picture / Emoji</Text>
              <Text style={{ color: '#8b8ba7', fontSize: 11 }}>Pick an emoji or type a custom icon for this contact</Text>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                {['💑', '👻', '🐱', '💖', '🔥', '⚡', '🎭', '🦋', '🌙', '🎮'].map(em => (
                  <TouchableOpacity
                    key={em}
                    style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: contact?.avatar === em ? 'rgba(200,255,0,0.18)' : '#12121a', borderWidth: 1, borderColor: contact?.avatar === em ? '#c8ff00' : '#1e1e2c', justifyContent: 'center', alignItems: 'center' }}
                    onPress={() => { if (onChangeAvatar) onChangeAvatar(contact.id || contact.userId, em) }}
                  >
                    <Text style={{ fontSize: 20 }}>{em}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={{ backgroundColor: '#12121a', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, color: '#f0f0ff', borderWidth: 1, borderColor: '#1e1e2c', fontSize: 14 }}
                placeholder="Or type any emoji / text…"
                placeholderTextColor="#4b5563"
                defaultValue={contact?.avatar || ''}
                onChangeText={(val) => { if (onChangeAvatar) onChangeAvatar(contact.id || contact.userId, val) }}
              />
            </View>

            {/* ── Lock Chat ── */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1e1e2c' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#f0f0ff', fontSize: 14, fontWeight: '800' }}>🔒 Lock Chat (Vault)</Text>
                <Text style={{ color: '#8b8ba7', fontSize: 11, marginTop: 2 }}>Move to Secret Vault — PIN + Fingerprint protected</Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => { if (onLockToggle) onLockToggle(contact.id || contact.userId) }}
                style={{
                  width: 52, height: 30, borderRadius: 15,
                  backgroundColor: isLocked ? '#c8ff00' : '#27272a',
                  padding: 3, justifyContent: 'center',
                  alignItems: isLocked ? 'flex-end' : 'flex-start',
                }}
              >
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: isLocked ? '#050608' : '#a1a1aa' }} />
              </TouchableOpacity>
            </View>

            {/* ── Disappearing Messages ── */}
            <View style={{ gap: 8, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#1e1e2c' }}>
              <Text style={{ color: '#a3e635', fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>DISAPPEARING MESSAGES</Text>
              <Text style={{ color: '#8b8ba7', fontSize: 11 }}>Messages self-delete after the selected time</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {['off', '24h', '7d', '30d'].map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={{
                      flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1,
                      borderColor: disappearingMode === time ? '#c8ff00' : '#1e1e2c',
                      backgroundColor: disappearingMode === time ? 'rgba(200,255,0,0.12)' : '#12121a',
                      alignItems: 'center',
                    }}
                    onPress={() => {
                      setDisappearingMode(time)
                      Alert.alert('⏳ Disappearing Messages', `Timer set to: ${time === 'off' ? 'Off' : time}`)
                    }}
                  >
                    <Text style={{ color: disappearingMode === time ? '#c8ff00' : '#f0f0ff', fontSize: 12, fontWeight: '800' }}>
                      {time.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* ── Add Member to Group ── (group chats only) */}
            {contact?.isGroup && (
              <View style={{ gap: 8, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#1e1e2c' }}>
                <Text style={{ color: '#a3e635', fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>GROUP MANAGEMENT</Text>
                <Text style={{ color: '#f0f0ff', fontSize: 13, fontWeight: '700' }}>➕ Add Member to Group</Text>
                <TextInput
                  style={{ backgroundColor: '#12121a', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, color: '#f0f0ff', borderWidth: 1, borderColor: '#1e1e2c', fontSize: 14 }}
                  placeholder="Enter @username to add…"
                  placeholderTextColor="#4b5563"
                  onSubmitEditing={(e) => {
                    const text = e.nativeEvent.text.trim()
                    if (onAddGroupMember && text) {
                      onAddGroupMember(contact.id || contact.userId, text)
                    }
                  }}
                  returnKeyType="send"
                />
              </View>
            )}

            {/* ── Contact Info Detail Display ── */}
            <View style={{ gap: 6, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1e1e2c' }}>
              <Text style={{ color: '#a3e635', fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>CONTACT DETAILS</Text>
              <Text style={{ color: '#f0f0ff', fontSize: 14, fontWeight: '700' }}>👤 Name: {contact?.name || 'Unknown'}</Text>
              <Text style={{ color: '#8b8ba7', fontSize: 13 }}>📱 Number/Email: {contact?.phoneNumber || 'not_shared_or_private@void.chat'}</Text>
            </View>

            {/* ── Search Message ── */}
            <View style={{ paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1e1e2c', gap: 6 }}>
              <Text style={{ color: '#a3e635', fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>SEARCH MESSAGES</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  style={{ flex: 1, backgroundColor: '#12121a', borderRadius: 12, paddingHorizontal: 14, color: '#f0f0ff', borderWidth: 1, borderColor: '#1e1e2c', fontSize: 13 }}
                  placeholder="Type to search in chat..."
                  placeholderTextColor="#4b5563"
                  value={searchMessageText}
                  onChangeText={setSearchMessageText}
                />
                <TouchableOpacity
                  style={{ backgroundColor: '#c8ff00', paddingHorizontal: 16, borderRadius: 12, justifyContent: 'center' }}
                  onPress={() => {
                    if (searchMessageText.trim()) {
                      const matched = messages.filter(m => (m.text || m.originalText || '').toLowerCase().includes(searchMessageText.toLowerCase()))
                      Alert.alert('Search Results', `Found ${matched.length} matching messages in this conversation.`)
                    } else {
                      Alert.alert('Info', 'Please enter text to search.')
                    }
                  }}
                >
                  <Text style={{ color: '#000', fontWeight: '900', fontSize: 12 }}>Find</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Media, Links & Docs ── */}
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1e1e2c' }}
              onPress={() => {
                setShowChatMenuModal(false)
                Alert.alert(
                  '📁 Media, Links & Docs',
                  'Shared Photos: 2\nShared Links: 1\nDocuments: 0',
                  [{ text: 'Close', style: 'cancel' }]
                )
              }}
            >
              <Text style={{ color: '#f0f0ff', fontSize: 14, fontWeight: '700' }}>📁 Media, Links & Docs</Text>
              <Text style={{ color: '#8b8ba7', fontSize: 12 }}>View all ›</Text>
            </TouchableOpacity>

            {/* ── Mute Notifications ── */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1e1e2c' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#f0f0ff', fontSize: 14, fontWeight: '700' }}>🔔 Mute Notifications</Text>
                <Text style={{ color: '#8b8ba7', fontSize: 11, marginTop: 2 }}>Silence alerts from this contact</Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setIsChatMuted(!isChatMuted)
                  Alert.alert(isChatMuted ? '🔔 Notifications Unmuted' : '🔕 Notifications Muted', `Alerts from @${contact?.name || 'User'} silenced.`)
                }}
                style={{
                  width: 52, height: 30, borderRadius: 15,
                  backgroundColor: isChatMuted ? '#c8ff00' : '#27272a',
                  padding: 3, justifyContent: 'center',
                  alignItems: isChatMuted ? 'flex-end' : 'flex-start',
                }}
              >
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: isChatMuted ? '#050608' : '#a1a1aa' }} />
              </TouchableOpacity>
            </View>

            {/* ── Chat Theme Selector ── */}
            <View style={{ gap: 8, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#1e1e2c' }}>
              <Text style={{ color: '#a3e635', fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>PERSONAL CHAT THEME</Text>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { id: 'classic_dark', label: 'Dark', color: '#0f0f15' },
                  { id: 'neon_glow', label: 'Neon', color: '#ff007f' },
                  { id: 'emerald_deep', label: 'Emerald', color: '#10b981' },
                  { id: 'sunset_dark', label: 'Sunset', color: '#f97316' }
                ].map(th => (
                  <TouchableOpacity
                    key={th.id}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 9,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: localChatTheme === th.id ? '#c8ff00' : '#1e1e2c',
                      backgroundColor: th.color + '25',
                    }}
                    onPress={() => {
                      setLocalChatTheme(th.id)
                      Alert.alert('Theme Updated', `Chat theme for ${contact?.name || 'User'} changed successfully!`)
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{th.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* ── Create Group ── (1-on-1 chats only) */}
            {!contact?.isGroup && (
              <TouchableOpacity
                style={{ backgroundColor: 'rgba(200,255,0,0.08)', borderWidth: 1, borderColor: '#c8ff0035', paddingVertical: 14, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                onPress={() => {
                  setShowChatMenuModal(false)
                  Alert.alert(
                    '👥 Create Group',
                    `Create a group and add ${contact?.name?.split(' ')[0] || 'this user'} as a member?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Go to Group Create', onPress: () => Alert.alert('Tip', 'Tap the + icon on the Chats screen to create a group, then add members from there.') }
                    ]
                  )
                }}
              >
                <Icon name="group_add" size={18} color="#c8ff00" />
                <Text style={{ color: '#c8ff00', fontSize: 13, fontWeight: '800' }}>Create Group with {contact?.name?.split(' ')[0] || 'User'}</Text>
              </TouchableOpacity>
            )}

            {/* ── Block / Unblock ── */}
            <TouchableOpacity
              style={{
                backgroundColor: isBlocked ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                borderWidth: 1,
                borderColor: isBlocked ? '#10b98140' : '#ef444440',
                paddingVertical: 14,
                borderRadius: 16,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8
              }}
              onPress={() => {
                if (onBlockToggle) {
                  onBlockToggle(contact.id || contact.userId)
                  setShowChatMenuModal(false)
                  Alert.alert(isBlocked ? '✅ User Unblocked' : '🚫 User Blocked', 'Status updated.')
                }
              }}
            >
              <Text style={{ color: isBlocked ? '#10b981' : '#f87171', fontSize: 14, fontWeight: '800' }}>
                {isBlocked ? '✅ Unblock User' : '🚫 Block User'}
              </Text>
            </TouchableOpacity>

            {/* ── Report User ── */}
            <TouchableOpacity
              style={{
                backgroundColor: 'rgba(239,68,68,0.12)',
                borderWidth: 1,
                borderColor: '#ef444440',
                paddingVertical: 14,
                borderRadius: 16,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8
              }}
              onPress={() => {
                setShowChatMenuModal(false)
                Alert.alert(
                  '📢 Report User',
                  `Are you sure you want to report @${contact?.name || 'User'}? This will submit a report to the Void Chat moderation team.`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Report', style: 'destructive', onPress: () => Alert.alert('Reported', 'User has been reported successfully.') }
                  ]
                )
              }}
            >
              <Text style={{ color: '#f87171', fontSize: 14, fontWeight: '800' }}>
                ⚠️ Report User
              </Text>
            </TouchableOpacity>

          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>

      {/* ── Image Preview Modal ── */}
      <Modal
        visible={!!previewImageUri}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPreviewImageUri(null)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(3, 3, 8, 0.95)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 400, backgroundColor: '#090a10', borderRadius: 28, borderWidth: 1, borderColor: '#c8ff0040', padding: 22, gap: 16, shadowColor: '#c8ff00', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 12 }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: '#c8ff00', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 }}>🖼️ Send Image</Text>
              <TouchableOpacity onPress={() => setPreviewImageUri(null)} style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 10, backgroundColor: '#161622' }}>
                <Text style={{ color: '#8b8ba7', fontSize: 12, fontWeight: '800' }}>✕ Cancel</Text>
              </TouchableOpacity>
            </View>

            {/* Image Preview Container */}
            <View style={{ width: '100%', height: 280, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#1e1e2d', backgroundColor: '#050508', justifyContent: 'center', alignItems: 'center' }}>
              {previewImageUri ? (
                <Image source={{ uri: previewImageUri }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
              ) : null}
            </View>

            {/* Actions */}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: '#161622',
                  borderWidth: 1,
                  borderColor: '#1e1e2c',
                  paddingVertical: 14,
                  borderRadius: 16,
                  alignItems: 'center'
                }}
                onPress={() => setPreviewImageUri(null)}
              >
                <Text style={{ color: '#8b8ba7', fontSize: 14, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: '#c8ff00',
                  paddingVertical: 14,
                  borderRadius: 16,
                  alignItems: 'center',
                  shadowColor: '#c8ff00',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                  elevation: 6
                }}
                onPress={handleSendPreviewImage}
              >
                <Text style={{ color: '#050608', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 }}>Send Image ⚡</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Custom Premium Alert Modal ── */}
      <Modal
        visible={!!customAlert}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCustomAlert(null)}
      >
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(3, 3, 8, 0.92)', justifyContent: 'center', alignItems: 'center', padding: 24 }}
          activeOpacity={1}
          onPress={() => setCustomAlert(null)}
        >
          <TouchableOpacity 
            activeOpacity={1}
            style={{
              width: '100%',
              maxWidth: 330,
              backgroundColor: '#090a10',
              borderRadius: 28,
              borderWidth: 1,
              borderColor: (theme.primary || '#c8ff00') + '40',
              padding: 24,
              alignItems: 'center',
              gap: 16,
              shadowColor: theme.primary || '#c8ff00',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.25,
              shadowRadius: 25,
              elevation: 15
            }}
          >
            {/* Alert Accent Indicator */}
            <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: (theme.primary || '#c8ff00') + '18', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: (theme.primary || '#c8ff00') + '40' }}>
              <Text style={{ fontSize: 22 }}>⚡</Text>
            </View>

            {/* Content */}
            <View style={{ alignItems: 'center', gap: 6 }}>
              <Text style={{ color: theme.text || '#f0f0ff', fontSize: 17, fontWeight: '900', textAlign: 'center', letterSpacing: 0.3 }}>
                {customAlert?.title}
              </Text>
              {customAlert?.message ? (
                <Text style={{ color: theme.subText || '#8b8ba7', fontSize: 13, textAlign: 'center', lineHeight: 19 }}>
                  {customAlert?.message}
                </Text>
              ) : null}
            </View>

            {/* Buttons Row / Column */}
            <View style={{ width: '100%', gap: 10, marginTop: 4 }}>
              {customAlert?.buttons.map((btn, idx) => {
                const isDestructive = btn.style === 'destructive'
                const isCancel = btn.style === 'cancel'
                
                return (
                  <TouchableOpacity
                    key={idx}
                    style={{
                      width: '100%',
                      backgroundColor: isDestructive 
                        ? '#ef4444' 
                        : (isCancel ? '#161622' : (theme.primary || '#c8ff00')),
                      borderWidth: isCancel ? 1 : 0,
                      borderColor: '#1e1e2c',
                      paddingVertical: 13,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: !isCancel && !isDestructive ? (theme.primary || '#c8ff00') : 'transparent',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.25,
                      shadowRadius: 10,
                      elevation: 5
                    }}
                    onPress={() => {
                      setCustomAlert(null)
                      if (btn.onPress) btn.onPress()
                    }}
                  >
                    <Text style={{
                      color: isDestructive 
                        ? '#ffffff' 
                        : (isCancel ? '#8b8ba7' : '#050608'),
                      fontSize: 14,
                      fontWeight: '900',
                      letterSpacing: 0.3
                    }}>
                      {btn.text}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  )
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    width: '100%',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },

  // ── Voice Recording ──────────────────────────────────────────
  recordingBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1a0000', paddingHorizontal: 16, paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: '#ff4d4d30', gap: 8,
  },
  recordingDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: '#ff4d4d',
  },
  recordingTime: { color: '#ff4d4d', fontWeight: '800', fontSize: 14 },
  recordingHint: { color: '#6b7280', fontSize: 12, flex: 1 },
  recordingCancelBtn: { padding: 4 },
  recordingCancelText: { color: '#ff4d4d', fontWeight: '900', fontSize: 18 },
  micBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#161622',
    borderWidth: 1,
    borderColor: '#1e1e2d',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
    flexShrink: 0,
  },
  micBtnActive: {
    opacity: 0.7,
    backgroundColor: '#1e1c0e',
  },
  micIcon: { fontSize: 20 },

  // ── Voice Bubble ─────────────────────────────────────────────
  voiceBubble: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 6, paddingHorizontal: 4, minWidth: 180,
  },
  voicePlayBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#c8ff0020', borderWidth: 1, borderColor: '#c8ff0050',
    justifyContent: 'center', alignItems: 'center',
  },
  voicePlayIcon: { fontSize: 14, color: '#c8ff00' },
  voiceWave: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    gap: 2, height: 30,
  },
  voiceBar: {
    width: 3, borderRadius: 2,
    backgroundColor: '#4b5563',
  },
  voiceDuration: {
    color: '#9ca3af', fontSize: 11, fontWeight: '600', minWidth: 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    gap: 8,
  },
  backBtn: { padding: 4 },
  backIcon: { fontSize: 22, color: '#f9fafb' },
  contactInfo: {
    flex: 1, flexDirection: 'row',
    alignItems: 'center', gap: 10,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#ec4899',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  contactName: { color: '#f9fafb', fontWeight: '700', fontSize: 14 },
  encStatus: { color: '#4ade80', fontSize: 11, marginTop: 1 },
  
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  privacyBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  privacyBtnOff: {},
  privacyBtnOn: {},
  privacyBtnText: { fontSize: 18 },
  
  callBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callIcon: { fontSize: 18 },
  
  streakBadge: {
    backgroundColor: '#1a0a00',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff4d4d30',
  },
  streakText: { color: '#ff4d4d', fontWeight: '800', fontSize: 10 },
  
  vcMenu: {
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    padding: 8,
    gap: 8,
  },
  vcOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  vcIcon: { fontSize: 24 },
  vcText: { flex: 1 },
  vcTitle: { color: '#f9fafb', fontWeight: '600', fontSize: 13 },
  vcDesc: { color: '#6b7280', fontSize: 11, marginTop: 2 },
  
  callOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 10, 10, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  
  callContainer: {
    width: '85%',
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d946ef40',
  },
  
  callInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  
  callAvatar: {
    width: 80, height: 80,
    borderRadius: 40,
    backgroundColor: '#d946ef',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  callAvatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
  },
  
  callName: {
    color: '#f9fafb',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  
  callType: {
    color: '#d946ef',
    fontSize: 13,
    marginTop: 4,
    fontWeight: '600',
  },
  
  callDuration: {
    color: '#6b7280',
    fontSize: 14,
    marginTop: 8,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  
  callControls: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  
  callingScreenBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2a2a2a',
  },
  
  callBtnActive: {
    backgroundColor: '#d946ef20',
    borderColor: '#d946ef',
  },
  
  callBtnEnd: {
    backgroundColor: '#ff4d4d20',
    borderColor: '#ff4d4d',
  },
  
  callBtnIcon: {
    fontSize: 28,
  },
  
  callBtnLabel: {
    color: '#f9fafb',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
  
  callStatus: {
    backgroundColor: '#1a0a0a',
    borderBottomWidth: 1,
    borderBottomColor: '#ff4d4d40',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  callStatusIcon: { fontSize: 16 },
  callStatusText: { color: '#ff4d4d', fontWeight: '600', fontSize: 12, flex: 1 },
  endCallBtn: {
    backgroundColor: '#ff4d4d',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  endCallText: { color: '#fff', fontWeight: '600', fontSize: 11 },
  
  VOIDBar: {
    backgroundColor: '#1a2a00',
    padding: 8,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#c8ff0020',
  },
  VOIDBarText: { color: '#c8ff00', fontSize: 11, fontWeight: '600' },
  messages: { flex: 1 },
  msgRow: { flexDirection: 'row', marginBottom: 4 },
  msgRowMe: { justifyContent: 'flex-end' },
  msgRowThem: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '75%',
    borderRadius: 16,
    padding: 10,
  },
  bubbleMe: {
    backgroundColor: '#d946ef',
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: '#1f2937',
    borderBottomLeftRadius: 4,
  },
  msgText: { color: '#f9fafb', fontSize: 14, lineHeight: 20 },
  msgMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    justifyContent: 'flex-end',
  },
  msgTime: { color: '#ffffff60', fontSize: 10 },
  msgStatus: { color: '#a5b4fc', fontSize: 10 },
  msgLock: { fontSize: 8, opacity: 0.5 },
  inputArea: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    backgroundColor: '#0a0a0a',
    paddingBottom: Platform.OS === 'android' ? 24 : 10,
  },
  blockedBannerContainer: {
    padding: 20,
    backgroundColor: '#160a0a',
    borderTopWidth: 1,
    borderTopColor: '#ef444430',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockedBannerText: {
    color: '#f87171',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  encIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
    paddingLeft: 4,
  },
  encDot: {
    width: 6, height: 6,
    borderRadius: 3,
    backgroundColor: '#d946ef',
  },
  encText: { color: '#d946ef', fontSize: 11, fontWeight: '500' },
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  input: {
    flex: 1,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#f9fafb',
    fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#161622',
    borderWidth: 1,
    borderColor: '#1e1e2d',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
    flexShrink: 0,
  },
  sendBtnActive: {
    backgroundColor: '#1e1c0e',
  },
  sendIcon: { fontSize: 20, color: '#d946ef' },
  
  mediaBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#161622',
    borderWidth: 1,
    borderColor: '#1e1e2d',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
    flexShrink: 0,
  },
  mediaBtnIcon: { fontSize: 24, color: '#d946ef', fontWeight: '300' },
  
  mediaMenu: {
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    gap: 8,
  },
  
  mediaOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  
  mediaIcon: { fontSize: 28, marginBottom: 4 },
  mediaLabel: { color: '#f9fafb', fontSize: 10, fontWeight: '600' },
  
  imageBubble: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0a0a0a',
    minWidth: 200,
    minHeight: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  imagePlaceholder: { fontSize: 64, marginBottom: 8 },
  imageText: { color: '#f9fafb', fontSize: 12, fontWeight: '600' },
  
  forwardStatus: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 4,
    alignItems: 'center',
  },
  
  forwardStatusText: { fontSize: 10, fontWeight: '700' },
  
  locationBubble: {
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#0a1a2e',
    minWidth: 180,
  },
  
  locationText: { color: '#f9fafb', fontSize: 13, fontWeight: '600', marginBottom: 8 },
  
  mapBtn: {
    backgroundColor: '#d946ef',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  
  mapBtnText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  
  contactBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    backgroundColor: '#0a1a1a',
    borderRadius: 12,
  },
  
  contactAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#d946ef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  contactAvatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  
  contactInfo2: { flex: 1 },
  contactName2: { color: '#f9fafb', fontWeight: '700', fontSize: 12 },
  contactPhone: { color: '#6b7280', fontSize: 10, marginTop: 2 },
  
  addContactBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#d946ef20',
    borderWidth: 1,
    borderColor: '#d946ef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  addContactText: { color: '#d946ef', fontSize: 18, fontWeight: '700' },
  
  docBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#0a1a0a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4ade8030',
  },
  
  docIcon: { fontSize: 32 },
  docInfo: { flex: 1 },
  docName: { color: '#f9fafb', fontWeight: '600', fontSize: 12 },
  
  downloadBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4ade8020',
    borderWidth: 1,
    borderColor: '#4ade80',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  downloadText: { fontSize: 16 },
  
  permBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  permBtnIcon: { fontSize: 18 },
  
  permissionBubble: {
    backgroundColor: '#1a0a2e',
    borderLeftWidth: 3,
    borderLeftColor: '#d946ef',
    padding: 12,
  },
  
  permissionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  
  permissionIcon: { fontSize: 24 },
  permissionText: { flex: 1 },
  permissionTitle: { color: '#d946ef', fontWeight: '700', fontSize: 12 },
  permissionDesc: { color: '#f9fafb', fontSize: 11, marginTop: 2, fontWeight: '500' },
  
  permissionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  
  approveBtn: {
    flex: 1,
    backgroundColor: '#4ade8030',
    borderWidth: 1,
    borderColor: '#4ade80',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  
  approveBtnText: {
    color: '#4ade80',
    fontWeight: '700',
    fontSize: 12,
  },
  
  denyBtn: {
    flex: 1,
    backgroundColor: '#ff4d4d30',
    borderWidth: 1,
    borderColor: '#ff4d4d',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  
  denyBtnText: {
    color: '#ff4d4d',
    fontWeight: '700',
    fontSize: 12,
  },
  
  permissionStatusApproved: {
    backgroundColor: '#4ade8020',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  
  permissionStatusDenied: {
    backgroundColor: '#ff4d4d20',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  
  permissionStatusText: {
    fontWeight: '700',
    fontSize: 11,
  },
  
  // Filter Menu Styles
  filterMenu: {
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  
  filterTitle: {
    color: '#d946ef',
    fontWeight: '700',
    fontSize: 13,
  },
  
  filterClose: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '700',
  },
  
  filterScroll: {
    flexDirection: 'row',
    paddingHorizontal: 4,
  },
  
  filterOption: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#3f3f3f',
  },
  
  filterOptionActive: {
    backgroundColor: '#d946ef20',
    borderColor: '#d946ef',
  },
  
  filterEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  
  filterLabel: {
    color: '#f9fafb',
    fontSize: 10,
    fontWeight: '600',
  },
  
  filterBadge: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(217, 70, 239, 0.2)',
    borderRadius: 4,
    color: '#d946ef',
    fontSize: 10,
    fontWeight: '700',
  },
  
  // Camera Roll Styles
  cameraRollBtn: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    position: 'relative',
  },
  
  cameraRollBtnActive: {
    opacity: 0.8,
  },
  
  cameraRollIcon: { fontSize: 18 },
  
  cameraRollBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#d946ef',
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    width: 20,
    height: 20,
    borderRadius: 10,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  
  cameraRollContainer: {
    maxHeight: 250,
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  
  cameraRollHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  
  cameraRollTitle: {
    color: '#d946ef',
    fontWeight: '700',
    fontSize: 13,
  },
  
  cameraRollClose: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '700',
  },
  
  cameraRollScroll: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  
  emptyRoll: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  emptyRollText: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '600',
  },
  
  draftItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  
  draftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  
  draftEmoji: { fontSize: 32 },
  
  draftInfo: { flex: 1 },
  
  draftType: { color: '#f9fafb', fontWeight: '700', fontSize: 11 },
  
  draftMeta: { color: '#6b7280', fontSize: 10, marginTop: 2 },
  
  draftActions: {
    flexDirection: 'row',
    gap: 6,
  },
  
  draftViewBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1a3a2e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4ade8030',
  },
  
  draftViewIcon: { fontSize: 14 },
  
  draftSendBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2e1a3a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d946ef30',
  },
  
  draftSendIcon: { fontSize: 14 },
  
  draftDeleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff4d4d30',
  },
  
  draftDeleteIcon: { fontSize: 14 },
  
  // Draft Preview Styles
  previewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  
  previewModal: {
    backgroundColor: '#0a0a0a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1a1a1a',
    width: '80%',
    padding: 16,
  },
  
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  previewTitle: {
    color: '#d946ef',
    fontWeight: '700',
    fontSize: 14,
  },
  
  previewClose: {
    color: '#6b7280',
    fontSize: 18,
    fontWeight: '700',
  },
  
  previewContent: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 12,
  },
  
  previewEmoji: { fontSize: 80, marginBottom: 8 },
  
  previewDetails: {
    alignItems: 'center',
  },
  
  previewFilterLabel: {
    color: '#d946ef',
    fontWeight: '700',
    fontSize: 12,
  },
  
  previewTime: {
    color: '#6b7280',
    fontSize: 10,
    marginTop: 4,
  },
  
  previewActions: {
    flexDirection: 'row',
    gap: 8,
  },
  
  previewSendBtn: {
    flex: 1,
    backgroundColor: '#2e3a1a',
    borderWidth: 1,
    borderColor: '#d946ef',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  
  previewSendText: {
    color: '#d946ef',
    fontWeight: '700',
    fontSize: 12,
  },
  
  previewDeleteBtn: {
    flex: 1,
    backgroundColor: '#3a1a1a',
    borderWidth: 1,
    borderColor: '#ff4d4d',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  
  previewDeleteText: {
    color: '#ff4d4d',
    fontWeight: '700',
    fontSize: 12,
  },

  // ── Incoming Call Modal Styles ──────────────────────────────
  incomingCallModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 40,
  },

  incomingCallCard: {
    backgroundColor: '#0e0e14',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1e1e2c',
    padding: 28,
    alignItems: 'center',
    width: '90%',
    gap: 12,
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 20,
  },

  incomingCallName: {
    color: '#f0f0ff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  incomingCallType: {
    color: '#6b7280',
    fontSize: 14,
    marginBottom: 8,
  },

  incomingCallBtns: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 8,
  },

  rejectCallBtn: {
    backgroundColor: '#3a0a0a',
    borderWidth: 1,
    borderColor: '#ff4d4d',
    borderRadius: 50,
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff4d4d',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },

  rejectCallIcon: { fontSize: 26 },
  rejectCallText: { color: '#ff4d4d', fontSize: 10, fontWeight: '700', marginTop: 2 },

  answerCallBtn: {
    backgroundColor: '#0a2a0a',
    borderWidth: 1,
    borderColor: '#4ade80',
    borderRadius: 50,
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4ade80',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },

  answerCallIcon: { fontSize: 26 },
  answerCallText: { color: '#4ade80', fontSize: 10, fontWeight: '700', marginTop: 2 },

  // ── Video Call Styles ──────────────────────────────────────
  videoContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 1,
  },

  remoteVideo: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#000',
  },

  localVideo: {
    position: 'absolute',
    top: 20,
    right: 16,
    width: 100,
    height: 140,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#a855f7',
    overflow: 'hidden',
    zIndex: 10,
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 10,
  },
})