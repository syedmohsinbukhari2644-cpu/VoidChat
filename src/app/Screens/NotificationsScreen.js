import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity
} from 'react-native'

// ─── Design Tokens ────────────────────────────────────────────
const C = {
  bg:      '#060608',
  surface: '#0e0e14',
  border:  '#1e1e2c',
  text:    '#f0f0ff',
  muted:   '#6b7280',
  primary: '#c8ff00',
}

// ─── Mock Data (English) ──────────────────────────────────────
const mockNotifs = [
  {
    id: '1', type: 'like', icon: '❤️',
    text: 'inklab_pk liked your post',
    VOID: '+2 VOID', time: '2 min', color: '#f43f5e',
  },
  {
    id: '2', type: 'follow', icon: '👤',
    text: 'fatima_art started following you',
    VOID: '', time: '15 min', color: '#6366f1',
  },
  {
    id: '3', type: 'VOID', icon: '⚡',
    text: 'Daily login bonus received!',
    VOID: '+20 VOID', time: '1 hr', color: '#c8ff00',
  },
  {
    id: '4', type: 'streak', icon: '🔥',
    text: '47 day streak with Zara!',
    VOID: '+62 VOID', time: '2 hr', color: '#fb923c',
  },
  {
    id: '5', type: 'refer', icon: '🎁',
    text: 'ali_pk joined using your referral!',
    VOID: '+500 VOID', time: '1 day', color: '#4ade80',
  },
  {
    id: '6', type: 'comment', icon: '💬',
    text: 'anonymous_soul commented on your post',
    VOID: '+5 VOID', time: '1 day', color: '#6b7280',
  },
]

export default function NotificationsScreen() {
  return (
    <View style={styles.container}>

      {/* ── Header ───────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        <TouchableOpacity style={styles.markAllBtn} activeOpacity={0.8}>
          <Text style={styles.markAllText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      {/* ── List ─────────────────────────────────────────── */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {mockNotifs.map(notif => (
          <TouchableOpacity
            key={notif.id}
            style={styles.notifItem}
            activeOpacity={0.7}
          >
            {/* Icon bubble with tinted background */}
            <View style={[
              styles.iconBubble,
              {
                backgroundColor: notif.color + '20',
                borderColor:     notif.color + '35',
              }
            ]}>
              <Text style={styles.iconEmoji}>{notif.icon}</Text>
            </View>

            {/* Text content */}
            <View style={styles.notifBody}>
              <Text style={styles.notifText}>{notif.text}</Text>
              <Text style={styles.notifTime}>{notif.time} ago</Text>
            </View>

            {/* VOID reward badge */}
            {notif.VOID ? (
              <View style={styles.voidBadge}>
                <Text style={styles.voidBadgeText}>{notif.VOID}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        ))}

        {/* Bottom spacer */}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#1a1a24',
  },
  title: { color: C.text, fontSize: 20, fontWeight: '900' },
  markAllBtn: {
    backgroundColor: C.surface, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1, borderColor: '#6366f130',
  },
  markAllText: { color: '#6366f1', fontSize: 12, fontWeight: '700' },

  // Notification row
  notifItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#0f0f18',
    gap: 14,
  },

  // Icon bubble
  iconBubble: {
    width: 50, height: 50, borderRadius: 25,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1,
  },
  iconEmoji: { fontSize: 22 },

  // Text
  notifBody: { flex: 1 },
  notifText: { color: '#e0e0f0', fontSize: 13, lineHeight: 20 },
  notifTime: { color: C.muted, fontSize: 11, marginTop: 4, fontWeight: '500' },

  // VOID badge
  voidBadge: {
    backgroundColor: '#0a1600',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 12, borderWidth: 1, borderColor: '#c8ff0035',
    shadowColor: '#c8ff00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2, shadowRadius: 6,
    elevation: 3,
  },
  voidBadgeText: { color: C.primary, fontSize: 11, fontWeight: '900' },
})