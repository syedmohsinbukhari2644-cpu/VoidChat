// ─── VOID CHAT — Fake Shutdown Overlay ────────────────────────────────────────
// Renders a convincing Android-style shutdown animation then locks screen.
// Polls Firestore every 10s for remote unlock command from website.
import { useEffect, useRef, useState } from 'react'
import {
  View, Text, StyleSheet, Modal, Animated,
  TouchableOpacity, TextInput, StatusBar,
  Vibration, Platform
} from 'react-native'
import {
  startGhostMode, stopGhostMode,
  loadGhostSettings, logFailedAttempt,
  verifyPin, getCurrentLocation, sendSOSAlert
} from './AntiTheftService'
import { takeSilentSelfie, MobileCameraCapture } from './IntruderCamera'

// ─────────────────────────────────────────────────────────────────────────────
const FakeShutdownOverlay = ({ visible, userId, onDeactivate }) => {
  // Animation phases: 'animating' → 'black' → 'battery_dead' → 'locked'
  const [phase, setPhase] = useState('animating')
  const [pinInput, setPinInput] = useState('')
  const [showPinModal, setShowPinModal] = useState(false)
  const [pinError, setPinError] = useState('')
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [alarmActive, setAlarmActive] = useState(false)
  const [tapCount, setTapCount] = useState(0)
  const tapTimerRef = useRef(null)
  const cameraRef   = useRef(null)

  // Animated values
  const screenOpacity  = useRef(new Animated.Value(1)).current   // dims screen
  const textOpacity    = useRef(new Animated.Value(0)).current   // "Powering off..."
  const spinnerOpacity = useRef(new Animated.Value(0)).current
  const spinnerRotate  = useRef(new Animated.Value(0)).current
  const blackOpacity   = useRef(new Animated.Value(0)).current

  // ── Run shutdown animation sequence ──────────────────────────────────────
  useEffect(() => {
    if (!visible) {
      setPhase('animating')
      setPinInput('')
      setPinError('')
      setFailedAttempts(0)
      return
    }

    setPhase('animating')

    // Load settings and start ghost mode
    const init = async () => {
      const settings = await loadGhostSettings()
      const coords   = await getCurrentLocation()

      if (settings.emergencyContact && coords) {
        await sendSOSAlert(userId, settings.emergencyContact, coords)
      }

      // Selfie callback: called on activation + periodic
      const handleTakeSelfie = async (reason) => {
        try {
          // Mobile: use camera ref
          if (cameraRef.current?.capture) {
            await cameraRef.current.capture(reason)
          } else {
            // Web: use getUserMedia
            await takeSilentSelfie(userId, settings.emergencyContact, reason)
          }
        } catch (e) {}
      }

      await startGhostMode(
        userId,
        // onUnlockCommand — remote website unlock received
        () => {
          setShowPinModal(false)
          onDeactivate()
        },
        // onAlarmCommand — remote alarm triggered
        () => {
          setAlarmActive(true)
          Vibration.vibrate([500, 500, 500, 500, 500, 500], true)
        },
        // onTakeSelfie — periodic + activation selfie
        handleTakeSelfie
      )
    }
    init()

    // Animation sequence
    Animated.sequence([
      // Step 1: screen dims (500ms)
      Animated.timing(screenOpacity, { toValue: 0.4, duration: 600, useNativeDriver: true }),
      // Step 2: "Powering off..." fades in (800ms)
      Animated.timing(textOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      // Step 3: spinner fades in
      Animated.timing(spinnerOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      // Step 4: wait a moment
      Animated.delay(1400),
      // Step 5: everything fades to black
      Animated.timing(blackOpacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
    ]).start(() => {
      setPhase('black')
      // After 2 seconds on black: show fake "battery dead" screen
      setTimeout(() => setPhase('battery_dead'), 2000)
      // After 4 seconds: go fully locked
      setTimeout(() => setPhase('locked'), 4000)
    })

    // Spinner rotation animation (continuous)
    Animated.loop(
      Animated.timing(spinnerRotate, { toValue: 1, duration: 1200, useNativeDriver: true })
    ).start()

    return () => {
      Vibration.cancel()
    }
  }, [visible])

  // ── Secret tap to show PIN modal (3 taps in quick succession) ───────────
  const handleSecretTap = () => {
    if (phase !== 'locked') return
    const newCount = tapCount + 1
    setTapCount(newCount)
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current)
    tapTimerRef.current = setTimeout(() => setTapCount(0), 1500)
    if (newCount >= 5) {
      setTapCount(0)
      setShowPinModal(true)
    }
  }

  // ── PIN verification ──────────────────────────────────────────────────────
  const handlePinSubmit = async () => {
    try {
      const settings = await loadGhostSettings()
      const isValid  = verifyPin(pinInput, settings.pin)

      if (isValid) {
        setPinError('')
        setShowPinModal(false)
        Vibration.cancel()
        await stopGhostMode(userId)
        onDeactivate()
      } else {
        const newAttempts = failedAttempts + 1
        setFailedAttempts(newAttempts)
        setPinInput('')
        setPinError(`❌ Wrong PIN (${newAttempts} failed attempt${newAttempts > 1 ? 's' : ''})`)
        Vibration.vibrate(400)

        // Capture intruder selfie silently on wrong PIN
        try {
          const settings = await loadGhostSettings()
          if (cameraRef.current?.capture) {
            await cameraRef.current.capture('wrong_pin')
          } else {
            await takeSilentSelfie(userId, settings.emergencyContact, 'wrong_pin')
          }
        } catch (e) {}

        // Log intruder attempt to Firestore
        await logFailedAttempt(userId)

        // After 3 wrong tries, hide PIN modal so chor can't keep guessing
        if (newAttempts >= 3) {
          setTimeout(() => {
            setShowPinModal(false)
            setPinError('')
            setFailedAttempts(0)
          }, 2000)
        }
      }
    } catch (e) {
      setPinError('Error. Try again.')
    }
  }

  const spinnerSpin = spinnerRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  })

  if (!visible) return null

  // ─── PHASE: animating ─────────────────────────────────────────────────────
  if (phase === 'animating') {
    return (
      <Modal visible={true} transparent animationType="none" statusBarTranslucent>
        <StatusBar hidden />
        <View style={styles.baseScreen}>
          {/* Dimmed background */}
          <Animated.View style={[styles.fullCover, { opacity: Animated.subtract(1, screenOpacity), backgroundColor: '#000' }]} />

          {/* Shutdown UI */}
          <View style={styles.shutdownContent}>
            <Animated.View style={{ opacity: textOpacity }}>
              <Text style={styles.shutdownTitle}>Powering off</Text>
            </Animated.View>
            <Animated.View style={[styles.spinner, { opacity: spinnerOpacity, transform: [{ rotate: spinnerSpin }] }]}>
              <View style={styles.spinnerOuter}>
                <View style={styles.spinnerInner} />
              </View>
            </Animated.View>
          </View>

          {/* Full black fade */}
          <Animated.View style={[styles.fullCover, { opacity: blackOpacity, backgroundColor: '#000' }]} />
        </View>
      </Modal>
    )
  }

  // ─── PHASE: black (brief full black) ──────────────────────────────────────
  if (phase === 'black') {
    return (
      <Modal visible={true} transparent={false} statusBarTranslucent>
        <StatusBar hidden />
        <View style={styles.blackScreen} />
      </Modal>
    )
  }

  // ─── PHASE: battery_dead ──────────────────────────────────────────────────
  if (phase === 'battery_dead') {
    return (
      <Modal visible={true} transparent={false} statusBarTranslucent>
        <StatusBar hidden />
        <View style={styles.batteryScreen}>
          <View style={styles.batteryIconWrap}>
            <View style={styles.batteryBody}>
              <View style={styles.batteryFill} />
            </View>
            <View style={styles.batteryTip} />
          </View>
          <Text style={styles.batteryPct}>0%</Text>
          <Text style={styles.batteryMsg}>Connect charger to power on</Text>
        </View>
      </Modal>
    )
  }

  // ─── PHASE: locked (full black + secret tap zone) ─────────────────────────
  return (
    <Modal visible={true} transparent={false} statusBarTranslucent>
      <StatusBar hidden />
      <TouchableOpacity
        style={styles.blackScreen}
        activeOpacity={1}
        onPress={handleSecretTap}
      >
        {/* Invisible alarm indicator pulsing if alarm active */}
        {alarmActive && (
          <View style={styles.alarmIndicator} />
        )}
      </TouchableOpacity>

      {/* PIN Unlock Modal */}
      <Modal visible={showPinModal} transparent animationType="fade">
        <View style={styles.pinBackdrop}>
          <View style={styles.pinCard}>
            <Text style={styles.pinTitle}>🔐 VOID Ghost Lock</Text>
            <Text style={styles.pinSubtitle}>Enter your Ghost PIN to unlock</Text>

            <TextInput
              style={styles.pinInput}
              value={pinInput}
              onChangeText={setPinInput}
              placeholder="Enter PIN"
              placeholderTextColor="#555"
              secureTextEntry
              keyboardType="numeric"
              maxLength={8}
              autoFocus
            />

            {pinError ? (
              <Text style={styles.pinError}>{pinError}</Text>
            ) : null}

            <View style={styles.pinBtnRow}>
              <TouchableOpacity
                style={styles.pinCancelBtn}
                onPress={() => { setShowPinModal(false); setPinInput(''); setPinError('') }}
              >
                <Text style={styles.pinCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.pinSubmitBtn}
                onPress={handlePinSubmit}
              >
                <Text style={styles.pinSubmitText}>Unlock App</Text>
              </TouchableOpacity>
            </View>

            {/* Real Shutdown Option — for actual owner who wants to power off */}
            <TouchableOpacity
              style={styles.shutdownRealBtn}
              onPress={async () => {
                try {
                  const settings = await loadGhostSettings()
                  const isValid  = verifyPin(pinInput, settings.pin)
                  if (!isValid) {
                    setPinError('❌ Enter correct PIN first to allow real shutdown')
                    return
                  }
                  Vibration.cancel()
                  await stopGhostMode(userId)
                  setShowPinModal(false)
                  onDeactivate()
                  // Phone is now free — user can press power button for real shutdown
                } catch (e) {}
              }}
            >
              <Text style={styles.shutdownRealText}>🔌 Deactivate Ghost Mode (Allow Real Shutdown)</Text>
            </TouchableOpacity>

            <Text style={styles.pinHint}>
              Or unlock remotely from{'\n'}azaad-app.web.app/track.html
            </Text>
          </View>
        </View>
      </Modal>

      {/* Hidden camera for mobile native capture */}
      <MobileCameraCapture
        ref={cameraRef}
        userId={userId}
        emergencyContact={null}
      />

    </Modal>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  baseScreen: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullCover: {
    ...StyleSheet.absoluteFillObject,
  },
  shutdownContent: {
    alignItems: 'center',
    gap: 32,
    zIndex: 10,
  },
  shutdownTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '300',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif-light',
  },
  spinner: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerOuter: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.15)',
    borderTopColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.05)',
    borderTopColor: 'rgba(255,255,255,0.4)',
  },
  blackScreen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  batteryScreen: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  batteryIconWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  batteryBody: {
    width: 80,
    height: 40,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#555',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  batteryFill: {
    height: '60%',
    width: '0%', // empty — 0%
    backgroundColor: '#ef4444',
    borderRadius: 3,
  },
  batteryTip: {
    width: 5,
    height: 16,
    backgroundColor: '#555',
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  batteryPct: {
    color: '#ffffff',
    fontSize: 48,
    fontWeight: '200',
    letterSpacing: -1,
  },
  batteryMsg: {
    color: '#555555',
    fontSize: 13,
    textAlign: 'center',
  },
  alarmIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(239,68,68,0.03)',
  },
  // PIN Modal
  pinBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  pinCard: {
    backgroundColor: '#111118',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: '#1e1e2e',
    gap: 14,
    alignItems: 'center',
  },
  pinTitle: {
    color: '#c8ff00',
    fontSize: 20,
    fontWeight: '800',
  },
  pinSubtitle: {
    color: '#8b8ba7',
    fontSize: 13,
    textAlign: 'center',
  },
  pinInput: {
    width: '100%',
    backgroundColor: '#1a1a26',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a3e',
    padding: 14,
    color: '#ffffff',
    fontSize: 20,
    textAlign: 'center',
    letterSpacing: 8,
  },
  pinError: {
    color: '#ef4444',
    fontSize: 13,
    textAlign: 'center',
  },
  pinBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  pinCancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#1e1e2e',
    alignItems: 'center',
  },
  pinCancelText: {
    color: '#8b8ba7',
    fontWeight: '700',
  },
  pinSubmitBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#c8ff00',
    alignItems: 'center',
  },
  pinSubmitText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 15,
  },
  pinHint: {
    color: '#3f3f5a',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 17,
  },
  shutdownRealBtn: {
    width: '100%',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3f3f5a',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  shutdownRealText: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '600',
  },
})

export default FakeShutdownOverlay
