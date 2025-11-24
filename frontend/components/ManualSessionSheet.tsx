import { useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native'
import { Text } from '@/components/Themed'
import type { SessionType } from '@/types/api'
import { BottomSheet } from '@/components/BottomSheet'
import { ApiError } from '@/services/api-client'
import { SessionTypeIcon } from '@/components/SessionTypeIcon'

type ManualSessionSheetProps = {
  visible: boolean
  sessionTypes: SessionType[]
  onClose: () => void
  onSubmit: (payload: {
    sessionTypeId: string
    startTime: string
    durationMinutes: number
    description?: string
    allowConflicts?: boolean
  }) => Promise<void>
}

type ConflictSummary = {
  id: string
  startTime: string
  durationMinutes: number
  sessionTypeName: string
}

type FormErrors = Partial<Record<'sessionTypeId' | 'date' | 'time' | 'duration', string>>

export function ManualSessionSheet({ visible, sessionTypes, onClose, onSubmit }: ManualSessionSheetProps) {
  const [sessionTypeId, setSessionTypeId] = useState('')
  const [date, setDate] = useState(formatDateInput(new Date()))
  const [time, setTime] = useState(nextHourString())
  const [duration, setDuration] = useState('60')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [conflicts, setConflicts] = useState<ConflictSummary[]>([])

  useEffect(() => {
    if (visible) {
      setSessionTypeId(sessionTypes[0]?.id ?? '')
      setDate(formatDateInput(new Date()))
      setTime(nextHourString())
      setDuration('60')
      setDescription('')
      setErrors({})
      setConflicts([])
    }
  }, [visible, sessionTypes])

  const validate = () => {
    const nextErrors: FormErrors = {}
    if (!sessionTypeId) nextErrors.sessionTypeId = 'Select a session type'
    if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date)) {
      nextErrors.date = 'Enter date as YYYY-MM-DD'
    } else if (Number.isNaN(new Date(`${date}T00:00:00`).getTime())) {
      nextErrors.date = 'Invalid date'
    }
    if (!/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
      nextErrors.time = 'Use 24h time like 14:30'
    }
    const durationNumber = Number(duration)
    if (!duration || Number.isNaN(durationNumber) || durationNumber <= 0) {
      nextErrors.duration = 'Enter duration in minutes'
    }
    setErrors(nextErrors)
    return { valid: Object.keys(nextErrors).length === 0, durationNumber }
  }

  const buildStartTime = () => {
    return new Date(`${date}T${time}:00`)
  }

  const handleSubmit = async (overrideConflicts = false) => {
    const { valid, durationNumber } = validate()
    if (!valid) return
    const startDate = buildStartTime()
    if (Number.isNaN(startDate.getTime())) {
      setErrors((prev) => ({ ...prev, date: 'Invalid date/time combination' }))
      return
    }

    setSubmitting(true)
    setConflicts([])
    try {
      await onSubmit({
        sessionTypeId,
        startTime: startDate.toISOString(),
        durationMinutes: durationNumber,
        description: description.trim() || undefined,
        allowConflicts: overrideConflicts
      })
    } catch (error) {
      if (error instanceof ApiError && error.status === 409 && error.payload && typeof error.payload === 'object' && 'conflicts' in error.payload) {
        setConflicts(((error.payload as { conflicts?: ConflictSummary[] }).conflicts ?? []).map((conflict) => ({
          ...conflict,
          startTime: conflict.startTime
        })))
        return
      }
      const message = error instanceof Error ? error.message : 'Unable to create session'
      Alert.alert('Could not create session', message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} dismissDisabled={submitting} sheetHeight={420}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>New session</Text>
        <View style={styles.section}>
          <Text style={styles.label}>Session type</Text>
          <View style={styles.typeGrid}>
            {sessionTypes.map((type) => (
              <Pressable
                key={type.id}
                style={[styles.typePill, sessionTypeId === type.id && styles.typePillSelected]}
                onPress={() => setSessionTypeId(type.id)}
                disabled={submitting}
              >
                <SessionTypeIcon color={type.color} icon={type.icon} size={28} borderRadius={12} />
                <View>
                  <Text style={[styles.typeText, sessionTypeId === type.id && styles.typeTextSelected]}>{type.name}</Text>
                  {type.category ? <Text style={styles.typeCategory}>{type.category}</Text> : null}
                </View>
              </Pressable>
            ))}
          </View>
        {sessionTypes.length === 0 ? <Text style={styles.helperText}>Add a session type in Settings to schedule manually.</Text> : null}
          {errors.sessionTypeId ? <Text style={styles.errorText}>{errors.sessionTypeId}</Text> : null}
        </View>
        <View style={styles.fieldRow}>
          <View style={styles.fieldHalf}>
            <Text style={styles.label}>Date</Text>
            <TextInput
              value={date}
              onChangeText={(value) => {
                setDate(value)
                setErrors((prev) => ({ ...prev, date: undefined }))
              }}
              placeholder="YYYY-MM-DD"
              style={[styles.input, errors.date && styles.inputError]}
              editable={!submitting}
            />
            {errors.date ? <Text style={styles.errorText}>{errors.date}</Text> : null}
          </View>
          <View style={styles.fieldHalf}>
            <Text style={styles.label}>Start time</Text>
            <TextInput
              value={time}
              onChangeText={(value) => {
                setTime(value)
                setErrors((prev) => ({ ...prev, time: undefined }))
              }}
              placeholder="14:30"
              style={[styles.input, errors.time && styles.inputError]}
              editable={!submitting}
            />
            {errors.time ? <Text style={styles.errorText}>{errors.time}</Text> : null}
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>Duration (minutes)</Text>
          <TextInput
            value={duration}
            onChangeText={(value) => {
              setDuration(value)
              setErrors((prev) => ({ ...prev, duration: undefined }))
            }}
            keyboardType="numeric"
            style={[styles.input, errors.duration && styles.inputError]}
            editable={!submitting}
          />
          {errors.duration ? <Text style={styles.errorText}>{errors.duration}</Text> : null}
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Optional notes"
            multiline
            numberOfLines={4}
            style={[styles.input, styles.textarea]}
            editable={!submitting}
          />
        </View>
        {conflicts.length > 0 ? (
          <View style={styles.conflictCard}>
            <Text style={styles.conflictTitle}>Conflicts found</Text>
            {conflicts.map((conflict) => (
              <View key={conflict.id} style={styles.conflictRow}>
                <Text style={styles.conflictText}>{new Date(conflict.startTime).toLocaleString()}</Text>
                <Text style={styles.conflictSubtext}>{conflict.sessionTypeName ?? 'Session'}</Text>
              </View>
            ))}
            <Text style={styles.conflictFootnote}>You can schedule anyway to override this.</Text>
          </View>
        ) : null}
        <View style={styles.actions}>
          <Pressable style={styles.buttonSecondary} onPress={onClose} disabled={submitting}>
            <Text style={styles.buttonSecondaryText}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[styles.buttonPrimary, submitting && styles.buttonDisabled]}
            onPress={() => handleSubmit(conflicts.length > 0)}
            disabled={submitting}
          >
            <Text style={styles.buttonPrimaryText}>{submitting ? 'Scheduling…' : conflicts.length > 0 ? 'Schedule anyway' : 'Schedule session'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </BottomSheet>
  )
}

function formatDateInput(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function nextHourString() {
  const now = new Date()
  now.setMinutes(0, 0, 0)
  now.setHours(now.getHours() + 1)
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 16
  },
  title: {
    fontSize: 22,
    fontWeight: '600'
  },
  section: {
    gap: 8
  },
  label: {
    fontWeight: '500',
    color: '#475569'
  },
  helperText: {
    color: '#6b7280'
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8
  },
  typePillSelected: {
    borderColor: '#1d4ed8',
    backgroundColor: '#eff6ff'
  },
  typeText: {
    color: '#0f172a'
  },
  typeTextSelected: {
    fontWeight: '600'
  },
  typeCategory: {
    color: '#64748b',
    fontSize: 11
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 12
  },
  fieldHalf: {
    flex: 1
  },
  input: {
    borderWidth: 1,
    borderColor: '#d4d4d4',
    borderRadius: 12,
    padding: 12
  },
  textarea: {
    minHeight: 90,
    textAlignVertical: 'top'
  },
  inputError: {
    borderColor: '#ef4444'
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12
  },
  actions: {
    flexDirection: 'row',
    gap: 12
  },
  buttonPrimary: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center'
  },
  buttonPrimaryText: {
    color: '#fff',
    fontWeight: '600'
  },
  buttonSecondary: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 14,
    alignItems: 'center'
  },
  buttonSecondaryText: {
    color: '#0f172a',
    fontWeight: '500'
  },
  buttonDisabled: {
    opacity: 0.7
  },
  conflictCard: {
    borderWidth: 1,
    borderColor: '#f87171',
    borderRadius: 12,
    padding: 12,
    gap: 6
  },
  conflictTitle: {
    fontWeight: '600',
    color: '#b91c1c'
  },
  conflictRow: {
    gap: 2
  },
  conflictText: {
    color: '#0f172a'
  },
  conflictSubtext: {
    color: '#6b7280'
  },
  conflictFootnote: {
    fontSize: 12,
    color: '#b91c1c'
  }
})
