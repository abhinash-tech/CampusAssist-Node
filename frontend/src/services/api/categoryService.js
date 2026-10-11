import { apiRequest } from './apiClient.js'

export const categoryService = {
  list() { return apiRequest('/categories') },
  create(payload) { return apiRequest('/categories', { method: 'POST', body: JSON.stringify(payload) }) },
  update(id, payload) { return apiRequest(`/categories/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(payload) }) },
  remove(id) { return apiRequest(`/categories/${encodeURIComponent(id)}`, { method: 'DELETE' }) },
}
