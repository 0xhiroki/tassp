import { ComponentProps } from 'react'
import { StyleSheet, View } from 'react-native'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'

type IconName = ComponentProps<typeof FontAwesome5>['name']

const ICON_MAP: Record<string, IconName> = {
  bullseye: 'bullseye',
  handshake: 'handshake',
  book: 'book',
  lightbulb: 'lightbulb',
  bolt: 'bolt',
  briefcase: 'briefcase'
}

type SessionTypeIconProps = {
  color: string
  icon?: string | null
  size?: number
  borderRadius?: number
  iconColor?: string
}

export function SessionTypeIcon({ color, icon, size = 36, borderRadius = 16, iconColor = '#0f172a' }: SessionTypeIconProps) {
  const resolvedIcon = (icon && ICON_MAP[icon]) || 'bullseye'
  const iconSize = Math.min(16, size * 0.45)
  return (
    <View style={[styles.base, { width: size, height: size, borderRadius, backgroundColor: color }]}>
      <FontAwesome5 name={resolvedIcon} size={iconSize} color={iconColor} />
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center'
  }
})
