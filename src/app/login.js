import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, SafeAreaView, StatusBar, Alert, Platform
} from 'react-native'
import { loginUser, registerUser, setToken, sendOtp, verifyOtp } from './api'

// ─── Design Tokens ────────────────────────────────────────────
const C = {
  bg: '#060608',
  surface: '#0e0e14',
  card: '#131319',
  border: '#1e1e2c',
  primary: '#c8ff00',
  purple: '#a855f7',
  text: '#f0f0ff',
  muted: '#6b7280',
  faint: '#2e2e3e',
  success: '#4ade80',
}

export default function LoginScreen({ onLogin }) {
  const [step, setStep] = useState('landing')
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [generatedOtpDisplay, setGeneratedOtpDisplay] = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(null)

  useEffect(() => {
    if (Platform.OS !== 'web') return
    const handleMouse = (e) => {
      const x = (window.innerWidth / 2 - e.clientX) / 40
      const y = -(window.innerHeight / 2 - e.clientY) / 40
      setTilt({ x, y })
    }
    window.addEventListener('mousemove', handleMouse)
    return () => window.removeEventListener('mousemove', handleMouse)
  }, [])

  // ── Handlers ────────────────────────────────────────────────
  const handleSendOTP = async () => {
    if (!email) { Alert.alert('Error', 'Please enter your email!'); return }
    setLoading(true)
    try {
      const response = await sendOtp({ email })
      if (response.data.success) {
        Alert.alert('📧 OTP Bhej Diya Gaya', response.data.message || '6-digit OTP code aap ke email inbox mein bhej diya gaya hai.')
        setStep('verifyOTP')
      }
      else Alert.alert('Error', response.data.message)
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Unable to connect to server!')
    }
    setLoading(false)
  }

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit OTP!')
      return
    }
    setLoading(true)
    try {
      const response = await verifyOtp({ email, otp })
      if (response.data.success) { Alert.alert('✅', 'Email verified successfully!'); setStep('register') }
      else Alert.alert('Error', response.data.message)
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Server error!')
    }
    setLoading(false)
  }

  const handleRegister = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter username and password!')
      return
    }
    setLoading(true)
    try {
      const response = await registerUser({ username, email, password })
      const { token, VOIDBalance } = response.data
      setToken(token)
      onLogin(token, VOIDBalance)
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Error!')
    }
    setLoading(false)
  }

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password!')
      return
    }
    setLoading(true)
    try {
      const response = await loginUser({ email, password })
      const { token, VOIDBalance } = response.data
      setToken(token)
      onLogin(token, VOIDBalance)
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Error!')
    }
    setLoading(false)
  }

  // ── Input helper ────────────────────────────────────────────
  const inp = (name) => [styles.inputRow, focused === name && styles.inputFocused]

  // ── Render ──────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* Background glow blobs */}
      <View style={styles.glowPurple} pointerEvents="none" />
      <View style={styles.glowGreen} pointerEvents="none" />

      <View style={styles.content}>

        {/* ── Logo Section ─────────────────────────────── */}
        <View style={styles.logoWrap}>
          <View style={styles.logoRing}>
            <Text style={styles.logoEmoji}>🔓</Text>
          </View>
          <Text style={styles.logoText}>VOID CHAT</Text>
          <Text style={styles.tagline}>Private  ·  Secure  ·  Free</Text>
        </View>

        {/* ── STEP: Landing Page (3D Motion Feel) ────────────────── */}
        {step === 'landing' && (
          <View style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }}>
            {/* 3D Motion Perspective Feature Card */}
            <View
              style={{
                width: '100%',
                maxWidth: 480,
                backgroundColor: C.card,
                borderRadius: 28,
                borderWidth: 1,
                borderColor: C.border,
                padding: 24,
                gap: 18,
                transform: Platform.OS === 'web' ? [
                  { perspective: 1000 },
                  { rotateX: `${tilt.y}deg` },
                  { rotateY: `${tilt.x}deg` }
                ] : [],
                shadowColor: C.primary,
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.15,
                shadowRadius: 24,
                elevation: 8,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontSize: 28 }}>🛡️</Text>
                <View>
                  <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900' }}>VOID CHAT Beta</Text>
                  <Text style={{ color: C.muted, fontSize: 12 }}>Version 1.0.0 (Standalone)</Text>
                </View>
              </View>

              <Text style={{ color: C.text, fontSize: 14, lineHeight: 22, marginTop: 4 }}>
                A futuristic, E2E encrypted platform with a zero-knowledge architecture. Star messages, lock stealth chats in a private vault, use disappearing timers, and earn VOID coins.
              </Text>

              {/* Bullet Features list */}
              <View style={{ gap: 12, marginTop: 4 }}>
                {[
                  { icon: '🔐', t: 'E2E Encryption', d: 'Your keys, your chat logs. Devs see nothing.' },
                  { icon: '⭐', t: 'Starred Sync', d: 'Securely sync flagged messages across devices.' },
                  { icon: '💰', t: 'VOID Wallet', d: 'Earn and transfer tokens inside the ecosystem.' }
                ].map((f, i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                    <Text style={{ fontSize: 18 }}>{f.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: C.primary, fontSize: 13, fontWeight: '800' }}>{f.t}</Text>
                      <Text style={{ color: C.muted, fontSize: 11, marginTop: 1 }}>{f.d}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Launch Actions */}
            <View style={{ width: '100%', maxWidth: 480, gap: 12, marginTop: 28 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: C.primary,
                  borderRadius: 18,
                  paddingVertical: 15,
                  alignItems: 'center',
                  shadowColor: C.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 10,
                  elevation: 6
                }}
                onPress={() => setStep('main')}
                activeOpacity={0.85}
              >
                <Text style={{ color: C.bg, fontSize: 15, fontWeight: '900', letterSpacing: 0.5 }}>🔓 Launch Web App</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  backgroundColor: 'rgba(200, 255, 0, 0.07)',
                  borderRadius: 18,
                  paddingVertical: 15,
                  alignItems: 'center',
                  borderWidth: 1.5,
                  borderColor: C.primary,
                  shadowColor: C.primary,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.25,
                  shadowRadius: 10,
                  elevation: 5,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 10
                }}
                onPress={() => {
                  if (Platform.OS === 'web') {
                    window.open('https://drive.google.com/file/d/14sFEjRLzp82kTnT5vtFMtM6YBImosYNZ/view?usp=sharing', '_blank')
                  } else {
                    Alert.alert('Download', 'APK download is available on our website at: voidchat.tech')
                  }
                }}
                activeOpacity={0.85}
              >
                <Text style={{ fontSize: 18 }}>🤖</Text>
                <Text style={{ color: C.primary, fontSize: 15, fontWeight: '900', letterSpacing: 0.5 }}>Download Android APK</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── STEP: Main ───────────────────────────────── */}
        {step === 'main' && (
          <>
            {/* Login / Register tab switcher */}
            <View style={styles.toggle}>
              <TouchableOpacity
                style={[styles.toggleBtn, isLogin && styles.toggleActive]}
                onPress={() => setIsLogin(true)}
                activeOpacity={0.8}
              >
                <Text style={[styles.toggleText, isLogin && styles.toggleTextActive]}>
                  Login
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, !isLogin && styles.toggleActive]}
                onPress={() => setIsLogin(false)}
                activeOpacity={0.8}
              >
                <Text style={[styles.toggleText, !isLogin && styles.toggleTextActive]}>
                  Register
                </Text>
              </TouchableOpacity>
            </View>

            {/* Security banner */}
            <View style={styles.secBanner}>
              <Text style={styles.secIcon}>🛡️</Text>
              <Text style={styles.secText}>256-bit encrypted · Zero tracking</Text>
            </View>

            {/* Form fields */}
            <View style={styles.form}>
              <View style={inp('email')} collapsable={false}>
                <Text style={styles.inputEmoji}>📧</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="Email Address"
                  placeholderTextColor={C.faint}
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {isLogin && (
                <View style={inp('pw')} collapsable={false}>
                  <Text style={styles.inputEmoji}>🔑</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="Password"
                    placeholderTextColor={C.faint}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocused('pw')}
                    onBlur={() => setFocused(null)}
                    secureTextEntry
                  />
                </View>
              )}

              <TouchableOpacity
                style={[styles.primaryBtn, loading && { opacity: 0.6 }]}
                onPress={isLogin ? handleLogin : handleSendOTP}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryBtnText}>
                  {loading
                    ? '⏳  Processing...'
                    : isLogin
                      ? '🔓  Enter VOID CHAT'
                      : '📧  Send Verification OTP'}
                </Text>
              </TouchableOpacity>
            </View>

            {!isLogin && (
              <View style={styles.bonusCard}>
                <Text style={styles.bonusEmoji}>🎁</Text>
                <View>
                  <Text style={styles.bonusTitle}>Welcome Bonus</Text>
                  <Text style={styles.bonusSub}>200 VOID coins on registration</Text>
                </View>
              </View>
            )}
          </>
        )}

        {/* ── STEP: Verify OTP ─────────────────────────── */}
        {step === 'verifyOTP' && (
          <View style={styles.form}>
            <View style={styles.infoCard}>
              <Text style={styles.infoEmoji}>📨</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoTitle}>OTP Verification</Text>
                <Text style={styles.infoSub}>{email}</Text>
              </View>
              <Text style={{ fontSize: 22 }}>🔒</Text>
            </View>

            <View style={[inp('otp'), { justifyContent: 'center' }]} collapsable={false}>
              <TextInput
                style={[styles.inputField, styles.otpField]}
                placeholder="000000"
                placeholderTextColor={C.faint}
                value={otp}
                onChangeText={setOtp}
                onFocus={() => setFocused('otp')}
                onBlur={() => setFocused(null)}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>

            <View style={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderWidth: 1, padding: 12, borderRadius: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 22 }}>📧</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#f4f4f5', fontSize: 12, fontWeight: '700' }}>Email Inbox Check Karein</Text>
                <Text style={{ color: '#a1a1aa', fontSize: 11 }}>6-digit OTP code <Text style={{ color: '#c8ff00' }}>{email}</Text> par bhej diya gaya hai.</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, loading && { opacity: 0.6 }]}
              onPress={handleVerifyOTP}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryBtnText}>
                {loading ? '⏳  Verifying...' : '✅  Verify & Continue'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.ghostBtn} onPress={handleSendOTP}>
              <Text style={styles.ghostBtnText}>🔄  Resend OTP Email</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── STEP: Register ───────────────────────────── */}
        {step === 'register' && (
          <View style={styles.form}>
            <View style={styles.successCard}>
              <Text style={styles.successEmoji}>✅</Text>
              <View>
                <Text style={styles.successTitle}>Email Verified</Text>
                <Text style={styles.successSub}>{email}</Text>
              </View>
            </View>

            <View style={inp('uname')} collapsable={false}>
              <Text style={styles.inputEmoji}>👤</Text>
              <TextInput
                style={styles.inputField}
                placeholder="Choose Username"
                placeholderTextColor={C.faint}
                value={username}
                onChangeText={setUsername}
                onFocus={() => setFocused('uname')}
                onBlur={() => setFocused(null)}
                autoCapitalize="none"
              />
            </View>

            <View style={inp('rpw')} collapsable={false}>
              <Text style={styles.inputEmoji}>🔑</Text>
              <TextInput
                style={styles.inputField}
                placeholder="Create Password"
                placeholderTextColor={C.faint}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocused('rpw')}
                onBlur={() => setFocused(null)}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, loading && { opacity: 0.6 }]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryBtnText}>
                {loading ? '⏳  Creating Account...' : '🚀  Join VOID CHAT'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Footer ───────────────────────────────────── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            🔐  E2E Encrypted · No Tracking · Your Data, Your Control
          </Text>
        </View>

      </View>
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },

  // Background ambient glows
  glowPurple: {
    position: 'absolute', top: -100, left: -100,
    width: 320, height: 320, borderRadius: 160,
    backgroundColor: '#a855f712',
  },
  glowGreen: {
    position: 'absolute', bottom: -80, right: -80,
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: '#c8ff000a',
  },

  // Logo
  logoWrap: { alignItems: 'center', marginBottom: 40 },
  logoRing: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.surface,
    borderWidth: 1.5, borderColor: '#a855f740',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 18,
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 14,
  },
  logoEmoji: { fontSize: 34 },
  logoText: {
    fontSize: 38, fontWeight: '900',
    color: C.primary, letterSpacing: 5,
    marginBottom: 8,
    textShadowColor: '#c8ff0060',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
  },
  tagline: { color: C.muted, fontSize: 13, letterSpacing: 2, fontWeight: '500' },

  // Toggle switcher
  toggle: {
    flexDirection: 'row', backgroundColor: C.surface,
    borderRadius: 18, padding: 5, gap: 4,
    borderWidth: 1, borderColor: C.border, marginBottom: 16,
  },
  toggleBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  toggleActive: {
    backgroundColor: '#a855f720',
    borderWidth: 1, borderColor: '#a855f770',
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3, shadowRadius: 8,
  },
  toggleText: { color: C.muted, fontWeight: '600', fontSize: 14 },
  toggleTextActive: { color: '#a855f7', fontWeight: '900', fontSize: 14 },

  // Security banner
  secBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#a855f710', borderRadius: 14, padding: 13,
    marginBottom: 20, borderWidth: 1, borderColor: '#a855f728',
  },
  secIcon: { fontSize: 18 },
  secText: { color: '#a855f7', fontSize: 12, fontWeight: '600' },

  // Form
  form: { gap: 14, marginBottom: 16 },

  // Input rows
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: 15,
    borderWidth: 1.5, borderColor: C.border,
  },
  inputFocused: {
    borderColor: '#a855f7',
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35, shadowRadius: 10,
    elevation: 5,
  },
  inputEmoji: { fontSize: 20, paddingHorizontal: 15, paddingVertical: 17 },
  inputField: {
    flex: 1, paddingVertical: 17, paddingRight: 15,
    color: C.text, fontSize: 15,
  },
  otpField: {
    fontSize: 36, textAlign: 'center',
    letterSpacing: 18, fontWeight: '900', paddingLeft: 15,
  },

  // Primary CTA button
  primaryBtn: {
    backgroundColor: C.primary, borderRadius: 16,
    paddingVertical: 18, alignItems: 'center', marginTop: 4,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55, shadowRadius: 18,
    elevation: 10,
  },
  primaryBtnText: {
    color: '#050608', fontWeight: '900',
    fontSize: 16, letterSpacing: 0.5,
  },

  // Ghost / text button
  ghostBtn: { alignItems: 'center', paddingVertical: 14 },
  ghostBtnText: { color: '#a855f7', fontSize: 14, fontWeight: '700' },

  // Bonus card
  bonusCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: C.surface, borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: '#c8ff0020', marginBottom: 8,
  },
  bonusEmoji: { fontSize: 30 },
  bonusTitle: { color: C.primary, fontWeight: '800', fontSize: 14 },
  bonusSub: { color: C.muted, fontSize: 12, marginTop: 2 },

  // OTP info card
  infoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#a855f728',
  },
  infoEmoji: { fontSize: 24 },
  infoTitle: { color: '#a855f7', fontWeight: '700', fontSize: 14 },
  infoSub: { color: C.muted, fontSize: 12, marginTop: 2 },

  // Verified card
  successCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#071307', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#4ade8030',
  },
  successEmoji: { fontSize: 28 },
  successTitle: { color: '#4ade80', fontWeight: '800', fontSize: 14 },
  successSub: { color: C.muted, fontSize: 12, marginTop: 2 },

  // Footer
  footer: {
    paddingTop: 20, paddingBottom: 4,
    borderTopWidth: 1, borderTopColor: C.border,
    alignItems: 'center', marginTop: 8,
  },
  footerText: {
    color: '#3a3a5a', fontSize: 11,
    textAlign: 'center', fontWeight: '500', lineHeight: 18,
  },
})