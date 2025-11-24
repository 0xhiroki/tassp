import FontAwesome from '@expo/vector-icons/FontAwesome'
import { useMemo, useState } from 'react'
import { Alert, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Text } from '@/components/Themed'
import { useDataContext } from '@/contexts/data-context'
import type { Session, Suggestion } from '@/types/api'
import { SessionModal } from '@/components/SessionModal'
import { SessionListItem } from '@/components/SessionListItem'
import { PageHeader } from '@/components/PageHeader'
import { ManualSessionSheet } from '@/components/ManualSessionSheet'
import { SuggestionCard } from '@/components/SuggestionCard'

type HomeBlock =
  | { key: 'hero'; type: 'hero' }
  | { key: string; type: 'session'; session: Session }
  | { key: string; type: 'date-label'; label: string }
  | { key: 'sessions-empty'; type: 'sessions-empty' }
  | { key: 'progress'; type: 'progress' }

type SheetState =
  | { type: 'suggestion'; suggestion: Suggestion }
  | { type: 'session'; session: Session }

function ProgressStat({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.progressStat}>
      <Text style={styles.progressStatValue}>{value}</Text>
      <Text style={styles.progressStatLabel}>{label}</Text>
    </View>
  )
}

export default function HomeScreen() {
  const {
    sessions,
    sessionTypes,
    suggestions,
    metrics,
    loading,
    refresh,
    acceptSuggestion,
    updateSessionDescription,
    completeSession,
    deleteSession,
    createSession
  } = useDataContext()

  const [refreshing, setRefreshing] = useState(false)
  const [sheetState, setSheetState] = useState<SheetState | null>(null)
  const [scheduleScope, setScheduleScope] = useState<'today' | 'week'>('today')
  const [manualVisible, setManualVisible] = useState(false)
  const { width: windowWidth } = useWindowDimensions()
  const DESIGN_SUGGESTION_CARD_WIDTH = 292
  const DESIGN_SUGGESTION_CARD_HEIGHT = 236
  const suggestionCardWidth = Math.min(DESIGN_SUGGESTION_CARD_WIDTH, windowWidth - 48)
  const suggestionCardHeight = DESIGN_SUGGESTION_CARD_HEIGHT

  const sessionTypeLookup = useMemo(() => {
    const map = new Map<string, { name: string; color: string; priority: number; icon?: string; category: string }>()
    sessionTypes.forEach((type) =>
      map.set(type.id, {
        name: type.name,
        color: type.color,
        priority: type.priority,
        icon: type.icon,
        category: type.category
      })
    )
    return map
  }, [sessionTypes])

  const filteredSessions = useMemo(() => {
    const now = new Date()
    return sessions.filter((session) => {
      const date = new Date(session.startTime)
      if (scheduleScope === 'today') {
        return isSameDay(now, date)
      }
      const startOfWeek = startOfWeekFor(now)
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(endOfWeek.getDate() + 7)
      return date >= startOfWeek && date < endOfWeek
    })
  }, [sessions, scheduleScope])

  const sortedSessions = useMemo(
    () => [...filteredSessions].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    [filteredSessions]
  )

  const scopeStats = useMemo(() => {
    if (scheduleScope === 'today') {
      const today = new Date()
      const todaysSessions = sessions.filter((session) => isSameDay(today, new Date(session.startTime)))
      const completed = todaysSessions.filter((session) => isSessionCompleted(session))
      return { total: todaysSessions.length, completed: completed.length }
    }

    const start = startOfWeekFor(new Date())
    const end = new Date(start)
    end.setDate(end.getDate() + 7)
    const weekSessions = sessions.filter((session) => {
      const date = new Date(session.startTime)
      return date >= start && date < end
    })
    const completed = weekSessions.filter((session) => isSessionCompleted(session))
    return { total: weekSessions.length, completed: completed.length }
  }, [sessions, scheduleScope])

  const scopeMetrics = useMemo(() => {
    if (!metrics) return null
    if (scheduleScope === 'today') {
      const today = new Date()
      const todaysSessions = sessions.filter((session) => isSameDay(today, new Date(session.startTime)))
      const completed = todaysSessions.filter((session) => isSessionCompleted(session))
      const completionRate = todaysSessions.length === 0 ? 0 : Math.round((completed.length / todaysSessions.length) * 100)
      const byTypeMap = new Map<string, { total: number; completed: number }>()
      todaysSessions.forEach((session) => {
        const entry = byTypeMap.get(session.sessionTypeId) ?? { total: 0, completed: 0 }
        entry.total += 1
        if (isSessionCompleted(session)) {
          entry.completed += 1
        }
        byTypeMap.set(session.sessionTypeId, entry)
      })

      return {
        scheduledCount: todaysSessions.length,
        completedCount: completed.length,
        completionRate,
        sessionTypes: Array.from(byTypeMap.entries()).map(([sessionTypeId, counts]) => ({
          sessionTypeId,
          total: counts.total,
          completed: counts.completed
        }))
      }
    }

    const start = startOfWeekFor(new Date())
    const end = new Date(start)
    end.setDate(end.getDate() + 7)
    const weekSessions = sessions.filter((session) => {
      const date = new Date(session.startTime)
      return date >= start && date < end
    })
    const completed = weekSessions.filter((session) => isSessionCompleted(session))
    const completionRate = weekSessions.length === 0 ? metrics.completionRate : Math.round((completed.length / weekSessions.length) * 100)
    const byTypeMap = new Map<string, { total: number; completed: number }>()
    weekSessions.forEach((session) => {
      const entry = byTypeMap.get(session.sessionTypeId) ?? { total: 0, completed: 0 }
      entry.total += 1
      if (isSessionCompleted(session)) {
        entry.completed += 1
      }
      byTypeMap.set(session.sessionTypeId, entry)
    })

    return {
      scheduledCount: weekSessions.length,
      completedCount: completed.length,
      completionRate,
      sessionTypes: Array.from(byTypeMap.entries()).map(([sessionTypeId, counts]) => ({
        sessionTypeId,
        total: counts.total,
        completed: counts.completed
      }))
    }
  }, [metrics, scheduleScope, sessions])

  const averageSpacingDays = useMemo(() => {
    if (sessions.length < 2) return null
    const ordered = [...sessions].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    let totalDiff = 0
    for (let i = 1; i < ordered.length; i += 1) {
      totalDiff += new Date(ordered[i].startTime).getTime() - new Date(ordered[i - 1].startTime).getTime()
    }
    const avgMs = totalDiff / (ordered.length - 1)
    const days = avgMs / (1000 * 60 * 60 * 24)
    return Math.round(days * 10) / 10
  }, [sessions])

  const onRefresh = async () => {
    setRefreshing(true)
    await refresh()
    setRefreshing(false)
  }

  const sheetSessionTypeMeta = useMemo(() => {
    if (!sheetState) return undefined
    if (sheetState.type === 'suggestion') {
      return sessionTypeLookup.get(sheetState.suggestion.sessionTypeId)
    }
    return sessionTypeLookup.get(sheetState.session.sessionTypeId)
  }, [sessionTypeLookup, sheetState])

  const handleAcceptSuggestion = async (suggestion: Suggestion) => {
    await acceptSuggestion(suggestion, suggestion.description)
  }

  const handleAdjustSuggestion = (suggestion: Suggestion) => {
    setSheetState({ type: 'suggestion', suggestion })
  }

  const handleOpenSessionSheet = (session: Session) => {
    setSheetState({ type: 'session', session })
  }

  const handleSheetSubmit = async (notes: string) => {
    if (!sheetState) return
    if (sheetState.type === 'suggestion') {
      try {
        await acceptSuggestion(sheetState.suggestion, notes)
        setSheetState((current) => {
          if (current && current.type === 'suggestion' && current.suggestion.id === sheetState.suggestion.id) {
            return null
          }
          return current
        })
      } catch (error) {
        Alert.alert('Unable to schedule session', error instanceof Error ? error.message : 'Unknown error')
        throw error
      }
    } else {
      const trimmed = notes.trim()
      if (!trimmed) {
        Alert.alert('Add a description', 'Please enter some notes before saving changes.')
        return
      }
      try {
        await updateSessionDescription(sheetState.session.id, trimmed)
        setSheetState((current) => (current && current.type === 'session' && current.session.id === sheetState.session.id ? null : current))
      } catch (error) {
        Alert.alert('Unable to update session', error instanceof Error ? error.message : 'Unknown error')
        throw error
      }
    }
  }

  const handleSheetDelete = async () => {
    if (!sheetState || sheetState.type !== 'session') return
    try {
      await deleteSession(sheetState.session.id)
      setSheetState((current) => (current && current.type === 'session' && current.session.id === sheetState.session.id ? null : current))
    } catch (error) {
      Alert.alert('Unable to delete session', error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }

  const handleSheetComplete = async () => {
    if (!sheetState || sheetState.type !== 'session') return
    try {
      await completeSession(sheetState.session.id)
      setSheetState((current) => (current && current.type === 'session' && current.session.id === sheetState.session.id ? null : current))
    } catch (error) {
      Alert.alert('Unable to mark session complete', error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }

  const handleCreateSession = async (payload: {
    sessionTypeId: string
    startTime: string
    durationMinutes: number
    description?: string
    allowConflicts?: boolean
  }) => {
    return createSession(payload)
  }

  const renderSessionCard = (session: Session) => {
    const type = sessionTypeLookup.get(session.sessionTypeId)
    const isCompleted = isSessionCompleted(session)
    return (
      <SessionListItem
        session={session}
        sessionType={type}
        completed={isCompleted}
        editable
        onPress={() => handleOpenSessionSheet(session)}
      />
    )
  }

  const listData = useMemo<HomeBlock[]>(() => {
    const blocks: HomeBlock[] = [{ key: 'hero', type: 'hero' }]
    if (sortedSessions.length === 0 && !loading) {
      blocks.push({ key: 'sessions-empty', type: 'sessions-empty' })
    } else if (scheduleScope === 'week') {
      let currentLabel: string | null = null
      sortedSessions.forEach((session) => {
        const label = formatFullDate(new Date(session.startTime))
        if (label !== currentLabel) {
          currentLabel = label
          blocks.push({ key: `label-${label}`, type: 'date-label', label })
        }
        blocks.push({ key: `session-${session.id}`, type: 'session', session })
      })
    } else {
      sortedSessions.forEach((session) => {
        blocks.push({ key: `session-${session.id}`, type: 'session', session })
      })
    }
    if (metrics) {
      blocks.push({ key: 'progress', type: 'progress' })
    }
    return blocks
  }, [sortedSessions, metrics, loading, scheduleScope])

  const renderHomeBlock = ({ item }: { item: HomeBlock }) => {
    switch (item.type) {
      case 'hero':
        return (
          <View style={styles.header}>
            <PageHeader
              title="Dashboard"
              subtitle={formatFullDate(new Date())}
              description={scheduleScope === 'today' ? 'Your schedule today' : 'Your schedule this week'}
            >
              <View style={styles.segmentedControl}>
                {(['today', 'week'] as const).map((scope) => (
                  <Pressable
                    key={scope}
                    style={[styles.segmentButton, scheduleScope === scope && styles.segmentButtonActive]}
                    onPress={() => setScheduleScope(scope)}
                  >
                    <Text style={[styles.segmentText, scheduleScope === scope && styles.segmentTextActive]}>
                      {scope === 'today' ? 'Today' : 'Week'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </PageHeader>

            <View style={styles.summaryCard}>
              <View style={styles.summaryItem}>
                <FontAwesome name="clock-o" size={14} color="#475569" />
                <Text style={styles.summaryText}>
                  {scopeStats.total} {scopeStats.total === 1 ? 'session' : 'sessions'}
                </Text>
              </View>
              <View style={styles.summaryDot} />
              <View style={styles.summaryItem}>
                <FontAwesome name="check" size={14} color="#475569" />
                <Text style={styles.summaryText}>{scopeStats.completed} done</Text>
              </View>
            </View>

            <Pressable
              style={styles.sectionHeaderRow}
              onPress={() => router.push('/suggestions')}
              accessibilityRole="button"
              accessibilityLabel="View smart suggestions"
            >
              <Text style={styles.sectionTitle}>Smart Suggestions</Text>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
            <View style={styles.suggestionsTrack}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={
                  suggestions.length === 0 ? [styles.suggestionRow, styles.suggestionRowEmpty] : styles.suggestionRow
                }
              >
                {suggestions.length === 0 ? (
                  <View style={[styles.suggestionEmpty, { width: suggestionCardWidth, height: suggestionCardHeight }] }>
                    <Text style={styles.suggestionEmptyText}>No suggestions yet. Try adding a new availability from Settings.</Text>
                  </View>
                ) : (
                  suggestions.map((suggestion) => (
                    <SuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      sessionType={sessionTypeLookup.get(suggestion.sessionTypeId)}
                      onAccept={() => handleAcceptSuggestion(suggestion)}
                      onAdjust={() => handleAdjustSuggestion(suggestion)}
                      style={{ width: suggestionCardWidth, height: suggestionCardHeight }}
                    />
                  ))
                )}
              </ScrollView>
            </View>

            <View style={styles.sessionsHeaderRow}>
              <Text style={styles.sectionTitle}>{scheduleScope === 'today' ? "Today's Sessions" : 'This Week'}</Text>
              <Pressable
                style={styles.addButton}
                onPress={() => setManualVisible(true)}
                accessibilityRole="button"
                accessibilityLabel="Add new session"
              >
                <Text style={styles.addButtonIcon}>＋</Text>
              </Pressable>
            </View>
          </View>
        )
      case 'date-label':
        return (
          <View style={styles.dateLabelRow}>
            <Text style={styles.dateLabelText}>{item.label}</Text>
          </View>
        )
      case 'session':
        return renderSessionCard(item.session)
      case 'sessions-empty':
        return (
          <View style={styles.sessionsEmptyWrapper}>
            <Text style={styles.emptyText}>No sessions scheduled.</Text>
          </View>
        )
      case 'progress':
        if (!scopeMetrics) return null
        return (
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <View style={styles.progressIconBadge}>
                <FontAwesome name="bullseye" size={16} color="#1f2937" />
              </View>
              <Text style={styles.sectionTitle}>
                {scheduleScope === 'today' ? "Today's Progress" : "This Week's Progress"}
              </Text>
            </View>
            <View style={styles.progressStatsRow}>
              <ProgressStat label="Scheduled" value={scopeMetrics.scheduledCount} />
              <ProgressStat label="Completed" value={scopeMetrics.completedCount} />
              <ProgressStat label="Rate" value={`${scopeMetrics.completionRate}%`} />
            </View>
            {scopeMetrics.sessionTypes.length > 0 && (
              <View style={styles.progressTypeBlock}>
                <Text style={styles.progressTypeHeading}>Sessions by type</Text>
                <View style={styles.progressBar}>
                  {scopeMetrics.sessionTypes.map((type) => (
                    <View
                      key={type.sessionTypeId}
                      style={{
                        flex: type.total,
                        backgroundColor: sessionTypeLookup.get(type.sessionTypeId)?.color ?? '#cbd5f5'
                      }}
                    />
                  ))}
                </View>
                <View style={styles.progressLegend}>
                  {scopeMetrics.sessionTypes.map((type) => (
                    <View key={type.sessionTypeId} style={styles.legendItem}>
                      <View
                        style={[
                          styles.legendDot,
                          { backgroundColor: sessionTypeLookup.get(type.sessionTypeId)?.color ?? '#cbd5f5' }
                        ]}
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

            {scheduleScope === 'week' && scopeMetrics.sessionTypes.length > 0 && (
              <View style={styles.spacingCard}>
                <View style={styles.spacingIconWrapper}>
                  <Text style={styles.spacingIcon}>↗︎</Text>
                </View>
                <View>
                  <Text style={styles.spacingTitle}>{formatSpacing(averageSpacingDays)}</Text>
                  <Text style={styles.spacingSubtitle}>Average spacing between sessions</Text>
                </View>
              </View>
            )}
          </View>
        )
      default:
        return null
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <FlatList
          data={listData}
          keyExtractor={(item) => item.key}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={renderHomeBlock}
        />

        <SessionModal
          visible={Boolean(sheetState)}
          suggestion={sheetState?.type === 'suggestion' ? sheetState.suggestion : undefined}
          session={sheetState?.type === 'session' ? sheetState.session : undefined}
          sessionTypeName={sheetSessionTypeMeta?.name}
          sessionTypeCategory={sheetSessionTypeMeta?.category}
          onClose={() => setSheetState(null)}
          onSubmit={handleSheetSubmit}
          onDelete={sheetState?.type === 'session' ? handleSheetDelete : undefined}
          onComplete={sheetState?.type === 'session' ? handleSheetComplete : undefined}
        />

        <ManualSessionSheet
          visible={manualVisible}
          sessionTypes={sessionTypes}
          onClose={() => setManualVisible(false)}
          onSubmit={async (payload) => {
            await handleCreateSession(payload)
            setManualVisible(false)
          }}
        />
      </View>
    </SafeAreaView>
  )
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function startOfWeekFor(date: Date) {
  const clone = new Date(date)
  const day = clone.getDay()
  clone.setHours(0, 0, 0, 0)
  clone.setDate(clone.getDate() - day)
  return clone
}

function isSessionCompleted(session: Session) {
  return Boolean(session.completedAt)
}

function formatSpacing(value: number | null) {
  if (value == null) return '—'
  if (value < 1) {
    const hours = Math.round(value * 24 * 100) / 100
    return `${hours.toFixed(2)}h`
  }
  const days = Math.round(value * 100) / 100
  return `${days.toFixed(2)}d`
}

function formatFullDate(value: Date) {
  return value.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  })
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff'
  },
  container: {
    flex: 1,
  },
  loading: {
    marginBottom: 8
  },
  listContent: {
    paddingVertical: 24,
    paddingHorizontal: 16
  },
  header: {
    marginBottom: 16
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
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    shadowColor: '#0f172a',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  summaryText: {
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '500'
  },
  summaryDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5f5'
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 8
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#000000'
  },
  sessionsHeaderRow: {
    marginTop: 24,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center'
  },
  link: {
    color: '#2563eb'
  },
  chevron: {
    fontSize: 26,
    color: '#1f2933',
    lineHeight: 28
  },
  addButton: {
    marginLeft: 'auto',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center'
  },
  addButtonIcon: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600'
  },
  dateLabelRow: {
    marginTop: 12,
    marginBottom: 6
  },
  dateLabelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569'
  },
  suggestionRow: {
    gap: 12,
    paddingRight: 16,
    paddingLeft: 16,
    alignItems: 'center',
    minHeight: 236
  },
  suggestionRowEmpty: {
    flexGrow: 1,
    justifyContent: 'center'
  },
  suggestionsTrack: {
    marginHorizontal: -16
  },
  suggestionEmpty: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center'
  },
  suggestionEmptyText: {
    color: '#94a3b8',
    textAlign: 'center'
  },
  emptyText: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 15
  },
  sessionsEmptyWrapper: {
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center'
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4
  },
  fabText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '600'
  },
  progressCard: {
    marginTop: 24,
    marginBottom: 80,
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#e0ecff',
    gap: 16
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  progressIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  progressStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  progressStat: {
    flex: 1,
    alignItems: 'center'
  },
  progressStatValue: {
    fontSize: 24,
    fontWeight: '700'
  },
  progressStatLabel: {
    color: '#475569'
  },
  progressTypeBlock: {
    gap: 12
  },
  progressTypeHeading: {
    fontSize: 14,
    color: '#475569'
  },
  progressBar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 999,
    overflow: 'hidden'
  },
  progressLegend: {
    gap: 8
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  legendLabel: {
    color: '#1e293b'
  },
  legendTextGroup: {
    flexDirection: 'column'
  },
  legendCategory: {
    color: '#94a3b8',
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
