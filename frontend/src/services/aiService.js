import { apiRequest } from './api/apiClient.js'

export const AI_MODE = import.meta.env.VITE_AI_MODE || 'api'
export const isAIApiMode = AI_MODE === 'api'

export async function chatWithCampusAI(message, history = [], language = 'English') {
  if (isAIApiMode) {
    try {
      return await apiRequest('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message, history, language }),
      })
    } catch (err) {
      console.warn('API chat failed, falling back to local demo:', err)
    }
  }
  return null
}

export async function improveRequestDraft({ title = '', description }) {
  if (isAIApiMode) {
    try {
      return await apiRequest('/ai/improve-request', {
        method: 'POST',
        body: JSON.stringify({ title, description }),
      })
    } catch (err) {
      console.warn('API improve failed, falling back:', err)
    }
  }
  const cleanDescription = description.trim().replace(/\s+/g, ' ')
  const inferredTitle = title.trim() || cleanDescription.split(/[.!?\n]/)[0].slice(0, 100)
  return {
    title: inferredTitle.charAt(0).toUpperCase() + inferredTitle.slice(1),
    description: cleanDescription,
    notes: 'Demo mode: basic formatting only; connect Gemini for AI rewrite.',
    missingDetails: ['Specific date or time', 'Relevant subject or department'],
    mode: 'demo',
  }
}

export async function classifyRequestDraft({ title, description }) {
  if (isAIApiMode) {
    try {
      return await apiRequest('/ai/classify-request', {
        method: 'POST',
        body: JSON.stringify({ title, description }),
      })
    } catch (err) {
      console.warn('API classify failed, falling back:', err)
    }
  }
  const text = `${title} ${description}`.toLowerCase()
  let category = 'academic'
  if (/certificate|bonafide|fee|scholarship|administration|document/.test(text)) category = 'administration'
  else if (/wifi|wi-fi|internet|portal|lms|login|password|technical|computer/.test(text)) category = 'technical'
  else if (/hostel|transport|bus|maintenance|water|electricity|cleaning|facility|campus/.test(text)) category = 'campus'
  const priority = /urgent|today|tomorrow|exam|safety|danger|blocked|deadline|cannot attend/.test(text) ? 'High' : 'Medium'
  return {
    category,
    priority,
    mode: 'demo',
    reason: 'Rule-based demo suggestion. Review before applying.',
    missingDetails: category === 'academic' ? ['Relevant subject or date'] : ['Specific location or error code'],
  }
}

export async function summarizeRequestForStaff(requestData) {
  const payload = typeof requestData === 'string' ? { requestId: requestData } : {
    requestId: requestData.id || requestData.requestCode || 'REQ-001',
    title: requestData.title,
    description: requestData.description,
    category: requestData.category,
    priority: requestData.priority,
  }

  if (isAIApiMode) {
    try {
      return await apiRequest('/ai/copilot/summarize', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    } catch (err) {
      console.warn('API copilot failed, falling back to local demo summary:', err)
    }
  }
  return {
    summary: `Request ${payload.requestId}: ${payload.title ? `Student reported "${payload.title}".` : 'Student reported an issue requiring administrative attention.'}`,
    extractedFacts: [
      `Category: ${payload.category || 'General'}`,
      `Priority: ${payload.priority || 'Medium'}`,
      'Request logged in student service portal',
    ],
    missingInformation: ['Verify student identity and verify relevant course/office records'],
    suggestedReply: `Hello, thank you for reaching out regarding "${payload.title || 'your request'}". We have logged your case and the department has initiated review. We will notify you once resolved.`,
    suggestedActions: ['Confirm details in department register', 'Update status to In progress'],
    mode: 'demo',
  }
}
