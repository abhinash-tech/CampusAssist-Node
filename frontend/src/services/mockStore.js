import { seedRequests, categories, knowledgeArticles, initialActivity } from '../data/mockData.js'

const DATA_MODE = import.meta.env.VITE_DATA_MODE || 'mock'
if (DATA_MODE !== 'mock') {
  throw new Error(`VITE_DATA_MODE="${DATA_MODE}" is not implemented yet. Use VITE_DATA_MODE=mock until the real API provider is integrated.`)
}

const STORE_KEY = 'campusassist-demo-v1'
const clone = (value) => JSON.parse(JSON.stringify(value))

function loadStore() {
  try {
    const saved = localStorage.getItem(STORE_KEY)
    if (saved) return JSON.parse(saved)
  } catch (error) {
    console.warn('CampusAssist demo data could not be read. Using seed data.', error)
  }
  return { requests: clone(seedRequests), categories: clone(categories), articles: clone(knowledgeArticles), activity: clone(initialActivity), nextNumber: 1049 }
}

let state = loadStore()
function persist() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)) } catch (error) { console.warn('CampusAssist could not persist demo data.', error) }
}

export const mockStore = {
  getSnapshot() { return clone(state) },
  getRequests() { return clone(state.requests) },
  getRequest(id) { return clone(state.requests.find((request) => request.id === id) || null) },
  getCategories() { return clone(state.categories) },
  getArticles() { return clone(state.articles) },
  createRequest(input) {
    const today = new Date().toISOString().slice(0, 10)
    const id = `CA-${state.nextNumber++}`
    const request = { id, ...input, status: 'Open', createdAt: today, updatedAt: today, owner: 'Abhinash Jangapally', assignee: 'Student Services', history: [{ date: new Date().toLocaleString(), title: 'Request submitted', body: 'Your request has been saved in local demo mode.' }] }
    state.requests = [request, ...state.requests]
    state.activity = [{ id: Date.now(), color: 'blue', title: request.title, detail: 'New support request created', time: 'Just now', tag: id }, ...state.activity]
    persist()
    return clone(request)
  },
  updateStatus(id, status) {
    state.requests = state.requests.map((request) => request.id === id ? { ...request, status, updatedAt: new Date().toISOString().slice(0, 10), history: [...request.history, { date: new Date().toLocaleString(), title: `Status changed to ${status}`, body: 'Status updated in local demo mode.' }] } : request)
    persist()
    return this.getRequest(id)
  },
  updateRequest(id, patch) {
    state.requests = state.requests.map((request) => request.id === id ? { ...request, ...patch, updatedAt: new Date().toISOString().slice(0, 10) } : request)
    persist()
    return this.getRequest(id)
  },
  deleteRequest(id) { state.requests = state.requests.filter((request) => request.id !== id); persist() },
  createCategory(input) { const item = { ...input, id: `category-${Date.now()}`, tone: 'blue' }; state.categories = [...state.categories, item]; persist(); return clone(item) },
  deleteCategory(id) { state.categories = state.categories.filter((item) => item.id !== id); persist() },
  createArticle(input) { const item = { ...input, id: `K-${Date.now().toString().slice(-4)}`, updated: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }), read: '3 min read' }; state.articles = [item, ...state.articles]; persist(); return clone(item) },
  deleteArticle(id) { state.articles = state.articles.filter((item) => item.id !== id); persist() },
  reset() { state = { requests: clone(seedRequests), categories: clone(categories), articles: clone(knowledgeArticles), activity: clone(initialActivity), nextNumber: 1049 }; persist(); return this.getSnapshot() },
}
