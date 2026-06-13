import { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, SafeAreaView, StatusBar, Alert, ScrollView
} from 'react-native'
import { createPost } from './api'

export default function CreateScreen({ onClose }) {
  const [content, setContent] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [loading, setLoading] = useState(false)

  const handlePost = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Kuch likho pehle!')
      return
    }

    setLoading(true)
    try {
      const res = await createPost({ content, isAnonymous })
      Alert.alert('🎉', res.data.message)
      setContent('')
      onClose && onClose()
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Kuch masla hua!')
    }
    setLoading(false)
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.cancelBtn}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>New Post</Text>
        <TouchableOpacity
          style={[styles.postBtn, loading && styles.postBtnDisabled]}
          onPress={handlePost}
          disabled={loading}
        >
          <Text style={styles.postBtnText}>
            {loading ? 'Posting...' : 'Post +40 AZD'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <TextInput
          style={styles.input}
          placeholder="Kya soch rahe ho? Azaad ho ke likho... 🔓"
          placeholderTextColor="#4b5563"
          value={content}
          onChangeText={setContent}
          multiline
          maxLength={500}
          autoFocus
        />

        <Text style={styles.charCount}>{content.length}/500</Text>

        {/* Anonymous Toggle */}
        <TouchableOpacity
          style={[styles.anonToggle, isAnonymous && styles.anonToggleActive]}
          onPress={() => setIsAnonymous(!isAnonymous)}
        >
          <Text style={styles.anonIcon}>{isAnonymous ? '🕵️' : '👤'}</Text>
          <Text style={[styles.anonText, isAnonymous && styles.anonTextActive]}>
            {isAnonymous ? 'Anonymous Mode ON' : 'Public Post'}
          </Text>
        </TouchableOpacity>

        {/* AZD Info */}
        <View style={styles.azdInfo}>
          <Text style={styles.azdInfoTitle}>⚡ AZD Earn Karo:</Text>
          <Text style={styles.azdInfoItem}>📝 Post karo → +40 AZD</Text>
          <Text style={styles.azdInfoItem}>❤️ Like milein → +2 AZD per like</Text>
          <Text style={styles.azdInfoItem}>💬 Comment milein → +5 AZD per comment</Text>
        </View>
      </ScrollView>
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
  cancelBtn: { color: '#6b7280', fontSize: 15 },
  title: { color: '#f9fafb', fontSize: 16, fontWeight: '700' },
  postBtn: {
    backgroundColor: '#c8ff00',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postBtnDisabled: { opacity: 0.6 },
  postBtnText: { color: '#0a0a0a', fontWeight: '800', fontSize: 13 },
  content: { flex: 1, padding: 16 },
  input: {
    color: '#f9fafb', fontSize: 16,
    lineHeight: 24, minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  charCount: {
    color: '#4b5563', fontSize: 12,
    textAlign: 'right', marginBottom: 20,
  },
  anonToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    backgroundColor: '#111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginBottom: 20,
  },
  anonToggleActive: {
    backgroundColor: '#1a1a2e',
    borderColor: '#6366f1',
  },
  anonIcon: { fontSize: 20 },
  anonText: { color: '#6b7280', fontWeight: '600' },
  anonTextActive: { color: '#a5b4fc' },
  azdInfo: {
    backgroundColor: '#1a2a00',
    borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#c8ff0020',
  },
  azdInfoTitle: {
    color: '#c8ff00', fontWeight: '700',
    fontSize: 13, marginBottom: 8,
  },
  azdInfoItem: { color: '#6b7280', fontSize: 12, marginBottom: 4 },
})