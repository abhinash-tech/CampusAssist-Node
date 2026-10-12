import { apiRequest } from './apiClient.js'

export const requestService = {
  list(params = '') {
    return apiRequest(`/requests${params ? `?${params}` : ''}`)
  },
  get(id) {
    return apiRequest(`/requests/${encodeURIComponent(id)}`)
  },
  create(payload) {
    return apiRequest('/requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  updateStatus(id, status, note = '') {
    return apiRequest(`/requests/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    })
  },
  addComment(id, body) {
    return apiRequest(`/requests/${encodeURIComponent(id)}/activity`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    })
  },
  remove(id) {
    return apiRequest(`/requests/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
  },
}

