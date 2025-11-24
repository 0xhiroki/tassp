import { apiClient } from './api-client'
import type { Metrics } from '@/types/api'

export const metricsService = {
  get: () => apiClient.get<Metrics>('/metrics')
}
