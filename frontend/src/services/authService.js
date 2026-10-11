import { apiRequest } from './api/apiClient.js'

const TOKEN_KEY = 'campusassist-token'
const USER_KEY = 'campusassist-user'

export const authService = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY)
  },

  getCurrentUser() {
    try {
      const data = localStorage.getItem(USER_KEY)
      if (data) return JSON.parse(data)
    } catch {
      // Fallback
    }
    const role = localStorage.getItem('campusassist-role') || 'Student'
    const name = localStorage.getItem('campusassist-demo-name') || 'Abhinash Jangapally'
    return { fullName: name, role: role.toLowerCase(), email: 'abhinashjangapally@gmail.com' }
  },

  setSession(token, user) {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user))
      if (user.role) {
        const capitalRole = user.role.charAt(0).toUpperCase() + user.role.slice(1)
        localStorage.setItem('campusassist-role', capitalRole)
      }
      if (user.fullName) localStorage.setItem('campusassist-demo-name', user.fullName)
    }
  },

  clearSession() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  },

  async login(email, password) {
    try {
      const result = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      if (result?.token) {
        this.setSession(result.token, result.user)
      }
      return result
    } catch (err) {
      // Offline fallback
      const role = email.includes('admin') ? 'admin' : email.includes('staff') ? 'staff' : 'student'
      const fallbackUser = {
        fullName: email.split('@')[0] || 'Demo Student',
        email,
        role,
      }
      this.setSession('demo-token', fallbackUser)
      return { token: 'demo-token', user: fallbackUser, mode: 'demo' }
    }
  },

  async register(data) {
    try {
      const result = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      if (result?.token) {
        this.setSession(result.token, result.user)
      }
      return result
    } catch (err) {
      const fallbackUser = {
        fullName: data.fullName,
        email: data.email,
        role: data.role || 'student',
      }
      this.setSession('demo-token', fallbackUser)
      return { token: 'demo-token', user: fallbackUser, mode: 'demo' }
    }
  },

  async fetchMe() {
    try {
      const result = await apiRequest('/auth/me')
      if (result?.user) {
        this.setSession(null, result.user)
        return result.user
      }
    } catch {
      // Fallback
    }
    return this.getCurrentUser()
  },
}
