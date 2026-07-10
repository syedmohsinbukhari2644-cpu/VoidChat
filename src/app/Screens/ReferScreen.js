import { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Share, Alert
} from 'react-native'
import Icon from '../../components/Icon'

// ─── Design Tokens ────────────────────────────────────────────
const C = {
  bg:       '#060608',
  surface:  '#0e0e14',
  card:     '#131319',
  border:   '#1e1e2c',
  primary:  '#c8ff00',
  text:     '#f0f0ff',
  muted:    '#6b7280',
  success:  '#4ade80',
}

export default function ReferScreen() {
  const [copied, setCopied] = useState(false)
  const referCode = 'VOID-XY7K9M'
  const referLink = `https://voidchat.app/join?ref=${referCode}`

  const handleShare = async () => {
    try {
      await Share.share({
        message: `🔓 Join VOID CHAT — Privacy first app!\n\nMy refer code: ${referCode}\n\nDownload here: ${referLink}\n\n✅ Join and get 200 VOID Welcome Bonus!`,
        title: 'VOID CHAT App — Join Now!',
      })
    } catch (e) {
      Alert.alert('Error', e.message)
    }
  }

  const handleCopy = () => {
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const milestones = [
    { refers: 1,   reward: '500 VOID',       done: true,  progress: 100 },
    { refers: 5,   reward: '3,000 VOID',     done: true,  progress: 100 },
    { refers: 10,  reward: '7,000 VOID',     done: false, progress: 70  },
    { refers: 25,  reward: '20,000 VOID',    done: false, progress: 28  },
    { refers: 50,  reward: '50,000 VOID',    done: false, progress: 14  },
    { refers: 100, reward: '1,50,000 VOID 🔥', done: false, progress: 7 },
  ]

  const steps = [
    { step: '1', text: 'Share your code with a friend',                iconName: 'link' },
    { step: '2', text: 'Friend downloads VOID CHAT and joins',          iconName: 'phone_android' },
    { step: '3', text: 'You get +500 VOID — Friend gets +200 VOID',    iconName: 'bolt' },
    { step: '4', text: 'Their referrals also earn you +250 VOID!',     iconName: 'infinity' },
  ]

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* ── Hero Banner ──────────────────────────────────── */}
      <View style={styles.heroBanner}>
        <View style={styles.heroGlow} pointerEvents="none" />
        <Icon name="redeem" size={60} color="#c8ff00" style={styles.heroEmoji} />
        <Text style={styles.heroTitle}>Refer & Earn</Text>
        <Text style={styles.heroSub}>
          Invite friends to VOID CHAT — both earn rewards!
        </Text>
      </View>

      {/* ── Stats Row ────────────────────────────────────── */}
      <View style={styles.statsRow}>
        {[
          { value: '7',     label: 'Total Refers', iconName: 'people', color: '#6366f1' },
          { value: '3,500', label: 'VOID Earned',  iconName: 'bolt', color: '#c8ff00' },
          { value: '700',   label: 'PKR Worth',    iconName: 'money', color: '#4ade80' },
        ].map((s, i) => (
          <View key={i} style={styles.statCard}>
            <Icon name={s.iconName} size={28} color={s.color} style={styles.statIcon} />
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* ── Refer Code Card ──────────────────────────────── */}
      <View style={styles.codeCard}>
        <View style={styles.codeGlow} pointerEvents="none" />
        <Text style={styles.codeLabel}>YOUR REFER CODE</Text>
        <Text style={styles.codeText}>{referCode}</Text>
        <View style={styles.codeBtns}>
          <TouchableOpacity
            style={[styles.codeBtn, copied && styles.codeBtnSuccess, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }]}
            onPress={handleCopy}
            activeOpacity={0.8}
          >
            <Icon name={copied ? 'check_circle' : 'content_copy'} size={16} color={copied ? '#4ade80' : '#ffffff'} />
            <Text style={styles.codeBtnText}>
              {copied ? 'Copied!' : 'Copy Code'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sharePrimaryBtn, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }]}
            onPress={handleShare}
            activeOpacity={0.8}
          >
            <Icon name="share" size={16} color="#050608" />
            <Text style={styles.sharePrimaryBtnText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── How It Works ─────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        {steps.map((item, i) => (
          <View key={i} style={styles.stepRow}>
            <View style={styles.stepBubble}>
              <Text style={styles.stepNum}>{item.step}</Text>
            </View>
            <Icon name={item.iconName} size={22} color="#c8ff00" style={styles.stepIcon} />
            <Text style={styles.stepText}>{item.text}</Text>
          </View>
        ))}
      </View>

      {/* ── Milestones ───────────────────────────────────── */}
      <View style={[styles.section, { marginBottom: 40 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 18 }}>
          <Icon name="star" size={18} color="#c8ff00" />
          <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Milestones</Text>
        </View>
        {milestones.map((m, i) => (
          <View
            key={i}
            style={[styles.milestoneRow, m.done && styles.milestoneDone]}
          >
            <Icon name={m.done ? 'check_circle' : 'target'} size={18} color={m.done ? '#4ade80' : '#8b8ba7'} style={styles.milestoneCheck} />
            <View style={styles.milestoneInfo}>
              <View style={styles.milestoneTop}>
                <Text style={styles.milestoneRefers}>{m.refers} refers</Text>
                <Text
                  style={[
                    styles.milestoneReward,
                    m.done && styles.milestoneRewardDone,
                  ]}
                >
                  {m.reward}
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[styles.progressFill, { width: `${m.progress}%` }]}
                />
              </View>
            </View>
          </View>
        ))}
      </View>

    </ScrollView>
  )
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  // Hero
  heroBanner: {
    margin: 16, marginBottom: 0,
    backgroundColor: '#0a1600', borderRadius: 24,
    padding: 30, alignItems: 'center',
    borderWidth: 1, borderColor: '#c8ff0028',
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute', width: 220, height: 220,
    borderRadius: 110, backgroundColor: '#c8ff0010',
    top: -60, alignSelf: 'center',
  },
  heroEmoji: { fontSize: 44, marginBottom: 10 },
  heroTitle: {
    color: C.primary, fontSize: 30, fontWeight: '900',
    letterSpacing: 1, marginBottom: 8,
    textShadowColor: '#c8ff0055',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  heroSub: {
    color: C.muted, fontSize: 13,
    textAlign: 'center', lineHeight: 20,
  },

  // Stats
  statsRow: { flexDirection: 'row', margin: 16, gap: 10 },
  statCard: {
    flex: 1, backgroundColor: C.surface,
    borderRadius: 18, padding: 16,
    alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 5,
  },
  statIcon:  { fontSize: 22, marginBottom: 2 },
  statValue: { color: C.primary, fontSize: 18, fontWeight: '900' },
  statLabel: { color: C.muted, fontSize: 10, fontWeight: '600', textAlign: 'center' },

  // Code card
  codeCard: {
    marginHorizontal: 16, marginBottom: 16,
    backgroundColor: '#0a1600', borderRadius: 24,
    padding: 26, borderWidth: 1, borderColor: '#c8ff0035',
    alignItems: 'center', overflow: 'hidden',
    shadowColor: '#c8ff00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18, shadowRadius: 24,
    elevation: 8,
  },
  codeGlow: {
    position: 'absolute', width: 200, height: 200,
    borderRadius: 100, backgroundColor: '#c8ff000a',
    bottom: -50, right: -50,
  },
  codeLabel: {
    color: C.muted, fontSize: 11, fontWeight: '700',
    letterSpacing: 2.5, marginBottom: 12,
  },
  codeText: {
    color: C.primary, fontSize: 32, fontWeight: '900',
    letterSpacing: 5, marginBottom: 22,
    textShadowColor: '#c8ff0070',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  codeBtns: { flexDirection: 'row', gap: 10, width: '100%' },

  codeBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    alignItems: 'center', backgroundColor: '#ffffff08',
    borderWidth: 1, borderColor: '#ffffff15',
  },
  codeBtnSuccess: { backgroundColor: '#071307', borderColor: '#4ade8040' },
  codeBtnText: { color: C.text, fontWeight: '700', fontSize: 13 },

  sharePrimaryBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    alignItems: 'center', backgroundColor: C.primary,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.55, shadowRadius: 14,
    elevation: 8,
  },
  sharePrimaryBtnText: { color: '#050608', fontWeight: '900', fontSize: 13 },

  // Generic section card
  section: {
    marginHorizontal: 16, marginBottom: 16,
    backgroundColor: C.surface, borderRadius: 22, padding: 20,
    borderWidth: 1, borderColor: C.border,
  },
  sectionTitle: {
    color: C.text, fontWeight: '900', fontSize: 16, marginBottom: 18,
  },

  // Steps
  stepRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, marginBottom: 16,
  },
  stepBubble: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: C.primary,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.65, shadowRadius: 10,
    elevation: 6,
  },
  stepNum:  { color: '#050608', fontWeight: '900', fontSize: 15 },
  stepIcon: { fontSize: 20 },
  stepText: { color: '#9ca3af', fontSize: 13, flex: 1, lineHeight: 20 },

  // Milestones
  milestoneRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 14, padding: 14,
    backgroundColor: '#0a0a10', borderRadius: 14,
    marginBottom: 8, borderWidth: 1, borderColor: C.border,
  },
  milestoneDone: { backgroundColor: '#071307', borderColor: '#4ade8022' },
  milestoneCheck: { fontSize: 22 },
  milestoneInfo: { flex: 1 },
  milestoneTop: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8,
  },
  milestoneRefers: { color: C.muted, fontSize: 13 },
  milestoneReward: { color: C.text, fontSize: 13, fontWeight: '700' },
  milestoneRewardDone: { color: '#4ade80' },
  progressTrack: {
    height: 4, backgroundColor: '#1e1e2c',
    borderRadius: 2, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', backgroundColor: C.primary, borderRadius: 2,
  },
})