import { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, SafeAreaView, Alert
} from 'react-native'

export default function GroupListScreen({ onSelectGroup, onBack }) {
  const [groups, setGroups] = useState([
    {
      id: 1,
      name: '👨‍👩‍👧‍👦 Friends Group',
      members: 4,
      lastMessage: 'Haan! Sabko privacy mil sakti hai! 🔐',
      lastTime: '10:31',
      unread: 0,
      emoji: '👥'
    },
    {
      id: 2,
      name: '🎨 Creative Minds',
      members: 6,
      lastMessage: 'New design uploaded 🎨',
      lastTime: '2 hours ago',
      unread: 3,
      emoji: '🎨'
    },
    {
      id: 3,
      name: '📚 Study Buddies',
      members: 8,
      lastMessage: 'Quiz next week 📖',
      lastTime: 'Yesterday',
      unread: 0,
      emoji: '📚'
    },
  ])
  
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [groupEmoji, setGroupEmoji] = useState('👥')
  
  const groupEmojis = ['👥', '👨‍👩‍👧‍👦', '🎨', '📚', '⚽', '🎮', '🍕', '🎵', '✈️', '💼']

  const createGroup = () => {
    if (!groupName.trim()) {
      Alert.alert('⚠️ Name required', 'Group ka naam likho')
      return
    }

    const newGroup = {
      id: Date.now(),
      name: `${groupEmoji} ${groupName}`,
      members: 1,
      lastMessage: 'Group created 🎉',
      lastTime: 'now',
      unread: 0,
      emoji: groupEmoji
    }

    setGroups(prev => [newGroup, ...prev])
    setGroupName('')
    setGroupEmoji('👥')
    setShowCreateGroup(false)
    Alert.alert('✅ Created', `${groupName} group ban gaya!`)
  }

  const deleteGroup = (groupId) => {
    Alert.alert(
      '🗑️ Delete Group?',
      'Is group ko delete kar do?',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Delete',
          onPress: () => {
            setGroups(prev => prev.filter(g => g.id !== groupId))
            Alert.alert('🗑️ Deleted', 'Group delete ho gaya')
          }
        }
      ]
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Groups</Text>
        </View>
        <TouchableOpacity 
          style={styles.createBtn}
          onPress={() => setShowCreateGroup(true)}
        >
          <Text style={styles.createIcon}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <View style={styles.createOverlay}>
          <View style={styles.createModal}>
            <Text style={styles.createTitle}>➕ Create Group</Text>
            
            <Text style={styles.inputLabel}>Group Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Group ka naam likho..."
              placeholderTextColor="#6b7280"
              value={groupName}
              onChangeText={setGroupName}
            />

            <Text style={styles.inputLabel}>Choose Emoji</Text>
            <View style={styles.emojiGrid}>
              {groupEmojis.map((emoji) => (
                <TouchableOpacity 
                  key={emoji}
                  style={[
                    styles.emojiOption,
                    groupEmoji === emoji && styles.emojiOptionActive
                  ]}
                  onPress={() => setGroupEmoji(emoji)}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.createButtons}>
              <TouchableOpacity 
                style={styles.createCancelBtn}
                onPress={() => {
                  setShowCreateGroup(false)
                  setGroupName('')
                  setGroupEmoji('👥')
                }}
              >
                <Text style={styles.createCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.createAddBtn}
                onPress={createGroup}
              >
                <Text style={styles.createAddText}>➕ Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Groups List */}
      {groups.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyText}>Koi group nahi</Text>
          <Text style={styles.emptySubtext}>Pehla group banao!</Text>
          <TouchableOpacity 
            style={styles.emptyCreateBtn}
            onPress={() => setShowCreateGroup(true)}
          >
            <Text style={styles.emptyCreateText}>➕ Create Group</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.groupsList} showsVerticalScrollIndicator={false}>
          {groups.map((group) => (
            <TouchableOpacity 
              key={group.id}
              style={styles.groupItem}
              onPress={() => onSelectGroup(group)}
            >
              <View style={styles.groupAvatar}>
                <Text style={styles.groupAvatarEmoji}>{group.emoji}</Text>
              </View>

              <View style={styles.groupContent}>
                <Text style={styles.groupItemName}>{group.name}</Text>
                <Text style={styles.groupLastMsg} numberOfLines={1}>
                  {group.lastMessage}
                </Text>
              </View>

              <View style={styles.groupMeta}>
                <View style={styles.groupRight}>
                  <Text style={styles.groupTime}>{group.lastTime}</Text>
                  <Text style={styles.groupMembers}>👥 {group.members}</Text>
                </View>
                {group.unread > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{group.unread}</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity 
                style={styles.groupOptionBtn}
                onPress={() => deleteGroup(group.id)}
              >
                <Text style={styles.groupOptionIcon}>⋮</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
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
    gap: 12,
  },
  
  backIcon: { fontSize: 20, color: '#d946ef', fontWeight: '800' },
  
  title: { color: '#f9fafb', fontSize: 18, fontWeight: '700' },
  
  createBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#d946ef20',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#d946ef',
  },
  
  createIcon: { fontSize: 20, color: '#d946ef', fontWeight: '800' },
  
  createOverlay: {
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
  
  createModal: {
    backgroundColor: '#0a0a0a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1a1a1a',
    width: '85%',
    padding: 16,
    maxHeight: '80%',
  },
  
  createTitle: {
    color: '#d946ef',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  
  inputLabel: {
    color: '#d946ef',
    fontWeight: '700',
    fontSize: 12,
    marginBottom: 6,
  },
  
  input: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#1a1a1a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f9fafb',
    marginBottom: 14,
    fontWeight: '500',
  },
  
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  
  emojiOption: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#1a1a1a',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  emojiOptionActive: {
    backgroundColor: '#d946ef20',
    borderColor: '#d946ef',
  },
  
  emojiText: { fontSize: 24 },
  
  createButtons: { flexDirection: 'row', gap: 8 },
  
  createCancelBtn: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  
  createCancelText: { color: '#6b7280', fontWeight: '700', fontSize: 12 },
  
  createAddBtn: {
    flex: 1,
    backgroundColor: '#d946ef20',
    borderWidth: 1,
    borderColor: '#d946ef',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  
  createAddText: { color: '#d946ef', fontWeight: '700', fontSize: 12 },
  
  groupsList: { paddingHorizontal: 8, paddingVertical: 8 },
  
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  
  groupAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1a0a2e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#d946ef30',
  },
  
  groupAvatarEmoji: { fontSize: 24 },
  
  groupContent: { flex: 1 },
  
  groupItemName: { color: '#f9fafb', fontWeight: '700', fontSize: 13 },
  
  groupLastMsg: { color: '#6b7280', fontSize: 11, marginTop: 2 },
  
  groupMeta: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  
  groupRight: { alignItems: 'flex-end' },
  
  groupTime: { color: '#6b7280', fontSize: 10 },
  
  groupMembers: { color: '#6b7280', fontSize: 10, marginTop: 2 },
  
  unreadBadge: {
    marginTop: 4,
    backgroundColor: '#d946ef',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  unreadText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  
  groupOptionBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  groupOptionIcon: { color: '#6b7280', fontSize: 16, fontWeight: '700' },
  
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  
  emptyText: { color: '#f9fafb', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  
  emptySubtext: { color: '#6b7280', fontSize: 12, marginBottom: 20 },
  
  emptyCreateBtn: {
    backgroundColor: '#d946ef20',
    borderWidth: 1,
    borderColor: '#d946ef',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  
  emptyCreateText: { color: '#d946ef', fontWeight: '700', fontSize: 12 },
})
