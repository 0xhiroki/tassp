import { useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native'
import { BottomSheet } from '@/components/BottomSheet'
import { Text } from '@/components/Themed'

type AvailabilitySheetProps = {
  mode: 'create' | 'edit'
  visible: boolean
  initialValue?: { id: string; dayOfWeek: number; startTime: string; endTime: string }
  onClose: () => void
  onSubmit: (payload: { id?: string; dayOfWeek: number; startTime: string; endTime: string }) => Promise<void>
  onDelete?: (id: string) => Promise<void>
}

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function AvailabilitySheet({ mode, visible, initialValue, onClose, onSubmit, onDelete }: AvailabilitySheetProps) {
  const [dayOfWeek, setDayOfWeek] = useState('1')
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('09:00')
  const [errors, setErrors] = useState<{ day?: string; startTime?: string; endTime?: string }>({})
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const editing = mode === 'edit' && Boolean(initialValue)
  const fieldsEditable = !editing && !submitting

  useEffect(() => {
    if (visible) {
      if (editing && initialValue) {
        setDayOfWeek(String(initialValue.dayOfWeek))
        setStartTime(initialValue.startTime)
        setEndTime(initialValue.endTime)
      } else {
        setDayOfWeek('1')
        setStartTime('08:00')
        setEndTime('09:00')
      }
      setErrors({})
      setSubmitting(false)
      setDeleting(false)
    }
  }, [visible, editing, initialValue])

  const validateTime = (value: string) => /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(value)

  const validate = () => {
    const nextErrors: { day?: string; startTime?: string; endTime?: string } = {}
    const day = Number(dayOfWeek)
    if (Number.isNaN(day) || day < 0 || day > 6) {
      nextErrors.day = 'Day must be between 0 (Sun) and 6 (Sat)'
    }
    if (!validateTime(startTime)) {
      nextErrors.startTime = 'Use 24h time like 08:00'
    }
    if (!validateTime(endTime)) {
      nextErrors.endTime = 'Use 24h time like 09:00'
    }
    if (!nextErrors.startTime && !nextErrors.endTime) {
      const start = timeToMinutes(startTime)
      const end = timeToMinutes(endTime)
      if (end <= start) {
        nextErrors.endTime = 'End must be after start'
      }
    }
    setErrors(nextErrors)
    return { valid: Object.keys(nextErrors).length === 0, day }
  }

  const handleSubmit = async () => {
    if (submitting) return
    const { valid, day } = validate()
    if (!valid) return
    setSubmitting(true)
    try {
      await onSubmit({ id: initialValue?.id, dayOfWeek: day, startTime, endTime })
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} dismissDisabled={submitting || deleting} sheetHeight={360}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Availability</Text>
        <View style={styles.section}>
          <Text style={styles.label}>Day of week</Text>
          <View style={styles.dayGrid}>
            {DAY_LABELS.map((label, index) => {
              const active = Number(dayOfWeek) === index
              return (
                <Pressable
                  key={label}
                  style={[styles.dayChip, active && styles.dayChipActive, editing && styles.dayChipDisabled]}
                  onPress={() => {
                    setDayOfWeek(String(index))
                    setErrors((prev) => ({ ...prev, day: undefined }))
                  }}
                  disabled={submitting || editing}
                >
                  <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>{label.slice(0, 3)}</Text>
                </Pressable>
              )
            })}
          </View>
          {errors.day ? <Text style={styles.errorText}>{errors.day}</Text> : null}
        </View>
        <View style={styles.fieldRow}>
          <View style={styles.field}>
            <Text style={styles.label}>Start time</Text>
            <TextInput
              value={startTime}
              onChangeText={(value) => {
                setStartTime(value)
                setErrors((prev) => ({ ...prev, startTime: undefined }))
              }}
              placeholder="08:00"
              style={[styles.input, errors.startTime && styles.inputError]}
              editable={fieldsEditable}
            />
            {errors.startTime ? <Text style={styles.errorText}>{errors.startTime}</Text> : null}
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>End time</Text>
            <TextInput
              value={endTime}
              onChangeText={(value) => {
                setEndTime(value)
                setErrors((prev) => ({ ...prev, endTime: undefined }))
              }}
              placeholder="09:00"
              style={[styles.input, errors.endTime && styles.inputError]}
              editable={fieldsEditable}
            />
            {errors.endTime ? <Text style={styles.errorText}>{errors.endTime}</Text> : null}
          </View>
        </View>
        <View style={styles.actions}>
          <Pressable
            style={[styles.secondaryPill, (submitting || deleting) && styles.pillDisabled]}
            onPress={onClose}
            disabled={submitting || deleting}
          >
            <Text style={styles.secondaryPillText}>Close</Text>
          </Pressable>
          {editing && initialValue && onDelete ? (
            <Pressable
              style={[styles.deletePill, (submitting || deleting) && styles.pillDisabled]}
              onPress={() => {
                if (deleting) return
                Alert.alert(
                  'Delete availability',
                  'Deleting this window will also delete every session scheduled during this weekly slot. This cannot be undone. Continue?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => {
                        setDeleting(true)
                        onDelete(initialValue.id)
                          .then(onClose)
                          .finally(() => setDeleting(false))
                      }
                    }
                  ]
                )
              }}
              disabled={submitting || deleting}
            >
              <Text style={styles.deletePillText}>{deleting ? 'Deleting…' : 'Delete availability'}</Text>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.primaryPill, (submitting || deleting) && styles.pillDisabled]}
              onPress={handleSubmit}
              disabled={submitting || deleting}
            >
              <Text style={styles.primaryPillText}>{submitting ? 'Saving…' : 'Add window'}</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </BottomSheet>
  )
}

function timeToMinutes(value: string) {
  const [hour, minute] = value.split(':').map(Number)
  return hour * 60 + minute
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
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  dayChip: {
    width: '22%',
    minWidth: 64,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center'
  },
  dayChipActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff'
  },
  dayChipText: {
    color: '#0f172a',
    fontWeight: '500'
  },
  dayChipTextActive: {
    color: '#1d4ed8'
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 12
  },
  field: {
    flex: 1,
    gap: 4
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12
  },
  inputDisabled: {
    backgroundColor: '#f1f5f9',
    color: '#94a3b8'
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
    gap: 10,
    marginTop: 8
  },
  primaryPill: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center'
  },
  primaryPillText: {
    color: '#fff',
    fontWeight: '600'
  },
  secondaryPill: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  secondaryPillText: {
    color: '#0f172a',
    fontWeight: '600'
  },
  deletePill: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#fef2f2'
  },
  deletePillText: {
    color: '#dc2626',
    fontWeight: '600'
  },
  pillDisabled: {
    opacity: 0.5
  },
  dayChipDisabled: {
    opacity: 0.6
  }
})
