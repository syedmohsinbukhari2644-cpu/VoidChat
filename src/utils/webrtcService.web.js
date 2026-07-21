// Web stub for WebRTC Service
class WebRTCServiceWeb {
  constructor() {
    this.localStream = null
    this.remoteStream = null
    this.currentUserId = null
    this.remoteUserId = null
    this.onIncomingCall = null
    this.onCallAccepted = null
    this.onCallEnded = null
    this.onRemoteStream = null
  }

  init() {}
  startCall() { return Promise.resolve(null) }
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
