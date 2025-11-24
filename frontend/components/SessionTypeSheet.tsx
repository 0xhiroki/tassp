import { useEffect, useMemo, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native'
import { BottomSheet } from '@/components/BottomSheet'
import { Text } from '@/components/Themed'
import { SessionTypeIcon } from '@/components/SessionTypeIcon'
import { DEFAULT_SESSION_ICON, SESSION_COLOR_CHOICES, SESSION_ICON_CHOICES } from '@/constants/sessionIcons'

type SessionTypeSheetProps = {
  mode: 'create' | 'edit'
  visible: boolean
  initialValue?: { id: string; name: string; category: string; color: string; priority: number; icon: string }
  onSubmit: (payload: { name: string; category: string; color: string; priority: number; icon: string }) => Promise<void>
  onClose: () => void
  onDelete?: (id: string) => Promise<void>
}

export function SessionTypeSheet({ mode, visible, initialValue, onClose, onSubmit, onDelete }: SessionTypeSheetProps) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(SESSION_COLOR_CHOICES[0])
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState('3')
  const [icon, setIcon] = useState(DEFAULT_SESSION_ICON)
  const [errors, setErrors] = useState<{ name?: string; category?: string; priority?: string }>({})
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const editing = mode === 'edit' && Boolean(initialValue)

  useEffect(() => {
    if (visible) {
      if (editing && initialValue) {
        setName(initialValue.name)
        setCategory(initialValue.category)
        setColor(initialValue.color)
        setPriority(String(initialValue.priority))
        setIcon(initialValue.icon)
      } else {
        setName('')
        setCategory('')
        setColor(SESSION_COLOR_CHOICES[0])
        setPriority('3')
        setIcon(DEFAULT_SESSION_ICON)
      }
      setErrors({})
      setSubmitting(false)
      setDeleting(false)
    }
  }, [visible, editing, initialValue])

  const priorityOptions = useMemo(() => ['1', '2', '3', '4', '5'], [])

  const validate = () => {
    const nextErrors: { name?: string; category?: string; priority?: string } = {}
    if (!name.trim()) nextErrors.name = 'Name is required'
    if (!category.trim()) nextErrors.category = 'Category is required'
    const priorityValue = Number(priority)
    if (Number.isNaN(priorityValue) || priorityValue < 1 || priorityValue > 5) {
      nextErrors.priority = 'Priority must be between 1 and 5'
    }
    setErrors(nextErrors)
    return { valid: Object.keys(nextErrors).length === 0, priorityValue }
  }

  const handleSubmit = async () => {
    if (submitting) return
    const { valid, priorityValue } = validate()
    if (!valid) return
    setSubmitting(true)
    try {
      await onSubmit({
        name: name.trim(),
        category: category.trim(),
        color,
        priority: priorityValue,
        icon
      })
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} dismissDisabled={submitting} sheetHeight={520}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{editing ? 'Edit session type' : 'Add session type'}</Text>
        <View style={styles.section}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            value={name}
            onChangeText={(value) => {
              setName(value)
              setErrors((prev) => ({ ...prev, name: undefined }))
            }}
            placeholder="Deep work"
            style={[styles.input, errors.name && styles.inputError]}
            editable={!submitting}
          />
          {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>Category / Tag</Text>
          <TextInput
            value={category}
            onChangeText={(value) => {
              setCategory(value)
              setErrors((prev) => ({ ...prev, category: undefined }))
            }}
            placeholder="Focus"
            style={[styles.input, errors.category && styles.inputError]}
            editable={!submitting}
          />
          {errors.category ? <Text style={styles.errorText}>{errors.category}</Text> : null}
          <Text style={styles.helperText}>Shown on lists and stats to group session types.</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>Icon</Text>
          <View style={styles.iconGrid}>
            {SESSION_ICON_CHOICES.map((choice) => (
              <Pressable
                key={choice.id}
                style={[styles.iconChoice, icon === choice.id && styles.iconChoiceSelected]}
                onPress={() => setIcon(choice.id)}
                disabled={submitting}
              >
                <SessionTypeIcon color={color} icon={choice.id} size={36} borderRadius={14} />
                <Text style={styles.iconLabel}>{choice.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>Color</Text>
          <View style={styles.colorGrid}>
            {SESSION_COLOR_CHOICES.map((choice) => (
              <Pressable key={choice} style={styles.colorPill} onPress={() => setColor(choice)} disabled={submitting}>
                <View style={[styles.colorSwatch, { backgroundColor: choice }, color === choice && styles.colorSwatchSelected]} />
              </Pressable>
            ))}
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>Priority</Text>
          <View style={styles.priorityRow}>
            {priorityOptions.map((option) => (
              <Pressable
                key={option}
                style={[styles.priorityChip, priority === option && styles.priorityChipSelected]}
                onPress={() => {
                  setPriority(option)
                  setErrors((prev) => ({ ...prev, priority: undefined }))
                }}
                disabled={submitting}
              >
                <Text style={[styles.priorityText, priority === option && styles.priorityTextSelected]}>{option}</Text>
              </Pressable>
            ))}
          </View>
          {errors.priority ? <Text style={styles.errorText}>{errors.priority}</Text> : null}
        </View>
        <View style={styles.actions}>
          <Pressable
            style={[styles.secondaryPill, (submitting || deleting) && styles.pillDisabled]}
            onPress={onClose}
            disabled={submitting || deleting}
          >
            <Text style={styles.secondaryPillText}>Close</Text>
          </Pressable>
          <Pressable
            style={[styles.primaryPill, (submitting || deleting) && styles.pillDisabled]}
            onPress={handleSubmit}
            disabled={submitting || deleting}
          >
            <Text style={styles.primaryPillText}>{submitting ? 'Saving…' : editing ? 'Save changes' : 'Create type'}</Text>
          </Pressable>
        </View>
        {editing && onDelete && initialValue ? (
          <Pressable
            style={[styles.dangerPill, (submitting || deleting) && styles.pillDisabled]}
            onPress={() => {
              if (deleting) return
              Alert.alert(
                'Delete session type',
                'Deleting this session type will permanently remove all sessions (and suggestions) linked to it. This cannot be undone. Continue?',
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
            <Text style={styles.dangerPillText}>{deleting ? 'Deleting…' : 'Delete session type'}</Text>
          </Pressable>
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
    gap: 8
  },
  label: {
    fontWeight: '500',
    color: '#475569'
  },
  helperText: {
    color: '#94a3b8',
    fontSize: 12
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12
  },
  inputError: {
    borderColor: '#ef4444'
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  iconChoice: {
    width: '30%',
    minWidth: 90,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    gap: 6
  },
  iconChoiceSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eef2ff'
  },
  iconLabel: {
    fontSize: 12,
    color: '#475569'
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  colorPill: {
    padding: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  colorSwatchSelected: {
    borderColor: '#2563eb'
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8
  },
  priorityChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center'
  },
  priorityChipSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb'
  },
  priorityText: {
    color: '#0f172a',
    fontWeight: '500'
  },
  priorityTextSelected: {
    color: '#fff'
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
  pillDisabled: {
    opacity: 0.5
  },
  dangerPill: {
    marginTop: 10,
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
