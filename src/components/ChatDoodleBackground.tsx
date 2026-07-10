import { View, Text, StyleSheet, Dimensions } from 'react-native'

interface ChatDoodleBackgroundProps {
  opacity?: number
}

export default function ChatDoodleBackground({ opacity = 0.045 }: ChatDoodleBackgroundProps) {
  const { width, height } = Dimensions.get('window')
  
  // Hand-picked cute, chat and fun related emojis that look like doodles
  const emojis = [
    '💬', '❤️', '⭐', '🌐', '📞', '📸', '🖼️', '🔐', 
    '🎤', '⚡', '✈️', '🔔', '🔖', '💻', '🎁', '👥',
    '🎨', '🚀', '🐱', '🎵', '👾', '🌈', '🍕', '🎉', '💡'
  ]
  
  // Staggered grid configuration
  const itemSize = 80
  const rows = Math.ceil(height / itemSize)
  const cols = Math.ceil(width / itemSize)
  
  const doodleElements = []
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Pick emoji based on coordinates to scatter them
      const emojiIndex = (r * cols + c) % emojis.length
      const emoji = emojis[emojiIndex]
      
      // Row offset for a staggered hand-drawn pattern look
      const offsetLeft = (r % 2 === 0 ? 30 : 0)
      
      doodleElements.push(
        <Text
          key={`${r}-${c}`}
          style={[
            styles.doodleEmoji,
            {
              left: c * itemSize + offsetLeft + 20,
              top: r * itemSize + 25,
              opacity: opacity,
            }
          ]}
          selectable={false}
        >
          {emoji}
        </Text>
      )
    }
  }
  
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {doodleElements}
    </View>
  )
}

const styles = StyleSheet.create({
  doodleEmoji: {
    position: 'absolute',
    fontSize: 16,
    textAlign: 'center',
  }
})
