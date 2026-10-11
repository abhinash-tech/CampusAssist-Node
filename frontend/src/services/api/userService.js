import { apiRequest } from './apiClient.js'

export const userService = {
  list() { return apiRequest('/users') },
  get(id) { return apiRequest(`/users/${encodeURIComponent(id)}`) },
}
