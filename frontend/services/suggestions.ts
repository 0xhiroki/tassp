import { apiClient } from './api-client'
import type { AcceptSuggestionResponse, Suggestion } from '@/types/api'

export const suggestionService = {
  list: () => apiClient.get<Suggestion[]>('/suggestions'),
  refresh: () => apiClient.post<Suggestion[]>('/suggestions', {}),
  accept: (id: string, description?: string) =>
    apiClient.post<AcceptSuggestionResponse>('/suggestions/' + id + '/accept', description ? { description } : {})
}
