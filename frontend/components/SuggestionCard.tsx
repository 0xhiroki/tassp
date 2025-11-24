import FontAwesome from '@expo/vector-icons/FontAwesome'
import type { ReactNode } from 'react'
import { Pressable, StyleProp, StyleSheet, TextStyle, View, ViewStyle } from 'react-native'
import { Text } from '@/components/Themed'
import type { Suggestion } from '@/types/api'
import { PriorityDots } from '@/components/PriorityDots'
import { formatTimeRange } from '@/lib/time'

type Props = {
  suggestion: Suggestion
  sessionType?: { name: string; priority?: number }
  onAccept: () => void
  onAdjust: () => void
  style?: StyleProp<ViewStyle>
  footer?: ReactNode
}

export function SuggestionCard({ suggestion, sessionType, onAccept, onAdjust, style, footer }: Props) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{sessionType?.name ?? 'Session'}</Text>
          <PriorityDots priority={sessionType?.priority} />
        </View>
        <View style={styles.timeRow}>
          <FontAwesome name="clock-o" size={14} color="#6b7280" />
          <Text style={styles.dateLabel}>{formatSuggestionDayLabel(suggestion.startTime)}</Text>
          <Text style={styles.timeSeparator}>·</Text>
          <Text style={styles.timeLabel}>{formatTimeRange(suggestion.startTime, suggestion.durationMinutes)}</Text>
        </View>
        {suggestion.reason ? (
          <Text style={styles.reason} numberOfLines={3}>
            {suggestion.reason}
          </Text>
        ) : null}
      </View>
      {footer ?? (
        <View style={styles.buttonRow}>
          <Pressable style={styles.primaryPill} onPress={onAccept}>
            <Text style={styles.primaryPillText}>Accept</Text>
          </Pressable>
          <Pressable style={styles.secondaryPill} onPress={onAdjust}>
            <Text style={styles.secondaryPillText}>Adjust</Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}

function formatSuggestionDayLabel(startIso: string) {
  const date = new Date(startIso)
  const today = new Date()
  if (isSameDay(date, today)) {
    return 'Today'
  }
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (isSameDay(date, tomorrow)) {
    return 'Tomorrow'
  }
  return formatMonthDayWithOrdinal(date)
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function formatMonthDayWithOrdinal(date: Date) {
  const month = date.toLocaleDateString(undefined, { month: 'short' })
  const day = date.getDate()
  return `${month} ${day}${getOrdinalSuffix(day)}`
}

function getOrdinalSuffix(day: number) {
  const remainder = day % 100
  if (remainder >= 11 && remainder <= 13) {
    return 'th'
  }
  switch (day % 10) {
    case 1:
      return 'st'
    case 2:
      return 'nd'
    case 3:
      return 'rd'
    default:
      return 'th'
  }
}

const baseButton: TextStyle = {
  fontWeight: '600'
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f2eaff',
    borderRadius: 18,
    padding: 20,
    gap: 12
  },
  body: {
    gap: 10,
    flexGrow: 1
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    fontWeight: '500',
    fontSize: 18
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  dateLabel: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '400'
  },
  timeSeparator: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '500'
  },
  timeLabel: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '400'
  },
  reason: {
    color: '#6b7280',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400'
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 'auto',
    paddingTop: 8
  },
  primaryPill: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center'
  },
  primaryPillText: {
    ...baseButton,
    color: '#fff'
  },
  secondaryPill: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#cbd5f5',
    paddingVertical: 10,
    alignItems: 'center'
  },
  secondaryPillText: {
    ...baseButton,
    color: '#0f172a'
  }
})
