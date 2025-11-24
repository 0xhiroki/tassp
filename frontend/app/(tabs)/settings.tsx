import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/Themed'
import { useDataContext } from '@/contexts/data-context'
import { PageHeader } from '@/components/PageHeader'
import { SettingsListItem } from '@/components/SettingsListItem'
import { formatShortAvailability } from '@/lib/time'
import { SessionTypeSheet } from '@/components/SessionTypeSheet'
import { AvailabilitySheet } from '@/components/AvailabilitySheet'
import { SessionTypeIcon } from '@/components/SessionTypeIcon'

export default function SettingsScreen() {
  const { sessionTypes, addSessionType, updateSessionType, deleteSessionType, availability, replaceAvailability } = useDataContext()
  const [sessionTypeSheetState, setSessionTypeSheetState] = useState<{ mode: 'create' | 'edit'; value?: typeof sessionTypes[number] } | null>(null)
  const [availabilitySheetState, setAvailabilitySheetState] = useState<
    { mode: 'create' | 'edit'; value?: typeof availability[number] } | null
  >(null)

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <PageHeader title="Settings" description="Manage your types & availability" />

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Session Types</Text>
            <Pressable style={styles.sectionAddButton} onPress={() => setSessionTypeSheetState({ mode: 'create' })}>
              <Text style={styles.sectionAddIcon}>＋</Text>
            </Pressable>
          </View>
          <View style={styles.sectionBody}>
            {sessionTypes.length === 0 ? (
              <Text style={styles.emptyText}>No session types yet.</Text>
            ) : (
              sessionTypes.map((item) => {
                const trimmedCategory = (item.category ?? '').trim()
                const subtitleParts = [trimmedCategory || null, `Priority ${item.priority}`].filter(Boolean)
                const subtitle = subtitleParts.join(' • ')
                return (
                  <SettingsListItem
                    key={item.id}
                    title={item.name}
                    subtitle={subtitle}
                    icon={<SessionTypeIcon color={item.color} icon={item.icon} size={36} borderRadius={16} />}
                    onPress={() => setSessionTypeSheetState({ mode: 'edit', value: item })}
                  />
                )
              })
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Availability</Text>
            <Pressable style={styles.sectionAddButton} onPress={() => setAvailabilitySheetState({ mode: 'create' })}>
              <Text style={styles.sectionAddIcon}>＋</Text>
            </Pressable>
          </View>
          <View style={styles.sectionBody}>
            {availability.length === 0 ? (
              <Text style={styles.emptyText}>No availability windows yet.</Text>
            ) : (
              availability.map((item) => (
                <SettingsListItem
                  key={item.id}
                  title={formatShortAvailability(item.dayOfWeek, item.startTime, item.endTime)}
                  icon={<FontAwesome name="clock-o" size={18} color="#475569" />}
                  onPress={() => setAvailabilitySheetState({ mode: 'edit', value: item })}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>
      <SessionTypeSheet
        mode={sessionTypeSheetState?.mode ?? 'create'}
        visible={Boolean(sessionTypeSheetState)}
        initialValue={sessionTypeSheetState?.value}
        onClose={() => setSessionTypeSheetState(null)}
        onSubmit={async (payload) => {
          if (sessionTypeSheetState?.mode === 'edit' && sessionTypeSheetState.value) {
            await updateSessionType(sessionTypeSheetState.value.id, payload)
          } else {
            await addSessionType(payload)
          }
        }}
        onDelete={async (id: string) => {
          await deleteSessionType(id)
        }}
      />
      <AvailabilitySheet
        mode={availabilitySheetState?.mode ?? 'create'}
        visible={Boolean(availabilitySheetState)}
        initialValue={availabilitySheetState?.value}
        onClose={() => setAvailabilitySheetState(null)}
        onSubmit={async (payload) => {
          if (availabilitySheetState?.mode === 'edit' && payload.id) {
            const next = availability.map((window) =>
              window.id === payload.id
                ? { dayOfWeek: payload.dayOfWeek, startTime: payload.startTime, endTime: payload.endTime }
                : { dayOfWeek: window.dayOfWeek, startTime: window.startTime, endTime: window.endTime }
            )
            await replaceAvailability(next)
          } else {
            const merged = [
              ...availability.map((window) => ({ dayOfWeek: window.dayOfWeek, startTime: window.startTime, endTime: window.endTime })),
              { dayOfWeek: payload.dayOfWeek, startTime: payload.startTime, endTime: payload.endTime }
            ]
            await replaceAvailability(merged)
          }
        }}
        onDelete={async (id: string) => {
          const filtered = availability
            .filter((window) => window.id !== id)
            .map((window) => ({ dayOfWeek: window.dayOfWeek, startTime: window.startTime, endTime: window.endTime }))
          await replaceAvailability(filtered)
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
  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 16
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#000000'
  },
  sectionAddButton: {
    marginLeft: 'auto',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center'
  },
  sectionAddIcon: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 20
  },
  link: {
    color: '#2563eb'
  },
  section: {
    gap: 12
  },
  sectionBody: {
    marginTop: 8
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
    paddingVertical: 8
  }
})
