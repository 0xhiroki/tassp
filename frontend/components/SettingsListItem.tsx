import { ReactNode } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from '@/components/Themed'

type Props = {
  title: string
  subtitle?: string
  icon?: ReactNode
  action?: ReactNode
  onPress?: () => void
}

export function SettingsListItem({ title, subtitle, icon, action, onPress }: Props) {
  return (
    <Pressable style={styles.container} onPress={onPress} disabled={!onPress}>
      {icon ? <View style={styles.leading}>{icon}</View> : null}
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {action ? <View style={styles.action}>{action}</View> : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: 12
  },
  leading: {
    width: 42,
    alignItems: 'center'
  },
  body: {
    flex: 1,
    gap: 2
  },
  title: {
    fontSize: 16,
    color: '#0f172a'
  },
  subtitle: {
    color: '#64748b',
    fontSize: 13
  },
  action: {
    marginLeft: 12
  }
})
