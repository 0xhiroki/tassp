import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { AvailabilityWindow, Metrics, Session, SessionType, Suggestion } from '@/types/api'
import { sessionTypeService } from '@/services/sessionTypes'
import { sessionService } from '@/services/sessions'
import { availabilityService } from '@/services/availability'
import { suggestionService } from '@/services/suggestions'
import { metricsService } from '@/services/metrics'
import { ApiError } from '@/services/api-client'

type DataContextValue = {
  sessionTypes: SessionType[]
  sessions: Session[]
  availability: AvailabilityWindow[]
  suggestions: Suggestion[]
  metrics: Metrics | null
  loading: boolean
  refresh: () => Promise<void>
  addSessionType: (payload: { name: string; category: string; color: string; priority: number; icon: string }) => Promise<void>
  updateSessionType: (id: string, payload: { name: string; category: string; color: string; priority: number; icon: string }) => Promise<void>
  deleteSessionType: (id: string) => Promise<void>
  replaceAvailability: (windows: { dayOfWeek: number; startTime: string; endTime: string }[]) => Promise<void>
  refreshSuggestions: () => Promise<void>
  acceptSuggestion: (suggestion: Suggestion, description?: string) => Promise<void>
  updateSessionDescription: (sessionId: string, description: string) => Promise<void>
  completeSession: (sessionId: string) => Promise<void>
  createSession: (payload: {
    sessionTypeId: string
    startTime: string
    durationMinutes: number
    description?: string
    allowConflicts?: boolean
  }) => Promise<Session>
  deleteSession: (sessionId: string) => Promise<void>
}

const DataContext = createContext<DataContextValue | undefined>(undefined)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [sessionTypes, setSessionTypes] = useState<SessionType[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [availability, setAvailability] = useState<AvailabilityWindow[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<Metrics | null>(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [typesRes, sessionsRes, availabilityRes, suggestionsRes, metricsRes] = await Promise.all([
        sessionTypeService.list(),
        sessionService.list(),
        availabilityService.list(),
        suggestionService.list(),
        metricsService.get()
      ])
      setSessionTypes(typesRes)
      setSessions(sessionsRes)
      setAvailability(availabilityRes)
      setSuggestions(suggestionsRes)
      setMetrics(metricsRes)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const addSessionType = useCallback(async (payload: { name: string; category: string; color: string; priority: number; icon: string }) => {
    const created = await sessionTypeService.create(payload)
    setSessionTypes((prev) => [created, ...prev])
  }, [])

  const updateSessionType = useCallback(async (id: string, payload: { name: string; category: string; color: string; priority: number; icon: string }) => {
    const updated = await sessionTypeService.update(id, payload)
    setSessionTypes((prev) => prev.map((type) => (type.id === id ? updated : type)))
  }, [])

  const deleteSessionType = useCallback(
    async (id: string) => {
      await sessionTypeService.remove(id)
      await loadAll()
    },
    [loadAll]
  )

  const replaceAvailability = useCallback(
    async (windows: { dayOfWeek: number; startTime: string; endTime: string }[]) => {
      await availabilityService.replaceAll(windows)
      await loadAll()
    },
    [loadAll]
  )

  const refreshSuggestions = useCallback(async () => {
    const refreshed = await suggestionService.refresh()
    setSuggestions(refreshed)
  }, [])

  const acceptSuggestion = useCallback(async (suggestion: Suggestion, description?: string) => {
    const result = await suggestionService.accept(suggestion.id, description)
    setSuggestions(result.suggestions)
    await loadAll()
  }, [loadAll])

  const updateSessionDescription = useCallback(
    async (sessionId: string, description: string) => {
      try {
        const updated = await sessionService.update(sessionId, { description })
        setSessions((prev) => prev.map((session) => (session.id === sessionId ? updated : session)))
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          await loadAll()
        }
        throw error
      }
    },
    [loadAll]
  )

  const completeSession = useCallback(
    async (sessionId: string) => {
      await sessionService.update(sessionId, { completedAt: new Date().toISOString() })
      await loadAll()
    },
    [loadAll]
  )

  const createSession = useCallback(
    async (payload: { sessionTypeId: string; startTime: string; durationMinutes: number; description?: string; allowConflicts?: boolean }) => {
      const created = await sessionService.create(payload)
      await loadAll()
      return created
    },
    [loadAll]
  )

  const deleteSession = useCallback(async (sessionId: string) => {
    await sessionService.remove(sessionId)
    await loadAll()
  }, [loadAll])

  const value = useMemo<DataContextValue>(
    () => ({
      sessionTypes,
      sessions,
      availability,
      suggestions,
      metrics,
      loading,
      refresh: loadAll,
      addSessionType,
      updateSessionType,
      deleteSessionType,
      replaceAvailability,
      refreshSuggestions,
      acceptSuggestion,
      updateSessionDescription,
      completeSession,
      createSession,
      deleteSession
    }),
    [sessionTypes, sessions, availability, suggestions, metrics, loading, loadAll, addSessionType, updateSessionType, deleteSessionType, replaceAvailability, refreshSuggestions, acceptSuggestion, updateSessionDescription, completeSession, createSession, deleteSession]
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useDataContext() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useDataContext must be used within DataProvider')
  return ctx
}
