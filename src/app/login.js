import { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, SafeAreaView, StatusBar, Alert
} from 'react-native'
import { loginUser, registerUser, setToken } from './api'

export default function LoginScreen({ onLogin }) {
  const [step, setStep] = useState('main')
  // Steps: main → sendOTP → verifyOTP → register → login
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSendOTP = async () => {
    if (!email) {
      Alert.alert('Error', 'Email likho!')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(
        'http://localhost:3000/api/auth/send-otp',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        }
      )
      const data = await res.json()
      if (data.success) {
        Alert.alert('✅', data.message)
        setStep('verifyOTP')
      } else {
        Alert.alert('Error', data.message)
      }
    } catch (e) {
      Alert.alert('Error', 'Server se connect nahi ho pa raha!')
    }
    setLoading(false)
  }

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Error', '6 digit OTP likho!')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(
        'http://localhost:3000/api/auth/verify-otp',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp })
        }
      )
      const data = await res.json()
      if (data.success) {
        Alert.alert('✅', 'Email verify ho gayi!')
        setStep('register')
      } else {
        Alert.alert('Error', data.message)
      }
    } catch (e) {
      Alert.alert('Error', 'Server error!')
    }
    setLoading(false)
  }

  const handleRegister = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Username aur password likho!')
      return
    }
    setLoading(true)
    try {
      const response = await registerUser({ username, email, password })
      const { token, azdBalance } = response.data
      setToken(token)
      onLogin(token, azdBalance)
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Error!')
    }
    setLoading(false)
  }

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Email aur password likho!')
      return
    }
    setLoading(true)
    try {
      const response = await loginUser({ email, password })
      const { token, azdBalance } = response.data
      setToken(token)
      onLogin(token, azdBalance)
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Error!')
    }
    setLoading(false)
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0e27" />
      <View style={styles.content}>

        {/* Security Header */}
        <View style={styles.securityHeader}>
          <Text style={styles.lockIcon}>🔐</Text>
          <Text style={styles.logo}>AZAAD</Text>
        </View>
        <Text style={styles.tagline}>
          Private • Secure • Free
        </Text>

        {/* Step: Main */}
        {step === 'main' && (
          <>
            <View style={styles.toggle}>
              <TouchableOpacity
                style={[styles.toggleBtn, isLogin && styles.toggleActive]}
                onPress={() => setIsLogin(true)}
              >
                <Text style={styles.toggleIcon}>🔓</Text>
                <Text style={[styles.toggleText, isLogin && styles.toggleTextActive]}>
                  Login
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, !isLogin && styles.toggleActive]}
                onPress={() => setIsLogin(false)}
              >
                <Text style={styles.toggleIcon}>✨</Text>
                <Text style={[styles.toggleText, !isLogin && styles.toggleTextActive]}>
                  Register
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.securityBanner}>
              <Text style={styles.bannerIcon}>🛡️</Text>
              <Text style={styles.bannerText}>
                256-bit encrypted • Zero tracking
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>📧</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  placeholderTextColor="#4b5563"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {isLogin && (
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputIcon}>🔑</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#4b5563"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>
              )}

              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.submitDisabled]}
                onPress={isLogin ? handleLogin : handleSendOTP}
                disabled={loading}
              >
                <Text style={styles.submitText}>
                  {loading
                    ? '⏳ Processing...'
                    : isLogin
                    ? '🔓 Unlock AZAAD'
                    : '📧 Send OTP'}
                </Text>
              </TouchableOpacity>
            </View>

            {!isLogin && (
              <View style={styles.bonusBadge}>
                <Text style={styles.bonusIcon}>🎁</Text>
                <View>
                  <Text style={styles.bonusTitle}>Welcome Bonus</Text>
                  <Text style={styles.bonusText}>200 AZD on registration</Text>
                </View>
              </View>
            )}
          </>
        )}

        {/* Step: Verify OTP */}
        {step === 'verifyOTP' && (
          <View style={styles.form}>
            <View style={styles.otpInfo}>
              <Text style={styles.otpInfoIcon}>📨</Text>
              <View style={styles.otpInfoContent}>
                <Text style={styles.otpInfoText}>OTP Verification</Text>
                <Text style={styles.otpEmail}>{email}</Text>
              </View>
              <Text style={styles.securityBadge}>🔒</Text>
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🔢</Text>
              <TextInput
                style={[styles.input, styles.otpInput]}
                placeholder="000000"
                placeholderTextColor="#4b5563"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>
            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitDisabled]}
              onPress={handleVerifyOTP}
              disabled={loading}
            >
              <Text style={styles.submitText}>
                {loading ? '⏳ Verifying...' : '✅ Verify & Proceed'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.resendBtn}
              onPress={handleSendOTP}
            >
              <Text style={styles.resendText}>
                🔄 Didn't receive? Resend OTP
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step: Register (after OTP) */}
        {step === 'register' && (
          <View style={styles.form}>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedIcon}>✅</Text>
              <View style={styles.verifiedContent}>
                <Text style={styles.verifiedText}>Email Verified</Text>
                <Text style={styles.verifiedEmail}>{email}</Text>
              </View>
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                style={styles.input}
                placeholder="Choose Username"
                placeholderTextColor="#4b5563"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🔑</Text>
              <TextInput
                style={styles.input}
                placeholder="Create Password"
                placeholderTextColor="#4b5563"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.submitText}>
                {loading ? '⏳ Creating Account...' : '🚀 Join AZAAD'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.privacyFooter}>
          <Text style={styles.privacyIcon}>🔐</Text>
          <Text style={styles.privacyText}>E2E Encrypted • No Tracking • Your Data, Your Control</Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { flex: 1, padding: 20, justifyContent: 'center' },
  
  securityHeader: {
    alignItems: 'center', marginBottom: 8,
    flexDirection: 'row', justifyContent: 'center', gap: 12,
  },
  lockIcon: { fontSize: 36 },
  logo: {
    fontSize: 42, fontWeight: '900',
    color: '#d946ef', textAlign: 'center',
    letterSpacing: 2,
  },
  tagline: {
    color: '#6b7280', textAlign: 'center',
    fontSize: 13, marginBottom: 32, fontWeight: '500',
  },
  
  toggle: {
    flexDirection: 'row', backgroundColor: '#1a0a2e',
    borderRadius: 14, padding: 6, marginBottom: 20,
    borderWidth: 1, borderColor: '#d946ef40',
    gap: 6,
  },
  toggleBtn: {
    flex: 1, padding: 12, borderRadius: 12,
    alignItems: 'center', flexDirection: 'row',
    justifyContent: 'center', gap: 6,
  },
  toggleActive: { backgroundColor: '#d946ef20', borderWidth: 1, borderColor: '#d946ef' },
  toggleIcon: { fontSize: 18 },
  toggleText: { color: '#6b7280', fontWeight: '600', fontSize: 14 },
  toggleTextActive: { color: '#d946ef', fontWeight: '700' },
  
  securityBanner: {
    backgroundColor: '#2d1b4e', borderRadius: 12,
    padding: 12, marginBottom: 20,
    borderWidth: 1, borderColor: '#d946ef40',
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  bannerIcon: { fontSize: 20 },
  bannerText: { color: '#d946ef', fontSize: 12, fontWeight: '600' },
  
  form: { gap: 14, marginBottom: 20 },
  
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1a0a2e', borderRadius: 12,
    borderWidth: 1, borderColor: '#d946ef40',
    paddingHorizontal: 4,
  },
  inputIcon: { fontSize: 20, paddingHorizontal: 12, paddingVertical: 14 },
  input: {
    flex: 1, padding: 14, color: '#f9fafb', fontSize: 15,
    backgroundColor: 'transparent',
  },
  otpInput: {
    fontSize: 28, textAlign: 'center',
    letterSpacing: 12, fontWeight: '900',
  },
  
  submitBtn: {
    backgroundColor: '#d946ef', borderRadius: 12,
    padding: 16, alignItems: 'center', marginTop: 8,
    borderWidth: 2, borderColor: '#d946ef',
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: '#ffffff', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
  
  bonusBadge: {
    backgroundColor: '#1a0a2e', borderRadius: 12,
    padding: 14, borderWidth: 1,
    borderColor: '#d946ef50', marginBottom: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  bonusIcon: { fontSize: 28 },
  bonusTitle: { color: '#d946ef', fontWeight: '700', fontSize: 14 },
  bonusText: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  
  otpInfo: {
    backgroundColor: '#1a0a2e', borderRadius: 12,
    padding: 14, alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: '#d946ef40',
    flexDirection: 'row',
  },
  otpInfoIcon: { fontSize: 24 },
  otpInfoContent: { flex: 1, alignItems: 'flex-start' },
  otpInfoText: { color: '#d946ef', fontSize: 13, fontWeight: '600' },
  otpEmail: { color: '#6b7280', fontWeight: '500', fontSize: 12, marginTop: 2 },
  securityBadge: { fontSize: 24 },
  
  resendBtn: { alignItems: 'center', padding: 12 },
  resendText: { color: '#d946ef', fontSize: 13, fontWeight: '600' },
  
  verifiedBadge: {
    backgroundColor: '#0a1a0a', borderRadius: 12,
    padding: 14, borderWidth: 1,
    borderColor: '#d946ef50', flexDirection: 'row',
    alignItems: 'center', gap: 12,
  },
  verifiedIcon: { fontSize: 28 },
  verifiedContent: { flex: 1 },
  verifiedText: { color: '#d946ef', fontWeight: '700', fontSize: 14 },
  verifiedEmail: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  
  privacyFooter: {
    alignItems: 'center', gap: 8,
    paddingVertical: 16, borderTopWidth: 1,
    borderTopColor: '#1f2937',
  },
  privacyIcon: { fontSize: 20 },
  privacyText: { color: '#4b5563', fontSize: 11, textAlign: 'center', fontWeight: '500', lineHeight: 16 },
})