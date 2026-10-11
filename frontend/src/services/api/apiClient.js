const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api'
const API_BASE_URL = rawBaseUrl.replace(/\/$/, '')

/**
 * API boundary for the Node/Hono service. Network failures intentionally throw.
 * Automatically attaches Authorization header if a token is stored in localStorage.
 */
export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('campusassist-token')
  const headers = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const response = await fetch(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`, {
    ...options,
    headers,
  })

  const payload = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) {
    const message = payload?.message || `CampusAssist API request failed (${response.status} ${response.statusText})`
    throw new Error(message)
  }
  return payload
}
