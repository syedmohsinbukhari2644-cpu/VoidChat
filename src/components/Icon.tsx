import { Text, TextStyle, View, Platform } from 'react-native'
import { SymbolView } from 'expo-symbols'

interface IconProps {
  name: string
  size?: number
  color?: string
  style?: TextStyle
  forceEmoji?: boolean
}

// We map icon names to SymbolView names for iOS, Android, and Web
const SYMBOL_MAP: Record<string, { ios: string; android: string; web: string }> = {
  home: { ios: 'house.fill', android: 'home', web: 'home' },
  smart_display: { ios: 'play.tv.fill', android: 'play_arrow', web: 'play_arrow' },
  camera_alt: { ios: 'camera.fill', android: 'photo_camera', web: 'photo_camera' },
  inbox: { ios: 'tray.and.arrow.down.fill', android: 'inbox', web: 'inbox' },
  bolt: { ios: 'bolt.fill', android: 'bolt', web: 'bolt' },
  notifications: { ios: 'bell.fill', android: 'notifications', web: 'notifications' },
  chat: { ios: 'message.fill', android: 'chat', web: 'chat' },
  public: { ios: 'globe', android: 'public', web: 'public' },
  chat_bubble_outline: { ios: 'bubble.left', android: 'chat_bubble_outline', web: 'chat_bubble_outline' },
  share: { ios: 'square.and.arrow.up', android: 'share', web: 'share' },
  arrow_back: { ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' },
  info: { ios: 'info.circle', android: 'info', web: 'info' },
  more_vert: { ios: 'ellipsis.circle', android: 'more_vert', web: 'more_vert' },
  add: { ios: 'plus', android: 'add', web: 'add' },
  send: { ios: 'paperplane.fill', android: 'send', web: 'send' },
  favorite: { ios: 'heart.fill', android: 'favorite', web: 'favorite' },
  favorite_border: { ios: 'heart', android: 'favorite_border', web: 'favorite_border' },
  bookmark: { ios: 'bookmark.fill', android: 'bookmark', web: 'bookmark' },
  bookmark_border: { ios: 'bookmark', android: 'bookmark_border', web: 'bookmark_border' },
  autorenew: { ios: 'arrow.triangle.2.circlepath', android: 'autorenew', web: 'autorenew' },
  photo_camera: { ios: 'camera.fill', android: 'photo_camera', web: 'photo_camera' },
  no_photography: { ios: 'camera.badge.ellipsis', android: 'no_photography', web: 'no_photography' },
  call: { ios: 'phone.fill', android: 'call', web: 'call' },
  image: { ios: 'photo.fill', android: 'image', web: 'image' },
  stop: { ios: 'square.fill', android: 'stop', web: 'stop' },
  mic: { ios: 'mic.fill', android: 'mic', web: 'mic' },
  person: { ios: 'person.fill', android: 'person', web: 'person' },
  video_call: { ios: 'video.fill', android: 'video_call', web: 'video_call' },
  call_end: { ios: 'phone.down.fill', android: 'call_end', web: 'call_end' },
  volume_up: { ios: 'speaker.wave.3.fill', android: 'volume_up', web: 'volume_up' },
  phone_android: { ios: 'iphone', android: 'phone_android', web: 'phone_android' },
  description: { ios: 'doc.text.fill', android: 'description', web: 'description' },
  visibility: { ios: 'eye.fill', android: 'visibility', web: 'visibility' },
  delete: { ios: 'trash.fill', android: 'delete', web: 'delete' },
  location_on: { ios: 'mappin.and.ellipse', android: 'location_on', web: 'location_on' },
  mic_off: { ios: 'mic.slash.fill', android: 'mic_off', web: 'mic_off' },
  download: { ios: 'arrow.down.to.line', android: 'download', web: 'download' },
  lock: { ios: 'lock.fill', android: 'lock', web: 'lock' },
  play_arrow: { ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' },
  pause: { ios: 'pause.fill', android: 'pause', web: 'pause' },
  people: { ios: 'people.fill', android: 'people', web: 'people' },
  flame: { ios: 'flame.fill', android: 'local_fire_department', web: 'local_fire_department' },
  link: { ios: 'link', android: 'link', web: 'link' },
  infinity: { ios: 'infinity', android: 'all_inclusive', web: 'all_inclusive' },
  redeem: { ios: 'gift.fill', android: 'redeem', web: 'redeem' },
  money: { ios: 'dollarsign.circle.fill', android: 'attach_money', web: 'attach_money' },
  content_copy: { ios: 'doc.on.doc.fill', android: 'content_copy', web: 'content_copy' },
  check_circle: { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' },
  target: { ios: 'target', android: 'gps_fixed', web: 'gps_fixed' },
}

// Clean decent non-emoji flat symbols for web/fallback (Vector-like Unicode Glyphs)
const GLYPH_MAP: Record<string, string> = {
  home: '⌂',
  smart_display: '▶',
  camera_alt: '📷',
  inbox: '✉',
  settings: '⚙',
  lock_open: '🔓',
  bolt: '⚡',
  notifications: '🔔',
  chat: '✉',
  public: '🌐',
  chat_bubble_outline: '💬',
  share: '➦',
  arrow_back: '◀',
  info: 'ℹ',
  more_vert: '⋮',
  add: '＋',
  send: '➤',
  favorite: '♥',
  favorite_border: '♡',
  bookmark: '★',
  bookmark_border: '☆',
  autorenew: '🔄',
  photo_camera: '📷',
  no_photography: '🚫',
  security: '🛡',
  call: '📞',
  image: '🖼',
  stop: '■',
  mic: '🎤',
  person: '👤',
  storage: '💾',
  folder: '📁',
  devices: '💻',
  battery_saver: '🔋',
  language: '🌐',
  star: '★',
  payments: '🪙',
  redeem: '🎁',
  logout: '🚪',
}

const EMOJI_MAP: Record<string, string> = {
  home: '🏠',
  smart_display: '🎬',
  camera_alt: '📸',
  inbox: '📥',
  settings: '⚙️',
  lock_open: '🔓',
  bolt: '⚡',
  notifications: '🔔',
  chat: '💬',
  public: '🌐',
  chat_bubble_outline: '💬',
  share: '📤',
  arrow_back: '⬅️',
  info: 'ℹ️',
  more_vert: '⋮',
  add: '➕',
  send: '✈️',
  favorite: '❤️',
  favorite_border: '🤍',
  bookmark: '🔖',
  bookmark_border: '🏳️',
  autorenew: '🔄',
  photo_camera: '📷',
  no_photography: '🚫',
  security: '🛡️',
  call: '📞',
  image: '🖼️',
  stop: '⏹️',
  mic: '🎤',
  person: '👤',
  storage: '💾',
  folder: '📁',
  devices: '💻',
  battery_saver: '🔋',
  language: '🌐',
  star: '👑',
  payments: '🪙',
  redeem: '🎁',
  logout: '🚪',
}

/**
 * Premium expo-symbols based icon component with fallback to Emojis
 */
export default function Icon({ name, size = 22, color = '#ffffff', style, forceEmoji = false }: IconProps) {
  // If forceEmoji is true, or if we have an emoji mapping and it's not in the symbol map
  if (forceEmoji && EMOJI_MAP[name]) {
    return (
      <Text
        style={[
          {
            fontSize: size,
            lineHeight: size + 2,
            textAlign: 'center',
          },
          style,
        ]}
        selectable={false}
      >
        {EMOJI_MAP[name]}
      </Text>
    )
  }

  // Otherwise, use SymbolView for vector icons (only on Native iOS/Android since SymbolView is for expo-symbols)
  const symbolConfig = SYMBOL_MAP[name]
  if (symbolConfig && Platform.OS !== 'web') {
    const symbolName = Platform.select({
      ios: symbolConfig.ios,
      android: symbolConfig.android,
      default: symbolConfig.web,
    });
    return (
      <View style={style}>
        <SymbolView
          name={symbolName}
          size={size}
          tintColor={color}
        />
      </View>
    )
  }

  // Decent clean glyph icons fallback (Standard Unicode Vector Shapes for Web Interface)
  if (GLYPH_MAP[name] && !forceEmoji) {
    return (
      <Text
        style={[
          {
            fontSize: size,
            lineHeight: size + 2,
            textAlign: 'center',
            color: color,
            fontWeight: 'bold',
          },
          style,
        ]}
        selectable={false}
      >
        {GLYPH_MAP[name]}
      </Text>
    )
  }

  // Fallback to emoji map if available
  if (EMOJI_MAP[name]) {
    return (
      <Text
        style={[
          {
            fontSize: size,
            lineHeight: size + 2,
            textAlign: 'center',
          },
          style,
        ]}
        selectable={false}
      >
        {EMOJI_MAP[name]}
      </Text>
    )
  }

  // Fallback to name as raw text
  return (
    <Text
      style={[
        {
          fontSize: size,
          lineHeight: size + 2,
          textAlign: 'center',
          color: color,
        },
        style,
      ]}
      selectable={false}
    >
      {name}
    </Text>
  )
}

