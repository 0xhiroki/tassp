import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { PageHeader } from '@/components/PageHeader'
import { Text } from '@/components/Themed'
import { useDataContext } from '@/contexts/data-context'
import { ProgressOverview } from '@/components/ProgressOverview'
import { useMemo, useState } from 'react'
import type { Session } from '@/types/api'

export default function StatsScreen() {
  const { sessions, sessionTypes, refresh } = useDataContext()
  const [refreshing, setRefreshing] = useState(false)
  const [scope, setScope] = useState<'today' | 'week'>('today')

  const scopeSessions = useMemo(() => {
    const now = new Date()
    if (scope === 'today') {
      return sessions.filter((session) => isSameDay(now, new Date(session.startTime)))
    }
    const start = startOfWeekFor(now)
    const endExclusive = addDays(start, 7)
    return sessions.filter((session) => {
      const date = new Date(session.startTime)
      return date >= start && date < endExclusive
    })
  }, [scope, sessions])

  const overview = useMemo(() => {
    const completed = scopeSessions.filter((session) => Boolean(session.completedAt))
    const scheduledCount = scopeSessions.length
    const completionRate = scheduledCount === 0 ? 0 : Math.round((completed.length / scheduledCount) * 100)
    const breakdownMap = new Map<string, { total: number; completed: number }>()
    scopeSessions.forEach((session) => {
      const entry = breakdownMap.get(session.sessionTypeId) ?? { total: 0, completed: 0 }
      entry.total += 1
      if (session.completedAt) {
        entry.completed += 1
      }
      breakdownMap.set(session.sessionTypeId, entry)
    })
    const breakdown = Array.from(breakdownMap.entries()).map(([sessionTypeId, counts]) => ({
      sessionTypeId,
      total: counts.total,
      completed: counts.completed
    }))
    const avgSpacing = calculateAverageSpacingDays(scopeSessions)
    const totalFocusHours = roundToTwo(scopeSessions.reduce((sum, session) => sum + session.durationMinutes, 0) / 60)
    return {
      scheduledCount,
      completedCount: completed.length,
      completionRate,
      breakdown,
      averageSpacingDays: avgSpacing,
      focusHours: totalFocusHours
    }
  }, [scopeSessions])

  const sessionTypeLookup = useMemo(() => {
    const map = new Map<string, { name: string; color: string; category: string }>()
    sessionTypes.forEach((type) => map.set(type.id, { name: type.name, color: type.color, category: type.category }))
    return map
  }, [sessionTypes])

  const dataPoints = useMemo(() => {
    const completed = scopeSessions.filter((session) => Boolean(session.completedAt))
    return [
      {
        id: 'scheduled',
        label: scope === 'today' ? "Today's sessions" : 'This week',
        value: overview.scheduledCount
      },
      { id: 'completed', label: 'Completed', value: completed.length },
      { id: 'focus', label: 'Focus hours', value: `${overview.focusHours.toFixed(2)}h` },
      {
        id: 'spacing',
        label: 'Avg spacing',
        value: formatSpacingValue(overview.averageSpacingDays)
      }
    ]
  }, [overview, scope, scopeSessions])

  const onRefresh = async () => {
    setRefreshing(true)
    await refresh()
    setRefreshing(false)
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlatList
        data={[{ key: 'header' }, { key: 'metrics' }, { key: 'progress' }]}
        keyExtractor={(item) => item.key}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          if (item.key === 'header') {
            return (
              <PageHeader
                title="Stats"
                subtitle={new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                description="Track your momentum"
              >
                <View style={styles.segmentedControl}>
                  {(['today', 'week'] as const).map((scopeOption) => (
                    <Pressable
                      key={scopeOption}
                      style={[styles.segmentButton, scope === scopeOption && styles.segmentButtonActive]}
                      onPress={() => setScope(scopeOption)}
                    >
                      <Text style={[styles.segmentText, scope === scopeOption && styles.segmentTextActive]}>
                        {scopeOption === 'today' ? 'Today' : 'Week'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </PageHeader>
            )
          }
          if (item.key === 'metrics') {
            return (
              <View style={styles.metricsGrid}>
                {dataPoints.map((point) => (
                  <View key={point.id} style={styles.metricCard}>
                    <Text style={styles.metricLabel}>{point.label}</Text>
                    <Text style={styles.metricValue}>{point.value}</Text>
                  </View>
                ))}
              </View>
            )
          }
          return (
            <ProgressOverview
              scopeLabel={scope === 'today' ? "Today's Progress" : "This Week's Progress"}
              scheduledCount={overview.scheduledCount}
              completedCount={overview.completedCount}
              completionRate={overview.completionRate}
              sessionTypeLookup={sessionTypeLookup}
              breakdown={overview.breakdown.filter((type) => type.total > 0)}
              averageSpacingDays={overview.averageSpacingDays}
            />
          )
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff'
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 24
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  metricCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexBasis: '48%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2
  },
  metricLabel: {
    fontSize: 14,
    color: '#475569'
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 4
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    padding: 4,
    alignSelf: 'flex-start'
  },
  segmentButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16
  },
  segmentButtonActive: {
    backgroundColor: '#fff'
  },
  segmentText: {
    color: '#64748b'
  },
  segmentTextActive: {
    color: '#0f172a',
    fontWeight: '600'
  }
})

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function calculateAverageSpacingDays(currentSessions: Session[]) {
  if (currentSessions.length < 2) return null
  const ordered = [...currentSessions].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
  let totalDiff = 0
  for (let i = 1; i < ordered.length; i += 1) {
    totalDiff += new Date(ordered[i].startTime).getTime() - new Date(ordered[i - 1].startTime).getTime()
  }
  const avgMs = totalDiff / (ordered.length - 1)
  const days = avgMs / (1000 * 60 * 60 * 24)
  return roundToTwo(days)
}

function startOfDay(date: Date) {
  const clone = new Date(date)
  clone.setHours(0, 0, 0, 0)
  return clone
}

function addDays(date: Date, days: number) {
  const clone = new Date(date)
  clone.setDate(clone.getDate() + days)
  return clone
}

function startOfWeekFor(date: Date) {
  const clone = startOfDay(date)
  const day = clone.getDay()
  clone.setDate(clone.getDate() - day)
  clone.setHours(0, 0, 0, 0)
  return clone
}

function formatSpacingValue(value: number | null) {
  if (value == null) return '—'
  if (value < 1) {
    const hours = roundToTwo(value * 24)
    return `${hours.toFixed(2)}h`
  }
  return `${roundToTwo(value).toFixed(2)}d`
}

function roundToTwo(value: number) {
  return Math.round(value * 100) / 100
}
