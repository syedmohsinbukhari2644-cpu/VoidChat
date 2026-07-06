import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  mediaDevices,
} from 'react-native-webrtc'
import io from 'socket.io-client'

// ── Config ─────────────────────────────────────────────────────
const SOCKET_URL = 'https://void-chat-hchu.vercel.app'
// NOTE: Agar locally test kar rahe ho toh: 'http://192.168.x.x:3000'

// Google ke free STUN servers
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
}

// ── WebRTC Service (Singleton) ─────────────────────────────────
class WebRTCService {
  constructor() {
    this.socket         = null
    this.peerConnection = null
    this.localStream    = null
    this.remoteStream   = null
    this.currentUserId  = null
    this.remoteUserId   = null

    // ── Callbacks (screen.js inhe set karega) ─────────────────
    this.onIncomingCall   = null  // ({ from, fromName, offer, callType })
    this.onCallAccepted   = null  // ()
    this.onCallRejected   = null  // ()
    this.onCallEnded      = null  // ()
    this.onRemoteStream   = null  // (stream)
    this.onCallUnavailable= null  // (userId)
  }

  // ── Socket Connect ─────────────────────────────────────────
  connect(userId, displayName = '') {
    if (this.socket?.connected) return

    this.currentUserId = userId

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
    })

    this.socket.on('connect', () => {
      console.log('🔌 Socket connected:', this.socket.id)
      this.socket.emit('user-online', userId)
    })

    this.socket.on('disconnect', () => {
      console.log('❌ Socket disconnected')
    })

    // ── Incoming call ────────────────────────────────────────
    this.socket.on('incoming-call', ({ from, fromName, offer, callType }) => {
      this.remoteUserId = from
      this.onIncomingCall?.({ from, fromName, offer, callType })
    })

    // ── Call accepted by callee ──────────────────────────────
    this.socket.on('call-accepted', async ({ answer }) => {
      try {
        await this.peerConnection?.setRemoteDescription(
          new RTCSessionDescription(answer)
        )
        this.onCallAccepted?.()
      } catch (err) {
        console.error('call-accepted error:', err)
      }
    })

    // ── ICE candidate from remote ────────────────────────────
    this.socket.on('ice-candidate', async ({ candidate }) => {
      try {
        if (candidate && this.peerConnection) {
          await this.peerConnection.addIceCandidate(
            new RTCIceCandidate(candidate)
          )
        }
      } catch (err) {
        console.error('ice-candidate error:', err)
      }
    })

    // ── Call rejected ────────────────────────────────────────
    this.socket.on('call-rejected', () => {
      this.onCallRejected?.()
      this.cleanupCall()
    })

    // ── Call ended by other side ─────────────────────────────
    this.socket.on('call-ended', () => {
      this.onCallEnded?.()
      this.cleanupCall()
    })

    // ── Callee offline ───────────────────────────────────────
    this.socket.on('call-unavailable', ({ userId }) => {
      this.onCallUnavailable?.(userId)
      this.cleanupCall()
    })
  }

  // ── Get Local Stream (mic/camera) ─────────────────────────
  async getLocalStream(isVideo = false) {
    const constraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100,
      },
      video: isVideo
        ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
        : false,
    }

    try {
      const stream = await mediaDevices.getUserMedia(constraints)
      this.localStream = stream
      return stream
    } catch (err) {
      console.error('getUserMedia error:', err)
      throw err
    }
  }

  // ── Create Peer Connection ─────────────────────────────────
  _createPeerConnection(targetUserId) {
    const pc = new RTCPeerConnection(ICE_SERVERS)

    // Local tracks add karo
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream)
      })
    }

    // Remote stream receive karo
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0]
        this.onRemoteStream?.(event.streams[0])
      }
    }

    // ICE candidates bhejo
    pc.onicecandidate = ({ candidate }) => {
      if (candidate && this.socket?.connected) {
        this.socket.emit('ice-candidate', {
          to: targetUserId,
          candidate,
        })
      }
    }

    pc.onconnectionstatechange = () => {
      console.log('📡 Connection state:', pc.connectionState)
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        this.onCallEnded?.()
        this.cleanupCall()
      }
    }

    this.peerConnection = pc
    return pc
  }

  // ── Start Call (Caller side) ───────────────────────────────
  async startCall(targetUserId, callType = 'voice', fromName = '') {
    this.remoteUserId = targetUserId
    const isVideo = callType === 'video'

    // Local stream lo
    const stream = await this.getLocalStream(isVideo)

    // Peer connection banao
    const pc = this._createPeerConnection(targetUserId)

    // Offer banao
    const offer = await pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: isVideo,
    })
    await pc.setLocalDescription(offer)

    // Server ko batao
    this.socket.emit('call-user', {
      to: targetUserId,
      from: this.currentUserId,
      fromName,
      offer,
      callType,
    })

    return stream
  }

  // ── Answer Call (Callee side) ──────────────────────────────
  async answerCall(callerUserId, offer, callType = 'voice') {
    this.remoteUserId = callerUserId
    const isVideo = callType === 'video'

    // Local stream lo
    const stream = await this.getLocalStream(isVideo)

    // Peer connection banao
    const pc = this._createPeerConnection(callerUserId)

    // Remote offer set karo
    await pc.setRemoteDescription(new RTCSessionDescription(offer))

    // Answer banao
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    // Server ko bhejo
    this.socket.emit('call-accepted', {
      to: callerUserId,
      answer,
    })

    return stream
  }

  // ── Reject Call ────────────────────────────────────────────
  rejectCall(callerUserId) {
    this.socket?.emit('call-rejected', { to: callerUserId })
    this.cleanupCall()
  }

  // ── End Call ──────────────────────────────────────────────
  endCall() {
    if (this.remoteUserId) {
      this.socket?.emit('call-ended', { to: this.remoteUserId })
    }
    this.cleanupCall()
  }

  // ── Toggle Mute ───────────────────────────────────────────
  toggleMute() {
    const audioTracks = this.localStream?.getAudioTracks() || []
    audioTracks.forEach(track => {
      track.enabled = !track.enabled
    })
    return audioTracks[0]?.enabled === false // isMuted
  }

  // ── Toggle Camera ─────────────────────────────────────────
  toggleCamera() {
    const videoTracks = this.localStream?.getVideoTracks() || []
    videoTracks.forEach(track => {
      track.enabled = !track.enabled
    })
    return videoTracks[0]?.enabled === false // isCameraOff
  }

  // ── Switch Camera (front/back) ────────────────────────────
  switchCamera() {
    const videoTrack = this.localStream?.getVideoTracks()[0]
    if (videoTrack && videoTrack._switchCamera) {
      videoTrack._switchCamera()
    }
  }

  // ── Cleanup after call ends ───────────────────────────────
  cleanupCall() {
    this.localStream?.getTracks().forEach(track => track.stop())
    this.peerConnection?.close()
    this.localStream    = null
    this.peerConnection = null
    this.remoteStream   = null
    this.remoteUserId   = null
  }

  // ── Full disconnect ───────────────────────────────────────
  disconnect() {
    this.cleanupCall()
    this.socket?.disconnect()
    this.socket = null
  }
}

// Singleton export
export default new WebRTCService()
