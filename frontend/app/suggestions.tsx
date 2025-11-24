import { useMemo, useState } from 'react'
import { Alert, FlatList, RefreshControl, StyleSheet, View } from 'react-native'
import { Text } from '@/components/Themed'
import { useDataContext } from '@/contexts/data-context'
import type { Suggestion } from '@/types/api'
import { SessionModal } from '@/components/SessionModal'
import { SuggestionCard } from '@/components/SuggestionCard'

export default function SuggestionsScreen() {
  const { suggestions, sessionTypes, refreshSuggestions, acceptSuggestion } = useDataContext()

  const [refreshing, setRefreshing] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [activeSuggestion, setActiveSuggestion] = useState<Suggestion | undefined>()

  const sessionTypeLookup = useMemo(() => {
    const map = new Map<string, { name: string; color: string; priority: number; icon: string; category: string }>()
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

  const handleRefresh = async () => {
    setRefreshing(true)
    await refreshSuggestions()
    setRefreshing(false)
  }

  const handleAccept = async (suggestion: Suggestion) => {
    await acceptSuggestion(suggestion, suggestion.description)
  }

  const handlePlan = (suggestion: Suggestion) => {
    setActiveSuggestion(suggestion)
    setModalVisible(true)
  }

  const handleSubmit = async (notes: string) => {
    if (!activeSuggestion) return
    try {
      await acceptSuggestion(activeSuggestion, notes)
      setModalVisible(false)
      setActiveSuggestion(undefined)
    } catch (error) {
      Alert.alert('Unable to schedule session', error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={suggestions}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        contentContainerStyle={styles.listContent}
        contentInsetAdjustmentBehavior="never"
        renderItem={({ item }) => {
          const typeInfo = sessionTypeLookup.get(item.sessionTypeId)
          return (
            <SuggestionCard
              suggestion={item}
              sessionType={typeInfo}
              onAccept={() => handleAccept(item)}
              onAdjust={() => handlePlan(item)}
            />
          )
        }}
        ListEmptyComponent={<Text style={styles.emptyText}>No smart suggestions available.</Text>}
      />

      <SessionModal
        visible={modalVisible}
        suggestion={activeSuggestion}
        sessionTypeName={activeSuggestion ? sessionTypeLookup.get(activeSuggestion.sessionTypeId)?.name : undefined}
        sessionTypeCategory={activeSuggestion ? sessionTypeLookup.get(activeSuggestion.sessionTypeId)?.category : undefined}
        onClose={() => {
          setModalVisible(false)
          setActiveSuggestion(undefined)
        }}
        onSubmit={handleSubmit}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 16
  },
  emptyText: {
    textAlign: 'center',
    color: '#94a3b8',
    marginTop: 32
  }
})
