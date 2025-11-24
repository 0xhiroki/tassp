import { apiClient } from './api-client'
import type { AvailabilityWindow } from '@/types/api'

type UpsertPayload = Pick<AvailabilityWindow, 'dayOfWeek' | 'startTime' | 'endTime'>

export const availabilityService = {
  list: () => apiClient.get<AvailabilityWindow[]>('/availability'),
  replaceAll: (windows: UpsertPayload[]) => apiClient.put<{ success: boolean }>(
    '/availability',
    { windows }
  )
}
