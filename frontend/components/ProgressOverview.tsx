import FontAwesome from '@expo/vector-icons/FontAwesome'
import { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { Text } from '@/components/Themed'

type SessionTypeBreakdown = {
  sessionTypeId: string
  total: number
  completed: number
}

type Props = {
  scopeLabel: string
  scheduledCount: number
  completedCount: number
  completionRate: number
  sessionTypeLookup: Map<string, { name: string; color: string; category: string }>
  breakdown: SessionTypeBreakdown[]
  averageSpacingDays?: number | null
}

function ProgressStat({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

export function ProgressOverview({
  scopeLabel,
  scheduledCount,
  completedCount,
  completionRate,
  sessionTypeLookup,
  breakdown,
  averageSpacingDays
}: Props) {
  const spacingText = useMemo(() => {
    if (typeof averageSpacingDays !== 'number') return null
    if (averageSpacingDays < 1) {
      const hours = roundToTwo(averageSpacingDays * 24)
      return `${hours.toFixed(2)}h`
    }
    return `${roundToTwo(averageSpacingDays).toFixed(2)}d`
  }, [averageSpacingDays])

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <FontAwesome name="bullseye" size={16} color="#1f2937" />
        </View>
        <Text style={styles.title}>{scopeLabel}</Text>
      </View>
      <View style={styles.statsRow}>
        <ProgressStat label="Scheduled" value={scheduledCount} />
        <ProgressStat label="Completed" value={completedCount} />
        <ProgressStat label="Rate" value={`${completionRate}%`} />
      </View>
      {breakdown.length > 0 && (
        <View style={styles.breakdownBlock}>
          <Text style={styles.breakdownHeading}>Sessions by type</Text>
          <View style={styles.breakdownBar}>
            {breakdown.map((type) => (
              <View
                key={type.sessionTypeId}
                style={{ flex: type.total, backgroundColor: sessionTypeLookup.get(type.sessionTypeId)?.color ?? '#cbd5f5' }}
              />
            ))}
          </View>
          <View style={styles.legend}>
            {breakdown.map((type) => (
              <View key={type.sessionTypeId} style={styles.legendItem}>
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: sessionTypeLookup.get(type.sessionTypeId)?.color ?? '#cbd5f5'
                  }}
                />
                <View style={styles.legendTextGroup}>
                  <Text style={styles.legendLabel}>
                    {sessionTypeLookup.get(type.sessionTypeId)?.name ?? 'Session'} · {type.completed}/{type.total} completed
                  </Text>
                  {sessionTypeLookup.get(type.sessionTypeId)?.category ? (
                    <Text style={styles.legendCategory}>{sessionTypeLookup.get(type.sessionTypeId)?.category}</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
      {spacingText && (
        <View style={styles.spacingCard}>
          <View style={styles.spacingIconWrapper}>
            <Text style={styles.spacingIcon}>↗︎</Text>
          </View>
          <View>
            <Text style={styles.spacingTitle}>{spacingText}</Text>
            <Text style={styles.spacingSubtitle}>Average spacing between sessions</Text>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#e0ecff',
    gap: 16
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: 18,
    fontWeight: '400',
    color: '#000000'
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  stat: {
    flex: 1,
    alignItems: 'center'
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700'
  },
  statLabel: {
    color: '#475569'
  },
  breakdownBlock: {
    gap: 12
  },
  breakdownHeading: {
    fontSize: 14,
    color: '#475569'
  },
  breakdownBar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 999,
    overflow: 'hidden'
  },
  legend: {
    gap: 8
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  legendLabel: {
    color: '#1e293b'
  },
  legendTextGroup: {
    flex: 1,
    flexDirection: 'column'
  },
  legendCategory: {
    color: '#64748b',
    fontSize: 12
  },
  spacingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    gap: 12
  },
  spacingIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e0ecff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  spacingIcon: {
    color: '#1d4ed8',
    fontWeight: '700'
  },
  spacingTitle: {
    fontSize: 18,
    fontWeight: '500'
  },
  spacingSubtitle: {
    color: '#475569'
  }
})

function roundToTwo(value: number) {
  return Math.round(value * 100) / 100
}
