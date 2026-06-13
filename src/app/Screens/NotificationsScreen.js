import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity
} from 'react-native'

const mockNotifs = [
  {
    id: '1',
    type: 'like',
    icon: '❤️',
    text: 'inklab_pk ne tumhari post like ki',
    azd: '+2 AZD',
    time: '2 min',
    color: '#ff4d4d'
  },
  {
    id: '2',
    type: 'follow',
    icon: '👤',
    text: 'fatima_art ne tumhe follow kiya',
    azd: '',
    time: '15 min',
    color: '#6366f1'
  },
  {
    id: '3',
    type: 'azd',
    icon: '⚡',
    text: 'Daily login bonus mila!',
    azd: '+20 AZD',
    time: '1 hr',
    color: '#c8ff00'
  },
  {
    id: '4',
    type: 'streak',
    icon: '🔥',
    text: 'Zara ke saath 47 din ki streak!',
    azd: '+62 AZD',
    time: '2 hr',
    color: '#ff8c00'
  },
  {
    id: '5',
    type: 'refer',
    icon: '🎁',
    text: 'Tumhare refer se ali_pk join kiya!',
    azd: '+500 AZD',
    time: '1 day',
    color: '#10b981'
  },
  {
    id: '6',
    type: 'comment',
    icon: '💬',
    text: 'anonymous_soul ne comment kiya',
    azd: '+5 AZD',
    time: '1 day',
    color: '#6b7280'
  },
]

export default function NotificationsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        <TouchableOpacity style={styles.clearBtn}>
          <Text style={styles.clearText}>Sab read karo</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        {mockNotifs.map(notif => (
          <TouchableOpacity key={notif.id} style={styles.notifItem}>
            <View style={[styles.notifIcon, { backgroundColor: notif.color + '20' }]}>
              <Text style={styles.notifEmoji}>{notif.icon}</Text>
            </View>
            <View style={styles.notifContent}>
              <Text style={styles.notifText}>{notif.text}</Text>
              <Text style={styles.notifTime}>{notif.time} ago</Text>
            </View>
            {notif.azd ? (
              <View style={styles.azdBadge}>
                <Text style={styles.azdText}>{notif.azd}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
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
  title: { color: '#f9fafb', fontSize: 18, fontWeight: '800' },
  clearBtn: { padding: 4 },
  clearText: { color: '#6366f1', fontSize: 13 },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#111',
    gap: 12,
  },
  notifIcon: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  notifEmoji: { fontSize: 20 },
  notifContent: { flex: 1 },
  notifText: { color: '#e5e7eb', fontSize: 13, lineHeight: 18 },
  notifTime: { color: '#6b7280', fontSize: 11, marginTop: 3 },
  azdBadge: {
    backgroundColor: '#1a2a00',
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#c8ff0030',
  },
  azdText: { color: '#c8ff00', fontSize: 11, fontWeight: '700' },
})