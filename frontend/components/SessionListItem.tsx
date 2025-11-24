import FontAwesome from '@expo/vector-icons/FontAwesome'
import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from '@/components/Themed'
import { SessionTypeIcon } from '@/components/SessionTypeIcon'
import type { Session } from '@/types/api'
import { formatTimeRange } from '@/lib/time'

type Props = {
  session: Session
  sessionType?: { name: string; color: string; icon?: string; category: string }
  completed?: boolean
  editable?: boolean
  onPress?: () => void
}

export function SessionListItem({ session, sessionType, completed, editable = false, onPress }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.sessionCard,
        editable && styles.sessionCardInteractive,
        editable && pressed && styles.sessionCardPressed
      ]}
      disabled={!editable || !onPress}
      onPress={onPress}
    >
      <View style={styles.sessionIconWrapper}>
        <SessionTypeIcon color={sessionType?.color ?? '#dbeafe'} icon={sessionType?.icon} size={36} borderRadius={16} />
      </View>
      <View style={styles.sessionBody}>
        <Text style={styles.sessionTitle}>{sessionType?.name ?? 'Session'}</Text>
        {sessionType?.category ? <Text style={styles.sessionCategory}>{sessionType.category}</Text> : null}
        <View style={styles.sessionMetaRow}>
          <FontAwesome name="clock-o" size={14} color="#6b7280" style={styles.sessionMetaIcon} />
          <Text style={styles.sessionMeta}>{formatTimeRange(session.startTime, session.durationMinutes)}</Text>
        </View>
        {session.description ? <Text style={styles.sessionNote}>{session.description}</Text> : null}
      </View>
      {completed ? (
        <View style={styles.sessionStatusBadge} accessibilityRole="image" accessibilityLabel="Session completed">
          <FontAwesome name="check" size={12} color="#fff" />
        </View>
      ) : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2
  },
  sessionCardInteractive: {
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  sessionCardPressed: {
    backgroundColor: '#f8fafc'
  },
  sessionIconWrapper: {
    marginRight: 12
  },
  sessionBody: {
    flex: 1
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#000000'
  },
  sessionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4
  },
  sessionCategory: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 2
  },
  sessionMetaIcon: {
    marginTop: 1
  },
  sessionMeta: {
    color: '#6b7280'
  },
  sessionNote: {
    marginTop: 4,
    color: '#6b7280'
  },
  sessionStatusBadge: {
    marginLeft: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center'
  }
})
