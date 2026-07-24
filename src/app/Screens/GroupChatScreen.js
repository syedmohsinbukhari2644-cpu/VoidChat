import { useState, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, Alert, StatusBar
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Icon from '../../components/Icon'
import ChatDoodleBackground from '../../components/ChatDoodleBackground'

import { getGroupMessages, sendGroupMessage, addGroupMember, removeGroupMember } from '../api'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function GroupChatScreen({ group, allUsers, onRefresh, onRemoveGroupMember, onBack }) {
  const insets = useSafeAreaInsets()
  const topInset = Platform.OS === 'web' ? 0 : Math.max(insets.top || 0, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loadingMessages, setLoadingMessages] = useState(false)
  const scrollViewRef = useRef(null)
  const [myUserId, setMyUserId] = useState('me')

  useEffect(() => {
    AsyncStorage.getItem('@void_current_user').then(val => {
      if (val) {
        try {
          const user = JSON.parse(val)
          if (user?._id || user?.id) {
            setMyUserId(String(user._id || user.id))
          }
        } catch (e) {}
      }
    })
  }, [])

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false })
      }, 30)
    }
  }, [group?.id, messages.length])

  const [showGroupMenu, setShowGroupMenu] = useState(false)
  const [showMediaMenu, setShowMediaMenu] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState('normal')
  const [showFilterMenu, setShowFilterMenu] = useState(false)

  const fetchMessages = async () => {
    try {
      if (!group?.id) return
      
      const me = await AsyncStorage.getItem('@void_current_user')
      const currentUser = me ? JSON.parse(me) : null
      const myId = currentUser?._id || currentUser?.id || 'me'

      const res = await getGroupMessages(group.id)
      if (res?.data?.success && Array.isArray(res.data.messages)) {
        setMessages(res.data.messages.map((m, idx) => {
          const senderId = m.sender?._id || m.senderId || ''
          const isMe = String(senderId) === String(myId)
          return {
            id: m._id || m.id || String(idx),
            from: isMe ? 'You' : (m.sender?.name || m.senderName || 'Them'),
            avatar: m.sender?.avatar || '👤',
            type: 'text',
            text: m.content,
            time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            streak: false,
            senderId: senderId
          }
        }))
      }
    } catch (e) {
      console.log('Load group messages failed:', e)
    }
  }

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 4000)
    return () => clearInterval(interval)
  }, [group?.id])

  // Derive group members list from Firestore group members list
  const groupMembers = (group?.members || []).map((memberId, index) => {
    const u = (allUsers || []).find(usr => String(usr._id || usr.id) === String(memberId))
    return {
      id: memberId,
      name: u ? (u.name || u.username) : 'Group Member',
      avatar: u ? u.avatar : '👤',
      username: u ? u.username || 'member' : 'member',
      status: String(group?.creator) === String(memberId) ? 'admin' : 'member',
      joined: 'Active'
    }
  })

  const [newMemberName, setNewMemberName] = useState('')
  const [showAddMember, setShowAddMember] = useState(false)


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

  const sendMessage = async () => {
    if (!input.trim()) return
    const text = input.trim()
    if (!group?.id) return

    setInput('')
    const optimisticMsg = {
      id: 'gmsg_ns_' + Date.now(),
      from: 'You',
      avatar: '👩',
      type: 'text',
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      streak: false,
    }

    setMessages(prev => [...prev, optimisticMsg])
    try {
      await sendGroupMessage(group.id, { content: text })
      fetchMessages()
    } catch (e) {
      console.log('Group send error:', e)
    }
  }


  const addMember = async () => {
    const cleanUsername = newMemberName.trim().toLowerCase().replace(/^@/, '')
    if (!cleanUsername) {
      Alert.alert('⚠️ Username required', 'Please type member username!')
      return
    }
    
    const targetUser = (allUsers || []).find(u => String(u.username || '').toLowerCase() === cleanUsername)
    if (!targetUser) {
      Alert.alert('Error', 'User not found!')
      return
    }

    const userId = targetUser._id || targetUser.id
    try {
      const res = await addGroupMember(group.id, userId)
      if (res.data.success) {
        Alert.alert('✅ Added', `Successfully added @${cleanUsername} to the group!`)
        setNewMemberName('')
        setShowAddMember(false)
        if (onRefresh) onRefresh()
      } else {
        Alert.alert('Error', 'Failed to add member.')
      }
    } catch (e) {
      Alert.alert('Error', 'Could not add member.')
    }
  }

  const removeMember = async (memberId) => {
    if (groupMembers.length <= 2) {
      Alert.alert('⚠️ Cannot remove', 'Group must have at least 2 members')
      return
    }
    
    try {
      if (onRemoveGroupMember) {
        await onRemoveGroupMember(group.id, memberId)
      } else {
        await removeGroupMember(group.id, memberId)
        if (onRefresh) onRefresh()
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to remove member.')
    }
  }

  // legacy UI helper for media menu (mock) — text send uses real API
  const sendLocalMockMessage = (content, type = 'text') => {
    const msg = {
      id: Date.now().toString(),
      from: 'You',
      avatar: '👩',
      type: type,
      text: content,
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit', minute: '2-digit'
      }),
      streak: false
    }
    setMessages(prev => [...prev, msg])
    setShowMediaMenu(false)
    setShowFilterMenu(false)
  }


  const leaveGroup = () => {
    Alert.alert(
      '👋 Group chhod do?',
      'Aap is group se nikal jayenge',
      [
        { text: 'Cancel', onPress: () => {} },
        { 
          text: 'Leave', 
          onPress: async () => {
            try {
              if (onRemoveGroupMember) {
                await onRemoveGroupMember(group.id, myUserId)
              } else {
                await removeGroupMember(group.id, myUserId)
              }
              if (onRefresh) onRefresh()
              Alert.alert('👋 Left', 'Group se nikal gaye!')
              onBack()
            } catch (e) {
              Alert.alert('Error', 'Failed to leave group.')
            }
          }
        }
      ]
    )
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: topInset }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={onBack} style={{ padding: 4 }}>
            <Icon name="arrow_back" size={22} color="#d946ef" />
          </TouchableOpacity>
          <View style={{ flexDirection: 'column', marginLeft: 8 }}>
            <Text style={styles.groupName}>{group?.name || 'Group Chat'}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Icon name="people" size={12} color="#8b8ba7" />
              <Text style={styles.memberCount}>{groupMembers.length} members</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.groupInfoBtn}
          onPress={() => setShowGroupMenu(!showGroupMenu)}
        >
          <Icon name="info" size={22} color="#d946ef" />
        </TouchableOpacity>
      </View>

      {/* Group Info Menu */}
      {showGroupMenu && (
        <View style={styles.groupMenu}>
          <TouchableOpacity 
            style={styles.menuOption}
            onPress={() => {
              setShowMembers(!showMembers)
              setShowGroupMenu(false)
            }}
          >
            <Icon name="people" size={18} color="#d946ef" style={styles.menuIcon} />
            <Text style={styles.menuLabel}>Members ({groupMembers.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.menuOption}
            onPress={() => {
              setShowAddMember(true)
              setShowGroupMenu(false)
            }}
          >
            <Icon name="add" size={18} color="#d946ef" style={styles.menuIcon} />
            <Text style={styles.menuLabel}>Add Member</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.menuOption}
            onPress={() => Alert.alert('⚙️ Settings', 'Group settings here')}
          >
            <Icon name="settings" size={18} color="#d946ef" style={styles.menuIcon} forceEmoji={true} />
            <Text style={styles.menuLabel}>Group Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.menuOption, styles.menuOptionDanger]}
            onPress={leaveGroup}
          >
            <Icon name="logout" size={18} color="#ef4444" style={styles.menuIcon} />
            <Text style={[styles.menuLabel, styles.menuLabelDanger]}>Leave Group</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Members Panel */}
      {showMembers && (
        <View style={styles.membersPanel}>
          <View style={styles.membersPanelHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="people" size={20} color="#d946ef" />
              <Text style={styles.membersPanelTitle}>Group Members</Text>
            </View>
            <TouchableOpacity onPress={() => setShowMembers(false)}>
              <Text style={styles.membersPanelClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.membersList}>
            {groupMembers.map((member) => (
              <View key={member.id} style={styles.memberItem}>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberAvatar}>{member.avatar}</Text>
                  <View style={styles.memberDetails}>
                    <View style={styles.memberNameRow}>
                      <Text style={styles.memberName}>{member.name}</Text>
                      {member.status === 'admin' && (
                        <Text style={styles.adminBadge}>👑 Admin</Text>
                      )}
                    </View>
                    <Text style={styles.memberJoined}>Joined: {member.joined}</Text>
                  </View>
                </View>
                {String(member.id) !== String(myUserId) && (
                  <TouchableOpacity 
                    style={styles.removeBtn}
                    onPress={() => removeMember(member.id)}
                  >
                    <Text style={styles.removeBtnIcon}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Add Member Modal */}
      {showAddMember && (
        <View style={styles.addMemberOverlay}>
          <View style={styles.addMemberModal}>
            <Text style={styles.addMemberTitle}>➕ Add Member</Text>
            <TextInput
              style={styles.addMemberInput}
              placeholder="Member ka naam likho..."
              placeholderTextColor="#6b7280"
              value={newMemberName}
              onChangeText={setNewMemberName}
            />
            <View style={styles.addMemberButtons}>
              <TouchableOpacity 
                style={styles.addMemberCancelBtn}
                onPress={() => {
                  setShowAddMember(false)
                  setNewMemberName('')
                }}
              >
                <Text style={styles.addMemberCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.addMemberAddBtn}
                onPress={addMember}
              >
                <Text style={styles.addMemberAddText}>➕ Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Messages, Menus, and Input wrapped in KeyboardAvoidingView */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.select({ ios: 90, android: 0 })}
      >
        {/* Messages */}
        <View style={{ flex: 1, position: 'relative', overflow: 'hidden', backgroundColor: '#060608' }}>
          <ChatDoodleBackground opacity={0.08} />
          <ScrollView 
            ref={scrollViewRef}
            style={[styles.messagesContainer, { backgroundColor: 'transparent' }]} 
            showsVerticalScrollIndicator={false} 
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
          >
            {loadingMessages && (
              <Text style={{ color: '#6b7280', textAlign: 'center', marginVertical: 10 }}>Loading...</Text>
            )}

            {!loadingMessages && messages.length === 0 && (
              <Text style={{ color: '#6b7280', textAlign: 'center', marginVertical: 10 }}>
                No messages yet
              </Text>
            )}

            {messages.map((msg) => (
              <View key={msg.id} style={[styles.msgRow, msg.from === 'You' ? styles.msgRowMe : styles.msgRowThem]}>
                {msg.from !== 'You' && (
                  <Text style={styles.msgAvatar}>{msg.avatar}</Text>
                )}

                <View style={[styles.bubble, msg.from === 'You' ? styles.bubbleMe : styles.bubbleThem]}>
                  {msg.from !== 'You' && (
                    <Text style={styles.senderName}>{msg.from}</Text>
                  )}
                  <Text style={styles.msgText}>{msg.text}</Text>
                  <View style={styles.msgMeta}>
                    <Text style={styles.msgTime}>{msg.time}</Text>
                    {msg.from === 'You' && <Text style={styles.msgStatus}>✓✓</Text>}
                    {msg.streak && <Text style={styles.streakBadge}>🔥</Text>}
                  </View>
                </View>

                {msg.from === 'You' && (
                  <Text style={styles.msgAvatar}>{msg.avatar}</Text>
                )}
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Filter Menu */}
        {showFilterMenu && (
          <View style={styles.filterMenu}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Choose Filter</Text>
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
                  <Text style={filter.emoji ? styles.filterEmoji : {}}>{filter.emoji}</Text>
                  <Text style={styles.filterLabel}>{filter.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Media Menu */}
        {showMediaMenu && (
          <View style={styles.mediaMenu}>
            <TouchableOpacity 
              style={styles.mediaOption} 
              onPress={() => {
                setShowFilterMenu(true)
                setShowMediaMenu(false)
              }}
            >
              <Icon name="photo_camera" size={28} color="#d946ef" style={styles.mediaIcon} />
              <Text style={styles.mediaLabel}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.mediaOption}
              onPress={() => sendLocalMockMessage('🖼️ Image shared', 'image')}
            >
              <Icon name="image" size={28} color="#d946ef" style={styles.mediaIcon} />
              <Text style={styles.mediaLabel}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.mediaOption}
              onPress={() => sendLocalMockMessage('📍 Location: Karachi', 'location')}
            >
              <Icon name="location_on" size={28} color="#d946ef" style={styles.mediaIcon} />
              <Text style={styles.mediaLabel}>Location</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.mediaOption}
              onPress={() => sendLocalMockMessage('👥 Contact shared', 'contact')}
            >
              <Icon name="person" size={28} color="#d946ef" style={styles.mediaIcon} />
              <Text style={styles.mediaLabel}>Contact</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.mediaOption}
              onPress={() => sendLocalMockMessage('📄 Document.pdf', 'document')}
            >
              <Icon name="description" size={28} color="#d946ef" style={styles.mediaIcon} />
              <Text style={styles.mediaLabel}>Document</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputArea}>
          <View style={styles.inputRow}>
            <TouchableOpacity 
              style={styles.mediaBtn}
              onPress={() => setShowMediaMenu(!showMediaMenu)}
            >
              <Icon name="add" size={24} color="#d946ef" />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="Message likho..."
              placeholderTextColor="#4b5563"
              value={input}
              onChangeText={setInput}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, input.trim() && styles.sendBtnActive]}
              onPress={sendMessage}
            >
              <Icon name="send" size={20} color="#d946ef" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  
  backIcon: { fontSize: 20, color: '#d946ef', fontWeight: '800' },
  
  groupName: { color: '#f9fafb', fontSize: 16, fontWeight: '700' },
  
  memberCount: { color: '#6b7280', fontSize: 11, marginTop: 2 },
  
  groupInfoBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a0a2e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#d946ef',
  },
  
  groupInfoIcon: { fontSize: 18, color: '#d946ef' },
  
  groupMenu: {
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    padding: 8,
    gap: 4,
  },
  
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  
  menuOptionDanger: {
    borderColor: '#ff4d4d30',
  },
  
  menuIcon: { fontSize: 18 },
  
  menuLabel: { color: '#f9fafb', fontWeight: '600', fontSize: 12 },
  
  menuLabelDanger: { color: '#ff4d4d' },
  
  membersPanel: {
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    maxHeight: 300,
    marginVertical: 8,
  },
  
  membersPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  
  membersPanelTitle: { color: '#d946ef', fontWeight: '700', fontSize: 13 },
  
  membersPanelClose: { color: '#6b7280', fontSize: 16, fontWeight: '700' },
  
  membersList: { paddingHorizontal: 8, paddingVertical: 8 },
  
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  
  memberAvatar: { fontSize: 24 },
  
  memberDetails: { flex: 1 },
  
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  
  memberName: { color: '#f9fafb', fontWeight: '700', fontSize: 12 },
  
  adminBadge: { color: '#d946ef', fontSize: 10, fontWeight: '700' },
  
  memberJoined: { color: '#6b7280', fontSize: 9, marginTop: 2 },
  
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ff4d4d20',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff4d4d30',
  },
  
  removeBtnIcon: { color: '#ff4d4d', fontSize: 14, fontWeight: '700' },
  
  addMemberOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  
  addMemberModal: {
    backgroundColor: '#0a0a0a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1a1a1a',
    width: '80%',
    padding: 16,
  },
  
  addMemberTitle: { color: '#d946ef', fontWeight: '700', fontSize: 14, marginBottom: 12 },
  
  addMemberInput: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#1a1a1a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f9fafb',
    marginBottom: 12,
    fontWeight: '500',
  },
  
  addMemberButtons: { flexDirection: 'row', gap: 8 },
  
  addMemberCancelBtn: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  
  addMemberCancelText: { color: '#6b7280', fontWeight: '700', fontSize: 12 },
  
  addMemberAddBtn: {
    flex: 1,
    backgroundColor: '#d946ef20',
    borderWidth: 1,
    borderColor: '#d946ef',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  
  addMemberAddText: { color: '#d946ef', fontWeight: '700', fontSize: 12 },
  
  messagesContainer: { flex: 1, paddingHorizontal: 12, paddingTop: 8 },
  
  msgRow: { marginVertical: 4, flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  
  msgRowMe: { justifyContent: 'flex-end' },
  
  msgRowThem: { justifyContent: 'flex-start' },
  
  msgAvatar: { fontSize: 28 },
  
  bubble: {
    maxWidth: '70%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  
  bubbleMe: { backgroundColor: '#d946ef', borderBottomRightRadius: 4 },
  
  bubbleThem: { backgroundColor: '#1a1a2e', borderBottomLeftRadius: 4 },
  
  senderName: { color: '#d946ef', fontSize: 10, fontWeight: '700', marginBottom: 2 },
  
  msgText: { color: '#f9fafb', fontSize: 13, fontWeight: '500' },
  
  msgMeta: { flexDirection: 'row', gap: 6, marginTop: 4, alignItems: 'center' },
  
  msgTime: { color: '#6b7280', fontSize: 10 },
  
  msgStatus: { color: '#ffffff80', fontSize: 10 },
  
  streakBadge: { fontSize: 12 },
  
  filterMenu: {
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
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
  
  filterTitle: { color: '#d946ef', fontWeight: '700', fontSize: 13 },
  
  filterClose: { color: '#6b7280', fontSize: 16, fontWeight: '700' },
  
  filterScroll: { flexDirection: 'row', paddingHorizontal: 4 },
  
  filterOption: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#3f3f3f',
  },
  
  filterOptionActive: { backgroundColor: '#d946ef20', borderColor: '#d946ef' },
  
  filterEmoji: { fontSize: 28, marginBottom: 4 },
  
  filterLabel: { color: '#f9fafb', fontSize: 10, fontWeight: '600' },
  
  mediaMenu: {
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    padding: 8,
    gap: 4,
  },
  
  mediaOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  
  mediaIcon: { fontSize: 18 },
  
  mediaLabel: { color: '#f9fafb', fontWeight: '600', fontSize: 12 },
  
  inputArea: { backgroundColor: '#111', borderTopWidth: 1, borderTopColor: '#1a1a1a', padding: 12, paddingBottom: Platform.OS === 'android' ? 24 : (Platform.OS === 'web' ? 'calc(12px + env(safe-area-inset-bottom))' : 12) },
  
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  
  mediaBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#161622',
    borderWidth: 1,
    borderColor: '#1e1e2d',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  
  mediaBtnIcon: { fontSize: 24, color: '#d946ef', fontWeight: '300' },
  
  input: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    color: '#f9fafb',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3f3f3f',
    maxHeight: 100,
    fontWeight: '500',
  },
  
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#161622',
    borderWidth: 1,
    borderColor: '#1e1e2d',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  
  sendBtnActive: {
    backgroundColor: '#1e1c0e',
  },
  
  sendIcon: { fontSize: 20, color: '#d946ef', fontWeight: '400' },
})
