import { TextStyle } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'

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
}

export default function Icon({ name, size = 22, color = '#ffffff', style }: IconProps) {
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

