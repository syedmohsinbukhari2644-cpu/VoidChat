import { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Dimensions
} from 'react-native'

import GroupChatScreen from './GroupChatScreen'

const { height } = Dimensions.get('window')


const mockReels = [
  {
    id: '1',
    user: 'inklab_pk',
caption: 'Haq ki baat — VOID CHAT pe! 🔓 #freedom',
    views: '2.3M',
    likes: 45231,
    azd: 4600,
    color: '#1a1a2e'
  },
  {
    id: '2',
    user: 'anonymous_creator',
    caption: 'Koi nahi jaanta kaun hun main 🕵️ #anonymous',
    views: '891K',
    likes: 12453,
    azd: 1782,
    color: '#16213e'
  },
  {
    id: '3',
    user: 'fatima_art',
    caption: 'Meri zindagi mera faisla 🎨 #azaad',
    views: '4.1M',
    likes: 89234,
    azd: 8200,
    color: '#0f3460'
  },
]

export default function ReelsScreen() {
  const [currentReel, setCurrentReel] = useState(0)
  const [liked, setLiked] = useState({})
  const [selectedFilter, setSelectedFilter] = useState('normal')
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [isRecording, setIsRecording] = useState(false)

  const [showGroupChat, setShowGroupChat] = useState(false)
  
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
  
  const reel = mockReels[currentReel]

  if (showGroupChat) {
    return (
      <GroupChatScreen
        group={{ name: '🎥 Reel Group Chat' }}
        onBack={() => setShowGroupChat(false)}
      />
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: reel.color }]}>


      {/* Top Bar */}
      <View style={styles.topBar}>
        <Text style={styles.title}>REELS</Text>
        <Text style={styles.encBadge}>🔐 E2E</Text>
      </View>

      {/* Play Area */}
      <View style={styles.playArea}>
        <View style={styles.playBtn}>
          <Text style={styles.playIcon}>▶</Text>
        </View>
        <Text style={styles.viewCount}>👁️ {reel.views} views</Text>
        <View style={styles.azdBadge}>
          <Text style={styles.azdText}>⚡ {reel.azd.toLocaleString()} AZD earned</Text>
        </View>
      </View>

      {/* Right Actions */}
      <View style={styles.rightActions}>
        <TouchableOpacity
          style={styles.actionItem}
          onPress={() => setShowGroupChat(true)}
        >
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionCount}>Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionItem}
          onPress={() => setLiked(p => ({ ...p, [reel.id]: !p[reel.id] }))}
        >

          <Text style={styles.actionIcon}>
            {liked[reel.id] ? '❤️' : '🤍'}
          </Text>
          <Text style={styles.actionCount}>
            {(reel.likes + (liked[reel.id] ? 1 : 0)).toLocaleString()}
          </Text>
        </TouchableOpacity>

        {[
          { icon: '💬', count: '1.2K' },
          { icon: '↗️', count: '892' },
          { icon: '🔖', count: '' },
          { icon: '⚡', count: 'AZD' },
        ].map((action, i) => (
          <TouchableOpacity key={i} style={styles.actionItem}>
            <Text style={styles.actionIcon}>{action.icon}</Text>
            {action.count ? (
              <Text style={styles.actionCount}>{action.count}</Text>
            ) : null}
          </TouchableOpacity>
        ))}
      </View>

      {/* Bottom Info */}
      <View style={styles.bottomInfo}>
        <Text style={styles.reelUser}>@{reel.user}</Text>
        <Text style={styles.reelCaption}>{reel.caption}</Text>

        {/* Navigation Dots */}
        <View style={styles.dots}>
          {mockReels.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setCurrentReel(i)}
              style={[
                styles.dot,
                {
                  width: i === currentReel ? 20 : 6,
                  backgroundColor: i === currentReel ? '#c8ff00' : '#ffffff40'
                }
              ]}
            />
          ))}
        </View>
      </View>

      {/* Filter Menu */}
      {showFilterMenu && (
        <View style={styles.filterMenu}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Choose Streak Filter</Text>
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

      {/* Recording Controls */}
      <View style={styles.recordingArea}>
        <TouchableOpacity 
          style={[styles.recordBtn, isRecording && styles.recordBtnActive]}
          onPress={() => setShowFilterMenu(!showFilterMenu)}
        >
          <Text style={styles.recordIcon}>🎥</Text>
          <Text style={styles.recordText}>
            {isRecording ? '🔴 Recording...' : '📽️ Record Streak'}
          </Text>
          {selectedFilter !== 'normal' && (
            <Text style={styles.filterHint}>
              {cameraFilters.find(f => f.name === selectedFilter)?.emoji}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Creator Earn Info */}
      <View style={styles.earnInfo}>
        <Text style={styles.earnText}>
          🎬 Creator ne {reel.azd.toLocaleString()} AZD kamaye!
        </Text>
        <Text style={styles.earnSub}>
          Tum bhi reel banao — followers ki zaroorat nahi!
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
  },
  title: {
    fontSize: 20, fontWeight: '800',
    color: '#fff', letterSpacing: 2,
  },
  encBadge: {
    fontSize: 11,
    backgroundColor: '#ffffff20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    color: '#fff',
  },
  playArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  playBtn: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: '#ffffff30',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#ffffff40',
  },
  playIcon: { fontSize: 28, color: '#fff' },
  viewCount: { fontSize: 14, color: '#ffffffcc' },
  azdBadge: {
    backgroundColor: '#1a2a0080',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#c8ff0040',
  },
  azdText: { color: '#c8ff00', fontSize: 13, fontWeight: '700' },
  rightActions: {
    position: 'absolute',
    right: 12,
    bottom: 160,
    gap: 20,
    alignItems: 'center',
  },
  actionItem: { alignItems: 'center', gap: 4 },
  actionIcon: { fontSize: 28 },
  actionCount: { color: '#fff', fontSize: 11, fontWeight: '600' },
  bottomInfo: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 60,
  },
  reelUser: {
    color: '#fff', fontWeight: '800',
    fontSize: 15, marginBottom: 6,
  },
  reelCaption: {
    color: '#ffffffcc', fontSize: 13,
    lineHeight: 18, marginBottom: 12,
  },
  dots: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { height: 4, borderRadius: 4 },
  earnInfo: {
    position: 'absolute',
    bottom: 16,
    left: 16, right: 16,
    backgroundColor: '#00000060',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#c8ff0020',
  },
  earnText: { color: '#c8ff00', fontSize: 12, fontWeight: '700' },
  earnSub: { color: '#ffffff80', fontSize: 11, marginTop: 2 },
  
  // Filter Menu Styles
  filterMenu: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    backgroundColor: '#00000090',
    borderTopWidth: 1,
    borderTopColor: '#ffffff20',
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
    color: '#c8ff00',
    fontWeight: '700',
    fontSize: 13,
  },
  
  filterClose: {
    color: '#ffffff60',
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
    backgroundColor: '#ffffff10',
    borderWidth: 1,
    borderColor: '#ffffff30',
  },
  
  filterOptionActive: {
    backgroundColor: '#c8ff0020',
    borderColor: '#c8ff00',
  },
  
  filterEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  
  filterLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  
  // Recording Controls
  recordingArea: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 60,
  },
  
  recordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#d946ef20',
    borderWidth: 1.5,
    borderColor: '#d946ef',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  
  recordBtnActive: {
    backgroundColor: '#d946ef40',
    borderColor: '#ff0000',
  },
  
  recordIcon: {
    fontSize: 18,
  },
  
  recordText: {
    color: '#d946ef',
    fontWeight: '700',
    fontSize: 13,
    flex: 1,
  },
  
  filterHint: {
    fontSize: 16,
  },
})