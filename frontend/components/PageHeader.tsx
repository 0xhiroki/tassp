import { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { Text } from '@/components/Themed'

type PageHeaderProps = {
  title: string
  subtitle?: string
  description?: string
  children?: ReactNode
}

export function PageHeader({ title, subtitle, description, children }: PageHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {(subtitle || description || children) && (
        <View style={styles.infoRow}>
          <View style={styles.infoText}>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            {description ? <Text style={styles.description}>{description}</Text> : null}
          </View>
          {children ? <View style={styles.trailing}>{children}</View> : null}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 16
  },
  title: {
    fontSize: 24,
    fontWeight: '500',
    marginTop: 0,
    marginBottom: 4
  },
  infoRow: {
    width: '100%',
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center'
  },
  infoText: {
    flex: 1,
    gap: 4
  },
  subtitle: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '400'
  },
  description: {
    color: '#6b7280',
    fontSize: 15
  },
  trailing: {
    flexShrink: 0,
    marginLeft: 16
  }
})
