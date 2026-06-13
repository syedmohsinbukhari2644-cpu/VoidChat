import { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Share, Alert
} from 'react-native'

export default function ReferScreen() {
  const [copied, setCopied] = useState(false)
  const referCode = 'AZAAD-XY7K9M'
  const referLink = `https://azaad.app/join?ref=${referCode}`

  const handleShare = async () => {
    try {
      await Share.share({
        message: `🔓 AZAAD join karo — Privacy first app!\n\nMera refer code: ${referCode}\n\nDownload karo: ${referLink}\n\n✅ Join karo aur 200 AZD Welcome Bonus pao!`,
        title: 'AZAAD App — Join Karo!'
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
    { refers: 1, reward: '500 AZD', done: true },
    { refers: 5, reward: '3,000 AZD', done: true },
    { refers: 10, reward: '7,000 AZD', done: false },
    { refers: 25, reward: '20,000 AZD', done: false },
    { refers: 50, reward: '50,000 AZD', done: false },
    { refers: 100, reward: '1,50,000 AZD 🔥', done: false },
  ]

  return (
    <ScrollView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Refer & Earn</Text>
        <Text style={styles.subtitle}>
          Dost ko AZAAD pe laao — dono kamao!
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>7</Text>
          <Text style={styles.statLabel}>Total Refers</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>3,500</Text>
          <Text style={styles.statLabel}>AZD Kamaye</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>700</Text>
          <Text style={styles.statLabel}>PKR Worth</Text>
        </View>
      </View>

      {/* Refer Code */}
      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>Tumhara Refer Code</Text>
        <Text style={styles.code}>{referCode}</Text>
        <View style={styles.codeBtns}>
          <TouchableOpacity
            style={[styles.codeBtn, copied && styles.codeBtnCopied]}
            onPress={handleCopy}
          >
            <Text style={styles.codeBtnText}>
              {copied ? '✅ Copied!' : '📋 Copy Code'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.codeBtn, styles.shareBtn]}
            onPress={handleShare}
          >
            <Text style={[styles.codeBtnText, styles.shareBtnText]}>
              ↗️ Share Karo
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* How it works */}
      <View style={styles.howCard}>
        <Text style={styles.howTitle}>Kaise Kaam Karta Hai?</Text>
        {[
          { step: '1', text: 'Refer code share karo dost ke saath' },
          { step: '2', text: 'Dost AZAAD download kare aur join kare' },
          { step: '3', text: 'Tumhe +500 AZD mile — Dost ko +200 AZD' },
          { step: '4', text: 'Unka refer = Tumhe +250 AZD bhi!' },
        ].map((item, i) => (
          <View key={i} style={styles.howItem}>
            <View style={styles.howStep}>
              <Text style={styles.howStepText}>{item.step}</Text>
            </View>
            <Text style={styles.howText}>{item.text}</Text>
          </View>
        ))}
      </View>

      {/* Milestones */}
      <View style={styles.milestonesCard}>
        <Text style={styles.milestonesTitle}>🏆 Milestones</Text>
        {milestones.map((m, i) => (
          <View key={i} style={[
            styles.milestone,
            m.done && styles.milestoneDone
          ]}>
            <Text style={styles.milestoneIcon}>
              {m.done ? '✅' : '🎯'}
            </Text>
            <Text style={styles.milestoneText}>
              {m.refers} refers
            </Text>
            <Text style={styles.milestoneReward}>{m.reward}</Text>
          </View>
        ))}
      </View>

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  title: {
    color: '#c8ff00', fontSize: 24,
    fontWeight: '800', marginBottom: 4,
  },
  subtitle: { color: '#6b7280', fontSize: 13 },
  statsRow: {
    flexDirection: 'row',
    padding: 16, gap: 10,
  },
  statCard: {
    flex: 1, backgroundColor: '#111',
    borderRadius: 14, padding: 14,
    alignItems: 'center',
    borderWidth: 1, borderColor: '#1f2937',
  },
  statValue: {
    color: '#c8ff00', fontSize: 20,
    fontWeight: '800', marginBottom: 4,
  },
  statLabel: { color: '#6b7280', fontSize: 11 },
  codeCard: {
    margin: 16,
    backgroundColor: '#1a2a00',
    borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: '#c8ff0030',
  },
  codeLabel: {
    color: '#6b7280', fontSize: 12,
    marginBottom: 8, textAlign: 'center',
  },
  code: {
    color: '#c8ff00', fontSize: 28,
    fontWeight: '800', textAlign: 'center',
    letterSpacing: 2, marginBottom: 16,
  },
  codeBtns: { flexDirection: 'row', gap: 10 },
  codeBtn: {
    flex: 1, padding: 12,
    backgroundColor: '#ffffff10',
    borderRadius: 12, alignItems: 'center',
    borderWidth: 1, borderColor: '#ffffff20',
  },
  codeBtnCopied: {
    backgroundColor: '#0a1f0a',
    borderColor: '#4ade8040',
  },
  codeBtnText: { color: '#f9fafb', fontWeight: '600', fontSize: 13 },
  shareBtn: { backgroundColor: '#c8ff00', borderColor: '#c8ff00' },
  shareBtnText: { color: '#0a0a0a' },
  howCard: {
    margin: 16, marginTop: 0,
    backgroundColor: '#111',
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#1f2937',
  },
  howTitle: {
    color: '#f9fafb', fontWeight: '800',
    fontSize: 15, marginBottom: 14,
  },
  howItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12, marginBottom: 12,
  },
  howStep: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#c8ff00',
    justifyContent: 'center', alignItems: 'center',
  },
  howStepText: { color: '#0a0a0a', fontWeight: '800', fontSize: 13 },
  howText: { color: '#9ca3af', fontSize: 13, flex: 1 },
  milestonesCard: {
    margin: 16, marginTop: 0,
    backgroundColor: '#111',
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#1f2937',
    marginBottom: 32,
  },
  milestonesTitle: {
    color: '#f9fafb', fontWeight: '800',
    fontSize: 15, marginBottom: 14,
  },
  milestone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12, padding: 12,
    borderRadius: 10, marginBottom: 8,
    backgroundColor: '#0a0a0a',
  },
  milestoneDone: { backgroundColor: '#0a1f0a' },
  milestoneIcon: { fontSize: 18 },
  milestoneText: { color: '#9ca3af', fontSize: 13, flex: 1 },
  milestoneReward: {
    color: '#c8ff00', fontSize: 13,
    fontWeight: '700',
  },
})