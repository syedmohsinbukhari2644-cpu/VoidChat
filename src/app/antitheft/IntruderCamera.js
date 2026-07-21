// ─── VOID CHAT — Silent Intruder Camera ───────────────────────────────────────
// Takes silent front-camera photos without any UI sound/flash.
// Stores photo in Firestore + triggers email notification to emergency contact.
import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { View, StyleSheet, Platform } from 'react-native'

const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/azaad-app/databases/(default)/documents'

// ─────────────────────────────────────────────────────────────────────────────
// Save intruder photo to Firestore (as base64 string)
// ─────────────────────────────────────────────────────────────────────────────
const savePhotoToFirestore = async (userId, base64, reason) => {
  try {
    const ts  = Date.now()
    const url = `${FIRESTORE_BASE}/antitheft/${userId}/intruders/${ts}`
    await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          timestamp:  { stringValue: new Date(ts).toISOString() },
          reason:     { stringValue: reason || 'periodic' },
          photoB64:   { stringValue: base64.substring(0, 900000) }, // Firestore 1MB field limit
          userId:     { stringValue: String(userId) }
        }
      })
    })
    return ts
  } catch (e) {
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Notify emergency contact via Firestore alert document
// (backend or website can poll this and send email)
// ─────────────────────────────────────────────────────────────────────────────
const triggerEmailAlert = async (userId, emergencyContact, reason, photoTimestamp) => {
  try {
    const url = `${FIRESTORE_BASE}/antitheft/${userId}/emailAlerts/${Date.now()}`
    await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          emergencyContact: { stringValue: String(emergencyContact || '') },
          reason:           { stringValue: reason || 'Ghost Mode Alert' },
          photoTimestamp:   { stringValue: String(photoTimestamp || '') },
          dashboardUrl:     { stringValue: 'https://azaad-app.web.app/track.html' },
          timestamp:        { stringValue: new Date().toISOString() },
          processed:        { booleanValue: false },
          userId:           { stringValue: String(userId) }
        }
      })
    })
  } catch (e) {}
}

// ─────────────────────────────────────────────────────────────────────────────
// Main camera module — works on web (getUserMedia) and mobile (expo-camera)
// ─────────────────────────────────────────────────────────────────────────────

// Web version using getUserMedia
const captureWithWebCamera = async () => {
  try {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) return null

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: 320, height: 240 }
    })

    const video = document.createElement('video')
    video.srcObject = stream
    video.muted = true
    video.playsInline = true
    await video.play()

    await new Promise(r => setTimeout(r, 500)) // let camera warm up

    const canvas  = document.createElement('canvas')
    canvas.width  = 320
    canvas.height = 240
    canvas.getContext('2d').drawImage(video, 0, 0, 320, 240)

    const base64 = canvas.toDataURL('image/jpeg', 0.6)

    // Stop all tracks
    stream.getTracks().forEach(t => t.stop())

    return base64.replace('data:image/jpeg;base64,', '')
  } catch (e) {
    return null
  }
}

// Mobile version using expo-camera
let expoCamera = null
try {
  expoCamera = require('expo-camera')
} catch (e) {}

// ─────────────────────────────────────────────────────────────────────────────
// Main export: take silent selfie and save to Firestore
// ─────────────────────────────────────────────────────────────────────────────
export const takeSilentSelfie = async (userId, emergencyContact, reason = 'periodic') => {
  try {
    let base64 = null

    if (Platform.OS === 'web') {
      // Web: use getUserMedia
      base64 = await captureWithWebCamera()
    } else if (expoCamera) {
      // Mobile: request camera permission then take photo via ref
      const { Camera, CameraType } = expoCamera
      const { status } = await Camera.requestCameraPermissionsAsync()
      if (status !== 'granted') return null

      // For mobile, we store a placeholder and rely on the CameraView component
      // mounted elsewhere. Actual capture happens via captureRef in the component.
      base64 = 'mobile_capture_pending'
    }

    if (base64 && base64 !== 'mobile_capture_pending') {
      const photoTs = await savePhotoToFirestore(userId, base64, reason)
      if (emergencyContact && photoTs) {
        await triggerEmailAlert(userId, emergencyContact, reason, photoTs)
      }
      return photoTs
    }
    return null
  } catch (e) {
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MobileCameraCapture — Invisible camera view for native capture
// Must be rendered somewhere in the component tree when ghost mode is active
// ─────────────────────────────────────────────────────────────────────────────
export const MobileCameraCapture = forwardRef(({ userId, emergencyContact }, ref) => {
  const cameraRef = useRef(null)

  useImperativeHandle(ref, () => ({
    capture: async (reason) => {
      try {
        if (!cameraRef.current || !expoCamera) return null
        const photo = await cameraRef.current.takePictureAsync({
          base64:  true,
          quality: 0.4,
          skipProcessing: true,
          mute: true
        })
        if (photo?.base64) {
          const photoTs = await savePhotoToFirestore(userId, photo.base64, reason || 'periodic')
          if (emergencyContact && photoTs) {
            await triggerEmailAlert(userId, emergencyContact, reason || 'periodic', photoTs)
          }
          return photoTs
        }
      } catch (e) {}
      return null
    }
  }))

  if (!expoCamera || Platform.OS === 'web') return null

  const { CameraView } = expoCamera
  return (
    <View style={styles.hiddenCamera} pointerEvents="none">
      <CameraView
        ref={cameraRef}
        facing="front"
        style={styles.cameraView}
        mute={true}
      />
    </View>
  )
})

MobileCameraCapture.displayName = 'MobileCameraCapture'

const styles = StyleSheet.create({
  hiddenCamera: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0.01,
    overflow: 'hidden',
    top: -100,
    left: -100,
    zIndex: -1,
  },
  cameraView: {
    width: 320,
    height: 240,
  }
})
