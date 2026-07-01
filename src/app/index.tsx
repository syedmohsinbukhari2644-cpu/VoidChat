import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, StatusBar, SafeAreaView, Alert, Modal
} from 'react-native'
import LoginScreen from './login'
import ReelsScreen from './Screens/ReelsScreen'
import ChatScreen from './Screens/screen'
import NotificationsScreen from './Screens/NotificationsScreen'
import ReferScreen from './Screens/ReferScreen'
import { setToken, getFeed, getBalance, dailyLogin, likePost, createPost, getMyCode } from './api'

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [activeTab, setActiveTab] = useState('feed')
  const [posts, setPosts] = useState([])
  const [VOIDBalance, setVOIDBalance] = useState(0)
  const [pkrValue, setPkrValue] = useState(0)
  const [showCreate, setShowCreate] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)
  const [postContent, setPostContent] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [referCode, setReferCode] = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    if (isLoggedIn) {
      loadFeed()
      loadBalance()
      claimDailyBonus()
      loadReferCode()
    }
  }, [isLoggedIn])

  const loadFeed = async () => {
    try {
      const res = await getFeed()
      setPosts(res.data.posts)
    } catch (e) {}
  }

  const loadBalance = async () => {
    try {
      const res = await getBalance()
      setVOIDBalance(res.data.balance)
      setPkrValue(res.data.pkrValue)
    } catch (e) {}
  }

  const claimDailyBonus = async () => {
    try {
      const res = await dailyLogin()
      Alert.alert('🎉 Daily Bonus!', res.data.message)
    } catch (e) {}
  }

  const loadReferCode = async () => {
    try {
      const res = await getMyCode()
      setReferCode(res.data.referCode)
    } catch (e) {}
  }

  const handleLike = async (postId) => {
    try {
      await likePost(postId)
      loadFeed()
      loadBalance()
    } catch (e) {}
  }

  const handlePost = async () => {
    if (!postContent.trim()) {
      Alert.alert('Error', 'Write something first!')
      return
    }
    setPosting(true)
    try {
      const res = await createPost({ content: postContent, isAnonymous })
      Alert.alert('✅', res.data.message)
      setPostContent('')
      setShowCreate(false)
      loadFeed()
      loadBalance()
    } catch (e) {}
    setPosting(false)
  }

  const handleLogin = (token, balance) => {
    setToken(token)
    setVOIDBalance(balance)
    setIsLoggedIn(true)
  }

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />
  }

  const chats = [
    { id: '1', name: 'Zara 💑', color: '#ec4899', unread: 3, streak: 47 },
    { id: '2', name: 'Inklab Group', color: '#ff4d4d', unread: 12, streak: 0 },
    { id: '3', name: 'Anonymous_42', color: '#6366f1', unread: 0, streak: 23 },
    { id: '4', name: 'Ali Bhai', color: '#10b981', unread: 1, streak: 8 },
  ]

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>VOID CHAT 🔓</Text>
        <View style={styles.headerRight}>
          <View style={styles.VOIDBadge}>
            <Text style={styles.VOIDText}>⚡ {VOIDBalance} VOID</Text>
          </View>
          <TouchableOpacity onPress={() => setShowNotifs(true)}>
            <Text style={styles.notifBtn}>🔔</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <View style={{ flex: 1 }}>

        {/* FEED */}
        {activeTab === 'feed' && (
          <ScrollView style={styles.content}>
            {posts.length === 0 ? (
              <View style={styles.emptyFeed}>
                <Text style={styles.emptyIcon}>🔓</Text>
                <Text style={styles.emptyText}>
                  Make your first post — earn 40 VOID!
                </Text>
                <TouchableOpacity
                  style={styles.emptyBtn}
                  onPress={() => setShowCreate(true)}
                >
                  <Text style={styles.emptyBtnText}>Post Now</Text>
                </TouchableOpacity>
              </View>
            ) : (
              posts.map(post => (
                <View key={post._id} style={styles.post}>
                  <View style={styles.postHeader}>
                    <View style={[styles.avatar, {
                      backgroundColor: post.isAnonymous ? '#374151' : '#6366f1'
                    }]}>
                      <Text style={styles.avatarText}>
                        {post.isAnonymous ? '?' :
                          post.user?.username?.[0]?.toUpperCase() || 'U'}
                      </Text>
                    </View>
                    <View style={styles.postMeta}>
                      <Text style={styles.username}>
                        {post.isAnonymous ? '🕵️ Anonymous' :
                          `@${post.user?.username}`}
                      </Text>
                      <Text style={styles.postTime}>🔐 Encrypted</Text>
                    </View>
                    <View style={styles.VOIDEarned}>
                      <Text style={styles.VOIDEarnedText}>
                        +{post.VOIDEarned} VOID
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.postContent}>{post.content}</Text>
                  <View style={styles.postActions}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleLike(post._id)}
                    >
                      <Text style={styles.actionText}>
                        ❤️ {post.likes?.length || 0}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn}>
                      <Text style={styles.actionText}>
                        💬 {post.comments?.length || 0}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn}>
                      <Text style={styles.actionText}>↗️ Share</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}

        {/* REELS */}
        {activeTab === 'reels' && <ReelsScreen />}

        {/* INBOX */}
        {activeTab === 'inbox' && (
          <ScrollView style={styles.content}>
            <View style={styles.adBanner}>
              <Text style={styles.adText}>📢 Sponsored</Text>
            </View>
            {chats.map(chat => (
              <TouchableOpacity
                key={chat.id}
                style={styles.chatItem}
                onPress={() => setShowChat(chat)}
              >
                <View style={{ position: 'relative' }}>
                  <View style={[styles.chatAvatar, { backgroundColor: chat.color }]}>
                    <Text style={styles.avatarText}>{chat.name[0]}</Text>
                  </View>
                  {chat.streak > 0 && (
                    <View style={styles.streakBadge}>
                      <Text style={styles.streakBadgeText}>
                        🔥{chat.streak}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.chatInfo}>
                  <Text style={styles.chatName}>{chat.name}</Text>
                  <Text style={styles.chatLast}>🔐 Encrypted message</Text>
                </View>
                {chat.unread > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{chat.unread}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* WALLET */}
        {activeTab === 'wallet' && (
          <ScrollView style={styles.content}>
            <View style={{ padding: 16, gap: 12 }}>
              <View style={styles.walletCard}>
                <Text style={styles.walletLabel}>⚡ VOID Balance</Text>
                <Text style={styles.walletBalance}>{VOIDBalance} VOID</Text>
                <Text style={styles.walletPKR}>≈ {pkrValue} PKR</Text>
                <View style={styles.walletBtns}>
                  <TouchableOpacity style={styles.walletBtn}>
                    <Text style={styles.walletBtnText}>↑ Send</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.walletBtn}>
                    <Text style={styles.walletBtnText}>↓ Receive</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.walletBtn, styles.cashoutBtn]}>
                    <Text style={[styles.walletBtnText, styles.cashoutText]}>
                      💰 Cashout
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.miningCard}>
                <Text style={styles.miningTitle}>⛏️ VOID Mining Active!</Text>
                <Text style={styles.miningPoints}>{VOIDBalance} Points</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: '8%' }]} />
                </View>
                <Text style={styles.miningNote}>
                  8.2M / 100M users — Real Coins at launch! 🚀
                </Text>
              </View>

              {/* Refer Section */}
              <View style={styles.referMiniCard}>
                <Text style={styles.referTitle}>🎁 Refer Code</Text>
                <Text style={styles.referCode}>{referCode}</Text>
                <TouchableOpacity
                  style={styles.referBtn}
                  onPress={() => setActiveTab('refer')}
                >
                  <Text style={styles.referBtnText}>
                    Full Refer Dashboard →
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}

        {/* REFER */}
        {activeTab === 'refer' && <ReferScreen />}

        {/* PROFILE */}
        {activeTab === 'profile' && (
          <ScrollView style={styles.content}>
            <View style={styles.profileScreen}>
              <View style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>M</Text>
              </View>
              <Text style={styles.profileName}>@my_voidchat</Text>
              <Text style={styles.profileBio}>
                Truth first • Privacy first 🔐
              </Text>
              <View style={styles.profileStats}>
                {[
                  { label: 'Posts', value: posts.length.toString() },
                  { label: 'Followers', value: '0' },
                  { label: 'VOID', value: VOIDBalance.toString() },
                ].map((stat, i) => (
                  <View key={i} style={styles.statItem}>
                    <Text style={styles.statValue}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                ))}
              </View>

              {[
                { icon: '🎁', label: 'Refer & Earn', action: () => setActiveTab('refer') },
                { icon: '🔐', label: 'Privacy Settings', action: () => {} },
                { icon: '⚙️', label: 'Account Settings', action: () => {} },
                { icon: '🚪', label: 'Logout', action: () => setIsLoggedIn(false) },
              ].map((item, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.profileMenuItem}
                  onPress={item.action}
                >
                  <Text style={styles.menuIcon}>{item.icon}</Text>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}
      </View>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        {[
          { id: 'feed', icon: '⊞', label: 'Feed' },
          { id: 'reels', icon: '▶', label: 'Reels' },
          { id: 'create', icon: '✦', label: '', special: true },
          { id: 'inbox', icon: '✉', label: 'Inbox' },
          { id: 'wallet', icon: '⚡', label: 'Wallet' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.navBtn, tab.special && styles.navSpecial]}
            onPress={() => {
              if (tab.id === 'create') {
                setShowCreate(true)
              } else {
                setActiveTab(tab.id)
              }
            }}
          >
            <Text style={[
              styles.navIcon,
              tab.special && styles.navSpecialIcon,
              activeTab === tab.id && styles.navActiveIcon
            ]}>
              {tab.icon}
            </Text>
            {!tab.special && (
              <Text style={[
                styles.navLabel,
                activeTab === tab.id && styles.navLabelActive
              ]}>
                {tab.label}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Create Post Modal */}
      <Modal visible={showCreate} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreate(false)}>
              <Text style={styles.cancelBtn}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Post</Text>
            <TouchableOpacity
              style={[styles.postBtn, posting && { opacity: 0.6 }]}
              onPress={handlePost}
              disabled={posting}
            >
              <Text style={styles.postBtnText}>
                {posting ? 'Posting...' : 'Post +40 VOID'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ padding: 16, gap: 12 }}>
            <View style={styles.modalInput}>
              <Text
                style={[styles.inputText, !postContent && { color: '#4b5563' }]}
                onPress={() => {}}
              >
                {postContent || 'What\'s on your mind? Speak freely... 🔓'}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.anonToggle, isAnonymous && styles.anonToggleActive]}
              onPress={() => setIsAnonymous(!isAnonymous)}
            >
              <Text>{isAnonymous ? '🕵️' : '👤'}</Text>
              <Text style={[styles.anonText, isAnonymous && { color: '#a5b4fc' }]}>
                {isAnonymous ? 'Anonymous Mode ON' : 'Public Post'}
              </Text>
            </TouchableOpacity>

            <View style={styles.VOIDInfoCard}>
              <Text style={styles.VOIDInfoTitle}>⚡ Post & earn VOID!</Text>
              <Text style={styles.VOIDInfoItem}>📝 Post → +40 VOID</Text>
              <Text style={styles.VOIDInfoItem}>❤️ Likes received → +2 VOID each</Text>
              <Text style={styles.VOIDInfoItem}>💬 Comments received → +5 VOID each</Text>
            </View>
          </View>

          {/* Simple Text Input */}
          <View style={{ paddingHorizontal: 16 }}>
            <View style={styles.textBox}>
              {[
                'I am on VOID CHAT! 🔓',
                'Privacy first! 🛡️',
                'Speaking the truth! 🗣️',
                'No fear here! 💪',
              ].map((suggestion, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.suggestion}
                  onPress={() => setPostContent(suggestion)}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Chat Modal */}
      <Modal
        visible={!!showChat}
        animationType="slide"
      >
        <ChatScreen
          contact={showChat}
          onBack={() => setShowChat(false)}
        />
      </Modal>

      {/* Notifications Modal */}
      <Modal visible={showNotifs} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowNotifs(false)}>
              <Text style={styles.cancelBtn}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Notifications</Text>
            <View style={{ width: 60 }} />
          </View>
          <NotificationsScreen />
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  // ── Core layout ─────────────────────────────────────────────
  container: { flex: 1, backgroundColor: '#060608' },
  content:   { flex: 1 },

  // ── Header ──────────────────────────────────────────────────
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#1a1a24',
    backgroundColor: '#060608',
  },
  logo: {
    fontSize: 20, fontWeight: '900', color: '#c8ff00', letterSpacing: 1.5,
    textShadowColor: '#c8ff0040',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  VOIDBadge: {
    backgroundColor: '#0a1600', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: '#c8ff0035',
    shadowColor: '#c8ff00', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  VOIDText:  { color: '#c8ff00', fontSize: 12, fontWeight: '800' },
  notifBtn:  { fontSize: 22 },

  // ── Feed ────────────────────────────────────────────────────
  emptyFeed: { alignItems: 'center', paddingTop: 80, paddingBottom: 40, gap: 16 },
  emptyIcon: { fontSize: 56 },
  emptyText: { color: '#6b7280', fontSize: 15, textAlign: 'center', lineHeight: 22 },
  emptyBtn: {
    backgroundColor: '#c8ff00', paddingHorizontal: 28, paddingVertical: 13,
    borderRadius: 22,
    shadowColor: '#c8ff00', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55, shadowRadius: 14, elevation: 8,
  },
  emptyBtnText: { color: '#050608', fontWeight: '900', fontSize: 14 },

  post: {
    marginHorizontal: 12, marginTop: 10, padding: 16,
    backgroundColor: '#0e0e14', borderRadius: 18,
    borderWidth: 1, borderColor: '#1e1e2c',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 3,
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#1e1e2c',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  postMeta:   { flex: 1, marginLeft: 12 },
  username:   { color: '#f0f0ff', fontWeight: '700', fontSize: 14 },
  postTime:   { color: '#4b5568', fontSize: 11, marginTop: 2 },
  VOIDEarned: {
    backgroundColor: '#0a1600', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 12, borderWidth: 1, borderColor: '#c8ff0025',
  },
  VOIDEarnedText: { color: '#c8ff00', fontSize: 11, fontWeight: '700' },
  postContent: { color: '#dcdcee', fontSize: 14, lineHeight: 22, marginBottom: 14 },
  postActions: { flexDirection: 'row', gap: 6 },
  actionBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#131319', borderWidth: 1, borderColor: '#1e1e2c',
  },
  actionText: { color: '#6b7280', fontSize: 13 },

  // ── Inbox ───────────────────────────────────────────────────
  adBanner: {
    margin: 12, padding: 12, backgroundColor: '#0e0e14',
    borderRadius: 12, borderWidth: 1, borderColor: '#1e1e2c',
  },
  adText: { color: '#6b7280', fontSize: 12 },
  chatItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#0f0f18', gap: 14,
  },
  chatAvatar: {
    width: 50, height: 50, borderRadius: 25,
    justifyContent: 'center', alignItems: 'center',
  },
  chatInfo: { flex: 1 },
  chatName:  { color: '#f0f0ff', fontWeight: '700', fontSize: 15 },
  chatLast:  { color: '#6b7280', fontSize: 12, marginTop: 3 },
  streakBadge: {
    position: 'absolute', bottom: -2, right: -4,
    backgroundColor: '#1a0a00', paddingHorizontal: 4, paddingVertical: 1,
    borderRadius: 8, borderWidth: 1, borderColor: '#fb923c30',
  },
  streakBadgeText: { color: '#fb923c', fontSize: 9, fontWeight: '700' },
  unreadBadge: {
    backgroundColor: '#c8ff00', borderRadius: 12,
    minWidth: 22, height: 22,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6,
    shadowColor: '#c8ff00', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55, shadowRadius: 6, elevation: 5,
  },
  unreadText: { color: '#050608', fontSize: 11, fontWeight: '900' },

  // ── Wallet ──────────────────────────────────────────────────
  walletCard: {
    backgroundColor: '#0a1600', borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: '#c8ff0030',
    shadowColor: '#c8ff00', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18, shadowRadius: 20, elevation: 8,
  },
  walletLabel:   { color: '#c8ff00', fontSize: 12, fontWeight: '800', marginBottom: 10, letterSpacing: 1 },
  walletBalance: { color: '#c8ff00', fontSize: 38, fontWeight: '900', marginBottom: 4 },
  walletPKR:     { color: '#6b7280', fontSize: 14, marginBottom: 20 },
  walletBtns:    { flexDirection: 'row', gap: 10 },
  walletBtn: {
    flex: 1, paddingVertical: 12, backgroundColor: '#ffffff08',
    borderRadius: 14, borderWidth: 1, borderColor: '#ffffff18', alignItems: 'center',
  },
  walletBtnText: { color: '#f0f0ff', fontSize: 13, fontWeight: '700' },
  cashoutBtn: {
    backgroundColor: '#c8ff00',
    shadowColor: '#c8ff00', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
  },
  cashoutText: { color: '#050608', fontWeight: '900' },
  miningCard: {
    backgroundColor: '#080f00', borderRadius: 20, padding: 18,
    borderWidth: 1, borderColor: '#c8ff0018',
  },
  miningTitle:  { color: '#c8ff00', fontSize: 14, fontWeight: '800', marginBottom: 6 },
  miningPoints: { color: '#f0f0ff', fontSize: 24, fontWeight: '900', marginBottom: 12 },
  progressBar: {
    height: 6, backgroundColor: '#0d1a00', borderRadius: 4,
    marginBottom: 8, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#c8ff00', borderRadius: 4 },
  miningNote:   { color: '#6b7280', fontSize: 12 },
  referMiniCard: {
    backgroundColor: '#0e0e14', borderRadius: 18, padding: 18,
    borderWidth: 1, borderColor: '#1e1e2c', alignItems: 'center',
  },
  referTitle: { color: '#f0f0ff', fontWeight: '800', marginBottom: 10 },
  referCode: {
    color: '#c8ff00', fontSize: 24, fontWeight: '900',
    letterSpacing: 3, marginBottom: 14,
  },
  referBtn: {
    backgroundColor: '#0a1600', paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1, borderColor: '#c8ff0030',
  },
  referBtnText: { color: '#c8ff00', fontSize: 13, fontWeight: '700' },

  // ── Profile ─────────────────────────────────────────────────
  profileScreen: { padding: 24, alignItems: 'center' },
  profileAvatar: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#c8ff00',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
    borderWidth: 3, borderColor: '#c8ff0060',
    shadowColor: '#c8ff00', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 10,
  },
  profileAvatarText: { fontSize: 36, fontWeight: '900', color: '#050608' },
  profileName:  { color: '#f0f0ff', fontSize: 20, fontWeight: '900', marginBottom: 6 },
  profileBio:   { color: '#6b7280', fontSize: 13, marginBottom: 28 },
  profileStats: { flexDirection: 'row', gap: 36, marginBottom: 32 },
  statItem:     { alignItems: 'center' },
  statValue:    { color: '#c8ff00', fontSize: 22, fontWeight: '900' },
  statLabel:    { color: '#6b7280', fontSize: 12, marginTop: 2 },
  profileMenuItem: {
    flexDirection: 'row', alignItems: 'center', width: '100%',
    padding: 16, backgroundColor: '#0e0e14', borderRadius: 16,
    marginBottom: 10, gap: 14, borderWidth: 1, borderColor: '#1e1e2c',
  },
  menuIcon:  { fontSize: 20 },
  menuLabel: { flex: 1, color: '#f0f0ff', fontSize: 15, fontWeight: '600' },
  menuArrow: { color: '#3a3a5a', fontSize: 20 },

  // ── Bottom Navigation ────────────────────────────────────────
  bottomNav: {
    flexDirection: 'row', justifyContent: 'space-around',
    alignItems: 'center', paddingVertical: 10, paddingBottom: 18,
    backgroundColor: '#08080c',
    borderTopWidth: 1, borderTopColor: '#1a1a24',
  },
  navBtn:        { alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, minWidth: 52 },
  navSpecial: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: '#c8ff00',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#c8ff00', shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.65, shadowRadius: 14, elevation: 12,
  },
  navIcon:        { fontSize: 22, color: '#3a3a5a' },
  navSpecialIcon: { color: '#050608', fontWeight: '900' },
  navActiveIcon:  { color: '#c8ff00' },
  navLabel:       { fontSize: 10, color: '#3a3a5a', marginTop: 3, fontWeight: '600' },
  navLabelActive: { color: '#c8ff00' },

  // ── Modals ──────────────────────────────────────────────────
  modalContainer: { flex: 1, backgroundColor: '#060608' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 16,
    borderBottomWidth: 1, borderBottomColor: '#1a1a24',
  },
  cancelBtn:  { color: '#6b7280', fontSize: 15, fontWeight: '600' },
  modalTitle: { color: '#f0f0ff', fontSize: 17, fontWeight: '900' },
  postBtn: {
    backgroundColor: '#c8ff00', paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: 20,
    shadowColor: '#c8ff00', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5, shadowRadius: 10, elevation: 6,
  },
  postBtnText: { color: '#050608', fontWeight: '900', fontSize: 13 },
  modalInput: {
    backgroundColor: '#0e0e14', borderRadius: 16, padding: 16,
    minHeight: 110, borderWidth: 1, borderColor: '#1e1e2c',
  },
  inputText: { color: '#f0f0ff', fontSize: 15, lineHeight: 24 },
  anonToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16,
    backgroundColor: '#0e0e14', borderRadius: 16,
    borderWidth: 1, borderColor: '#1e1e2c',
  },
  anonToggleActive: { backgroundColor: '#0e0c2e', borderColor: '#6366f1' },
  anonText:         { color: '#6b7280', fontWeight: '700' },
  VOIDInfoCard: {
    backgroundColor: '#0a1600', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#c8ff0018',
  },
  VOIDInfoTitle: { color: '#c8ff00', fontWeight: '800', fontSize: 13, marginBottom: 10 },
  VOIDInfoItem:  { color: '#6b7280', fontSize: 12, marginBottom: 5, lineHeight: 18 },
  textBox:       { gap: 10 },
  suggestion: {
    backgroundColor: '#0e0e14', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#1e1e2c',
  },
  suggestionText: { color: '#8b8ba7', fontSize: 13 },
})