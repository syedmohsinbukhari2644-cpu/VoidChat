import { Text, TextStyle, Platform } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useEffect } from 'react'

interface IconProps {
  name: string
  size?: number
  color?: string
  style?: TextStyle
  forceEmoji?: boolean
}

// Map custom icon names to MaterialIcons names
const MAPPING: Record<string, string> = {
  home: 'home',
  smart_display: 'play-circle-outline',
  camera_alt: 'photo-camera',
  inbox: 'inbox',
  bolt: 'flash-on',
  notifications: 'notifications',
  chat: 'chat',
  public: 'public',
  chat_bubble_outline: 'chat-bubble-outline',
  share: 'share',
  arrow_back: 'arrow-back',
  info: 'info',
  more_vert: 'more-vert',
  add: 'add',
  send: 'send',
  favorite: 'favorite',
  favorite_border: 'favorite-border',
  bookmark: 'bookmark',
  bookmark_border: 'bookmark-border',
  autorenew: 'autorenew',
  photo_camera: 'photo-camera',
  no_photography: 'no-photography',
  call: 'call',
  image: 'image',
  stop: 'stop',
  mic: 'mic',
  person: 'person',
  video_call: 'video-call',
  call_end: 'call-end',
  volume_up: 'volume-up',
  phone_android: 'phone-android',
  description: 'description',
  visibility: 'visibility',
  delete: 'delete',
  location_on: 'location-on',
  mic_off: 'mic-off',
  download: 'file-download',
  lock: 'lock',
  play_arrow: 'play-arrow',
  pause: 'pause',
  people: 'people',
  videocam: 'videocam',
  security: 'security',
  group_add: 'group-add',
}

const EMOJI_MAPPING: Record<string, string> = {
  home: '🏠',
  smart_display: '▶️',
  camera_alt: '📷',
  inbox: '📥',
  bolt: '⚡',
  notifications: '🔔',
  chat: '💬',
  public: '🌐',
  chat_bubble_outline: '💬',
  share: '🔗',
  arrow_back: '←',
  info: 'ℹ️',
  more_vert: '⋮',
  add: '➕',
  send: '➤',
  favorite: '❤️',
  favorite_border: '🤍',
  bookmark: '🔖',
  bookmark_border: '🏷️',
  autorenew: '🔄',
  photo_camera: '📷',
  no_photography: '🚫',
  call: '📞',
  image: '🖼️',
  stop: '⏹️',
  mic: '🎙️',
  person: '👤',
  video_call: '📹',
  call_end: '🔴',
  volume_up: '🔊',
  phone_android: '📱',
  description: '📄',
  visibility: '👁️',
  visibility_off: '🙈',
  delete: '🗑️',
  location_on: '📍',
  mic_off: '🔇',
  download: '📥',
  lock: '🔐',
  play_arrow: '▶️',
  pause: '⏸️',
  people: '👥',
  videocam: '📹',
  security: '🛡️',
  group_add: '👥',
  search: '🔍',
  settings: '⚙️'
}

export default function Icon({ name, size = 22, color = '#ffffff', style, forceEmoji }: IconProps) {
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      if (!document.getElementById('material-icons-font-style')) {
        try {
          const styleEl = document.createElement('style')
          styleEl.id = 'material-icons-font-style'
          styleEl.textContent = `
            @font-face {
              font-family: 'MaterialIcons';
              src: url('https://fonts.gstatic.com/s/materialicons/v142/flKEznqBndaAsUprWYU454adab4.woff2') format('woff2');
              font-weight: normal;
              font-style: normal;
            }
            @font-face {
              font-family: 'Material Icons';
              src: url('https://fonts.gstatic.com/s/materialicons/v142/flKEznqBndaAsUprWYU454adab4.woff2') format('woff2');
              font-weight: normal;
              font-style: normal;
            }
          `
          document.head.appendChild(styleEl)
        } catch (e) {}
      }
    }
  }, [])

  if (forceEmoji || (Platform.OS === 'web' && EMOJI_MAPPING[name])) {
    const emoji = EMOJI_MAPPING[name] || '📌'
    return (
      <Text style={[{ fontSize: size * 0.85, textAlign: 'center', lineHeight: size + 2 }, style]}>
        {emoji}
      </Text>
    )
  }

  const iconName = MAPPING[name] || name
  return (
    <MaterialIcons
      name={iconName as any}
      size={size}
      color={color}
      style={style}
    />
  )
}
