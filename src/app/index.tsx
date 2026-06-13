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
  const [azdBalance, setAzdBalance] = useState(0)
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
      setAzdBalance(res.data.balance)
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
      Alert.alert('Error', 'Kuch likho!')
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
    setAzdBalance(balance)
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
        <Text style={styles.logo}>AZAAD 🔓</Text>
        <View style={styles.headerRight}>
          <View style={styles.azdBadge}>
            <Text style={styles.azdText}>⚡ {azdBalance} AZD</Text>
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
                  Pehla post karo — 40 AZD kamao!
                </Text>
                <TouchableOpacity
                  style={styles.emptyBtn}
                  onPress={() => setShowCreate(true)}
                >
                  <Text style={styles.emptyBtnText}>Post Karo</Text>
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
                    <View style={styles.azdEarned}>
                      <Text style={styles.azdEarnedText}>
                        +{post.azdEarned} AZD
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
              <Text style={styles.adText}>📢 Sponsored — Sirf Inbox Mein</Text>
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
                <Text style={styles.walletLabel}>⚡ AZD Balance</Text>
                <Text style={styles.walletBalance}>{azdBalance} AZD</Text>
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
                <Text style={styles.miningTitle}>⛏️ AZD Mining Active!</Text>
                <Text style={styles.miningPoints}>{azdBalance} Points</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: '8%' }]} />
                </View>
                <Text style={styles.miningNote}>
                  8.2M / 100M users — Launch pe Real Coins! 🚀
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
              <Text style={styles.profileName}>@mera_azaad</Text>
              <Text style={styles.profileBio}>
                Haq ki baat • Privacy first 🔐
              </Text>
              <View style={styles.profileStats}>
                {[
                  { label: 'Posts', value: posts.length.toString() },
                  { label: 'Followers', value: '0' },
                  { label: 'AZD', value: azdBalance.toString() },
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
                {posting ? 'Posting...' : 'Post +40 AZD'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ padding: 16, gap: 12 }}>
            <View style={styles.modalInput}>
              <Text
                style={[styles.inputText, !postContent && { color: '#4b5563' }]}
                onPress={() => {}}
              >
                {postContent || 'Kya soch rahe ho? Azaad ho ke likho... 🔓'}
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

            <View style={styles.azdInfoCard}>
              <Text style={styles.azdInfoTitle}>⚡ Post karo — AZD kamao!</Text>
              <Text style={styles.azdInfoItem}>📝 Post → +40 AZD</Text>
              <Text style={styles.azdInfoItem}>❤️ Like milein → +2 AZD each</Text>
              <Text style={styles.azdInfoItem}>💬 Comment milein → +5 AZD each</Text>
            </View>
          </View>

          {/* Simple Text Input */}
          <View style={{ paddingHorizontal: 16 }}>
            <View style={styles.textBox}>
              {[
                'Azaad hun main! 🔓',
                'Privacy zindabad! 🛡️',
                'Haq ki baat karunga! 🗣️',
                'Yahan koi darr nahi! 💪',
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
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  logo: { fontSize: 22, fontWeight: '800', color: '#c8ff00' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  azdBadge: {
    backgroundColor: '#1a2a00',
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1,
    borderColor: '#c8ff0040',
  },
  azdText: { color: '#c8ff00', fontSize: 12, fontWeight: '700' },
  notifBtn: { fontSize: 20 },
  content: { flex: 1 },
  emptyFeed: {
    alignItems: 'center',
    paddingTop: 80, paddingBottom: 40, gap: 12,
  },
  emptyIcon: { fontSize: 48 },
  emptyText: { color: '#6b7280', fontSize: 14, textAlign: 'center' },
  emptyBtn: {
    backgroundColor: '#c8ff00',
    paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: 20,
  },
  emptyBtnText: { color: '#0a0a0a', fontWeight: '700' },
  post: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#111' },
  postHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 10
  },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  postMeta: { flex: 1, marginLeft: 10 },
  username: { color: '#f9fafb', fontWeight: '700', fontSize: 13 },
  postTime: { color: '#4b5563', fontSize: 11, marginTop: 2 },
  azdEarned: {
    backgroundColor: '#1a2a00',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 12, borderWidth: 1,
    borderColor: '#c8ff0030',
  },
  azdEarnedText: { color: '#c8ff00', fontSize: 11, fontWeight: '700' },
  postContent: {
    color: '#e5e7eb', fontSize: 14,
    lineHeight: 22, marginBottom: 12,
  },
  postActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 6 },
  actionText: { color: '#6b7280', fontSize: 13 },
  adBanner: {
    margin: 12, padding: 12,
    backgroundColor: '#111', borderRadius: 10,
    borderWidth: 1, borderColor: '#1f2937',
  },
  adText: { color: '#6b7280', fontSize: 12 },
  chatItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderBottomWidth: 1,
    borderBottomColor: '#111', gap: 12,
  },
  chatAvatar: {
    width: 46, height: 46, borderRadius: 23,
    justifyContent: 'center', alignItems: 'center',
  },
  chatInfo: { flex: 1 },
  chatName: { color: '#f9fafb', fontWeight: '600', fontSize: 14 },
  chatLast: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  streakBadge: {
    position: 'absolute', bottom: -2, right: -4,
    backgroundColor: '#1a0a00',
    paddingHorizontal: 4, paddingVertical: 1,
    borderRadius: 8, borderWidth: 1,
    borderColor: '#ff4d4d30',
  },
  streakBadgeText: { color: '#ff4d4d', fontSize: 9 },
  unreadBadge: {
    backgroundColor: '#c8ff00', borderRadius: 10,
    minWidth: 20, height: 20,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 5,
  },
  unreadText: { color: '#0a0a0a', fontSize: 10, fontWeight: '800' },
  walletCard: {
    backgroundColor: '#1a2a00',
    borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: '#c8ff0030',
  },
  walletLabel: { color: '#c8ff00', fontSize: 12, fontWeight: '700', marginBottom: 8 },
  walletBalance: { color: '#c8ff00', fontSize: 32, fontWeight: '800', marginBottom: 4 },
  walletPKR: { color: '#6b7280', fontSize: 14, marginBottom: 16 },
  walletBtns: { flexDirection: 'row', gap: 8 },
  walletBtn: {
    flex: 1, padding: 10,
    backgroundColor: '#ffffff10',
    borderRadius: 10, borderWidth: 1,
    borderColor: '#ffffff20', alignItems: 'center',
  },
  walletBtnText: { color: '#f9fafb', fontSize: 12, fontWeight: '600' },
  cashoutBtn: { backgroundColor: '#c8ff00' },
  cashoutText: { color: '#0a0a0a' },
  miningCard: {
    backgroundColor: '#0a1500',
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#c8ff0020',
  },
  miningTitle: { color: '#c8ff00', fontSize: 14, fontWeight: '700', marginBottom: 4 },
  miningPoints: { color: '#f9fafb', fontSize: 20, fontWeight: '800', marginBottom: 10 },
  progressBar: {
    height: 6, backgroundColor: '#1a2a00',
    borderRadius: 4, marginBottom: 8, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#c8ff00', borderRadius: 4 },
  miningNote: { color: '#6b7280', fontSize: 11 },
  referMiniCard: {
    backgroundColor: '#111',
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#1f2937',
    alignItems: 'center',
  },
  referTitle: { color: '#f9fafb', fontWeight: '700', marginBottom: 8 },
  referCode: {
    color: '#c8ff00', fontSize: 22,
    fontWeight: '800', letterSpacing: 2, marginBottom: 12,
  },
  referBtn: {
    backgroundColor: '#1a2a00',
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1,
    borderColor: '#c8ff0030',
  },
  referBtnText: { color: '#c8ff00', fontSize: 13, fontWeight: '600' },
  profileScreen: { padding: 20, alignItems: 'center' },
  profileAvatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#c8ff00',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  profileAvatarText: { fontSize: 32, fontWeight: '800', color: '#0a0a0a' },
  profileName: { color: '#f9fafb', fontSize: 18, fontWeight: '800', marginBottom: 4 },
  profileBio: { color: '#6b7280', fontSize: 12, marginBottom: 24 },
  profileStats: { flexDirection: 'row', gap: 30, marginBottom: 30 },
  statItem: { alignItems: 'center' },
  statValue: { color: '#c8ff00', fontSize: 20, fontWeight: '800' },
  statLabel: { color: '#6b7280', fontSize: 12 },
  profileMenuItem: {
    flexDirection: 'row', alignItems: 'center',
    width: '100%', padding: 14,
    backgroundColor: '#111', borderRadius: 12,
    marginBottom: 8, gap: 12,
    borderWidth: 1, borderColor: '#1f2937',
  },
  menuIcon: { fontSize: 18 },
  menuLabel: { flex: 1, color: '#f9fafb', fontSize: 14, fontWeight: '500' },
  menuArrow: { color: '#4b5563', fontSize: 18 },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 10, paddingBottom: 16,
    backgroundColor: '#0a0a0a',
    borderTopWidth: 1, borderTopColor: '#1a1a1a',
  },
  navBtn: { alignItems: 'center', padding: 4 },
  navSpecial: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#c8ff00',
    justifyContent: 'center', alignItems: 'center',
  },
  navIcon: { fontSize: 20, color: '#4b5563' },
  navSpecialIcon: { color: '#0a0a0a' },
  navActiveIcon: { color: '#c8ff00' },
  navLabel: { fontSize: 9, color: '#4b5563', marginTop: 2 },
  navLabelActive: { color: '#c8ff00' },
  modalContainer: { flex: 1, backgroundColor: '#0a0a0a' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  cancelBtn: { color: '#6b7280', fontSize: 15 },
  modalTitle: { color: '#f9fafb', fontSize: 16, fontWeight: '700' },
  postBtn: {
    backgroundColor: '#c8ff00',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20,
  },
  postBtnText: { color: '#0a0a0a', fontWeight: '800', fontSize: 12 },
  modalInput: {
    backgroundColor: '#111',
    borderRadius: 12, padding: 14,
    minHeight: 100, borderWidth: 1,
    borderColor: '#1f2937',
  },
  inputText: { color: '#f9fafb', fontSize: 15, lineHeight: 22 },
  anonToggle: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, padding: 14,
    backgroundColor: '#111', borderRadius: 12,
    borderWidth: 1, borderColor: '#1f2937',
  },
  anonToggleActive: {
    backgroundColor: '#1a1a2e',
    borderColor: '#6366f1',
  },
  anonText: { color: '#6b7280', fontWeight: '600' },
  azdInfoCard: {
    backgroundColor: '#1a2a00',
    borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#c8ff0020',
  },
  azdInfoTitle: { color: '#c8ff00', fontWeight: '700', fontSize: 13, marginBottom: 8 },
  azdInfoItem: { color: '#6b7280', fontSize: 12, marginBottom: 4 },
  textBox: { gap: 8 },
  suggestion: {
    backgroundColor: '#111',
    borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: '#1f2937',
  },
  suggestionText: { color: '#9ca3af', fontSize: 13 },
})