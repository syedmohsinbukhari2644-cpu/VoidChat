// Web implementation for WebRTC & Socket Service
import io from 'socket.io-client'
import { SOCKET_URL } from '../app/api'

class WebRTCServiceWeb {
  constructor() {
    this.socket = null
    this.localStream = null
    this.remoteStream = null
    this.currentUserId = null
    this.remoteUserId = null
    this.peerConnection = null
    this.onIncomingCall = null
    this.onCallAccepted = null
    this.onCallEnded = null
    this.onRemoteStream = null
    this.onCallRinging = null
    this.onCalleeOffline = null
    this.onCallRejected = null
    this.onCallUnavailable = null
  }

  connect(userId, displayName = '') {
    if (this.socket && this.socket.connected) return

    this.currentUserId = userId
    try {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
      })

      this.socket.on('connect', () => {
        console.log('🔌 Web Socket connected:', this.socket.id)
        this.socket.emit('user-online', userId)
      })

      this.socket.on('disconnect', () => {
        console.log('❌ Web Socket disconnected')
      })
    } catch (e) {
      console.log('Web socket connect error:', e)
    }
  }

  disconnect() {
    if (this.socket) {
      try { this.socket.disconnect() } catch (e) {}
      this.socket = null
    }
  }

  emitSendMessage(messageData) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('send-message', messageData)
    }
  }

  emitMessageDelivered(messageId, senderId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('message-delivered', { messageId, senderId })
    }
  }

  emitMarkRead(senderId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('mark-read', { senderId, readerId: this.currentUserId })
    }
  }

  init() {}
  startCall() { return Promise.resolve(null) }
  answerCall() { return Promise.resolve(null) }
  acceptCall() { return Promise.resolve(null) }
  rejectCall() {}
  endCall() {}
  toggleMute() { return false }
  switchCamera() {}
  on() {}
  off() {}
}

const instance = new WebRTCServiceWeb()
export default instance
