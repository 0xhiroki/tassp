import { apiClient } from './api-client'
import type { Session } from '@/types/api'

type UpdateSessionPayload = {
  description?: string
  completedAt?: string | null
}

type CreateSessionPayload = {
  sessionTypeId: string
  startTime: string
  durationMinutes: number
  description?: string
  allowConflicts?: boolean
}

export const sessionService = {
  list: () => apiClient.get<Session[]>('/sessions'),
  create: (payload: CreateSessionPayload) => apiClient.post<Session>('/sessions', payload),
  update: (id: string, payload: UpdateSessionPayload) => apiClient.patch<Session>(`/sessions/${id}`, payload),
  remove: (id: string) => apiClient.delete<{ success: true }>(`/sessions/${id}`)
}
