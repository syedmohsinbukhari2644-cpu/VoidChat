import { useState, useRef, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Dimensions, Alert
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Icon from '../../components/Icon'
import GroupChatScreen from './GroupChatScreen'

const { height } = Dimensions.get('window')


const mockReels = [
  {
    id: '1',
    user: 'inklab_pk',
caption: 'Haq ki baat — VOID CHAT pe! 🔓 #freedom',
    views: '2.3M',
    likes: 45231,
    VOID: 4600,
    color: '#1a1a2e'
  },
  {
    id: '2',
    user: 'anonymous_creator',
    caption: 'Koi nahi jaanta kaun hun main 🕵️ #anonymous',
    views: '891K',
    likes: 12453,
    VOID: 1782,
    color: '#16213e'
  },
  {
    id: '3',
    user: 'fatima_art',
    caption: 'Meri zindagi mera faisla 🎨 #VOID CHAT',
    views: '4.1M',
    likes: 89234,
    VOID: 8200,
    color: '#0f3460'
  },
]

export default function ReelsScreen() {
  const [reels, setReels] = useState(mockReels)
  const [currentReel, setCurrentReel] = useState(0)

  useEffect(() => {
    const loadDynamicReels = async () => {
      try {
        const stored = await AsyncStorage.getItem('dynamic_reels')
        if (stored) {
          const parsed = JSON.parse(stored)
          setReels([...parsed, ...mockReels])
        }
      } catch (e) {
        console.warn('Error loading dynamic reels:', e)
      }
    }
    loadDynamicReels()
  }, [])
  const [liked, setLiked] = useState({})
  const [saved, setSaved] = useState({})
  const [reposted, setReposted] = useState({})
  const [selectedFilter, setSelectedFilter] = useState('normal')
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [showGroupChat, setShowGroupChat] = useState(false)

  // ── Hover Tooltip States & Timer ──
  const [hoveredButton, setHoveredButton] = useState(null)
  const hoverTimerRef = useRef(null)

  const handleMouseEnter = (name) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    setHoveredButton(name)
    // Automatically hide tooltip after 2 seconds (kuch hi second me gayab ho jaye)
    hoverTimerRef.current = setTimeout(() => {
      setHoveredButton(null)
    }, 2000)
  }

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    setHoveredButton(null)
  }
  
  const cameraFilters = [
    { name: 'normal',  label: 'Normal',  dot: '#9ca3af' },
    { name: 'sepia',   label: 'Sepia',   dot: '#a16207' },
    { name: 'cool',    label: 'Cool',    dot: '#38bdf8' },
    { name: 'bw',      label: 'B&W',     dot: '#6b7280' },
    { name: 'vintage', label: 'Vintage', dot: '#d97706' },
    { name: 'neon',    label: 'Neon',    dot: '#c084fc' },
    { name: 'blur',    label: 'Blur',    dot: '#e2e8f0' },
    { name: 'bright',  label: 'Bright',  dot: '#fbbf24' },
  ]
  
  const reel = reels[currentReel] || mockReels[0]

  if (showGroupChat) {
    return (
      <GroupChatScreen
        group={{ name: '🎥 Reel Group Chat' }}
        onBack={() => setShowGroupChat(false)}
      />
    )
  }

  const actionsList = [
    {
      name: 'like',
      label: 'Like',
      iconName: liked[reel.id] ? 'favorite' : 'favorite_border',
      iconColor: liked[reel.id] ? '#f87171' : '#ffffff',
      count: (reel.likes + (liked[reel.id] ? 1 : 0)).toLocaleString(),
      onPress: () => setLiked(p => ({ ...p, [reel.id]: !p[reel.id] }))
    },
    {
      name: 'comment',
      label: 'Comment',
      iconName: 'chat_bubble_outline',
      iconColor: '#ffffff',
      count: '1.2K',
      onPress: () => setShowGroupChat(true)
    },
    {
      name: 'share',
      label: 'Share',
      iconName: 'send',
      iconColor: '#ffffff',
      count: '892',
      onPress: () => Alert.alert('Share', 'Reel link copied to clipboard!')
    },
    {
      name: 'save',
      label: 'Save',
      iconName: saved[reel.id] ? 'bookmark' : 'bookmark_border',
      iconColor: saved[reel.id] ? '#fbbf24' : '#ffffff',
      count: saved[reel.id] ? '1' : '0',
      onPress: () => setSaved(p => ({ ...p, [reel.id]: !p[reel.id] }))
    },
    {
      name: 'repost',
      label: 'Repost',
      iconName: 'autorenew',
      iconColor: reposted[reel.id] ? '#4ade80' : '#ffffff',
      count: reposted[reel.id] ? '125' : '124',
      onPress: () => setReposted(p => ({ ...p, [reel.id]: !p[reel.id] }))
    }
  ]

  return (
    <View style={[styles.container, { backgroundColor: reel.color }]}>


      {/* Top Bar */}
      <View style={styles.topBar}>
        <Text style={styles.title}>REELS</Text>
      </View>

      {/* Play Area */}
      <View style={styles.playArea}>
        <View style={styles.playBtn}>
          <Text style={styles.playIcon}>▶</Text>
        </View>
        <Text style={styles.viewCount}>👁 {reel.views} views</Text>
      </View>

      {/* Right Actions */}
      <View style={styles.rightActions}>
        {actionsList.map((action) => (
          <TouchableOpacity
            key={action.name}
            style={styles.actionItem}
            onPress={action.onPress}
            onMouseEnter={() => handleMouseEnter(action.name)}
            onMouseLeave={handleMouseLeave}
            activeOpacity={0.8}
          >
            {/* Tooltip */}
            {hoveredButton === action.name && (
              <View style={styles.tooltipContainer}>
                <Text style={styles.tooltipText}>{action.label}</Text>
              </View>
            )}
            <Icon name={action.iconName} size={26} color={action.iconColor} />
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
          {reels.map((_, i) => (
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
                <View style={[styles.filterDot, { backgroundColor: filter.dot }]} />
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
          <View style={styles.recordDot} />
          <Text style={styles.recordText}>
            {isRecording ? 'Recording...' : 'Record Streak'}
          </Text>
          {selectedFilter !== 'normal' && (
            <View style={[styles.filterDot, { backgroundColor: cameraFilters.find(f => f.name === selectedFilter)?.dot }]} />
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.earnInfo}>
        <Text style={styles.earnText}>
          Creator ne {reel.VOID.toLocaleString()} VOID kamaye!
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
    color: '#fff',
  },
  encBadgeWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#ffffff15',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1, borderColor: '#ffffff30',
  },
  encDot: { color: '#4ade80', fontSize: 8 },
  encBadge: {
    fontSize: 11,
    color: '#ffffffcc',
    fontWeight: '700',
    letterSpacing: 0.5,
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
  VOIDBadge: {
    backgroundColor: '#1a2a0080',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#c8ff0040',
  },
  VOIDText: { color: '#c8ff00', fontSize: 13, fontWeight: '700' },
  rightActions: {
    position: 'absolute',
    right: 16,
    bottom: 160,
    gap: 16,
    alignItems: 'center',
    zIndex: 10,
  },
  actionItem: { 
    alignItems: 'center', 
    gap: 4,
    position: 'relative',
  },
  tooltipContainer: {
    position: 'absolute',
    right: 46,
    top: 2,
    backgroundColor: '#0a0a0c',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#c8ff0080',
    zIndex: 50,
  },
  tooltipText: {
    color: '#c8ff00',
    fontSize: 12,
    fontWeight: '700',
  },
  actionIcon: { fontSize: 28 },
  actionIconSymbol: {
    fontSize: 28, color: '#fff', fontWeight: '300',
    textShadowColor: '#00000060',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  actionCount: { color: '#fff', fontSize: 11, fontWeight: '600', marginTop: 2 },
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

  // Dot indicators (filters + recording)
  filterDot: {
    width: 20, height: 20, borderRadius: 10,
    marginBottom: 4,
    borderWidth: 1.5, borderColor: '#ffffff40',
  },
  recordDot: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#f87171',
    borderWidth: 1.5, borderColor: '#ff0000',
  },
})