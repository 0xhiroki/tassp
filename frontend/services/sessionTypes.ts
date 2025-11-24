import { apiClient } from './api-client'
import type { SessionType } from '@/types/api'

type CreateSessionTypePayload = {
  name: string
  category: string
  color: string
  priority: number
  icon: string
}

type UpdateSessionTypePayload = Partial<CreateSessionTypePayload>

export const sessionTypeService = {
  list: () => apiClient.get<SessionType[]>('/session-types'),
  create: (payload: CreateSessionTypePayload) => apiClient.post<SessionType>('/session-types', payload),
  update: (id: string, payload: UpdateSessionTypePayload) => apiClient.patch<SessionType>(`/session-types/${id}`, payload),
  remove: (id: string) => apiClient.delete<{ success: boolean }>(`/session-types/${id}`)
}
