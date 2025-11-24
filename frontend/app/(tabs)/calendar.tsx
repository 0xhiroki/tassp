import { useMemo, useState } from 'react'
import { Alert, SectionList, StyleSheet, View } from 'react-native'
import { Text } from '@/components/Themed'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDataContext } from '@/contexts/data-context'
import { SessionListItem } from '@/components/SessionListItem'
import { PageHeader } from '@/components/PageHeader'
import { SessionModal } from '@/components/SessionModal'
import type { Session } from '@/types/api'

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  })
}

export default function CalendarScreen() {
  const { sessions, sessionTypes, updateSessionDescription, deleteSession, completeSession } = useDataContext()
  const [sheetSession, setSheetSession] = useState<Session | null>(null)

  const sessionTypeLookup = useMemo(() => {
    const map = new Map<string, { name: string; color: string; icon?: string; category: string }>()
    sessionTypes.forEach((type) => map.set(type.id, { name: type.name, color: type.color, icon: type.icon, category: type.category }))
    return map
  }, [sessionTypes])

  const sections = useMemo(() => {
    const grouped = sessions.reduce<Record<string, typeof sessions>>((acc, session) => {
      const key = new Date(session.startTime).toDateString()
      acc[key] = acc[key] ? [...acc[key], session] : [session]
      return acc
    }, {})

    return Object.entries(grouped)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([, items]) => ({
        title: formatDate(items[0].startTime),
        data: items.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      }))
  }, [sessions])

  const handleSaveDescription = async (notes: string) => {
    if (!sheetSession) return
    const trimmed = notes.trim()
    if (!trimmed) {
      Alert.alert('Add a description', 'Please enter some notes before saving changes.')
      return
    }
    try {
      await updateSessionDescription(sheetSession.id, trimmed)
      setSheetSession(null)
    } catch (error) {
      Alert.alert('Unable to update session', error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }

  const handleDeleteSession = async () => {
    if (!sheetSession) return
    try {
      await deleteSession(sheetSession.id)
      setSheetSession(null)
    } catch (error) {
      Alert.alert('Unable to delete session', error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }

  const handleCompleteSession = async () => {
    if (!sheetSession) return
    try {
      await completeSession(sheetSession.id)
      setSheetSession(null)
    } catch (error) {
      Alert.alert('Unable to mark session complete', error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }

  const listHeader = (
    <View>
      <PageHeader title="Calendar" description="Upcoming sessions" />
    </View>
  )

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={sections.length === 0 ? styles.emptyContainer : styles.listContent}
        renderSectionHeader={({ section }) => (
          <View style={styles.dateLabelRow}>
            <Text style={styles.dateLabelText}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <SessionListItem
            session={item}
            sessionType={sessionTypeLookup.get(item.sessionTypeId)}
            completed={Boolean(item.completedAt)}
            editable
            onPress={() => setSheetSession(item)}
          />
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No sessions scheduled yet.</Text>}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={listHeader}
        ListHeaderComponentStyle={styles.listHeader}
      />
      <SessionModal
        visible={Boolean(sheetSession)}
        session={sheetSession ?? undefined}
        sessionTypeName={sheetSession ? sessionTypeLookup.get(sheetSession.sessionTypeId)?.name : undefined}
        sessionTypeCategory={sheetSession ? sessionTypeLookup.get(sheetSession.sessionTypeId)?.category : undefined}
        onClose={() => setSheetSession(null)}
        onSubmit={handleSaveDescription}
        onDelete={handleDeleteSession}
        onComplete={handleCompleteSession}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff'
  },
  listHeader: {
    marginBottom: 16
  },
  noteText: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: -8
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 32
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 32
  },
  emptyText: {
    color: '#94a3b8'
  }
})
