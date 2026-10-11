import { apiRequest } from './apiClient.js'

export const requestService = {
  list(params = '') { return apiRequest(`/requests${params ? `?${params}` : ''}`) },
  get(id) { return apiRequest(`/requests/${encodeURIComponent(id)}`) },
  create(payload) { return apiRequest('/requests', { method: 'POST', body: JSON.stringify(payload) }) },
  update(id, payload) { return apiRequest(`/requests/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(payload) }) },
  remove(id) { return apiRequest(`/requests/${encodeURIComponent(id)}`, { method: 'DELETE' }) },
}
