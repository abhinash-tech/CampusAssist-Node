import { apiRequest } from './api/apiClient.js'

export const AI_MODE = import.meta.env.VITE_AI_MODE || 'api'
export const isAIApiMode = true

export async function chatWithCampusAI(message, history = [], language = 'English') {
  return await apiRequest('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ message, history, language }),
  })
}

export async function improveRequestDraft({ title = '', description }) {
  return await apiRequest('/ai/improve-request', {
    method: 'POST',
    body: JSON.stringify({ title, description }),
  })
}

export async function classifyRequestDraft({ title, description }) {
  return await apiRequest('/ai/classify-request', {
    method: 'POST',
    body: JSON.stringify({ title, description }),
  })
}

export async function summarizeRequestForStaff(requestData) {
  const payload = typeof requestData === 'string' ? { requestId: requestData } : {
    requestId: requestData.id || requestData.requestCode || 'REQ-001',
    title: requestData.title,
    description: requestData.description,
    category: requestData.category,
    priority: requestData.priority,
  }

  return await apiRequest('/ai/copilot/summarize', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

