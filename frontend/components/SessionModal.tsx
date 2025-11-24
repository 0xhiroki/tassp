import { useCallback, useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native'
import { Text } from '@/components/Themed'
import type { Session, Suggestion } from '@/types/api'
import { BottomSheet } from '@/components/BottomSheet'
import { formatTimeRange } from '@/lib/time'

type SessionModalProps = {
  visible: boolean
  suggestion?: Suggestion
  session?: Session
  sessionTypeName?: string
  sessionTypeCategory?: string
  onClose: () => void
  onSubmit: (description: string) => Promise<void>
  onDelete?: () => Promise<void>
  onComplete?: () => Promise<void>
}

export function SessionModal({
  visible,
  suggestion,
  session,
  sessionTypeName,
  sessionTypeCategory,
  onClose,
  onSubmit,
  onDelete,
  onComplete
}: SessionModalProps) {
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [completing, setCompleting] = useState(false)
  const isSessionFlow = Boolean(session)
  const isCompleted = Boolean(session?.completedAt)
  const isFutureSession = isSessionFlow ? new Date(session!.startTime).getTime() > Date.now() : false
  const isBusy = saving || deleting || completing
  const isReadOnlySession = isSessionFlow && isCompleted
  const disableCompleteButton = isBusy || isCompleted || isFutureSession || !onComplete
  const sessionDescriptionEmpty = isSessionFlow && description.trim().length === 0

  useEffect(() => {
    if (visible) {
      setSaving(false)
      setDeleting(false)
      if (suggestion) {
        setDescription(suggestion.description ?? '')
      } else if (session) {
        setDescription(session.description ?? '')
      } else {
        setDescription('')
      }
    }
  }, [visible, suggestion, session])

  const handleClose = useCallback(() => {
    if (!isBusy) {
      onClose()
    }
  }, [isBusy, onClose])

  const handleSave = useCallback(async () => {
    if ((!suggestion && !session) || isReadOnlySession || (session && description.trim().length === 0)) return
    try {
      setSaving(true)
      await onSubmit(description.trim())
      handleClose()
    } finally {
      setSaving(false)
    }
  }, [description, handleClose, isReadOnlySession, onSubmit, session, suggestion])

  const handleDelete = useCallback(async () => {
    if (!onDelete) return
    try {
      setDeleting(true)
      await onDelete()
      handleClose()
    } finally {
      setDeleting(false)
    }
  }, [handleClose, onDelete])

  const handleComplete = useCallback(async () => {
    if (!onComplete || !session || isCompleted) return
    try {
      setCompleting(true)
      await onComplete()
      handleClose()
    } finally {
      setCompleting(false)
    }
  }, [handleClose, isCompleted, onComplete, session])

  const scheduledTime = suggestion
    ? formatTimeRange(suggestion.startTime, suggestion.durationMinutes)
    : session
      ? formatTimeRange(session.startTime, session.durationMinutes)
      : '—'
  const sheetTitle = isSessionFlow ? 'Session details' : 'Add session context'
  const primaryButtonLabel = isSessionFlow ? 'Save changes' : 'Save & schedule'

  return (
    <BottomSheet visible={visible} onClose={handleClose} dismissDisabled={isBusy}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{sheetTitle}</Text>
        <View style={styles.section}>
          <Text style={styles.label}>Session Type</Text>
          <Text style={styles.value}>{sessionTypeName ?? 'Session'}</Text>
          {sessionTypeCategory ? <Text style={styles.meta}>{sessionTypeCategory}</Text> : null}
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>Scheduled time</Text>
          <Text style={styles.value}>{scheduledTime}</Text>
        </View>
        {suggestion ? (
          <View style={styles.section}>
            <Text style={styles.label}>Why this slot</Text>
            <Text style={styles.reason}>{suggestion.reason ?? '—'}</Text>
          </View>
        ) : null}
        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Optional notes for this session"
            multiline
            numberOfLines={4}
            style={styles.input}
            editable={!isBusy && !isReadOnlySession}
          />
        </View>
        <View style={styles.buttonRow}>
          {isSessionFlow ? (
            <Pressable
              onPress={handleComplete}
              style={[styles.primaryPill, disableCompleteButton && styles.pillDisabled]}
              disabled={disableCompleteButton}
            >
              <Text style={styles.primaryPillText}>
                {isCompleted ? 'Completed' : isFutureSession ? 'Upcoming' : completing ? 'Marking…' : 'Mark as Complete'}
              </Text>
            </Pressable>
          ) : (
            <Pressable onPress={handleSave} style={[styles.primaryPill, isBusy && styles.pillDisabled]} disabled={isBusy}>
              <Text style={styles.primaryPillText}>{saving ? 'Saving…' : primaryButtonLabel}</Text>
            </Pressable>
          )}
          <Pressable
            onPress={isSessionFlow ? handleSave : handleClose}
            style={[styles.secondaryPill, (isBusy || (isSessionFlow && (isCompleted || sessionDescriptionEmpty))) && styles.pillDisabled]}
            disabled={isBusy || (isSessionFlow && (isCompleted || sessionDescriptionEmpty))}
          >
            <Text style={styles.secondaryPillText}>{isSessionFlow ? 'Save changes' : 'Cancel'}</Text>
          </Pressable>
        </View>
        {isSessionFlow ? (
          <View style={styles.secondaryRow}>
            <Pressable onPress={handleClose} style={[styles.ghostPill, isBusy && styles.pillDisabled]} disabled={isBusy}>
              <Text style={styles.ghostPillText}>Close</Text>
            </Pressable>
            {onDelete ? (
              <Pressable
                onPress={handleDelete}
                style={[styles.dangerPill, isBusy && styles.pillDisabled]}
                disabled={isBusy}
              >
                <Text style={styles.dangerPillText}>{deleting ? 'Deleting…' : 'Delete session'}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </BottomSheet>
  )
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
    gap: 4
  },
  label: {
    fontWeight: '500',
    color: '#475569'
  },
  value: {
    fontSize: 16,
    fontWeight: '600'
  },
  meta: {
    color: '#94a3b8'
  },
  reason: {
    color: '#6b7280'
  },
  input: {
    borderWidth: 1,
    borderColor: '#d4d4d4',
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top'
  },
  buttonRow: {
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
    backgroundColor: '#fff',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#cbd5f5',
    paddingVertical: 12,
    alignItems: 'center'
  },
  secondaryPillText: {
    color: '#0f172a',
    fontWeight: '600'
  },
  pillDisabled: {
    opacity: 0.5
  },
  secondaryRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 10
  },
  ghostPill: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  ghostPillText: {
    color: '#475569',
    fontWeight: '600'
  },
  dangerPill: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  dangerPillText: {
    color: '#dc2626',
    fontWeight: '600'
  }
})
