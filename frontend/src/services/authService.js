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
      return null
    }
    return null
  },

  setSession(token, user) {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    }
    // Clean up any legacy demo keys
    localStorage.removeItem('campusassist-role')
    localStorage.removeItem('campusassist-demo-name')
    localStorage.removeItem('campusassist-demo-v1')
  },

  clearSession() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem('campusassist-role')
    localStorage.removeItem('campusassist-demo-name')
    localStorage.removeItem('campusassist-demo-v1')
  },

  async login(email, password) {
    const result = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim(), password }),
    })
    if (result?.token && result?.user) {
      this.setSession(result.token, result.user)
      return result
    }
    throw new Error('Login failed: Invalid server response.')
  },

  async register(data) {
    const result = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (result?.token && result?.user) {
      this.setSession(result.token, result.user)
      return result
    }
    throw new Error('Registration failed: Invalid server response.')
  },

  async fetchMe() {
    const token = this.getToken()
    if (!token) {
      this.clearSession()
      return null
    }
    try {
      const result = await apiRequest('/auth/me')
      if (result?.user) {
        this.setSession(null, result.user)
        return result.user
      }
      this.clearSession()
      return null
    } catch (error) {
      this.clearSession()
      throw error
    }
  },

  async updateProfile(profileData) {
    const result = await apiRequest('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(profileData),
    })
    if (result?.user) {
      this.setSession(null, result.user)
      return result.user
    }
    throw new Error('Could not update profile.')
  },

  logout() {
    this.clearSession()
  },
}

