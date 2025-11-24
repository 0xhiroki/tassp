export type SessionType = {
  id: string
  userId: string
  name: string
  category: string
  priority: number
  color: string
  icon: string
  completedCount: number
  createdAt: string
}

export type Session = {
  id: string
  userId: string
  sessionTypeId: string
  description: string
  startTime: string
  durationMinutes: number
  completedAt: string | null
  createdAt: string
  sessionType?: SessionType
}

export type AvailabilityWindow = {
  id: string
  userId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  createdAt: string
}

export type Suggestion = {
  id: string
  sessionTypeId: string
  startTime: string
  durationMinutes: number
  reason: string
  description: string
}

export type AcceptSuggestionResponse = {
  session: Session
  suggestions: Suggestion[]
}

export type Metrics = {
  totalSessions: number
  completedCount: number
  scheduledCount: number
  completionRate: number
  sessionTypes: Array<{
    sessionTypeId: string
    name: string
    total: number
    completed: number
  }>
}
