import { apiRequest } from './apiClient.js'

export const knowledgeService = {
  list() {
    return apiRequest('/knowledge')
  },
  search(query = '') {
    return apiRequest(`/knowledge/search${query ? `?q=${encodeURIComponent(query)}` : ''}`)
  },
  create(payload) {
    return apiRequest('/knowledge', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  remove(id) {
    return apiRequest(`/knowledge/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
  },
}
