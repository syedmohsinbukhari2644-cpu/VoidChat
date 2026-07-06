import { useState, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, Alert, Modal
} from 'react-native'
import { RTCView } from 'react-native-webrtc'
import { encryptMessage, decryptMessage, isEncrypted } from '../../utils/encryption'
import webrtcService from '../../utils/webrtcService'

const mockMessages = [
  {
    id: '1',
    from: 'them',
    type: 'text',
    text: 'Salam! VOID CHAT pe aakar acha laga 🔓',
    time: '10:30',
    streak: false
  },
  {
    id: '2',
    from: 'me',
    type: 'text',
    text: 'Haan yaar! Yahan sab private hai 🔐',
    time: '10:31',
    streak: false
  },
  {
    id: '3',
    from: 'them',
    type: 'text',
    text: 'Streak maintain karo — VOID milega! 🔥',
    time: '10:32',
    streak: true
  },
]

export default function ChatScreen({ contact, onBack }) {
  const [messages, setMessages] = useState(mockMessages)
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

  const formatCallDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  const sendMessage = () => {
    if (!input.trim()) return
    const newMsg = {
      id: Date.now().toString(),
      from: 'me',
      type: 'text',
      text: encryptMessage(input.trim()),
      originalText: input.trim(), // Keep original for sender view
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit', minute: '2-digit'
      }),
      streak: false
    }
    setMessages(prev => [...prev, newMsg])
    setInput('')
    setStreak(prev => prev + 1)
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

  const sendPhoto = () => {
    Alert.alert('📷 Camera', 'Take a photo with filter?', [
      { text: 'Cancel', onPress: () => setShowFilterMenu(false) },
      { 
        text: 'Select Filter', 
        onPress: () => setShowFilterMenu(true)
      },
      { 
        text: 'Take Photo Now', 
        onPress: () => {
          const filterLabel = cameraFilters.find(f => f.name === selectedFilter)?.label
          Alert.alert(
            '💾 Save Options',
            'What do you want to do?',
            [
              {
                text: '❌ Cancel',
                onPress: () => {}
              },
              {
                text: '📱 Gallery',
                onPress: () => savePhotoToGallery(selectedFilter)
              },
              {
                text: '💾 Draft',
                onPress: () => savePhotoToDraft(selectedFilter)
              },
              {
                text: '✈️ Send Now',
                onPress: () => {
                  const msg = {
                    id: Date.now().toString(),
                    from: 'me',
                    type: 'image',
                    content: `📷 Photo sent ${selectedFilter !== 'normal' ? `(${filterLabel} filter)` : ''}`,
                    filter: selectedFilter,
                    time: new Date().toLocaleTimeString([], {
                      hour: '2-digit', minute: '2-digit'
                    }),
                    streak: false
                  }
                  setMessages(prev => [...prev, msg])
                  setShowMediaMenu(false)
                  setShowFilterMenu(false)
                  setStreak(prev => prev + 1)
                }
              }
            ]
          )
        }
      }
    ])
  }

  const sendFromGallery = () => {
    Alert.alert('🖼️ Gallery', 'Pick an image from your gallery', [
      { text: 'Cancel', onPress: () => {} },
      { 
        text: 'Select Image', 
        onPress: () => {
          const msg = {
            id: Date.now().toString(),
            from: 'me',
            type: 'image',
            content: '🖼️ Image shared',
            time: new Date().toLocaleTimeString([], {
              hour: '2-digit', minute: '2-digit'
            }),
            streak: false
          }
          setMessages(prev => [...prev, msg])
          setShowMediaMenu(false)
          setStreak(prev => prev + 1)
        }
      }
    ])
  }

  const shareLocation = () => {
    Alert.alert('📍 Share Location', 'Share your live location?', [
      { text: 'Cancel', onPress: () => {} },
      { 
        text: 'Share', 
        onPress: () => {
          const msg = {
            id: Date.now().toString(),
            from: 'me',
            type: 'location',
            content: '📍 Location: Karachi, Pakistan',
            time: new Date().toLocaleTimeString([], {
              hour: '2-digit', minute: '2-digit'
            }),
            streak: false
          }
          setMessages(prev => [...prev, msg])
          setShowMediaMenu(false)
          setStreak(prev => prev + 1)
        }
      }
    ])
  }

  const shareContact = () => {
    Alert.alert('👤 Share Contact', 'Pick a contact to share', [
      { text: 'Cancel', onPress: () => {} },
      { 
        text: 'Select Contact', 
        onPress: () => {
          const msg = {
            id: Date.now().toString(),
            from: 'me',
            type: 'contact',
            contact: { name: 'Ali Khan', phone: '+92 300 1234567' },
            time: new Date().toLocaleTimeString([], {
              hour: '2-digit', minute: '2-digit'
            }),
            streak: false
          }
          setMessages(prev => [...prev, msg])
          setShowMediaMenu(false)
          setStreak(prev => prev + 1)
        }
      }
    ])
  }

  const shareDocument = () => {
    Alert.alert('📄 Share Document', 'Pick a document to share', [
      { text: 'Cancel', onPress: () => {} },
      { 
        text: 'Select Document', 
        onPress: () => {
          const msg = {
            id: Date.now().toString(),
            from: 'me',
            type: 'document',
            content: '📄 Document.pdf (2.4 MB)',
            time: new Date().toLocaleTimeString([], {
              hour: '2-digit', minute: '2-digit'
            }),
            streak: false
          }
          setMessages(prev => [...prev, msg])
          setShowMediaMenu(false)
          setStreak(prev => prev + 1)
        }
      }
    ])
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
      `Send request to ${contact?.name || 'Zara'}: "${permissionLabels[permissionType]}"`,
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
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.contactInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {contact?.name?.[0] || 'Z'}
            </Text>
          </View>
          <View>
            <Text style={styles.contactName}>
              {contact?.name || 'Zara 💑'}
            </Text>
            <Text style={styles.encStatus}>
              {onCall ? '🔴 On Call' : '🔐 E2E Encrypted'}
            </Text>
          </View>
        </View>
        
        {/* Privacy Controls */}
        <View style={styles.headerControls}>
          <TouchableOpacity 
            onPress={toggleScreenshot}
            style={[
              styles.privacyBtn,
              screenshotAllowed ? styles.privacyBtnOff : styles.privacyBtnOn
            ]}
          >
            <Text style={styles.privacyBtnText}>
              {screenshotAllowed ? '📸' : '📵'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.permBtn}
            onPress={() => {
              Alert.alert(
                '🔐 Permissions',
                `${contact?.name || 'Zara'}'s Permissions:\n\n` +
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
            <Text style={styles.permBtnIcon}>🔒</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => setShowVCMenu(!showVCMenu)}
            style={styles.callBtn}
          >
            <Text style={styles.callIcon}>{onCall ? '📞' : '☎️'}</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.streakBadge}>
          <Text style={styles.streakText}>🔥 {streak}</Text>
        </View>
      </View>

      {/* VC Menu */}
      {showVCMenu && (
        <View style={styles.vcMenu}>
          <TouchableOpacity 
            style={styles.vcOption}
            onPress={startVoiceCall}
          >
            <Text style={styles.vcIcon}>🎤</Text>
            <View style={styles.vcText}>
              <Text style={styles.vcTitle}>Voice Call</Text>
              <Text style={styles.vcDesc}>Start voice conversation</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.vcOption}
            onPress={startVideoCall}
          >
            <Text style={styles.vcIcon}>📹</Text>
            <View style={styles.vcText}>
              <Text style={styles.vcTitle}>Video Call</Text>
              <Text style={styles.vcDesc}>Start video conversation</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

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
            <Text style={styles.incomingCallType}>
              {incomingCall?.callType === 'video' ? '📹 Video Call aaya!' : '🎤 Voice Call aaya!'}
            </Text>
            <View style={styles.incomingCallBtns}>
              <TouchableOpacity
                style={styles.rejectCallBtn}
                onPress={rejectIncomingCall}
              >
                <Text style={styles.rejectCallIcon}>📵</Text>
                <Text style={styles.rejectCallText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.answerCallBtn}
                onPress={answerIncomingCall}
              >
                <Text style={styles.answerCallIcon}>📞</Text>
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
                    {contact?.name?.[0] || 'Z'}
                  </Text>
                </View>
                <View style={styles.callDetails}>
                  <Text style={styles.callName}>{contact?.name || 'Zara 💑'}</Text>
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
                style={[styles.callBtn, isMuted && styles.callBtnActive]}
                onPress={toggleMute}
              >
                <Text style={styles.callBtnIcon}>{isMuted ? '🔇' : '🎤'}</Text>
                <Text style={styles.callBtnLabel}>{isMuted ? 'Muted' : 'Mute'}</Text>
              </TouchableOpacity>

              {callType === 'video' && (
                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={switchCamera}
                >
                  <Text style={styles.callBtnIcon}>🔄</Text>
                  <Text style={styles.callBtnLabel}>Flip</Text>
                </TouchableOpacity>
              )}

              {callType === 'voice' && (
                <TouchableOpacity
                  style={[styles.callBtn, isSpeaker && styles.callBtnActive]}
                  onPress={toggleSpeaker}
                >
                  <Text style={styles.callBtnIcon}>{isSpeaker ? '🔊' : '📱'}</Text>
                  <Text style={styles.callBtnLabel}>{isSpeaker ? 'Speaker' : 'Phone'}</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.callBtn, styles.callBtnEnd]}
                onPress={endCall}
              >
                <Text style={styles.callBtnIcon}>📞</Text>
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

      {/* Messages */}
      <ScrollView style={styles.messages} contentContainerStyle={{ padding: 16, gap: 8 }}>
        {messages.map(msg => (
          <View
            key={msg.id}
            style={[
              styles.msgRow,
              msg.from === 'me' ? styles.msgRowMe : styles.msgRowThem
            ]}
          >
            {msg.type === 'image' && (
              <View style={[styles.bubble, msg.from === 'me' ? styles.bubbleMe : styles.bubbleThem]}>
                <View style={[styles.imageBubble, msg.filter && getFilterStyle(msg.filter)]}>
                  <Text style={styles.imagePlaceholder}>🖼️</Text>
                  <Text style={styles.imageText}>{msg.content}</Text>
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
                  <Text style={styles.msgTime}>{msg.time}</Text>
                  {msg.from === 'me' && <Text style={styles.msgStatus}>✓✓</Text>}
                  <Text style={styles.msgLock}>🔒</Text>
                </View>
              </View>
            )}
            
            {msg.type === 'location' && (
              <View style={[styles.bubble, msg.from === 'me' ? styles.bubbleMe : styles.bubbleThem]}>
                <View style={styles.locationBubble}>
                  <Text style={styles.locationText}>{msg.content}</Text>
                  <TouchableOpacity style={styles.mapBtn}>
                    <Text style={styles.mapBtnText}>View on Map</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.msgMeta}>
                  <Text style={styles.msgTime}>{msg.time}</Text>
                  {msg.from === 'me' && <Text style={styles.msgStatus}>✓✓</Text>}
                  <Text style={styles.msgLock}>🔒</Text>
                </View>
              </View>
            )}
            
            {msg.type === 'contact' && (
              <View style={[styles.bubble, msg.from === 'me' ? styles.bubbleMe : styles.bubbleThem]}>
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
                  <Text style={styles.msgTime}>{msg.time}</Text>
                  {msg.from === 'me' && <Text style={styles.msgStatus}>✓✓</Text>}
                  <Text style={styles.msgLock}>🔒</Text>
                </View>
              </View>
            )}
            
            {msg.type === 'document' && (
              <View style={[styles.bubble, msg.from === 'me' ? styles.bubbleMe : styles.bubbleThem]}>
                <View style={styles.docBubble}>
                  <Text style={styles.docIcon}>📄</Text>
                  <View style={styles.docInfo}>
                    <Text style={styles.docName}>{msg.content}</Text>
                  </View>
                  <TouchableOpacity style={styles.downloadBtn}>
                    <Text style={styles.downloadText}>⬇️</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.msgMeta}>
                  <Text style={styles.msgTime}>{msg.time}</Text>
                  {msg.from === 'me' && <Text style={styles.msgStatus}>✓✓</Text>}
                  <Text style={styles.msgLock}>🔒</Text>
                </View>
              </View>
            )}
            
            {msg.type === 'permissionRequest' && (
              <View style={[styles.bubble, styles.permissionBubble]}>
                <View style={styles.permissionContent}>
                  <Text style={styles.permissionIcon}>🔐</Text>
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
            
            {msg.type === 'text' && (
              <View style={[styles.bubble, msg.from === 'me' ? styles.bubbleMe : styles.bubbleThem]}>
                {msg.from === 'me' ? (
                  <Text style={styles.msgText}>{msg.originalText || decryptMessage(msg.text)}</Text>
                ) : (
                  <Text style={styles.msgText}>{decryptMessage(msg.text)}</Text>
                )}
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
                      <Text style={styles.draftViewIcon}>👁️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.draftSendBtn}
                      onPress={() => sendFromDraft(draft)}
                    >
                      <Text style={styles.draftSendIcon}>✈️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.draftDeleteBtn}
                      onPress={() => deleteDraft(draft.id)}
                    >
                      <Text style={styles.draftDeleteIcon}>🗑️</Text>
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

      {/* Media Menu */}
      {showMediaMenu && (
        <View style={styles.mediaMenu}>
          <TouchableOpacity style={styles.mediaOption} onPress={sendPhoto}>
            <Text style={styles.mediaIcon}>📷</Text>
            <Text style={styles.mediaLabel}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mediaOption} onPress={sendFromGallery}>
            <Text style={styles.mediaIcon}>🖼️</Text>
            <Text style={styles.mediaLabel}>Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mediaOption} onPress={shareLocation}>
            <Text style={styles.mediaIcon}>📍</Text>
            <Text style={styles.mediaLabel}>Location</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mediaOption} onPress={shareContact}>
            <Text style={styles.mediaIcon}>👤</Text>
            <Text style={styles.mediaLabel}>Contact</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mediaOption} onPress={shareDocument}>
            <Text style={styles.mediaIcon}>📄</Text>
            <Text style={styles.mediaLabel}>Document</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.inputArea}>
          <View style={styles.encIndicator}>
            <View style={styles.encDot} />
            <Text style={styles.encText}>
              {screenshotAllowed ? '📸 Screenshots allowed' : '📵 Screenshots blocked'}
            </Text>
          </View>
          <View style={styles.inputRow}>
            <TouchableOpacity 
              style={styles.mediaBtn}
              onPress={() => setShowMediaMenu(!showMediaMenu)}
            >
              <Text style={styles.mediaBtnIcon}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.cameraRollBtn, cameraRoll.length > 0 && styles.cameraRollBtnActive]}
              onPress={() => setShowCameraRoll(!showCameraRoll)}
            >
              <Text style={styles.cameraRollIcon}>📷</Text>
              {cameraRoll.length > 0 && (
                <Text style={styles.cameraRollBadge}>{cameraRoll.length}</Text>
              )}
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="Message likho..."
              placeholderTextColor="#4b5563"
              value={input}
              onChangeText={setInput}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, input.trim() && styles.sendBtnActive]}
              onPress={sendMessage}
            >
              <Text style={styles.sendIcon}>➤</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
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
    width: 36, height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  privacyBtnOff: {
    backgroundColor: '#ff4d4d20',
    borderColor: '#ff4d4d',
  },
  privacyBtnOn: {
    backgroundColor: '#4ade8020',
    borderColor: '#4ade80',
  },
  privacyBtnText: { fontSize: 18 },
  
  callBtn: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  callIcon: { fontSize: 18 },
  
  streakBadge: {
    backgroundColor: '#1a0a00',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ff4d4d30',
  },
  streakText: { color: '#ff4d4d', fontWeight: '800', fontSize: 11 },
  
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
  
  callBtn: {
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
    width: 42, height: 42,
    borderRadius: 21,
    backgroundColor: '#1f2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnActive: { backgroundColor: '#d946ef' },
  sendIcon: { fontSize: 18, color: '#fff' },
  
  mediaBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: '#d946ef20',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#d946ef',
    marginRight: 4,
  },
  mediaBtnIcon: { fontSize: 20, color: '#d946ef', fontWeight: '800' },
  
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
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: '#1a0a2e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#d946ef',
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3f3f3f',
    marginLeft: 8,
    position: 'relative',
  },
  
  cameraRollBtnActive: {
    backgroundColor: '#d946ef20',
    borderColor: '#d946ef',
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