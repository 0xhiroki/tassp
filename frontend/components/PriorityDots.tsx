import { StyleSheet, View } from 'react-native'

interface PriorityDotsProps {
  priority?: number | null
}

export function PriorityDots({ priority }: PriorityDotsProps) {
  const value = Math.max(0, Math.min(5, priority ?? 0))

  return (
    <View style={styles.row}>
      {Array.from({ length: 5 }).map((_, index) => {
        const filled = index < value
        return <View key={index} style={[styles.dot, filled ? styles.dotFilled : styles.dotEmpty]} />
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 4
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  dotFilled: {
    backgroundColor: '#0f172a'
  },
  dotEmpty: {
    backgroundColor: '#cbd5f5'
  }
})
